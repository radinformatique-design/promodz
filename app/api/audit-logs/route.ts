import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentAppProfile, assignedChantierIds, isCompanyAdmin } from '@/lib/auth/current-app-profile';

export async function GET() {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (current.profile.type === 'CENTRAL' && !isCompanyAdmin(current.profile)) return NextResponse.json({ error: 'Consultation des journaux centraux réservée à l’administrateur.' }, { status: 403 });
  const chantierIds = current.profile.type === 'CHANTIER'
    ? assignedChantierIds(current.profile)
    : (await prisma.chantier.findMany({ where: { entreprise_id: current.profile.entreprise_id }, select: { id: true } })).map(x => x.id);
  const rows = await prisma.auditLog.findMany({
    where: {
      entreprise_id: current.profile.entreprise_id,
      OR: [
        { chantier_id: { in: chantierIds } },
        ...(isCompanyAdmin(current.profile) ? [{ chantier_id: null }] : []),
      ],
    },
    include: { utilisateur: { select: { nom: true, prenom: true, email: true } }, chantier: { select: { code_chantier: true, nom_projet: true } } },
    orderBy: { created_at: 'desc' },
    take: 250,
  });
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  const body = await request.json();
  const chantierId = body?.chantier_id ? String(body.chantier_id) : null;
  if (chantierId) {
    const accessible = current.profile.type === 'CHANTIER'
      ? assignedChantierIds(current.profile).includes(chantierId)
      : Boolean(await prisma.chantier.findFirst({ where: { id: chantierId, entreprise_id: current.profile.entreprise_id }, select: { id: true } }));
    if (!accessible) return NextResponse.json({ error: 'Chantier hors périmètre.' }, { status: 403 });
  } else if (current.profile.type !== 'CENTRAL') {
    return NextResponse.json({ error: 'Un utilisateur chantier doit rattacher son journal à un chantier.' }, { status: 403 });
  }
  const required = ['module', 'action', 'table_nom', 'description'];
  if (required.some(key => !String(body?.[key] || '').trim())) return NextResponse.json({ error: 'Informations de journal incomplètes.' }, { status: 400 });

  const row = await prisma.auditLog.create({
    data: {
      entreprise_id: current.profile.entreprise_id,
      utilisateur_id: current.profile.id,
      chantier_id: chantierId,
      module: String(body.module),
      action: String(body.action),
      table_nom: String(body.table_nom),
      enregistrement_id: body.enregistrement_id ? String(body.enregistrement_id) : null,
      description: String(body.description),
      adresse_ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
      donnees_anciennes: body.donnees_anciennes ?? undefined,
      donnees_nouvelles: body.donnees_nouvelles ?? undefined,
    },
  });
  return NextResponse.json(row, { status: 201 });
}
