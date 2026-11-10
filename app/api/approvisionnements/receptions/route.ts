import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentAppProfile, assignedChantierIds } from '@/lib/auth/current-app-profile';

export const dynamic = 'force-dynamic';

export async function GET() {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  const ids = current.profile.type === 'CHANTIER'
    ? assignedChantierIds(current.profile)
    : (await prisma.chantier.findMany({ where: { entreprise_id: current.profile.entreprise_id }, select: { id: true } })).map(x => x.id);
  const rows = await prisma.bonReception.findMany({
    where: { chantier_id: { in: ids } },
    include: { chantier: true, bonCommande: { include: { fournisseur: true } } },
    orderBy: { date_reception: 'desc' },
  });
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  const body = await request.json();
  if (!body?.bon_commande_id || !Array.isArray(body.lignes_recues) || !body.lignes_recues.length) {
    return NextResponse.json({ error: 'Commande et lignes réceptionnées obligatoires.' }, { status: 400 });
  }
  const chantierIds = current.profile.type === 'CHANTIER' ? assignedChantierIds(current.profile) : undefined;
  const order = await prisma.bonCommande.findFirst({
    where: {
      id: body.bon_commande_id,
      chantier: { entreprise_id: current.profile.entreprise_id, ...(chantierIds ? { id: { in: chantierIds } } : {}) },
      statut: { in: ['EMIS', 'RECU_PARTIEL'] },
    },
    select: { id: true, chantier_id: true },
  });
  if (!order) return NextResponse.json({ error: 'Commande inaccessible, annulée ou déjà réceptionnée.' }, { status: 404 });

  const numero = `BL-${Date.now().toString(36).toUpperCase()}`;
  try {
    const reception = await prisma.$transaction(async tx => {
      const created = await tx.bonReception.create({
        data: {
          numero_bl: numero, bon_commande_id: order.id, chantier_id: order.chantier_id,
          statut_conforme: body.statut_conforme !== false,
          commentaires: body.commentaires || null,
          lignes_recues: body.lignes_recues,
        },
      });
      await tx.bonCommande.update({
        where: { id: order.id },
        data: { statut: body.commande_complete === true && body.statut_conforme !== false ? 'RECU_TOTAL' : 'RECU_PARTIEL' },
      });
      return created;
    });
    return NextResponse.json(reception, { status: 201 });
  } catch (error) {
    console.error('[receptions POST]', error);
    return NextResponse.json({ error: 'Impossible d’enregistrer la réception.' }, { status: 400 });
  }
}
