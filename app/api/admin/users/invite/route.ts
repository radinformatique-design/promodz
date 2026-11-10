import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getCurrentAppProfile, isCompanyAdmin } from '@/lib/auth/current-app-profile';

export async function POST(request: Request) {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!isCompanyAdmin(current.profile)) return NextResponse.json({ error: 'Seul l’administrateur de l’entreprise peut inviter un utilisateur.' }, { status: 403 });

  const body = await request.json();
  const nom = String(body?.nom || '').trim();
  const prenom = String(body?.prenom || '').trim();
  const email = String(body?.email || '').trim().toLowerCase();
  const type = String(body?.type || '');
  const roleId = String(body?.role_id || '');
  const telephone = String(body?.telephone || '').trim();
  const poste = String(body?.poste || '').trim();
  const chantierIds = Array.isArray(body?.chantiers_assignes)
    ? [...new Set(body.chantiers_assignes.map((id: unknown) => String(id)))]
    : [];

  if (!nom || !prenom || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !roleId ||
      !['CENTRAL', 'CHANTIER'].includes(type) || !poste) {
    return NextResponse.json({ error: 'Nom, prénom, e-mail, poste, type et rôle sont obligatoires.' }, { status: 400 });
  }

  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role || (role.type_acces !== type && role.type_acces !== 'HYBRIDE')) {
    return NextResponse.json({ error: 'Rôle inexistant ou incompatible avec le périmètre choisi.' }, { status: 400 });
  }
  if (type === 'CHANTIER' && chantierIds.length === 0) {
    return NextResponse.json({ error: 'Un utilisateur chantier doit être affecté à au moins un chantier.' }, { status: 400 });
  }
  if (type === 'CENTRAL' && chantierIds.length > 0) {
    return NextResponse.json({ error: 'Un utilisateur central ne reçoit pas d’affectation chantier.' }, { status: 400 });
  }

  const validChantiers = await prisma.chantier.findMany({
    where: { id: { in: chantierIds }, entreprise_id: current.profile.entreprise_id },
    select: { id: true },
  });
  if (validChantiers.length !== chantierIds.length) {
    return NextResponse.json({ error: 'Une affectation ne correspond pas à votre entreprise.' }, { status: 403 });
  }

  let authUserId: string | null = null;
  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${appUrl.replace(/\/$/, '')}/auth/callback?next=/auth/reset-password`,
      data: { nom, prenom, entreprise_id: current.profile.entreprise_id },
    });
    if (error || !data.user) {
      return NextResponse.json({ error: error?.message || 'Supabase Auth n’a pas créé l’invitation.' }, { status: 400 });
    }
    authUserId = data.user.id;

    const profile = await prisma.$transaction(async (tx) => {
      const user = await tx.utilisateur.create({
        data: {
          auth_user_id: authUserId!,
          entreprise_id: current.profile.entreprise_id,
          nom,
          prenom,
          email,
          telephone,
          poste,
          type,
          role_id: roleId,
          statut: 'ACTIF',
        },
      });
      if (chantierIds.length) {
        await tx.utilisateurChantier.createMany({
          data: chantierIds.map((chantier_id: string) => ({ utilisateur_id: user.id, chantier_id })),
        });
      }
      return tx.utilisateur.findUnique({
        where: { id: user.id },
        include: { role: true, affectations: { where: { est_actif: true } } },
      });
    });

    return NextResponse.json({
      success: true,
      invitation_sent: true,
      message: `Invitation envoyée à ${email}.`,
      user: profile,
    }, { status: 201 });
  } catch (error) {
    if (authUserId) {
      try {
        const admin = createSupabaseAdminClient();
        await admin.auth.admin.deleteUser(authUserId);
      } catch (cleanupError) {
        console.error('[admin/users/invite cleanup]', cleanupError);
      }
    }
    console.error('[admin/users/invite]', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Impossible de créer le compte et son profil.',
    }, { status: 400 });
  }
}
