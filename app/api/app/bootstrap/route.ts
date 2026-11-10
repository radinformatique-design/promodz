import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentAppProfile, assignedChantierIds, isCompanyAdmin } from '@/lib/auth/current-app-profile';

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
      (profile.type === 'CHANTIER' || isCompanyAdmin(profile) || profile.role.code === 'RESPONSABLE_RH')
        ? prisma.employe.findMany({
            where: { chantier_actuel_id: { in: chantierIds } },
            include: { chantierActuel: true },
            orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
          })
        : Promise.resolve([]),
      (isCompanyAdmin(profile) || profile.role.code === 'RESPONSABLE_COMPTABILITE')
        ? prisma.compteBancaire.findMany({
            where: { entreprise_id: profile.entreprise_id },
            orderBy: [{ is_compte_principal: 'desc' }, { nom_banque: 'asc' }],
          })
        : profile.type === 'CHANTIER'
          ? prisma.compteBancaire.findMany({
              where: { entreprise_id: profile.entreprise_id, chantier_dedie_id: { in: chantierIds } },
              orderBy: { nom_banque: 'asc' },
            })
          : Promise.resolve([]),
    ]);

    return NextResponse.json({ entreprise, parametresGeneraux, chantiers, employes, comptesBancaires });
  } catch (error) {
    console.error('[GET /api/app/bootstrap]', error);
    return NextResponse.json({ error: 'Impossible de charger les données initiales depuis PostgreSQL.' }, { status: 500 });
  }
}
