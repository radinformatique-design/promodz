import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('parametres_generaux')
      .select('*')
      .limit(1)
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    const validKeys = [
      'devise_principale', 'langue_defaut', 'is_rtl', 'format_date',
      'horaires_travail', 'heure_limite_pointage', 'notifications_config',
      'unites_mesure', 'exercices_comptables'
    ];
    const filteredUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const key of validKeys) {
      if (key in updates && updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    const { data: existing } = await supabaseAdmin
      .from('parametres_generaux')
      .select('id')
      .limit(1);

    const targetId = id || existing?.[0]?.id;

    if (!targetId) {
      const { data: ent } = await supabaseAdmin.from('entreprises').select('id').limit(1);
      filteredUpdates.entreprise_id = ent?.[0]?.id;
      const { data, error } = await supabaseAdmin
        .from('parametres_generaux')
        .insert([filteredUpdates])
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json(data);
    }

    const { data, error } = await supabaseAdmin
      .from('parametres_generaux')
      .update(filteredUpdates)
      .eq('id', targetId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[API Parametres PUT]', err);
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  return PUT(req);
}
