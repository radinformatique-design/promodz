'use client';

import React, { useState, useMemo } from 'react';
import {
  Building2,
  HardHat,
  TrendingUp,
  AlertTriangle,
  FolderOpen,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Database,
  ShoppingCart,
  Users,
  DollarSign,
  Scale,
  Wrench,
  FileCheck,
  Truck,
  Package,
  Layers,
  Calendar,
  Filter,
  BarChart3,
  CreditCard,
  Store,
  FileText,
  ClipboardList
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UUID_TO_SLUG } from '../data/systemConstants';
import { JournalHistoriquePanel } from '../components/JournalHistoriquePanel';

type CanonicalRole =
  | 'role-admin'
  | 'role-gerant'
  | 'role-rh'
  | 'role-juridique'
  | 'role-compta'
  | 'role-tech'
  | 'role-materiel'
  | 'role-commercial'
  | 'role-appro'
  | 'role-ct'
  | 'role-metreur'
  | 'role-magasinier';

function resolveCanonicalRole(roleId?: string, poste?: string): CanonicalRole {
  const raw = (roleId || '').trim();
  const mapped = UUID_TO_SLUG[raw] || UUID_TO_SLUG[raw.toLowerCase()] || raw.toLowerCase();
  const validRoles: CanonicalRole[] = [
    'role-admin',
    'role-gerant',
    'role-rh',
    'role-juridique',
    'role-compta',
    'role-tech',
    'role-materiel',
    'role-commercial',
    'role-appro',
    'role-ct',
    'role-metreur',
    'role-magasinier'
  ];
  if (validRoles.includes(mapped as CanonicalRole)) {
    return mapped as CanonicalRole;
  }
  const p = (poste || '').toLowerCase();
  if (p.includes('gérant') || p.includes('gerant')) return 'role-gerant';
  if (p.includes('admin') || p.includes('directeur')) return 'role-admin';
  if (p.includes('rh') || p.includes('ressources humaines')) return 'role-rh';
  if (p.includes('juridique') || p.includes('foncier')) return 'role-juridique';
  if (p.includes('compta') || p.includes('finance')) return 'role-compta';
  if (p.includes('technique')) return 'role-tech';
  if (p.includes('matériel') || p.includes('materiel')) return 'role-materiel';
  if (p.includes('commercial') || p.includes('vefa') || p.includes('vente')) return 'role-commercial';
  if (p.includes('appro') || p.includes('achat')) return 'role-appro';
  if (p.includes('conducteur')) return 'role-ct';
  if (p.includes('métreur') || p.includes('metreur')) return 'role-metreur';
  if (p.includes('magasinier')) return 'role-magasinier';
  return 'role-admin';
}

