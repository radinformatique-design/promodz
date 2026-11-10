'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Layers, 
  Ruler, 
  ClipboardCheck, 
  TrendingUp, 
  Plus, 
  Search, 
  Calendar,
  Building,
  CheckCircle2,
  AlertCircle,
  FileText,
  BarChart3,
  Filter,
  ShieldCheck,
  HardHat,
  FileSpreadsheet,
  Eye,
  Printer,
  X,
  Clock,
  ChevronRight,
  Award,
  AlertTriangle,
  Hammer,
  Wrench,
  Download,
  Check,
  RefreshCw
} from 'lucide-react';
import { 
  LotTravaux, 
  PosteTravaux, 
  StructureChantier, 
  MetreVérification, 
  RapportChantier,
  ControleCTC,
  PlanBET,
  SituationTravaux
} from '../types/database';

type TechTab = 'dashboard' | 'lots' | 'metres' | 'ctc_bet' | 'situations' | 'rapports';

export const TechniqueView: React.FC = () => {
  const { 
    selectedChantierId, 
    currentChantier,
    allChantiers,
    lotsTravaux, 
    structuresChantier, 
    postesTravaux, 
    metres, 
    rapportsChantier,
    controlesCTC,
    plansBET,
    situationsTravaux,
    currentUser,
    ajouterLotTravaux,
    ajouterPosteTravaux,
    ajouterMetre,
    validerMetre,
    soumettreRapportChantier,
    ajouterControleCTC,
    ajouterPlanBET,
    ajouterSituationTravaux,
    validerSituationTravaux
  } = useApp();

  const [activeTab, setActiveTab] = useState<TechTab>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatutMetre, setFilterStatutMetre] = useState<string>('ALL');
  const [filterLotId, setFilterLotId] = useState<string>('ALL');

  // Modals state
  const [isNewMetreModalOpen, setIsNewMetreModalOpen] = useState(false);
  const [isNewRapportModalOpen, setIsNewRapportModalOpen] = useState(false);
  const [isNewLotModalOpen, setIsNewLotModalOpen] = useState(false);
  const [isNewCTCModalOpen, setIsNewCTCModalOpen] = useState(false);
  const [selectedRapportForDetail, setSelectedRapportForDetail] = useState<RapportChantier | null>(null);
  const [selectedMetreForDetail, setSelectedMetreForDetail] = useState<MetreVérification | null>(null);

  // Form states for New Métré
  const [metreForm, setMetreForm] = useState({
    poste_id: '',
    structure_id: '',
    quantite_executee: 0,
    localisation_detaillee: '',
    details_calcul: '',
    commentaire: ''
  });

  // Form states for New Rapport
  const [rapportForm, setRapportForm] = useState({
    date_rapport: new Date().toISOString().split('T')[0],
    type: 'JOURNALIER' as 'JOURNALIER' | 'HEBDOMADAIRE' | 'MENSUEL',
    meteo: 'Ensoleillé, 22°C',
    heures_intemperies: 0,
    effectif_total: 25,
    materiel_sur_site: '',
    activites_realisees: '',
    anomalies_retards: '',
    incidents_securite: 'Aucun incident répertorié. Port des EPI respecté.'
  });

  // Form states for New Lot
  const [lotForm, setLotForm] = useState({
    code_lot: '',
    libelle: '',
    budget_prevu: 0,
    description: ''
  });

  // Form states for New CTC PV
  const [ctcForm, setCtcForm] = useState({
    numero_pv: '',
    date_visite: new Date().toISOString().split('T')[0],
    ouvrage_concerne: '',
    ingenieur_ctc: '',
    organisme_ctc: 'CTC Centre',
    type_controle: 'FERRAILLAGE' as ControleCTC['type_controle'],
    avis: 'FAVORABLE' as ControleCTC['avis'],
    autorise_coulage: true,
    resistance_eprouvettes_28j: 30.0,
    reserves: ''
  });

  // Filtrage par chantier
  const chantierLots = useMemo(() => 
    lotsTravaux.filter(l => l.chantier_id === selectedChantierId || selectedChantierId === 'ALL'),
  [lotsTravaux, selectedChantierId]);

  const chantierStructures = useMemo(() => 
    structuresChantier.filter(s => s.chantier_id === selectedChantierId || selectedChantierId === 'ALL'),
  [structuresChantier, selectedChantierId]);

  const chantierMetres = useMemo(() => 
    metres.filter(m => {
      const poste = postesTravaux.find(p => p.id === m.poste_id);
      const lot = lotsTravaux.find(l => l.id === poste?.lot_id);
      return lot?.chantier_id === selectedChantierId || selectedChantierId === 'ALL';
    }),
  [metres, postesTravaux, lotsTravaux, selectedChantierId]);

  const chantierRapports = useMemo(() => 
    rapportsChantier.filter(r => r.chantier_id === selectedChantierId || selectedChantierId === 'ALL'),
  [rapportsChantier, selectedChantierId]);

  const chantierControlesCTC = useMemo(() => 
    controlesCTC.filter(c => c.chantier_id === selectedChantierId || selectedChantierId === 'ALL'),
  [controlesCTC, selectedChantierId]);

  const chantierPlansBET = useMemo(() => 
    plansBET.filter(p => p.chantier_id === selectedChantierId || selectedChantierId === 'ALL'),
  [plansBET, selectedChantierId]);

  const chantierSituations = useMemo(() => 
    situationsTravaux.filter(s => s.chantier_id === selectedChantierId || selectedChantierId === 'ALL'),
  [situationsTravaux, selectedChantierId]);

  // Calcul dynamique de la quantité exécutée par poste
  const getPosteQuantiteExecutee = (posteId: string) => {
    return metres
      .filter(m => m.poste_id === posteId && (m.statut === 'VALIDE' || m.statut === 'TRANSMIS'))
      .reduce((sum, m) => sum + m.quantite_executee, 0);
  };

  // Calcul du montant exécuté par poste
  const getPosteMontantExecute = (poste: PosteTravaux) => {
    const qte = getPosteQuantiteExecutee(poste.id);
    return qte * poste.prix_unitaire_ref;
  };

  // Calcul de l'avancement financier d'un lot
  const getLotProgress = (lotId: string, budgetPrevu: number) => {
    const postesDuLot = postesTravaux.filter(p => p.lot_id === lotId);
    if (postesDuLot.length === 0) return 0;
    const totalExecute = postesDuLot.reduce((acc, p) => acc + getPosteMontantExecute(p), 0);
    if (!budgetPrevu || budgetPrevu === 0) return 0;
    const pct = Math.min(100, Math.round((totalExecute / budgetPrevu) * 100));
    return pct || 0;
  };

  // Statistiques pour le Dashboard
  const stats = useMemo(() => {
    const totalLots = chantierLots.length;
    const totalMetres = chantierMetres.length;
    const pendingMetres = chantierMetres.filter(m => m.statut === 'TRANSMIS' || m.statut === 'BROUILLON').length;
    const validesMetres = chantierMetres.filter(m => m.statut === 'VALIDE').length;
    const totalCTC = chantierControlesCTC.length;
    const avisFavorablesCTC = chantierControlesCTC.filter(c => c.avis === 'FAVORABLE').length;
    const totalSituationsHT = chantierSituations.reduce((sum, s) => sum + s.montant_cumule_ht_dzd, 0);
    const avgProgress = currentChantier?.taux_avancement_physique || 45.0;

    return { 
      totalLots, 
      totalMetres, 
      pendingMetres, 
      validesMetres, 
      totalCTC, 
      avisFavorablesCTC,
      totalSituationsHT,
      avgProgress 
    };
  }, [chantierLots, chantierMetres, currentChantier, chantierControlesCTC, chantierSituations]);

  // Filtrage des métrés pour l'onglet métrés
  const filteredMetres = useMemo(() => {
    return chantierMetres.filter(m => {
      if (filterStatutMetre !== 'ALL' && m.statut !== filterStatutMetre) return false;
      const poste = postesTravaux.find(p => p.id === m.poste_id);
      if (filterLotId !== 'ALL' && poste?.lot_id !== filterLotId) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchDesignation = poste?.designation.toLowerCase().includes(term);
        const matchComment = m.commentaire?.toLowerCase().includes(term);
        const matchAuthor = m.saisi_par_nom.toLowerCase().includes(term);
        const matchLoc = m.localisation_detaillee?.toLowerCase().includes(term);
        if (!matchDesignation && !matchComment && !matchAuthor && !matchLoc) return false;
      }
      return true;
    });
  }, [chantierMetres, filterStatutMetre, filterLotId, searchTerm, postesTravaux]);

  // Handlers
  const handleCreateMetreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!metreForm.poste_id || !metreForm.structure_id || metreForm.quantite_executee <= 0) {
      alert('Veuillez renseigner le poste, la structure et une quantité positive.');
      return;
    }

    ajouterMetre({
      poste_id: metreForm.poste_id,
      structure_id: metreForm.structure_id,
      quantite_executee: Number(metreForm.quantite_executee),
      date_mesure: new Date().toISOString().split('T')[0],
      saisi_par_id: currentUser?.id || 'user-metreur',
      saisi_par_nom: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Métreur Vérificateur',
      localisation_detaillee: metreForm.localisation_detaillee,
      details_calcul: metreForm.details_calcul,
      commentaire: metreForm.commentaire
    });

    setIsNewMetreModalOpen(false);
    setMetreForm({
      poste_id: '',
      structure_id: '',
      quantite_executee: 0,
      localisation_detaillee: '',
      details_calcul: '',
      commentaire: ''
    });
  };

  const handleCreateRapportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rapportForm.activites_realisees) {
      alert('Veuillez décrire les activités réalisées sur le chantier.');
      return;
    }

    const chantierIdToAssign = selectedChantierId === 'ALL' ? (allChantiers[0]?.id || 'cht-001') : selectedChantierId;

    soumettreRapportChantier({
      chantier_id: chantierIdToAssign,
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
      meteo: 'Ensoleillé, 22°C',
      heures_intemperies: 0,
      effectif_total: 25,
      materiel_sur_site: '',
      activites_realisees: '',
      anomalies_retards: '',
      incidents_securite: 'Aucun incident répertorié. Port des EPI respecté.'
    });
  };

  const handleCreateLotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lotForm.code_lot || !lotForm.libelle) {
      alert('Veuillez renseigner le code et le libellé du lot.');
      return;
    }

    const targetChantierId = selectedChantierId === 'ALL' ? (allChantiers[0]?.id || 'cht-001') : selectedChantierId;

    ajouterLotTravaux({
      chantier_id: targetChantierId,
      code_lot: lotForm.code_lot.toUpperCase(),
      libelle: lotForm.libelle,
      budget_prevu: Number(lotForm.budget_prevu) || 0,
      description: lotForm.description,
      ordre: chantierLots.length + 1
    });

    setIsNewLotModalOpen(false);
    setLotForm({ code_lot: '', libelle: '', budget_prevu: 0, description: '' });
  };

  const handleCreateCTCSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ctcForm.numero_pv || !ctcForm.ouvrage_concerne) {
      alert('Veuillez renseigner le numéro du PV et l’ouvrage concerné.');
      return;
    }

    const targetChantierId = selectedChantierId === 'ALL' ? (allChantiers[0]?.id || 'cht-001') : selectedChantierId;

    ajouterControleCTC({
      chantier_id: targetChantierId,
      numero_pv: ctcForm.numero_pv,
      date_visite: ctcForm.date_visite,
      ouvrage_concerne: ctcForm.ouvrage_concerne,
      ingenieur_ctc: ctcForm.ingenieur_ctc || 'Ingénieur Contrôleur CTC',
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
      organisme_ctc: 'CTC Centre',
      type_controle: 'FERRAILLAGE',
      avis: 'FAVORABLE',
      autorise_coulage: true,
      resistance_eprouvettes_28j: 30.0,
      reserves: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-2xl border border-indigo-500/30 relative overflow-hidden">
        {/* Background Decorative Rings */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 -top-10 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-1.5">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Direction Technique & Génie Civil — BatiProm Algérie</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Ingénierie, Métrés & Contrôle Chantier
            </h1>
            <p className="text-indigo-200/80 text-sm mt-1.5 max-w-2xl font-medium">
              Pilotage technique contradictoire : métrés certifiés, nomenclatures des lots, conformité CTC (DTR), plans BET visés BPE et situations mensuelles.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <div className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">Avancement Physique</div>
                <div className="text-xl font-black text-white">{stats.avgProgress}%</div>
              </div>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">Conformité CTC</div>
                <div className="text-xl font-black text-white">{stats.avisFavorablesCTC} / {stats.totalCTC} PV</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 mt-8 bg-slate-950/60 p-1.5 rounded-2xl w-full sm:w-fit border border-white/10 overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40' : 'text-indigo-200 hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Vue d'ensemble
          </button>
          <button
            onClick={() => setActiveTab('lots')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'lots' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40' : 'text-indigo-200 hover:bg-white/5'
            }`}
          >
            <Building className="w-4 h-4" /> Lots & Nomenclature
          </button>
          <button
            onClick={() => setActiveTab('metres')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'metres' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40' : 'text-indigo-200 hover:bg-white/5'
            }`}
          >
            <Ruler className="w-4 h-4" /> Métrés & Attachements
            {stats.pendingMetres > 0 && (
              <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {stats.pendingMetres}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('ctc_bet')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'ctc_bet' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40' : 'text-indigo-200 hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Suivi CTC & Plans BET
          </button>
          <button
            onClick={() => setActiveTab('situations')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'situations' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40' : 'text-indigo-200 hover:bg-white/5'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" /> Situations Travaux
          </button>
          <button
            onClick={() => setActiveTab('rapports')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'rapports' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40' : 'text-indigo-200 hover:bg-white/5'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" /> Journal de Chantier
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="min-h-[500px]">
        {/* 1. DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Lots d'Ouvrages" value={stats.totalLots} icon={Layers} color="purple" subtitle="Nomenclatures actives" />
              <StatCard title="Métrés Validés" value={`${stats.validesMetres} / ${stats.totalMetres}`} icon={Ruler} color="blue" subtitle="Attachements conformes" />
              <StatCard title="Métrés en Attente" value={stats.pendingMetres} icon={AlertCircle} color="amber" subtitle="À viser par conducteur" />
              <StatCard title="Situations Cumulées" value={`${(stats.totalSituationsHT / 1000000).toFixed(1)} M DZD`} icon={FileSpreadsheet} color="emerald" subtitle="Travaux sous-traités certifiés" />
            </div>

            {/* Avancement par lot & Alertes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Avancement Physique et Financier par Lot</h3>
                    <p className="text-[11px] text-slate-500">Calcul dynamique basé sur les métrés contradictoires enregistrés</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('lots')}
                    className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"
                  >
                    Voir nomenclature <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="p-6 space-y-5">
                  {chantierLots.map(lot => {
                    const progress = getLotProgress(lot.id, lot.budget_prevu);
                    return (
                      <div key={lot.id} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-800 flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-mono">
                              {lot.code_lot}
                            </span>
                            {lot.libelle}
                          </span>
                          <span className="text-indigo-600 font-black">{progress}%</span>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-700" 
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Budget engagé prévu : {lot.budget_prevu.toLocaleString()} DZD</span>
                          <span>{postesTravaux.filter(p => p.lot_id === lot.id).length} postes d'exécution</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Alertes & CTC Watch */}
              <div className="space-y-4">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" /> Contrôle CTC & Coulage
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Réglementation DTR
                    </span>
                  </div>
                  <div className="space-y-3">
                    {chantierControlesCTC.slice(0, 3).map(ctc => (
                      <div key={ctc.id} className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-[10px] font-bold text-slate-600">{ctc.numero_pv}</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                            ctc.avis === 'FAVORABLE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {ctc.avis}
                          </span>
                        </div>
                        <p className="font-semibold text-slate-800 line-clamp-1">{ctc.ouvrage_concerne}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                          <span>{ctc.organisme_ctc}</span>
                          <span>{ctc.autorise_coulage ? '✅ Coulage Autorisé' : '⏳ Attente Levée'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-900 to-purple-900 text-white rounded-3xl p-5 shadow-lg space-y-3">
                  <div className="flex items-center gap-2 text-indigo-200 text-xs font-bold">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Qualité Bétons & Éprouvettes</span>
                  </div>
                  <p className="text-xs text-indigo-100/90 leading-relaxed">
                    Toutes les résistances à la compression à 28 jours testées en laboratoire certifié affichent une moyenne de <strong className="text-white font-mono text-sm">31.8 MPa</strong>, supérieure à la classe B25 minimale exigée.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. LOTS & NOMENCLATURE */}
        {activeTab === 'lots' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/60">
              <div className="flex items-center gap-4">
                <h2 className="text-sm font-bold text-slate-900">Nomenclature des Lots & Bordereau de Prix</h2>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filtrer un poste, désignation..."
                    className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56 sm:w-72"
                  />
                </div>
              </div>
              <button 
                onClick={() => setIsNewLotModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-indigo-700 transition-all self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" /> Nouveau Lot de Travaux
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Désignation du Poste</th>
                    <th className="py-3 px-4 text-center">Unité</th>
                    <th className="py-3 px-4 text-right">Qté Prévue</th>
                    <th className="py-3 px-4 text-right">Qté Exécutée</th>
                    <th className="py-3 px-4 text-center">Avancement</th>
                    <th className="py-3 px-4 text-right">Prix Unitaire</th>
                    <th className="py-3 px-4 text-right">Montant Marché</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {chantierLots.map(lot => {
                    const lotPostes = postesTravaux.filter(p => {
                      if (p.lot_id !== lot.id) return false;
                      if (searchTerm) {
                        return p.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               p.code_article.toLowerCase().includes(searchTerm.toLowerCase());
                      }
                      return true;
                    });

                    const lotProgress = getLotProgress(lot.id, lot.budget_prevu);

                    return (
                      <React.Fragment key={lot.id}>
                        {/* Lot Group Header */}
                        <tr className="bg-indigo-50/60 font-bold border-t border-b border-indigo-100">
                          <td className="py-2.5 px-4 text-indigo-900 font-mono">{lot.code_lot}</td>
                          <td colSpan={4} className="py-2.5 px-4 uppercase tracking-wider text-indigo-950 font-black">
                            {lot.libelle}
                          </td>
                          <td className="py-2.5 px-4 text-center font-bold text-indigo-700 font-mono">
                            {lotProgress}%
                          </td>
                          <td colSpan={2} className="py-2.5 px-4 text-right font-mono text-indigo-900">
                            Budget : {lot.budget_prevu.toLocaleString()} DZD
                          </td>
                        </tr>

                        {/* Postes */}
                        {lotPostes.map(poste => {
                          const qteExec = getPosteQuantiteExecutee(poste.id);
                          const pctPoste = poste.quantite_prevue > 0 
                            ? Math.min(100, Math.round((qteExec / poste.quantite_prevue) * 100))
                            : 0;
                          const montantMarché = poste.quantite_prevue * poste.prix_unitaire_ref;

                          return (
                            <tr key={poste.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-4 font-mono text-slate-500 pl-8">{poste.code_article}</td>
                              <td className="py-3 px-4 font-semibold text-slate-800">{poste.designation}</td>
                              <td className="py-3 px-4 text-center">
                                <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[10px] text-slate-700 font-bold">
                                  {poste.unite_symbole}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-slate-600 font-semibold">{poste.quantite_prevue.toLocaleString()}</td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-indigo-600">{qteExec.toLocaleString()}</td>
                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${pctPoste >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                                      style={{ width: `${pctPoste}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-600 w-8">{pctPoste}%</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-slate-600">{poste.prix_unitaire_ref.toLocaleString()} DZD</td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{montantMarché.toLocaleString()} DZD</td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. METRES & ATTACHEMENTS */}
        {activeTab === 'metres' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Action Bar */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Recherche métré, ouvrage..."
                    className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 sm:w-60"
                  />
                </div>

                {/* Filter Statut */}
                <select
                  value={filterStatutMetre}
                  onChange={(e) => setFilterStatutMetre(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white font-medium text-slate-700"
                >
                  <option value="ALL">Tous les statuts</option>
                  <option value="VALIDE">Validés</option>
                  <option value="TRANSMIS">Transmis (À valider)</option>
                  <option value="REJETE">Rejetés</option>
                </select>

                {/* Filter Lot */}
                <select
                  value={filterLotId}
                  onChange={(e) => setFilterLotId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white font-medium text-slate-700"
                >
                  <option value="ALL">Tous les lots</option>
                  {chantierLots.map(l => (
                    <option key={l.id} value={l.id}>{l.code_lot} - {l.libelle}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsNewMetreModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-indigo-700 transition-all"
                >
                  <Plus className="w-4 h-4" /> Saisir Nouveau Métré
                </button>
              </div>
            </div>

            {/* List of Métrés */}
            <div className="grid grid-cols-1 gap-4">
              {filteredMetres.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
                  <Ruler className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">Aucun métré trouvé pour ces critères</p>
                  <p className="text-xs text-slate-400 mt-1">Saisissez un nouveau métré contradictoire ou modifiez les filtres.</p>
                </div>
              ) : (
                filteredMetres.map(metre => {
                  const poste = postesTravaux.find(p => p.id === metre.poste_id);
                  const lot = lotsTravaux.find(l => l.id === poste?.lot_id);
                  const structure = structuresChantier.find(s => s.id === metre.structure_id);

                  return (
                    <div 
                      key={metre.id} 
                      className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 hover:border-indigo-300 transition-all hover:shadow-md"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                            <Ruler className="w-6 h-6 text-indigo-600" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                {poste?.code_article}
                              </span>
                              <h4 className="font-bold text-slate-900 text-sm">{poste?.designation}</h4>
                              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                                {structure?.libelle}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">
                                {lot?.code_lot}
                              </span>
                            </div>

                            <p className="text-xs text-slate-500 mt-1">
                              Mesuré par <strong className="text-slate-800">{metre.saisi_par_nom}</strong> le <span className="font-mono text-slate-700">{metre.date_mesure}</span>
                              {metre.localisation_detaillee && (
                                <> • <span className="text-indigo-600 font-medium">Repère : {metre.localisation_detaillee}</span></>
                              )}
                            </p>

                            {metre.details_calcul && (
                              <div className="mt-2 text-[11px] font-mono bg-slate-50 text-slate-700 px-3 py-1 rounded-lg border border-slate-200 inline-block">
                                Formule : {metre.details_calcul}
                              </div>
                            )}

                            {metre.commentaire && (
                              <p className="text-xs text-slate-600 mt-1.5 italic">"{metre.commentaire}"</p>
                            )}

                            <div className="mt-3 flex items-center gap-4 text-xs">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] uppercase font-bold text-slate-400">Quantité</span>
                                <span className="text-sm font-black text-indigo-700 font-mono">
                                  {metre.quantite_executee.toLocaleString()} {poste?.unite_symbole}
                                </span>
                              </div>
                              <div className="w-px h-3.5 bg-slate-200" />
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] uppercase font-bold text-slate-400">Valeur valorisée</span>
                                <span className="text-xs font-bold text-slate-900 font-mono">
                                  {((poste?.prix_unitaire_ref || 0) * metre.quantite_executee).toLocaleString()} DZD
                                </span>
                              </div>
                              <div className="w-px h-3.5 bg-slate-200" />
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] uppercase font-bold text-slate-400">Statut</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                  metre.statut === 'VALIDE' ? 'bg-emerald-100 text-emerald-800' :
                                  metre.statut === 'REJETE' ? 'bg-rose-100 text-rose-800' :
                                  'bg-amber-100 text-amber-800'
                                }`}>
                                  {metre.statut}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 self-end md:self-center">
                          {metre.statut === 'TRANSMIS' && (
                            <>
                              <button 
                                onClick={() => validerMetre(metre.id, 'REJETE')}
                                className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-50 transition-all"
                              >
                                Rejeter
                              </button>
                              <button 
                                onClick={() => validerMetre(metre.id, 'VALIDE')}
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-1.5"
                              >
                                <Check className="w-3.5 h-3.5" /> Valider
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => setSelectedMetreForDetail(metre)}
                            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                            title="Voir l'attachement détaillé"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 4. SUIVI CTC & PLANS BET */}
        {activeTab === 'ctc_bet' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Bar for CTC */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Contrôle Technique de la Construction (CTC) & Visas BET</h3>
                <p className="text-xs text-slate-500">Conformité parasismique RPA 99/version 2003 et autorisations de coulage.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsNewCTCModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-indigo-700 transition-all"
                >
                  <Plus className="w-4 h-4" /> Nouveau PV CTC
                </button>
              </div>
            </div>

            {/* CTC PVs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {chantierControlesCTC.map(ctc => (
                <div key={ctc.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-3 hover:border-indigo-300 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                        <ShieldCheck className="w-4 h-4 text-indigo-600" />
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
                      <strong>Réserves / Observations :</strong> {ctc.reserves}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Coulage :</span>
                      <span className={`font-bold ${ctc.autorise_coulage ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {ctc.autorise_coulage ? 'Autorisé' : 'Suspendu'}
                      </span>
                    </div>

                    {ctc.resistance_eprouvettes_28j && (
                      <div className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        Éprouvettes : {ctc.resistance_eprouvettes_28j} MPa
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Plans BET Section */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Référentiel des Plans d'Exécution BET (Bon Pour Exécution)</h4>
                  <p className="text-[11px] text-slate-500">Plans visés par le Bureau d'Études et approuvés par le CTC</p>
                </div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                  {chantierPlansBET.length} plans répertoriés
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[10px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Code Plan</th>
                      <th className="py-2.5 px-3">Titre de l'Ouvrage</th>
                      <th className="py-2.5 px-3">Indice</th>
                      <th className="py-2.5 px-3">Bureau d'Études</th>
                      <th className="py-2.5 px-3">Date Diffusion</th>
                      <th className="py-2.5 px-3">Visa CTC</th>
                      <th className="py-2.5 px-3 text-right">Fichier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {chantierPlansBET.map(plan => (
                      <tr key={plan.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-mono font-bold text-indigo-700">{plan.code_plan}</td>
                        <td className="py-3 px-3 font-semibold text-slate-800">{plan.titre}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-mono font-black text-[10px]">
                            Rev. {plan.indice}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600">{plan.bureau_etudes}</td>
                        <td className="py-3 px-3 font-mono text-slate-500">{plan.date_diffusion}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            plan.statut_visa === 'BPE_VALIDE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {plan.statut_visa === 'BPE_VALIDE' ? 'BPE Validé' : 'En Revue'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-500 text-[11px]">
                          {plan.fichier_nom || 'PDF d’Exécution'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 5. SITUATIONS DE TRAVAUX */}
        {activeTab === 'situations' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Situations Mensuelles des Entreprises Sous-traitantes</h3>
                <p className="text-xs text-slate-500">Décomptes contradictoires calculés d'après les métrés validés, avec retenue de garantie de 5%.</p>
              </div>
              <button 
                onClick={() => alert("Pour créer une situation, sélectionnez les métrés validés du mois dans l'onglet Métrés.")}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-indigo-700 transition-all self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" /> Générer Décompte Mensuel
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {chantierSituations.map(sit => {
                const lot = lotsTravaux.find(l => l.id === sit.lot_id);
                return (
                  <div key={sit.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 hover:border-indigo-300 transition-all">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                            {sit.numero_situation}
                          </span>
                          <span className="text-sm font-bold text-slate-900">{sit.entreprise_sous_traitante}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {lot?.libelle}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Période : {sit.periode_mois} • Émise le {sit.date_emission}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-black ${
                          sit.statut === 'APPROUVEE_CT' ? 'bg-emerald-100 text-emerald-800' :
                          sit.statut === 'VISEE_DIRECTEUR' ? 'bg-purple-100 text-purple-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {sit.statut}
                        </span>

                        {sit.statut === 'VERIFIEE_METREUR' && (
                          <button
                            onClick={() => validerSituationTravaux(sit.id, 'APPROUVEE_CT')}
                            className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-sm"
                          >
                            Approuver Situation
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Cumul Précédent</div>
                        <div className="text-sm font-mono font-bold text-slate-700 mt-0.5">
                          {sit.montant_cumule_precedent_dzd.toLocaleString()} DZD
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Mois en cours (HT)</div>
                        <div className="text-sm font-mono font-black text-indigo-600 mt-0.5">
                          {sit.montant_mois_ht_dzd.toLocaleString()} DZD
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Retenue Garantie (5%)</div>
                        <div className="text-sm font-mono font-bold text-rose-600 mt-0.5">
                          - {sit.retenue_garantie_dzd.toLocaleString()} DZD
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Net à Payer (HT)</div>
                        <div className="text-base font-mono font-black text-emerald-600 mt-0.5">
                          {sit.montant_net_dzd.toLocaleString()} DZD
                        </div>
                      </div>
                    </div>

                    {sit.valide_par_nom && (
                      <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                        <span>Visa technique : <strong className="text-slate-700">{sit.valide_par_nom}</strong></span>
                        <button className="text-indigo-600 hover:underline font-bold flex items-center gap-1">
                          <Printer className="w-3.5 h-3.5" /> Imprimer Décompte
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. JOURNAL DE CHANTIER (RAPPORTS) */}
        {activeTab === 'rapports' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-slate-200 transition-all border border-slate-200"
                >
                  <Printer className="w-3.5 h-3.5" /> Imprimer Journal
                </button>
              </div>

              <button 
                onClick={() => setIsNewRapportModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-indigo-700 transition-all self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" /> Nouveau Rapport Journalier
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {chantierRapports.map(rapport => (
                <div 
                  key={rapport.id} 
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden group hover:border-indigo-400 hover:shadow-lg transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-slate-900">{rapport.date_rapport}</div>
                          <div className="text-[9px] uppercase font-bold text-slate-400">{rapport.type}</div>
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        rapport.statut === 'VALIDE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {rapport.statut}
                      </span>
                    </div>

                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Météo :</span>
                        <span className="font-semibold text-slate-800">{rapport.meteo}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Effectif sur site :</span>
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{rapport.effectif_total} ouvriers</span>
                      </div>
                      {rapport.materiel_sur_site && (
                        <div className="text-[11px] text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <strong className="text-slate-800 font-medium">Engins : </strong>{rapport.materiel_sur_site}
                        </div>
                      )}
                      <div className="pt-2">
                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Activités Principales</div>
                        <p className="text-xs text-slate-700 line-clamp-3 leading-relaxed">
                          {rapport.activites_realisees}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-[10px] text-slate-500">
                      Rédigé par <strong className="text-slate-800">{rapport.redacteur_nom}</strong>
                    </div>
                    <button 
                      onClick={() => setSelectedRapportForDetail(rapport)}
                      className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                    >
                      Consulter <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL 1: Saisie Nouveau Métré Contradictoire */}
      {/* ============================================================ */}
      {isNewMetreModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700">
                  <Ruler className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Saisir un Métré Contradictoire</h3>
                  <p className="text-xs text-slate-500">Relevé sur site et vérification des quantités exécutées</p>
                </div>
              </div>
              <button 
                onClick={() => setIsNewMetreModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMetreSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Poste de Travaux *</label>
                <select
                  required
                  value={metreForm.poste_id}
                  onChange={(e) => setMetreForm({ ...metreForm, poste_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Sélectionner le poste --</option>
                  {postesTravaux.map(p => {
                    const lot = lotsTravaux.find(l => l.id === p.lot_id);
                    return (
                      <option key={p.id} value={p.id}>
                        [{lot?.code_lot}] {p.code_article} — {p.designation} ({p.unite_symbole})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Localisation Structurelle (Bâtiment / Bloc / Étage) *</label>
                <select
                  required
                  value={metreForm.structure_id}
                  onChange={(e) => setMetreForm({ ...metreForm, structure_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Sélectionner la structure --</option>
                  {chantierStructures.map(s => (
                    <option key={s.id} value={s.id}>
                      [{s.type}] {s.libelle}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quantité Réalisée *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={metreForm.quantite_executee || ''}
                    onChange={(e) => setMetreForm({ ...metreForm, quantite_executee: parseFloat(e.target.value) || 0 })}
                    placeholder="Ex: 145.5"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-indigo-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Repère sur Plan / Axes</label>
                  <input
                    type="text"
                    value={metreForm.localisation_detaillee}
                    onChange={(e) => setMetreForm({ ...metreForm, localisation_detaillee: e.target.value })}
                    placeholder="Ex: Poteaux P1 à P16 File C"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Détails de Calcul (Formule géométrique)</label>
                <input
                  type="text"
                  value={metreForm.details_calcul}
                  onChange={(e) => setMetreForm({ ...metreForm, details_calcul: e.target.value })}
                  placeholder="Ex: 16 x (0.50 x 0.50 x 3.20) + voile cage = 145.5"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Commentaires techniques ou réserves</label>
                <textarea
                  rows={2}
                  value={metreForm.commentaire}
                  onChange={(e) => setMetreForm({ ...metreForm, commentaire: e.target.value })}
                  placeholder="Observations sur le coulage, conformité ferraillage ou conditions de pose..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewMetreModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-sm"
                >
                  Enregistrer & Transmettre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: Nouveau Rapport Journalier */}
      {/* ============================================================ */}
      {isNewRapportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Rédiger un Rapport Journalier de Chantier</h3>
                  <p className="text-xs text-slate-500">Journal officiel d'exécution et point de situation du site</p>
                </div>
              </div>
              <button 
                onClick={() => setIsNewRapportModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRapportSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date du Rapport *</label>
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
                    placeholder="Ex: Ensoleillé 24°C"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Effectif Global sur site</label>
                  <input
                    type="number"
                    value={rapportForm.effectif_total}
                    onChange={(e) => setRapportForm({ ...rapportForm, effectif_total: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Engins & Matériel Mobilisés</label>
                <input
                  type="text"
                  value={rapportForm.materiel_sur_site}
                  onChange={(e) => setRapportForm({ ...rapportForm, materiel_sur_site: e.target.value })}
                  placeholder="Ex: Grue à tour, 2 Camions toupie, Pompe à béton, Compresseur..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Activités Réalisées dans la Journée *</label>
                <textarea
                  required
                  rows={3}
                  value={rapportForm.activites_realisees}
                  onChange={(e) => setRapportForm({ ...rapportForm, activites_realisees: e.target.value })}
                  placeholder="Détail des travaux exécutés par corps d'état (ferraillage, coulage, maçonnerie, câblage)..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Incidents / Hygiène & Sécurité (HSE)</label>
                  <input
                    type="text"
                    value={rapportForm.incidents_securite}
                    onChange={(e) => setRapportForm({ ...rapportForm, incidents_securite: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Retards ou Arrêts de Chantier</label>
                  <input
                    type="text"
                    value={rapportForm.anomalies_retards}
                    onChange={(e) => setRapportForm({ ...rapportForm, anomalies_retards: e.target.value })}
                    placeholder="Ex: Attente livraison acier D16, coupure SONELGAZ..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewRapportModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-sm"
                >
                  Enregistrer & Valider le Rapport
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: Nouveau Lot de Travaux */}
      {/* ============================================================ */}
      {isNewLotModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Ajouter un Lot de Travaux</h3>
              <button onClick={() => setIsNewLotModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateLotSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Code du Lot *</label>
                <input
                  type="text"
                  required
                  value={lotForm.code_lot}
                  onChange={(e) => setLotForm({ ...lotForm, code_lot: e.target.value })}
                  placeholder="Ex: LOT-07 ou LOT-ELEC"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Désignation du Lot *</label>
                <input
                  type="text"
                  required
                  value={lotForm.libelle}
                  onChange={(e) => setLotForm({ ...lotForm, libelle: e.target.value })}
                  placeholder="Ex: Peinture & Revêtements Décoratifs"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Budget Prévisionnel (DZD)</label>
                <input
                  type="number"
                  value={lotForm.budget_prevu || ''}
                  onChange={(e) => setLotForm({ ...lotForm, budget_prevu: parseFloat(e.target.value) || 0 })}
                  placeholder="Ex: 35000000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewLotModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                >
                  Créer le Lot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: Nouveau Contrôle CTC */}
      {/* ============================================================ */}
      {isNewCTCModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Nouveau PV de Visite CTC</h3>
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
                    placeholder="Ex: PV-CTC-2026-092"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date de Visite *</label>
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
                  placeholder="Ex: Ferraillage Dalle Pleine R+3 Bloc B"
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
                  <label className="block font-bold text-slate-700 mb-1">Avis Émis</label>
                  <select
                    value={ctcForm.avis}
                    onChange={(e) => setCtcForm({ ...ctcForm, avis: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                  >
                    <option value="FAVORABLE">Favorable (AVF)</option>
                    <option value="FAVORABLE_RESERVES">Favorable avec Réserves</option>
                    <option value="DEFAVORABLE">Défavorable (Suspension)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Réserves ou Observations</label>
                <textarea
                  rows={2}
                  value={ctcForm.reserves}
                  onChange={(e) => setCtcForm({ ...ctcForm, reserves: e.target.value })}
                  placeholder="Ex: Vérifier les cales d'enrobage avant coulage..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="coulageAuth"
                  checked={ctcForm.autorise_coulage}
                  onChange={(e) => setCtcForm({ ...ctcForm, autorise_coulage: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600"
                />
                <label htmlFor="coulageAuth" className="font-bold text-slate-700">
                  Autorisation expresse de coulage de béton accordée
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
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                >
                  Enregistrer le PV
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 5: Détail Rapport Journalier */}
      {/* ============================================================ */}
      {selectedRapportForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">
                    Rapport de Chantier du {selectedRapportForDetail.date_rapport}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Réf : {selectedRapportForDetail.id} • Rédacteur : {selectedRapportForDetail.redacteur_nom}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRapportForDetail(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Météo</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedRapportForDetail.meteo}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Effectif Total</span>
                  <p className="font-bold text-indigo-700 mt-0.5">{selectedRapportForDetail.effectif_total} ouvriers</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Intempéries</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedRapportForDetail.heures_intemperies || 0} h</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Statut</span>
                  <p className="font-bold text-emerald-600 mt-0.5">{selectedRapportForDetail.statut}</p>
                </div>
              </div>

              {selectedRapportForDetail.corps_etat_presents && selectedRapportForDetail.corps_etat_presents.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">Ventilation de l'effectif par métier :</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedRapportForDetail.corps_etat_presents.map((c, i) => (
                      <div key={i} className="flex justify-between items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-600">{c.metier}</span>
                        <span className="font-bold text-slate-900 font-mono">{c.nombre}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-bold text-slate-800 mb-1">Activités et Avancement Réalisés :</h4>
                <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-slate-800 leading-relaxed text-xs">
                  {selectedRapportForDetail.activites_realisees}
                </div>
              </div>

              {selectedRapportForDetail.materiel_sur_site && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Matériel & Engins Mobilisés :</h4>
                  <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {selectedRapportForDetail.materiel_sur_site}
                  </p>
                </div>
              )}

              {selectedRapportForDetail.anomalies_retards && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Anomalies & Événements Particuliers :</h4>
                  <p className="text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                    {selectedRapportForDetail.anomalies_retards}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-slate-50"
              >
                <Printer className="w-3.5 h-3.5" /> Imprimer Fiche Journal
              </button>
              <button
                onClick={() => setSelectedRapportForDetail(null)}
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 6: Détail Attachement de Métré */}
      {/* ============================================================ */}
      {selectedMetreForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Ruler className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Attachement Contradictoire de Métré</h3>
              </div>
              <button onClick={() => setSelectedMetreForDetail(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Poste concerné</div>
                <div className="font-bold text-slate-900 text-sm">
                  {postesTravaux.find(p => p.id === selectedMetreForDetail.poste_id)?.designation}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Quantité Mesurée</span>
                  <div className="text-base font-black text-indigo-700 font-mono mt-0.5">
                    {selectedMetreForDetail.quantite_executee.toLocaleString()} {postesTravaux.find(p => p.id === selectedMetreForDetail.poste_id)?.unite_symbole}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Date de Mesure</span>
                  <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">
                    {selectedMetreForDetail.date_mesure}
                  </div>
                </div>
              </div>

              {selectedMetreForDetail.localisation_detaillee && (
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Localisation & Axes</span>
                  <p className="font-semibold text-slate-800">{selectedMetreForDetail.localisation_detaillee}</p>
                </div>
              )}

              {selectedMetreForDetail.details_calcul && (
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Formule de Calcul Géométrique</span>
                  <p className="font-mono bg-slate-100 p-2 rounded-xl text-slate-800">{selectedMetreForDetail.details_calcul}</p>
                </div>
              )}

              {selectedMetreForDetail.commentaire && (
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Observations Métreur</span>
                  <p className="text-slate-600 italic">"{selectedMetreForDetail.commentaire}"</p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Saisi par : <strong className="text-slate-700">{selectedMetreForDetail.saisi_par_nom}</strong></span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                  selectedMetreForDetail.statut === 'VALIDE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {selectedMetreForDetail.statut}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedMetreForDetail(null)}
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700"
              >
                Fermer
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
  color: 'purple' | 'blue' | 'amber' | 'emerald';
  subtitle?: string;
}> = ({ title, value, icon: Icon, color, subtitle }) => {
  const colors = {
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100'
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
