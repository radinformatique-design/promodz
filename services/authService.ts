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
  DEMO_UTILISATEURS,
  DEMO_ROLES,
  DEMO_PERMISSIONS,
  DEMO_ROLE_PERMISSIONS,
  DEMO_SESSIONS,
  MODULES_LIST
} from '../data/demoData';

// Simulated password hashes (default password for all demo accounts: "BatiProm@2026")
const DEFAULT_DEMO_PASSWORD = 'password123';
const USER_PASSWORDS: Record<string, string> = {
  'admin@batiprom-dz.com': DEFAULT_DEMO_PASSWORD,
  'rh@batiprom-dz.com': DEFAULT_DEMO_PASSWORD,
  'juridique@batiprom-dz.com': DEFAULT_DEMO_PASSWORD,
  'compta@batiprom-dz.com': DEFAULT_DEMO_PASSWORD,
  'technique@batiprom-dz.com': DEFAULT_DEMO_PASSWORD,
  'materiel@batiprom-dz.com': DEFAULT_DEMO_PASSWORD,
  'commercial@batiprom-dz.com': DEFAULT_DEMO_PASSWORD,
  'appro@batiprom-dz.com': DEFAULT_DEMO_PASSWORD,
  // Chantiers
  'conducteur.cheraga@batiprom-dz.com': DEFAULT_DEMO_PASSWORD,
  'metreur.cheraga@batiprom-dz.com': DEFAULT_DEMO_PASSWORD,
  'magasinier.cheraga@batiprom-dz.com': DEFAULT_DEMO_PASSWORD,
  'conducteur.oran@batiprom-dz.com': DEFAULT_DEMO_PASSWORD,
  'metreur.oran@batiprom-dz.com': DEFAULT_DEMO_PASSWORD,
  'magasinier.oran@batiprom-dz.com': DEFAULT_DEMO_PASSWORD,
  'conducteur.constantine@batiprom-dz.com': DEFAULT_DEMO_PASSWORD,
  'metreur.constantine@batiprom-dz.com': DEFAULT_DEMO_PASSWORD,
  'magasinier.constantine@batiprom-dz.com': DEFAULT_DEMO_PASSWORD
};

export interface VerificationResult {
  allowed: boolean;
  statusCode: 200 | 401 | 403;
  reason?: string;
  ruleViolated?: string;
}

export class AuthService {
  private users: Utilisateur[] = [...DEMO_UTILISATEURS];
  private roles: Role[] = [...DEMO_ROLES];
  private permissions: Permission[] = [...DEMO_PERMISSIONS];
  private rolePermissions: RolePermission[] = [...DEMO_ROLE_PERMISSIONS];
  private sessions: UserSession[] = [...DEMO_SESSIONS];
  private currentSessionToken: string | null = null;
  private currentAuthenticatedUser: Utilisateur | null = null;

  constructor() {
    // Initialise avec le premier utilisateur par défaut (Admin)
    const initialUser = this.users[0];
    this.currentAuthenticatedUser = initialUser;
    this.currentSessionToken = 'jwt_adm_session_live_8912';
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
    const expectedPassword = USER_PASSWORDS[cleanEmail] || DEFAULT_DEMO_PASSWORD;
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

  public resetPassword(email: string, newPassword?: string): { success: boolean; message: string; tempPassword?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const user = this.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      return { success: false, message: 'Aucun utilisateur trouvé avec cette adresse email.' };
    }

    const generatedPassword = newPassword || `BatiProm@${Math.floor(1000 + Math.random() * 9000)}`;
    USER_PASSWORDS[cleanEmail] = generatedPassword;
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

    const role = this.roles.find(r => r.id === user.role_id);
    const roleCode = role?.code;

    // RÈGLE 7 : L'administrateur possède une visibilité globale
    if (roleCode === 'ADMINISTRATEUR') {
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

    // RÈGLE 5 : Le magasinier ne voit QUE le magasin de son chantier (Approvisionnements / Stocks)
    if (roleCode === 'MAGASINIER') {
      if (module !== 'APPROVISIONNEMENTS' && module !== 'CHANTIERS' && module !== 'NOTIFICATIONS') {
        return {
          allowed: false,
          statusCode: 403,
          reason: `Règle N°5 : Le magasinier n'a accès qu'à la gestion des approvisionnements, réceptions et stocks du magasin de son chantier.`,
          ruleViolated: 'REGLE_5_MAGASINIER_ONLY_MAGASIN'
        };
      }
    }

    // RÈGLE 6 : Le métreur ne voit QUE les informations techniques autorisées de son chantier
    if (roleCode === 'METREUR_VERIFICATEUR') {
      if (module !== 'TECHNIQUE' && module !== 'CHANTIERS' && module !== 'DOCUMENTS' && module !== 'NOTIFICATIONS') {
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

    // RÈGLE 2 & 11 : Aucun accès par défaut sans autorisation explicite dans la matrice RBAC
    const permId = `perm-${module.toLowerCase()}-${action.toLowerCase()}`;
    const hasExplicitPermission = this.rolePermissions.some(
      rp => rp.role_id === user.role_id && rp.permission_id === permId
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

    USER_PASSWORDS[cleanEmail] = userData.initialPassword || DEFAULT_DEMO_PASSWORD;
    this.users.push(newUser);
    return newUser;
  }

  public updateUser(id: string, updates: Partial<Utilisateur>): Utilisateur {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error('Utilisateur introuvable.');
    }

    const user = this.users[userIndex];

    // Sécurité : interdire de désactiver le compte administrateur racine
    if (user.role_id === 'role-admin' && updates.statut && updates.statut !== 'ACTIF') {
      throw new Error('Impossible de désactiver le compte administrateur racine.');
    }

    this.users[userIndex] = {
      ...user,
      ...updates,
      updated_at: new Date().toISOString()
    };

    // Met à jour la session active si c'est l'utilisateur en cours
    if (this.currentAuthenticatedUser?.id === id) {
      this.currentAuthenticatedUser = this.users[userIndex];
    }

    return this.users[userIndex];
  }

  public deleteUserControlled(id: string): { success: boolean; message: string } {
    const user = this.users.find(u => u.id === id);
    if (!user) {
      return { success: false, message: 'Utilisateur introuvable.' };
    }

    if (user.role_id === 'role-admin') {
      return { success: false, message: 'Le compte Administrateur Principal ne peut pas être supprimé.' };
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
    if (roleId === 'role-admin') {
      throw new Error('Les permissions du rôle Administrateur sont protégées et globales.');
    }

    if (grant) {
      const exists = this.rolePermissions.some(rp => rp.role_id === roleId && rp.permission_id === permissionId);
      if (!exists) {
        this.rolePermissions.push({ role_id: roleId, permission_id: permissionId });
      }
    } else {
      this.rolePermissions = this.rolePermissions.filter(
        rp => !(rp.role_id === roleId && rp.permission_id === permissionId)
      );
    }
  }

  public saveConfigurableMatrix(updatedRolePermissions: RolePermission[]): void {
    // Conserve toujours les permissions de l'administrateur
    const adminPermissions = this.permissions.map(p => ({ role_id: 'role-admin', permission_id: p.id }));
    const nonAdminUpdates = updatedRolePermissions.filter(rp => rp.role_id !== 'role-admin');
    this.rolePermissions = [...adminPermissions, ...nonAdminUpdates];
  }
}

// Instance Singleton
export const authService = new AuthService();
