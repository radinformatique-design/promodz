import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  getCurrentAppProfile,
  assignedChantierIds,
  hasAnyRole,
  hasPermission,
  isCompanyAdmin,
} from '@/lib/auth/current-app-profile';

export const dynamic = 'force-dynamic';

const isCentralFinance = (profile: { type: string; role: { code: string } }) =>
  profile.type === 'CENTRAL' &&
  (isCompanyAdmin(profile as any) || hasAnyRole(profile as any, ['RESPONSABLE_COMPTABILITE']));

const can = (
  profile: Parameters<typeof hasPermission>[0] & { type: string; role: { code: string } },
  action: string
) => isCompanyAdmin(profile as any) || hasPermission(profile, 'CAISSE', action);

async function visibleChantierIds(profile: {
  type: string;
  entreprise_id: string;
  affectations: Array<{ chantier_id: string }>;
}) {
  if (profile.type === 'CHANTIER') return assignedChantierIds(profile);
  const rows = await prisma.chantier.findMany({
    where: { entreprise_id: profile.entreprise_id },
    select: { id: true },
  });
  return rows.map((row) => row.id);
}

async function balanceFor(caisseId: string, tx: any) {
  const [credits, debits] = await Promise.all([
    tx.mouvementCaisse.aggregate({
      where: { caisse_id: caisseId, type: { in: ['APPROVISIONNEMENT', 'AJUSTEMENT'] } },
      _sum: { montant: true },
    }),
    tx.mouvementCaisse.aggregate({
      where: { caisse_id: caisseId, type: 'SORTIE' },
      _sum: { montant: true },
    }),
  ]);
  return Number(credits._sum.montant || 0) - Number(debits._sum.montant || 0);
}

export async function GET() {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  const central = isCentralFinance(current.profile);
  if (!central && !can(current.profile as any, 'CONSULTER')) {
    return NextResponse.json({ error: 'Permission CAISSE / CONSULTER requise.' }, { status: 403 });
  }

  const ids = await visibleChantierIds(current.profile);
  const rows = await prisma.demandeCaisse.findMany({
    where: {
      caisse: {
        chantier_id: { in: ids },
        chantier: { entreprise_id: current.profile.entreprise_id },
      },
    },
    include: {
      caisse: { include: { chantier: { select: { id: true, code_chantier: true, nom_projet: true } } } },
      demandeur: { select: { id: true, nom: true, prenom: true, poste: true } },
      traiteur: { select: { id: true, nom: true, prenom: true } },
    },
    orderBy: { created_at: 'desc' },
  });
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!can(current.profile as any, 'DEMANDER')) {
    return NextResponse.json({ error: 'Permission CAISSE / DEMANDER requise.' }, { status: 403 });
  }

  const body = await request.json();
  const chantierId = String(body?.chantier_id || '');
  const montant = Number(body?.montant);
  const motif = String(body?.motif || '').trim();
  if (!chantierId || !Number.isFinite(montant) || montant <= 0 || !motif) {
    return NextResponse.json({ error: 'Chantier, montant positif et motif obligatoires.' }, { status: 400 });
  }
  const ids = await visibleChantierIds(current.profile);
  if (!ids.includes(chantierId)) return NextResponse.json({ error: 'Chantier non affecté ou hors périmètre.' }, { status: 403 });

  const caisse = await prisma.caisseChantier.findFirst({
    where: { chantier_id: chantierId, actif: true, chantier: { entreprise_id: current.profile.entreprise_id } },
    include: { chantier: { select: { nom_projet: true } } },
  });
  if (!caisse) return NextResponse.json({ error: 'Aucune caisse configurée pour ce chantier.' }, { status: 404 });

  try {
    const created = await prisma.$transaction(async (tx) => {
      const row = await tx.demandeCaisse.create({
        data: { caisse_id: caisse.id, demandeur_id: current.profile.id, montant, motif },
      });
      const centralUsers = await tx.utilisateur.findMany({
        where: {
          entreprise_id: current.profile.entreprise_id,
          statut: 'ACTIF',
          type: 'CENTRAL',
          role: { code: { in: ['ADMINISTRATEUR', 'RESPONSABLE_COMPTABILITE'] } },
        },
        select: { id: true },
      });
      if (centralUsers.length) {
        await tx.notification.createMany({
          data: centralUsers.map((user) => ({
            destinataire_id: user.id,
            titre: 'Demande de réapprovisionnement',
            message: `Demande de ${montant.toLocaleString('fr-FR')} DZD — ${caisse.chantier.nom_projet}`,
            type: 'VALIDATION_REQUISE',
            module: 'CAISSE',
            lien: `/caisse?demande=${row.id}`,
          })),
        });
      }
      return row;
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('[caisse/demandes POST]', error);
    return NextResponse.json({ error: 'Création de la demande impossible.' }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!isCentralFinance(current.profile) || !can(current.profile as any, 'TRAITER_DEMANDE')) {
    return NextResponse.json({ error: 'Droits de traitement réservés au siège / comptabilité.' }, { status: 403 });
  }

  const body = await request.json();
  const id = String(body?.id || '');
  const decision = String(body?.decision || '');
  const comment = String(body?.commentaire || '').trim();
  if (!id || !['APPROUVEE', 'REFUSEE'].includes(decision)) {
    return NextResponse.json({ error: 'Identifiant et décision APPPROUVEE/REFUSEE obligatoires.' }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM comptabilite_demandes_caisse WHERE id = ${id} FOR UPDATE`;
      const requestRow = await tx.demandeCaisse.findFirst({
        where: {
          id,
          statut: 'EN_ATTENTE',
          caisse: { chantier: { entreprise_id: current.profile.entreprise_id } },
        },
        include: { caisse: true },
      });
      if (!requestRow) throw new Error('Demande introuvable ou déjà traitée.');

      let movementId: string | null = null;
      if (decision === 'APPROUVEE') {
        await tx.$queryRaw`SELECT id FROM comptabilite_caisses_chantier WHERE id = ${requestRow.caisse_id} FOR UPDATE`;
        const balance = await balanceFor(requestRow.caisse_id, tx);
        if (balance + Number(requestRow.montant) > Number(requestRow.caisse.plafond)) {
          throw new Error('L’approvisionnement dépasserait le plafond de la caisse. Le siège doit augmenter le plafond ou réduire le montant.');
        }
        const movement = await tx.mouvementCaisse.create({
          data: {
            caisse_id: requestRow.caisse_id,
            type: 'APPROVISIONNEMENT',
            montant: requestRow.montant,
            motif: `Réapprovisionnement approuvé — ${requestRow.motif}`,
            reference: requestRow.id,
            auteur_id: current.profile.id,
            validateur_id: current.profile.id,
          },
        });
        movementId = movement.id;
      }

      const updated = await tx.demandeCaisse.update({
        where: { id },
        data: {
          statut: decision,
          traiteur_id: current.profile.id,
          commentaire_traitement: comment || null,
          traite_at: new Date(),
          mouvement_id: movementId,
        },
      });
      await tx.notification.create({
        data: {
          destinataire_id: requestRow.demandeur_id,
          titre: decision === 'APPROUVEE' ? 'Demande de caisse approuvée' : 'Demande de caisse refusée',
          message: comment || (decision === 'APPROUVEE' ? 'Votre demande a été approuvée.' : 'Votre demande a été refusée.'),
          type: decision === 'APPROUVEE' ? 'INFO' : 'AVERTISSEMENT',
          module: 'CAISSE',
          lien: `/caisse?demande=${id}`,
        },
      });
      return updated;
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('[caisse/demandes PATCH]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Traitement impossible.' }, { status: 400 });
  }
}
