import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentAppProfile, assignedChantierIds } from '@/lib/auth/current-app-profile';

export async function GET() {
  try {
    const current = await getCurrentAppProfile();
    if (!current) return NextResponse.json({ error: 'Authentification requise ou profil BatiProm inactif.' }, { status: 401 });

    const { profile } = current;
    await prisma.utilisateur.update({
      where: { id: profile.id },
      data: { dernier_acces: new Date() },
    });

    const permissions = profile.role.permissions.map((item) => item.permission);
    const user = {
      ...profile,
      role: undefined,
      permissions: undefined,
      affectations: undefined,
      chantiers_assignes: assignedChantierIds(profile),
      updated_at: undefined,
    };

    return NextResponse.json({
      user,
      roles: [profile.role],
      permissions,
      rolePermissions: profile.role.permissions.map((item) => ({
        role_id: item.role_id,
        permission_id: item.permission_id,
      })),
    });
  } catch (error) {
    console.error('[auth/me]', error);
    return NextResponse.json({ error: 'Impossible de charger le profil utilisateur.' }, { status: 500 });
  }
}
