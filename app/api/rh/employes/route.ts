import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentAppProfile, assignedChantierIds } from '@/lib/auth/current-app-profile';

export const dynamic = 'force-dynamic';

export async function GET() {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });

  const chantierIds = current.profile.type === 'CHANTIER'
    ? assignedChantierIds(current.profile)
    : (await prisma.chantier.findMany({
        where: { entreprise_id: current.profile.entreprise_id },
        select: { id: true },
      })).map((chantier) => chantier.id);

  try {
    const employes = await prisma.employe.findMany({
      where: { chantier_actuel_id: { in: chantierIds } },
      include: { chantierActuel: true },
      orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
    });
    return NextResponse.json(employes);
  } catch (error) {
    console.error('[GET /api/rh/employes]', error);
    return NextResponse.json({ error: 'Impossible de charger les employés depuis PostgreSQL.' }, { status: 500 });
  }
}
