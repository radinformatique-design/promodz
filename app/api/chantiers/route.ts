import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { DEMO_CHANTIERS } from '@/data/demoData';

export async function GET() {
  try {
    const chantiers = await prisma.chantier.findMany({
      include: {
        lotsTravaux: true,
        comptesBancaires: true,
      },
    });

    if (chantiers && chantiers.length > 0) {
      return NextResponse.json(chantiers);
    }
  } catch (err) {
    console.warn('[Prisma] Serveur PostgreSQL non disponible, repli sur données démo :', err);
  }

  return NextResponse.json(DEMO_CHANTIERS);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const nouveauChantier = await prisma.chantier.create({
      data: body,
    });
    return NextResponse.json(nouveauChantier, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Erreur lors de la création du chantier', details: err?.message },
      { status: 500 }
    );
  }
}
