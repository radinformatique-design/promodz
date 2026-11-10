import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentAppProfile, assignedChantierIds, isCompanyAdmin } from '@/lib/auth/current-app-profile';

export async function GET() {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });

  const where = current.profile.type === 'CHANTIER'
    ? { entreprise_id: current.profile.entreprise_id, id: { in: assignedChantierIds(current.profile) } }
    : { entreprise_id: current.profile.entreprise_id };

  try {
    const chantiers = await prisma.chantier.findMany({
      where,
      include: { lotsTravaux: true, comptesBancaires: true },
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
  if (!isCompanyAdmin(current.profile)) return NextResponse.json({ error: 'Droits administrateur requis.' }, { status: 403 });

  try {
    const body = await req.json();
    const { entreprise_id: _ignored, id: _id, ...input } = body ?? {};
    const nouveauChantier = await prisma.chantier.create({
      data: { ...input, entreprise_id: current.profile.entreprise_id },
    });
    return NextResponse.json(nouveauChantier, { status: 201 });
  } catch (error) {
    console.error('[POST /api/chantiers]', error);
    return NextResponse.json({ error: 'Erreur lors de la création du chantier.' }, { status: 400 });
  }
}
