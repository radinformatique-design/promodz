'use client';

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Users,
  Key,
  History,
  Plus,
  Search,
  Check,
  X,
  Building,
  HardHat,
  Filter,
  Eye,
  FileCode,
  Lock,
  RotateCcw,
  UserX,
  UserCheck,
  Trash2,
  Edit,
  Save,
  Laptop,
  AlertTriangle,
  Layers,
  MapPin,
  ShieldAlert,
  Database,
  Download,
  Upload,
  BookOpen,
  FileCheck,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  Truck,
  Store,
  ShoppingCart,
  ReceiptText,
  Scale,
  Bell,
  Settings2,
  LayoutDashboard,
  Ruler,
  Building2,
  FolderOpen,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserType, AuditAction, ModuleCode, PermissionAction, Utilisateur } from '../types/database';
import { ACTIONS_LIST, MODULES_LIST } from '../data/demoData';
import { productionSecurityService, BackupSnapshot } from '../services/productionSecurityService';

const MODULE_ICONS: Record<ModuleCode, any> = {
  DASHBOARD: LayoutDashboard,
  CHANTIERS: HardHat,
  TECHNIQUE: Ruler,
  MATERIEL: Truck,
  MAGASIN: Store,
  APPROVISIONNEMENTS: ShoppingCart,
  RH: Users,
  COMMERCIAL: Building2,
  COMPTABILITE: ReceiptText,
  JURIDIQUE: Scale,
  ADMINISTRATION: ShieldCheck,
  DOCUMENTS: FolderOpen,
  NOTIFICATIONS: Bell,
  PARAMETRES: Settings2
};

