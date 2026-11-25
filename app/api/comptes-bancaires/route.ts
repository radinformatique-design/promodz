import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function isUUID(str: any): boolean {
  return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('comptes_bancaires')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let entreprise_id = body.entreprise_id;
    if (!isUUID(entreprise_id)) {
      const { data: ent } = await supabaseAdmin.from('entreprises').select('id').limit(1);
      entreprise_id = ent?.[0]?.id;
    }

    const payload: Record<string, any> = {
      entreprise_id,
      nom_banque: body.nom_banque || body.banque || 'Banque',
      code_banque: body.code_banque || '00',
      agence: body.agence || 'Centrale',
      titulaire: body.titulaire || 'BatiProm',
      rib: body.rib || `${Date.now()}`,
      iban: body.iban || null,
      swift_bic: body.swift_bic || null,
      devise: body.devise || 'DZD',
      actif: body.actif ?? true,
      is_compte_principal: body.is_compte_principal ?? false,
      type_compte: body.type_compte || 'COURANT'
    };

    if (isUUID(body.chantier_dedie_id)) {
      payload.chantier_dedie_id = body.chantier_dedie_id;
    }

    const { data, error } = await supabaseAdmin
      .from('comptes_bancaires')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('[API comptes_bancaires POST]', err);
    return NextResponse.json({ error: err?.message || 'Erreur création' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('comptes_bancaires')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erreur suppression' }, { status: 500 });
  }
}
