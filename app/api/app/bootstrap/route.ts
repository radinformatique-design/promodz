import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentAppProfile, assignedChantierIds } from '@/lib/auth/current-app-profile';

export const dynamic = 'force-dynamic';

export async function GET() {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });

  const { profile } = current;
  const chantierIds = profile.type === 'CHANTIER'
    ? assignedChantierIds(profile)
    : (await prisma.chantier.findMany({
        where: { entreprise_id: profile.entreprise_id },
        select: { id: true },
      })).map((item) => item.id);

  try {
    const [entreprise, parametresGeneraux, chantiers, employes, comptesBancaires] = await Promise.all([
      prisma.entreprise.findUnique({ where: { id: profile.entreprise_id } }),
      prisma.parametresGeneraux.findFirst({ where: { entreprise_id: profile.entreprise_id } }),
      prisma.chantier.findMany({
        where: { id: { in: chantierIds }, entreprise_id: profile.entreprise_id },
        include: { lotsTravaux: true, comptesBancaires: true },
        orderBy: { created_at: 'desc' },
      }),
      prisma.employe.findMany({
        where: { chantier_actuel_id: { in: chantierIds } },
        include: { chantierActuel: true },
        orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
      }),
      prisma.compteBancaire.findMany({
        where: {
          entreprise_id: profile.entreprise_id,
          OR: [{ chantier_dedie_id: null }, { chantier_dedie_id: { in: chantierIds } }],
        },
        orderBy: [{ is_compte_principal: 'desc' }, { nom_banque: 'asc' }],
      }),
    ]);

    return NextResponse.json({ entreprise, parametresGeneraux, chantiers, employes, comptesBancaires });
  } catch (error) {
    console.error('[GET /api/app/bootstrap]', error);
    return NextResponse.json({ error: 'Impossible de charger les données initiales depuis PostgreSQL.' }, { status: 500 });
  }
}
