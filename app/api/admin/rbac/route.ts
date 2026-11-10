import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentAppProfile, isCompanyAdmin } from '@/lib/auth/current-app-profile';

export const dynamic = 'force-dynamic';

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

export async function PUT(request: Request) {
  const current = await getCurrentAppProfile();
  if (!current) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!isCompanyAdmin(current.profile)) return NextResponse.json({ error: 'Droits administrateur requis.' }, { status: 403 });

  const body = await request.json();
  const matrix = body?.rolePermissions;
  if (!Array.isArray(matrix)) return NextResponse.json({ error: 'La matrice rolePermissions est obligatoire.' }, { status: 400 });

  const [roles, permissions] = await Promise.all([
    prisma.role.findMany({ select: { id: true, code: true } }),
    prisma.permission.findMany({ select: { id: true } }),
  ]);
  const roleIds = new Set(roles.map((role) => role.id));
  const permissionIds = new Set(permissions.map((permission) => permission.id));
  const uniquePairs = new Map<string, { role_id: string; permission_id: string }>();

  for (const item of matrix) {
    if (!roleIds.has(item?.role_id) || !permissionIds.has(item?.permission_id)) {
      return NextResponse.json({ error: 'La matrice contient un rôle ou une permission inconnue.' }, { status: 400 });
    }
    const role = roles.find((entry) => entry.id === item.role_id);
    if (role?.code === 'ADMINISTRATEUR') continue;
    uniquePairs.set(item.role_id + ':' + item.permission_id, {
      role_id: item.role_id,
      permission_id: item.permission_id,
    });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { role: { code: { not: 'ADMINISTRATEUR' } } } });
      if (uniquePairs.size) await tx.rolePermission.createMany({ data: [...uniquePairs.values()] });
    });
    const rolePermissions = await prisma.rolePermission.findMany();
    return NextResponse.json({ success: true, rolePermissions });
  } catch (error) {
    console.error('[PUT /api/admin/rbac]', error);
    return NextResponse.json({ error: 'Enregistrement de la matrice RBAC impossible.' }, { status: 400 });
  }
}
