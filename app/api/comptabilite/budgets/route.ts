import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentAppProfile, assignedChantierIds, isCompanyAdmin, hasAnyRole } from '@/lib/auth/current-app-profile';

export async function GET() {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  const ids = current.profile.type === 'CHANTIER'
    ? assignedChantierIds(current.profile)
    : (await prisma.chantier.findMany({ where: { entreprise_id: current.profile.entreprise_id }, select: { id: true } })).map(x => x.id);
  const rows = await prisma.budgetChantier.findMany({
    where: { chantier_id: { in: ids } },
    include: { chantier: true },
    orderBy: [{ annee_exercice: 'desc' }, { chantier_id: 'asc' }],
  });
  return NextResponse.json(rows);
}

export async function PUT(request: Request) {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!isCompanyAdmin(current.profile)) return NextResponse.json({ error: 'Seul le siège central peut modifier les budgets.' }, { status: 403 });
  const body = await request.json();
  const chantierId = String(body?.chantier_id || '');
  const year = Number(body?.annee_exercice);
  const initial = Number(body?.budget_initial);
  if (!chantierId || !Number.isInteger(year) || year < 2000 || year > 2200 || !Number.isFinite(initial) || initial < 0) {
    return NextResponse.json({ error: 'Chantier, exercice et budget initial valides obligatoires.' }, { status: 400 });
  }
  const chantier = await prisma.chantier.findFirst({
    where: { id: chantierId, entreprise_id: current.profile.entreprise_id },
    select: { id: true },
  });
  if (!chantier) return NextResponse.json({ error: 'Chantier hors périmètre entreprise.' }, { status: 403 });

  const updated = await prisma.budgetChantier.upsert({
    where: { chantier_id_annee_exercice: { chantier_id: chantierId, annee_exercice: year } },
    create: { chantier_id: chantierId, annee_exercice: year, budget_initial: initial },
    update: { budget_initial: initial },
  });
  return NextResponse.json(updated);
}