export const DashboardView: React.FC = () => {
  const {
    chantiers,
    selectedChantierId,
    currentChantier,
    notifications,
    auditLogs,
    documents,
    demandesAchat,
    bonsCommande,
    bonsSortie,
    rapportsChantier,
    controlesCTC,
    facturesFournisseurs,
    employes,
    pointages,
    vehicules,
    articlesStock,
    contratsJuridiques,
    biensImmobiliers,
    reservationsVEFA,
    metres,
    structuresChantier,
    currentUser,
    setActiveNav
  } = useApp();

  // Filters
  const [filterPeriod, setFilterPeriod] = useState<'EXERCICE_2026' | 'THIS_MONTH' | 'THIS_WEEK'>('EXERCICE_2026');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'EN_COURS' | 'EN_ATTENTE' | 'ALERTE'>('ALL');
  const [adminTab, setAdminTab] = useState<'kpis' | 'journal'>('kpis');

  const roleSlug = useMemo(
    () => resolveCanonicalRole(currentUser?.role_id, currentUser?.poste),
    [currentUser?.role_id, currentUser?.poste]
  );

  // Périmètre chantiers strict : un utilisateur de chantier ne voit que ses chantiers assignés
  const scopedChantiers = useMemo(() => {
    if (currentUser?.type === 'CHANTIER') {
      return chantiers.filter(c => currentUser.chantiers_assignes.includes(c.id));
    }
    return chantiers;
  }, [chantiers, currentUser]);

  const activeChantiers = useMemo(() => {
    if (selectedChantierId === 'ALL') return scopedChantiers;
    return scopedChantiers.filter(c => c.id === selectedChantierId);
  }, [scopedChantiers, selectedChantierId]);

  const activeChantierIds = useMemo(
    () => activeChantiers.map(c => c.id),
    [activeChantiers]
  );

  // Notifications filtrées selon le rôle et le périmètre chantier
  const scopedNotifications = useMemo(() => {
    const roleModuleMap: Record<CanonicalRole, string[] | 'ALL'> = {
      'role-admin': 'ALL',
      'role-gerant': 'ALL',
      'role-rh': ['RH', 'POINTAGE'],
      'role-juridique': ['JURIDIQUE', 'DOCUMENTS'],
      'role-compta': ['COMPTABILITE', 'APPROVISIONNEMENTS'],
      'role-tech': ['CHANTIERS', 'TECHNIQUE', 'METRES'],
      'role-materiel': ['MATERIEL'],
      'role-commercial': ['COMMERCIAL'],
      'role-appro': ['APPROVISIONNEMENTS', 'MAGASIN'],
      'role-ct': ['TECHNIQUE', 'CHANTIERS', 'MAGASIN', 'APPROVISIONNEMENTS', 'POINTAGE'],
      'role-metreur': ['TECHNIQUE', 'METRES', 'CHANTIERS'],
      'role-magasinier': ['MAGASIN', 'APPROVISIONNEMENTS']
    };

    const allowedModules = roleModuleMap[roleSlug];
    return notifications.filter(n => {
      if (currentUser?.type === 'CHANTIER' && n.chantier_id && !activeChantierIds.includes(n.chantier_id)) {
        return false;
      }
      if (allowedModules !== 'ALL' && n.module && !allowedModules.includes(n.module)) {
        return false;
      }
      if (filterStatus === 'ALERTE') {
        return n.type === 'CRITIQUE' || n.type === 'AVERTISSEMENT' || n.type === 'VALIDATION_REQUISE';
      }
      if (filterStatus === 'EN_ATTENTE') {
        return n.type === 'VALIDATION_REQUISE';
      }
      return true;
    });
  }, [notifications, roleSlug, currentUser?.type, activeChantierIds, filterStatus]);

  // Données filtrées sur le périmètre actif
  const scopedArticles = useMemo(
    () => articlesStock.filter(a => activeChantierIds.includes(a.chantier_id)),
    [articlesStock, activeChantierIds]
  );
  const scopedBonsSortie = useMemo(
    () => (bonsSortie || []).filter(bs => activeChantierIds.includes(bs.chantier_id)),
    [bonsSortie, activeChantierIds]
  );
  const scopedBonsCommande = useMemo(
    () => bonsCommande.filter(bc => activeChantierIds.includes(bc.chantier_destinataire_id)),
    [bonsCommande, activeChantierIds]
  );
  const scopedDAs = useMemo(
    () => demandesAchat.filter(d => activeChantierIds.includes(d.chantier_id)),
    [demandesAchat, activeChantierIds]
  );
  const scopedStructureIds = useMemo(
    () => new Set(structuresChantier.filter(s => activeChantierIds.includes(s.chantier_id)).map(s => s.id)),
    [structuresChantier, activeChantierIds]
  );
  const scopedMetres = useMemo(
    () => metres.filter(m => scopedStructureIds.has(m.structure_id)),
    [metres, scopedStructureIds]
  );

  // Global Admin Metrics
  const totalChantiersCount = activeChantiers.length;
  const totalEmployesCount = employes.length;
  const pendingAchatsCount = scopedDAs.filter(d => ['EN_ATTENTE_COMPTABILITE', 'VALIDEE', 'EN_COURS_APPROVISIONNEMENT'].includes(d.statut)).length;
  const totalBudgetPrevu = activeChantiers.reduce((acc, c) => acc + c.budget_global_prevu, 0);
  const totalBudgetEngage = activeChantiers.reduce((acc, c) => acc + c.budget_engage, 0);
  const totalAlertesCount = scopedNotifications.filter(n => n.type === 'CRITIQUE' || n.type === 'AVERTISSEMENT' || n.type === 'VALIDATION_REQUISE').length;
  const avgAvancement = activeChantiers.length > 0
    ? (activeChantiers.reduce((acc, c) => acc + c.taux_avancement_physique, 0) / activeChantiers.length).toFixed(1)
    : '0';

  const canSeeBudget = ['role-admin', 'role-gerant', 'role-compta', 'role-appro', 'role-tech'].includes(roleSlug);
  const primarySectionByRole: Record<CanonicalRole, { nav: string; label: string }> = {
    'role-admin': { nav: 'chantiers', label: 'Gérer tous les chantiers' },
    'role-gerant': { nav: 'gerant', label: 'Ouvrir Espace Gérant (Global)' },
    'role-rh': { nav: 'rh', label: 'Ouvrir Ressources Humaines' },
    'role-juridique': { nav: 'juridique', label: 'Ouvrir Juridique & Foncier' },
    'role-compta': { nav: 'comptabilite', label: 'Ouvrir Comptabilité' },
    'role-tech': { nav: 'chantiers', label: 'Ouvrir Projets & Technique' },
    'role-materiel': { nav: 'materiel', label: 'Ouvrir Parc Matériel' },
    'role-commercial': { nav: 'commercial', label: 'Ouvrir Commercial & VEFA' },
    'role-appro': { nav: 'approvisionnements', label: 'Ouvrir Approvisionnements' },
    'role-ct': { nav: 'suivi-travaux', label: 'Ouvrir Suivi des Travaux' },
    'role-metreur': { nav: 'metres', label: 'Ouvrir Métrés & Situations' },
    'role-magasinier': { nav: 'magasin', label: 'Ouvrir Magasin & Stocks' }
  };
  const primaryAction = primarySectionByRole[roleSlug];

  const formatDZD = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const userRole = currentUser?.role_id || 'role-admin';

  return (
    <div className="space-y-6">
      {/* Filter & Period Header Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 text-white rounded-lg">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                Tableau de Bord — {currentUser?.poste || 'Vue Décisionnelle'}
              </h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full font-mono">
                {currentUser?.type === 'CENTRAL' ? 'Vue Siège Central' : `Chantier : ${currentChantier?.nom_projet || 'Local'}`}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Supervision des indicateurs clés de performance (KPIs), consommations et alertes du périmètre actif.
            </p>
          </div>
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterPeriod}
              onChange={e => setFilterPeriod(e.target.value as any)}
              className="bg-transparent font-semibold text-slate-700 focus:outline-none"
            >
              <option value="EXERCICE_2026">Exercice Fiscal 2026</option>
              <option value="THIS_MONTH">Mois en cours (Novembre)</option>
              <option value="THIS_WEEK">Semaine en cours</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
              className="bg-transparent font-semibold text-slate-700 focus:outline-none"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="EN_COURS">Opérations en cours</option>
              <option value="EN_ATTENTE">En attente de validation</option>
              <option value="ALERTE">Alertes & Critiques</option>
            </select>
          </div>
        </div>
      </div>

      {/* Scope Banner if single Chantier */}
      {currentChantier && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-emerald-950 text-sm">
                  {currentChantier.nom_projet}
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-200/60 text-emerald-800 font-mono">
                  {currentChantier.code_chantier}
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-0.5">
                Localisation : {currentChantier.commune}, {currentChantier.wilaya} · Permis : {currentChantier.permis_construire_ref || 'En cours'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveNav(primaryAction.nav)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
          >
            {primaryAction.label}
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. ADMINISTRATEUR / GÉRANT GLOBAL DASHBOARD */}
      {(roleSlug === 'role-admin' || roleSlug === 'role-gerant') && (
        <div className="space-y-6">
          {/* Onglets Tableau de bord Administrateur / Gérant */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-fit border border-slate-200">
            <button
              onClick={() => setAdminTab('kpis')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                adminTab === 'kpis'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-orange-600" />
              <span>Vue Globale (KPIs)</span>
            </button>
            <button
              onClick={() => setAdminTab('journal')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                adminTab === 'journal'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClipboardList className="w-4 h-4 text-orange-600" />
              <span>Journal de Chantier</span>
              <span className="px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-black">
                {rapportsChantier.length}
              </span>
            </button>
          </div>

          {adminTab === 'kpis' && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {/* 1. Nombre de chantiers */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Chantiers</span>
                <div className="text-xl font-bold font-mono text-slate-900 mt-1">{totalChantiersCount}</div>
                <span className="text-[10px] text-slate-400 block mt-0.5">Projets actifs</span>
              </div>

              {/* 2. Effectifs */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Effectifs</span>
                <div className="text-xl font-bold font-mono text-blue-900 mt-1">{totalEmployesCount}</div>
                <span className="text-[10px] text-slate-400 block mt-0.5">Ouvriers & Cadres</span>
              </div>

              {/* 3. Achats en attente */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-xs">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Achats Attente</span>
                <div className="text-xl font-bold font-mono text-amber-900 mt-1">{pendingAchatsCount}</div>
                <span className="text-[10px] text-amber-700 block mt-0.5">DA en cours</span>
              </div>

              {/* 4. Dépenses globales */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Dépenses Glob.</span>
                <div className="text-sm font-bold font-mono text-slate-900 mt-1 truncate" title={formatDZD(totalBudgetEngage)}>
                  {formatDZD(totalBudgetEngage)}
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">Sur budget prévisionnel</span>
              </div>

              {/* 5. Alertes */}
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 shadow-xs">
                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Alertes</span>
                <div className="text-xl font-bold font-mono text-rose-900 mt-1">{totalAlertesCount}</div>
                <span className="text-[10px] text-rose-700 block mt-0.5">Critiques & Avis</span>
              </div>

              {/* 6. Notifications */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Notifications</span>
                <div className="text-xl font-bold font-mono text-indigo-900 mt-1">{notifications.length}</div>
                <span className="text-[10px] text-slate-400 block mt-0.5">Alertes enregistrées</span>
              </div>

              {/* 7. Avancement des projets */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-xs">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Avancement</span>
                <div className="text-xl font-bold font-mono text-emerald-900 mt-1">{avgAvancement}%</div>
                <span className="text-[10px] text-emerald-700 block mt-0.5">Moyenne physique</span>
              </div>
            </div>
          )}

          {adminTab === 'journal' && (
            <JournalHistoriquePanel
              rapports={rapportsChantier}
              chantiers={chantiers}
              selectedChantierId={selectedChantierId}
              title="Historique des Journaux de Chantier"
              subtitle="Suivi centralisé des rapports journaliers, effectifs, intempéries et signalements des conducteurs de travaux."
              accentColor="orange"
              allowChantierFilter={true}
            />
          )}
        </div>
      )}

      {/* 2. RESPONSABLE RH DASHBOARD */}
      {roleSlug === 'role-rh' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase">Effectif Global BTP</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">{employes.length}</div>
            <span className="text-xs text-slate-500 mt-1 block">Ouvriers et encadrement chantier</span>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-emerald-700 mb-2">
              <span className="text-xs font-bold uppercase">Présents Aujourd'hui</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-900">
              {pointages.filter(p => p.statut === 'PRESENT' || p.statut === 'RETARD').length}
            </div>
            <span className="text-xs text-emerald-700 mt-1 block">Taux de présence : {Math.round((pointages.filter(p => p.statut === 'PRESENT').length / (pointages.length || 1)) * 100)}%</span>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-amber-700 mb-2">
              <span className="text-xs font-bold uppercase">Dérogations Pointage</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-900">
              {notifications.filter(n => n.module === 'RH' && n.type === 'VALIDATION_REQUISE').length}
            </div>
            <span className="text-xs text-amber-700 mt-1 block">Demandes post-clôture en attente</span>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-purple-700 mb-2">
              <span className="text-xs font-bold uppercase">Congés & Maladie</span>
              <Calendar className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-purple-900">
              {employes.filter(e => e.statut === 'EN_CONGE' || e.statut === 'ARRET_MALADIE').length}
            </div>
            <span className="text-xs text-purple-700 mt-1 block">Absences justifiées CNAS</span>
          </div>
        </div>
      )}

      {/* 3. RESPONSABLE JURIDIQUE DASHBOARD */}
      {roleSlug === 'role-juridique' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase">Contrats en Vigueur</span>
              <Scale className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">{contratsJuridiques.length}</div>
            <span className="text-xs text-slate-500 mt-1 block">Fournisseurs, VEFA, baux & sous-traitance</span>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-emerald-700 mb-2">
              <span className="text-xs font-bold uppercase">Documents Fonciers & Permis</span>
              <FileCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-900">14</div>
            <span className="text-xs text-emerald-700 mt-1 block">Actes, livres fonciers et PC délivrés</span>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-rose-700 mb-2">
              <span className="text-xs font-bold uppercase">Contentieux & Litiges</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-rose-900">3</div>
            <span className="text-xs text-rose-700 mt-1 block">Dossiers en instruction auprès des tribunaux</span>
          </div>
        </div>
      )}

      {/* 4. RESPONSABLE COMPTABILITÉ DASHBOARD */}
      {roleSlug === 'role-compta' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Achats à contrôler</span>
            <div className="text-2xl font-bold font-mono text-amber-900 mt-1">
              {demandesAchat.filter(d => d.statut === 'EN_ATTENTE_COMPTABILITE').length}
            </div>
            <span className="text-xs text-slate-500 block mt-1">Visas budgétaires requis</span>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 shadow-xs">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">Recettes VEFA Encaissées</span>
            <div className="text-lg font-bold font-mono text-blue-900 mt-1">
              {reservationsVEFA.reduce((a, r) => a + r.montant_encaisse_dzd, 0).toLocaleString('fr-DZ')} DZD
            </div>
            <span className="text-xs text-blue-600 block mt-1">Versements acquéreurs Loi 11-04</span>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 shadow-xs">
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider block">Situations CTC & Factures</span>
            <div className="text-2xl font-bold font-mono text-purple-900 mt-1">8</div>
            <span className="text-xs text-purple-600 block mt-1">Rapprochement 3-voies en cours</span>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-xs">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">Déclarations Fiscales G50</span>
            <div className="text-2xl font-bold font-mono text-emerald-900 mt-1">À jour</div>
            <span className="text-xs text-emerald-700 block mt-1">TAP (0%), TVA 19%, IRG Salaires</span>
          </div>
        </div>
      )}

      {/* 5. RESPONSABLE MATÉRIEL DASHBOARD */}
      {roleSlug === 'role-materiel' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase">Engins & Véhicules Actifs</span>
              <Truck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">{vehicules.length}</div>
            <span className="text-xs text-slate-500 mt-1 block">Grues, camions toupies, rétrochargeurs</span>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-amber-700 mb-2">
              <span className="text-xs font-bold uppercase">Vidanges & Maintenances</span>
              <Wrench className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-900">4</div>
            <span className="text-xs text-amber-700 mt-1 block">Interventions préventives ce mois</span>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-rose-700 mb-2">
              <span className="text-xs font-bold uppercase">Assurances & Contrôles CTC</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-rose-900">2</div>
            <span className="text-xs text-rose-700 mt-1 block">Échéances à renouveler sous 30 jours</span>
          </div>
        </div>
      )}

      {/* 6. RESPONSABLE COMMERCIAL DASHBOARD */}
      {roleSlug === 'role-commercial' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase block">Programme Immobilier</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{biensImmobiliers.length}</div>
            <span className="text-xs text-slate-500 block mt-1">Logements & Locaux commerciaux</span>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-xs">
            <span className="text-xs font-bold text-emerald-800 uppercase block">Lots Disponibles</span>
            <div className="text-2xl font-bold font-mono text-emerald-900 mt-1">
              {biensImmobiliers.filter(b => b.statut === 'DISPONIBLE').length}
            </div>
            <span className="text-xs text-emerald-700 block mt-1">Catalogue prêt à la vente</span>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 shadow-xs">
            <span className="text-xs font-bold text-indigo-800 uppercase block">Réservations VEFA</span>
            <div className="text-2xl font-bold font-mono text-indigo-900 mt-1">{reservationsVEFA.length}</div>
            <span className="text-xs text-indigo-700 block mt-1">Contrats notariés signés</span>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 shadow-xs">
            <span className="text-xs font-bold text-purple-800 uppercase block">Taux de Vente Global</span>
            <div className="text-2xl font-bold font-mono text-purple-900 mt-1">
              {Math.round((biensImmobiliers.filter(b => b.statut === 'VENDU' || b.statut === 'RESERVE').length / (biensImmobiliers.length || 1)) * 100)}%
            </div>
            <span className="text-xs text-purple-700 block mt-1">Objectif commercial atteint</span>
          </div>
        </div>
      )}

      {/* 7. RESPONSABLE APPROVISIONNEMENTS DASHBOARD */}
      {roleSlug === 'role-appro' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase block">DA Visées & Prêtes</span>
            <div className="text-2xl font-bold font-mono text-blue-900 mt-1">
              {scopedDAs.filter(d => d.statut === 'VALIDEE' || d.statut === 'EN_COURS_APPROVISIONNEMENT').length}
            </div>
            <span className="text-xs text-slate-500 block mt-1">Commandes fournisseurs à émettre</span>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 shadow-xs">
            <span className="text-xs font-bold text-blue-700 uppercase block">Bons de Commande Émis</span>
            <div className="text-2xl font-bold font-mono text-blue-900 mt-1">{scopedBonsCommande.length}</div>
            <span className="text-xs text-blue-600 block mt-1">Livraison directe magasins chantiers</span>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 shadow-xs">
            <span className="text-xs font-bold text-indigo-800 uppercase block">Stocks Chantiers Suivis</span>
            <div className="text-2xl font-bold font-mono text-indigo-900 mt-1">{scopedArticles.length}</div>
            <span className="text-xs text-indigo-700 block mt-1">
              {scopedArticles.filter(a => a.quantite_stock <= a.seuil_alerte_minimum).length} article(s) en alerte basse
            </span>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-xs">
            <span className="text-xs font-bold text-amber-800 uppercase block">Retards / Alertes Livraison</span>
            <div className="text-2xl font-bold font-mono text-amber-900 mt-1">
              {scopedNotifications.filter(n => n.titre.includes('Retard') || n.type === 'AVERTISSEMENT').length}
            </div>
            <span className="text-xs text-amber-700 block mt-1">Suivi fournisseurs en cours</span>
          </div>
        </div>
      )}

      {/* 8. RESPONSABLE TECHNIQUE & BET DASHBOARD */}
      {roleSlug === 'role-tech' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase block">Chantiers Suivis</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{totalChantiersCount}</div>
            <span className="text-xs text-slate-500 block mt-1">Avancement moyen : {avgAvancement}%</span>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-xs">
            <span className="text-xs font-bold text-amber-800 uppercase block">Métrés à Valider</span>
            <div className="text-2xl font-bold font-mono text-amber-900 mt-1">
              {scopedMetres.filter(m => m.statut !== 'VALIDE').length}
            </div>
            <span className="text-xs text-amber-700 block mt-1">Situations & attachements en cours</span>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-xs">
            <span className="text-xs font-bold text-emerald-800 uppercase block">Contrôles CTC</span>
            <div className="text-2xl font-bold font-mono text-emerald-900 mt-1">
              {controlesCTC.filter(c => activeChantierIds.includes(c.chantier_id)).length}
            </div>
            <span className="text-xs text-emerald-700 block mt-1">PV techniques enregistrés</span>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-indigo-800 uppercase block">Accès Rapide BET</span>
              <span className="text-xs text-indigo-700 block mt-1">Consulter plans, métrés et avancement</span>
            </div>
            <button
              onClick={() => setActiveNav('metres')}
              className="mt-3 text-xs font-bold text-indigo-900 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Ouvrir Métrés & Situations <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 9. CONDUCTEUR DE TRAVAUX (CHANTIER) DASHBOARD */}
      {roleSlug === 'role-ct' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase">Bons de Sortie à Signer</span>
              <FileText className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-900">
              {scopedBonsSortie.filter(bs => bs.statut_validation_ct === 'EN_ATTENTE').length}
            </div>
            <button
              onClick={() => setActiveNav('suivi-travaux')}
              className="text-xs text-amber-700 hover:underline mt-1 flex items-center gap-1 font-semibold cursor-pointer"
            >
              Signer dans Suivi Travaux <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-rose-700 mb-2">
              <span className="text-xs font-bold uppercase">Alertes Stock Chantier</span>
              <Store className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-rose-900">
              {scopedArticles.filter(a => a.quantite_stock <= a.seuil_alerte_minimum).length}
            </div>
            <span className="text-xs text-rose-700 mt-1 block">
              Sur {scopedArticles.length} références en magasin
            </span>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-blue-700 mb-2">
              <span className="text-xs font-bold uppercase">Rapports Journaliers</span>
              <HardHat className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-blue-900">
              {rapportsChantier.filter(r => activeChantierIds.includes(r.chantier_id)).length}
            </div>
            <span className="text-xs text-blue-700 mt-1 block">Journaux de chantier saisis</span>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-emerald-700 mb-2">
              <span className="text-xs font-bold uppercase">Demandes d&apos;Achat (DA)</span>
              <ShoppingCart className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-900">{scopedDAs.length}</div>
            <span className="text-xs text-emerald-700 mt-1 block">
              {pendingAchatsCount} en cours de traitement
            </span>
          </div>
        </div>
      )}

      {/* 10. MÉTREUR VÉRIFICATEUR (CHANTIER) DASHBOARD */}
      {roleSlug === 'role-metreur' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase">Métrés Enregistrés</span>
              <Layers className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">{scopedMetres.length}</div>
            <span className="text-xs text-slate-500 mt-1 block">Attachements de votre chantier</span>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-amber-700 mb-2">
              <span className="text-xs font-bold uppercase">En Attente / Brouillons</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-900">
              {scopedMetres.filter(m => m.statut !== 'VALIDE').length}
            </div>
            <button
              onClick={() => setActiveNav('metres')}
              className="text-xs text-amber-800 hover:underline mt-1 flex items-center gap-1 font-semibold cursor-pointer"
            >
              Ouvrir Métrés & Situations <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-emerald-700 mb-2">
              <span className="text-xs font-bold uppercase">Métrés Validés</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-900">
              {scopedMetres.filter(m => m.statut === 'VALIDE').length}
            </div>
            <span className="text-xs text-emerald-700 mt-1 block">Avancement physique : {avgAvancement}%</span>
          </div>
        </div>
      )}

      {/* 11. MAGASINIER (CHANTIER) DASHBOARD */}
      {roleSlug === 'role-magasinier' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase">Articles en Stock</span>
              <Package className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">{scopedArticles.length}</div>
            <button
              onClick={() => setActiveNav('magasin')}
              className="text-xs text-emerald-700 hover:underline mt-1 flex items-center gap-1 font-semibold cursor-pointer"
            >
              Gérer le magasin <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-amber-700 mb-2">
              <span className="text-xs font-bold uppercase">Livraisons Appro à Réceptionner</span>
              <Truck className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-900">
              {scopedBonsCommande.filter(bc => ['EMIS', 'CONFIRME_FOURNISSEUR', 'EN_LIVRAISON', 'LIVRE_PARTIEL'].includes(bc.statut)).length}
            </div>
            <span className="text-xs text-amber-700 mt-1 block">Commandes en attente de BR</span>
          </div>

          <div className="bg-teal-50 border border-teal-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-teal-700 mb-2">
              <span className="text-xs font-bold uppercase">BS Signés CT à Confirmer</span>
              <FileCheck className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-teal-900">
              {scopedBonsSortie.filter(bs => bs.statut_validation_ct === 'VALIDE' && bs.statut_confirmation_magasinier === 'EN_ATTENTE').length}
            </div>
            <span className="text-xs text-teal-700 mt-1 block">Prêts pour sortie de stock</span>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-rose-700 mb-2">
              <span className="text-xs font-bold uppercase">Alertes Stock Bas</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-rose-900">
              {scopedArticles.filter(a => a.quantite_stock <= a.seuil_alerte_minimum).length}
            </div>
            <span className="text-xs text-rose-700 mt-1 block">Sous le seuil minimum</span>
          </div>
        </div>
      )}

      {/* Main Two-Column Layout: Project Health & Notifications Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {selectedChantierId === 'ALL'
                    ? 'Cartographie & Santé des Chantiers Rattachés'
                    : 'Fiche Synthétique du Chantier'}
                </h3>
                <p className="text-xs text-slate-500">
                  Entités autonomes consolidées au niveau de la société mère
                </p>
              </div>
              <button
                onClick={() => setActiveNav(primaryAction.nav)}
                className="text-xs text-emerald-700 font-medium hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                {primaryAction.label}
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {activeChantiers.map((c) => {
                const ratioBudget = Math.round((c.budget_engage / c.budget_global_prevu) * 100);
                return (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all bg-slate-50/50"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">
                            {c.nom_projet}
                          </h4>
                          <span className="font-mono text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {c.code_chantier}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{c.commune}, {c.wilaya}</span>
                          <span>·</span>
                          <span>{c.nombre_logements} logts ({c.nombre_niveaux})</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-800">
                          Phase : {c.statut.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <div className={`grid grid-cols-1 ${canSeeBudget ? 'sm:grid-cols-2' : ''} gap-4 mt-3 pt-3 border-t border-slate-200/60 text-xs`}>
                      <div>
                        <div className="flex justify-between text-slate-600 mb-1">
                          <span>Avancement Physique</span>
                          <span className="font-mono font-bold text-slate-900">{c.taux_avancement_physique}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 rounded-full"
                            style={{ width: `${c.taux_avancement_physique}%` }}
                          />
                        </div>
                      </div>

                      {canSeeBudget && (
                        <div>
                          <div className="flex justify-between text-slate-600 mb-1">
                            <span>Consommation Budgétaire</span>
                            <span className="font-mono font-bold text-slate-900">{ratioBudget}%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${ratioBudget > 85 ? 'bg-amber-500' : 'bg-blue-600'}`}
                              style={{ width: `${Math.min(ratioBudget, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Workflows Feed (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Dernières Alertes & Workflows
                </h4>
              </div>
              <button
                onClick={() => setActiveNav('notifications')}
                className="text-[11px] text-emerald-700 hover:text-emerald-800 font-medium cursor-pointer"
              >
                Voir tout ({scopedNotifications.length})
              </button>
            </div>

            <div className="space-y-2.5">
              {scopedNotifications.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  Aucune alerte récente sur votre périmètre.
                </div>
              ) : (
                scopedNotifications.slice(0, 5).map((notif) => (
                  <div
                    key={notif.id}
                    className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/50 text-xs transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-semibold text-slate-900 line-clamp-1">
                        {notif.titre}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        notif.type === 'CRITIQUE' ? 'bg-rose-100 text-rose-700' :
                        notif.type === 'VALIDATION_REQUISE' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-50 text-blue-700'
                      }`}>
                        {notif.type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2">
                      {notif.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
