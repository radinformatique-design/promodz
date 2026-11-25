/**
 * API Route : /api/chantiers
 * CRUD Chantiers via Supabase JS (HTTPS port 443)
 */
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function isUUID(str: any): boolean {
  return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

const CHANTIER_COLUMNS = [
  'entreprise_id', 'code_chantier', 'nom_projet', 'description',
  'wilaya', 'commune', 'adresse_site', 'superficie_terrain_m2',
  'surface_plancher_m2', 'nombre_logements', 'nombre_locaux_commerciaux',
  'nombre_niveaux', 'permis_construire_ref', 'date_obtention_permis',
  'date_ouverture_chantier', 'date_livraison_prevue', 'budget_global_prevu',
  'budget_engage', 'statut', 'taux_avancement_physique',
  'directeur_chantier_id', 'conducteur_travaux_id'
];

async function getValidEntrepriseId(providedId?: string): Promise<string> {
  if (isUUID(providedId)) return providedId!;
  const { data } = await supabaseAdmin.from('entreprises').select('id').limit(1);
  return data?.[0]?.id || '513079ed-613e-0fe5-c3d9-ab57381f80ea';
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('chantiers')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err: any) {
    console.error('[Supabase] chantiers GET erreur:', err?.message);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const entreprise_id = await getValidEntrepriseId(body.entreprise_id);

    const payload: Record<string, any> = {
      entreprise_id,
      updated_at: new Date().toISOString()
    };

    if (isUUID(body.id)) {
      payload.id = body.id;
    }

    for (const key of CHANTIER_COLUMNS) {
      if (key in body && body[key] !== undefined && key !== 'entreprise_id') {
        payload[key] = body[key];
      }
    }

    const { data, error } = await supabaseAdmin
      .from('chantiers')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('[Supabase] chantiers POST erreur:', err?.message);
    return NextResponse.json(
      { error: 'Erreur création chantier', details: err?.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

    const payload: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    for (const key of CHANTIER_COLUMNS) {
      if (key in updates && updates[key] !== undefined) {
        if (key === 'entreprise_id') {
          payload.entreprise_id = await getValidEntrepriseId(updates[key]);
        } else {
          payload[key] = updates[key];
        }
      }
    }

    const { data, error } = await supabaseAdmin
      .from('chantiers')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[Supabase] chantiers PUT erreur:', err?.message);
    return NextResponse.json(
      { error: 'Erreur modification chantier', details: err?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('chantiers')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Supabase] chantiers DELETE erreur:', err?.message);
    return NextResponse.json(
      { error: 'Erreur suppression chantier', details: err?.message },
      { status: 500 }
    );
  }
}
