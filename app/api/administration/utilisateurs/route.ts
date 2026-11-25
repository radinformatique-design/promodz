import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function isUUID(str: any): boolean {
  return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function GET() {
  const { data, error } = await supabaseAdmin.from('utilisateurs').select('*').order('nom');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
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

    if (!isUUID(payload.role_id)) {
      const { data: r } = await supabaseAdmin.from('roles').select('id, code');
      const found = r?.find(x => x.code === payload.role_id || x.id === payload.role_id);
      payload.role_id = found?.id || r?.[0]?.id;
    }

    const { data, error } = await supabaseAdmin.from('utilisateurs').insert(payload).select().single();
    if (error) {
      console.error('[Supabase User Insert Error]', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

    if (updates.role_id && !isUUID(updates.role_id)) {
      const { data: r } = await supabaseAdmin.from('roles').select('id, code');
      const found = r?.find(x => x.code === updates.role_id || x.id === updates.role_id);
      if (found) updates.role_id = found.id;
      else delete updates.role_id;
    }

    let query = supabaseAdmin.from('utilisateurs').update(updates);
    if (isUUID(id)) {
      query = query.eq('id', id);
    } else if (updates.email) {
      query = query.eq('email', updates.email);
    } else {
      query = query.eq('id', id);
    }

    const { data, error } = await query.select();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data?.[0] || null);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

    let query = supabaseAdmin.from('utilisateurs').delete();
    if (isUUID(id)) {
      query = query.eq('id', id);
    } else {
      query = query.eq('id', id);
    }

    const { error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
}
