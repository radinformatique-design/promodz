import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  getCurrentAppProfile,
  assignedChantierIds,
  isCompanyAdmin,
  hasPermission,
} from '@/lib/auth/current-app-profile';

export async function GET() {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });

  const { profile } = current;
  const canConsultChantiers = isCompanyAdmin(profile) || hasPermission(profile, 'CHANTIERS', 'CONSULTER');
  const canConsultTechnique = isCompanyAdmin(profile) || hasPermission(profile, 'TECHNIQUE', 'CONSULTER');
  const canConsultComptabilite = isCompanyAdmin(profile) || hasPermission(profile, 'COMPTABILITE', 'CONSULTER');
  const canConsultRh = isCompanyAdmin(profile) || hasPermission(profile, 'RH', 'CONSULTER');

  const chantierIds = profile.type === 'CHANTIER'
    ? (canConsultChantiers ? assignedChantierIds(profile) : [])
    : canConsultChantiers
      ? (await prisma.chantier.findMany({
          where: { entreprise_id: profile.entreprise_id },
          select: { id: true },
        })).map((item) => item.id)
      : [];

  try {
    const [entreprise, parametresGeneraux, chantiers, employes, comptesBancaires] = await Promise.all([
      prisma.entreprise.findUnique({ where: { id: profile.entreprise_id } }),
      prisma.parametresGeneraux.findFirst({ where: { entreprise_id: profile.entreprise_id } }),
      prisma.chantier.findMany({
        where: { id: { in: chantierIds }, entreprise_id: profile.entreprise_id },
        include: {
          lotsTravaux: canConsultTechnique,
          comptesBancaires: canConsultComptabilite,
        },
        orderBy: { created_at: 'desc' },
      }),
      !canConsultRh
        ? Promise.resolve([])
        : profile.type === 'CHANTIER'
          ? prisma.employe.findMany({
              where: { chantier_actuel_id: { in: chantierIds } },
              select: {
                id: true, matricule: true, nom: true, prenom: true, fonction: true,
                qualification: true, type_contrat: true, chantier_actuel_id: true,
                statut: true, telephone: true,
                chantierActuel: { select: { id: true, nom_projet: true, wilaya: true, commune: true } },
              },
              orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
            })
          : prisma.employe.findMany({
              where: { chantier_actuel_id: { in: chantierIds } },
              include: { chantierActuel: true },
              orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
            }),
      canConsultComptabilite
        ? prisma.compteBancaire.findMany({
            where: { entreprise_id: profile.entreprise_id },
            orderBy: [{ is_compte_principal: 'desc' }, { nom_banque: 'asc' }],
          })
        : Promise.resolve([]),
    ]);

    return NextResponse.json({ entreprise, parametresGeneraux, chantiers, employes, comptesBancaires });
  } catch (error) {
    console.error('[GET /api/app/bootstrap]', error);
    return NextResponse.json({ error: 'Impossible de charger les données initiales depuis PostgreSQL.' }, { status: 500 });
  }
}
