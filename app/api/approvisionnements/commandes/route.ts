import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentAppProfile, assignedChantierIds, isCompanyAdmin, hasAnyRole } from '@/lib/auth/current-app-profile';

export async function GET() {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  const chantierIds = current.profile.type === 'CHANTIER'
    ? assignedChantierIds(current.profile)
    : (await prisma.chantier.findMany({ where: { entreprise_id: current.profile.entreprise_id }, select: { id: true } })).map(x => x.id);
  const orders = await prisma.bonCommande.findMany({
    where: { chantier_id: { in: chantierIds } },
    include: { chantier: true, fournisseur: true, demandeAchat: true, receptions: true, factures: true },
    orderBy: { date_commande: 'desc' },
  });
  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!isCompanyAdmin(current.profile)) return NextResponse.json({ error: 'Validation centrale requise pour émettre un bon de commande.' }, { status: 403 });

  const body = await request.json();
  const chantierId = String(body?.chantier_id || '');
  const fournisseurId = String(body?.fournisseur_id || '');
  const lignes = body?.lignes_articles;
  if (!chantierId || !fournisseurId || !Array.isArray(lignes) || !lignes.length) {
    return NextResponse.json({ error: 'Chantier, fournisseur et lignes de commande obligatoires.' }, { status: 400 });
  }
  const [chantier, fournisseur] = await Promise.all([
    prisma.chantier.findFirst({ where: { id: chantierId, entreprise_id: current.profile.entreprise_id }, select: { id: true, code_chantier: true } }),
    prisma.fournisseur.findFirst({ where: { id: fournisseurId, entreprise_id: current.profile.entreprise_id, actif: true }, select: { id: true } }),
  ]);
  if (!chantier || !fournisseur) return NextResponse.json({ error: 'Chantier ou fournisseur hors périmètre entreprise.' }, { status: 403 });

  let demandeId: string | null = body.demande_achat_id || null;
  if (demandeId) {
    const demande = await prisma.demandeAchat.findFirst({
      where: { id: demandeId, chantier_id: chantier.id, statut: 'APPROUVEE' },
      select: { id: true },
    });
    if (!demande) return NextResponse.json({ error: 'La demande associée doit être approuvée et appartenir au même chantier.' }, { status: 400 });
  }

  const ht = Number(body.total_ht ?? 0);
  const tva = Number(body.total_tva ?? 0);
  const ttc = Number(body.total_ttc ?? ht + tva);
  if (![ht, tva, ttc].every(Number.isFinite) || ht < 0 || tva < 0 || ttc < 0 || Math.abs(ttc - ht - tva) > 0.02) {
    return NextResponse.json({ error: 'Les totaux HT, TVA et TTC sont invalides.' }, { status: 400 });
  }
  const numero = `BC-${chantier.code_chantier}-${Date.now().toString(36).toUpperCase()}`;
  try {
    const order = await prisma.$transaction(async tx => {
      const created = await tx.bonCommande.create({
        data: {
          numero_bc: numero, chantier_id: chantier.id, fournisseur_id: fournisseur.id,
          demande_achat_id: demandeId,
          delai_livraison: body.delai_livraison ? new Date(body.delai_livraison) : null,
          total_ht: ht, total_tva: tva, total_ttc: ttc, lignes_articles: lignes,
        },
      });
      if (demandeId) await tx.demandeAchat.update({ where: { id: demandeId }, data: { statut: 'COMMANDEE' } });
      return created;
    });
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('[bons-commande POST]', error);
    return NextResponse.json({ error: 'Impossible de créer le bon de commande.' }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!isCompanyAdmin(current.profile) && !hasAnyRole(current.profile, ['RESPONSABLE_APPROVISIONNEMENTS'])) return NextResponse.json({ error: 'Émission des commandes réservée au service approvisionnements.' }, { status: 403 });
  const body = await request.json();
  if (!body?.id || !['EMIS', 'ANNULE'].includes(body.statut)) return NextResponse.json({ error: 'Statut de commande invalide.' }, { status: 400 });
  const target = await prisma.bonCommande.findFirst({
    where: { id: body.id, chantier: { entreprise_id: current.profile.entreprise_id } },
  });
  if (!target) return NextResponse.json({ error: 'Commande introuvable.' }, { status: 404 });
  if (target.statut === 'RECU_PARTIEL' || target.statut === 'RECU_TOTAL') return NextResponse.json({ error: 'Une commande réceptionnée ne peut pas être annulée ici.' }, { status: 409 });
  const updated = await prisma.bonCommande.update({ where: { id: target.id }, data: { statut: body.statut } });
  return NextResponse.json(updated);
}
