'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Scale,
  FileText,
  Building,
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Download,
  Printer,
  FileCheck,
  ShieldAlert,
  Gavel,
  Paperclip,
  Calendar,
  History,
  Eye,
  User,
  X,
  Lock,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import {
  ContratJuridique,
  DocumentFoncierAdmin,
  DossierLitige
} from '../types/database';

type JuridiqueTab = 'contrats' | 'foncier' | 'litiges' | 'ged';

export const JuridiqueView: React.FC = () => {
  const {
    contratsJuridiques,
    documentsFonciers,
    dossiersLitiges,
    ajouterContratJuridique,
    ajouterDocumentFoncier,
    ajouterDossierLitige,
    ajouterPieceJointeJuridique,
    chantiers,
    selectedChantierId,
    currentChantier,
    currentUser
  } = useApp();

  const [activeTab, setActiveTab] = useState<JuridiqueTab>('contrats');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Modals visibility
  const [showContratModal, setShowContratModal] = useState(false);
  const [showFoncierModal, setShowFoncierModal] = useState(false);
  const [showLitigeModal, setShowLitigeModal] = useState(false);
  const [showUploadPjModal, setShowUploadPjModal] = useState<{ type: 'CONTRAT' | 'FONCIER' | 'LITIGE'; id: string; num: string } | null>(null);
  const [selectedContratDetail, setSelectedContratDetail] = useState<ContratJuridique | null>(null);

  // Form states
  const [newContrat, setNewContrat] = useState({
    numero_contrat: `CTR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    titre: '',
    type: 'FOURNISSEUR' as ContratJuridique['type'],
    partie_prenante_nom: '',
    chantier_id: selectedChantierId === 'ALL' ? (chantiers[0]?.id || '') : selectedChantierId,
    date_signature: new Date().toISOString().split('T')[0],
    date_effet: new Date().toISOString().split('T')[0],
    date_echeance: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    montant_dzd: '',
    reconduction_automatique: false,
    delai_preavis_jours: 30,
    notes: ''
  });

  const [newFoncier, setNewFoncier] = useState({
    type: 'ACTE_PROPRIETE_FONCIER' as DocumentFoncierAdmin['type'],
    titre: '',
    reference_officielle: '',
    wilaya: 'Alger (16)',
    commune: 'Dely Ibrahim',
    chantier_id: selectedChantierId === 'ALL' ? (chantiers[0]?.id || '') : selectedChantierId,
    notaire_nom: '',
    date_delivrance: new Date().toISOString().split('T')[0],
    date_validite: '',
    notes: ''
  });

  const [newLitige, setNewLitige] = useState({
    numero_dossier: `LIT-2026-${Math.floor(100 + Math.random() * 900)}`,
    titre_affaire: '',
    juridiction: 'TRIBUNAL_CIVIL' as DossierLitige['juridiction'],
    partie_adverse: '',
    qualite: 'DEFENDEUR' as DossierLitige['qualite'],
    enjeu_financier_dzd: '',
    avocat_conseil_nom: 'Maitre Sofiane CHERIF (Avocat à la Cour)',
    prochaine_audience_date: '',
    resume_faits: ''
  });

  const [pjTitle, setPjTitle] = useState('');
  const [pjFileName, setPjFileName] = useState('');

  // Expiring contracts alert (within 60 days)
  const expiringContratsCount = useMemo(() => {
    const today = new Date().getTime();
    return contratsJuridiques.filter(c => {
      const exp = new Date(c.date_echeance).getTime();
      const diffDays = (exp - today) / (1000 * 3600 * 24);
      return diffDays > 0 && diffDays <= 60 && c.statut === 'EN_VIGUEUR';
    }).length;
  }, [contratsJuridiques]);

  // Total legal stakes
  const totalEnjeuxLitiges = useMemo(() => {
    return dossiersLitiges.reduce((sum, l) => sum + l.enjeu_financier_dzd, 0);
  }, [dossiersLitiges]);

  // Filters
  const filteredContrats = useMemo(() => {
    return contratsJuridiques.filter(c => {
      const matchChantier = selectedChantierId === 'ALL' || c.chantier_id === selectedChantierId;
      const matchType = typeFilter === 'ALL' || c.type === typeFilter;
      const matchSearch = searchTerm === '' ||
        c.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.numero_contrat.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.partie_prenante_nom.toLowerCase().includes(searchTerm.toLowerCase());
      return matchChantier && matchType && matchSearch;
    });
  }, [contratsJuridiques, selectedChantierId, typeFilter, searchTerm]);

  const filteredFonciers = useMemo(() => {
    return documentsFonciers.filter(f => {
      const matchChantier = selectedChantierId === 'ALL' || f.chantier_id === selectedChantierId;
      const matchSearch = searchTerm === '' ||
        f.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.reference_officielle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.commune.toLowerCase().includes(searchTerm.toLowerCase());
      return matchChantier && matchSearch;
    });
  }, [documentsFonciers, selectedChantierId, searchTerm]);

  const filteredLitiges = useMemo(() => {
    return dossiersLitiges.filter(l => {
      const matchSearch = searchTerm === '' ||
        l.titre_affaire.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.numero_dossier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.partie_adverse.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [dossiersLitiges, searchTerm]);

  // Handlers
  const handleContratSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContrat.titre || !newContrat.partie_prenante_nom) {
      alert("Le titre du contrat et la partie prenante sont obligatoires.");
      return;
    }
    const targetChantier = chantiers.find(c => c.id === newContrat.chantier_id);
    ajouterContratJuridique({
      numero_contrat: newContrat.numero_contrat,
      titre: newContrat.titre,
      type: newContrat.type,
      partie_prenante_nom: newContrat.partie_prenante_nom,
      chantier_id: newContrat.chantier_id,
      chantier_nom: targetChantier?.nom_projet || 'Direction Générale',
      date_signature: newContrat.date_signature,
      date_effet: newContrat.date_effet,
      date_echeance: newContrat.date_echeance,
      montant_dzd: parseFloat(newContrat.montant_dzd) || 0,
      statut: 'EN_VIGUEUR',
      reconduction_automatique: newContrat.reconduction_automatique,
      delai_preavis_jours: newContrat.delai_preavis_jours,
      responsable_juridique_nom: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Responsable Juridique',
      notes: newContrat.notes
    });

    setShowContratModal(false);
    setNewContrat({
      numero_contrat: `CTR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      titre: '',
      type: 'FOURNISSEUR',
      partie_prenante_nom: '',
      chantier_id: selectedChantierId === 'ALL' ? (chantiers[0]?.id || '') : selectedChantierId,
      date_signature: new Date().toISOString().split('T')[0],
      date_effet: new Date().toISOString().split('T')[0],
      date_echeance: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      montant_dzd: '',
      reconduction_automatique: false,
      delai_preavis_jours: 30,
      notes: ''
    });
  };

  const handleFoncierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFoncier.titre || !newFoncier.reference_officielle) {
      alert("Titre et référence officielle requis.");
      return;
    }
    const targetChantier = chantiers.find(c => c.id === newFoncier.chantier_id);
    ajouterDocumentFoncier({
      type: newFoncier.type,
      titre: newFoncier.titre,
      reference_officielle: newFoncier.reference_officielle,
      wilaya: newFoncier.wilaya,
      commune: newFoncier.commune,
      chantier_id: newFoncier.chantier_id,
      chantier_nom: targetChantier?.nom_projet || 'Projet Foncier',
      notaire_nom: newFoncier.notaire_nom,
      date_delivrance: newFoncier.date_delivrance,
      date_validite: newFoncier.date_validite || undefined,
      statut: 'VALIDE',
      notes: newFoncier.notes
    });

    setShowFoncierModal(false);
    setNewFoncier({
      type: 'ACTE_PROPRIETE_FONCIER',
      titre: '',
      reference_officielle: '',
      wilaya: 'Alger (16)',
      commune: 'Dely Ibrahim',
      chantier_id: selectedChantierId === 'ALL' ? (chantiers[0]?.id || '') : selectedChantierId,
      notaire_nom: '',
      date_delivrance: new Date().toISOString().split('T')[0],
      date_validite: '',
      notes: ''
    });
  };

  const handleLitigeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLitige.titre_affaire || !newLitige.partie_adverse) {
      alert("Titre de l'affaire et partie adverse requis.");
      return;
    }
    ajouterDossierLitige({
      numero_dossier: newLitige.numero_dossier,
      titre_affaire: newLitige.titre_affaire,
      juridiction: newLitige.juridiction,
      partie_adverse: newLitige.partie_adverse,
      qualite: newLitige.qualite,
      enjeu_financier_dzd: parseFloat(newLitige.enjeu_financier_dzd) || 0,
      avocat_conseil_nom: newLitige.avocat_conseil_nom,
      statut: 'EN_INSTRUCTION',
      date_ouverture: new Date().toISOString().split('T')[0],
      prochaine_audience_date: newLitige.prochaine_audience_date || undefined,
      resume_faits: newLitige.resume_faits
    });

    setShowLitigeModal(false);
    setNewLitige({
      numero_dossier: `LIT-2026-${Math.floor(100 + Math.random() * 900)}`,
      titre_affaire: '',
      juridiction: 'TRIBUNAL_CIVIL',
      partie_adverse: '',
      qualite: 'DEFENDEUR',
      enjeu_financier_dzd: '',
      avocat_conseil_nom: 'Maitre Sofiane CHERIF (Avocat à la Cour)',
      prochaine_audience_date: '',
      resume_faits: ''
    });
  };

  const handleUploadPjSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showUploadPjModal || !pjTitle || !pjFileName) return;
    ajouterPieceJointeJuridique(
      showUploadPjModal.type,
      showUploadPjModal.id,
      pjTitle,
      pjFileName.endsWith('.pdf') ? pjFileName : `${pjFileName}.pdf`,
      Math.floor(1200 + Math.random() * 2500)
    );
    setShowUploadPjModal(null);
    setPjTitle('');
    setPjFileName('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-sky-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sky-300 text-xs font-bold uppercase tracking-widest mb-1">
              <Scale className="w-4 h-4 text-sky-400" />
              <span>Direction Juridique & Contentieux</span>
              <span className="bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded text-[10px] font-mono border border-sky-500/30">
                Accès Réserver Juriste
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Gestion Contractuelle & Foncière</h1>
            <p className="text-sky-200/70 text-sm mt-1 max-w-2xl font-medium">
              Suivi des contrats fournisseurs, actes fonciers, permis de construire et gestion des affaires contentieuses.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (activeTab === 'contrats') setShowContratModal(true);
                else if (activeTab === 'foncier') setShowFoncierModal(true);
                else setShowLitigeModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 rounded-xl text-xs font-bold transition-all shadow-lg shadow-sky-600/20 text-white"
            >
              <Plus className="w-4 h-4" />
              <span>
                {activeTab === 'contrats' ? 'Nouveau Contrat' : (activeTab === 'foncier' ? 'Nouveau Document Foncier' : 'Nouveau Dossier Litige')}
              </span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 mt-8 bg-black/30 p-1 rounded-xl w-fit border border-white/10 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('contrats')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'contrats' ? 'bg-sky-600 text-white shadow-lg' : 'text-sky-200 hover:bg-white/10'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Contrats & Conventions ({contratsJuridiques.length})</span>
            {expiringContratsCount > 0 && (
              <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full">
                {expiringContratsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('foncier')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'foncier' ? 'bg-sky-600 text-white shadow-lg' : 'text-sky-200 hover:bg-white/10'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Documents Fonciers & Permis ({documentsFonciers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('litiges')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'litiges' ? 'bg-sky-600 text-white shadow-lg' : 'text-sky-200 hover:bg-white/10'
            }`}
          >
            <Gavel className="w-4 h-4" />
            <span>Litiges & Contentieux ({dossiersLitiges.length})</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contrats Actifs en Vigueur</p>
            <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{contratsJuridiques.filter(c => c.statut === 'EN_VIGUEUR').length}</p>
            <p className="text-[11px] text-amber-600 font-bold mt-1">{expiringContratsCount} renouvellement(s) à surveiller &lt;60j</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Documents Fonciers Valides</p>
            <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{documentsFonciers.filter(d => d.statut === 'VALIDE').length}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Actes, Livres fonciers, PC APC R+9</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <Building className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Affaires Contentieuses en Cours</p>
            <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{dossiersLitiges.length}</p>
            <p className="text-[11px] text-indigo-600 font-bold mt-1">Enjeu : {totalEnjeuxLitiges.toLocaleString()} DZD</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <Gavel className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* TAB 1: CONTRATS */}
      {activeTab === 'contrats' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50"
              >
                <option value="ALL">Tous les types de contrats</option>
                <option value="FOURNISSEUR">Contrats Fournisseurs</option>
                <option value="SOUS_TRAITANCE">Sous-Traitance BTPH</option>
                <option value="CLIENT_VEFA">Acquéreurs VEFA</option>
                <option value="BAIL_LOCATION">Baux de location</option>
              </select>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher contrat, titulaire, réf..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50 w-full md:w-64"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                    <th className="p-3">N° Contrat</th>
                    <th className="p-3">Titre / Objet</th>
                    <th className="p-3">Partie Prenante</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Chantier / Périmètre</th>
                    <th className="p-3">Échéance</th>
                    <th className="p-3 text-right">Montant (DZD)</th>
                    <th className="p-3 text-center">Statut</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {filteredContrats.map(ctr => (
                    <tr key={ctr.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-900">{ctr.numero_contrat}</td>
                      <td className="p-3 font-bold text-slate-900">{ctr.titre}</td>
                      <td className="p-3 text-slate-600 font-semibold">{ctr.partie_prenante_nom}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {ctr.type}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">{ctr.chantier_nom || 'Siège Central'}</td>
                      <td className="p-3 font-mono text-slate-800">{ctr.date_echeance}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">{ctr.montant_dzd.toLocaleString()} DZD</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          ctr.statut === 'EN_VIGUEUR' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          ctr.statut === 'EN_RENOUVELLEMENT' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {ctr.statut}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedContratDetail(ctr)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                            title="Consulter détail et historique"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setShowUploadPjModal({ type: 'CONTRAT', id: ctr.id, num: ctr.numero_contrat })}
                            className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700"
                            title="Ajouter une pièce jointe / avenant"
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FONCIER & PERMIS */}
      {activeTab === 'foncier' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {filteredFonciers.map(fonc => (
            <div key={fonc.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 hover:border-sky-300 transition-all">
              <div className="flex items-start justify-between">
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-black uppercase">
                  {fonc.type.replace(/_/g, ' ')}
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">{fonc.reference_officielle}</span>
              </div>

              <div>
                <h3 className="font-extrabold text-slate-900 text-base">{fonc.titre}</h3>
                <p className="text-xs text-slate-500 mt-1">Commune: {fonc.commune} ({fonc.wilaya})</p>
                {fonc.notaire_nom && <p className="text-[11px] text-slate-600 italic mt-0.5">Notaire: {fonc.notaire_nom}</p>}
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1 text-xs font-mono">
                <div className="flex justify-between text-slate-600">
                  <span>Délivrance:</span>
                  <span className="font-bold text-slate-900">{fonc.date_delivrance}</span>
                </div>
                {fonc.date_validite && (
                  <div className="flex justify-between text-slate-600">
                    <span>Validité:</span>
                    <span className="font-bold text-slate-900">{fonc.date_validite}</span>
                  </div>
                )}
              </div>

              {fonc.pieces_jointes.length > 0 && (
                <div className="space-y-1 border-t border-slate-100 pt-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pièces jointes ({fonc.pieces_jointes.length})</p>
                  {fonc.pieces_jointes.map(pj => (
                    <div key={pj.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-100 text-xs font-mono">
                      <span className="truncate max-w-[200px]">{pj.titre}</span>
                      <Download className="w-3.5 h-3.5 text-slate-500 hover:text-slate-900 cursor-pointer" />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowUploadPjModal({ type: 'FONCIER', id: fonc.id, num: fonc.reference_officielle })}
                  className="text-xs text-sky-600 font-bold hover:underline flex items-center gap-1"
                >
                  <Paperclip className="w-3.5 h-3.5" /> Joindre Document Numérisé
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: LITIGES & CONTENTIEUX */}
      {activeTab === 'litiges' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {filteredLitiges.map(lit => (
            <div key={lit.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Gavel className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400">{lit.numero_dossier}</span>
                    <h3 className="font-extrabold text-slate-900 text-base">{lit.titre_affaire}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-lg text-xs font-black">
                    {lit.juridiction.replace(/_/g, ' ')}
                  </span>
                  <span className="px-3 py-1 bg-rose-100 text-rose-900 border border-rose-200 rounded-lg text-xs font-black">
                    Enjeu: {lit.enjeu_financier_dzd.toLocaleString()} DZD
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Partie Adverse</p>
                  <p className="font-extrabold text-slate-900">{lit.partie_adverse}</p>
                  <p className="text-[10px] text-slate-500">Qualité: {lit.qualite}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Avocat Conseil</p>
                  <p className="font-extrabold text-slate-900">{lit.avocat_conseil_nom}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Prochaine Audience</p>
                  <p className="font-extrabold text-indigo-600 font-mono">{lit.prochaine_audience_date || 'Non programmée'}</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 bg-amber-50/50 p-3 rounded-xl border border-amber-100">{lit.resume_faits}</p>

              {lit.historique_audiences.length > 0 && (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Historique des Audiences</p>
                  <div className="space-y-1 text-xs">
                    {lit.historique_audiences.map(aud => (
                      <div key={aud.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="font-mono font-bold text-slate-800">{aud.date}</span>
                        <span className="font-medium text-slate-700">{aud.objet}</span>
                        <span className="text-slate-500 italic">{aud.resultat || 'En attente'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODAL: NOUVEAU CONTRAT */}
      {showContratModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Saisie d'un Nouveau Contrat / Convention</h3>
              <button onClick={() => setShowContratModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <form onSubmit={handleContratSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">N° Contrat</label>
                  <input
                    type="text"
                    value={newContrat.numero_contrat}
                    onChange={e => setNewContrat({ ...newContrat, numero_contrat: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Type de Contrat</label>
                  <select
                    value={newContrat.type}
                    onChange={e => setNewContrat({ ...newContrat, type: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
                  >
                    <option value="FOURNISSEUR">Fournisseur</option>
                    <option value="SOUS_TRAITANCE">Sous-traitance BTPH</option>
                    <option value="CLIENT_VEFA">Acquéreur VEFA</option>
                    <option value="BAIL_LOCATION">Bail de location</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Titre / Objet du Contrat</label>
                <input
                  type="text"
                  placeholder="ex: Contrat de fourniture de béton frais..."
                  value={newContrat.titre}
                  onChange={e => setNewContrat({ ...newContrat, titre: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Partie Prenante (Cocontractant)</label>
                <input
                  type="text"
                  placeholder="Nom de la société, fournisseur ou client..."
                  value={newContrat.partie_prenante_nom}
                  onChange={e => setNewContrat({ ...newContrat, partie_prenante_nom: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date d'effet</label>
                  <input
                    type="date"
                    value={newContrat.date_effet}
                    onChange={e => setNewContrat({ ...newContrat, date_effet: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date d'échéance</label>
                  <input
                    type="date"
                    value={newContrat.date_echeance}
                    onChange={e => setNewContrat({ ...newContrat, date_echeance: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Montant Global (DZD)</label>
                <input
                  type="number"
                  placeholder="ex: 15000000"
                  value={newContrat.montant_dzd}
                  onChange={e => setNewContrat({ ...newContrat, montant_dzd: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowContratModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold">Annuler</button>
                <button type="submit" className="px-5 py-2 bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-700">Enregistrer le Contrat</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETAIL CONTRAT */}
      {selectedContratDetail && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono text-slate-400">{selectedContratDetail.numero_contrat}</span>
                <h3 className="font-extrabold text-slate-900 text-base">{selectedContratDetail.titre}</h3>
              </div>
              <button onClick={() => setSelectedContratDetail(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                <p><strong>Partie Prenante:</strong> {selectedContratDetail.partie_prenante_nom}</p>
                <p><strong>Montant:</strong> {selectedContratDetail.montant_dzd.toLocaleString()} DZD</p>
                <p><strong>Période:</strong> Du {selectedContratDetail.date_effet} au {selectedContratDetail.date_echeance}</p>
                {selectedContratDetail.notes && <p className="italic text-slate-600 mt-1">{selectedContratDetail.notes}</p>}
              </div>

              <div>
                <p className="font-bold text-slate-700 mb-1">Historique des Modifications</p>
                {selectedContratDetail.historique_modifications.map(h => (
                  <div key={h.id} className="p-2 bg-slate-100 rounded-lg text-[11px] mb-1">
                    <span className="font-mono font-bold mr-2">{h.date}</span>
                    <span className="font-bold">{h.action}</span> par {h.auteur}
                    {h.details && <p className="text-slate-500 mt-0.5">{h.details}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={() => setSelectedContratDetail(null)} className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL UPLOAD PJ */}
      {showUploadPjModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">Ajouter une pièce jointe ({showUploadPjModal.num})</h3>
              <button onClick={() => setShowUploadPjModal(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <form onSubmit={handleUploadPjSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Titre de la pièce</label>
                <input
                  type="text"
                  placeholder="ex: Avenant N°1 tarifaire, Acte notarié numérisé..."
                  value={pjTitle}
                  onChange={e => setPjTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nom du fichier PDF</label>
                <input
                  type="text"
                  placeholder="ex: Avenant_01_Tarifs.pdf"
                  value={pjFileName}
                  onChange={e => setPjFileName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowUploadPjModal(null)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold">Annuler</button>
                <button type="submit" className="px-5 py-2 bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-700">Joindre le Fichier</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
