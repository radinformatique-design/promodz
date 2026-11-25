/**
 * Service de Sécurité et Authentification Centralisée - BatiProm Algérie
 * Implémentation stricte des règles de sécurité RBAC (Règles 1 à 10)
 */

import {
  Utilisateur,
  Role,
  Permission,
  RolePermission,
  UserSession,
  ModuleCode,
  PermissionAction,
  UserRole
} from '../types/database';
import {
  INITIAL_ADMIN_USER,
  INITIAL_GERANT_USER,
  SYSTEM_ROLES,
  SYSTEM_PERMISSIONS,
  SYSTEM_ROLE_PERMISSIONS,
  MODULES_LIST,
  SLUG_TO_UUID,
  getAllRoleIdentifiers
} from '../data/systemConstants';

// Default initial system password for administrative setup
const DEFAULT_SYSTEM_PASSWORD = 'password123';
const USER_PASSWORDS: Record<string, string> = {
  'admin@batiprom-dz.com': DEFAULT_SYSTEM_PASSWORD
};

function loadSavedPasswords(): Record<string, string> {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = localStorage.getItem('batiprom_user_passwords');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
  }
  return {};
}

function savePasswordsToStorage(passwords: Record<string, string>) {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem('batiprom_user_passwords', JSON.stringify(passwords));
    } catch (e) {}
  }
}

function loadSavedRolePermissions(): RolePermission[] | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = localStorage.getItem('batiprom_role_permissions');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
  }
  return null;
}

function saveRolePermissionsToStorage(rolePermissions: RolePermission[]) {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem('batiprom_role_permissions', JSON.stringify(rolePermissions));
    } catch (e) {}
  }
}

export interface VerificationResult {
  allowed: boolean;
  statusCode: 200 | 401 | 403;
  reason?: string;
  ruleViolated?: string;
}

export class AuthService {
  private users: Utilisateur[] = [INITIAL_ADMIN_USER, INITIAL_GERANT_USER];
  private roles: Role[] = [...SYSTEM_ROLES];
  private permissions: Permission[] = [...SYSTEM_PERMISSIONS];
  private rolePermissions: RolePermission[] = [...SYSTEM_ROLE_PERMISSIONS];
  private sessions: UserSession[] = [];
  private currentSessionToken: string | null = null;
  private currentAuthenticatedUser: Utilisateur | null = null;

  constructor() {
    const savedPerms = loadSavedRolePermissions();
    if (savedPerms && savedPerms.length > 0) {
      // Merger : les perms sauvegardées (matrice RBAC admin) + les perms système de base
      // Les perms sauvegardées ont priorité pour éviter les doublons, mais on ne perd jamais les perms système
      const savedSet = new Set(savedPerms.map(p => `${p.role_id}::${p.permission_id}`));
      const missingSystemPerms = SYSTEM_ROLE_PERMISSIONS.filter(
        sp => !savedSet.has(`${sp.role_id}::${sp.permission_id}`)
      );
      this.rolePermissions = [...savedPerms, ...missingSystemPerms];
    }
  }

  public setUsers(users: Utilisateur[]) {
    if (users && users.length > 0) {
      const hasGerant = users.some(
        u =>
          u.role_id === 'role-gerant' ||
          u.role_id === '7c9e6679-7425-40de-944b-e07fc1f90ae7' ||
          u.email.toLowerCase() === INITIAL_GERANT_USER.email.toLowerCase()
      );
      this.users = hasGerant ? [...users] : [...users, INITIAL_GERANT_USER];
      // Si l'utilisateur connecté existe dans les nouveaux utilisateurs, on le met à jour
      if (this.currentAuthenticatedUser) {
        const found = this.users.find(u => u.email.toLowerCase() === this.currentAuthenticatedUser?.email.toLowerCase() || u.id === this.currentAuthenticatedUser?.id);
        if (found) {
          this.currentAuthenticatedUser = found;
        }
      }
    }
  }

