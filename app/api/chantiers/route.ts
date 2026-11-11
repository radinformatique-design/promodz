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

  const canConsultChantiers = isCompanyAdmin(current.profile) || hasPermission(current.profile, 'CHANTIERS', 'CONSULTER');
  if (!canConsultChantiers) return NextResponse.json({ error: 'Permission CHANTIERS / CONSULTER requise.' }, { status: 403 });

  const canConsultTechnique = isCompanyAdmin(current.profile) || hasPermission(current.profile, 'TECHNIQUE', 'CONSULTER');
  const canConsultComptabilite = isCompanyAdmin(current.profile) || hasPermission(current.profile, 'COMPTABILITE', 'CONSULTER');
  const where = current.profile.type === 'CHANTIER'
    ? { entreprise_id: current.profile.entreprise_id, id: { in: assignedChantierIds(current.profile) } }
    : { entreprise_id: current.profile.entreprise_id };

  try {
    const chantiers = await prisma.chantier.findMany({
      where,
      include: {
        lotsTravaux: canConsultTechnique,
        comptesBancaires: canConsultComptabilite,
      },
      orderBy: { created_at: 'desc' },
    });
    return NextResponse.json(chantiers);
  } catch (error) {
    console.error('[GET /api/chantiers]', error);
    return NextResponse.json({ error: 'Impossible de charger les chantiers depuis PostgreSQL.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!isCompanyAdmin(current.profile) && !hasPermission(current.profile, 'CHANTIERS', 'AJOUTER')) {
    return NextResponse.json({ error: 'Permission CHANTIERS / AJOUTER requise.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { entreprise_id: _ignored, id: _id, ...input } = body ?? {};
    const staffIds = [input.directeur_chantier_id, input.conducteur_travaux_id]
      .filter((value: unknown): value is string => typeof value === 'string' && value.length > 0);
    if (staffIds.length) {
      const validStaff = await prisma.utilisateur.findMany({
        where: { id: { in: [...new Set(staffIds)] }, entreprise_id: current.profile.entreprise_id },
        select: { id: true },
      });
      if (validStaff.length !== new Set(staffIds).size) {
        return NextResponse.json({ error: 'Le directeur et le conducteur doivent appartenir à votre entreprise.' }, { status: 400 });
      }
    }

    const nouveauChantier = await prisma.chantier.create({
      data: { ...input, entreprise_id: current.profile.entreprise_id },
    });
    return NextResponse.json(nouveauChantier, { status: 201 });
  } catch (error) {
    console.error('[POST /api/chantiers]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur lors de la création du chantier.' }, { status: 400 });
  }
}
