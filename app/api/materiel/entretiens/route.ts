import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentAppProfile, assignedChantierIds, isCompanyAdmin, hasAnyRole } from '@/lib/auth/current-app-profile';

export async function GET() {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (current.profile.type === 'CENTRAL' && !isCompanyAdmin(current.profile) && !hasAnyRole(current.profile, ['RESPONSABLE_MATERIEL'])) {
    return NextResponse.json({ error: 'Accès aux entretiens réservé au service matériel.' }, { status: 403 });
  }
  const chantierIds = current.profile.type === 'CHANTIER'
    ? assignedChantierIds(current.profile)
    : (await prisma.chantier.findMany({
        where: { entreprise_id: current.profile.entreprise_id },
        select: { id: true },
      })).map(x => x.id);

  try {
    const rows = await prisma.entretienVehicule.findMany({
      where: {
        materiel: {
          entreprise_id: current.profile.entreprise_id,
          ...(current.profile.type === 'CHANTIER'
            ? { chantier_actuel_id: { in: chantierIds } }
            : {}),
        },
      },
      include: {
        materiel: {
          select: {
            id: true, code_parc: true, marque: true, modele: true,
            immatriculation: true, chantier_actuel_id: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(rows);
  } catch (error) {
    console.error('[materiel/entretiens GET]', error);
    return NextResponse.json({ error: 'Impossible de charger les entretiens.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!isCompanyAdmin(current.profile) && !hasAnyRole(current.profile, ['RESPONSABLE_MATERIEL'])) {
    return NextResponse.json({ error: 'Création d’entretien réservée au service matériel.' }, { status: 403 });
  }
  const body = await request.json();
  const date = new Date(body?.date);
  const cost = Number(body?.cout ?? 0);
  const mileage = Number(body?.kilometrage_entretien ?? 0);
  const hours = Number(body?.heures_entretien ?? 0);
  if (!body?.vehicule_id || !body?.type || !String(body?.description || '').trim() ||
      !Number.isFinite(date.getTime()) || ![cost,mileage,hours].every(Number.isFinite) ||
      cost < 0 || mileage < 0 || hours < 0) {
    return NextResponse.json({ error: 'Informations d’entretien invalides.' }, { status: 400 });
  }
  const material = await prisma.materielEngin.findFirst({
    where: { id: String(body.vehicule_id), entreprise_id: current.profile.entreprise_id },
    select: { id: true },
  });
  if (!material) return NextResponse.json({ error: 'Matériel introuvable dans votre entreprise.' }, { status: 404 });

  try {
    const row = await prisma.entretienVehicule.create({
      data: {
        materiel_id: material.id,
        type: String(body.type),
        gravite: body.gravite || 'FAIBLE',
        statut_operation: body.statut_operation || 'EFFECTUE',
        description: String(body.description).trim(),
        date,
        kilometrage_entretien: mileage,
        heures_entretien: hours,
        cout: cost,
        garage_nom: body.garage_nom || null,
        piece_rechange: body.piece_rechange_utilisee || null,
        facture_ref: body.facture_ref || null,
      },
      include: { materiel: { select: { id: true, code_parc: true, marque: true, modele: true } } },
    });
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error('[materiel/entretiens POST]', error);
    return NextResponse.json({ error: 'Enregistrement de l’entretien impossible.' }, { status: 400 });
  }
}
