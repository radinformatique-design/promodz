import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentAppProfile, assignedChantierIds, isCompanyAdmin, hasPermission } from '@/lib/auth/current-app-profile';

async function scopeIds(profile: { entreprise_id: string; type: string; affectations: Array<{ chantier_id: string }> }) {
  if (profile.type === 'CHANTIER') return assignedChantierIds(profile as any);
  return (await prisma.chantier.findMany({ where: { entreprise_id: profile.entreprise_id }, select: { id: true } })).map(x => x.id);
}

function canRecord(profile: Parameters<typeof hasPermission>[0]) {
  return isCompanyAdmin(profile as any) || hasPermission(profile, 'RH', 'CONSULTER');
}
function canSubmit(profile: Parameters<typeof hasPermission>[0]) {
  return isCompanyAdmin(profile as any) || hasPermission(profile, 'RH', 'AJOUTER');
}

export async function GET() {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!canRecord(current.profile)) return NextResponse.json({ error: 'Accès aux pointages réservé aux conducteurs et au service RH.' }, { status: 403 });
  const ids = await scopeIds(current.profile);
  const rows = await prisma.pointage.findMany({
    where: { chantier_id: { in: ids } },
    include: { employe: { select: { id: true, matricule: true, nom: true, prenom: true, fonction: true, qualification: true, statut: true } }, chantier: true },
    orderBy: [{ date: 'desc' }, { created_at: 'desc' }],
    take: 2000,
  });
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!canSubmit(current.profile)) return NextResponse.json({ error: 'Permission RH / AJOUTER requise pour saisir le pointage.' }, { status: 403 });
  const body = await request.json();
  const date = new Date(`${String(body?.date || '')}T00:00:00.000Z`);
  if (!body?.employe_id || !body?.chantier_id || !Number.isFinite(date.getTime()) ||
      !['PRESENT','RETARD','ABSENT','CONGE'].includes(body.statut_pointage || 'PRESENT')) {
    return NextResponse.json({ error: 'Employé, chantier, date et statut de pointage valides obligatoires.' }, { status: 400 });
  }
  const ids = await scopeIds(current.profile);
  if (!ids.includes(String(body.chantier_id))) return NextResponse.json({ error: 'Chantier non autorisé.' }, { status: 403 });
  const employee = await prisma.employe.findFirst({
    where: { id: String(body.employe_id), chantier_actuel_id: String(body.chantier_id) },
    select: { id: true },
  });
  if (!employee) return NextResponse.json({ error: 'Employé non affecté à ce chantier.' }, { status: 400 });

  const heuresNormales = Number(body.heures_normales ?? 8);
  const heuresSup = Number(body.heures_sup ?? 0);
  if (![heuresNormales, heuresSup].every(Number.isFinite) || heuresNormales < 0 || heuresSup < 0) {
    return NextResponse.json({ error: 'Durées de travail invalides.' }, { status: 400 });
  }
  try {
    const row = await prisma.pointage.upsert({
      where: { employe_id_date: { employe_id: employee.id, date } },
      create: {
        employe_id: employee.id,
        chantier_id: String(body.chantier_id),
        date,
        statut_pointage: body.statut_pointage || 'PRESENT',
        heure_arrivee: body.heure_arrivee || null,
        heure_depart: body.heure_depart || null,
        heures_normales: heuresNormales,
        heures_sup: heuresSup,
        observations: body.observations || null,
        valide_par: current.profile.id,
      },
      update: {
        chantier_id: String(body.chantier_id),
        statut_pointage: body.statut_pointage || 'PRESENT',
        heure_arrivee: body.heure_arrivee || null,
        heure_depart: body.heure_depart || null,
        heures_normales: heuresNormales,
        heures_sup: heuresSup,
        observations: body.observations || null,
        valide_par: current.profile.id,
      },
      include: { employe: true, chantier: true },
    });
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error('[rh/pointages POST]', error);
    return NextResponse.json({ error: 'Enregistrement du pointage impossible.' }, { status: 400 });
  }
}
