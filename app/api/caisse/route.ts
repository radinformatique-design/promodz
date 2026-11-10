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

async function getVisibleChantierIds(profile: {
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

type CaisseBalanceDb = Pick<typeof prisma, 'mouvementCaisse'>;\n\nasync function getBalance(caisseId: string, db: CaisseBalanceDb = prisma) {
  const [credits, debits] = await Promise.all([
    db.mouvementCaisse.aggregate({
      where: { caisse_id: caisseId, type: { in: ['APPROVISIONNEMENT', 'AJUSTEMENT'] } },
      _sum: { montant: true },
    }),
    db.mouvementCaisse.aggregate({
      where: { caisse_id: caisseId, type: 'SORTIE' },
      _sum: { montant: true },
    }),
  ]);
  return Number(credits._sum.montant || 0) - Number(debits._sum.montant || 0);
}

export async function GET() {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!isCentralFinance(current.profile) && !can(current.profile as any, 'CONSULTER')) {
    return NextResponse.json({ error: 'Permission CAISSE / CONSULTER requise.' }, { status: 403 });
  }

  const chantierIds = await getVisibleChantierIds(current.profile);
  const caisses = await prisma.caisseChantier.findMany({
    where: { chantier_id: { in: chantierIds }, chantier: { entreprise_id: current.profile.entreprise_id } },
    include: {
      chantier: { select: { id: true, code_chantier: true, nom_projet: true, wilaya: true, commune: true } },
      mouvements: { orderBy: { created_at: 'desc' }, take: 50, include: { auteur: { select: { id: true, nom: true, prenom: true } } } },
      demandes: { orderBy: { created_at: 'desc' }, take: 30, include: { demandeur: { select: { id: true, nom: true, prenom: true } } } },
    },
    orderBy: { created_at: 'desc' },
  });

  const result = await Promise.all(caisses.map(async (caisse) => ({
    ...caisse,
    solde: await getBalance(caisse.id),
  })));
  return NextResponse.json(result);
}

// Le siège central définit le plafond de chaque caisse. Le solde ne peut pas
// dépasser ce plafond et un plafond ne peut pas être abaissé sous le solde actuel.
export async function PUT(request: Request) {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!isCentralFinance(current.profile) || !can(current.profile as any, 'GERER_PLAFOND')) {
    return NextResponse.json({ error: 'Droits de gestion des plafonds réservés au siège / comptabilité.' }, { status: 403 });
  }

  const body = await request.json();
  const chantierId = String(body?.chantier_id || '');
  const plafond = Number(body?.plafond);
  if (!chantierId || !Number.isFinite(plafond) || plafond <= 0) {
    return NextResponse.json({ error: 'Chantier et plafond positif obligatoires.' }, { status: 400 });
  }
  const chantier = await prisma.chantier.findFirst({
    where: { id: chantierId, entreprise_id: current.profile.entreprise_id },
    select: { id: true },
  });
  if (!chantier) return NextResponse.json({ error: 'Chantier hors périmètre entreprise.' }, { status: 403 });

  try {
    const caisse = await prisma.$transaction(async (tx) => {
      const existing = await tx.caisseChantier.findUnique({ where: { chantier_id: chantierId } });
      if (existing) {
        const balance = await getBalance(existing.id, tx);
        if (plafond < balance) throw new Error('Le plafond ne peut pas être inférieur au solde actuel.');
        return tx.caisseChantier.update({ where: { id: existing.id }, data: { plafond } });
      }
      return tx.caisseChantier.create({ data: { chantier_id: chantierId, plafond } });
    });
    return NextResponse.json(caisse, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Mise à jour du plafond impossible.' }, { status: 400 });
  }
}

// Une sortie est saisie par un utilisateur habilité du chantier.
// Un approvisionnement ne peut être saisi que par le siège central.
export async function POST(request: Request) {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  const body = await request.json();
  const type = String(body?.type || '');
  const chantierId = String(body?.chantier_id || '');
  const montant = Number(body?.montant);
  const motif = String(body?.motif || '').trim();

  if (!['SORTIE', 'APPROVISIONNEMENT'].includes(type) || !chantierId ||
      !Number.isFinite(montant) || montant <= 0 || !motif) {
    return NextResponse.json({ error: 'Type, chantier, motif et montant positif obligatoires.' }, { status: 400 });
  }

  const central = isCentralFinance(current.profile);
  if (type === 'APPROVISIONNEMENT') {
    if (!central || !can(current.profile as any, 'APPROVISIONNER')) {
      return NextResponse.json({ error: 'Seul le siège habilité peut enregistrer un approvisionnement.' }, { status: 403 });
    }
  } else if (!can(current.profile as any, 'SORTIR')) {
    return NextResponse.json({ error: 'Permission CAISSE / SORTIR requise.' }, { status: 403 });
  }

  const allowedIds = await getVisibleChantierIds(current.profile);
  if (!allowedIds.includes(chantierId)) return NextResponse.json({ error: 'Chantier non affecté ou hors périmètre.' }, { status: 403 });
  const caisse = await prisma.caisseChantier.findFirst({
    where: { chantier_id: chantierId, actif: true, chantier: { entreprise_id: current.profile.entreprise_id } },
  });
  if (!caisse) return NextResponse.json({ error: 'Aucune caisse active pour ce chantier. Le siège doit d’abord définir son plafond.' }, { status: 404 });

  try {
    const movement = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM comptabilite_caisses_chantier WHERE id = ${caisse.id} FOR UPDATE`;
      const balance = await getBalance(caisse.id, tx);
      const nextBalance = type === 'APPROVISIONNEMENT' ? balance + montant : balance - montant;
      if (type === 'SORTIE' && montant > balance) throw new Error('Solde de caisse insuffisant.');
      if (nextBalance > Number(caisse.plafond)) throw new Error('Cette opération dépasserait le plafond autorisé de la caisse.');

      const created = await tx.mouvementCaisse.create({
        data: {
          caisse_id: caisse.id,
          type,
          montant,
          motif,
          reference: body.reference ? String(body.reference).trim() : null,
          justificatif_url: body.justificatif_url ? String(body.justificatif_url).trim() : null,
          auteur_id: current.profile.id,
          validateur_id: type === 'APPROVISIONNEMENT' ? current.profile.id : null,
        },
        include: { auteur: { select: { id: true, nom: true, prenom: true } } },
      });

      if (type === 'SORTIE') {
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
              titre: 'Nouvelle sortie de caisse',
              message: `Sortie de ${montant.toLocaleString('fr-FR')} DZD — ${motif}`,
              type: 'INFO',
              module: 'CAISSE',
              lien: `/caisse?chantier=${chantierId}&mouvement=${created.id}`,
            })),
          });
        }
      }
      return created;
    });
    return NextResponse.json({ ...movement, solde: await getBalance(caisse.id) }, { status: 201 });
  } catch (error) {
    console.error('[caisse POST]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Enregistrement du mouvement impossible.' }, { status: 400 });
  }
}
