import { Utilisateur, RolePermission, ModuleCode, PermissionAction, Notification } from '../types/database';
import { SLUG_TO_UUID, UUID_TO_SLUG, getAllRoleIdentifiers } from '../data/systemConstants';

/**
 * Matrice de Cloisonnement Modulaire Strict - BatiProm Algérie
 * Chaque service (Chantier ou Siège Central) ne voit que son espace métier dédié
 * et les outils transversaux indispensables (Documents GED, Notifications, Messagerie).
 */

// Tous les modules de la plateforme pour l'Administrateur et le Gérant de l'Entreprise
export const ALL_NAV_ITEMS: string[] = [
  'dashboard',
  'gerant',
  'chantiers',
  'suivi-travaux',
  'metres',
  'pointage',
  'materiel',
  'approvisionnements',
  'magasin',
  'rh',
  'commercial',
  'comptabilite',
  'juridique',
  'administration',
  'notifications',
  'messagerie',
  'documents',
  'parametres'
];

// Sections visibles dans la barre latérale pour le Gérant de l'Entreprise
// (Les autres modules métiers sont consultables directement depuis son Espace Gérant dédié)
export const GERANT_NAV_ITEMS: string[] = [
  'dashboard',
  'gerant',
  'administration',
  'documents',
  'notifications',
  'messagerie'
];

/**
 * Détermine si l'utilisateur est le Gérant de l'Entreprise
 */
export function isUserGerant(user: Utilisateur | null): boolean {
  if (!user) return false;
  const poste = user.poste?.toLowerCase() || '';
  return (
    user.role_id === 'role-gerant' ||
    user.role_id === '7c9e6679-7425-40de-944b-e07fc1f90ae7' ||
    poste.includes('gérant') ||
    poste.includes('gerant')
  );
}

/**
 * Détermine si l'utilisateur est administrateur central (ou Gérant avec privilèges admin)
 */
export function isUserAdmin(user: Utilisateur | null): boolean {
  if (!user) return false;
  return (
    isUserGerant(user) ||
    user.role_id === 'role-admin' ||
    user.role_id === 'e1765d0a-e4f1-6f94-9f3c-d757a576d60e' ||
    (user.poste?.toLowerCase().includes('admin') ?? false)
  );
}

/**
 * Vérifie si une permission explicite existe dans la matrice pour un utilisateur donné
 */
export function hasExplicitPermission(
  user: Utilisateur | null,
  module: ModuleCode,
  action: PermissionAction = 'CONSULTER',
  rolePermissions?: RolePermission[]
): boolean {
  if (!user) return false;
  if (isUserAdmin(user)) return true;
  if (!rolePermissions || rolePermissions.length === 0) return false;

  const permId = `perm-${module.toLowerCase()}-${action.toLowerCase()}`;
  const userRoleIds = getAllRoleIdentifiers(user.role_id);

  return rolePermissions.some(
    rp => userRoleIds.includes(rp.role_id) && rp.permission_id === permId
  );
}

/**
 * Renvoie la liste stricte des identifiants de navigation autorisés pour un utilisateur
 */
