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
  return NextResponse.json(users);
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
