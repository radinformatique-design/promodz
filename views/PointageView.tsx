'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Clock, 
  Calendar, 
  Users, 
  Building, 
  HardHat, 
  Check, 
  X, 
  AlertTriangle, 
  ShieldCheck, 
  Printer, 
  Search, 
  Filter, 
  Lock, 
  Unlock, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Download, 
  Briefcase,
  FileSpreadsheet,
  Clock3,
  Send
} from 'lucide-react';
import { 
  PointageLigne, 
  PointageStatut, 
  Employe, 
  CategorieProfessionnelle,
  Chantier
} from '../types/database';

const CATEGORIE_LABELS: Record<CategorieProfessionnelle, string> = {
  CHEF_EQUIPE: 'Chef d’équipe gros-œuvre',
  MACON: 'Maçon qualifié',
  FERRAILLEUR: 'Ferrailleur',
  COFFREUR: 'Coffreur bancheur',
  CONDUCTEUR_ENGIN: 'Conducteur d’engins (Grue/Pelle)',
  MANOEUVRE: 'Manœuvre ordinaire',
  ELECTRICIEN: 'Électricien bâtiment',
  PLOMBIER: 'Plombier sanitaire',
  TOPOGRAPHE: 'Topographe BTP',
  SOUDEUR: 'Soudeur qualifié',
  PEINTRE: 'Peintre en bâtiment',
  ETANCHEUR: 'Étancheur',
  CADRE_ADMINISTRATIF: 'Cadre Administratif & Direction',
  INGENIEUR: 'Ingénieur d’Études / Génie Civil',
  COMPTABLE: 'Comptable / Gestionnaire Paie',
  JURISTE: 'Juriste d’Entreprise',
  ASSISTANT: 'Assistant(e) de Direction & RH',
  COMMERCIAL: 'Conseiller Commercial VEFA'
};

const STATUT_CONFIG: Record<PointageStatut, { label: string; badgeClass: string; rowBg: string }> = {
  PRESENT: {
    label: 'Présent',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    rowBg: 'hover:bg-emerald-50/40'
  },
  RETARD: {
    label: 'Retard',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    rowBg: 'hover:bg-amber-50/40'
  },
  ABSENT_JUSTIFIE: {
    label: 'Absence Justifiée',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    rowBg: 'hover:bg-blue-50/40'
  },
  ABSENT_INJUSTIFIE: {
    label: 'Absence Injustifiée',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    rowBg: 'hover:bg-rose-50/40'
  },
  CONGE: {
    label: 'Congé / Récup',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
    rowBg: 'hover:bg-purple-50/40'
  }
};

