import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { DEMO_VEHICULES } from '@/data/demoData';

export async function GET() {
  try {
    const materiels = await prisma.materielEngin.findMany({
      include: {
        chantierActuel: true,
        entretiens: true,
        piecesRemplacables: true,
      },
      orderBy: {
        code_parc: 'asc',
      },
    });

    if (materiels && materiels.length > 0) {
      return NextResponse.json(materiels);
    }
  } catch (err) {
    console.warn('[Prisma] Serveur PostgreSQL non disponible, repli sur données démo');
  }

  return NextResponse.json(DEMO_VEHICULES);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
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
        chantier_actuel_id: body.chantier_id,
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
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Erreur lors de la création du matériel', details: err?.message },
      { status: 500 }
    );
  }
}
