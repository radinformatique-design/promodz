import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getCurrentAppProfile, isCompanyAdmin } from '@/lib/auth/current-app-profile';

const AUTH_BAN_DURATION = '876000h';

export async function GET() {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!isCompanyAdmin(current.profile)) return NextResponse.json({ error: 'Droits administrateur requis.' }, { status: 403 });

  try {
    const users = await prisma.utilisateur.findMany({
      where: { entreprise_id: current.profile.entreprise_id },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
        affectations: { where: { est_actif: true }, include: { chantier: true } },
      },
      orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
    });

    return NextResponse.json(users.map((user) => {
      const { auth_user_id: _authUserId, affectations, ...safeUser } = user;
      return {
        ...safeUser,
        chantiers_assignes: affectations.map((assignment) => assignment.chantier_id),
      };
    }));
  } catch (error) {
    console.error('[GET /api/admin/users]', error);
    return NextResponse.json({ error: 'Impossible de charger les utilisateurs.' }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({
    error: 'La création manuelle par UUID est désactivée. Utilisez POST /api/admin/users/invite pour envoyer une invitation Auth vérifiée.',
  }, { status: 410 });
}

export async function PATCH(request: Request) {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!isCompanyAdmin(current.profile)) return NextResponse.json({ error: 'Droits administrateur requis.' }, { status: 403 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide.' }, { status: 400 });
  }

  const { id, chantiers_assignes, ...updates } = body ?? {};
  if (!id) return NextResponse.json({ error: 'Identifiant utilisateur obligatoire.' }, { status: 400 });
  if (Object.prototype.hasOwnProperty.call(updates, 'email')) {
    return NextResponse.json({ error: 'Modifiez l’adresse e-mail dans Supabase Auth puis synchronisez le profil.' }, { status: 400 });
  }

  const allowed: Record<string, unknown> = {};
  for (const key of ['nom', 'prenom', 'telephone', 'poste', 'type', 'role_id', 'statut', 'photo_url']) {
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      const value = updates[key];
      allowed[key] = typeof value === 'string' ? value.trim() : value;
    }
  }

  if (id === current.profile.id && allowed.statut && allowed.statut !== 'ACTIF') {
    return NextResponse.json({ error: 'Vous ne pouvez pas désactiver votre propre compte.' }, { status: 400 });
  }
  if ((allowed.nom !== undefined && !allowed.nom) || (allowed.prenom !== undefined && !allowed.prenom)) {
    return NextResponse.json({ error: 'Le nom et le prénom ne peuvent pas être vides.' }, { status: 400 });
  }
  if (allowed.role_id !== undefined && !allowed.role_id) {
    return NextResponse.json({ error: 'Sélectionnez un rôle valide.' }, { status: 400 });
  }

  const target = await prisma.utilisateur.findFirst({
    where: { id: String(id), entreprise_id: current.profile.entreprise_id },
    include: {
      role: true,
      affectations: { where: { est_actif: true }, select: { chantier_id: true } },
    },
  });
  if (!target) return NextResponse.json({ error: 'Utilisateur introuvable dans votre entreprise.' }, { status: 404 });

  const effectiveType = String(allowed.type ?? target.type);
  const effectiveRole = allowed.role_id !== undefined
    ? await prisma.role.findFirst({
        where: {
          id: String(allowed.role_id),
          OR: [{ entreprise_id: null }, { entreprise_id: current.profile.entreprise_id }],
        },
      })
    : target.role;

  if (!effectiveRole) return NextResponse.json({ error: 'Rôle inconnu ou appartenant à une autre entreprise.' }, { status: 400 });
  if (effectiveRole.code === 'ADMINISTRATEUR' && effectiveRole.entreprise_id !== current.profile.entreprise_id) {
    return NextResponse.json({ error: 'Le rôle administrateur doit être celui de votre entreprise.' }, { status: 400 });
  }

  const nextStatus = String(allowed.statut ?? target.statut);
  if (!['CENTRAL', 'CHANTIER'].includes(effectiveType)) {
    return NextResponse.json({ error: 'Type utilisateur invalide.' }, { status: 400 });
  }
  if (!['ACTIF', 'SUSPENDU', 'DESACTIVE'].includes(nextStatus)) {
    return NextResponse.json({ error: 'Statut utilisateur invalide.' }, { status: 400 });
  }
  if (effectiveType === 'CENTRAL' && effectiveRole.type_acces === 'CHANTIER') {
    return NextResponse.json({ error: 'Ce rôle est réservé aux utilisateurs chantier.' }, { status: 400 });
  }
  if (effectiveType === 'CHANTIER' && effectiveRole.type_acces === 'CENTRAL') {
    return NextResponse.json({ error: 'Ce rôle est réservé aux utilisateurs centraux.' }, { status: 400 });
  }

  if (chantiers_assignes !== undefined && !Array.isArray(chantiers_assignes)) {
    return NextResponse.json({ error: 'chantiers_assignes doit être un tableau.' }, { status: 400 });
  }
  const requestedChantierIds = Array.isArray(chantiers_assignes)
    ? [...new Set<string>(chantiers_assignes.map((value: unknown) => String(value).trim()).filter(Boolean))]
    : undefined;

  if (effectiveType === 'CENTRAL' && requestedChantierIds?.length) {
    return NextResponse.json({ error: 'Un utilisateur central ne reçoit pas d’affectation chantier.' }, { status: 400 });
  }
  if (effectiveType === 'CHANTIER' && requestedChantierIds !== undefined && requestedChantierIds.length === 0) {
    return NextResponse.json({ error: 'Un utilisateur chantier doit conserver au moins une affectation.' }, { status: 400 });
  }
  if (effectiveType === 'CHANTIER' && target.type !== 'CHANTIER' && requestedChantierIds === undefined) {
    return NextResponse.json({ error: 'Affectez au moins un chantier à ce nouvel utilisateur chantier.' }, { status: 400 });
  }
  if (effectiveType === 'CHANTIER' && requestedChantierIds === undefined && target.affectations.length === 0) {
    return NextResponse.json({ error: 'Un utilisateur chantier doit conserver au moins une affectation.' }, { status: 400 });
  }

  if (requestedChantierIds) {
    const valid = await prisma.chantier.findMany({
      where: { id: { in: requestedChantierIds }, entreprise_id: current.profile.entreprise_id },
      select: { id: true },
    });
    if (valid.length !== requestedChantierIds.length) {
      return NextResponse.json({ error: 'Une affectation ne correspond pas à votre entreprise.' }, { status: 403 });
    }
  }

  if (target.role.code === 'ADMINISTRATEUR' && (effectiveRole.code !== 'ADMINISTRATEUR' || nextStatus !== 'ACTIF')) {
    const activeAdmins = await prisma.utilisateur.count({
      where: { entreprise_id: current.profile.entreprise_id, statut: 'ACTIF', role: { code: 'ADMINISTRATEUR', entreprise_id: current.profile.entreprise_id } },
    });
    if (activeAdmins <= 1) {
      return NextResponse.json({ error: 'Impossible de désactiver ou rétrograder le dernier administrateur actif.' }, { status: 409 });
    }
  }

  let authBanChanged = false;
  if (nextStatus !== target.statut && target.auth_user_id) {
    try {
      const { error } = await createSupabaseAdminClient().auth.admin.updateUserById(target.auth_user_id, {
        ban_duration: nextStatus === 'ACTIF' ? 'none' : AUTH_BAN_DURATION,
      });
      if (error) throw error;
      authBanChanged = true;
    } catch (error) {
      console.error('[PATCH /api/admin/users] Supabase Auth status update failed:', error);
      return NextResponse.json({
        error: 'Supabase Auth n’a pas pu appliquer le changement de statut. Le profil PostgreSQL n’a pas été modifié.',
      }, { status: 502 });
    }
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const before = {
        nom: target.nom,
        prenom: target.prenom,
        type: target.type,
        role_id: target.role_id,
        statut: target.statut,
        chantiers_assignes: target.affectations.map((item) => item.chantier_id),
      };

      await tx.utilisateur.update({
        where: { id: target.id },
        data: allowed as any,
      });

      if (effectiveType === 'CENTRAL') {
        await tx.utilisateurChantier.deleteMany({ where: { utilisateur_id: target.id } });
      } else if (requestedChantierIds !== undefined) {
        await tx.utilisateurChantier.deleteMany({ where: { utilisateur_id: target.id } });
        await tx.utilisateurChantier.createMany({
          data: requestedChantierIds.map((chantier_id) => ({
            utilisateur_id: target.id,
            chantier_id,
          })),
        });
      }

      const profile = await tx.utilisateur.findUnique({
        where: { id: target.id },
        include: { role: true, affectations: { where: { est_actif: true } } },
      });

      await tx.auditLog.create({
        data: {
          entreprise_id: current.profile.entreprise_id,
          utilisateur_id: current.profile.id,
          module: 'ADMINISTRATION',
          action: 'MODIFICATION',
          table_nom: 'utilisateurs',
          enregistrement_id: target.id,
          description: 'Modification du profil utilisateur ' + target.email,
          donnees_anciennes: before as any,
          donnees_nouvelles: {
            ...before,
            ...allowed,
            chantiers_assignes: requestedChantierIds ?? (effectiveType === 'CENTRAL' ? [] : before.chantiers_assignes),
          } as any,
        },
      });

      return profile;
    });

    if (!updated) return NextResponse.json({ error: 'Profil modifié mais non retrouvé.' }, { status: 500 });
    const { auth_user_id: _authUserId, affectations, ...safeUser } = updated;
    return NextResponse.json({
      ...safeUser,
      chantiers_assignes: affectations.map((item) => item.chantier_id),
    });
  } catch (error) {
    if (authBanChanged && target.auth_user_id) {
      try {
        await createSupabaseAdminClient().auth.admin.updateUserById(target.auth_user_id, {
          ban_duration: target.statut === 'ACTIF' ? 'none' : AUTH_BAN_DURATION,
        });
      } catch (rollbackError) {
        console.error('[PATCH /api/admin/users] Auth status rollback failed:', rollbackError);
      }
    }
    console.error('[PATCH /api/admin/users]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Modification impossible.' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!isCompanyAdmin(current.profile)) return NextResponse.json({ error: 'Droits administrateur requis.' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Identifiant utilisateur obligatoire.' }, { status: 400 });
  if (id === current.profile.id) return NextResponse.json({ error: 'Vous ne pouvez pas désactiver votre propre profil.' }, { status: 400 });

  const target = await prisma.utilisateur.findFirst({
    where: { id, entreprise_id: current.profile.entreprise_id },
    include: { role: true },
  });
  if (!target) return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });

  if (target.role.code === 'ADMINISTRATEUR') {
    const admins = await prisma.utilisateur.count({
      where: { entreprise_id: current.profile.entreprise_id, statut: 'ACTIF', role: { code: 'ADMINISTRATEUR', entreprise_id: current.profile.entreprise_id } },
    });
    if (admins <= 1) return NextResponse.json({ error: 'Impossible de désactiver le dernier administrateur actif.' }, { status: 409 });
  }

  let authBanChanged = false;
  if (target.auth_user_id) {
    try {
      const { error } = await createSupabaseAdminClient().auth.admin.updateUserById(target.auth_user_id, {
        ban_duration: AUTH_BAN_DURATION,
      });
      if (error) throw error;
      authBanChanged = true;
    } catch (error) {
      console.error('[DELETE /api/admin/users] Supabase Auth ban failed:', error);
      return NextResponse.json({
        error: 'Supabase Auth n’a pas pu suspendre le compte. Le profil PostgreSQL n’a pas été modifié.',
      }, { status: 502 });
    }
  }

  try {
    const disabled = await prisma.$transaction(async (tx) => {
      const user = await tx.utilisateur.update({
        where: { id: target.id },
        data: { statut: 'DESACTIVE' },
        select: { id: true, statut: true },
      });

      await tx.auditLog.create({
        data: {
          entreprise_id: current.profile.entreprise_id,
          utilisateur_id: current.profile.id,
          module: 'ADMINISTRATION',
          action: 'SUPPRESSION',
          table_nom: 'utilisateurs',
          enregistrement_id: target.id,
          description: 'Désactivation contrôlée du profil ' + target.email + ' ; historique métier conservé.',
          donnees_anciennes: { statut: target.statut, role_id: target.role_id } as any,
          donnees_nouvelles: { statut: 'DESACTIVE', auth_banni: Boolean(target.auth_user_id) } as any,
        },
      });

      return user;
    });

    return NextResponse.json({
      success: true,
      user: disabled,
      auth_access_blocked: true,
      historique_conserve: true,
    });
  } catch (error) {
    if (authBanChanged && target.auth_user_id) {
      try {
        await createSupabaseAdminClient().auth.admin.updateUserById(target.auth_user_id, {
          ban_duration: target.statut === 'ACTIF' ? 'none' : AUTH_BAN_DURATION,
        });
      } catch (rollbackError) {
        console.error('[DELETE /api/admin/users] Auth status rollback failed:', rollbackError);
      }
    }
    console.error('[DELETE /api/admin/users]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Désactivation impossible.' }, { status: 400 });
  }
}