const ACTION_CONFIG: Record<PermissionAction, { label: string; badge: string; desc: string }> = {
  CONSULTER: { label: 'Consulter', badge: 'bg-blue-50 text-blue-700 border-blue-200', desc: 'Lecture et consultation des données' },
  AJOUTER: { label: 'Ajouter', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', desc: 'Création de nouveaux enregistrements' },
  MODIFIER: { label: 'Modifier', badge: 'bg-amber-50 text-amber-700 border-amber-200', desc: 'Mise à jour et édition des données existantes' },
  SUPPRIMER: { label: 'Supprimer', badge: 'bg-rose-50 text-rose-700 border-rose-200', desc: 'Archivage ou suppression définitive' },
  VALIDER: { label: 'Valider', badge: 'bg-purple-50 text-purple-700 border-purple-200', desc: 'Approbation formelle et visas hiérarchiques' },
  REFUSER: { label: 'Refuser', badge: 'bg-orange-50 text-orange-700 border-orange-200', desc: 'Rejet motivé ou renvoi pour correction' },
  EXPORTER: { label: 'Exporter', badge: 'bg-slate-100 text-slate-700 border-slate-300', desc: 'Export PDF / Excel et génération d’états' }
};

export const AdministrationView: React.FC = () => {
  const {
    utilisateurs,
    resetUserPassword,
    roles,
    permissions,
    rolePermissions,
    updateRolePermission,
    saveRbacMatrix,
    auditLogs,
    allChantiers,
    selectedChantierId,
    getUserSessions,
    revokeSession,
    currentUser,
    contratsJuridiques,
    demandesAchat,
    mouvementsStock,
    pointages,
    notifications
  } = useApp();

  const [activeTab, setActiveTab] = useState<'users' | 'rbac' | 'sessions' | 'audit' | 'backups' | 'procedures'>('users');
  const [userCategoryFilter, setUserCategoryFilter] = useState<'ALL' | 'CENTRAL' | 'CHANTIER'>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIF' | 'SUSPENDU' | 'DESACTIVE'>('ALL');
  const [chantierFilter, setChantierFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Utilisateur | null>(null);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [targetResetUser, setTargetResetUser] = useState<Utilisateur | null>(null);
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);
  const [selectedAuditLog, setSelectedAuditLog] = useState<typeof auditLogs[0] | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<Utilisateur | null>(null);

  // RBAC Matrix local state for configuration & saving
  const [matrixState, setMatrixState] = useState<typeof rolePermissions>(rolePermissions);
  const [matrixSuccessMsg, setMatrixSuccessMsg] = useState<string | null>(null);
  const [matrixErrorMsg, setMatrixErrorMsg] = useState<string | null>(null);
  const [matrixCategoryFilter, setMatrixCategoryFilter] = useState<'ALL' | 'CHANTIER' | 'GESTION' | 'SYSTEME'>('ALL');
  const [matrixSearchQuery, setMatrixSearchQuery] = useState('');
  const [matrixRoleCategoryFilter, setMatrixRoleCategoryFilter] = useState<'ALL' | 'CENTRAL' | 'CHANTIER'>('ALL');
  const [matrixRoleFocus, setMatrixRoleFocus] = useState<string>('ALL');
  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});

  // Backup & Restoration State
  const [backupsList, setBackupsList] = useState<BackupSnapshot[]>(productionSecurityService.getBackups());
  const [backupFeedback, setBackupFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeProcedure, setActiveProcedure] = useState<'chantier' | 'utilisateur' | 'pra'>('chantier');
  const [activeGuideRole, setActiveGuideRole] = useState<string>('ADMINISTRATEUR');

  const handleCreateManualBackup = () => {
    try {
      const payload = {
        utilisateurs,
        allChantiers,
        contratsJuridiques,
        demandesAchat,
        mouvementsStock,
        pointages,
        notifications
      };
      const res = productionSecurityService.createBackup(
        payload,
        'MANUEL',
        currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Karim BENALI'
      );

      const blob = new Blob([res.jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.snapshot.filename;
      a.click();
      URL.revokeObjectURL(url);

      setBackupsList(productionSecurityService.getBackups());
      setBackupFeedback({
        type: 'success',
        message: `Sauvegarde "${res.snapshot.filename}" générée et téléchargée avec succès (${res.snapshot.size_kb} KB, Checksum: ${res.snapshot.checksum}).`
      });
    } catch (err: any) {
      setBackupFeedback({
        type: 'error',
        message: `Échec de la sauvegarde : ${err.message}`
      });
    }
  };

  const handleRestoreFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = productionSecurityService.restoreFromJSON(
        content,
        currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Karim BENALI'
      );
      if (res.success) {
        setBackupFeedback({
          type: 'success',
          message: `Restauration réussie ! ${res.tablesRestored} tables et ${res.recordsCount} enregistrements vérifiés et restaurés.`
        });
        setBackupsList(productionSecurityService.getBackups());
      } else {
        setBackupFeedback({
          type: 'error',
          message: `Erreur de restauration : ${res.error}`
        });
      }
    };
    reader.readAsText(file);
  };

  // User form state (Create / Edit)
  const [userActionError, setUserActionError] = useState<string | null>(null);
  const [userFormData, setUserFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '+213 ',
    poste: '',
    type: 'CHANTIER' as UserType,
    role_id: 'role-ct',
    chantiers_assignes: [] as string[],
    auth_user_id: ''
  });

  const handleOpenCreateUser = () => {
    setEditingUser(null);
    setUserFormData({
      nom: '',
      prenom: '',
      email: '',
      telephone: '+213 ',
      poste: '',
      type: 'CHANTIER',
      role_id: 'role-ct',
      chantiers_assignes: [allChantiers[0]?.id || 'cht-001'],
      auth_user_id: ''
    });
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user: Utilisateur) => {
    setEditingUser(user);
    setUserFormData({
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone,
      poste: user.poste,
      type: user.type,
      role_id: user.role_id,
      chantiers_assignes: user.chantiers_assignes || [],
      auth_user_id: ''
    });
    setIsUserModalOpen(true);
  };

  const handleUserFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserActionError(null);
    if (!userFormData.nom || !userFormData.email) return;
    if (!editingUser && !userFormData.auth_user_id.trim()) {
      setUserActionError('Créez d’abord le compte dans Supabase Auth, puis renseignez son UUID ici.');
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: editingUser ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser
          ? { id: editingUser.id, ...userFormData }
          : { ...userFormData, auth_user_id: userFormData.auth_user_id.trim() }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Enregistrement du profil impossible.');
      setIsUserModalOpen(false);
      window.location.reload();
    } catch (error) {
      setUserActionError(error instanceof Error ? error.message : 'Erreur lors de l’enregistrement.');
    }
  };

  const handleToggleUserStatus = async (user: Utilisateur) => {
    const newStatus = user.statut === 'ACTIF' ? 'DESACTIVE' : 'ACTIF';
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, statut: newStatus }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Modification du statut impossible.');
      window.location.reload();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Erreur de modification.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmUser) return;
    try {
      const response = await fetch(`/api/admin/users?id=${encodeURIComponent(deleteConfirmUser.id)}`, { method: 'DELETE' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Suppression impossible.');
      setDeleteConfirmUser(null);
      window.location.reload();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Erreur de suppression.');
    }
  };

  const handleTriggerResetPassword = (user: Utilisateur) => {
    setTargetResetUser(user);
    setResetFeedback(null);
    setIsResetPasswordModalOpen(true);
  };

  const handleExecuteResetPassword = () => {
    if (!targetResetUser) return;
    const res = resetUserPassword(targetResetUser.email);
    if (res.success) {
      setResetFeedback(`Nouveau mot de passe temporaire généré : ${res.tempPassword}`);
    } else {
      setResetFeedback(`Erreur : ${res.message}`);
    }
  };

  // Matrix toggle helper
  const handleToggleMatrixCell = (roleId: string, permId: string) => {
    if (roleId === 'role-admin') return; // Admin is always 100% granted

    setMatrixState(prev => {
      const exists = prev.some(rp => rp.role_id === roleId && rp.permission_id === permId);
      if (exists) {
        return prev.filter(rp => !(rp.role_id === roleId && rp.permission_id === permId));
      } else {
        return [...prev, { role_id: roleId, permission_id: permId }];
      }
    });
  };

  // Cocher / Décocher toutes les actions d'un module pour un rôle spécifique
  const handleToggleRoleModule = (roleId: string, modCode: ModuleCode) => {
    if (roleId === 'role-admin') return;
    const permIds = ACTIONS_LIST.map(a => `perm-${modCode.toLowerCase()}-${a.toLowerCase()}`);
    const allGranted = permIds.every(pid =>
      matrixState.some(rp => rp.role_id === roleId && rp.permission_id === pid)
    );

    setMatrixState(prev => {
      if (allGranted) {
        return prev.filter(rp => !(rp.role_id === roleId && permIds.includes(rp.permission_id)));
      } else {
        const toAdd = permIds
          .filter(pid => !prev.some(rp => rp.role_id === roleId && rp.permission_id === pid))
          .map(pid => ({ role_id: roleId, permission_id: pid }));
        return [...prev, ...toAdd];
      }
    });
  };

  // Cocher / Décocher tout un module pour tous les rôles cibles
  const handleToggleModuleAllRoles = (modCode: ModuleCode, grant: boolean) => {
    const permIds = ACTIONS_LIST.map(a => `perm-${modCode.toLowerCase()}-${a.toLowerCase()}`);
    const nonAdminRoles = roles.filter(r => r.code !== 'ADMINISTRATEUR');

    setMatrixState(prev => {
      if (!grant) {
        return prev.filter(rp => !permIds.includes(rp.permission_id));
      } else {
        const toAdd: typeof prev = [];
        nonAdminRoles.forEach(r => {
          permIds.forEach(pid => {
            if (!prev.some(rp => rp.role_id === r.id && rp.permission_id === pid)) {
              toAdd.push({ role_id: r.id, permission_id: pid });
            }
          });
        });
        return [...prev, ...toAdd];
      }
    });
  };

  const handleResetMatrix = () => {
    setMatrixState(rolePermissions);
  };

  const toggleModuleCollapse = (code: string) => {
    setCollapsedModules(prev => ({ ...prev, [code]: !prev[code] }));
  };

  const collapseAllModules = (collapse: boolean) => {
    const next: Record<string, boolean> = {};
    MODULES_LIST.forEach(m => { next[m.code] = collapse; });
    setCollapsedModules(next);
  };

  // Compteur des modifications non sauvegardées
  const matrixChangedCount = useMemo(() => {
    const currentKeys = new Set(matrixState.map(rp => `${rp.role_id}__${rp.permission_id}`));
    const initialKeys = new Set(rolePermissions.map(rp => `${rp.role_id}__${rp.permission_id}`));
    let diff = 0;
    currentKeys.forEach(k => { if (!initialKeys.has(k)) diff++; });
    initialKeys.forEach(k => { if (!currentKeys.has(k)) diff++; });
    return diff;
  }, [matrixState, rolePermissions]);

  // Filtrage des modules par recherche et catégorie
  const filteredModules = useMemo(() => {
    return MODULES_LIST.filter(mod => {
      const matchesCategory = matrixCategoryFilter === 'ALL' || mod.categorie === matrixCategoryFilter;
      const matchesSearch = !matrixSearchQuery ||
        mod.libelle.toLowerCase().includes(matrixSearchQuery.toLowerCase()) ||
        mod.code.toLowerCase().includes(matrixSearchQuery.toLowerCase()) ||
        (mod.description && mod.description.toLowerCase().includes(matrixSearchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [matrixCategoryFilter, matrixSearchQuery]);

  // Filtrage des rôles affichés dans les colonnes
  const filteredRoles = useMemo(() => {
    return roles.filter(r => {
      if (matrixRoleFocus !== 'ALL') {
        return r.id === matrixRoleFocus || r.code === 'ADMINISTRATEUR';
      }
      if (matrixRoleCategoryFilter === 'CENTRAL') return r.type_acces !== 'CHANTIER' || r.code === 'ADMINISTRATEUR';
      if (matrixRoleCategoryFilter === 'CHANTIER') return r.type_acces !== 'CENTRAL' || r.code === 'ADMINISTRATEUR';
      return true;
    });
  }, [roles, matrixRoleCategoryFilter, matrixRoleFocus]);

  const handleSaveMatrix = async () => {
    setMatrixSuccessMsg(null);
    setMatrixErrorMsg(null);
    try {
      const response = await fetch('/api/admin/rbac', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rolePermissions: matrixState }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Enregistrement RBAC refusé par le serveur.');
      setMatrixSuccessMsg('La matrice des permissions a été enregistrée.');
    } catch (error) {
      setMatrixErrorMsg(error instanceof Error ? error.message : 'Impossible d’enregistrer la matrice RBAC.');
    }
  };

  // Filtering users
  const filteredUsers = utilisateurs.filter(u => {
    const matchesSearch = `${u.prenom} ${u.nom}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.poste.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = userCategoryFilter === 'ALL' || u.type === userCategoryFilter;
    const matchesRole = roleFilter === 'ALL' || u.role_id === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.statut === statusFilter;
    const matchesChantier = chantierFilter === 'ALL' || u.chantiers_assignes.includes(chantierFilter);
    return matchesSearch && matchesCategory && matchesRole && matchesStatus && matchesChantier;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Gestion des Accès & Sécurité Centralisée</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Administration des Utilisateurs & Matrice RBAC
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Système d'habilitation strict : 8 rôles centraux, 3 rôles chantiers, 7 permissions indépendantes (Consulter, Ajouter, Modifier, Supprimer, Valider, Refuser, Exporter) avec vérification côté serveur.
          </p>
        </div>

        {/* Sub-nav Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg shrink-0 text-xs self-start md:self-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 font-medium rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'users' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Utilisateurs ({utilisateurs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('rbac')}
            className={`px-3 py-1.5 font-medium rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'rbac' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Matrice RBAC (7 Actions)</span>
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-3 py-1.5 font-medium rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'sessions' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Sessions Actives</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 font-medium rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'audit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Journal d'Audit ({auditLogs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('backups')}
            className={`px-3 py-1.5 font-medium rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'backups' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sauvegardes & Restauration</span>
          </button>
          <button
            onClick={() => setActiveTab('procedures')}
            className={`px-3 py-1.5 font-medium rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'procedures' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>Procédures & Guides Rôles</span>
          </button>
        </div>
      </div>

      {/* TAB 1: USERS LIST & MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Category selector */}
              <div className="flex items-center gap-1.5 text-xs flex-wrap">
                <span className="text-slate-400 text-xs mr-1 font-medium">Catégorie :</span>
                <button
                  onClick={() => setUserCategoryFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    userCategoryFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tous ({utilisateurs.length})
                </button>
                <button
                  onClick={() => setUserCategoryFilter('CENTRAL')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                    userCategoryFilter === 'CENTRAL' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>Centraux (Siège)</span>
                </button>
                <button
                  onClick={() => setUserCategoryFilter('CHANTIER')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                    userCategoryFilter === 'CHANTIER' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  <HardHat className="w-3.5 h-3.5" />
                  <span>Chantiers (Terrain)</span>
                </button>
              </div>

              {/* Action: Create user */}
              <button
                onClick={handleOpenCreateUser}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs shrink-0 self-start lg:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Créer un utilisateur</span>
              </button>
            </div>

            {/* Dropdown Filters row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Recherche textuelle</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Nom, email, poste..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Filtrer par rôle</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                >
                  <option value="ALL">Tous les rôles (11)</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.libelle}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Filtrer par statut</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                >
                  <option value="ALL">Tous les statuts</option>
                  <option value="ACTIF">Actif</option>
                  <option value="SUSPENDU">Suspendu</option>
                  <option value="DESACTIVE">Désactivé</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Chantier d'affectation</label>
                <select
                  value={chantierFilter}
                  onChange={(e) => setChantierFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                >
                  <option value="ALL">Tous les chantiers</option>
                  {allChantiers.map(c => (
                    <option key={c.id} value={c.id}>{c.nom_projet} ({c.wilaya})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Utilisateur</th>
                    <th className="py-3 px-4">Périmètre</th>
                    <th className="py-3 px-4">Rôle & Poste</th>
                    <th className="py-3 px-4">Chantiers Affectés</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4">Dernier accès</th>
                    <th className="py-3 px-4 text-right">Actions de Gestion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => {
                    const role = roles.find(r => r.id === u.role_id);
                    const isSelf = currentUser?.id === u.id;
                    const assignedChantiersNames = allChantiers
                      .filter(c => u.chantiers_assignes?.includes(c.id))
                      .map(c => c.nom_projet);

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                              {u.prenom[0]}{u.nom[0]}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                <span>{u.prenom} {u.nom}</span>
                                {isSelf && (
                                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                                    Vous
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] font-mono text-slate-400 font-normal">{u.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                            u.type === 'CENTRAL'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {u.type === 'CENTRAL' ? <Building className="w-3 h-3" /> : <HardHat className="w-3 h-3" />}
                            {u.type === 'CENTRAL' ? 'Siège Central' : 'Chantier Local'}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{role?.libelle}</div>
                          <div className="text-[11px] text-slate-500">{u.poste}</div>
                        </td>

                        <td className="py-3 px-4 max-w-xs">
                          {u.type === 'CENTRAL' ? (
                            <span className="text-slate-500 italic">Tous les chantiers (Vue Siège)</span>
                          ) : assignedChantiersNames.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {assignedChantiersNames.map((name, i) => (
                                <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                                  {name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-rose-600 font-medium">Aucun chantier affecté</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.statut === 'ACTIF' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            u.statut === 'SUSPENDU' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {u.statut}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-400 text-[11px] font-mono">
                          {u.dernier_acces ? new Date(u.dernier_acces).toLocaleDateString('fr-DZ') : 'Jamais'}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditUser(u)}
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900"
                              title="Modifier le compte et les affectations"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleTriggerResetPassword(u)}
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900"
                              title="Réinitialiser le mot de passe"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleToggleUserStatus(u)}
                              disabled={u.role_id === 'role-admin'}
                              className={`p-1.5 rounded hover:bg-slate-100 ${
                                u.statut === 'ACTIF' ? 'text-amber-600' : 'text-emerald-600'
                              } disabled:opacity-30`}
                              title={u.statut === 'ACTIF' ? 'Désactiver le compte' : 'Activer le compte'}
                            >
                              {u.statut === 'ACTIF' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            </button>

                            {u.role_id !== 'role-admin' && (
                              <button
                                onClick={() => setDeleteConfirmUser(u)}
                                className="p-1.5 rounded hover:bg-rose-50 text-rose-500 hover:text-rose-700"
                                title="Suppression contrôlée"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONFIGURABLE RBAC MATRIX (7 INDEPENDENT PERMISSIONS) */}
      {activeTab === 'rbac' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
                  <Key className="w-4 h-4" />
                  <span>Matrice RBAC Granulaire & Sécurisée</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500 font-mono font-normal">14 Modules • 7 Actions • 11 Rôles</span>
                </div>
                <h3 className="font-bold text-slate-900 text-lg">
                  Configuration Complète des Habilitations par Rôle et par Module
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
                  Les rôles sont actuellement des modèles globaux en lecture seule. Leur personnalisation par entreprise sera activée après migration du catalogue RBAC vers un schéma multi-tenant, afin d’éviter qu’une entreprise modifie les droits d’une autre.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {matrixChangedCount > 0 && (
                  <button
                    onClick={handleResetMatrix}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Annuler modifications</span>
                  </button>
                )}
                <button
                  onClick={handleSaveMatrix}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all ${
                    matrixChangedCount > 0
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-500/30 animate-pulse'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>Enregistrer la matrice sur le serveur</span>
                  {matrixChangedCount > 0 && (
                    <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-mono">
                      {matrixChangedCount} modif.
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Notifications & Change Alerts */}
            {matrixSuccessMsg && (
              <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{matrixSuccessMsg}</span>
                </div>
                <span className="text-[11px] text-emerald-600 font-mono">Déployé sur l'environnement de production</span>
              </div>
            )}
            {matrixErrorMsg && (
              <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-medium">
                {matrixErrorMsg}
              </div>
            )}

            {matrixChangedCount > 0 && !matrixSuccessMsg && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-medium flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Vous avez <strong>{matrixChangedCount} modification(s)</strong> de permissions en attente. N'oubliez pas d'enregistrer sur le serveur pour appliquer les règles.
                  </span>
                </div>
                <span className="text-[11px] text-amber-700 font-semibold uppercase tracking-wider">Non sauvegardé</span>
              </div>
            )}

            {/* Matrix Filters & Tools Toolbar */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Category Filter Pills */}
              <div className="md:col-span-6 flex flex-wrap gap-1.5">
                {[
                  { id: 'ALL', label: 'Tous les modules', count: MODULES_LIST.length },
                  { id: 'CHANTIER', label: 'Terrain & Chantiers', count: MODULES_LIST.filter(m => m.categorie === 'CHANTIER').length },
                  { id: 'GESTION', label: 'Gestion & Siège', count: MODULES_LIST.filter(m => m.categorie === 'GESTION').length },
                  { id: 'SYSTEME', label: 'Transverse & Système', count: MODULES_LIST.filter(m => m.categorie === 'SYSTEME').length }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setMatrixCategoryFilter(cat.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      matrixCategoryFilter === cat.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      matrixCategoryFilter === cat.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {cat.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="md:col-span-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={matrixSearchQuery}
                    onChange={e => setMatrixSearchQuery(e.target.value)}
                    placeholder="Filtrer par module (ex: matériel, magasin...)"
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 text-slate-900 placeholder:text-slate-400"
                  />
                  {matrixSearchQuery && (
                    <button
                      onClick={() => setMatrixSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Scope & Accordion Controls */}
              <div className="md:col-span-3 flex items-center justify-end gap-2">
                <select
                  value={matrixRoleFocus}
                  onChange={e => setMatrixRoleFocus(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500"
                  title="Focaliser sur un rôle particulier"
                >
                  <option value="ALL">Tous les 11 rôles</option>
                  <optgroup label="Rôles du Siège">
                    {roles.filter(r => r.niveau_hierarchique <= 2).map(r => (
                      <option key={r.id} value={r.id}>{r.libelle}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Rôles de Chantier">
                    {roles.filter(r => r.niveau_hierarchique > 2).map(r => (
                      <option key={r.id} value={r.id}>{r.libelle}</option>
                    ))}
                  </optgroup>
                </select>

                <button
                  onClick={() => collapseAllModules(false)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
                  title="Déplier tous les modules"
                >
                  Déplier
                </button>
                <button
                  onClick={() => collapseAllModules(true)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
                  title="Replier tous les modules"
                >
                  Replier
                </button>
              </div>
            </div>
          </div>

          {/* Module List & Permissions Grid */}
          <div className="space-y-4">
            {filteredModules.map((mod) => {
              const ModIcon = MODULE_ICONS[mod.code] || Building;
              const isCollapsed = !!collapsedModules[mod.code];
              const modulePermIds = ACTIONS_LIST.map(a => `perm-${mod.code.toLowerCase()}-${a.toLowerCase()}`);
              
              // Compteur de permissions accordées pour ce module
              const grantedCount = matrixState.filter(rp => modulePermIds.includes(rp.permission_id)).length;
              const totalPossible = modulePermIds.length * (roles.length - 1); // Sans admin qui est toujours 100%

              return (
                <div
                  key={mod.code}
                  className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden transition-all hover:border-slate-300"
                >
                  {/* Module Collapsible Header */}
                  <div
                    onClick={() => toggleModuleCollapse(mod.code)}
                    className="p-4 sm:px-6 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl text-white shadow-xs ${
                        mod.categorie === 'CHANTIER'
                          ? 'bg-amber-600'
                          : mod.categorie === 'GESTION'
                          ? 'bg-indigo-600'
                          : 'bg-slate-700'
                      }`}>
                        <ModIcon className="w-5 h-5" />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{mod.libelle}</span>
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {mod.code}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                            mod.categorie === 'CHANTIER'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : mod.categorie === 'GESTION'
                              ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {mod.categorie === 'CHANTIER' ? 'Terrain & Chantier' : mod.categorie === 'GESTION' ? 'Gestion & Siège' : 'Transverse & Système'}
                          </span>
                          {mod.isCentralOnly && (
                            <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              Siège Exclusif (Règle 1)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {mod.description || 'Module applicatif BatiProm.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center" onClick={e => e.stopPropagation()}>
                      {/* Badge compteur */}
                      <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <strong className="text-slate-800 font-bold">{grantedCount}</strong>/{totalPossible} droits accordés
                      </span>

                      {/* Quick batch buttons for this module */}
                      <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-lg border border-slate-200">
                        <button
                          onClick={() => handleToggleModuleAllRoles(mod.code, true)}
                          className="px-2 py-1 hover:bg-white text-emerald-700 hover:text-emerald-800 rounded text-[11px] font-semibold transition-colors flex items-center gap-1"
                          title="Accorder toutes les actions de ce module à tous les rôles (hors admin)"
                        >
                          <CheckSquare className="w-3 h-3" />
                          <span>Tout cocher</span>
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          onClick={() => handleToggleModuleAllRoles(mod.code, false)}
                          className="px-2 py-1 hover:bg-white text-rose-700 hover:text-rose-800 rounded text-[11px] font-semibold transition-colors flex items-center gap-1"
                          title="Révoquer toutes les actions de ce module pour tous les rôles (hors admin)"
                        >
                          <Square className="w-3 h-3" />
                          <span>Tout décocher</span>
                        </button>
                      </div>

                      {/* Chevron Toggle */}
                      <button
                        onClick={() => toggleModuleCollapse(mod.code)}
                        className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                      >
                        {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Matrix Table */}
                  {!isCollapsed && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-900 text-white">
                            <th className="py-3 px-4 font-semibold sticky left-0 bg-slate-900 z-10 min-w-[220px]">
                              <div className="text-xs font-bold">Action / Droit</div>
                              <div className="text-[10px] text-slate-400 font-normal">7 permissions indépendantes</div>
                            </th>
                            {filteredRoles.map(r => {
                              const isAdmin = r.code === 'ADMINISTRATEUR';
                              const isCentral = r.niveau_hierarchique <= 2;
                              return (
                                <th
                                  key={r.id}
                                  className={`py-3 px-2 font-semibold text-center whitespace-nowrap min-w-[110px] border-l border-slate-800 ${
                                    isAdmin ? 'bg-slate-950' : ''
                                  }`}
                                  title={r.description}
                                >
                                  <div className="flex items-center justify-center gap-1">
                                    {isAdmin && <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />}
                                    <span className={`text-[11px] font-bold ${isAdmin ? 'text-amber-300' : 'text-slate-100'}`}>
                                      {r.libelle}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-center gap-1.5 mt-0.5">
                                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                                      isAdmin
                                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                                        : isCentral
                                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30'
                                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                                    }`}>
                                      {isAdmin ? 'Super-Admin' : isCentral ? 'Siège Central' : 'Chantier Local'}
                                    </span>
                                  </div>

                                  {!isAdmin && (
                                    <div className="mt-1.5">
                                      <button
                                        onClick={() => handleToggleRoleModule(r.id, mod.code)}
                                        className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                                        title={`Basculer toutes les actions de ${mod.libelle} pour ${r.libelle}`}
                                      >
                                        Bascule rôle
                                      </button>
                                    </div>
                                  )}
                                </th>
                              );
                            })}
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {ACTIONS_LIST.map((action) => {
                            const actionConf = ACTION_CONFIG[action];
                            const permId = `perm-${mod.code.toLowerCase()}-${action.toLowerCase()}`;

                            return (
                              <tr key={permId} className="hover:bg-slate-50/80 transition-colors group">
                                <td className="py-2.5 px-4 sticky left-0 bg-white group-hover:bg-slate-50 transition-colors border-r border-slate-100">
                                  <div className="flex items-center gap-2">
                                    <span className={`font-mono font-bold text-[10px] px-2 py-0.5 rounded border uppercase ${actionConf.badge}`}>
                                      {actionConf.label}
                                    </span>
                                    <span className="text-[11px] text-slate-500 hidden sm:inline">
                                      {actionConf.desc}
                                    </span>
                                  </div>
                                </td>

                                {filteredRoles.map((r) => {
                                  const isAdmin = r.code === 'ADMINISTRATEUR';
                                  const isGranted = isAdmin || matrixState.some(
                                    rp => rp.role_id === r.id && rp.permission_id === permId
                                  );

                                  return (
                                    <td
                                      key={r.id}
                                      className={`py-2 px-2 text-center border-l border-slate-100 transition-colors ${
                                        isAdmin ? 'bg-amber-50/30' : isGranted ? 'bg-emerald-50/30' : ''
                                      }`}
                                    >
                                      {isAdmin ? (
                                        <div className="flex items-center justify-center" title="Administrateur : Accès intégral et permanent garanti par le système">
                                          <div className="w-5 h-5 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center shadow-2xs">
                                            <Lock className="w-3 h-3" />
                                          </div>
                                        </div>
                                      ) : (
                                        <label className="inline-flex items-center justify-center p-1 rounded-md cursor-pointer hover:bg-slate-100 transition-all">
                                          <input
                                            type="checkbox"
                                            checked={isGranted}
                                            onChange={() => handleToggleMatrixCell(r.id, permId)}
                                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer transition-transform hover:scale-110"
                                            title={`${isGranted ? 'Droit accordé' : 'Droit refusé'} : ${action} sur ${mod.libelle} pour ${r.libelle}`}
                                          />
                                        </label>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredModules.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
                <div className="p-3 bg-slate-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-slate-400">
                  <Search className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-base">Aucun module ne correspond à vos filtres</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Aucun résultat pour la recherche "{matrixSearchQuery}" dans la catégorie sélectionnée.
                </p>
                <button
                  onClick={() => {
                    setMatrixCategoryFilter('ALL');
                    setMatrixSearchQuery('');
                  }}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
                >
                  Réinitialiser tous les filtres
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: USER SESSIONS */}
      {activeTab === 'sessions' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base">
              Surveillance et Gestion des Sessions Connectées
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualisation des jetons de session actifs, adresse IP d'origine, équipement et révocation d'accès à distance.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Utilisateur</th>
                  <th className="py-3 px-4">Équipement & Navigateur</th>
                  <th className="py-3 px-4">Adresse IP</th>
                  <th className="py-3 px-4">Connexion Établie</th>
                  <th className="py-3 px-4">Dernière Activité</th>
                  <th className="py-3 px-4 text-right">Révocation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {utilisateurs.flatMap(u => getUserSessions(u.id).map(sess => {
                  return (
                    <tr key={sess.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{u.prenom} {u.nom}</div>
                        <div className="text-[11px] font-mono text-slate-400">{u.email}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {sess.device_info}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {sess.ip_address}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {new Date(sess.created_at).toLocaleString('fr-DZ')}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-emerald-700">
                        {new Date(sess.last_activity).toLocaleTimeString('fr-DZ')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => revokeSession(sess.id)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-xs font-semibold transition-colors"
                        >
                          Révoquer la session
                        </button>
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base">
              Journal d'Audit Immuable (Opérations & Sécurité)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Historique complet de toutes les créations, modifications de compte, réinitialisations de mot de passe et tentatives d'accès bloquées.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Date & Heure</th>
                  <th className="py-2.5 px-3">Auteur</th>
                  <th className="py-2.5 px-3">Chantier</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Entité</th>
                  <th className="py-2.5 px-3">Description Opération</th>
                  <th className="py-2.5 px-3">IP</th>
                  <th className="py-2.5 px-3">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('fr-DZ')}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-900">
                      {log.utilisateur_nom}
                    </td>
                    <td className="py-2 px-3 text-slate-700">
                      {log.chantier_nom || <span className="text-slate-400 italic">Siège Central</span>}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                        log.action === 'ACCES_REFUSE' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                      {log.entite_cible}
                    </td>
                    <td className="py-2 px-3 text-slate-800 text-[11px]">
                      {log.description}
                    </td>
                    <td className="py-2 px-3 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                      {log.adresse_ip}
                    </td>
                    <td className="py-2 px-3">
                      {log.details_modifications && (
                        <button
                          onClick={() => setSelectedAuditLog(log)}
                          className="p-1 hover:bg-slate-100 rounded text-emerald-600"
                          title="Inspecter le snapshot JSON"
                        >
                          <FileCode className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: SAUVEGARDES & RESTAURATION (DRP / PRA) */}
      {activeTab === 'backups' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
                <Database className="w-4 h-4" />
                <span>Stratégie de Sauvegarde & Plan de Reprise d'Activité (PRA)</span>
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                Sauvegardes Automatisées, Snapshots Manuels & Restauration
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
                Protection continue des données immobilières, financières et contractuelles. Snapshots au format JSON/SQL avec vérification par empreinte numérique SHA-256.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleCreateManualBackup}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Créer & Télécharger un Snapshot</span>
              </button>

              <label className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>Restaurer depuis un fichier JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {backupFeedback && (
            <div className={`p-4 rounded-xl text-xs font-medium flex items-center gap-2 border ${
              backupFeedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {backupFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{backupFeedback.message}</span>
            </div>
          )}

          {/* Backup Policy Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold uppercase">
                <span>Fréquence Auto</span>
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-base font-bold text-slate-900">Quotidien à 02:00 UTC+1</div>
              <div className="text-[11px] text-slate-500">Rétention minimale : 30 jours glissants</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold uppercase">
                <span>Intégrité des Données</span>
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="text-base font-bold text-slate-900">Contrôle SHA-256</div>
              <div className="text-[11px] text-slate-500">Vérification automatique avant restauration</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold uppercase">
                <span>Chiffrement Coffre-fort</span>
                <Lock className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="text-base font-bold text-slate-900">AES-256 In-Transit</div>
              <div className="text-[11px] text-slate-500">Protection des pièces jointes et RIBs</div>
            </div>
          </div>

          {/* Table of Snapshots */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-bold text-slate-900 text-xs flex items-center justify-between">
              <span>Historique des Snapshots de Sauvegarde ({backupsList.length})</span>
              <span className="text-[11px] text-slate-500 font-normal">Format universel de migration JSON/SQL</span>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Nom du Fichier Snapshot</th>
                  <th className="py-2.5 px-3">Date & Heure</th>
                  <th className="py-2.5 px-3">Auteur / Origine</th>
                  <th className="py-2.5 px-3">Taille</th>
                  <th className="py-2.5 px-3">Tables</th>
                  <th className="py-2.5 px-3">Checksum SHA-256</th>
                  <th className="py-2.5 px-3">Statut</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {backupsList.map((bkp) => (
                  <tr key={bkp.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">
                      {bkp.filename}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                      {new Date(bkp.created_at).toLocaleString('fr-DZ')}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-700">
                      {bkp.created_by}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                      {bkp.size_kb} KB
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                      {bkp.tables_count} tables
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400 max-w-[140px] truncate" title={bkp.checksum}>
                      {bkp.checksum}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {bkp.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={handleCreateManualBackup}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        title="Re-télécharger ce snapshot"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: PROCÉDURES DE GESTION & GUIDES PAR PROFIL */}
      {activeTab === 'procedures' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
                <BookOpen className="w-4 h-4" />
                <span>Manuel de Procédures & Gouvernance Opérationnelle</span>
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                Procédures Administratives & Guides d'Utilisation par Profil
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Directives officielles pour la création de chantiers, le recrutement d'utilisateurs, le Plan de Reprise d'Activité et la prise en main par rôle.
              </p>
            </div>
          </div>

          {/* Sub-selector Procedures vs Guides */}
          <div className="space-y-6">
            {/* 1. SECTION PROCÉDURES CLÉS */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Procédures Clés de Gestion Opérationnelle</span>
              </h4>

              <div className="flex gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
                <button
                  onClick={() => setActiveProcedure('chantier')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    activeProcedure === 'chantier' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Procédure 1 : Création d'un Nouveau Chantier
                </button>
                <button
                  onClick={() => setActiveProcedure('utilisateur')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    activeProcedure === 'utilisateur' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Procédure 2 : Création & Habilitation Utilisateur
                </button>
                <button
                  onClick={() => setActiveProcedure('pra')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    activeProcedure === 'pra' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Procédure 3 : Sauvegarde & Restauration (PRA)
                </button>
              </div>

              {activeProcedure === 'chantier' && (
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wide text-emerald-700">
                    Étapes de Création d'un Nouveau Chantier BTPH / Promotion Immobilière
                  </h5>
                  <ol className="list-decimal list-inside space-y-2 text-slate-700 leading-relaxed">
                    <li>
                      <strong>Phase Foncier & Permis :</strong> Accéder à <em>Paramètres &rarr; Gestion des chantiers</em>, cliquer sur <em>Nouveau Chantier</em>. Renseigner la Wilaya, la Commune, le numéro du Permis de Construire et l'organisme CTC référent.
                    </li>
                    <li>
                      <strong>Définition des Volumes & Biens :</strong> Saisir la superficie du terrain, la surface plancher, le nombre de logements et locaux commerciaux prévus.
                    </li>
                    <li>
                      <strong>Nominations du Personnel :</strong> Désigner le Directeur de Chantier (Siège) et le Conducteur de Travaux (Terrain) responsable de la saisie quotidienne.
                    </li>
                    <li>
                      <strong>Création du Compte Séquestre VEFA :</strong> Créer le compte bancaire dédié à ce chantier sous <em>Paramètres &rarr; Informations bancaires</em> en cochant l'affectation au chantier créé.
                    </li>
                  </ol>
                </div>
              )}

              {activeProcedure === 'utilisateur' && (
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wide text-blue-700">
                    Étapes de Création et d'Habilitation d'un Nouvel Utilisateur
                  </h5>
                  <ol className="list-decimal list-inside space-y-2 text-slate-700 leading-relaxed">
                    <li>
                      <strong>Saisie de la Fiche d'Identité :</strong> Dans <em>Administration &rarr; Utilisateurs</em>, cliquer sur <em>Créer un utilisateur</em>. Renseigner Nom, Prénom, Email professionnel et Poste.
                    </li>
                    <li>
                      <strong>Sélection du Périmètre :</strong> Choisir <code>CENTRAL (Siège)</code> pour un accès multi-chantiers ou <code>CHANTIER (Terrain)</code> pour un accès restreint.
                    </li>
                    <li>
                      <strong>Attribution du Rôle RBAC :</strong> Affecter l'un des 11 rôles prédéfinis (ex: Conducteur de travaux, Magasinier, Responsable Comptabilité).
                    </li>
                    <li>
                      <strong>Cloisonnement Multi-Chantiers :</strong> Cocher la liste exacte des chantiers auxquels l'utilisateur est autorisé à accéder. Les autres chantiers lui seront strictement inaccessibles.
                    </li>
                  </ol>
                </div>
              )}

              {activeProcedure === 'pra' && (
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wide text-amber-700">
                    Procédure de Sauvegarde et Plan de Reprise d'Activité (PRA / DRP)
                  </h5>
                  <ol className="list-decimal list-inside space-y-2 text-slate-700 leading-relaxed">
                    <li>
                      <strong>Génération du Snapshot :</strong> Dans <em>Administration &rarr; Sauvegardes & Restauration</em>, cliquer sur <em>Créer & Télécharger un Snapshot</em> pour obtenir le fichier JSON/SQL daté.
                    </li>
                    <li>
                      <strong>Vérification du Checksum :</strong> S'assurer que le fichier téléchargé contient l'empreinte SHA-256 valide affichée à l'écran.
                    </li>
                    <li>
                      <strong>Procédure de Restauration :</strong> En cas d'incident serveur, charger le dernier snapshot JSON via <em>Restaurer depuis un fichier JSON</em>. Le système réinjecte et vérifie l'intégrité de toutes les tables en moins de 5 secondes.
                    </li>
                  </ol>
                </div>
              )}
            </div>

            {/* 2. SECTION GUIDES PAR PROFIL */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                <span>Guide d'Utilisation par Profil Métier</span>
              </h4>

              <div className="flex flex-wrap gap-1.5 text-xs">
                {roles.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setActiveGuideRole(r.code)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      activeGuideRole === r.code
                        ? 'bg-purple-700 text-white font-bold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {r.libelle}
                  </button>
                ))}
              </div>

              {/* Guide Content Display */}
              <div className="p-5 rounded-xl bg-purple-50/50 border border-purple-200 text-xs space-y-3">
                <div className="flex items-center justify-between border-b border-purple-200/60 pb-2">
                  <h5 className="font-bold text-purple-950 text-sm">
                    Guide Utilisateur : {roles.find(r => r.code === activeGuideRole)?.libelle}
                  </h5>
                  <span className="text-[10px] bg-purple-200 text-purple-900 font-mono px-2 py-0.5 rounded font-bold">
                    Rôle Code: {activeGuideRole}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-700">
                  <div>
                    <h6 className="font-bold text-slate-900 text-xs uppercase mb-1">Modules Accédés & Responsabilités</h6>
                    <p className="text-[11px] leading-relaxed">
                      {roles.find(r => r.code === activeGuideRole)?.description || 'Accès restreint selon les habilitations accordées.'}
                    </p>
                  </div>

                  <div>
                    <h6 className="font-bold text-slate-900 text-xs uppercase mb-1">Règles de Sécurité & Restrictions</h6>
                    <ul className="list-disc list-inside text-[11px] space-y-1 text-slate-600">
                      <li>Strictement limité au périmètre assigné.</li>
                      <li>Aucun accès autorisé aux journaux de clôture sans dérogation.</li>
                      <li>Actions sensibles soumises au journal d'audit immuable.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE OR EDIT USER */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-900 text-base">
                {editingUser ? `Modifier l'utilisateur : ${editingUser.prenom} ${editingUser.nom}` : 'Créer un nouvel utilisateur'}
              </h3>
              <button onClick={() => setIsUserModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-700" />
              </button>
            </div>

            <form onSubmit={handleUserFormSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={userFormData.prenom}
                    onChange={(e) => setUserFormData({ ...userFormData, prenom: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    value={userFormData.nom}
                    onChange={(e) => setUserFormData({ ...userFormData, nom: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Email professionnel *</label>
                <input
                  type="email"
                  required
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={userFormData.telephone}
                    onChange={(e) => setUserFormData({ ...userFormData, telephone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Intitulé du poste *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Conducteur de travaux"
                    value={userFormData.poste}
                    onChange={(e) => setUserFormData({ ...userFormData, poste: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              {!editingUser && (
                <div className="p-3 rounded-lg border border-amber-200 bg-amber-50">
                  <label className="block font-medium text-slate-800 mb-1">UUID du compte Supabase Auth *</label>
                  <input
                    type="text"
                    required
                    value={userFormData.auth_user_id}
                    onChange={(e) => setUserFormData({ ...userFormData, auth_user_id: e.target.value })}
                    placeholder="UUID copié depuis Authentication → Users"
                    className="w-full px-3 py-2 border border-amber-200 rounded-lg text-xs bg-white font-mono"
                  />
                  <p className="text-[11px] text-amber-800 mt-2">Le compte doit être créé au préalable dans Supabase Auth avec la même adresse e-mail.</p>
                </div>
              )}
              {userActionError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">{userActionError}</div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Périmètre d'activité *</label>
                  <select
                    value={userFormData.type}
                    onChange={(e) => setUserFormData({ ...userFormData, type: e.target.value as UserType })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    <option value="CENTRAL">Utilisateur Central (Siège)</option>
                    <option value="CHANTIER">Utilisateur de Chantier (Terrain)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Rôle RBAC Attribué *</label>
                  <select
                    value={userFormData.role_id}
                    onChange={(e) => setUserFormData({ ...userFormData, role_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.libelle}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Multi-chantier assignment */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Chantiers Assignés (Cloisonnement d'accès)
                </label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 max-h-36 overflow-y-auto">
                  {allChantiers.map(c => {
                    const isChecked = userFormData.chantiers_assignes.includes(c.id);
                    return (
                      <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setUserFormData({
                                ...userFormData,
                                chantiers_assignes: [...userFormData.chantiers_assignes, c.id]
                              });
                            } else {
                              setUserFormData({
                                ...userFormData,
                                chantiers_assignes: userFormData.chantiers_assignes.filter(id => id !== c.id)
                              });
                            }
                          }}
                          className="rounded text-emerald-600 border-slate-300"
                        />
                        <span className="font-medium text-slate-800">{c.nom_projet}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({c.wilaya})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  {editingUser ? 'Enregistrer les modifications' : 'Créer l’utilisateur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET PASSWORD CONFIRM */}
      {isResetPasswordModalOpen && targetResetUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                Réinitialisation du mot de passe
              </h3>
              <button onClick={() => setIsResetPasswordModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <p className="text-slate-600 mb-3">
              Voulez-vous réinitialiser le mot de passe pour <strong>{targetResetUser.prenom} {targetResetUser.nom}</strong> ({targetResetUser.email}) ?
            </p>

            {resetFeedback ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-mono text-[11px] mb-4">
                {resetFeedback}
              </div>
            ) : (
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsResetPasswordModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600"
                >
                  Annuler
                </button>
                <button
                  onClick={handleExecuteResetPassword}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold"
                >
                  Générer le mot de passe
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: CONTROLLED DELETE CONFIRMATION */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 text-xs">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Suppression Contrôlée</span>
            </div>
            <p className="text-slate-600 mb-4 leading-relaxed">
              Confirmez-vous la suppression définitive du compte de <strong>{deleteConfirmUser.prenom} {deleteConfirmUser.nom}</strong> ({deleteConfirmUser.poste}) ? Toutes ses sessions actives seront révoquées et l'opération sera inscrite au journal d'audit.
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold"
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JSON SNAPSHOT MODAL */}
      {selectedAuditLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <h4 className="font-bold text-slate-900 text-sm">
                Snapshot d'Audit JSON : {selectedAuditLog.entite_cible}
              </h4>
              <button onClick={() => setSelectedAuditLog(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <pre className="bg-slate-950 text-slate-200 font-mono text-[11px] p-4 rounded-xl overflow-x-auto max-h-80 border border-slate-800">
              <code>{JSON.stringify(selectedAuditLog.details_modifications, null, 2)}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
