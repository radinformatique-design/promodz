import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentAppProfile, assignedChantierIds, isCompanyAdmin } from '@/lib/auth/current-app-profile';

export const dynamic = 'force-dynamic';

export async function GET() {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  const chantierIds = current.profile.type === 'CHANTIER'
    ? assignedChantierIds(current.profile)
    : (await prisma.chantier.findMany({ where: { entreprise_id: current.profile.entreprise_id }, select: { id: true } })).map(x => x.id);
  const demandes = await prisma.demandeAchat.findMany({
    where: { chantier_id: { in: chantierIds } },
    include: { chantier: true, demandeur: { select: { id: true, nom: true, prenom: true, email: true, role: { select: { libelle: true } } } }, bonsCommande: true },
    orderBy: { date_demande: 'desc' },
  });
  return NextResponse.json(demandes);
}

export async function POST(request: Request) {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  const body = await request.json();
  const chantierId = String(body?.chantier_id || '');
  const chantier = await prisma.chantier.findFirst({
    where: {
      id: chantierId,
      entreprise_id: current.profile.entreprise_id,
      ...(current.profile.type === 'CHANTIER' ? { id: { in: assignedChantierIds(current.profile) } } : {}),
    },
    select: { id: true, code_chantier: true, nom_projet: true },
  });
  if (!chantier) return NextResponse.json({ error: 'Chantier inaccessible ou inexistant.' }, { status: 403 });
  const lignes = body?.lignes_articles;
  if (!Array.isArray(lignes) || lignes.length === 0 || !String(body?.description || '').trim()) {
    return NextResponse.json({ error: 'La description et au moins une ligne article sont obligatoires.' }, { status: 400 });
  }
  const montant = Number(body.montant_estime ?? 0);
  if (!Number.isFinite(montant) || montant < 0) return NextResponse.json({ error: 'Montant estimé invalide.' }, { status: 400 });
  const numero = `DA-${chantier.code_chantier}-${Date.now().toString(36).toUpperCase()}`;

  try {
    const result = await prisma.$transaction(async tx => {
      const demande = await tx.demandeAchat.create({
        data: {
          chantier_id: chantier.id,
          demandeur_id: current.profile.id,
          numero_da: numero,
          priorite: ['URGENTE', 'HAUTE', 'NORMALE'].includes(body.priorite) ? body.priorite : 'NORMALE',
          description: String(body.description).trim(),
          montant_estime: montant,
          lignes_articles: lignes,
        },
      });
      const responsables = await tx.utilisateur.findMany({
        where: {
          entreprise_id: current.profile.entreprise_id,
          type: 'CENTRAL',
          statut: 'ACTIF',
          role: { code: 'ADMINISTRATEUR' },
          NOT: { id: current.profile.id },
        },
        select: { id: true },
      });
      if (responsables.length) {
        await tx.notification.createMany({
          data: responsables.map(user => ({
            destinataire_id: user.id,
            titre: `Nouvelle demande d'achat ${numero}`,
            message: `Une demande a été envoyée depuis le chantier ${chantier.nom_projet}.`,
            type: body.priorite === 'URGENTE' ? 'CRITIQUE' : 'VALIDATION_REQUISE',
            module: 'APPROVISIONNEMENTS',
            lien: `/approvisionnements/demandes/${demande.id}`,
          })),
        });
      }
      return demande;
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('[demandes-achat POST]', error);
    return NextResponse.json({ error: 'Impossible d’enregistrer la demande d’achat.' }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!isCompanyAdmin(current.profile)) return NextResponse.json({ error: 'Seul un administrateur central peut traiter les demandes.' }, { status: 403 });
  const body = await request.json();
  if (!body?.id || !['APPROUVEE', 'REFUSEE'].includes(body.statut)) {
    return NextResponse.json({ error: 'Identifiant ou statut de traitement invalide.' }, { status: 400 });
  }
  const demande = await prisma.demandeAchat.findFirst({
    where: { id: body.id, chantier: { entreprise_id: current.profile.entreprise_id } },
  });
  if (!demande) return NextResponse.json({ error: 'Demande introuvable.' }, { status: 404 });
  if (demande.statut !== 'EN_ATTENTE') return NextResponse.json({ error: 'Cette demande a déjà été traitée.' }, { status: 409 });
  const updated = await prisma.$transaction(async tx => {
    const item = await tx.demandeAchat.update({ where: { id: demande.id }, data: { statut: body.statut } });
    await tx.notification.create({
      data: {
        destinataire_id: demande.demandeur_id,
        titre: `Demande ${demande.numero_da} ${body.statut === 'APPROUVEE' ? 'approuvée' : 'refusée'}`,
        message: String(body.commentaire || 'Le siège central a traité votre demande.'),
        type: body.statut === 'APPROUVEE' ? 'INFO' : 'AVERTISSEMENT',
        module: 'APPROVISIONNEMENTS',
        lien: `/approvisionnements/demandes/${demande.id}`,
      },
    });
    return item;
  });
  return NextResponse.json(updated);
}
