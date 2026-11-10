'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Ruler, 
  Layers, 
  Building, 
  FileSpreadsheet, 
  FileText, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Printer, 
  X, 
  Check, 
  Filter, 
  ChevronRight, 
  TrendingUp,
  Download,
  ShieldCheck
} from 'lucide-react';
import { 
  LotTravaux, 
  PosteTravaux, 
  StructureChantier, 
  MetreVérification, 
  PlanBET, 
  SituationTravaux 
} from '../types/database';

type MetreTab = 'metres' | 'lots_bpu' | 'situations' | 'plans_bet';

export const MetresView: React.FC = () => {
  const { 
    selectedChantierId, 
    allChantiers,
    lotsTravaux, 
    structuresChantier, 
    postesTravaux, 
    metres, 
    plansBET,
    situationsTravaux,
    currentUser,
    ajouterLotTravaux,
    ajouterMetre,
    validerSituationTravaux
  } = useApp();

  const [activeTab, setActiveTab] = useState<MetreTab>('metres');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('ALL');
  const [filterLotId, setFilterLotId] = useState<string>('ALL');

  // Modales
  const [isNewMetreModalOpen, setIsNewMetreModalOpen] = useState(false);
  const [isNewLotModalOpen, setIsNewLotModalOpen] = useState(false);
  const [selectedMetreForDetail, setSelectedMetreForDetail] = useState<MetreVérification | null>(null);

  // Formulaire Nouveau Métré
  const [metreForm, setMetreForm] = useState({
    poste_id: '',
    structure_id: '',
    quantite_executee: 0,
    localisation_detaillee: '',
    details_calcul: '',
    commentaire: ''
  });

  // Formulaire Nouveau Lot
  const [lotForm, setLotForm] = useState({
    code_lot: '',
    libelle: '',
    budget_prevu: 0,
    description: ''
  });

  // Filtrages par chantier actif
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

  const chantierPlans = useMemo(() => 
    plansBET.filter(p => p.chantier_id === selectedChantierId || selectedChantierId === 'ALL'),
  [plansBET, selectedChantierId]);

  const chantierSituations = useMemo(() => 
    situationsTravaux.filter(s => s.chantier_id === selectedChantierId || selectedChantierId === 'ALL'),
  [situationsTravaux, selectedChantierId]);

  // Quantité exécutée par poste
  const getPosteQuantiteExecutee = (posteId: string) => {
    return metres
      .filter(m => m.poste_id === posteId && (m.statut === 'VALIDE' || m.statut === 'TRANSMIS'))
      .reduce((sum, m) => sum + m.quantite_executee, 0);
  };

  const getPosteMontantExecute = (poste: PosteTravaux) => {
    const qte = getPosteQuantiteExecutee(poste.id);
    return qte * poste.prix_unitaire_ref;
  };

  const getLotProgress = (lotId: string, budgetPrevu: number) => {
    const postesDuLot = postesTravaux.filter(p => p.lot_id === lotId);
    if (postesDuLot.length === 0) return 0;
    const totalExecute = postesDuLot.reduce((acc, p) => acc + getPosteMontantExecute(p), 0);
    if (!budgetPrevu || budgetPrevu === 0) return 0;
    return Math.min(100, Math.round((totalExecute / budgetPrevu) * 100)) || 0;
  };

  // KPIs
  const stats = useMemo(() => {
    const totalMetres = chantierMetres.length;
    const validesCount = chantierMetres.filter(m => m.statut === 'VALIDE').length;
    const pendingCount = chantierMetres.filter(m => m.statut === 'TRANSMIS').length;
    const totalSituationsDZD = chantierSituations.reduce((sum, s) => sum + s.montant_net_dzd, 0);

    return {
      totalMetres,
      validesCount,
      pendingCount,
      totalSituationsDZD
    };
  }, [chantierMetres, chantierSituations]);

  // Métrés filtrés
  const filteredMetres = useMemo(() => {
    return chantierMetres.filter(m => {
      if (filterStatut !== 'ALL' && m.statut !== filterStatut) return false;
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
  }, [chantierMetres, filterStatut, filterLotId, searchTerm, postesTravaux]);

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

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-2xl border border-blue-500/30 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-widest mb-1.5">
              <Ruler className="w-4 h-4 text-blue-400" />
              <span>Études Quantitatives & Métreur Vérificateur</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Métrés, Bordereaux & Situations de Travaux
            </h1>
            <p className="text-blue-100/80 text-sm mt-1.5 max-w-2xl font-medium">
              Saisie contradictoire des quantitatifs d'exécution, nomenclatures BPU, attachements de travaux et décomptes mensuels des entreprises sous-traitantes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                <CheckCircle2 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-[10px] text-blue-300 font-bold uppercase tracking-wider">Métrés Certifiés</div>
                <div className="text-xl font-black text-white">{stats.validesCount} / {stats.totalMetres}</div>
              </div>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">Situations Net</div>
                <div className="text-xl font-black text-white">{(stats.totalSituationsDZD / 1000000).toFixed(1)} M DZD</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 mt-8 bg-slate-950/70 p-1.5 rounded-2xl w-full sm:w-fit border border-white/10 overflow-x-auto">
          <button
            onClick={() => setActiveTab('metres')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'metres' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40' : 'text-blue-200 hover:bg-white/5'
            }`}
          >
            <Ruler className="w-4 h-4" /> Métrés & Attachements
            {stats.pendingCount > 0 && (
              <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {stats.pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('lots_bpu')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'lots_bpu' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40' : 'text-blue-200 hover:bg-white/5'
            }`}
          >
            <Layers className="w-4 h-4" /> Lots & Bordereau BPU
          </button>
          <button
            onClick={() => setActiveTab('situations')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'situations' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40' : 'text-blue-200 hover:bg-white/5'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" /> Situations Sous-traitants
          </button>
          <button
            onClick={() => setActiveTab('plans_bet')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'plans_bet' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40' : 'text-blue-200 hover:bg-white/5'
            }`}
          >
            <Building className="w-4 h-4" /> Plans BET & Indices BPE
          </button>
        </div>
      </div>

      {/* Main Tabs Content */}
      <div className="min-h-[500px]">
        {/* 1. MÉTRÉS & ATTACHEMENTS */}
        {activeTab === 'metres' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Filter Bar */}
            <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Chercher métré, article, repère..."
                    className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-64"
                  />
                </div>

                <select
                  value={filterStatut}
                  onChange={(e) => setFilterStatut(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white font-medium"
                >
                  <option value="ALL">Tous les statuts</option>
                  <option value="VALIDE">Validés par le conducteur</option>
                  <option value="TRANSMIS">Transmis (En attente de visa)</option>
                  <option value="REJETE">Rejetés</option>
                </select>

                <select
                  value={filterLotId}
                  onChange={(e) => setFilterLotId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white font-medium"
                >
                  <option value="ALL">Tous les lots</option>
                  {chantierLots.map(l => (
                    <option key={l.id} value={l.id}>{l.code_lot} - {l.libelle}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setIsNewMetreModalOpen(true)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all self-start md:self-auto"
              >
                <Plus className="w-4 h-4" /> Saisir Nouveau Métré
              </button>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 gap-4">
              {filteredMetres.map(m => {
                const poste = postesTravaux.find(p => p.id === m.poste_id);
                const lot = lotsTravaux.find(l => l.id === poste?.lot_id);
                const structure = structuresChantier.find(s => s.id === m.structure_id);

                return (
                  <div key={m.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 hover:border-blue-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {poste?.code_article}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">{poste?.designation}</h4>
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px]">
                          {structure?.libelle}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                          {lot?.code_lot}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 mt-1">
                        Relevé par <strong className="text-slate-800">{m.saisi_par_nom}</strong> le {m.date_mesure}
                        {m.localisation_detaillee && <> • Repère : <span className="font-medium text-blue-700">{m.localisation_detaillee}</span></>}
                      </p>

                      {m.details_calcul && (
                        <div className="mt-2 text-[11px] font-mono bg-slate-50 text-slate-700 px-3 py-1 rounded-lg border border-slate-200 inline-block">
                          Formule : {m.details_calcul}
                        </div>
                      )}

                      <div className="mt-3 flex items-center gap-4 text-xs">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Quantité :</span>
                        <strong className="text-sm font-mono font-black text-blue-700">
                          {m.quantite_executee.toLocaleString()} {poste?.unite_symbole}
                        </strong>
                        <span className="text-slate-300">|</span>
                        <span className="text-[10px] font-bold uppercase text-slate-400">Valeur :</span>
                        <strong className="text-slate-900 font-mono">
                          {((poste?.prix_unitaire_ref || 0) * m.quantite_executee).toLocaleString()} DZD
                        </strong>
                        <span className="text-slate-300">|</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          m.statut === 'VALIDE' ? 'bg-emerald-100 text-emerald-800' :
                          m.statut === 'REJETE' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {m.statut}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <button
                        onClick={() => setSelectedMetreForDetail(m)}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" /> Fiche Attachement
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. LOTS & BORDEREAU BPU */}
        {activeTab === 'lots_bpu' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/60">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Bordereau des Prix Unitaires (BPU) & Décomposition du Marché</h2>
                <p className="text-[11px] text-slate-500">Nomenclatures contractuelles des postes par lot de travaux</p>
              </div>
              <button
                onClick={() => setIsNewLotModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" /> Nouveau Lot de Travaux
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Désignation du Poste</th>
                    <th className="py-3 px-4 text-center">Unité</th>
                    <th className="py-3 px-4 text-right">Qté Prévue</th>
                    <th className="py-3 px-4 text-right">Qté Mesurée</th>
                    <th className="py-3 px-4 text-center">Avancement</th>
                    <th className="py-3 px-4 text-right">Prix Unitaire</th>
                    <th className="py-3 px-4 text-right">Montant Marché</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {chantierLots.map(lot => {
                    const lotPostes = postesTravaux.filter(p => p.lot_id === lot.id);
                    const progress = getLotProgress(lot.id, lot.budget_prevu);

                    return (
                      <React.Fragment key={lot.id}>
                        <tr className="bg-blue-50/60 font-bold border-t border-b border-blue-100">
                          <td className="py-2.5 px-4 font-mono text-blue-900">{lot.code_lot}</td>
                          <td colSpan={4} className="py-2.5 px-4 uppercase text-blue-950 font-black">{lot.libelle}</td>
                          <td className="py-2.5 px-4 text-center font-bold text-blue-800 font-mono">{progress}%</td>
                          <td colSpan={2} className="py-2.5 px-4 text-right font-mono text-blue-900">
                            Budget : {lot.budget_prevu.toLocaleString()} DZD
                          </td>
                        </tr>

                        {lotPostes.map(p => {
                          const qteMesuree = getPosteQuantiteExecutee(p.id);
                          const pct = p.quantite_prevue > 0 ? Math.min(100, Math.round((qteMesuree / p.quantite_prevue) * 100)) : 0;
                          return (
                            <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-4 font-mono text-slate-500 pl-8">{p.code_article}</td>
                              <td className="py-3 px-4 font-semibold text-slate-800">{p.designation}</td>
                              <td className="py-3 px-4 text-center">
                                <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[10px] font-bold">
                                  {p.unite_symbole}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-slate-600">{p.quantite_prevue.toLocaleString()}</td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-blue-700">{qteMesuree.toLocaleString()}</td>
                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-600 w-8">{pct}%</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-slate-600">{p.prix_unitaire_ref.toLocaleString()} DZD</td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                                {(p.quantite_prevue * p.prix_unitaire_ref).toLocaleString()} DZD
                              </td>
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

        {/* 3. SITUATIONS SOUS-TRAITANTS */}
        {activeTab === 'situations' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Situations Mensuelles & Décomptes Établis</h3>
                <p className="text-xs text-slate-500">Calcul contradictoire basé sur les attachements avec retenue de garantie légale de 5%.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {chantierSituations.map(sit => {
                const lot = lotsTravaux.find(l => l.id === sit.lot_id);
                return (
                  <div key={sit.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 hover:border-blue-300 transition-all">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            {sit.numero_situation}
                          </span>
                          <span className="text-sm font-bold text-slate-900">{sit.entreprise_sous_traitante}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {lot?.libelle}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Période : {sit.periode_mois} • Émise le {sit.date_emission}</p>
                      </div>

                      <span className={`px-3 py-1 rounded-full text-xs font-black self-start md:self-auto ${
                        sit.statut === 'APPROUVEE_CT' ? 'bg-emerald-100 text-emerald-800' :
                        sit.statut === 'VISEE_DIRECTEUR' ? 'bg-purple-100 text-purple-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {sit.statut}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Cumul Précédent</div>
                        <div className="text-sm font-mono font-bold text-slate-700 mt-0.5">
                          {sit.montant_cumule_precedent_dzd.toLocaleString()} DZD
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Travaux du Mois (HT)</div>
                        <div className="text-sm font-mono font-black text-blue-700 mt-0.5">
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
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. PLANS BET */}
        {activeTab === 'plans_bet' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Plans d'Exécution BET & Indices "Bon Pour Exécution" (BPE)</h4>
                <p className="text-[11px] text-slate-500">Contrôle de conformité des plans utilisés pour les calculs de métrés</p>
              </div>
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
                    <th className="py-2.5 px-3">Statut Visa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {chantierPlans.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono font-bold text-blue-700">{p.code_plan}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{p.titre}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-black text-[10px]">
                          Rev. {p.indice}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{p.bureau_etudes}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">{p.date_diffusion}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          p.statut_visa === 'BPE_VALIDE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {p.statut_visa === 'BPE_VALIDE' ? 'BPE Validé' : 'En Revue'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Saisie Métré */}
      {isNewMetreModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
                  <Ruler className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Saisir un Métré Contradictoire</h3>
                  <p className="text-xs text-slate-500">Calcul des quantitatifs d'exécution par le Métreur Vérificateur</p>
                </div>
              </div>
              <button onClick={() => setIsNewMetreModalOpen(false)} className="text-slate-400 hover:text-slate-700">
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
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500"
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
                <label className="block font-bold text-slate-700 mb-1">Structure (Bâtiment / Bloc / Étage) *</label>
                <select
                  required
                  value={metreForm.structure_id}
                  onChange={(e) => setMetreForm({ ...metreForm, structure_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500"
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
                  <label className="block font-bold text-slate-700 mb-1">Quantité Mesurée *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={metreForm.quantite_executee || ''}
                    onChange={(e) => setMetreForm({ ...metreForm, quantite_executee: parseFloat(e.target.value) || 0 })}
                    placeholder="Ex: 145.5"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-blue-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Localisation / Repère Plans</label>
                  <input
                    type="text"
                    value={metreForm.localisation_detaillee}
                    onChange={(e) => setMetreForm({ ...metreForm, localisation_detaillee: e.target.value })}
                    placeholder="Ex: Poteaux P1 à P12 File B"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Formule Géométrique de Cubature (L x l x h)</label>
                <input
                  type="text"
                  value={metreForm.details_calcul}
                  onChange={(e) => setMetreForm({ ...metreForm, details_calcul: e.target.value })}
                  placeholder="Ex: 12 x 0.40 x 0.40 x 3.20 = 6.14 m³"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Commentaire Technique Métreur</label>
                <textarea
                  rows={2}
                  value={metreForm.commentaire}
                  onChange={(e) => setMetreForm({ ...metreForm, commentaire: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewMetreModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-sm"
                >
                  Enregistrer & Transmettre au Conducteur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Nouveau Lot */}
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
                <label className="block font-bold text-slate-700 mb-1">Code Lot *</label>
                <input
                  type="text"
                  required
                  value={lotForm.code_lot}
                  onChange={(e) => setLotForm({ ...lotForm, code_lot: e.target.value })}
                  placeholder="Ex: LOT-08"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Libellé *</label>
                <input
                  type="text"
                  required
                  value={lotForm.libelle}
                  onChange={(e) => setLotForm({ ...lotForm, libelle: e.target.value })}
                  placeholder="Ex: Revêtements Marbre & Granito"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Budget Prévu (DZD)</label>
                <input
                  type="number"
                  value={lotForm.budget_prevu || ''}
                  onChange={(e) => setLotForm({ ...lotForm, budget_prevu: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewLotModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
                >
                  Créer le Lot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Fiche Attachement */}
      {selectedMetreForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Fiche Attachement de Métré Contradictoire</h3>
              <button onClick={() => setSelectedMetreForDetail(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Poste</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">
                  {postesTravaux.find(p => p.id === selectedMetreForDetail.poste_id)?.designation}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Quantité</span>
                  <div className="text-base font-black text-blue-700 font-mono">
                    {selectedMetreForDetail.quantite_executee.toLocaleString()} {postesTravaux.find(p => p.id === selectedMetreForDetail.poste_id)?.unite_symbole}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Date</span>
                  <div className="text-sm font-bold text-slate-800 font-mono">
                    {selectedMetreForDetail.date_mesure}
                  </div>
                </div>
              </div>
              {selectedMetreForDetail.details_calcul && (
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Calcul :</span>
                  <p className="font-mono bg-slate-100 p-2 rounded-xl text-slate-800">{selectedMetreForDetail.details_calcul}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedMetreForDetail(null)}
                className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs"
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