  public setRoles(roles: Role[]) {
    if (roles && roles.length > 0) {
      const hasGerantRole = roles.some(
        r => r.code === 'GERANT_ENTREPRISE' || r.id === '7c9e6679-7425-40de-944b-e07fc1f90ae7'
      );
      const gerantSystemRole = SYSTEM_ROLES.find(r => r.code === 'GERANT_ENTREPRISE');
      this.roles =
        !hasGerantRole && gerantSystemRole ? [...roles, gerantSystemRole] : [...roles];
    }
  }

  // ==========================================
  // 1. AUTHENTIFICATION & SESSIONS
  // ==========================================

  public async login(
    email: string,
    passwordAttempt: string,
    deviceInfo: string = 'Navigateur Web'
  ): Promise<{ success: boolean; user?: Utilisateur; token?: string; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const user = this.users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return { success: false, error: 'Identifiants invalides (email introuvable).' };
    }

    if (user.statut === 'DESACTIVE') {
      return { success: false, error: 'Compte désactivé. Veuillez contacter l’administrateur.' };
    }

    if (user.statut === 'SUSPENDU') {
      return { success: false, error: 'Compte temporairement suspendu pour des raisons de sécurité.' };
    }

    // Vérification mot de passe
    const expectedPassword = this.getUserPassword(cleanEmail);
    if (passwordAttempt !== expectedPassword) {
      return { success: false, error: 'Mot de passe erroné.' };
    }

