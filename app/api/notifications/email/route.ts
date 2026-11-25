/**
 * API Route : /api/notifications/email
 * Envoi des notifications par email à l'administrateur via Resend REST API
 */
import { NextResponse } from 'next/server';

interface EmailNotificationPayload {
  to?: string;
  titre: string;
  message: string;
  type?: string;
  module?: string;
  chantier_nom?: string;
  auteur?: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        skipped: true,
        reason: 'RESEND_API_KEY non configurée dans .env'
      });
    }

    const body = (await req.json()) as EmailNotificationPayload;
    const recipient = process.env.ADMIN_EMAIL?.trim() || body.to?.trim();

    if (!recipient) {
      return NextResponse.json(
        { success: false, skipped: true, reason: 'Aucune adresse email administrateur disponible.' },
        { status: 400 }
      );
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || 'BatiProm ERP <onboarding@resend.dev>';
    const appName = process.env.NEXT_PUBLIC_APP_NAME || 'BatiProm Algérie - ERP';
    const typeLabel = body.type || 'INFO';
    const moduleLabel = body.module || 'SYSTEME';
    const chantierLabel = body.chantier_nom ? ` · ${body.chantier_nom}` : '';

    const badgeColor =
      typeLabel === 'CRITIQUE'
        ? '#dc2626'
        : typeLabel === 'VALIDATION_REQUISE'
          ? '#d97706'
          : typeLabel === 'AVERTISSEMENT'
            ? '#ea580c'
            : '#059669';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: #0f172a; color: #ffffff; padding: 16px 24px;">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #34d399; font-weight: bold;">
            ${escapeHtml(appName)}
          </div>
          <h2 style="margin: 6px 0 0; font-size: 18px;">Nouvelle Notification ERP</h2>
        </div>
        <div style="padding: 20px 24px; background: #ffffff;">
          <div style="margin-bottom: 12px;">
            <span style="display: inline-block; background: ${badgeColor}; color: #ffffff; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 999px;">
              ${escapeHtml(typeLabel)}
            </span>
            <span style="font-size: 12px; color: #64748b; margin-left: 8px; font-weight: 600;">
              Module : ${escapeHtml(moduleLabel)}${escapeHtml(chantierLabel)}
            </span>
          </div>
          <h3 style="margin: 0 0 8px; font-size: 16px; color: #0f172a;">
            ${escapeHtml(body.titre || 'Notification')}
          </h3>
          <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.5; color: #334155;">
            ${escapeHtml(body.message || '')}
          </p>
          ${body.auteur ? `<p style="font-size: 12px; color: #64748b; margin: 0;">Action effectuée par : <strong>${escapeHtml(body.auteur)}</strong></p>` : ''}
        </div>
        <div style="background: #f8fafc; padding: 12px 24px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
          Notification automatique envoyée à l'administrateur · ${new Date().toLocaleString('fr-DZ')}
        </div>
      </div>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [recipient],
        subject: `[${typeLabel}] ${body.titre}`,
        html
      })
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('[Resend API] Erreur:', data);
      return NextResponse.json({ success: false, error: data?.message || 'Erreur envoi email' }, { status: res.status });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err: any) {
    console.error('[API /notifications/email] Erreur:', err?.message);
    return NextResponse.json({ success: false, error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
}
