import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { ChatMessage } from '@/types/database';

function isUUID(str: any): boolean {
  return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversation_id');
    const chantierId = searchParams.get('chantier_id');

    let query = supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('module', 'MESSAGERIE')
      .order('created_at', { ascending: true });

    if (conversationId) {
      query = query.eq('lien_action', conversationId);
    }
    if (chantierId && isUUID(chantierId)) {
      query = query.eq('chantier_id', chantierId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[API Messagerie GET Error]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const messages: ChatMessage[] = (data || []).map(row => {
      const meta = row.historique_actions?.[0] || {};
      return {
        id: row.id,
        conversation_id: row.lien_action || (row.chantier_id ? `chantier_${row.chantier_id}` : row.destinataire_id ? `direct_${[row.expediteur_id, row.destinataire_id].filter(Boolean).sort().join('_')}` : 'general'),
        type: (row.type === 'CHANTIER' || row.type === 'DIRECT' || row.type === 'GENERAL' || row.type === 'GROUPE') ? row.type : 'GENERAL',
        expediteur_id: row.expediteur_id || 'usr-system',
        expediteur_nom: row.expediteur_nom || 'Utilisateur',
        expediteur_role: row.expediteur_role || undefined,
        destinataire_id: row.destinataire_id || undefined,
        destinataire_nom: row.destinataire_nom || undefined,
        chantier_id: row.chantier_id || undefined,
        chantier_nom: row.chantier_nom || undefined,
        contenu: row.message || '',
        pieces_jointes: meta.pieces_jointes || [],
        reference_contexte: meta.reference_contexte || undefined,
        group_info: meta.group_info || undefined,
        lu: !!row.lu,
        created_at: row.created_at
      };
    });

    return NextResponse.json(messages);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      conversation_id,
      type = 'GENERAL',
      expediteur_id,
      expediteur_nom,
      expediteur_role,
      destinataire_id,
      destinataire_nom,
      chantier_id,
      chantier_nom,
      contenu,
      pieces_jointes = [],
      reference_contexte = null,
      group_info = null
    } = body;

    if (!contenu || !contenu.trim()) {
      return NextResponse.json({ error: 'Le contenu du message est requis.' }, { status: 400 });
    }

    const titre = type === 'CHANTIER'
      ? `Canal: ${chantier_nom || 'Chantier'}`
      : type === 'DIRECT'
      ? `Message Direct: ${destinataire_nom || 'Collaborateur'}`
      : type === 'GROUPE'
      ? `Groupe: ${group_info?.nom || 'Discussion de Groupe'}`
      : 'Canal Général & Siège';

    const payload: Record<string, any> = {
      titre,
      message: contenu.trim(),
      module: 'MESSAGERIE',
      type: type,
      priorite: 'NORMALE',
      statut_validation: 'NON_APPLICABLE',
      expediteur_id: isUUID(expediteur_id) ? expediteur_id : null,
      expediteur_nom: expediteur_nom || 'Collaborateur BatiProm',
      expediteur_role: expediteur_role || null,
      destinataire_id: isUUID(destinataire_id) ? destinataire_id : null,
      destinataire_nom: destinataire_nom || null,
      chantier_id: isUUID(chantier_id) ? chantier_id : null,
      chantier_nom: chantier_nom || null,
      lien_action: conversation_id || 'general',
      lu: false,
      historique_actions: [{ pieces_jointes, reference_contexte, group_info }]
    };

    const { data, error } = await supabaseAdmin.from('notifications').insert(payload).select().single();
    if (error) {
      console.error('[API Messagerie POST Error]', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const newMessage: ChatMessage = {
      id: data.id,
      conversation_id: data.lien_action || conversation_id,
      type: data.type,
      expediteur_id: data.expediteur_id || expediteur_id,
      expediteur_nom: data.expediteur_nom,
      expediteur_role: data.expediteur_role,
      destinataire_id: data.destinataire_id,
      destinataire_nom: data.destinataire_nom,
      chantier_id: data.chantier_id,
      chantier_nom: data.chantier_nom,
      contenu: data.message,
      pieces_jointes,
      reference_contexte,
      group_info,
      lu: false,
      created_at: data.created_at
    };

    return NextResponse.json(newMessage, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, conversation_id, lu = true } = body;

    if (id) {
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ lu, date_lecture: new Date().toISOString() })
        .eq('id', id);

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, id });
    }

    if (conversation_id) {
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ lu: true, date_lecture: new Date().toISOString() })
        .eq('module', 'MESSAGERIE')
        .eq('lien_action', conversation_id);

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, conversation_id });
    }

    return NextResponse.json({ error: 'id ou conversation_id requis' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
}
