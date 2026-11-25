/**
 * API Route : /api/approvisionnements/fournisseurs
 * CRUD Fournisseurs via Supabase JS
 */
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function isUUID(str: any): boolean {
  return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('fournisseurs')
      .select('*')
      .order('raison_sociale', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err: any) {
    console.error('[Supabase] fournisseurs GET erreur:', err?.message);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const payload: Record<string, any> = { ...body };

    if (!isUUID(payload.id)) {
      delete payload.id;
    }

    if (!isUUID(payload.entreprise_id)) {
      const { data: ent } = await supabaseAdmin.from('entreprises').select('id').limit(1);
      payload.entreprise_id = ent?.[0]?.id || '513079ed-613e-0fe5-c3d9-ab57381f80ea';
    }

    const { data, error } = await supabaseAdmin
      .from('fournisseurs')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('[Supabase] fournisseurs POST erreur:', err?.message);
    return NextResponse.json(
      { error: 'Erreur création fournisseur', details: err?.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('fournisseurs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Erreur modification fournisseur', details: err?.message },
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
      .from('fournisseurs')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Erreur suppression fournisseur', details: err?.message },
      { status: 500 }
    );
  }
}