export function getAllowedNavItemsForUser(
  user: Utilisateur | null,
  rolePermissions?: RolePermission[]
): string[] {
  if (!user) return [];

  // 0. Gérant de l'Entreprise : barre latérale épurée (Espace Gérant + outils transversaux)
  if (isUserGerant(user)) {
    return GERANT_NAV_ITEMS;
  }

  // 1. Administrateur Central : accès total
  if (isUserAdmin(user)) {
    return ALL_NAV_ITEMS;
  }

  const roleId = user.role_id?.toLowerCase() || '';
  const poste = user.poste?.toLowerCase() || '';

  let items: string[] = [];

  // 2. Responsable Ressources Humaines (Central)
  if (
    roleId === 'role-rh' ||
    roleId === '47481389-df1b-1ae3-cebc-9213b5db25e8' ||
    poste.includes('rh') ||
    poste.includes('ressources humaines')
  ) {
    items = ['dashboard', 'rh', 'pointage', 'documents', 'notifications', 'messagerie'];
  }
  // 3. Responsable Juridique & Foncier (Central)
  else if (
    roleId === 'role-juridique' ||
    roleId === 'ae2020b4-4381-879f-28c3-228a3ba1cc49' ||
    poste.includes('juridique') ||
    poste.includes('foncier')
  ) {
    items = ['dashboard', 'juridique', 'documents', 'notifications', 'messagerie'];
  }
  // 4. Responsable Comptabilité & Fiscalité (Central)
  else if (
    roleId === 'role-compta' ||
    roleId === '86a07c80-912a-40cb-225a-5c36f3544552' ||
    poste.includes('compta') ||
    poste.includes('finance')
  ) {
    items = ['dashboard', 'comptabilite', 'documents', 'notifications', 'messagerie'];
  }
  // 5. Responsable Technique & BET (Central)
  else if (
    roleId === 'role-tech' ||
    roleId === '985e2ed0-5886-d4f7-c123-669cf03a7b62' ||
    poste.includes('technique')
  ) {
    items = ['dashboard', 'chantiers', 'metres', 'documents', 'notifications', 'messagerie'];
  }
  // 6. Responsable Matériel & Parc Engins (Central)
  else if (
    roleId === 'role-materiel' ||
    roleId === 'd68d9128-6c26-32f0-9b85-b75e7490db56' ||
    poste.includes('matériel') ||
    poste.includes('materiel')
  ) {
    items = ['dashboard', 'materiel', 'documents', 'notifications', 'messagerie'];
  }
  // 7. Responsable Commercial & VEFA (Central)
  else if (
    roleId === 'role-commercial' ||
    roleId === '6b7e72e0-6c02-00c3-15c7-810cdb758f5d' ||
    poste.includes('commercial') ||
    poste.includes('vefa') ||
    poste.includes('vente')
  ) {
    items = ['dashboard', 'commercial', 'documents', 'notifications', 'messagerie'];
  }
  // 8. Responsable Approvisionnements & Achats (Central)
  else if (
    roleId === 'role-appro' ||
    roleId === '4e1c39b0-5a34-d50e-d553-7b7559949d36' ||
    poste.includes('appro') ||
    poste.includes('achat')
  ) {
    // Le service Approvisionnements centrale consulte les stocks des chantiers
    // DEPUIS son propre module (onglet dédié), pas via le module Magasin directement
    items = ['dashboard', 'approvisionnements', 'documents', 'notifications', 'messagerie'];
  }
  // 9. Conducteur de Travaux (Chantier)
  else if (
    roleId === 'role-ct' ||
    roleId === '6232a05d-3700-8c1a-322e-837c79b95f21' ||
    poste.includes('conducteur')
  ) {
    items = ['dashboard', 'suivi-travaux', 'pointage', 'documents', 'notifications', 'messagerie'];
  }
  // 10. Métreur Vérificateur (Chantier)
  else if (
    roleId === 'role-metreur' ||
    roleId === 'ed23deee-c671-67bf-6d71-ab7f2129c34d' ||
    poste.includes('métreur') ||
    poste.includes('metreur')
  ) {
    items = ['dashboard', 'metres', 'documents', 'notifications', 'messagerie'];
  }
  // 11. Magasinier (Chantier)
  else if (
    roleId === 'role-magasinier' ||
    roleId === '2da437dc-9991-c1fb-90d4-03b657ed3843' ||
    poste.includes('magasinier')
  ) {
    // Par défaut, le magasinier est limité au Tableau de Bord dynamique, au Magasin, aux Notifications et à la Messagerie de chantier
    items = ['dashboard', 'magasin', 'notifications', 'messagerie'];
  } else {
    // Profil par défaut non reconnu : consultation minimale transversale + Tableau de bord
    items = ['dashboard', 'notifications', 'messagerie'];
  }

  // Filtrage ou ajout dynamique du module "documents" selon la matrice de permissions RBAC
  if (rolePermissions && rolePermissions.length > 0) {
    const hasDocPerm = hasExplicitPermission(user, 'DOCUMENTS', 'CONSULTER', rolePermissions);
    if (!hasDocPerm) {
      items = items.filter(id => id !== 'documents');
    } else if (!items.includes('documents')) {
      items.push('documents');
    }
  }

  return items;
}

/**
 * Renvoie le module principal de démarrage par défaut pour un utilisateur donné
 */