    // Création session sécurisée
    const token = `jwt_${user.type.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newSession: UserSession = {
      id: `sess-${Date.now()}`,
      user_id: user.id,
      token,
      ip_address: '197.200.12.94',
      device_info: deviceInfo,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 12 * 3600 * 1000).toISOString(), // 12 heures
      is_revoked: false,
      last_activity: new Date().toISOString()
    };

    this.sessions.unshift(newSession);
    this.currentSessionToken = token;
    this.currentAuthenticatedUser = user;

    // Mise à jour date dernier accès
    user.dernier_acces = new Date().toISOString();

    return { success: true, user, token };
  }

  public logout(): void {
    if (this.currentSessionToken) {
      const activeSession = this.sessions.find(s => s.token === this.currentSessionToken);
      if (activeSession) {
        activeSession.is_revoked = true;
      }
    }
    this.currentSessionToken = null;
    this.currentAuthenticatedUser = null;
  }

  public getAuthenticatedUser(): Utilisateur | null {
    return this.currentAuthenticatedUser;
  }

  public setAuthenticatedUser(user: Utilisateur): void {
    this.currentAuthenticatedUser = user;
    // Crée une session si inexistante
    const token = `jwt_sim_${user.type.toLowerCase()}_${Date.now()}`;
    this.currentSessionToken = token;
    this.sessions.unshift({
      id: `sess-${Date.now()}`,
      user_id: user.id,
      token,
      ip_address: '197.200.12.94',
      device_info: 'Session Simulée (UI Switcher)',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
      is_revoked: false,
      last_activity: new Date().toISOString()
    });
  }

  public getSessionsForUser(userId: string): UserSession[] {
    return this.sessions.filter(s => s.user_id === userId && !s.is_revoked);
  }

  public revokeSession(sessionId: string): boolean {
    const sess = this.sessions.find(s => s.id === sessionId);
    if (sess) {
      sess.is_revoked = true;
      return true;
    }
    return false;
  }

  public getUserPassword(email: string): string {
    const cleanEmail = email.trim().toLowerCase();
    const storage = loadSavedPasswords();
    return storage[cleanEmail] || USER_PASSWORDS[cleanEmail] || DEFAULT_SYSTEM_PASSWORD;
  }

  public changePassword(
    email: string,
    currentPasswordAttempt: string,
    newPasswordAttempt: string
  ): { success: boolean; error?: string; message?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const user = this.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      return { success: false, error: 'Utilisateur introuvable.' };
    }

    const currentSaved = this.getUserPassword(cleanEmail);
    if (currentPasswordAttempt !== currentSaved) {
      return { success: false, error: 'L’ancien mot de passe saisi est incorrect.' };
    }

    if (!newPasswordAttempt || newPasswordAttempt.length < 6) {
      return { success: false, error: 'Le nouveau mot de passe doit comporter au moins 6 caractères.' };
    }

    if (newPasswordAttempt === currentSaved) {
      return { success: false, error: 'Le nouveau mot de passe doit être différent de l’ancien.' };
    }

    const storage = loadSavedPasswords();
    storage[cleanEmail] = newPasswordAttempt;
    USER_PASSWORDS[cleanEmail] = newPasswordAttempt;
    savePasswordsToStorage(storage);
    user.must_change_password = false;

    return {
      success: true,
      message: `Votre mot de passe a été modifié avec succès.`
    };
  }

  public resetPassword(email: string, newPassword?: string): { success: boolean; message: string; tempPassword?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const user = this.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      return { success: false, message: 'Aucun utilisateur trouvé avec cette adresse email.' };
    }

    const generatedPassword = newPassword || `BatiProm@${Math.floor(1000 + Math.random() * 9000)}`;
    const storage = loadSavedPasswords();
    storage[cleanEmail] = generatedPassword;
    USER_PASSWORDS[cleanEmail] = generatedPassword;
    savePasswordsToStorage(storage);
    user.must_change_password = true;

    return {
      success: true,
      message: `Le mot de passe a été réinitialisé avec succès pour ${user.prenom} ${user.nom}.`,
      tempPassword: generatedPassword
    };
  }

  // ==========================================
  // 2. MOTEUR DE VÉRIFICATION RBAC STRICT (RÈGLES 1 À 10)
  // ==========================================

  public verifyAccess(
    user: Utilisateur | null,
    module: ModuleCode,
    action: PermissionAction = 'CONSULTER',
    targetChantierId?: string | 'ALL'
  ): VerificationResult {
    // 0. Utilisateur authentifié requis
    if (!user) {
      return {
        allowed: false,
        statusCode: 401,
        reason: 'Authentification requise pour accéder à cette ressource.',
        ruleViolated: 'AUTH_REQUIRED'
      };
    }

    // Compte actif requis
    if (user.statut !== 'ACTIF') {
      return {
        allowed: false,
        statusCode: 403,
        reason: `Votre compte est actuellement ${user.statut.toLowerCase()}. Accès refusé.`,
        ruleViolated: 'ACCOUNT_INACTIVE'
      };
    }

    const role = this.roles.find(r => r.id === user.role_id || r.code === user.role_id);
    const roleCode = role?.code;

    // RÈGLE 7 : L'administrateur et le Gérant de l'Entreprise possèdent une visibilité et des privilèges complets
    if (
      roleCode === 'ADMINISTRATEUR' ||
      roleCode === 'GERANT_ENTREPRISE' ||
      user.role_id === 'role-admin' ||
      user.role_id === 'e1765d0a-e4f1-6f94-9f3c-d757a576d60e' ||
      user.role_id === 'role-gerant' ||
      user.role_id === '7c9e6679-7425-40de-944b-e07fc1f90ae7'
    ) {
      return { allowed: true, statusCode: 200 };
    }

    // Le Tableau de Bord dynamique est accessible à tout utilisateur authentifié et actif
    if (module === 'DASHBOARD') {
      return { allowed: true, statusCode: 200 };
    }

    // RÈGLE 1 : Un utilisateur de chantier ne doit JAMAIS accéder aux modules centraux
    const moduleMetadata = MODULES_LIST.find(m => m.code === module);
    if (user.type === 'CHANTIER') {
      if (moduleMetadata?.isCentralOnly) {
        return {
          allowed: false,
          statusCode: 403,
          reason: `Règle N°1 violée : Les utilisateurs de chantier (${role?.libelle}) n'ont pas l'autorisation d'accéder au module central "${moduleMetadata.libelle}".`,
          ruleViolated: 'REGLE_1_SITE_USER_BLOCKED_FROM_CENTRAL_MODULE'
        };
      }
    }

    // RÈGLE 4, 5, 6 : Cloisonnement strict au chantier assigné
    if (user.type === 'CHANTIER') {
      if (targetChantierId && targetChantierId !== 'ALL') {
        const isAssigned = user.chantiers_assignes.includes(targetChantierId);
        if (!isAssigned) {
          return {
            allowed: false,
            statusCode: 403,
            reason: `Règles N°4/5/6 violées : Vous n'êtes pas affecté à ce chantier spécifique. L'accès aux données des chantiers tiers est strictement interdit.`,
            ruleViolated: 'REGLE_4_SITE_USER_OUT_OF_SCOPE'
          };
        }
      } else if (targetChantierId === 'ALL') {
        return {
          allowed: false,
          statusCode: 403,
          reason: `Règle de cloisonnement : Un utilisateur de chantier ne peut pas consulter la vue consolidée de tous les chantiers.`,
          ruleViolated: 'REGLE_SITE_USER_NO_CONSOLIDATED_VIEW'
        };
      }
    }

    // RÈGLE 5 : Le magasinier a accès au module Magasin, Approvisionnements (réceptions), Dashboard et Notifications
    // Note : Les permissions fines (AJOUTER, MODIFIER, SUPPRIMER, VALIDER…) sont ensuite contrôlées par la matrice RBAC
    if (roleCode === 'MAGASINIER') {
      const allowedModules: ModuleCode[] = ['MAGASIN', 'APPROVISIONNEMENTS', 'CHANTIERS', 'NOTIFICATIONS', 'DASHBOARD', 'MESSAGERIE', 'DOCUMENTS'];
      if (!allowedModules.includes(module)) {
        return {
          allowed: false,
          statusCode: 403,
          reason: `Règle N°5 : Le magasinier n'a accès qu'au magasin de son chantier (stocks, bons de sortie, inventaires, réceptions). Le module "${module}" lui est interdit.`,
          ruleViolated: 'REGLE_5_MAGASINIER_RESTRICTED_MODULES'
        };
      }
    }

    // RÈGLE 6 : Le métreur ne voit QUE les informations techniques autorisées de son chantier
    if (roleCode === 'METREUR_VERIFICATEUR') {
      const metreurAllowedModules: ModuleCode[] = ['TECHNIQUE', 'CHANTIERS', 'DOCUMENTS', 'NOTIFICATIONS', 'MESSAGERIE', 'DASHBOARD'];
      if (!metreurAllowedModules.includes(module)) {
        return {
          allowed: false,
          statusCode: 403,
          reason: `Règle N°6 : Le métreur vérificateur n'a accès qu'aux informations techniques, métrés et plans de son chantier.`,
          ruleViolated: 'REGLE_6_METREUR_ONLY_TECHNICAL'
        };
      }
    }

    // RÈGLE 3 : Certains responsables centraux peuvent consulter les chantiers sans les modifier
    if (module === 'CHANTIERS') {
      if (['RESPONSABLE_JURIDIQUE', 'RESPONSABLE_COMPTABILITE', 'RESPONSABLE_MATERIEL', 'RESPONSABLE_COMMERCIAL', 'RESPONSABLE_APPROVISIONNEMENTS'].includes(roleCode || '')) {
        if (action !== 'CONSULTER') {
          return {
            allowed: false,
            statusCode: 403,
            reason: `Règle N°3 : En tant que ${role?.libelle}, vous disposez d'un droit de consultation sur les chantiers mais sans pouvoir modifier la fiche d'un chantier.`,
            ruleViolated: 'REGLE_3_CONSULTATION_ONLY'
          };
        }
      }
    }

    // RÈGLE 8 : Le Responsable Approvisionnements centrale n'accède pas au module Magasin directement.
    // Il consulte les stocks des chantiers depuis son propre module (onglet dédié), pas via MAGASIN.
    if (roleCode === 'RESPONSABLE_APPROVISIONNEMENTS' && module === 'MAGASIN') {
      return {
        allowed: false,
        statusCode: 403,
        reason: `Règle N°8 : Le service des Approvisionnements centrale ne gère pas directement le magasin. Les stocks des chantiers sont consultables depuis la section Approvisionnements (onglet "Stocks des Chantiers").`,
        ruleViolated: 'REGLE_8_APPRO_NO_DIRECT_MAGASIN'
      };
    }

    // RÈGLE 2 & 11 : Aucun accès par défaut sans autorisation explicite dans la matrice RBAC
    const permId = `perm-${module.toLowerCase()}-${action.toLowerCase()}`;
    // On vérifie avec tous les identifiants équivalents (slug ET UUID)
    const userRoleIds = getAllRoleIdentifiers(user.role_id);
    const hasExplicitPermission = this.rolePermissions.some(
      rp => userRoleIds.includes(rp.role_id) && rp.permission_id === permId
    );

    if (!hasExplicitPermission) {
      return {
        allowed: false,
        statusCode: 403,
        reason: `Règle N°11 : Action "${action}" non autorisée sur le module "${module}" pour le rôle "${role?.libelle}". Aucun accès n'est accordé sans autorisation explicite.`,
        ruleViolated: 'REGLE_11_NO_DEFAULT_ACCESS'
      };
    }

    return { allowed: true, statusCode: 200 };
  }

  // ==========================================
  // 3. GESTION DES UTILISATEURS (CRUD CONTRÔLÉ)
  // ==========================================

  public getAllUsers(): Utilisateur[] {
    return [...this.users];
  }

  public getUserById(id: string): Utilisateur | undefined {
    return this.users.find(u => u.id === id);
  }

  public createUser(userData: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    poste: string;
    type: 'CENTRAL' | 'CHANTIER';
    role_id: string;
    chantiers_assignes: string[];
    initialPassword?: string;
  }): Utilisateur {
    const cleanEmail = userData.email.trim().toLowerCase();
    const existing = this.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error(`Un utilisateur avec l'adresse email ${cleanEmail} existe déjà.`);
    }

    const newUser: Utilisateur = {
      id: `user-${Date.now()}`,
      entreprise_id: 'ent-001',
      nom: userData.nom.trim(),
      prenom: userData.prenom.trim(),
      email: cleanEmail,
      telephone: userData.telephone.trim(),
      poste: userData.poste.trim(),
      type: userData.type,
      role_id: userData.role_id,
      statut: 'ACTIF',
      chantiers_assignes: userData.chantiers_assignes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    USER_PASSWORDS[cleanEmail] = userData.initialPassword || DEFAULT_SYSTEM_PASSWORD;
    this.users.push(newUser);
    return newUser;
  }

  public updateUser(id: string, updates: Partial<Utilisateur>): Utilisateur {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error('Utilisateur introuvable.');
    }

    const user = this.users[userIndex];
    const isRootAdmin =
      user.email === 'admin@batiprom-dz.com' ||
      user.id === 'user-admin' ||
      user.role_id === 'role-admin' ||
      user.role_id === 'e1765d0a-e4f1-6f94-9f3c-d757a576d60e';

    // Sécurité : interdire de désactiver le compte administrateur racine
    if (isRootAdmin && updates.statut && updates.statut !== 'ACTIF') {
      throw new Error('Impossible de désactiver le compte administrateur racine.');
    }

    const normalizedUpdates: Partial<Utilisateur> = { ...updates };
    if (typeof normalizedUpdates.email === 'string') {
      const newEmail = normalizedUpdates.email.trim().toLowerCase();
      if (!newEmail || !newEmail.includes('@')) {
        throw new Error('Adresse email invalide.');
      }
      const duplicate = this.users.find(u => u.id !== id && u.email.toLowerCase() === newEmail);
      if (duplicate) {
        throw new Error(`L'adresse email "${newEmail}" est déjà utilisée par ${duplicate.prenom} ${duplicate.nom}.`);
      }

      const oldEmail = user.email.toLowerCase();
      if (oldEmail !== newEmail) {
        // Migrer le mot de passe stocké vers la nouvelle adresse email
        const storage = loadSavedPasswords();
        if (storage[oldEmail]) {
          storage[newEmail] = storage[oldEmail];
          delete storage[oldEmail];
          savePasswordsToStorage(storage);
        }
      }
      normalizedUpdates.email = newEmail;
    }

    this.users[userIndex] = {
      ...user,
      ...normalizedUpdates,
      updated_at: new Date().toISOString()
    };

    // Met à jour la session active si c'est l'utilisateur en cours
    if (
      this.currentAuthenticatedUser?.id === id ||
      this.currentAuthenticatedUser?.email?.toLowerCase() === user.email.toLowerCase()
    ) {
      this.currentAuthenticatedUser = this.users[userIndex];
    }

    return this.users[userIndex];
  }

  public deleteUserControlled(id: string): { success: boolean; message: string } {
    const user = this.users.find(u => u.id === id);
    if (!user) {
      return { success: false, message: 'Utilisateur introuvable.' };
    }

    if (user.email === 'admin@batiprom-dz.com') {
      return { success: false, message: 'Le compte Administrateur Principal racine ne peut pas être supprimé.' };
    }

    // Révocation de toutes les sessions actives
    this.sessions.forEach(s => {
      if (s.user_id === id) s.is_revoked = true;
    });

    this.users = this.users.filter(u => u.id !== id);
    delete USER_PASSWORDS[user.email.toLowerCase()];

    return { success: true, message: `L'utilisateur ${user.prenom} ${user.nom} a été supprimé.` };
  }

  // ==========================================
  // 4. GESTION DE LA MATRICE DES PERMISSIONS RBAC
  // ==========================================

  public getAllRoles(): Role[] {
    return [...this.roles];
  }

  public getAllPermissions(): Permission[] {
    return [...this.permissions];
  }

  public getRolePermissions(): RolePermission[] {
    return [...this.rolePermissions];
  }

  public updateRolePermission(roleId: string, permissionId: string, grant: boolean): void {
    if (roleId === 'role-admin' || roleId === 'e1765d0a-e4f1-6f94-9f3c-d757a576d60e') {
      throw new Error('Les permissions du rôle Administrateur sont protégées et globales.');
    }

    const idsToUpdate = getAllRoleIdentifiers(roleId);

    if (grant) {
      idsToUpdate.forEach(id => {
        const exists = this.rolePermissions.some(rp => rp.role_id === id && rp.permission_id === permissionId);
        if (!exists) {
          this.rolePermissions.push({ role_id: id, permission_id: permissionId });
        }
      });
    } else {
      this.rolePermissions = this.rolePermissions.filter(
        rp => !(idsToUpdate.includes(rp.role_id) && rp.permission_id === permissionId)
      );
    }
    saveRolePermissionsToStorage(this.rolePermissions);
  }

  public saveConfigurableMatrix(updatedRolePermissions: RolePermission[]): void {
    // Conserve toujours les permissions de l'administrateur
    const adminPermissions = [
      ...this.permissions.map(p => ({ role_id: 'role-admin', permission_id: p.id })),
      ...this.permissions.map(p => ({ role_id: 'e1765d0a-e4f1-6f94-9f3c-d757a576d60e', permission_id: p.id }))
    ];
    // On garde les non-admin
    const nonAdminBase = updatedRolePermissions.filter(
      rp => rp.role_id !== 'role-admin' && rp.role_id !== 'e1765d0a-e4f1-6f94-9f3c-d757a576d60e'
    );
    // On synchronise slug ET UUID pour chaque permission présente
    const nonAdminWithUUID = nonAdminBase.flatMap(rp => {
      const allIds = getAllRoleIdentifiers(rp.role_id);
      return allIds.map(id => ({ role_id: id, permission_id: rp.permission_id }));
    });
    // Déduplique
    const seen = new Set<string>();
    const deduplicated = nonAdminWithUUID.filter(rp => {
      const key = `${rp.role_id}__${rp.permission_id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    this.rolePermissions = [...adminPermissions, ...deduplicated];
    saveRolePermissionsToStorage(this.rolePermissions);
  }
}

// Instance Singleton
export const authService = new AuthService();