export const PointageView: React.FC = () => {
  const { 
    currentUser, 
    allChantiers, 
    employes, 
    pointages, 
    enregistrerPointage,
    demandesDerogation,
    soumettreDemandeDerogationPointage,
    traiterDemandeDerogation,
    parametresGeneraux,
    simulatedPointageTime,
    setSimulatedPointageTime
  } = useApp();

  // Détection des privilèges de rôle
  const isConducteur = currentUser?.role_id === 'role-ct';
  const isRH = currentUser?.role_id === 'role-rh' || currentUser?.role_id === 'role-admin';

  // Le conducteur de travaux est STRICTEMENT limité à son chantier assigné
  const conducteurChantierId = currentUser?.chantiers_assignes?.[0] || 'cht-001';

  // Navigation interne pour le RH Central : 'siege' (Pointage Siège) ou 'chantiers' (Consultation Chantiers)
  const [rhActiveTab, setRhActiveTab] = useState<'siege' | 'chantiers'>('siege');

  // Sélections de travail
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedConsultationChantierId, setSelectedConsultationChantierId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('ALL');

  // Lignes de pointage en cours d'édition locale
  const [editingLines, setEditingLines] = useState<Record<string, PointageLigne>>({});
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modale de demande de dérogation
  const [isDerogationModalOpen, setIsDerogationModalOpen] = useState(false);
  const [derogationMotif, setDerogationMotif] = useState('');

  // Déterminer la cible du pointage selon le rôle
  const activePointageTarget = useMemo(() => {
    if (isConducteur) {
      return { id: conducteurChantierId, isSiege: false };
    }
    // Si c'est le RH et qu'il est sur l'onglet 'siege', cible = 'siege'
    if (isRH && rhActiveTab === 'siege') {
      return { id: 'siege', isSiege: true };
    }
    // Si c'est le RH sur la consultation de chantier
    return { id: selectedConsultationChantierId, isSiege: selectedConsultationChantierId === 'siege' };
  }, [isConducteur, isRH, rhActiveTab, conducteurChantierId, selectedConsultationChantierId]);

  // Chantier actuel objet
  const targetChantierObj = useMemo(() => {
    if (activePointageTarget.isSiege) return null;
    return allChantiers.find(c => c.id === activePointageTarget.id);
  }, [allChantiers, activePointageTarget]);

  // Liste des employés concernés par le pointage actif
  const targetEmployes = useMemo(() => {
    if (isConducteur) {
      return employes.filter(e => e.chantier_actuel_id === conducteurChantierId && e.statut === 'ACTIF');
    }
    if (isRH && rhActiveTab === 'siege') {
      return employes.filter(e => e.chantier_actuel_id === 'siege' && e.statut === 'ACTIF');
    }
    if (selectedConsultationChantierId === 'ALL') {
      return employes.filter(e => e.chantier_actuel_id !== 'siege' && e.statut === 'ACTIF');
    }
    return employes.filter(e => e.chantier_actuel_id === selectedConsultationChantierId && e.statut === 'ACTIF');
  }, [employes, isConducteur, isRH, rhActiveTab, conducteurChantierId, selectedConsultationChantierId]);

  // Initialisation des lignes de pointage pour la date et la cible sélectionnées
  useEffect(() => {
    const existingForDate = pointages.filter(p => 
      p.date === selectedDate && (activePointageTarget.id === 'ALL' ? true : p.chantier_id === activePointageTarget.id)
    );

    const initialMap: Record<string, PointageLigne> = {};

    targetEmployes.forEach(emp => {
      const found = existingForDate.find(p => p.employe_id === emp.id);
      if (found) {
        initialMap[emp.id] = { ...found };
      } else {
        // Ligne vierge par défaut : PRESENT
        initialMap[emp.id] = {
          id: `ptg-${emp.id}-${selectedDate}`,
          chantier_id: emp.chantier_actuel_id,
          employe_id: emp.id,
          employe_nom: `${emp.prenom} ${emp.nom}`,
          employe_matricule: emp.matricule,
          employe_categorie: emp.categorie,
          date: selectedDate,
          statut: 'PRESENT',
          heure_arrivee: '07:55',
          heure_depart: '16:30',
          heures_travaillees: 8,
          minutes_retard: 0,
          observations: '',
          saisi_par_id: currentUser?.id || 'sys',
          saisi_par_nom: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Opérateur',
          verrouille: false,
          updated_at: new Date().toISOString()
        };
      }
    });

    setEditingLines(initialMap);
  }, [selectedDate, activePointageTarget.id, targetEmployes, pointages, currentUser]);

  // Filtrage pour affichage dans la table
  const displayedEmployes = useMemo(() => {
    return targetEmployes.filter(emp => {
      const line = editingLines[emp.id];
      if (filterStatut !== 'ALL' && line?.statut !== filterStatut) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const fullName = `${emp.prenom} ${emp.nom}`.toLowerCase();
        const mat = emp.matricule.toLowerCase();
        const cat = (CATEGORIE_LABELS[emp.categorie] || '').toLowerCase();
        if (!fullName.includes(term) && !mat.includes(term) && !cat.includes(term)) return false;
      }
      return true;
    });
  }, [targetEmployes, editingLines, filterStatut, searchTerm]);

  // Vérification heure limite de verrouillage
  const heureLimite = parametresGeneraux.heure_limite_pointage || '08:15';
  const isLockedForConducteur = useMemo(() => {
    if (!isConducteur) return false;
    return simulatedPointageTime > heureLimite;
  }, [isConducteur, simulatedPointageTime, heureLimite]);

  // Modification unitaire d'un employé
  const updateEmployeLine = (empId: string, updates: Partial<PointageLigne>) => {
    setEditingLines(prev => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        ...updates,
        updated_at: new Date().toISOString()
      }
    }));
  };

  // Action rapide : Tout le monde Présent (8h)
  const handleMarkAllPresent = () => {
    setEditingLines(prev => {
      const next = { ...prev };
      targetEmployes.forEach(emp => {
        next[emp.id] = {
          ...next[emp.id],
          statut: 'PRESENT',
          heure_arrivee: '07:55',
          heures_travaillees: 8,
          minutes_retard: 0,
          observations: ''
        };
      });
      return next;
    });
    setFeedbackMessage({ type: 'success', text: 'Tous les collaborateurs ont été cochés Présents (8h).' });
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  // Enregistrement des pointages
  const handleSavePointage = () => {
    const lignesArray = Object.values(editingLines);
    if (lignesArray.length === 0) return;

    const res = enregistrerPointage(activePointageTarget.id, selectedDate, lignesArray);
    if (res.success) {
      setFeedbackMessage({ type: 'success', text: `Pointage enregistré avec succès pour ${lignesArray.length} collaborateurs.` });
    } else {
      setFeedbackMessage({ type: 'error', text: res.message });
      if (res.locked) {
        setIsDerogationModalOpen(true);
      }
    }
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // Soumission de demande de dérogation au RH Central
  const handleSubmitDerogation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!derogationMotif) {
      alert('Veuillez indiquer le motif de la dérogation.');
      return;
    }

    const firstEmp = targetEmployes[0];
    soumettreDemandeDerogationPointage({
      chantier_id: conducteurChantierId,
      chantier_nom: targetChantierObj?.nom_projet || 'Chantier',
      date_pointage: selectedDate,
      employe_id: firstEmp?.id || 'all',
      employe_nom: `Pointage Chantier Global (${targetEmployes.length} ouvriers)`,
      employe_matricule: 'CHANTIER-GLOBAL',
      demandeur_id: currentUser?.id || 'user-ct',
      demandeur_nom: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Conducteur de Travaux',
      demandeur_role: currentUser?.poste || 'Conducteur de Travaux',
      statut_actuel: 'ABSENT_INJUSTIFIE',
      statut_demande: 'PRESENT',
      motif_demande: derogationMotif
    });

    setIsDerogationModalOpen(false);
    setDerogationMotif('');
    setFeedbackMessage({ type: 'success', text: 'Demande de dérogation transmise avec succès au Responsable RH Central.' });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // Statistiques du jour affiché
  const dayStats = useMemo(() => {
    const lines = Object.values(editingLines);
    const total = lines.length;
    const presents = lines.filter(l => l.statut === 'PRESENT').length;
    const retards = lines.filter(l => l.statut === 'RETARD').length;
    const absentsJ = lines.filter(l => l.statut === 'ABSENT_JUSTIFIE').length;
    const absentsInjust = lines.filter(l => l.statut === 'ABSENT_INJUSTIFIE').length;
    const conges = lines.filter(l => l.statut === 'CONGE').length;
    const totalHeures = lines.reduce((acc, l) => acc + (l.heures_travaillees || 0), 0);
    const tauxPresence = total > 0 ? Math.round(((presents + retards) / total) * 100) : 0;

    return { total, presents, retards, absentsJ, absentsInjust, conges, totalHeures, tauxPresence };
  }, [editingLines]);

  // Demandes de dérogation en attente pour le RH
  const pendingDerogations = useMemo(() => {
    return demandesDerogation.filter(d => d.statut_demande_approbation === 'EN_ATTENTE');
  }, [demandesDerogation]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-2xl border border-indigo-500/30 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1.5">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Gestion des Présences & Temps de Travail — BatiProm Algérie</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Pointage Quotidien du Personnel
            </h1>
            <p className="text-slate-300 text-sm mt-1.5 max-w-2xl font-medium">
              {isConducteur && (
                <>Pointage obligatoire des ouvriers et équipes de votre chantier. Clôture stricte à <strong>{heureLimite}</strong>.</>
              )}
              {isRH && (
                <>Gestion unifiée : saisie du pointage de l'administration du siège et supervision / consolidation de l'ensemble des chantiers.</>
              )}
            </p>
          </div>

          {/* Horloge simulée & Indicateur */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                <Clock3 className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Horloge de Pointage</div>
                <div className="text-xl font-mono font-black text-white">{simulatedPointageTime}</div>
              </div>
            </div>

            {isConducteur && (
              <div className={`rounded-2xl p-3 border flex items-center gap-2.5 ${
                isLockedForConducteur 
                  ? 'bg-rose-950/60 border-rose-500/40 text-rose-300' 
                  : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              }`}>
                {isLockedForConducteur ? <Lock className="w-5 h-5 text-rose-400" /> : <Unlock className="w-5 h-5 text-emerald-400" />}
                <div className="text-xs">
                  <div className="font-bold">{isLockedForConducteur ? 'Pointage Verrouillé' : 'Pointage Ouvert'}</div>
                  <div className="text-[10px] opacity-80">Limite : {heureLimite}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation pour le RH Central : Onglets Siège vs Chantiers */}
        {isRH && (
          <div className="flex items-center gap-2 mt-8 bg-slate-950/70 p-1.5 rounded-2xl w-full sm:w-fit border border-white/10 overflow-x-auto">
            <button
              onClick={() => setRhActiveTab('siege')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                rhActiveTab === 'siege' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40' : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <Briefcase className="w-4 h-4" /> Pointage Administration & Siège
            </button>
            <button
              onClick={() => setRhActiveTab('chantiers')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                rhActiveTab === 'chantiers' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40' : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <HardHat className="w-4 h-4" /> Consultation & Dérogations Chantiers
              {pendingDerogations.length > 0 && (
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                  {pendingDerogations.length}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Message Feedback */}
      {feedbackMessage && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs animate-in fade-in duration-200 ${
          feedbackMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span className="font-semibold">{feedbackMessage.text}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Section Dérogations en attente (Visible uniquement par le RH Central) */}
      {isRH && rhActiveTab === 'chantiers' && pendingDerogations.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-amber-900 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Demandes de Dérogation de Pointage en Attente ({pendingDerogations.length})
            </h3>
            <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full">
              Action RH Requise
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingDerogations.map(derog => (
              <div key={derog.id} className="p-4 rounded-2xl bg-white border border-amber-200/80 shadow-xs space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{derog.chantier_nom}</span>
                  <span className="text-[10px] font-mono text-slate-500">{derog.date_pointage}</span>
                </div>
                <p className="text-slate-700 italic">"{derog.motif_demande}"</p>
                <div className="text-[10px] text-slate-500">
                  Demandé par : <strong className="text-slate-700">{derog.demandeur_nom}</strong>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => traiterDemandeDerogation(derog.id, 'REFUSER', 'Refusé par RH Central')}
                    className="px-3 py-1.5 border border-rose-200 text-rose-600 rounded-xl font-bold hover:bg-rose-50 transition-all text-[11px]"
                  >
                    Refuser
                  </button>
                  <button
                    onClick={() => traiterDemandeDerogation(derog.id, 'VALIDER')}
                    className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-sm text-[11px] flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Approuver & Déverrouiller
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards du Jour */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Effectif</span>
          <span className="text-xl font-black text-slate-900">{dayStats.total}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] text-emerald-600 uppercase font-bold block">Présents</span>
          <span className="text-xl font-black text-emerald-600">{dayStats.presents}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] text-amber-600 uppercase font-bold block">Retards</span>
          <span className="text-xl font-black text-amber-600">{dayStats.retards}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] text-rose-600 uppercase font-bold block">Injustifiés</span>
          <span className="text-xl font-black text-rose-600">{dayStats.absentsInjust}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] text-purple-600 uppercase font-bold block">Congés / Just.</span>
          <span className="text-xl font-black text-purple-600">{dayStats.conges + dayStats.absentsJ}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] text-indigo-600 uppercase font-bold block">Taux Présence</span>
          <span className="text-xl font-black text-indigo-600">{dayStats.tauxPresence}%</span>
        </div>
      </div>

      {/* Barre de contrôle du Pointage (Date, Actions Rapides, Enregistrement) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Sélecteur de Date */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 font-mono font-bold text-slate-800 bg-slate-50 focus:bg-white"
            />
          </div>

          {/* Pour le RH en mode consultation : Sélecteur de Chantier */}
          {isRH && rhActiveTab === 'chantiers' && (
            <div className="flex items-center gap-2">
              <HardHat className="w-4 h-4 text-amber-600 shrink-0" />
              <select
                value={selectedConsultationChantierId}
                onChange={(e) => setSelectedConsultationChantierId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 font-semibold text-slate-800 bg-white"
              >
                <option value="ALL">Tous les chantiers (Consolidé)</option>
                {allChantiers.map(c => (
                  <option key={c.id} value={c.id}>{c.nom_projet}</option>
                ))}
              </select>
            </div>
          )}

          {/* Recherche */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nom, matricule, fonction..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white w-44 sm:w-56"
            />
          </div>

          {/* Filtre Statut */}
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 font-medium text-slate-700 bg-white"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="PRESENT">Présents</option>
            <option value="RETARD">Retards</option>
            <option value="ABSENT_INJUSTIFIE">Injustifiés</option>
            <option value="ABSENT_JUSTIFIE">Justifiés</option>
            <option value="CONGE">Congés</option>
          </select>
        </div>

        {/* Boutons d'Action */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {/* Action rapide : Tout Présent (réservé à celui qui a le droit de pointer) */}
          {(isConducteur || (isRH && rhActiveTab === 'siege')) && (
            <button
              onClick={handleMarkAllPresent}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 text-emerald-600" /> Tous Présents (8h)
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all"
            title="Imprimer la feuille de pointage"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Bouton d'Enregistrement */}
          {(isConducteur || (isRH && rhActiveTab === 'siege')) && (
            <button
              onClick={handleSavePointage}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
            >
              <Check className="w-4 h-4" /> Enregistrer le Pointage
            </button>
          )}
        </div>
      </div>

      {/* Table des Pointages */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs font-bold text-slate-700">
          <span>
            Liste des collaborateurs ({displayedEmployes.length})
            {isConducteur && ` • ${targetChantierObj?.nom_projet || 'Mon Chantier'}`}
            {isRH && rhActiveTab === 'siege' && ` • Personnel du Siège Administratif`}
          </span>
          <span className="text-[11px] font-normal text-slate-500">
            Date : <strong className="text-slate-800">{selectedDate}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Collaborateur</th>
                <th className="py-3 px-4">Affectation</th>
                <th className="py-3 px-4 text-center">Statut Présence</th>
                <th className="py-3 px-4 text-center">Heure Arrivée</th>
                <th className="py-3 px-4 text-center">Retard (Min)</th>
                <th className="py-3 px-4 text-center">Heures</th>
                <th className="py-3 px-4">Observations / Motifs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedEmployes.map(emp => {
                const line = editingLines[emp.id] || {
                  statut: 'PRESENT',
                  heure_arrivee: '07:55',
                  heures_travaillees: 8,
                  minutes_retard: 0,
                  observations: ''
                };

                const canEdit = isConducteur || (isRH && rhActiveTab === 'siege');

                return (
                  <tr key={emp.id} className={`transition-colors ${STATUT_CONFIG[line.statut].rowBg}`}>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{emp.prenom} {emp.nom}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {emp.matricule} • {CATEGORIE_LABELS[emp.categorie]}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-medium text-[11px]">
                      {emp.chantier_actuel_nom}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {canEdit ? (
                        <select
                          value={line.statut}
                          onChange={(e) => updateEmployeLine(emp.id, { statut: e.target.value as PointageStatut })}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${STATUT_CONFIG[line.statut].badgeClass} focus:ring-2`}
                        >
                          <option value="PRESENT">Présent</option>
                          <option value="RETARD">Retard</option>
                          <option value="ABSENT_INJUSTIFIE">Injustifié</option>
                          <option value="ABSENT_JUSTIFIE">Justifié</option>
                          <option value="CONGE">Congé / Récup</option>
                        </select>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${STATUT_CONFIG[line.statut].badgeClass}`}>
                          {STATUT_CONFIG[line.statut].label}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono">
                      {canEdit ? (
                        <input
                          type="time"
                          value={line.heure_arrivee || '07:55'}
                          onChange={(e) => updateEmployeLine(emp.id, { heure_arrivee: e.target.value })}
                          className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-mono bg-white text-center w-24"
                        />
                      ) : (
                        <span>{line.heure_arrivee || '—'}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono">
                      {canEdit && line.statut === 'RETARD' ? (
                        <input
                          type="number"
                          value={line.minutes_retard || 0}
                          onChange={(e) => updateEmployeLine(emp.id, { minutes_retard: parseInt(e.target.value) || 0 })}
                          className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-mono bg-white text-center w-16 font-bold text-amber-700"
                        />
                      ) : (
                        <span className={line.minutes_retard ? 'text-amber-700 font-bold' : 'text-slate-400'}>
                          {line.minutes_retard ? `${line.minutes_retard} min` : '0'}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono">
                      {canEdit ? (
                        <input
                          type="number"
                          step="0.5"
                          value={line.heures_travaillees ?? 8}
                          onChange={(e) => updateEmployeLine(emp.id, { heures_travaillees: parseFloat(e.target.value) || 0 })}
                          className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-mono bg-white text-center w-16 font-black text-indigo-700"
                        />
                      ) : (
                        <span className="font-bold text-indigo-700">{line.heures_travaillees ?? 8} h</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {canEdit ? (
                        <input
                          type="text"
                          value={line.observations || ''}
                          onChange={(e) => updateEmployeLine(emp.id, { observations: e.target.value })}
                          placeholder="Observation, motif..."
                          className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-xs bg-white text-slate-700"
                        />
                      ) : (
                        <span className="text-slate-600 italic">{line.observations || '—'}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Demande de Dérogation (Conducteur) */}
      {isDerogationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-base">Demande de Dérogation de Pointage</h3>
              </div>
              <button onClick={() => setIsDerogationModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDerogation} className="space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                L'heure limite de pointage (<strong>{heureLimite}</strong>) est dépassée. Pour consigner ou modifier les présences de votre chantier pour la date du <strong>{selectedDate}</strong>, veuillez soumettre une demande motivée au Responsable RH Central.
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Motif de dépassement d'horaire *</label>
                <textarea
                  required
                  rows={3}
                  value={derogationMotif}
                  onChange={(e) => setDerogationMotif(e.target.value)}
                  placeholder="Ex: Coupure de réseau fibre sur le chantier de Chéraga, coulage béton urgent..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDerogationModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" /> Envoyer au RH Central
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