export function getDefaultNavForUser(user: Utilisateur | null): string {
  if (!user) return 'dashboard';
  // Tous les utilisateurs ont accès à leur Tableau de Bord dynamique personnalisé
  return 'dashboard';
}

/**
 * Vérifie si une route/navigation donnée est permise pour cet utilisateur
 */
export function isNavAllowedForUser(
  navId: string,
  user: Utilisateur | null,
  rolePermissions?: RolePermission[]
): boolean {
  if (!user) return false;
  if (isUserAdmin(user)) return true;
  const allowed = getAllowedNavItemsForUser(user, rolePermissions);
  return allowed.includes(navId);
}

const ROLE_ALLOWED_MODULES: Record<string, ModuleCode[]> = {
  'role-rh': ['RH', 'POINTAGE'],
  'role-juridique': ['JURIDIQUE', 'DOCUMENTS'],
  'role-compta': ['COMPTABILITE', 'APPROVISIONNEMENTS'],
  'role-tech': ['CHANTIERS', 'TECHNIQUE'],
  'role-materiel': ['MATERIEL'],
  'role-commercial': ['COMMERCIAL'],
  'role-appro': ['APPROVISIONNEMENTS', 'MAGASIN'],
  'role-ct': ['TECHNIQUE', 'CHANTIERS', 'MAGASIN', 'APPROVISIONNEMENTS', 'POINTAGE'],
  'role-metreur': ['TECHNIQUE', 'CHANTIERS'],
  'role-magasinier': ['MAGASIN', 'APPROVISIONNEMENTS']
};

const LEGACY_USER_ID_BY_ROLE: Record<string, string> = {
  'role-rh': 'user-rh',
  'role-juridique': 'user-juridique',
  'role-compta': 'user-compta',
  'role-tech': 'user-tech',
  'role-materiel': 'user-materiel',
  'role-commercial': 'user-commercial',
  'role-appro': 'user-appro',
  'role-ct': 'user-ct',
  'role-metreur': 'user-metreur',
  'role-magasinier': 'user-magasinier'
};

/**
 * Détermine si une notification concerne réellement l'utilisateur connecté.
 * - Admin / Gérant : visibilité globale.
 * - Utilisateur CHANTIER : restreint à ses chantiers assignés.
 * - Ciblage strict par destinataire_id, destinataire_role ou module autorisé.
 */
export function isNotificationRelevantForUser(
  notif: Notification,
  user: Utilisateur | null
): boolean {
  if (!user) return false;
  if (isUserAdmin(user)) return true;

  // Isolement strict par chantier pour les comptes de site
  if (user.type === 'CHANTIER' && notif.chantier_id) {
    if (!user.chantiers_assignes || !user.chantiers_assignes.includes(notif.chantier_id)) {
      return false;
    }
  }

  const canonicalRole = UUID_TO_SLUG[user.role_id] || user.role_id;
  const userRoleIds = getAllRoleIdentifiers(user.role_id);
  const allowedModules = ROLE_ALLOWED_MODULES[canonicalRole] || [];
  const legacyUserId = LEGACY_USER_ID_BY_ROLE[canonicalRole];

  const matchesRole = () => {
    if (!notif.destinataire_role) return false;
    const roleUpper = notif.destinataire_role.toUpperCase();
    if (roleUpper === 'ADMINISTRATEUR' || roleUpper === 'ADMIN' || roleUpper === 'DIRECTION') {
      return false;
    }
    if (userRoleIds.includes(notif.destinataire_role)) return true;
    if (user.poste && notif.destinataire_role.toLowerCase() === user.poste.toLowerCase()) return true;
    return allowedModules.some(m => roleUpper === m || roleUpper === `RESPONSABLE_${m}`);
  };

  if (notif.destinataire_id) {
    if (notif.destinataire_id === user.id) return true;
    if (legacyUserId && notif.destinataire_id === legacyUserId) return true;
    // Notification adressée nommément à un autre utilisateur (ex: 'user-admin')
    return matchesRole();
  }

  if (notif.destinataire_role) {
    return matchesRole();
  }

  // Notification sans destinataire explicite : filtrer par module métier de l'utilisateur
  return allowedModules.includes(notif.module);
}

