import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { DEMO_EMPLOYES } from '@/data/demoData';

export async function GET() {
  try {
    const employes = await prisma.employe.findMany({
      include: {
        chantierActuel: true,
      },
    });

    if (employes && employes.length > 0) {
      return NextResponse.json(employes);
    }
  } catch (err) {
    console.warn('[Prisma] Serveur PostgreSQL non disponible, repli sur données démo');
  }

  return NextResponse.json(DEMO_EMPLOYES);
}
