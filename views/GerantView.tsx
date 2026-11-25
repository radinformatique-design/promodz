'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Crown,
  Building2,
  HardHat,
  DollarSign,
  ShoppingCart,
  Warehouse,
  Users,
  Truck,
  Scale,
  Ruler,
  Bell,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Briefcase,
  FolderOpen,
  ShieldCheck
} from 'lucide-react';

type GerantSectionTab =
  | 'synthese'
  | 'chantiers'
  | 'finances'
  | 'appro_stocks'
  | 'rh'
  | 'materiel'
  | 'commercial'
  | 'juridique_metres';

export const GerantView: React.FC = () => {
  const {
    currentUser,
    chantiers,
    selectedChantierId,
    rapportsChantier,
    controlesCTC,
    demandesAchat,
    bonsCommande,
    facturesFournisseurs,
    articlesStock,
    employes,
    pointages,
    vehicules,
    biensImmobiliers,
    reservationsVEFA,
    contratsJuridiques,
    metres,
    notifications,
    documents,
    setActiveNav
  } = useApp();

  const [activeTab, setActiveTab] = useState<GerantSectionTab>('synthese');

  const scopedChantiers = useMemo(
    () =>
      selectedChantierId === 'ALL'
        ? chantiers
        : chantiers.filter(c => c.id === selectedChantierId),
    [chantiers, selectedChantierId]
  );

  const scopedChantierIds = useMemo(
    () => scopedChantiers.map(c => c.id),
    [scopedChantiers]
  );

  const formatDZD = (val: number) =>
    new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      maximumFractionDigits: 0
    }).format(val || 0);

  // KPIs consolidés
  const budgetTotal = scopedChantiers.reduce((s, c) => s + (c.budget_global_prevu || 0), 0);
  const budgetEngage = scopedChantiers.reduce((s, c) => s + (c.budget_engage || 0), 0);
  const avgAvancement =
    scopedChantiers.length > 0
      ? (
          scopedChantiers.reduce((s, c) => s + (c.taux_avancement_physique || 0), 0) /
          scopedChantiers.length
        ).toFixed(1)
      : '0';

  const recettesVEFA = reservationsVEFA.reduce((s, r) => s + (r.montant_encaisse_dzd || 0), 0);
  const scopedArticles = articlesStock.filter(a => scopedChantierIds.includes(a.chantier_id));
  const alertesStock = scopedArticles.filter(a => a.quantite_stock <= a.seuil_alerte_minimum);
  const unreadNotifs = notifications.filter(n => !n.lu).length;

  const tabs: { id: GerantSectionTab; label: string; icon: any }[] = [
    { id: 'synthese', label: 'Synthèse Direction', icon: Crown },
    { id: 'chantiers', label: `Chantiers & Travaux (${scopedChantiers.length})`, icon: HardHat },
    { id: 'finances', label: 'Finances & Factures', icon: DollarSign },
    { id: 'appro_stocks', label: `Appro & Stocks (${scopedArticles.length})`, icon: Warehouse },
    { id: 'rh', label: `RH & Pointage (${employes.length})`, icon: Users },
    { id: 'materiel', label: `Matériel (${vehicules.length})`, icon: Truck },
    { id: 'commercial', label: `Commercial & VEFA (${biensImmobiliers.length})`, icon: Briefcase },
    { id: 'juridique_metres', label: 'Juridique & Métrés', icon: Scale }
  ];

  const sectionCards: { nav: string; title: string; metric: string; sub: string; icon: any; color: string }[] = [
    {
      nav: 'chantiers',
      title: 'Chantiers & Projets',
      metric: `${scopedChantiers.length} Chantiers`,
      sub: `Avancement moyen ${avgAvancement}%`,
      icon: Building2,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200'
    },
    {
      nav: 'suivi-travaux',
      title: 'Suivi des Travaux',
      metric: `${rapportsChantier.length} Rapports`,
      sub: `${controlesCTC.length} Contrôles CTC`,
      icon: HardHat,
      color: 'text-amber-600 bg-amber-50 border-amber-200'
    },
    {
      nav: 'comptabilite',
      title: 'Comptabilité & Budget',
      metric: formatDZD(budgetEngage),
      sub: `Sur ${formatDZD(budgetTotal)}`,
      icon: DollarSign,
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    },
    {
      nav: 'approvisionnements',
      title: 'Approvisionnements',
      metric: `${demandesAchat.length} DA · ${bonsCommande.length} BC`,
      sub: `${demandesAchat.filter(d => d.statut === 'VALIDEE' || d.statut === 'EN_COURS_APPROVISIONNEMENT').length} en cours`,
      icon: ShoppingCart,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200'
    },
    {
      nav: 'magasin',
      title: 'Magasins & Stocks',
      metric: `${scopedArticles.length} Articles`,
      sub: `${alertesStock.length} alerte(s) stock bas`,
      icon: Warehouse,
      color: 'text-teal-600 bg-teal-50 border-teal-200'
    },
    {
      nav: 'rh',
      title: 'RH & Pointage',
      metric: `${employes.length} Employés`,
      sub: `${pointages.length} pointages enregistrés`,
      icon: Users,
      color: 'text-purple-600 bg-purple-50 border-purple-200'
    },
    {
      nav: 'materiel',
      title: 'Parc Matériel',
      metric: `${vehicules.length} Engins`,
      sub: `${vehicules.filter(v => v.statut === 'ACTIF').length} actifs sur site`,
      icon: Truck,
      color: 'text-sky-600 bg-sky-50 border-sky-200'
    },
    {
      nav: 'commercial',
      title: 'Commercial & VEFA',
      metric: `${reservationsVEFA.length} Réservations`,
      sub: `Encaissé : ${formatDZD(recettesVEFA)}`,
      icon: Briefcase,
      color: 'text-rose-600 bg-rose-50 border-rose-200'
    },
    {
      nav: 'juridique',
      title: 'Juridique & Foncier',
      metric: `${contratsJuridiques.length} Contrats`,
      sub: `${documents.length} documents GED`,
      icon: Scale,
      color: 'text-orange-600 bg-orange-50 border-orange-200'
    },
    {
      nav: 'metres',
      title: 'Métrés & Situations',
      metric: `${metres.length} Métrés`,
      sub: `${metres.filter(m => m.statut === 'VALIDE').length} validés`,
      icon: Ruler,
      color: 'text-cyan-600 bg-cyan-50 border-cyan-200'
    },
    {
      nav: 'administration',
      title: 'Administration & RBAC',
      metric: 'Privilèges Complets',
      sub: 'Gestion utilisateurs & matrice',
      icon: ShieldCheck,
      color: 'text-slate-700 bg-slate-100 border-slate-300'
    },
    {
      nav: 'notifications',
      title: 'Notifications & Alertes',
      metric: `${notifications.length} Total`,
      sub: `${unreadNotifs} non lue(s)`,
      icon: Bell,
      color: 'text-amber-700 bg-amber-50 border-amber-200'
    }
  ];

  return (
    <div className="space-y-6">
      {/* En-tête Exécutif Gérant */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-indigo-500/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest mb-1.5">
              <Crown className="w-4 h-4" />
              <span>Direction Générale · Gérant de l&apos;Entreprise</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Espace Gérant — Consultation Globale des Sections
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Bienvenue {currentUser?.prenom} {currentUser?.nom}. Consultez l&apos;ensemble des départements, chantiers, finances, stocks et équipes depuis un cockpit unique avec tous les privilèges d&apos;administration.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveNav('dashboard')}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold border border-white/15 cursor-pointer"
            >
              Tableau de bord
            </button>
            <button
              onClick={() => setActiveNav('administration')}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold cursor-pointer"
            >
              Administration
            </button>
            <button
              onClick={() => setActiveNav('messagerie')}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold border border-white/15 cursor-pointer"
            >
              Messagerie
            </button>
          </div>
        </div>

        {/* Navigation interne des sections */}
        <div className="flex flex-wrap items-center gap-1.5 mt-6 bg-slate-950/70 p-1.5 rounded-2xl border border-white/10">
          {tabs.map(t => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  active
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. SYNTHÈSE DIRECTION (Accès à toutes les sections) */}
      {activeTab === 'synthese' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sectionCards.map(card => {
            const Icon = card.icon;
            return (
              <div
                key={card.nav}
                onClick={() => setActiveNav(card.nav)}
                className="bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md rounded-2xl p-5 transition cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${card.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{card.title}</div>
                <div className="text-lg font-extrabold text-slate-900 mt-1 truncate">{card.metric}</div>
                <div className="text-xs text-slate-500 mt-0.5">{card.sub}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. CHANTIERS & TRAVAUX */}
      {activeTab === 'chantiers' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">État Consolidé des Chantiers & Travaux</h3>
            <button
              onClick={() => setActiveNav('chantiers')}
              className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Ouvrir le module Chantiers <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b">
                <tr>
                  <th className="py-2.5 px-4">Code / Projet</th>
                  <th className="py-2.5 px-4">Localisation</th>
                  <th className="py-2.5 px-4">Phase</th>
                  <th className="py-2.5 px-4 text-right">Avancement</th>
                  <th className="py-2.5 px-4 text-right">Budget Engagé / Prévu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scopedChantiers.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{c.nom_projet}</div>
                      <div className="font-mono text-[10px] text-slate-400">{c.code_chantier}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{c.commune}, {c.wilaya}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">{c.statut}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">{c.taux_avancement_physique}%</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      {formatDZD(c.budget_engage)} / {formatDZD(c.budget_global_prevu)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. FINANCES & COMPTABILITÉ */}
      {activeTab === 'finances' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="text-xs font-bold text-slate-500 uppercase">Budget Global Prévu</div>
              <div className="text-xl font-black text-slate-900 mt-1">{formatDZD(budgetTotal)}</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
              <div className="text-xs font-bold text-blue-700 uppercase">Budget Engagé</div>
              <div className="text-xl font-black text-blue-900 mt-1">{formatDZD(budgetEngage)}</div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
              <div className="text-xs font-bold text-emerald-700 uppercase">Recettes VEFA Encaissées</div>
              <div className="text-xl font-black text-emerald-900 mt-1">{formatDZD(recettesVEFA)}</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <h3 className="font-bold text-slate-900 text-sm">Factures Fournisseurs ({facturesFournisseurs.length})</h3>
              <button
                onClick={() => setActiveNav('comptabilite')}
                className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Ouvrir Comptabilité <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b">
                  <tr>
                    <th className="py-2.5 px-4">N° Facture</th>
                    <th className="py-2.5 px-4">Fournisseur</th>
                    <th className="py-2.5 px-4">Chantier</th>
                    <th className="py-2.5 px-4 text-right">Montant TTC</th>
                    <th className="py-2.5 px-4">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {facturesFournisseurs.slice(0, 15).map(f => (
                    <tr key={f.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{f.numero_facture}</td>
                      <td className="py-2.5 px-4 text-slate-700">{f.fournisseur_nom}</td>
                      <td className="py-2.5 px-4 text-slate-600">{f.chantier_nom}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold">{formatDZD(f.montant_ttc_dzd)}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">{f.statut_comptable}</span>
                      </td>
                    </tr>
                  ))}
                  {facturesFournisseurs.length === 0 && (
                    <tr><td colSpan={5} className="py-6 text-center text-slate-400">Aucune facture enregistrée.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. APPROVISIONNEMENTS & STOCKS MAGASINS */}
      {activeTab === 'appro_stocks' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">
              Stocks des Magasins de Chantiers ({scopedArticles.length} références · {alertesStock.length} alerte(s))
            </h3>
            <div className="flex items-center gap-3">
              <button onClick={() => setActiveNav('approvisionnements')} className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer">
                Ouvrir Approvisionnements →
              </button>
              <button onClick={() => setActiveNav('magasin')} className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer">
                Ouvrir Magasin →
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b">
                <tr>
                  <th className="py-2.5 px-4">Chantier</th>
                  <th className="py-2.5 px-4">Code / Désignation</th>
                  <th className="py-2.5 px-4 text-right">Stock</th>
                  <th className="py-2.5 px-4 text-right">Seuil Min</th>
                  <th className="py-2.5 px-4 text-center">État</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scopedArticles.slice(0, 25).map(a => {
                  const low = a.quantite_stock <= a.seuil_alerte_minimum;
                  return (
                    <tr key={a.id} className={low ? 'bg-rose-50/40' : 'hover:bg-slate-50'}>
                      <td className="py-2.5 px-4 text-slate-600">{a.chantier_nom}</td>
                      <td className="py-2.5 px-4">
                        <div className="font-bold text-slate-900">{a.designation}</div>
                        <div className="font-mono text-[10px] text-slate-400">{a.code_article}</div>
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold">{a.quantite_stock} {a.unite_mesure}</td>
                      <td className="py-2.5 px-4 text-right text-slate-500">{a.seuil_alerte_minimum}</td>
                      <td className="py-2.5 px-4 text-center">
                        {low ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px]">STOCK BAS</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">OK</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. RH & POINTAGE */}
      {activeTab === 'rh' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Effectifs & Personnel ({employes.length})</h3>
            <button onClick={() => setActiveNav('rh')} className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer">
              Ouvrir module RH →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b">
                <tr>
                  <th className="py-2.5 px-4">Matricule / Nom</th>
                  <th className="py-2.5 px-4">Catégorie / Poste</th>
                  <th className="py-2.5 px-4">Chantier</th>
                  <th className="py-2.5 px-4">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employes.slice(0, 20).map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4">
                      <div className="font-bold text-slate-900">{emp.prenom} {emp.nom}</div>
                      <div className="font-mono text-[10px] text-slate-400">{emp.matricule}</div>
                    </td>
                    <td className="py-2.5 px-4 text-slate-700">{emp.categorie}</td>
                    <td className="py-2.5 px-4 text-slate-600">{emp.chantier_actuel_nom || 'Siège Central'}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">{emp.statut}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. MATÉRIEL & ENGINS */}
      {activeTab === 'materiel' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Parc Matériel & Engins ({vehicules.length})</h3>
            <button onClick={() => setActiveNav('materiel')} className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer">
              Ouvrir module Matériel →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b">
                <tr>
                  <th className="py-2.5 px-4">Code / Immatriculation</th>
                  <th className="py-2.5 px-4">Marque & Modèle</th>
                  <th className="py-2.5 px-4">Chantier Affecté</th>
                  <th className="py-2.5 px-4">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vehicules.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{v.num_interne} · {v.immatriculation}</td>
                    <td className="py-2.5 px-4 text-slate-700">{v.marque} {v.modele}</td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {chantiers.find(c => c.id === v.chantier_id)?.nom_projet || 'Parc Central'}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">{v.statut}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. COMMERCIAL & VEFA */}
      {activeTab === 'commercial' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">
              Programme Immobilier ({biensImmobiliers.length} lots) & Réservations VEFA ({reservationsVEFA.length})
            </h3>
            <button onClick={() => setActiveNav('commercial')} className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer">
              Ouvrir module Commercial →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="font-bold text-emerald-800 uppercase">Lots Disponibles</div>
              <div className="text-2xl font-black text-emerald-900 mt-1">
                {biensImmobiliers.filter(b => b.statut === 'DISPONIBLE').length}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
              <div className="font-bold text-indigo-800 uppercase">Lots Réservés / Vendus</div>
              <div className="text-2xl font-black text-indigo-900 mt-1">
                {biensImmobiliers.filter(b => b.statut === 'RESERVE' || b.statut === 'VENDU').length}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <div className="font-bold text-blue-800 uppercase">Encaissements VEFA</div>
              <div className="text-xl font-black text-blue-900 mt-1">{formatDZD(recettesVEFA)}</div>
            </div>
          </div>
        </div>
      )}

      {/* 8. JURIDIQUE & MÉTRÉS */}
      {activeTab === 'juridique_metres' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Contrats Juridiques ({contratsJuridiques.length})</h3>
              <button onClick={() => setActiveNav('juridique')} className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer">
                Ouvrir Juridique →
              </button>
            </div>
            {contratsJuridiques.slice(0, 6).map(ct => (
              <div key={ct.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">{ct.titre}</div>
                  <div className="text-slate-500">{ct.partie_prenante_nom}</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-white border font-semibold text-slate-700">{ct.statut}</span>
              </div>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Métrés & Situations ({metres.length})</h3>
              <button onClick={() => setActiveNav('metres')} className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer">
                Ouvrir Métrés →
              </button>
            </div>
            {metres.slice(0, 6).map(m => (
              <div key={m.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">{m.saisi_par_nom} · {m.date_mesure}</div>
                  <div className="text-slate-500">Quantité exécutée : {m.quantite_executee}</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-white border font-semibold text-slate-700">{m.statut}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
