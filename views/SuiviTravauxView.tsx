'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  HardHat, 
  ClipboardCheck, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Search, 
  ShieldCheck, 
  Printer, 
  X, 
  Check, 
  Truck, 
  TrendingUp, 
  ChevronRight, 
  Clock, 
  Award, 
  AlertTriangle, 
  Layers, 
  Users, 
  Filter, 
  Eye,
  Building,
  ShoppingCart,
  Send,
  FileText,
  Store,
  Package,
  ArrowDownRight,
  ArrowUpRight,
  Lock
} from 'lucide-react';
import { 
  RapportChantier, 
  ControleCTC, 
  MetreVérification, 
  Vehicule,
  NiveauUrgence,
  ArticleStock,
  MouvementStock,
  BonSortie
} from '../types/database';

type SuiviTab = 'cockpit' | 'journal' | 'ctc' | 'validation_metres' | 'magasin_site' | 'demandes_achat' | 'materiel_site';

export const SuiviTravauxView: React.FC = () => {
  const { 
    selectedChantierId, 
    currentChantier,
    allChantiers,
    rapportsChantier, 
    controlesCTC, 
    metres, 
    postesTravaux, 
    lotsTravaux, 
    structuresChantier,
    vehicules,
    currentUser,
    soumettreRapportChantier,
    ajouterControleCTC,
    validerMetre,
    setActiveNav,
    creerDemandeAchat,
    demandesAchat,
    articlesStock,
    mouvementsStock,
    bonsSortie,
    validerBonSortieConducteur
  } = useApp();

  const [activeTab, setActiveTab] = useState<SuiviTab>('cockpit');
  const [searchTerm, setSearchTerm] = useState('');
  const [stockSearchTerm, setStockSearchTerm] = useState('');
  const [stockFamilyFilter, setStockFamilyFilter] = useState('ALL');

  // Modales
  const [isNewRapportModalOpen, setIsNewRapportModalOpen] = useState(false);
  const [isNewCTCModalOpen, setIsNewCTCModalOpen] = useState(false);
  const [isNewDAModalOpen, setIsNewDAModalOpen] = useState(false);
  const [daFeedback, setDaFeedback] = useState<string | null>(null);
  const [bsFeedback, setBsFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [bsToRefuse, setBsToRefuse] = useState<BonSortie | null>(null);
  const [bsRefusMotif, setBsRefusMotif] = useState('');

  // Formulaire Demande d'Achat (DA)
  const [daForm, setDaForm] = useState({
    designation_produit: '',
    famille_article: 'MATERIAUX_GROS_OEUVRE',
    quantite_demandee: 1,
    unite_mesure: 'Tonne',
    niveau_urgence: 'NORMAL' as NiveauUrgence,
    justification: '',
    date_besoin_chantier: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    estimation_budget_dzd: 0
  });
  const [selectedRapportForDetail, setSelectedRapportForDetail] = useState<RapportChantier | null>(null);
  const [selectedMetreForDetail, setSelectedMetreForDetail] = useState<MetreVérification | null>(null);

  // Formulaire Nouveau Rapport Journalier
  const [rapportForm, setRapportForm] = useState({
    date_rapport: new Date().toISOString().split('T')[0],
    type: 'JOURNALIER' as 'JOURNALIER' | 'HEBDOMADAIRE' | 'MENSUEL',
    meteo: 'Ensoleillé',
    heures_intemperies: 0,
    effectif_total: 0,
    materiel_sur_site: '',
    activites_realisees: '',
    anomalies_retards: '',
    incidents_securite: ''
  });

  // Formulaire Nouveau Contrôle CTC
  const [ctcForm, setCtcForm] = useState({
    numero_pv: '',
    date_visite: new Date().toISOString().split('T')[0],
    ouvrage_concerne: '',
    ingenieur_ctc: '',
    organisme_ctc: 'CTC',
    type_controle: 'FERRAILLAGE' as ControleCTC['type_controle'],
    avis: 'FAVORABLE' as ControleCTC['avis'],
    autorise_coulage: true,
    resistance_eprouvettes_28j: undefined as number | undefined,
    reserves: ''
  });

  // Filtrages par chantier actif
  const chantierRapports = useMemo(() => 
    rapportsChantier.filter(r => r.chantier_id === selectedChantierId || selectedChantierId === 'ALL'),
  [rapportsChantier, selectedChantierId]);

  const chantierControles = useMemo(() => 
    controlesCTC.filter(c => c.chantier_id === selectedChantierId || selectedChantierId === 'ALL'),
  [controlesCTC, selectedChantierId]);

  const chantierMetresEnAttente = useMemo(() => 
    metres.filter(m => {
      const poste = postesTravaux.find(p => p.id === m.poste_id);
      const lot = lotsTravaux.find(l => l.id === poste?.lot_id);
      const matchesChantier = lot?.chantier_id === selectedChantierId || selectedChantierId === 'ALL';
      return matchesChantier && m.statut === 'TRANSMIS';
    }),
  [metres, postesTravaux, lotsTravaux, selectedChantierId]);

  const chantierVehicules = useMemo(() => 
    vehicules.filter(v => v.chantier_id === selectedChantierId || selectedChantierId === 'ALL'),
  [vehicules, selectedChantierId]);

  const chantierArticles = useMemo(() => 
    articlesStock.filter(a => a.chantier_id === selectedChantierId || selectedChantierId === 'ALL'),
  [articlesStock, selectedChantierId]);

  const stockAlertesCount = useMemo(() => 
    chantierArticles.filter(a => a.quantite_stock <= a.seuil_alerte_minimum).length,
  [chantierArticles]);

  const chantierDAs = useMemo(() => 
    demandesAchat.filter(d => d.chantier_id === selectedChantierId || selectedChantierId === 'ALL'),
  [demandesAchat, selectedChantierId]);

  const chantierMouvements = useMemo(() => 
    mouvementsStock.filter(m => m.chantier_id === selectedChantierId || selectedChantierId === 'ALL'),
  [mouvementsStock, selectedChantierId]);

  const chantierBonsSortie = useMemo(() => {
    return (bonsSortie || []).filter(bs => {
      if (selectedChantierId !== 'ALL' && bs.chantier_id !== selectedChantierId) return false;
      if (currentUser?.type === 'CHANTIER' && !currentUser.chantiers_assignes.includes(bs.chantier_id)) {
        return false;
      }
      return true;
    });
  }, [bonsSortie, selectedChantierId, currentUser]);

  const pendingBsCount = useMemo(
    () => chantierBonsSortie.filter(bs => bs.statut_validation_ct === 'EN_ATTENTE').length,
    [chantierBonsSortie]
  );

  // KPIs
  const stats = useMemo(() => {
    const totalRapports = chantierRapports.length;
    const pendingMetresCount = chantierMetresEnAttente.length;
    const totalCTC = chantierControles.length;
    const avisFavorables = chantierControles.filter(c => c.avis === 'FAVORABLE').length;
    const totalVehicules = chantierVehicules.length;
    const avgProgress = selectedChantierId === 'ALL'
      ? (allChantiers.length > 0
          ? Math.round(allChantiers.reduce((sum, c) => sum + (c.taux_avancement_physique ?? 0), 0) / allChantiers.length)
          : 0)
      : (currentChantier?.taux_avancement_physique ?? 0);

    return {
      totalRapports,
      pendingMetresCount,
      totalCTC,
      avisFavorables,
      totalVehicules,
      avgProgress
    };
  }, [chantierRapports, chantierMetresEnAttente, chantierControles, chantierVehicules, currentChantier, selectedChantierId, allChantiers]);

  // Handlers
  const handleCreateRapportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rapportForm.activites_realisees) {
      alert('Veuillez renseigner les activités exécutées.');
      return;
    }

    const targetChantierId = selectedChantierId === 'ALL' ? (allChantiers[0]?.id || 'cht-001') : selectedChantierId;

    soumettreRapportChantier({
      chantier_id: targetChantierId,
      date_rapport: rapportForm.date_rapport,
      type: rapportForm.type,
      effectif_total: Number(rapportForm.effectif_total),
      meteo: rapportForm.meteo,
      heures_intemperies: Number(rapportForm.heures_intemperies),
      materiel_sur_site: rapportForm.materiel_sur_site,
      incidents_securite: rapportForm.incidents_securite,
      activites_realisees: rapportForm.activites_realisees,
      anomalies_retards: rapportForm.anomalies_retards,
      photos_urls: [],
      redacteur_id: currentUser?.id || 'user-ct',
      redacteur_nom: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Conducteur de Travaux'
    });

    setIsNewRapportModalOpen(false);
    setRapportForm({
      date_rapport: new Date().toISOString().split('T')[0],
      type: 'JOURNALIER',
      meteo: 'Ensoleillé',
      heures_intemperies: 0,
      effectif_total: 0,
      materiel_sur_site: '',
      activites_realisees: '',
      anomalies_retards: '',
      incidents_securite: ''
    });
  };

  const handleCreateCTCSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ctcForm.numero_pv || !ctcForm.ouvrage_concerne) {
      alert('Veuillez renseigner le N° de PV et l’ouvrage inspecté.');
      return;
    }

    const targetChantierId = selectedChantierId === 'ALL' ? (allChantiers[0]?.id || 'cht-001') : selectedChantierId;

    ajouterControleCTC({
      chantier_id: targetChantierId,
      numero_pv: ctcForm.numero_pv,
      date_visite: ctcForm.date_visite,
      ouvrage_concerne: ctcForm.ouvrage_concerne,
      ingenieur_ctc: ctcForm.ingenieur_ctc || 'Ingénieur CTC',
      organisme_ctc: ctcForm.organisme_ctc,
      type_controle: ctcForm.type_controle,
      avis: ctcForm.avis,
      autorise_coulage: ctcForm.autorise_coulage,
      resistance_eprouvettes_28j: ctcForm.resistance_eprouvettes_28j ? Number(ctcForm.resistance_eprouvettes_28j) : undefined,
      reserves: ctcForm.reserves,
      statut_levee: ctcForm.avis === 'FAVORABLE' ? 'SANS_OBJET' : 'EN_ATTENTE'
    });

    setIsNewCTCModalOpen(false);
    setCtcForm({
      numero_pv: '',
      date_visite: new Date().toISOString().split('T')[0],
      ouvrage_concerne: '',
      ingenieur_ctc: '',
      organisme_ctc: 'CTC',
      type_controle: 'FERRAILLAGE',
      avis: 'FAVORABLE',
      autorise_coulage: true,
      resistance_eprouvettes_28j: undefined,
      reserves: ''
    });
  };

  const handleCreateDASubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetChantierId = currentChantier?.id || (selectedChantierId !== 'ALL' ? selectedChantierId : (currentUser?.chantiers_assignes?.[0] || allChantiers[0]?.id));
    if (!targetChantierId) {
      alert('Veuillez sélectionner un chantier spécifique pour émettre une demande d’achat.');
      return;
    }
    const res = creerDemandeAchat({
      chantier_id: targetChantierId,
      designation_produit: daForm.designation_produit,
      famille_article: daForm.famille_article,
      quantite_demandee: Number(daForm.quantite_demandee),
      unite_mesure: daForm.unite_mesure,
      niveau_urgence: daForm.niveau_urgence,
      justification: daForm.justification,
      date_besoin_chantier: daForm.date_besoin_chantier,
      estimation_budget_dzd: Number(daForm.estimation_budget_dzd) || undefined
    });

    if (res.success) {
      setIsNewDAModalOpen(false);
      setDaForm({
        designation_produit: '',
        famille_article: 'MATERIAUX_GROS_OEUVRE',
        quantite_demandee: 1,
        unite_mesure: 'Tonne',
        niveau_urgence: 'NORMAL',
        justification: '',
        date_besoin_chantier: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimation_budget_dzd: 0
      });
      setDaFeedback('Demande d’achat émise avec succès ! Elle a été transmise à la comptabilité pour visa budgétaire.');
      setTimeout(() => setDaFeedback(null), 6000);
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-slate-950 text-white rounded-3xl p-5 md:p-6 shadow-2xl border border-amber-500/30 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top row: title + KPIs + CTA */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Title block */}
          <div className="flex items-start gap-3 min-w-0">
            <div className="mt-0.5 w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
              <HardHat className="w-5 h-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="text-amber-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">
                Conduite de Chantier &amp; Responsable Travaux
              </div>
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight leading-tight">
                Suivi des Travaux &amp; Journal de Chantier
              </h1>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed max-w-xl hidden md:block">
                Journal d'intempéries · Effectifs · Visas CTC · Engins · Métrés contradictoires
              </p>
            </div>
          </div>

          {/* KPIs + CTA */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* KPI: avancement */}
            <div className="bg-black/30 backdrop-blur-md rounded-xl px-3 py-2 border border-white/10 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                <TrendingUp className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="text-[9px] text-amber-300 font-bold uppercase tracking-wider leading-none mb-0.5">Avancement</div>
                <div className="text-lg font-black text-white leading-none">{stats.avgProgress}%</div>
              </div>
            </div>

            {/* KPI: CTC */}
            <div className="bg-black/30 backdrop-blur-md rounded-xl px-3 py-2 border border-white/10 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="text-[9px] text-emerald-300 font-bold uppercase tracking-wider leading-none mb-0.5">Visas CTC</div>
                <div className="text-lg font-black text-white leading-none">{stats.avisFavorables}<span className="text-xs text-slate-400 font-semibold"> / {stats.totalCTC} PV</span></div>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => setIsNewDAModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/30 flex items-center gap-2 transition cursor-pointer whitespace-nowrap"
            >
              <ShoppingCart className="w-4 h-4 stroke-[2.5]" />
              <span>Demande d'Achat</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation — scrollable on small screens */}
        <div className="relative z-10 mt-4">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none bg-black/30 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('cockpit')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                activeTab === 'cockpit' ? 'bg-amber-600 text-white shadow-md shadow-amber-600/40' : 'text-slate-300 hover:bg-white/8 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 shrink-0" /> Cockpit
            </button>
            <button
              onClick={() => setActiveTab('journal')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                activeTab === 'journal' ? 'bg-amber-600 text-white shadow-md shadow-amber-600/40' : 'text-slate-300 hover:bg-white/8 hover:text-white'
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5 shrink-0" /> Journal de Chantier
            </button>
            <button
              onClick={() => setActiveTab('ctc')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                activeTab === 'ctc' ? 'bg-amber-600 text-white shadow-md shadow-amber-600/40' : 'text-slate-300 hover:bg-white/8 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> Contrôle CTC &amp; Coulage
            </button>
            <button
              onClick={() => setActiveTab('validation_metres')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                activeTab === 'validation_metres' ? 'bg-amber-600 text-white shadow-md shadow-amber-600/40' : 'text-slate-300 hover:bg-white/8 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Visas Métrés
              {stats.pendingMetresCount > 0 && (
                <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse ml-0.5">
                  {stats.pendingMetresCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('magasin_site')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                activeTab === 'magasin_site' ? 'bg-amber-600 text-white shadow-md shadow-amber-600/40' : 'text-slate-300 hover:bg-white/8 hover:text-white'
              }`}
            >
              <Store className="w-3.5 h-3.5 shrink-0" /> État Magasin &amp; Stocks
              {(stockAlertesCount > 0 || pendingBsCount > 0) && (
                <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full ml-0.5">
                  {pendingBsCount > 0 ? `${pendingBsCount} BS` : stockAlertesCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('demandes_achat')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                activeTab === 'demandes_achat' ? 'bg-amber-600 text-white shadow-md shadow-amber-600/40' : 'text-slate-300 hover:bg-white/8 hover:text-white'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5 shrink-0" /> Demandes d'Achat
              {chantierDAs.length > 0 && (
                <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-full ml-0.5">
                  {chantierDAs.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('materiel_site')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                activeTab === 'materiel_site' ? 'bg-amber-600 text-white shadow-md shadow-amber-600/40' : 'text-slate-300 hover:bg-white/8 hover:text-white'
              }`}
            >
              <Truck className="w-3.5 h-3.5 shrink-0" /> Matériel &amp; Engins
            </button>
          </div>
        </div>
      </div>

      {/* Main Tabs Content */}
      <div className="min-h-[500px]">
        {/* 1. COCKPIT */}
        {activeTab === 'cockpit' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Rapports Journaliers" value={stats.totalRapports} icon={ClipboardCheck} color="amber" subtitle="Journaux rédigés" />
              <StatCard title="Métrés à Viser" value={stats.pendingMetresCount} icon={CheckCircle2} color="rose" subtitle="Soumis par le métreur" />
              <StatCard title="PV CTC Valides" value={stats.avisFavorables} icon={ShieldCheck} color="emerald" subtitle="Autorisations de coulage" />
              <StatCard title="Engins sur Site" value={stats.totalVehicules} icon={Truck} color="blue" subtitle="Grues, pelles, camions" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Derniers Rapports Journaliers */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Derniers Événements du Journal de Chantier</h3>
                    <p className="text-[11px] text-slate-500">Synthèse des effectifs et activités menées sur site</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('journal')}
                    className="text-xs text-amber-600 font-bold hover:underline flex items-center gap-1"
                  >
                    Voir journal complet <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {chantierRapports.slice(0, 3).map(rap => (
                    <div key={rap.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-all">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-amber-600" />
                          <span className="font-bold text-slate-900 text-xs">{rap.date_rapport}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                            {rap.effectif_total} ouvriers
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">{rap.meteo}</span>
                      </div>
                      <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">
                        {rap.activites_realisees}
                      </p>
                      <div className="mt-2 text-[10px] text-slate-400">
                        Rédigé par <strong className="text-slate-600">{rap.redacteur_nom}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions Rapides Conducteur */}
              <div className="space-y-4">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <HardHat className="w-4 h-4 text-amber-600" /> Actions Terrain Rapides
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setIsNewRapportModalOpen(true)}
                      className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <Plus className="w-4 h-4" /> Rédiger Journal du Jour
                    </button>
                    <button
                      onClick={() => setIsNewCTCModalOpen(true)}
                      className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-400" /> Consigner Visite CTC
                    </button>
                    <button
                      onClick={() => setIsNewDAModalOpen(true)}
                      className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <ShoppingCart className="w-4 h-4 text-slate-950" /> Émettre une Demande d'Achat (DA)
                    </button>
                    <button
                      onClick={() => setActiveTab('validation_metres')}
                      className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border border-slate-200"
                    >
                      <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Viser les Métrés ({stats.pendingMetresCount})
                    </button>
                    <button
                      onClick={() => setActiveNav('pointage')}
                      className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border border-amber-200"
                    >
                      <Clock className="w-4 h-4 text-amber-700" /> Pointage Ouvriers du Chantier
                    </button>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-900 to-slate-900 text-white rounded-3xl p-5 shadow-lg space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Sécurité & Directives HSE</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    Vérification obligatoire des harnais de sécurité pour les travaux de façade et échafaudages au-delà du R+2. Port des casques et chaussures de sécurité obligatoire pour toute personne accédant au chantier.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. JOURNAL DE CHANTIER */}
        {activeTab === 'journal' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition-all"
                >
                  <Printer className="w-3.5 h-3.5" /> Imprimer Journal
                </button>
              </div>

              <button
                onClick={() => setIsNewRapportModalOpen(true)}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" /> Nouveau Rapport Journalier
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {chantierRapports.map(rap => (
                <div 
                  key={rap.id} 
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:border-amber-400 hover:shadow-lg transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-slate-900">{rap.date_rapport}</div>
                          <div className="text-[9px] uppercase font-bold text-slate-400">{rap.type}</div>
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        rap.statut === 'VALIDE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {rap.statut}
                      </span>
                    </div>

                    <div className="p-5 space-y-3 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Météo :</span>
                        <strong className="text-slate-800">{rap.meteo}</strong>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Effectif présent :</span>
                        <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">{rap.effectif_total} ouvriers</span>
                      </div>
                      {rap.materiel_sur_site && (
                        <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <strong className="text-slate-800">Engins : </strong>{rap.materiel_sur_site}
                        </div>
                      )}
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Activités réalisées</div>
                        <p className="text-slate-700 line-clamp-3 leading-relaxed">{rap.activites_realisees}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-500">Rédigé par <strong className="text-slate-700">{rap.redacteur_nom}</strong></span>
                    <button
                      onClick={() => setSelectedRapportForDetail(rap)}
                      className="text-amber-700 font-bold hover:underline flex items-center gap-1"
                    >
                      Détails <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. CONTRÔLE CTC & COULAGE */}
        {activeTab === 'ctc' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Contrôle Technique de la Construction (CTC) & Autorisations de Coulage</h3>
                <p className="text-xs text-slate-500">Suivi des procès-verbaux de ferraillage, coulage et écrasement des éprouvettes à 28 jours.</p>
              </div>
              <button
                onClick={() => setIsNewCTCModalOpen(true)}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" /> Nouveau PV de Visite CTC
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {chantierControles.map(ctc => (
                <div key={ctc.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-3 hover:border-amber-300 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100 text-amber-700">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-mono text-xs font-bold text-slate-900">{ctc.numero_pv}</div>
                        <div className="text-[10px] text-slate-400">{ctc.date_visite}</div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                      ctc.avis === 'FAVORABLE' ? 'bg-emerald-100 text-emerald-800' :
                      ctc.avis === 'FAVORABLE_RESERVES' ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {ctc.avis}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-800">{ctc.ouvrage_concerne}</div>
                    <div className="text-[11px] text-slate-500">Organisme : <span className="font-semibold text-slate-700">{ctc.organisme_ctc}</span> • {ctc.ingenieur_ctc}</div>
                  </div>

                  {ctc.reserves && (
                    <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/50 text-[11px] text-amber-900">
                      <strong>Observations / Réserves :</strong> {ctc.reserves}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Coulage :</span>
                      <span className={`font-bold ${ctc.autorise_coulage ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {ctc.autorise_coulage ? '✅ Coulage Autorisé' : '⛔ En Attente'}
                      </span>
                    </div>

                    {ctc.resistance_eprouvettes_28j && (
                      <div className="text-[11px] font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                        Éprouvettes : {ctc.resistance_eprouvettes_28j} MPa
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. VALIDATION DES MÉTRÉS */}
        {activeTab === 'validation_metres' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Attachements & Métrés Transmis par le Métreur Vérificateur</h3>
                <p className="text-xs text-slate-500">Le Conducteur de Travaux valide ou rejette les quantités relevées contradictoirement sur le site.</p>
              </div>
              <span className="text-xs font-bold bg-amber-50 text-amber-800 px-3 py-1 rounded-xl">
                {chantierMetresEnAttente.length} métrés en attente de visa
              </span>
            </div>

            {chantierMetresEnAttente.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                <h4 className="font-bold text-slate-800 text-sm">Tous les métrés sont à jour !</h4>
                <p className="text-xs text-slate-400 mt-1">Aucun métré contradictoire en attente de validation pour ce chantier.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {chantierMetresEnAttente.map(m => {
                  const poste = postesTravaux.find(p => p.id === m.poste_id);
                  const lot = lotsTravaux.find(l => l.id === poste?.lot_id);
                  const structure = structuresChantier.find(s => s.id === m.structure_id);

                  return (
                    <div key={m.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 hover:border-amber-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {poste?.code_article}
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm">{poste?.designation}</h4>
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold text-[10px]">
                            {structure?.libelle}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                            {lot?.code_lot}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 mt-1">
                          Saisi par <strong className="text-slate-800">{m.saisi_par_nom}</strong> le {m.date_mesure}
                          {m.localisation_detaillee && <> • Repère : <span className="font-medium text-amber-800">{m.localisation_detaillee}</span></>}
                        </p>

                        {m.details_calcul && (
                          <div className="mt-2 text-[11px] font-mono bg-slate-50 text-slate-700 px-3 py-1 rounded-lg border border-slate-200 inline-block">
                            Calcul : {m.details_calcul}
                          </div>
                        )}

                        <div className="mt-3 flex items-center gap-4 text-xs">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Quantité :</span>
                          <strong className="text-sm font-mono font-black text-amber-800">
                            {m.quantite_executee.toLocaleString()} {poste?.unite_symbole}
                          </strong>
                          <span className="text-slate-300">|</span>
                          <span className="text-[10px] font-bold uppercase text-slate-400">Montant :</span>
                          <strong className="text-slate-900 font-mono">
                            {((poste?.prix_unitaire_ref || 0) * m.quantite_executee).toLocaleString()} DZD
                          </strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center">
                        <button
                          onClick={() => validerMetre(m.id, 'REJETE')}
                          className="px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-bold transition-all"
                        >
                          Rejeter
                        </button>
                        <button
                          onClick={() => validerMetre(m.id, 'VALIDE')}
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4" /> Viser & Approuver
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 5. ÉTAT DU MAGASIN & STOCKS DU CHANTIER */}
        {activeTab === 'magasin_site' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Header section */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-slate-900 text-base">État du Magasin & Stocks du Chantier</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Visibilité en temps réel sur les matériaux, outillages et consommables disponibles sur votre chantier.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsNewDAModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 transition cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Émettre une DA (Réappro)</span>
                </button>
              </div>
            </div>

            {/* KPIs Stock */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Références Répertoriées</div>
                  <div className="text-lg font-black text-slate-900">{chantierArticles.length} Articles</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stockAlertesCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alertes Seuil Minimum</div>
                  <div className={`text-lg font-black ${stockAlertesCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {stockAlertesCount} Article{stockAlertesCount > 1 ? 's critiques' : ''}
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mouvements Enregistrés</div>
                  <div className="text-lg font-black text-slate-900">{chantierMouvements.length} Bons & Sorties</div>
                </div>
              </div>
            </div>

            {/* Recherche & Filtre */}
            <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher un article, code..."
                  value={stockSearchTerm}
                  onChange={(e) => setStockSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <select
                value={stockFamilyFilter}
                onChange={(e) => setStockFamilyFilter(e.target.value)}
                className="text-xs p-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 w-full sm:w-auto"
              >
                <option value="ALL">Toutes les familles</option>
                <option value="MATERIAUX_GROS_OEUVRE">Matériaux Gros-Œuvre</option>
                <option value="ARMATURES_ACIER">Armatures & Acier</option>
                <option value="SECOND_OEUVRE">Second-Œuvre</option>
                <option value="PLOMBERIE_SANITAIRE">Plomberie & Sanitaire</option>
                <option value="ELECTRICITE">Électricité</option>
                <option value="QUINCAILLERIE_OUTILLAGE">Quincaillerie & Outillage</option>
                <option value="SECURITE_EPI">Sécurité & EPI</option>
              </select>
            </div>

            {/* Tableau Articles */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Code / Désignation</th>
                      <th className="py-3 px-4">Famille</th>
                      <th className="py-3 px-4">Emplacement</th>
                      <th className="py-3 px-4 text-right">Quantité Stock</th>
                      <th className="py-3 px-4 text-right">Seuil Min.</th>
                      <th className="py-3 px-4 text-center">État Stock</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {chantierArticles
                      .filter(a => {
                        const matchesSearch = !stockSearchTerm || 
                          a.designation.toLowerCase().includes(stockSearchTerm.toLowerCase()) ||
                          a.code_article.toLowerCase().includes(stockSearchTerm.toLowerCase());
                        const matchesFamily = stockFamilyFilter === 'ALL' || a.famille === stockFamilyFilter;
                        return matchesSearch && matchesFamily;
                      })
                      .map(art => {
                        const isUnderThreshold = art.quantite_stock <= art.seuil_alerte_minimum;
                        const isOutOfStock = art.quantite_stock <= 0;

                        return (
                          <tr key={art.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{art.designation}</div>
                              <div className="font-mono text-[10px] text-slate-400">{art.code_article}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-[10px] font-medium">
                                {art.famille}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 font-medium">
                              {art.emplacement_magasin || 'Dépôt principal'}
                            </td>
                            <td className="py-3 px-4 text-right font-black text-slate-900 text-sm">
                              {art.quantite_stock.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">{art.unite_mesure}</span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-slate-500">
                              {art.seuil_alerte_minimum} {art.unite_mesure}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {isOutOfStock ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                  RUPTURE
                                </span>
                              ) : isUnderThreshold ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  STOCK BAS
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  DISPONIBLE
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => {
                                  setDaForm({
                                    designation_produit: art.designation,
                                    famille_article: art.famille || 'MATERIAUX_GROS_OEUVRE',
                                    quantite_demandee: Math.max(1, (art.seuil_alerte_minimum * 2) - art.quantite_stock),
                                    unite_mesure: art.unite_mesure,
                                    niveau_urgence: isOutOfStock ? 'CRITIQUE_ARRET_CHANTIER' : isUnderThreshold ? 'URGENT' : 'NORMAL',
                                    justification: `Réapprovisionnement de stock magasin pour le chantier (seuil minimum: ${art.seuil_alerte_minimum} ${art.unite_mesure}).`,
                                    date_besoin_chantier: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                                    estimation_budget_dzd: 0
                                  });
                                  setIsNewDAModalOpen(true);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] border border-amber-200 transition flex items-center gap-1.5 ml-auto cursor-pointer"
                              >
                                <ShoppingCart className="w-3.5 h-3.5" />
                                <span>Commander (DA)</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bons de Sortie (BS) émis par le Magasinier — Signature du Conducteur de Travaux */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-600" />
                    <h4 className="font-bold text-slate-900 text-sm">
                      Bons de Sortie Magasin à Signer (Validation Conducteur de Travaux)
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Les bons de sortie établis par le magasinier doivent être signés par vos soins avant décrémentation du stock.
                  </p>
                </div>
                {pendingBsCount > 0 && (
                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold w-max">
                    {pendingBsCount} bon{pendingBsCount > 1 ? 's' : ''} en attente de votre signature
                  </span>
                )}
              </div>

              {bsFeedback && (
                <div
                  className={`mx-5 mt-4 p-3 rounded-xl border text-xs flex items-center justify-between ${
                    bsFeedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  <span className="font-semibold">{bsFeedback.message}</span>
                  <button onClick={() => setBsFeedback(null)} className="font-bold opacity-60 hover:opacity-100">✕</button>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">N° BS</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Article & Quantité</th>
                      <th className="py-3 px-4">Destination / Bénéficiaire</th>
                      <th className="py-3 px-4">Votre Signature (CT)</th>
                      <th className="py-3 px-4">Confirmation Magasinier</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {chantierBonsSortie.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          Aucun bon de sortie émis par le magasinier pour ce chantier.
                        </td>
                      </tr>
                    ) : (
                      chantierBonsSortie.map(bs => (
                        <tr key={bs.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">{bs.numero_bs}</td>
                          <td className="py-3 px-4 text-slate-500">{bs.date_emission}</td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{bs.designation_article}</div>
                            <div className="text-amber-700 font-bold">{bs.quantite} {bs.unite_mesure}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800">{bs.destination}</div>
                            <div className="text-[10px] text-slate-500">Bénéficiaire : {bs.beneficiaire}</div>
                          </td>
                          <td className="py-3 px-4">
                            {bs.statut_validation_ct === 'VALIDE' ? (
                              <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                                <Check className="w-3 h-3" /> Signé ({bs.conducteur_validateur_nom})
                              </span>
                            ) : bs.statut_validation_ct === 'REFUSE' ? (
                              <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800 inline-flex items-center gap-1">
                                <X className="w-3 h-3" /> Refusé
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" /> À signer
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {bs.statut_confirmation_magasinier === 'CONFIRME' ? (
                              <span className="px-2 py-0.5 rounded text-xs font-bold bg-teal-100 text-teal-800 inline-flex items-center gap-1">
                                <Lock className="w-3 h-3" /> Sortie confirmée
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600 inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" /> En attente magasinier
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {bs.statut_validation_ct === 'EN_ATTENTE' && (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    const res = validerBonSortieConducteur(bs.id, 'VALIDE');
                                    setBsFeedback({ type: res.success ? 'success' : 'error', message: res.message });
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" /> Signer & Valider
                                </button>
                                <button
                                  onClick={() => {
                                    setBsToRefuse(bs);
                                    setBsRefusMotif('');
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
                                >
                                  Refuser
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 6. DEMANDES D'ACHAT DU CHANTIER */}
        {activeTab === 'demandes_achat' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-slate-900 text-base">Demandes d'Achat (DA) du Chantier</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Suivi de vos demandes d'approvisionnement transmises à la comptabilité et au siège.
                </p>
              </div>

              <button
                onClick={() => setIsNewDAModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 transition cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Nouvelle Demande d'Achat</span>
              </button>
            </div>

            {/* Tableau des DA */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">N° DA / Date</th>
                      <th className="py-3 px-4">Matériau Demandé</th>
                      <th className="py-3 px-4">Quantité</th>
                      <th className="py-3 px-4">Urgence</th>
                      <th className="py-3 px-4">Date Besoin</th>
                      <th className="py-3 px-4">Statut Approbation</th>
                      <th className="py-3 px-4">Justification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {chantierDAs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          Aucune demande d'achat enregistrée pour ce chantier. Cliquez sur "Nouvelle Demande d'Achat" pour en émettre une.
                        </td>
                      </tr>
                    ) : (
                      chantierDAs.map(da => (
                        <tr key={da.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-mono font-bold text-slate-900">{da.numero_da}</div>
                            <div className="text-[10px] text-slate-400">{da.date_demande}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{da.designation_produit}</div>
                            <div className="text-[10px] text-slate-400">{da.famille_article}</div>
                          </td>
                          <td className="py-3 px-4 font-black text-slate-900">
                            {da.quantite_demandee} <span className="text-[10px] font-normal text-slate-500">{da.unite_mesure}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              da.niveau_urgence === 'CRITIQUE_ARRET_CHANTIER' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                              da.niveau_urgence === 'URGENT' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {da.niveau_urgence}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-700">
                            {da.date_besoin_chantier}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              da.statut === 'VALIDEE' ? 'bg-emerald-100 text-emerald-800' :
                              da.statut === 'EN_ATTENTE_COMPTABILITE' ? 'bg-amber-100 text-amber-800' :
                              da.statut === 'EN_COURS_APPROVISIONNEMENT' ? 'bg-blue-100 text-blue-800' :
                              da.statut === 'LIVREE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              da.statut === 'REFUSEE' ? 'bg-rose-100 text-rose-800' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {da.statut === 'EN_ATTENTE_COMPTABILITE' && '⏳ Visa Compta en attente'}
                              {da.statut === 'VALIDEE' && '✓ Validée par Compta'}
                              {da.statut === 'EN_COURS_APPROVISIONNEMENT' && '📦 Fournisseur en cours'}
                              {da.statut === 'LIVREE' && '✔ Reçue au Magasin'}
                              {da.statut === 'REFUSEE' && '✕ Refusée'}
                              {!['EN_ATTENTE_COMPTABILITE', 'VALIDEE', 'EN_COURS_APPROVISIONNEMENT', 'LIVREE', 'REFUSEE'].includes(da.statut) && da.statut}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={da.justification}>
                            {da.justification}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 7. MATÉRIEL DU CHANTIER */}
        {activeTab === 'materiel_site' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Engins & Matériel Affectés au Chantier</h3>
                <p className="text-xs text-slate-500">Parc matériel mobilisé sous la responsabilité du conducteur de travaux.</p>
              </div>
              <span className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-xl">
                {chantierVehicules.length} engins opérationnels
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chantierVehicules.map(veh => (
                <div key={veh.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-3 hover:border-amber-300 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-700">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-mono text-xs font-black text-slate-900">{veh.num_interne}</div>
                        <div className="text-[10px] text-slate-400">{veh.immatriculation}</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                      {veh.statut}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-slate-800">
                    {veh.marque} {veh.modele} ({veh.categorie})
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-100 text-slate-600">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Compteur :</span>
                      <span className="font-mono font-bold text-slate-800">
                        {veh.heures_fonctionnement ? `${veh.heures_fonctionnement} Heures` : `${veh.kilometrage?.toLocaleString()} km`}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Conducteur :</span>
                      <span className="font-semibold text-slate-800">{veh.conducteur_nom || 'Non assigné'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Nouveau Rapport Journalier */}
      {isNewRapportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Rédiger le Journal de Chantier du Jour</h3>
                  <p className="text-xs text-slate-500">Document contractuel d'exécution sous la responsabilité du conducteur</p>
                </div>
              </div>
              <button onClick={() => setIsNewRapportModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRapportSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={rapportForm.date_rapport}
                    onChange={(e) => setRapportForm({ ...rapportForm, date_rapport: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Météo & Température</label>
                  <input
                    type="text"
                    value={rapportForm.meteo}
                    onChange={(e) => setRapportForm({ ...rapportForm, meteo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Effectif Global</label>
                  <input
                    type="number"
                    value={rapportForm.effectif_total}
                    onChange={(e) => setRapportForm({ ...rapportForm, effectif_total: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Engins & Matériel Actifs sur Site</label>
                <input
                  type="text"
                  value={rapportForm.materiel_sur_site}
                  onChange={(e) => setRapportForm({ ...rapportForm, materiel_sur_site: e.target.value })}
                  placeholder="Ex: Grue à tour, 2 Camions toupie, Pompe à béton..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Activités Exécutées par Corps d'État *</label>
                <textarea
                  required
                  rows={3}
                  value={rapportForm.activites_realisees}
                  onChange={(e) => setRapportForm({ ...rapportForm, activites_realisees: e.target.value })}
                  placeholder="Détail des coulages, ferraillage, coffrage, pose blocs..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hygiène, Sécurité & Consignes HSE</label>
                  <input
                    type="text"
                    value={rapportForm.incidents_securite}
                    onChange={(e) => setRapportForm({ ...rapportForm, incidents_securite: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Arrêts de Chantier / Intempéries</label>
                  <input
                    type="text"
                    value={rapportForm.anomalies_retards}
                    onChange={(e) => setRapportForm({ ...rapportForm, anomalies_retards: e.target.value })}
                    placeholder="Ex: RAS ou arrêt 1h pour pluie..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewRapportModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700"
                >
                  Signer & Enregistrer le Journal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Nouveau Contrôle CTC */}
      {isNewCTCModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-base">Consigner un Contrôle CTC & Coulage</h3>
              </div>
              <button onClick={() => setIsNewCTCModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCTCSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">N° du PV Officiel *</label>
                  <input
                    type="text"
                    required
                    value={ctcForm.numero_pv}
                    onChange={(e) => setCtcForm({ ...ctcForm, numero_pv: e.target.value })}
                    placeholder="Ex: PV-CTC-2026-104"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={ctcForm.date_visite}
                    onChange={(e) => setCtcForm({ ...ctcForm, date_visite: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ouvrage Inspecté *</label>
                <input
                  type="text"
                  required
                  value={ctcForm.ouvrage_concerne}
                  onChange={(e) => setCtcForm({ ...ctcForm, ouvrage_concerne: e.target.value })}
                  placeholder="Ex: Poteaux et Voiles R+1 Bloc A"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Organisme</label>
                  <select
                    value={ctcForm.organisme_ctc}
                    onChange={(e) => setCtcForm({ ...ctcForm, organisme_ctc: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    <option value="CTC Centre">CTC Centre (Alger)</option>
                    <option value="CTC Ouest">CTC Ouest (Oran)</option>
                    <option value="CTC Est">CTC Est (Constantine)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Avis</label>
                  <select
                    value={ctcForm.avis}
                    onChange={(e) => setCtcForm({ ...ctcForm, avis: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                  >
                    <option value="FAVORABLE">Favorable (AVF)</option>
                    <option value="FAVORABLE_RESERVES">Favorable avec Réserves</option>
                    <option value="DEFAVORABLE">Défavorable</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="authCoulageCheck"
                  checked={ctcForm.autorise_coulage}
                  onChange={(e) => setCtcForm({ ...ctcForm, autorise_coulage: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-600"
                />
                <label htmlFor="authCoulageCheck" className="font-bold text-slate-800">
                  Autorisation de coulage de béton accordée
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewCTCModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700"
                >
                  Enregistrer le PV CTC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Nouvelle Demande d'Achat (DA) */}
      {isNewDAModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Émettre une Demande d'Achat (DA)</h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Chantier : <strong className="text-amber-800">{currentChantier?.nom_projet || 'Mon Chantier'}</strong>
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsNewDAModalOpen(false)} 
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDASubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Désignation du Matériau / Fourniture *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ciment CRS 42.5 en sacs, Acier Tor Ø14 FeE500, Sable lavé d'Oued..."
                  value={daForm.designation_produit}
                  onChange={(e) => setDaForm({ ...daForm, designation_produit: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Famille d'Article *</label>
                  <select
                    value={daForm.famille_article}
                    onChange={(e) => setDaForm({ ...daForm, famille_article: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="MATERIAUX_GROS_OEUVRE">Matériaux Gros-Œuvre (Ciment, Sable, Agrégats)</option>
                    <option value="ARMATURES_ACIER">Armatures & Aciers (Tor FeE500)</option>
                    <option value="SECOND_OEUVRE">Second-Œuvre (Briques, Plâtre, Peinture)</option>
                    <option value="PLOMBERIE_SANITAIRE">Plomberie & Sanitaire</option>
                    <option value="ELECTRICITE">Électricité & Câblage</option>
                    <option value="QUINCAILLERIE_OUTILLAGE">Quincaillerie & Outillage Chantier</option>
                    <option value="SECURITE_EPI">Sécurité & Équipements EPI</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Niveau d'Urgence *</label>
                  <select
                    value={daForm.niveau_urgence}
                    onChange={(e) => setDaForm({ ...daForm, niveau_urgence: e.target.value as NiveauUrgence })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                  >
                    <option value="NORMAL">Normal (Standard)</option>
                    <option value="URGENT">Urgent (48 heures)</option>
                    <option value="CRITIQUE_ARRET_CHANTIER">CRITIQUE : Arrêt de Chantier imminent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quantité Demandée *</label>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    required
                    value={daForm.quantite_demandee}
                    onChange={(e) => setDaForm({ ...daForm, quantite_demandee: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unité de Mesure *</label>
                  <select
                    value={daForm.unite_mesure}
                    onChange={(e) => setDaForm({ ...daForm, unite_mesure: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Tonne">Tonne</option>
                    <option value="Sac (50kg)">Sac (50kg)</option>
                    <option value="m³">Mètre Cube (m³)</option>
                    <option value="m²">Mètre Carré (m²)</option>
                    <option value="ML">Mètre Linéaire (ML)</option>
                    <option value="Unité">Unité / Pièce</option>
                    <option value="Litre">Litre</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date de Besoin au Chantier *</label>
                  <input
                    type="date"
                    required
                    value={daForm.date_besoin_chantier}
                    onChange={(e) => setDaForm({ ...daForm, date_besoin_chantier: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estimation Budget Indicatif (DZD)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ex: 450000"
                    value={daForm.estimation_budget_dzd || ''}
                    onChange={(e) => setDaForm({ ...daForm, estimation_budget_dzd: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Justification Technique / Ouvrage concerné *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Préciser l'ouvrage (ex: coulage dalle R+2 Bloc B, ferraillage voiles ascenseur selon plan BET n° 14)..."
                  value={daForm.justification}
                  onChange={(e) => setDaForm({ ...daForm, justification: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Circuit d’approbation BatiProm :</strong> Dès émission, votre demande sera transmise automatiquement à la <strong>Comptabilité</strong> pour contrôle budgétaire, puis au service <strong>Approvisionnements</strong> pour consultation des fournisseurs.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewDAModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <Send className="w-4 h-4" />
                  <span>Transmettre la Demande d'Achat</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Détail Rapport Journalier */}
      {selectedRapportForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base">Journal du {selectedRapportForDetail.date_rapport}</h3>
              <button onClick={() => setSelectedRapportForDetail(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between">
                <span>Météo : <strong>{selectedRapportForDetail.meteo}</strong></span>
                <span>Effectif : <strong className="text-amber-800">{selectedRapportForDetail.effectif_total} ouvriers</strong></span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Activités réalisées :</span>
                <p className="p-3 bg-amber-50/50 rounded-2xl border border-amber-100 text-slate-800 leading-relaxed">
                  {selectedRapportForDetail.activites_realisees}
                </p>
              </div>
              {selectedRapportForDetail.materiel_sur_site && (
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Matériel & Engins :</span>
                  <p className="text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-100">{selectedRapportForDetail.materiel_sur_site}</p>
                </div>
              )}
            </div>
            <div className="flex justify-between pt-3 border-t border-slate-100">
              <button onClick={() => window.print()} className="px-4 py-2 border border-slate-200 rounded-xl font-bold flex items-center gap-1.5 text-xs">
                <Printer className="w-3.5 h-3.5" /> Imprimer
              </button>
              <button onClick={() => setSelectedRapportForDetail(null)} className="px-5 py-2 bg-amber-600 text-white rounded-xl font-bold text-xs">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale Refus Bon de Sortie (Conducteur de Travaux) */}
      {bsToRefuse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Refuser le Bon de Sortie {bsToRefuse.numero_bs}
            </h3>
            <p className="text-xs text-slate-500">
              Indiquez le motif de refus pour le magasinier ({bsToRefuse.designation_article} — {bsToRefuse.quantite} {bsToRefuse.unite_mesure}).
            </p>
            <textarea
              rows={3}
              required
              placeholder="Motif du refus..."
              value={bsRefusMotif}
              onChange={e => setBsRefusMotif(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setBsToRefuse(null)}
                className="px-4 py-2 rounded-xl border text-xs text-slate-600"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = validerBonSortieConducteur(bsToRefuse.id, 'REFUSE', bsRefusMotif.trim() || 'Refusé par le Conducteur de Travaux');
                  setBsFeedback({ type: res.success ? 'success' : 'error', message: res.message });
                  setBsToRefuse(null);
                  setBsRefusMotif('');
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                Confirmer le Refus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ 
  title: string; 
  value: string | number; 
  icon: any; 
  color: 'amber' | 'rose' | 'emerald' | 'blue';
  subtitle?: string;
}> = ({ title, value, icon: Icon, color, subtitle }) => {
  const colors = {
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200'
  };

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${colors[color]} shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</div>
        <div className="text-xl font-black text-slate-900 leading-none mt-1">{value}</div>
        {subtitle && <div className="text-[10px] text-slate-400 mt-1">{subtitle}</div>}
      </div>
    </div>
  );
};
