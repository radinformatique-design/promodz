import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { DEMO_ENTRETIENS } from '@/data/demoData';

export async function GET() {
  try {
    const entretiens = await prisma.entretienVehicule.findMany({
      include: {
        materiel: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    if (entretiens && entretiens.length > 0) {
      return NextResponse.json(entretiens);
    }
  } catch (err) {
    console.warn('[Prisma] Serveur PostgreSQL non disponible, repli sur données démo');
  }

  return NextResponse.json(DEMO_ENTRETIENS);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const nouvelEntretien = await prisma.entretienVehicule.create({
      data: {
        materiel_id: body.vehicule_id,
        type: body.type,
        gravite: body.gravite || 'FAIBLE',
        statut_operation: body.statut_operation || 'EFFECTUE',
        description: body.description,
        date: new Date(body.date),
        kilometrage_entretien: body.kilometrage_entretien || 0,
        heures_entretien: body.heures_entretien || 0,
        cout: body.cout || 0,
        garage_nom: body.garage_nom,
        piece_rechange: body.piece_rechange_utilisee,
        facture_ref: body.facture_ref,
      },
    });
    return NextResponse.json(nouvelEntretien, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Erreur lors de l’enregistrement de l’entretien', details: err?.message },
      { status: 500 }
    );
  }
}
