import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentAppProfile, assignedChantierIds, isCompanyAdmin, hasPermission } from '@/lib/auth/current-app-profile';

export async function GET() {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!isCompanyAdmin(current.profile) && !hasPermission(current.profile, 'MATERIEL', 'CONSULTER')) return NextResponse.json({ error: 'Accès au parc réservé au service matériel.' }, { status: 403 });

  const chantierIds = current.profile.type === 'CHANTIER'
    ? assignedChantierIds(current.profile)
    : (await prisma.chantier.findMany({
        where: { entreprise_id: current.profile.entreprise_id },
        select: { id: true },
      })).map((chantier) => chantier.id);

  try {
    const materiels = await prisma.materielEngin.findMany({
      where: { entreprise_id: current.profile.entreprise_id, OR: current.profile.type === 'CHANTIER' ? [{ chantier_actuel_id: { in: chantierIds } }] : [{ chantier_actuel_id: null }, { chantier_actuel_id: { in: chantierIds } }] },
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
  if (!isCompanyAdmin(current.profile) && !hasPermission(current.profile, 'MATERIEL', 'AJOUTER')) return NextResponse.json({ error: 'Gestion du parc réservée au service matériel.' }, { status: 403 });

  try {
    const body = await req.json();
    if (!body?.num_interne || !body?.marque || !body?.modele || !body?.categorie ||
        !Number.isInteger(Number(body?.annee)) || Number(body.annee) < 1950 ||
        Number(body.annee) > new Date().getFullYear() + 1) {
      return NextResponse.json({ error: 'Code parc, marque, modèle, catégorie et année valide sont obligatoires.' }, { status: 400 });
    }
    if (body.chantier_id) {
      const chantier = await prisma.chantier.findFirst({
        where: { id: body.chantier_id, entreprise_id: current.profile.entreprise_id },
        select: { id: true },
      });
      if (!chantier) return NextResponse.json({ error: 'Chantier hors périmètre.' }, { status: 403 });
    }
    const nouveauMateriel = await prisma.materielEngin.create({
      data: {
        entreprise_id: current.profile.entreprise_id,
        code_parc: body.num_interne,
        type_engin: body.categorie || 'VEHICULE_LEGER',
        marque: body.marque,
        modele: body.modele,
        immatriculation: body.immatriculation,
        annee: Number(body.annee),
        carburant: body.carburant || 'DIESEL',
        puissance: body.puissance,
        tonnage: body.tonnage,
        capacite: body.capacite,
        kilometrage: body.kilometrage || 0,
        compteur_heures: body.heures_fonctionnement || 0,
        chantier_actuel_id: body.chantier_id || null,
        conducteur_nom: body.conducteur_nom,
        conducteur_telephone: body.conducteur_telephone,
        historique_affectations: body.historique_affectations ?? undefined,
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
 
export async function PATCH(request: Request) {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!isCompanyAdmin(current.profile) && !hasPermission(current.profile, 'MATERIEL', 'MODIFIER')) {
    return NextResponse.json({ error: 'Modification du parc réservée au service matériel.' }, { status: 403 });
  }

  const body = await request.json();
  if (!body?.id) return NextResponse.json({ error: 'Identifiant matériel obligatoire.' }, { status: 400 });
  const target = await prisma.materielEngin.findFirst({
    where: { id: String(body.id), entreprise_id: current.profile.entreprise_id },
    select: { id: true },
  });
  if (!target) return NextResponse.json({ error: 'Matériel introuvable dans votre entreprise.' }, { status: 404 });

  const data: Record<string, unknown> = {};
  const aliases: Record<string, string> = {
    num_interne: 'code_parc',
    categorie: 'type_engin',
    statut: 'statut_operationnel',
    heures_fonctionnement: 'compteur_heures',
    chantier_id: 'chantier_actuel_id',
  };
  const allowed = [
    'code_parc','type_engin','marque','modele','immatriculation','num_serie','annee',
    'carburant','puissance','tonnage','capacite','kilometrage','compteur_heures',
    'date_prochaine_vidange','km_prochaine_vidange','heures_prochaine_vidange',
    'date_prochain_controle_technique','ct_organisme','date_fin_assurance',
    'assurance_compagnie','assurance_police','assurance_cout_dzd',
    'conducteur_nom','conducteur_telephone','historique_affectations','statut_operationnel',
  ];
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, key)) data[key] = body[key];
  }
  for (const [legacy, column] of Object.entries(aliases)) {
    if (Object.prototype.hasOwnProperty.call(body, legacy)) data[column] = body[legacy];
  }

  if (Object.prototype.hasOwnProperty.call(data, 'chantier_actuel_id')) {
    const chantierId = data.chantier_actuel_id;
    if (chantierId) {
      const chantier = await prisma.chantier.findFirst({
        where: { id: String(chantierId), entreprise_id: current.profile.entreprise_id },
        select: { id: true },
      });
      if (!chantier) return NextResponse.json({ error: 'Affectation vers un chantier hors périmètre.' }, { status: 403 });
    }
  }
  for (const key of ['date_prochaine_vidange','date_prochain_controle_technique','date_fin_assurance']) {
    if (data[key]) {
      const date = new Date(String(data[key]));
      if (!Number.isFinite(date.getTime())) return NextResponse.json({ error: `Date invalide : ${key}.` }, { status: 400 });
      data[key] = date;
    }
  }
  for (const key of ['kilometrage','compteur_heures','annee','km_prochaine_vidange','heures_prochaine_vidange']) {
    if (data[key] !== undefined && (!Number.isFinite(Number(data[key])) || Number(data[key]) < 0)) {
      return NextResponse.json({ error: `Valeur numérique invalide : ${key}.` }, { status: 400 });
    }
  }

  try {
    const row = await prisma.materielEngin.update({
      where: { id: target.id },
      data: data as any,
      include: { chantierActuel: true, entretiens: true, piecesRemplacables: true },
    });
    return NextResponse.json(row);
  } catch (error) {
    console.error('[materiel/parc PATCH]', error);
    return NextResponse.json({ error: 'Modification du matériel impossible.' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!isCompanyAdmin(current.profile) && !hasPermission(current.profile, 'MATERIEL', 'SUPPRIMER')) {
    return NextResponse.json({ error: 'Gestion du parc réservée au service matériel.' }, { status: 403 });
  }
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Identifiant matériel obligatoire.' }, { status: 400 });
  const target = await prisma.materielEngin.findFirst({
    where: { id, entreprise_id: current.profile.entreprise_id },
    select: { id: true },
  });
  if (!target) return NextResponse.json({ error: 'Matériel introuvable.' }, { status: 404 });
  const row = await prisma.materielEngin.update({ where: { id }, data: { statut_operationnel: 'HORS_SERVICE' } });
  return NextResponse.json({ success: true, materiel: row });
}
