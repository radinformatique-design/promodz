import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentAppProfile, assignedChantierIds, isCompanyAdmin, hasPermission } from '@/lib/auth/current-app-profile';

export async function GET() {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!isCompanyAdmin(current.profile) && !hasPermission(current.profile, 'MATERIEL', 'CONSULTER')) {
    return NextResponse.json({ error: 'Accès aux pièces réservé au service matériel.' }, { status: 403 });
  }
  const chantierIds = current.profile.type === 'CHANTIER'
    ? assignedChantierIds(current.profile)
    : (await prisma.chantier.findMany({ where: { entreprise_id: current.profile.entreprise_id }, select: { id: true } })).map(x => x.id);
  const rows = await prisma.pieceRemplacableVehicule.findMany({
    where: {
      materiel: {
        entreprise_id: current.profile.entreprise_id,
        ...(current.profile.type === 'CHANTIER' ? { chantier_actuel_id: { in: chantierIds } } : {}),
      },
    },
    include: { materiel: { select: { id: true, code_parc: true, marque: true, modele: true } } },
    orderBy: { created_at: 'desc' },
  });
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!isCompanyAdmin(current.profile) && !hasPermission(current.profile, 'MATERIEL', 'AJOUTER')) {
    return NextResponse.json({ error: 'Gestion des pièces réservée au service matériel.' }, { status: 403 });
  }
  const body = await request.json();
  const date = new Date(body?.date_installation);
  if (!body?.materiel_id || !body?.type || !body?.designation || !body?.numero_serie || !body?.position ||
      !Number.isFinite(date.getTime())) {
    return NextResponse.json({ error: 'Informations de pièce obligatoires ou date invalide.' }, { status: 400 });
  }
  const material = await prisma.materielEngin.findFirst({
    where: { id: String(body.materiel_id), entreprise_id: current.profile.entreprise_id },
    select: { id: true },
  });
  if (!material) return NextResponse.json({ error: 'Matériel hors périmètre entreprise.' }, { status: 403 });
  try {
    const row = await prisma.pieceRemplacableVehicule.create({
      data: {
        materiel_id: material.id,
        type: String(body.type),
        designation: String(body.designation).trim(),
        marque: body.marque || null,
        dimensions: body.dimensions || null,
        numero_serie: String(body.numero_serie).trim(),
        position: String(body.position),
        date_installation: date,
        kilometrage_installation: Math.max(0, Number(body.kilometrage_installation || 0)),
        heures_installation: Math.max(0, Number(body.heures_installation || 0)),
        etat: body.etat || 'NEUF',
        profondeur_sculpture_mm: body.profondeur_sculpture_mm ?? null,
        cout_achat_dzd: Number(body.cout_achat_dzd || 0),
        fournisseur: body.fournisseur || null,
        historique_permutations: body.historique_permutations ?? undefined,
        historique_remplacements: body.historique_remplacements ?? undefined,
      },
      include: { materiel: { select: { id: true, code_parc: true, marque: true, modele: true } } },
    });
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error('[materiel/pieces POST]', error);
    return NextResponse.json({ error: 'Création impossible : numéro de série déjà utilisé ou données invalides.' }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!isCompanyAdmin(current.profile) && !hasPermission(current.profile, 'MATERIEL', 'MODIFIER')) {
    return NextResponse.json({ error: 'Gestion des pièces réservée au service matériel.' }, { status: 403 });
  }
  const body = await request.json();
  if (!body?.id) return NextResponse.json({ error: 'Identifiant de pièce obligatoire.' }, { status: 400 });
  const target = await prisma.pieceRemplacableVehicule.findFirst({
    where: { id: String(body.id), materiel: { entreprise_id: current.profile.entreprise_id } },
    select: { id: true },
  });
  if (!target) return NextResponse.json({ error: 'Pièce introuvable.' }, { status: 404 });
  const data: Record<string, unknown> = {};
  for (const key of ['type','designation','marque','dimensions','numero_serie','position','kilometrage_installation','heures_installation','etat','profondeur_sculpture_mm','cout_achat_dzd','fournisseur','historique_permutations','historique_remplacements']) {
    if (Object.prototype.hasOwnProperty.call(body, key)) data[key] = body[key];
  }
  if (body.date_installation) {
    const date = new Date(body.date_installation);
    if (!Number.isFinite(date.getTime())) return NextResponse.json({ error: 'Date d’installation invalide.' }, { status: 400 });
    data.date_installation = date;
  }
  try {
    return NextResponse.json(await prisma.pieceRemplacableVehicule.update({
      where: { id: target.id },
      data: data as any,
      include: { materiel: { select: { id: true, code_parc: true, marque: true, modele: true } } },
    }));
  } catch (error) {
    console.error('[materiel/pieces PATCH]', error);
    return NextResponse.json({ error: 'Modification impossible.' }, { status: 400 });
  }
}
