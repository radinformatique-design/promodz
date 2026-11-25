/**
 * API Route : /api/materiel/parc
 * CRUD Parc Véhicules via Supabase JS
 */
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('vehicules')
      .select('*')
      .order('immatriculation', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err: any) {
    console.error('[Supabase] vehicules (parc) GET erreur:', err?.message);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { data, error } = await supabaseAdmin
      .from('vehicules')
      .insert([{
        entreprise_id: body.entreprise_id,
        immatriculation: body.immatriculation,
        marque: body.marque,
        modele: body.modele,
        type_vehicule: body.categorie || 'VEHICULE_LEGER',
        annee_mise_en_service: body.annee || new Date().getFullYear(),
        couleur: body.couleur || null,
        numero_chassis: body.numero_chassis || null,
        puissance_fiscale: body.puissance || null,
        kilometrage_actuel: body.kilometrage || 0,
        heures_service_actuel: body.heures_fonctionnement || 0,
        chantier_actuel_id: body.chantier_id || null,
        chantier_actuel_nom: null,
        conducteur_attitré: body.conducteur_nom || null,
        statut: body.statut || 'DISPONIBLE',
        assurance_compagnie: body.assurance_compagnie || null,
        assurance_numero_police: body.assurance_police || null,
        assurance_date_debut: body.assurance_date_debut || null,
        assurance_date_fin: body.date_fin_assurance || null,
        visite_technique_date_fin: body.date_prochain_controle_technique || null,
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Erreur création véhicule', details: err?.message },
      { status: 500 }
    );
  }
}
