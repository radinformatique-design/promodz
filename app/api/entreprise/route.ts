import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('entreprises')
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
      'raison_sociale', 'nom_commercial', 'forme_juridique', 'capital_social',
      'rc', 'nif', 'nis', 'article_imposition', 'agrement_promoteur',
      'date_agrement', 'adresse_siege', 'wilaya', 'commune_siege',
      'code_postal', 'telephone', 'email', 'site_web', 'logo_url'
    ];
    const filteredUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const key of validKeys) {
      if (key in updates && updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    const { data: existing } = await supabaseAdmin.from('entreprises').select('id').limit(1);
    const targetId = id || existing?.[0]?.id;

    if (!targetId) {
      const { data, error } = await supabaseAdmin
        .from('entreprises')
        .insert([filteredUpdates])
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json(data);
    }

    const { data, error } = await supabaseAdmin
      .from('entreprises')
      .update(filteredUpdates)
      .eq('id', targetId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[API Entreprise PUT]', err);
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  return PUT(req);
}
