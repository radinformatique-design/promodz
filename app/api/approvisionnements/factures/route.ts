import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentAppProfile, assignedChantierIds, isCompanyAdmin } from '@/lib/auth/current-app-profile';

export const dynamic = 'force-dynamic';

export async function GET() {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  const ids = current.profile.type === 'CHANTIER'
    ? assignedChantierIds(current.profile)
    : (await prisma.chantier.findMany({ where: { entreprise_id: current.profile.entreprise_id }, select: { id: true } })).map(x => x.id);
  const rows = await prisma.factureFournisseur.findMany({
    where: {
      fournisseur: { entreprise_id: current.profile.entreprise_id },
      ...(current.profile.type === 'CHANTIER' ? { bonCommande: { chantier_id: { in: ids } } } : {}),
    },
    include: { fournisseur: true, bonCommande: { include: { chantier: true } } },
    orderBy: { date_facture: 'desc' },
  });
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!isCompanyAdmin(current.profile)) return NextResponse.json({ error: 'Création de facture réservée au siège central.' }, { status: 403 });
  const body = await request.json();
  const supplierId = String(body?.fournisseur_id || '');
  const invoiceDate = new Date(body?.date_facture);
  const dueDate = new Date(body?.date_echeance);
  const ht = Number(body?.total_ht ?? 0);
  const tva = Number(body?.total_tva ?? 0);
  const ttc = Number(body?.total_ttc ?? ht + tva);
  if (!supplierId || !String(body?.numero_facture || '').trim() ||
      !Number.isFinite(invoiceDate.getTime()) || !Number.isFinite(dueDate.getTime()) ||
      ![ht,tva,ttc].every(Number.isFinite) || ht < 0 || tva < 0 || ttc < 0 ||
      Math.abs(ttc - ht - tva) > 0.02) {
    return NextResponse.json({ error: 'Informations de facture ou montants invalides.' }, { status: 400 });
  }
  const supplier = await prisma.fournisseur.findFirst({
    where: { id: supplierId, entreprise_id: current.profile.entreprise_id },
    select: { id: true },
  });
  if (!supplier) return NextResponse.json({ error: 'Fournisseur hors périmètre entreprise.' }, { status: 403 });

  const orderId: string | null = body.bon_commande_id || null;
  if (orderId) {
    const order = await prisma.bonCommande.findFirst({
      where: { id: orderId, fournisseur_id: supplierId, chantier: { entreprise_id: current.profile.entreprise_id } },
      select: { id: true },
    });
    if (!order) return NextResponse.json({ error: 'Le bon de commande doit appartenir au fournisseur et à votre entreprise.' }, { status: 400 });
  }
  try {
    const row = await prisma.factureFournisseur.create({
      data: {
        numero_facture: String(body.numero_facture).trim(),
        fournisseur_id: supplierId,
        bon_commande_id: orderId,
        date_facture: invoiceDate,
        date_echeance: dueDate,
        total_ht: ht, total_tva: tva, total_ttc: ttc,
      },
      include: { fournisseur: true, bonCommande: true },
    });
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error('[factures-fournisseurs POST]', error);
    return NextResponse.json({ error: 'Création impossible : numéro de facture déjà utilisé ou données invalides.' }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!isCompanyAdmin(current.profile)) return NextResponse.json({ error: 'Droits administrateur requis.' }, { status: 403 });
  const body = await request.json();
  if (!body?.id || !['NON_PAYEE', 'PARTIELLE', 'PAYEE'].includes(body.statut_paiement)) {
    return NextResponse.json({ error: 'Identifiant ou statut de règlement invalide.' }, { status: 400 });
  }
  const target = await prisma.factureFournisseur.findFirst({
    where: { id: body.id, fournisseur: { entreprise_id: current.profile.entreprise_id } },
    select: { id: true },
  });
  if (!target) return NextResponse.json({ error: 'Facture introuvable.' }, { status: 404 });
  const updated = await prisma.factureFournisseur.update({
    where: { id: target.id },
    data: { statut_paiement: body.statut_paiement },
  });
  return NextResponse.json(updated);
}
