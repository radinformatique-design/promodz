import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentAppProfile, assignedChantierIds, isCompanyAdmin } from '@/lib/auth/current-app-profile';

export const dynamic = 'force-dynamic';

async function scopeIds(profile: { entreprise_id: string; type: string; affectations: Array<{ chantier_id: string }> }) {
  if (profile.type === 'CHANTIER') return assignedChantierIds(profile as any);
  return (await prisma.chantier.findMany({ where: { entreprise_id: profile.entreprise_id }, select: { id: true } })).map(x => x.id);
}
function canManage(profile: { type: string; role: { code: string } }) {
  return isCompanyAdmin(profile as any) || (profile.type === 'CENTRAL' && profile.role.code === 'RESPONSABLE_RH');
}
function canRequest(profile: { type: string; role: { code: string } }) {
  return canManage(profile) || (profile.type === 'CHANTIER' && profile.role.code === 'CONDUCTEUR_TRAVAUX');
}

export async function GET() {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!canRequest(current.profile)) return NextResponse.json({ error: 'Accès aux congés réservé aux conducteurs et au service RH.' }, { status: 403 });
  const ids = await scopeIds(current.profile);
  const rows = await prisma.congeAbsence.findMany({
    where: { employe: { chantier_actuel_id: { in: ids } } },
    include: { employe: { include: { chantierActuel: true } } },
    orderBy: { created_at: 'desc' },
  });
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!canRequest(current.profile)) return NextResponse.json({ error: 'Seuls les conducteurs et le service RH peuvent déclarer une demande de congé.' }, { status: 403 });
  const body = await request.json();
  const ids = await scopeIds(current.profile);
  const employee = await prisma.employe.findFirst({
    where: { id: String(body?.employe_id || ''), chantier_actuel_id: { in: ids } },
    select: { id: true, chantier_actuel_id: true },
  });
  if (!employee) return NextResponse.json({ error: 'Employé hors périmètre autorisé.' }, { status: 403 });
  const start = new Date(body.date_debut);
  const end = new Date(body.date_fin);
  const days = Number(body.jours_ouvrables);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end < start || !Number.isInteger(days) || days < 1 || !body.type) {
    return NextResponse.json({ error: 'Dates, type et nombre de jours ouvrables invalides.' }, { status: 400 });
  }
  const row = await prisma.congeAbsence.create({
    data: {
      employe_id: employee.id,
      type: String(body.type),
      date_debut: start,
      date_fin: end,
      jours_ouvrables: days,
      motif: body.motif || null,
      statut: 'EN_ATTENTE',
    },
    include: { employe: true },
  });
  const recipients = await prisma.utilisateur.findMany({
    where: {
      entreprise_id: current.profile.entreprise_id,
      type: 'CENTRAL',
      statut: 'ACTIF',
      role: { code: { in: ['ADMINISTRATEUR', 'RESPONSABLE_RH'] } },
    },
    select: { id: true },
  });
  if (recipients.length) {
    await prisma.notification.createMany({
      data: recipients.map(user => ({
        destinataire_id: user.id,
        titre: 'Nouvelle demande de congé / absence',
        message: `Une demande concernant ${row.employe.prenom} ${row.employe.nom} nécessite un traitement RH.`,
        type: 'VALIDATION_REQUISE',
        module: 'RH',
        lien: `/rh/conges/${row.id}`,
      })),
    });
  }
  return NextResponse.json(row, { status: 201 });
}

export async function PATCH(request: Request) {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!canManage(current.profile)) return NextResponse.json({ error: 'Validation réservée au service RH central.' }, { status: 403 });
  const body = await request.json();
  if (!body?.id || !['ACCEPTE','REFUSE'].includes(body.statut)) return NextResponse.json({ error: 'Statut de décision invalide.' }, { status: 400 });
  const ids = await scopeIds(current.profile);
  const target = await prisma.congeAbsence.findFirst({
    where: { id: String(body.id), employe: { chantier_actuel_id: { in: ids } } },
    select: { id: true, statut: true },
  });
  if (!target) return NextResponse.json({ error: 'Demande introuvable.' }, { status: 404 });
  if (target.statut !== 'EN_ATTENTE') return NextResponse.json({ error: 'Cette demande a déjà été traitée.' }, { status: 409 });
  return NextResponse.json(await prisma.congeAbsence.update({ where: { id: target.id }, data: { statut: body.statut } }));
}
