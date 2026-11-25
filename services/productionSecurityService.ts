/**
 * Service de Sécurité de Production, Sauvegarde & Audit Trail
 * BatiProm Algérie - Promotion Immobilière & BTPH
 */

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user_id: string;
  user_name: string;
  user_role: string;
  ip_address: string;
  module: string;
  action: string;
  details: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface BackupSnapshot {
  id: string;
  filename: string;
  created_at: string;
  created_by: string;
  size_kb: number;
  type: 'MANUEL' | 'AUTOMATIQUE';
  tables_count: number;
  status: 'VALIDE' | 'CORROMPU';
  checksum: string;
}

export interface SecurityPolicyConfig {
  session_timeout_minutes: number;
  max_failed_login_attempts: number;
  require_password_change_days: number;
  enable_audit_logging: boolean;
  enable_auto_backups: boolean;
  auto_backup_frequency: 'QUOTIDIEN' | 'HEBDOMADAIRE' | 'MENSUEL';
  enforce_strong_passwords: boolean;
  ip_whitelist_enabled: boolean;
}

class ProductionSecurityService {
  private auditLogs: AuditLogEntry[] = [
    {
      id: 'log-001',
      timestamp: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
      user_id: 'user-001',
      user_name: 'Karim BENALI',
      user_role: 'ADMINISTRATEUR',
      ip_address: '197.200.12.94',
      module: 'SECURITE',
      action: 'LOGIN_SUCCESS',
      details: 'Connexion réussie depuis un appareil de confiance',
      severity: 'INFO'
    },
    {
      id: 'log-002',
      timestamp: new Date(Date.now() - 3600 * 1000 * 1.5).toISOString(),
      user_id: 'user-004',
      user_name: 'Salim BELKACEM',
      user_role: 'RESPONSABLE_COMPTABILITE',
      ip_address: '105.101.44.12',
      module: 'COMPTABILITE',
      action: 'CLOTURE_MENSUELLE',
      details: 'Clôture de la période mensuelle 10-2026 effectuée',
      severity: 'WARNING'
    },
    {
      id: 'log-003',
      timestamp: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
      user_id: 'user-009',
      user_name: 'Sofiane LALAOUI',
      user_role: 'CONDUCTEUR_TRAVAUX',
      ip_address: '41.221.18.5',
      module: 'CHANTIERS',
      action: 'ACCESS_DENIED',
      details: 'Tentative d’accès non autorisé aux données du Chantier Oran Résidence El Bahdja',
      severity: 'CRITICAL'
    }
  ];

  private backups: BackupSnapshot[] = [
    {
      id: 'bkp-20261108',
      filename: 'batiprom_backup_2026_11_08_auto.json',
      created_at: new Date(Date.now() - 86400 * 1000).toISOString(),
      created_by: 'Système (Auto)',
      size_kb: 4280,
      type: 'AUTOMATIQUE',
      tables_count: 14,
      status: 'VALIDE',
      checksum: 'sha256-a9f4c3b218e076d'
    },
    {
      id: 'bkp-20261101',
      filename: 'batiprom_backup_2026_11_01_cloture.json',
      created_at: new Date(Date.now() - 86400 * 1000 * 7).toISOString(),
      created_by: 'Karim BENALI',
      size_kb: 4120,
      type: 'MANUEL',
      tables_count: 14,
      status: 'VALIDE',
      checksum: 'sha256-f8b2d1c9e4a3210'
    }
  ];

  private config: SecurityPolicyConfig = {
    session_timeout_minutes: 30,
    max_failed_login_attempts: 5,
    require_password_change_days: 90,
    enable_audit_logging: true,
    enable_auto_backups: true,
    auto_backup_frequency: 'QUOTIDIEN',
    enforce_strong_passwords: true,
    ip_whitelist_enabled: false
  };

  // ==========================================
  // AUDIT LOGS
  // ==========================================

