import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentAppProfile, assignedChantierIds, isCompanyAdmin } from '@/lib/auth/current-app-profile';

export async function GET() {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });

  const chantierIds = current.profile.type === 'CHANTIER'
    ? assignedChantierIds(current.profile)
    : (await prisma.chantier.findMany({
        where: { entreprise_id: current.profile.entreprise_id },
        select: { id: true },
      })).map((chantier) => chantier.id);

  try {
    const materiels = await prisma.materielEngin.findMany({
      where: { OR: [{ chantier_actuel_id: null }, { chantier_actuel_id: { in: chantierIds } }] },
      include: { chantierActuel: true, entretiens: true, piecesRemplacables: true },
      orderBy: { code_parc: 'asc' },
    });
    return NextResponse.json(materiels);
  } catch (error) {
    console.error('[GET /api/materiel/parc]', error);
    return NextResponse.json({ error: 'Impossible de charger le parc matériel depuis PostgreSQL.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!isCompanyAdmin(current.profile)) return NextResponse.json({ error: 'Droits administrateur requis.' }, { status: 403 });

  try {
    const body = await req.json();
    if (body.chantier_id) {
      const chantier = await prisma.chantier.findFirst({
        where: { id: body.chantier_id, entreprise_id: current.profile.entreprise_id },
        select: { id: true },
      });
      if (!chantier) return NextResponse.json({ error: 'Chantier hors périmètre.' }, { status: 403 });
    }
    const nouveauMateriel = await prisma.materielEngin.create({
      data: {
        code_parc: body.num_interne,
        type_engin: body.categorie || 'VEHICULE_LEGER',
        marque: body.marque,
        modele: body.modele,
        immatriculation: body.immatriculation,
        annee: body.annee || 2024,
        carburant: body.carburant || 'DIESEL',
        puissance: body.puissance,
        tonnage: body.tonnage,
        capacite: body.capacite,
        kilometrage: body.kilometrage || 0,
        compteur_heures: body.heures_fonctionnement || 0,
        chantier_actuel_id: body.chantier_id || null,
        conducteur_nom: body.conducteur_nom,
        conducteur_telephone: body.conducteur_telephone,
        assurance_compagnie: body.assurance_compagnie,
        assurance_police: body.assurance_police,
        date_fin_assurance: body.date_fin_assurance ? new Date(body.date_fin_assurance) : null,
        date_prochain_controle_technique: body.date_prochain_controle_technique ? new Date(body.date_prochain_controle_technique) : null,
        date_prochaine_vidange: body.date_prochaine_vidange ? new Date(body.date_prochaine_vidange) : null,
        km_prochaine_vidange: body.km_prochaine_vidange,
        heures_prochaine_vidange: body.heures_prochaine_vidange,
        statut_operationnel: body.statut || 'ACTIF',
      },
    });
    return NextResponse.json(nouveauMateriel, { status: 201 });
  } catch (error) {
    console.error('[POST /api/materiel/parc]', error);
    return NextResponse.json({ error: 'Erreur lors de la création du matériel.' }, { status: 400 });
  }
}
