'use client';

import React, { useState } from 'react';
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
  CreditCard
} from 'lucide-react';
import { useApp } from '../context/AppContext';

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
    employes,
    pointages,
    vehicules,
    articlesStock,
    contratsJuridiques,
    biensImmobiliers,
    reservationsVEFA,
    metres,
    currentUser,
    setActiveNav
  } = useApp();

  // Filters
  const [filterPeriod, setFilterPeriod] = useState<'EXERCICE_2026' | 'THIS_MONTH' | 'THIS_WEEK'>('EXERCICE_2026');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'EN_COURS' | 'EN_ATTENTE' | 'ALERTE'>('ALL');

  // Multi-chantier scope dataset
  const activeChantiers = selectedChantierId === 'ALL'
    ? chantiers
    : chantiers.filter(c => c.id === selectedChantierId);

  // Global Admin Metrics
  const totalChantiersCount = activeChantiers.length;
  const totalEmployesCount = employes.length;
  const pendingAchatsCount = demandesAchat.filter(d => ['EN_ATTENTE_COMPTABILITE', 'VALIDEE', 'EN_COURS_APPROVISIONNEMENT'].includes(d.statut)).length;
  const totalBudgetPrevu = activeChantiers.reduce((acc, c) => acc + c.budget_global_prevu, 0);
  const totalBudgetEngage = activeChantiers.reduce((acc, c) => acc + c.budget_engage, 0);
  const totalAlertesCount = notifications.filter(n => n.type === 'CRITIQUE' || n.type === 'AVERTISSEMENT' || n.type === 'VALIDATION_REQUISE').length;
  const avgAvancement = activeChantiers.length > 0
    ? (activeChantiers.reduce((acc, c) => acc + c.taux_avancement_physique, 0) / activeChantiers.length).toFixed(1)
    : '0';

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
            onClick={() => setActiveNav('chantiers')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline underline-offset-2 flex items-center gap-1"
          >
            Voir la fiche complète
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. ADMINISTRATEUR GLOBAL DASHBOARD */}
      {(userRole === 'role-admin' || userRole === 'ADMINISTRATEUR') && (
        <div className="space-y-6">
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
        </div>
      )}

      {/* 2. RESPONSABLE RH DASHBOARD */}
      {userRole === 'role-rh' && (
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
      {userRole === 'role-juridique' && (
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
      {userRole === 'role-compta' && (
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
      {userRole === 'role-materiel' && (
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
      {userRole === 'role-commercial' && (
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
      {userRole === 'role-appro' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase block">DA Visées & Prêtes</span>
            <div className="text-2xl font-bold font-mono text-blue-900 mt-1">
              {demandesAchat.filter(d => d.statut === 'VALIDEE' || d.statut === 'EN_COURS_APPROVISIONNEMENT').length}
            </div>
            <span className="text-xs text-slate-500 block mt-1">Commandes fournisseurs à émettre</span>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 shadow-xs">
            <span className="text-xs font-bold text-blue-700 uppercase block">Bons de Commande Émis</span>
            <div className="text-2xl font-bold font-mono text-blue-900 mt-1">{bonsCommande.length}</div>
            <span className="text-xs text-blue-600 block mt-1">Livraison directe magasins chantiers</span>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-xs">
            <span className="text-xs font-bold text-amber-800 uppercase block">Retards de Livraison Signallés</span>
            <div className="text-2xl font-bold font-mono text-amber-900 mt-1">
              {notifications.filter(n => n.titre.includes('Retard')).length}
            </div>
            <span className="text-xs text-amber-700 block mt-1">Suivi fournisseurs en cours</span>
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
                onClick={() => setActiveNav('chantiers')}
                className="text-xs text-emerald-700 font-medium hover:text-emerald-800 flex items-center gap-1"
              >
                Gérer tous les chantiers
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-200/60 text-xs">
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
                className="text-[11px] text-emerald-700 hover:text-emerald-800 font-medium"
              >
                Voir tout ({notifications.length})
              </button>
            </div>

            <div className="space-y-2.5">
              {notifications.slice(0, 4).map((notif) => (
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
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