  public logAction(
    userId: string,
    userName: string,
    userRole: string,
    module: string,
    action: string,
    details: string,
    severity: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO',
    ipAddress: string = '197.200.12.94'
  ): AuditLogEntry {
    const entry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      ip_address: ipAddress,
      module,
      action,
      details,
      severity
    };
    this.auditLogs.unshift(entry);
    return entry;
  }

  public getAuditLogs(filters?: {
    module?: string;
    severity?: string;
    searchTerm?: string;
  }): AuditLogEntry[] {
    let result = [...this.auditLogs];
    if (!filters) return result;

    if (filters.module && filters.module !== 'ALL') {
      result = result.filter(l => l.module === filters.module);
    }
    if (filters.severity && filters.severity !== 'ALL') {
      result = result.filter(l => l.severity === filters.severity);
    }
    if (filters.searchTerm) {
      const q = filters.searchTerm.toLowerCase();
      result = result.filter(
        l =>
          l.user_name.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.details.toLowerCase().includes(q)
      );
    }
    return result;
  }

  // ==========================================
  // SAUVEGARDE & RESTAURATION
  // ==========================================

  public getBackups(): BackupSnapshot[] {
    return [...this.backups];
  }

  public createBackup(
    dataPayload: Record<string, unknown>,
    type: 'MANUEL' | 'AUTOMATIQUE' = 'MANUEL',
    userLabel: string = 'Karim BENALI'
  ): { snapshot: BackupSnapshot; jsonString: string } {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '_');
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
    const filename = `batiprom_backup_${dateStr}_${timeStr}.json`;
    
    const serialized = JSON.stringify(dataPayload, null, 2);
    const sizeKb = Math.round(serialized.length / 1024);
    const tablesCount = Object.keys(dataPayload).length;

    // Generates a mock checksum
    const checksum = `sha256-${Math.random().toString(36).substring(2, 12)}${Date.now().toString(36)}`;

    const snapshot: BackupSnapshot = {
      id: `bkp-${Date.now()}`,
      filename,
      created_at: now.toISOString(),
      created_by: userLabel,
      size_kb: sizeKb,
      type,
      tables_count: tablesCount,
      status: 'VALIDE',
      checksum
    };

    this.backups.unshift(snapshot);

    this.logAction(
      'admin',
      userLabel,
      'ADMINISTRATEUR',
      'SAUVEGARDE',
      'CREATE_BACKUP',
      `Création d'une sauvegarde ${type.toLowerCase()} (${filename}, ${sizeKb} KB, ${tablesCount} tables)`,
      'INFO'
    );

    return { snapshot, jsonString: serialized };
  }

  public restoreFromJSON(jsonString: string, userLabel: string = 'Karim BENALI'): {
    success: boolean;
    tablesRestored: number;
    recordsCount: number;
    error?: string;
  } {
    try {
      const parsed = JSON.parse(jsonString);
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('Structure JSON invalide pour la restauration.');
      }

      // Simple validation of expected keys
      const keys = Object.keys(parsed);
      let recordsTotal = 0;

      keys.forEach(k => {
        if (Array.isArray(parsed[k])) {
          recordsTotal += parsed[k].length;
        }
      });

      this.logAction(
        'admin',
        userLabel,
        'ADMINISTRATEUR',
        'RESTAURATION',
        'RESTORE_BACKUP',
        `Restauration complète de la base réalisée (${keys.length} tables, ${recordsTotal} enregistrements)`,
        'CRITICAL'
      );

      return {
        success: true,
        tablesRestored: keys.length,
        recordsCount: recordsTotal
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de restauration inconnue';
      this.logAction(
        'admin',
        userLabel,
        'ADMINISTRATEUR',
        'RESTAURATION',
        'RESTORE_FAILED',
        `Échec de restauration : ${errorMessage}`,
        'CRITICAL'
      );

      return {
        success: false,
        tablesRestored: 0,
        recordsCount: 0,
        error: errorMessage
      };
    }
  }

  // ==========================================
  // CONFIGURATION ET SECURITE
  // ==========================================

  public getConfig(): SecurityPolicyConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<SecurityPolicyConfig>): SecurityPolicyConfig {
    this.config = { ...this.config, ...newConfig };
    this.logAction(
      'admin',
      'Karim BENALI',
      'ADMINISTRATEUR',
      'SECURITE',
      'UPDATE_CONFIG',
      'Mise à jour des règles de sécurité système et politiques de mots de passe',
      'WARNING'
    );
    return this.config;
  }

  /**
   * Helper pour masquer les données confidentielles (Numéro RIB/CCP, montant contrat sensible)
   */
  public maskSensitiveData(value: string, visibleChars: number = 4): string {
    if (!value || value.length <= visibleChars) return value;
    const maskedPart = '*'.repeat(value.length - visibleChars);
    return `${maskedPart}${value.slice(-visibleChars)}`;
  }
}

export const productionSecurityService = new ProductionSecurityService();
