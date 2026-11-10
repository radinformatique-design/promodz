import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentAppProfile, isCompanyAdmin } from '@/lib/auth/current-app-profile';

export const dynamic = 'force-dynamic';

export async function GET() {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!isCompanyAdmin(current.profile)) return NextResponse.json({ error: 'Droits administrateur requis.' }, { status: 403 });

  const users = await prisma.utilisateur.findMany({
    where: { entreprise_id: current.profile.entreprise_id },
    include: {
      role: { include: { permissions: { include: { permission: true } } } },
      affectations: { where: { est_actif: true }, include: { chantier: true } },
    },
    orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
  });
  return NextResponse.json(users.map((user) => ({
    ...user,
    chantiers_assignes: user.affectations.map((assignment) => assignment.chantier_id),
  })));
}

export async function POST(request: Request) {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!isCompanyAdmin(current.profile)) return NextResponse.json({ error: 'Droits administrateur requis.' }, { status: 403 });

  const body = await request.json();
  const { auth_user_id, nom, prenom, email, telephone, poste, type, role_id, statut, photo_url, chantiers_assignes = [] } = body ?? {};
  if (!auth_user_id || !nom || !prenom || !email || !role_id || !['CENTRAL', 'CHANTIER'].includes(type)) {
    return NextResponse.json({ error: 'Données utilisateur incomplètes.' }, { status: 400 });
  }

  const role = await prisma.role.findUnique({ where: { id: role_id } });
  if (!role) return NextResponse.json({ error: 'Rôle introuvable.' }, { status: 400 });
  if (type === 'CENTRAL' && role.type_acces === 'CHANTIER') return NextResponse.json({ error: 'Ce rôle est réservé aux utilisateurs chantier.' }, { status: 400 });
  if (type === 'CHANTIER' && role.type_acces === 'CENTRAL') return NextResponse.json({ error: 'Ce rôle est réservé aux utilisateurs centraux.' }, { status: 400 });

  const chantierIds = Array.isArray(chantiers_assignes) ? [...new Set(chantiers_assignes)] : [];
  if (type === 'CHANTIER' && chantierIds.length === 0) {
    return NextResponse.json({ error: 'Un utilisateur de chantier doit être affecté à au moins un chantier.' }, { status: 400 });
  }
  const validChantiers = await prisma.chantier.findMany({
    where: { id: { in: chantierIds }, entreprise_id: current.profile.entreprise_id },
    select: { id: true },
  });
  if (validChantiers.length !== chantierIds.length) {
    return NextResponse.json({ error: 'Une ou plusieurs affectations ne correspondent pas à votre entreprise.' }, { status: 403 });
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.utilisateur.create({
        data: {
          auth_user_id,
          entreprise_id: current.profile.entreprise_id,
          nom, prenom, email: String(email).trim().toLowerCase(),
          telephone: telephone || '',
          poste: poste || '',
          type,
          role_id,
          statut: statut || 'ACTIF',
          photo_url: photo_url || null,
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
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('[admin/users POST]', error);
    return NextResponse.json({ error: 'Création du profil impossible. Vérifiez que le compte existe dans Supabase Auth et que son UUID est correct.' }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!isCompanyAdmin(current.profile)) return NextResponse.json({ error: 'Droits administrateur requis.' }, { status: 403 });

  const body = await request.json();
  const { id, chantiers_assignes, ...updates } = body ?? {};
  if (!id) return NextResponse.json({ error: 'Identifiant utilisateur obligatoire.' }, { status: 400 });
  const allowed: Record<string, unknown> = {};
  for (const key of ['nom', 'prenom', 'email', 'telephone', 'poste', 'type', 'role_id', 'statut', 'photo_url']) {
    if (Object.prototype.hasOwnProperty.call(updates, key)) allowed[key] = updates[key];
  }

  if (id === current.profile.id && updates.statut && updates.statut !== 'ACTIF') {
    return NextResponse.json({ error: 'Vous ne pouvez pas désactiver votre propre compte.' }, { status: 400 });
  }

  const target = await prisma.utilisateur.findFirst({
    where: { id, entreprise_id: current.profile.entreprise_id },
    include: { role: true },
  });
  if (!target) return NextResponse.json({ error: 'Utilisateur introuvable dans votre entreprise.' }, { status: 404 });
  const nextRoleCode = allowed.role_id
    ? (await prisma.role.findUnique({ where: { id: String(allowed.role_id) }, select: { code: true } }))?.code
    : target.role.code;
  const nextStatus = String(allowed.statut || target.statut);
  if (target.role.code === 'ADMINISTRATEUR' && (nextRoleCode !== 'ADMINISTRATEUR' || nextStatus !== 'ACTIF')) {
    const activeAdmins = await prisma.utilisateur.count({
      where: { entreprise_id: current.profile.entreprise_id, statut: 'ACTIF', role: { code: 'ADMINISTRATEUR' } },
    });
    if (activeAdmins <= 1) return NextResponse.json({ error: 'Impossible de désactiver ou rétrograder le dernier administrateur actif.' }, { status: 409 });
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'email')) return NextResponse.json({ error: 'Modifiez l’adresse e-mail dans Supabase Auth puis synchronisez le profil.' }, { status: 400 });

  if (allowed.role_id) {
    const role = await prisma.role.findUnique({ where: { id: String(allowed.role_id) } });
    if (!role) return NextResponse.json({ error: 'Rôle inconnu.' }, { status: 400 });
    const effectiveType = String(allowed.type || target.type);
    if (effectiveType === 'CENTRAL' && role.type_acces === 'CHANTIER') return NextResponse.json({ error: 'Ce rôle est réservé aux utilisateurs chantier.' }, { status: 400 });
    if (effectiveType === 'CHANTIER' && role.type_acces === 'CENTRAL') return NextResponse.json({ error: 'Ce rôle est réservé aux utilisateurs centraux.' }, { status: 400 });
  }

  if (chantiers_assignes !== undefined && !Array.isArray(chantiers_assignes)) {
    return NextResponse.json({ error: 'chantiers_assignes doit être un tableau.' }, { status: 400 });
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.utilisateur.update({ where: { id }, data: allowed });
      if (Array.isArray(chantiers_assignes)) {
        const ids = [...new Set(chantiers_assignes)];
        if ((allowed.type || target.type) === 'CHANTIER' && ids.length === 0) {
          throw new Error('Un utilisateur de chantier doit conserver au moins une affectation.');
        }
        const valid = await tx.chantier.findMany({
          where: { id: { in: ids }, entreprise_id: current.profile.entreprise_id },
          select: { id: true },
        });
        if (valid.length !== ids.length) throw new Error('Affectation hors périmètre entreprise.');
        await tx.utilisateurChantier.deleteMany({ where: { utilisateur_id: id } });
        if (ids.length) {
          await tx.utilisateurChantier.createMany({
            data: ids.map((chantier_id: string) => ({ utilisateur_id: id, chantier_id })),
          });
        }
      }
      return tx.utilisateur.findUnique({
        where: { id },
        include: { role: true, affectations: { where: { est_actif: true } } },
      });
    });
    return NextResponse.json(updated);
  } catch (error) {
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
  if (id === current.profile.id) return NextResponse.json({ error: 'Vous ne pouvez pas supprimer votre propre profil.' }, { status: 400 });

  const target = await prisma.utilisateur.findFirst({
    where: { id, entreprise_id: current.profile.entreprise_id },
    include: { role: true },
  });
  if (!target) return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
  if (target.role.code === 'ADMINISTRATEUR') {
    const admins = await prisma.utilisateur.count({
      where: { entreprise_id: current.profile.entreprise_id, statut: 'ACTIF', role: { code: 'ADMINISTRATEUR' } },
    });
    if (admins <= 1) return NextResponse.json({ error: 'Impossible de supprimer le dernier administrateur actif.' }, { status: 400 });
  }

  await prisma.utilisateur.delete({ where: { id } });
  // Le compte Supabase Auth n'est pas supprimé ici : sa gestion reste dans Supabase Auth.
  return NextResponse.json({ success: true });
}
