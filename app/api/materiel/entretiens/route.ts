/**
 * API Route : /api/materiel/entretiens
 * CRUD Entretiens Véhicules via Supabase JS
 */
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('entretiens')
      .select('*')
      .order('date_entretien', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err: any) {
    console.error('[Supabase] entretiens GET erreur:', err?.message);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { data, error } = await supabaseAdmin
      .from('entretiens')
      .insert([{
        vehicule_id: body.vehicule_id,
        type: body.type,
        description: body.description,
        date_entretien: body.date || body.date_entretien,
        kilometrage_entretien: body.kilometrage_entretien || 0,
        heures_service_entretien: body.heures_entretien || 0,
        cout_dzd: body.cout || 0,
        garage_nom: body.garage_nom || null,
        statut: body.statut_operation || 'EFFECTUE',
        observations: body.piece_rechange_utilisee || null,
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Erreur enregistrement entretien", details: err?.message },
      { status: 500 }
    );
  }
}
