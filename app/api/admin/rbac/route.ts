import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentAppProfile, isCompanyAdmin } from '@/lib/auth/current-app-profile';

export async function GET() {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!isCompanyAdmin(current.profile)) return NextResponse.json({ error: 'Droits administrateur requis.' }, { status: 403 });

  const [roles, permissions, rolePermissions] = await Promise.all([
    prisma.role.findMany({ orderBy: { code: 'asc' } }),
    prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { action: 'asc' }] }),
    prisma.rolePermission.findMany(),
  ]);
  return NextResponse.json({ roles, permissions, rolePermissions });
}

export async function PUT() {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!isCompanyAdmin(current.profile)) return NextResponse.json({ error: 'Droits administrateur requis.' }, { status: 403 });

  return NextResponse.json({
    error: 'Le catalogue des rôles et permissions est actuellement un référentiel global. Sa modification est désactivée pour empêcher qu’un administrateur d’une entreprise ne modifie les droits des autres entreprises. La personnalisation par entreprise sera activée après le passage des rôles à un modèle multi-tenant.',
  }, { status: 409 });
}
