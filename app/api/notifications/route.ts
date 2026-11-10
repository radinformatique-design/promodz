import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentAppProfile } from '@/lib/auth/current-app-profile';

export const dynamic = 'force-dynamic';

export async function GET() {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  const rows = await prisma.notification.findMany({
    where: { destinataire_id: current.profile.id },
    orderBy: { created_at: 'desc' },
    take: 100,
  });
  return NextResponse.json(rows);
}

export async function PATCH(request: Request) {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  const body = await request.json();
  if (body?.id) {
    const result = await prisma.notification.updateMany({
      where: { id: String(body.id), destinataire_id: current.profile.id },
      data: { est_lue: true, date_lecture: new Date() },
    });
    if (!result.count) return NextResponse.json({ error: 'Notification introuvable.' }, { status: 404 });
    return NextResponse.json({ success: true });
  }
  if (body?.toutes_lues === true) {
    await prisma.notification.updateMany({
      where: { destinataire_id: current.profile.id, est_lue: false },
      data: { est_lue: true, date_lecture: new Date() },
    });
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: 'Indiquez une notification ou toutes_lues=true.' }, { status: 400 });
}
