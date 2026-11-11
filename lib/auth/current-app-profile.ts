import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';

export async function getCurrentAppProfile() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const profile = await prisma.utilisateur.findUnique({
    where: { auth_user_id: user.id },
    include: {
      role: { include: { permissions: { include: { permission: true } } } },
      affectations: {
        where: { est_actif: true, OR: [{ date_fin: null }, { date_fin: { gte: new Date() } }] },
      },
    },
  });

  if (!profile || profile.statut !== 'ACTIF') return null;
  if (profile.role.entreprise_id && profile.role.entreprise_id !== profile.entreprise_id) return null;
  if (profile.role.code === 'ADMINISTRATEUR' && profile.role.entreprise_id !== profile.entreprise_id) return null;

  return { authUser: user, profile };
}

export function assignedChantierIds(profile: { affectations: Array<{ chantier_id: string }> }) {
  return profile.affectations.map((assignment) => assignment.chantier_id);
}

export function isCompanyAdmin(profile: {
  entreprise_id: string;
  role: { code: string; entreprise_id: string | null };
}) {
  return profile.role.code === 'ADMINISTRATEUR' && profile.role.entreprise_id === profile.entreprise_id;
}

export function hasAnyRole(profile: { role: { code: string } }, codes: string[]) {
  return codes.includes(profile.role.code);
}

export function hasPermission(
  profile: { role: { permissions: Array<{ permission: { module: string; action: string } }> } },
  module: string,
  action: string
) {
  return profile.role.permissions.some(
    (item) => item.permission.module === module && item.permission.action === action
  );
}
