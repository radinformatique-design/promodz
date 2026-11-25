/**
 * API Route : /api/approvisionnements/demandes
 * CRUD Demandes d'Achat via Supabase JS
 */
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('demandes_achat')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err: any) {
    console.error('[Supabase] demandes_achat GET erreur:', err?.message);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { data, error } = await supabaseAdmin
      .from('demandes_achat')
      .insert([body])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Erreur création demande achat', details: err?.message },
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
      .from('demandes_achat')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Erreur modification demande achat', details: err?.message },
      { status: 500 }
    );
  }
}
