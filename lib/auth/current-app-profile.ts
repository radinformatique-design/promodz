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
      affectations: { where: { est_actif: true } },
    },
  });

  if (!profile || profile.statut !== 'ACTIF') return null;
  return { authUser: user, profile };
}

export function assignedChantierIds(profile: { affectations: Array<{ chantier_id: string }> }) {
  return profile.affectations.map((assignment) => assignment.chantier_id);
}

export function isCompanyAdmin(profile: { role: { code: string } }) {
  return profile.role.code === 'ADMINISTRATEUR';
}
