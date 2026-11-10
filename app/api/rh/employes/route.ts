import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentAppProfile, assignedChantierIds, isCompanyAdmin } from '@/lib/auth/current-app-profile';

export const dynamic = 'force-dynamic';

function canManageHr(profile: { role: { code: string }; type: string }) {
  return isCompanyAdmin(profile as any) || (profile.type === 'CENTRAL' && profile.role.code === 'RESPONSABLE_RH');
}

async function getScope(profile: { entreprise_id: string; type: string; affectations: Array<{ chantier_id: string }> }) {
  if (profile.type === 'CHANTIER') return assignedChantierIds(profile as any);
  const rows = await prisma.chantier.findMany({ where: { entreprise_id: profile.entreprise_id }, select: { id: true } });
  return rows.map(row => row.id);
}

export async function GET() {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (current.profile.type === 'CENTRAL' && !canManageHr(current.profile)) return NextResponse.json({ error: 'Accès au module RH réservé au service RH.' }, { status: 403 });
  const ids = await getScope(current.profile);
  const rows = await prisma.employe.findMany({
    where: { chantier_actuel_id: { in: ids } },
    include: { chantierActuel: true },
    orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
  });
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!canManageHr(current.profile)) return NextResponse.json({ error: 'Droits RH centraux requis.' }, { status: 403 });
  const body = await request.json();
  const required = ['matricule', 'nom', 'prenom', 'fonction', 'qualification', 'date_recrutement', 'chantier_actuel_id'];
  if (required.some(key => !String(body?.[key] ?? '').trim())) return NextResponse.json({ error: 'Informations obligatoires de l’employé manquantes.' }, { status: 400 });
  const chantier = await prisma.chantier.findFirst({
    where: { id: String(body.chantier_actuel_id), entreprise_id: current.profile.entreprise_id },
    select: { id: true },
  });
  if (!chantier) return NextResponse.json({ error: 'Chantier hors périmètre entreprise.' }, { status: 403 });
  const hireDate = new Date(body.date_recrutement);
  const salary = Number(body.salaire_base_dzd ?? 0);
  if (!Number.isFinite(hireDate.getTime()) || !Number.isFinite(salary) || salary < 0) return NextResponse.json({ error: 'Date de recrutement ou salaire invalide.' }, { status: 400 });
  try {
    const row = await prisma.employe.create({
      data: {
        matricule: String(body.matricule).trim(),
        nom: String(body.nom).trim(),
        prenom: String(body.prenom).trim(),
        date_naissance: body.date_naissance ? new Date(body.date_naissance) : null,
        sexe: body.sexe || 'M',
        situation_familiale: body.situation_familiale || 'CELIBATAIRE',
        nombre_enfants: Number(body.nombre_enfants || 0),
        fonction: String(body.fonction),
        qualification: String(body.qualification),
        type_contrat: body.type_contrat || 'CDD',
        date_recrutement: hireDate,
        salaire_base_dzd: salary,
        num_securite_sociale: body.num_securite_sociale || null,
        chantier_actuel_id: chantier.id,
        statut: body.statut || 'ACTIF',
        telephone: body.telephone || null,
        adresse: body.adresse || null,
      },
      include: { chantierActuel: true },
    });
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error('[rh/employes POST]', error);
    return NextResponse.json({ error: 'Création impossible : matricule déjà utilisé ou données invalides.' }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!canManageHr(current.profile)) return NextResponse.json({ error: 'Droits RH centraux requis.' }, { status: 403 });
  const body = await request.json();
  if (!body?.id) return NextResponse.json({ error: 'Identifiant employé obligatoire.' }, { status: 400 });
  const ids = await getScope(current.profile);
  const target = await prisma.employe.findFirst({ where: { id: String(body.id), chantier_actuel_id: { in: ids } } });
  if (!target) return NextResponse.json({ error: 'Employé introuvable dans le périmètre autorisé.' }, { status: 404 });

  const data: Record<string, unknown> = {};
  for (const key of ['matricule','nom','prenom','sexe','situation_familiale','nombre_enfants','fonction','qualification','type_contrat','salaire_base_dzd','num_securite_sociale','statut','telephone','adresse']) {
    if (Object.prototype.hasOwnProperty.call(body, key)) data[key] = body[key];
  }
  for (const key of ['date_naissance','date_recrutement']) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      const date = body[key] ? new Date(body[key]) : null;
      if (date && !Number.isFinite(date.getTime())) return NextResponse.json({ error: `Date invalide : ${key}.` }, { status: 400 });
      data[key] = date;
    }
  }
  if (body.chantier_actuel_id) {
    const chantier = await prisma.chantier.findFirst({
      where: { id: String(body.chantier_actuel_id), entreprise_id: current.profile.entreprise_id },
      select: { id: true },
    });
    if (!chantier) return NextResponse.json({ error: 'Nouveau chantier hors périmètre.' }, { status: 403 });
    data.chantier_actuel_id = chantier.id;
  }
  if (data.salaire_base_dzd !== undefined && (!Number.isFinite(Number(data.salaire_base_dzd)) || Number(data.salaire_base_dzd) < 0)) {
    return NextResponse.json({ error: 'Salaire invalide.' }, { status: 400 });
  }
  try {
    const row = await prisma.employe.update({ where: { id: target.id }, data, include: { chantierActuel: true } });
    return NextResponse.json(row);
  } catch (error) {
    console.error('[rh/employes PATCH]', error);
    return NextResponse.json({ error: 'Modification impossible.' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!canManageHr(current.profile)) return NextResponse.json({ error: 'Droits RH centraux requis.' }, { status: 403 });
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Identifiant employé obligatoire.' }, { status: 400 });
  const ids = await getScope(current.profile);
  const target = await prisma.employe.findFirst({ where: { id, chantier_actuel_id: { in: ids } }, select: { id: true } });
  if (!target) return NextResponse.json({ error: 'Employé introuvable.' }, { status: 404 });
  const row = await prisma.employe.update({ where: { id }, data: { statut: 'INACTIF' } });
  return NextResponse.json({ success: true, employee: row });
}
