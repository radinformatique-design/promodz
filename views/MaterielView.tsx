'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Plus, 
  Search, 
  AlertTriangle, 
  Truck, 
  Wrench, 
  ShieldCheck, 
  Calendar, 
  Gauge, 
  Filter, 
  ArrowLeftRight, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  DollarSign, 
  Layers, 
  RefreshCw,
  Fuel,
  LayoutGrid,
  List,
  AlertOctagon,
  UserCheck,
  Building2,
  ChevronRight
} from 'lucide-react';
import { FicheTechniqueMateriel } from '../components/FicheTechniqueMateriel';
import { 
  Vehicule, 
  Entretien, 
  PieceRemplacable, 
  CategorieMateriel, 
  StatutMateriel 
} from '../types/database';
import { materielService, AlerteParc } from '../services/materielService';

export const MaterielView: React.FC = () => {
  const { 
    vehicules, 
    entretiens, 
    piecesRemplacables, 
    chantiers, 
    currentUser,
    ajouterVehicule,
    modifierVehicule,
    affecterVehiculeChantier,
    mettreAJourCompteur,
    enregistrerEntretien,
    declarerPanne,
    renouvelerAssurance,
    permuterPneus,
    remplacerPieceRemplacable
  } = useApp();

  // Navigation principale du module Matériel
  const [activeMainTab, setActiveMainTab] = useState<'INVENTAIRE' | 'ASSURANCES' | 'CONTROLES_TECHNIQUES'>('INVENTAIRE');

  // Navigation & Sélections
  const [selectedVehiculeId, setSelectedVehiculeId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategorie, setSelectedCategorie] = useState<string>('TOUTES');
  const [selectedStatut, setSelectedStatut] = useState<string>('TOUS');
  const [selectedChantierFilter, setSelectedChantierFilter] = useState<string>('TOUS');
  const [viewMode, setViewMode] = useState<'GRILLE' | 'TABLEAU'>('GRILLE');

  // Modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAffectModalOpen, setIsAffectModalOpen] = useState(false);
  const [isCompteurModalOpen, setIsCompteurModalOpen] = useState(false);
  const [isEntretienModalOpen, setIsEntretienModalOpen] = useState(false);
  const [isPanneModalOpen, setIsPanneModalOpen] = useState(false);
  const [isAssuranceModalOpen, setIsAssuranceModalOpen] = useState(false);
  const [isPermutModalOpen, setIsPermutModalOpen] = useState(false);
  const [isRemplacementModalOpen, setIsRemplacementModalOpen] = useState(false);

  // Formulaire Assurance
  const [formAssurance, setFormAssurance] = useState({
    nouvelleCompagnie: 'CAAT',
    nouvellePolice: '',
    dateDebut: new Date().toISOString().split('T')[0],
    dateFin: '',
    coutDzd: 65000,
    quittanceRef: ''
  });

  // Cible d'action courante
  const [targetVehicule, setTargetVehicule] = useState<Vehicule | null>(null);
  const [targetPiece, setTargetPiece] = useState<PieceRemplacable | null>(null);

  // Formulaire d'ajout véhicule
  const [formDataVehicule, setFormDataVehicule] = useState({
    num_interne: '',
    immatriculation: '',
    marque: '',
    modele: '',
    annee: new Date().getFullYear(),
    categorie: 'VEHICULE_LEGER' as CategorieMateriel,
    carburant: 'DIESEL' as const,
    puissance: '',
    tonnage: 0,
    capacite: '',
    compteur_type: 'KILOMETRAGE' as const,
    caracteristiques: '',
    chantier_id: chantiers[0]?.id || '',
    conducteur_nom: '',
    conducteur_telephone: '',
    conducteur_permis: '',
    kilometrage: 0,
    heures_fonctionnement: 0,
    date_prochaine_vidange: '',
    km_prochaine_vidange: 10000,
    heures_prochaine_vidange: 250,
    date_prochain_controle_technique: '',
    assurance_compagnie: 'CAAT',
    assurance_police: '',
    date_fin_assurance: '',
    assurance_cout_dzd: 65000,
    statut: 'ACTIF' as StatutMateriel
  });

  // Formulaire Affectation
  const [formAffectation, setFormAffectation] = useState({
    chantier_id: '',
    conducteur_nom: '',
    motif: 'Affectation opérationnelle',
    bon_transfert_ref: ''
  });

  // Formulaire Compteur
  const [formCompteur, setFormCompteur] = useState({
    nouveauKm: 0,
    nouvellesHeures: 0
  });

  // Formulaire Entretien
  const [formEntretien, setFormEntretien] = useState({
    type: 'VIDANGE' as const,
    nature: 'PREVENTIF' as const,
    gravite: 'FAIBLE' as const,
    description: '',
    date: new Date().toISOString().split('T')[0],
    kilometrage_entretien: 0,
    heures_entretien: 0,
    cout: 0,
    prestataire: 'GARAGE_EXTERNE' as const,
    garage_nom: '',
    piece_rechange_utilisee: '',
    facture_ref: ''
  });

  // Formulaire Panne
  const [formPanne, setFormPanne] = useState({
    description: '',
    gravite: 'IMMOBILISATION' as const,
    garage_nom: '',
    coutEstime: 0
  });

  // Formulaire Permutation Pneus
  const [formPermut, setFormPermut] = useState({
    pneu1Id: '',
    pneu2Id: '',
    km: 0,
    motif: 'Permutation croisée pour équilibrage d’usure',
    operateur: 'Atelier Central'
  });

  // Formulaire Remplacement
  const [formRemplacement, setFormRemplacement] = useState({
    designation: '',
    marque: '',
    dimensions: '',
    numero_serie: '',
    position: '',
    cout_achat_dzd: 0,
    fournisseur: '',
    motif: 'USURE_NORMALE',
    note: ''
  });

  // 1. Filtrage RBAC Cloisonnement par chantier
  const isChantierUser = currentUser?.type === 'CHANTIER';
  const userChantiersAssignes = currentUser?.chantiers_assignes || [];

  const vehiculesAccessibles = useMemo(() => {
    if (isChantierUser) {
      return vehicules.filter(v => userChantiersAssignes.includes(v.chantier_id || ''));
    }
    return vehicules;
  }, [vehicules, isChantierUser, userChantiersAssignes]);

  // 2. Alertes intelligentes du parc
  const alertes = useMemo(() => {
    return materielService.calculerAlertesParc(
      vehiculesAccessibles, 
      piecesRemplacables, 
      entretiens
    );
  }, [vehiculesAccessibles, piecesRemplacables, entretiens]);

  // 3. Filtrage inventaire multi-critères
  const filteredVehicules = useMemo(() => {
    return vehiculesAccessibles.filter(v => {
      // Recherche texte
      const q = searchTerm.toLowerCase();
      const matchSearch = 
        !searchTerm ||
        (v.num_interne?.toLowerCase() || '').includes(q) ||
        (v.immatriculation?.toLowerCase() || '').includes(q) ||
        (v.marque?.toLowerCase() || '').includes(q) ||
        (v.modele?.toLowerCase() || '').includes(q) ||
        (v.conducteur_nom?.toLowerCase() || '').includes(q);

      // Filtre Catégorie
      const matchCat = selectedCategorie === 'TOUTES' || v.categorie === selectedCategorie;

      // Filtre Statut
      const matchStatut = selectedStatut === 'TOUS' || v.statut === selectedStatut;

      // Filtre Chantier
      const matchChantier = selectedChantierFilter === 'TOUS' || v.chantier_id === selectedChantierFilter;

      return matchSearch && matchCat && matchStatut && matchChantier;
    });
  }, [vehiculesAccessibles, searchTerm, selectedCategorie, selectedStatut, selectedChantierFilter]);

  // Statistiques Assurance & Contrôle Technique
  const statsAssurance = useMemo(() => {
    const totalVehicules = vehiculesAccessibles.length;
    const maintenant = new Date();
    const dans30J = new Date();
    dans30J.setDate(maintenant.getDate() + 30);

    let valides = 0;
    let proches = 0;
    let expirees = 0;
    let primeTotale = 0;

    vehiculesAccessibles.forEach(v => {
      primeTotale += v.assurance_cout_dzd || 0;
      if (v.date_fin_assurance) {
        const d = new Date(v.date_fin_assurance);
        if (d < maintenant) {
          expirees++;
        } else if (d <= dans30J) {
          proches++;
        } else {
          valides++;
        }
      }
    });

    return { totalVehicules, valides, proches, expirees, primeTotale };
  }, [vehiculesAccessibles]);

  const statsCT = useMemo(() => {
    const totalVehicules = vehiculesAccessibles.length;
    const maintenant = new Date();
    const dans30J = new Date();
    dans30J.setDate(maintenant.getDate() + 30);

    let valides = 0;
    let proches = 0;
    let expires = 0;

    vehiculesAccessibles.forEach(v => {
      if (v.date_prochain_controle_technique) {
        const d = new Date(v.date_prochain_controle_technique);
        if (d < maintenant) {
          expires++;
        } else if (d <= dans30J) {
          proches++;
        } else {
          valides++;
        }
      }
    });

    return { totalVehicules, valides, proches, expires };
  }, [vehiculesAccessibles]);

  // Statistiques globales
  const stats = useMemo(() => {
    const total = vehiculesAccessibles.length;
    const actifs = vehiculesAccessibles.filter(v => v.statut === 'ACTIF').length;
    const enPanne = vehiculesAccessibles.filter(v => v.statut === 'EN_PANNE' || v.statut === 'EN_REPARATION').length;
    const tauxDispo = total > 0 ? Math.round((actifs / total) * 100) : 0;
    const alertesCritiques = alertes.filter(a => a.urgence === 'CRITIQUE').length;

    return { total, actifs, enPanne, tauxDispo, alertesCritiques };
  }, [vehiculesAccessibles, alertes]);

  const selectedVehicule = useMemo(() => 
    vehicules.find(v => v.id === selectedVehiculeId),
    [vehicules, selectedVehiculeId]
  );

  // Handlers pour actions
  const handleOpenAffectation = (veh: Vehicule) => {
    setTargetVehicule(veh);
    setFormAffectation({
      chantier_id: chantiers[0]?.id || '',
      conducteur_nom: veh.conducteur_nom || '',
      motif: 'Déplacement de matériel pour phase chantier',
      bon_transfert_ref: `BT-TRANS-${Date.now().toString().slice(-4)}`
    });
    setIsAffectModalOpen(true);
  };

  const handleOpenCompteur = (veh: Vehicule) => {
    setTargetVehicule(veh);
    setFormCompteur({
      nouveauKm: veh.kilometrage || 0,
      nouvellesHeures: veh.heures_fonctionnement || 0
    });
    setIsCompteurModalOpen(true);
  };

  const handleOpenEntretien = (veh: Vehicule) => {
    setTargetVehicule(veh);
    setFormEntretien({
      type: 'VIDANGE',
      nature: 'PREVENTIF',
      gravite: 'FAIBLE',
      description: `Vidange et révision périodique pour ${veh.marque} ${veh.modele}`,
      date: new Date().toISOString().split('T')[0],
      kilometrage_entretien: veh.kilometrage || 0,
      heures_entretien: veh.heures_fonctionnement || 0,
      cout: 35000,
      prestataire: 'GARAGE_EXTERNE',
      garage_nom: 'Station Service Naftal',
      piece_rechange_utilisee: 'Huile moteur 15W40 + Cartouches filtrantes',
      facture_ref: `FAC-NAF-${Date.now().toString().slice(-4)}`
    });
    setIsEntretienModalOpen(true);
  };

  const handleOpenAssurance = (veh: Vehicule) => {
    setTargetVehicule(veh);
    const dateNow = new Date();
    const dateFinAuto = new Date();
    dateFinAuto.setFullYear(dateNow.getFullYear() + 1);

    setFormAssurance({
      nouvelleCompagnie: veh.assurance_compagnie || 'CAAT Assurances',
      nouvellePolice: veh.assurance_police || `POL-BTP-${veh.num_interne}-${dateNow.getFullYear()}`,
      dateDebut: dateNow.toISOString().split('T')[0],
      dateFin: dateFinAuto.toISOString().split('T')[0],
      coutDzd: veh.assurance_cout_dzd || 65000,
      quittanceRef: `QUIT-ASS-${Date.now().toString().slice(-4)}`
    });
    setIsAssuranceModalOpen(true);
  };

  const handleOpenPanne = (veh: Vehicule) => {
    setTargetVehicule(veh);
    setFormPanne({
      description: '',
      gravite: 'IMMOBILISATION',
      garage_nom: 'Atelier Mobile BatiProm',
      coutEstime: 50000
    });
    setIsPanneModalOpen(true);
  };

  const handleOpenPermut = (veh: Vehicule) => {
    setTargetVehicule(veh);
    const pneus = piecesRemplacables.filter(p => p.vehicule_id === veh.id && p.type === 'PNEU');
    setFormPermut({
      pneu1Id: pneus[0]?.id || '',
      pneu2Id: pneus[1]?.id || '',
      km: veh.kilometrage || 0,
      motif: 'Permutation pour uniformisation de l’usure',
      operateur: 'Atelier Central BatiProm'
    });
    setIsPermutModalOpen(true);
  };

  const handleOpenRemplacement = (veh: Vehicule, piece: PieceRemplacable) => {
    setTargetVehicule(veh);
    setTargetPiece(piece);
    setFormRemplacement({
      designation: piece.designation,
      marque: piece.marque || '',
      dimensions: piece.dimensions || '',
      numero_serie: `NEW-${piece.numero_serie}`,
      position: piece.position,
      cout_achat_dzd: piece.cout_achat_dzd || 35000,
      fournisseur: piece.fournisseur || 'Comptoir Pneumatique Algérie',
      motif: 'USURE_NORMALE',
      note: 'Remplacement suite à contrôle d’usure périodique'
    });
    setIsRemplacementModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 1. En-tête Principal */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-2xl border border-indigo-900/50 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-mono font-extrabold uppercase">
                Gouvernance Logistique & Matériel
              </span>
              {isChantierUser && (
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" /> Cloisonnement Chantier Actif
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
              Gestion du Matériel & Parc Automobile
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Supervision unitaire des véhicules, engins de terrassement et grues : affectation multi-chantiers, alertes d'entretien (date, km, heures), gestion des contrôles techniques, assurances et suivi individuel des pneus et composants.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" /> Nouveau Véhicule / Engin
            </button>
          </div>
        </div>

        {/* KPIs Résumés */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-800/50 backdrop-blur p-4 rounded-2xl border border-slate-700/60">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Parc Total Suivi</span>
            <span className="text-2xl font-black text-white mt-1 block">{stats.total} matériels</span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">{stats.actifs} en service opérationnel</span>
          </div>

          <div className="bg-slate-800/50 backdrop-blur p-4 rounded-2xl border border-slate-700/60">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Taux de Disponibilité</span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">{stats.tauxDispo}%</span>
            <span className="text-[11px] text-emerald-300/80 mt-0.5 block">Parc en état de marche</span>
          </div>

          <div className="bg-slate-800/50 backdrop-blur p-4 rounded-2xl border border-slate-700/60">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">En Réparation / Panne</span>
            <span className={`text-2xl font-black mt-1 block ${stats.enPanne > 0 ? 'text-rose-400' : 'text-slate-200'}`}>
              {stats.enPanne}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Engins immobilisés</span>
          </div>

          <div className="bg-slate-800/50 backdrop-blur p-4 rounded-2xl border border-slate-700/60">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Alertes Actives</span>
            <span className={`text-2xl font-black mt-1 block ${stats.alertesCritiques > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {alertes.length} ({stats.alertesCritiques} critiques)
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Vidanges, CT, Pneus, Assurances</span>
          </div>
        </div>
      </div>

      {/* 2. Section Alertes Intelligentes du Parc */}
      {alertes.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-extrabold text-slate-900">
                Centre d'Alertes Maintenance & Réglementation ({alertes.length})
              </h2>
            </div>
            <span className="text-xs text-slate-500">
              Surveillance automatique des vidanges par date / km / heures, expiration de police d'assurance et contrôles techniques.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {alertes.slice(0, 6).map(alerte => (
              <div
                key={alerte.id}
                onClick={() => {
                  setSelectedVehiculeId(alerte.vehiculeId);
                  window.scrollTo({ top: 400, behavior: 'smooth' });
                }}
                className={`p-4 rounded-2xl border transition cursor-pointer hover:shadow-md ${
                  alerte.urgence === 'CRITIQUE'
                    ? 'bg-rose-50/60 border-rose-200 hover:border-rose-300'
                    : 'bg-amber-50/60 border-amber-200 hover:border-amber-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                      {alerte.numInterne}
                    </span>
                    <h3 className="font-bold text-xs text-slate-900 mt-1">{alerte.titre}</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    alerte.urgence === 'CRITIQUE' ? 'bg-rose-200 text-rose-900' : 'bg-amber-200 text-amber-900'
                  }`}>
                    {alerte.type}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                  {alerte.description}
                </p>
                <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-semibold text-indigo-600">
                  <span>{alerte.vehiculeNom}</span>
                  <span className="flex items-center gap-0.5">Consulter fiche →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Fiche détaillée en Modale Plein Écran (Overlay) */}
      {selectedVehicule && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setSelectedVehiculeId(null)}
        >
          <div 
            className="max-w-6xl w-full max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl relative my-auto bg-white border border-slate-700/50"
            onClick={e => e.stopPropagation()}
          >
            <FicheTechniqueMateriel
              vehicule={selectedVehicule}
              entretiens={entretiens}
              pieces={piecesRemplacables}
              onClose={() => setSelectedVehiculeId(null)}
              onAffecterChantier={handleOpenAffectation}
              onEnregistrerEntretien={handleOpenEntretien}
              onDeclarerPanne={handleOpenPanne}
              onMettreAJourCompteur={handleOpenCompteur}
              onPermuterPneus={handleOpenPermut}
              onRemplacerPiece={handleOpenRemplacement}
            />
          </div>
        </div>
      )}

      {/* Barre de navigation des vues spécialisées du module */}
      <div className="flex flex-col sm:flex-row border border-slate-200 bg-white rounded-2xl p-1.5 shadow-sm gap-1.5">
        <button
          onClick={() => setActiveMainTab('INVENTAIRE')}
          className={`flex-1 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
            activeMainTab === 'INVENTAIRE'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Truck className="w-4 h-4" /> Inventaire Général du Parc ({filteredVehicules.length})
        </button>
        <button
          onClick={() => setActiveMainTab('ASSURANCES')}
          className={`flex-1 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
            activeMainTab === 'ASSURANCES'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Suivi des Assurances ({statsAssurance.totalVehicules})
          {statsAssurance.expirees > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
              {statsAssurance.expirees} expirée(s)
            </span>
          )}
          {statsAssurance.proches > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black">
              {statsAssurance.proches} &lt;30j
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveMainTab('CONTROLES_TECHNIQUES')}
          className={`flex-1 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
            activeMainTab === 'CONTROLES_TECHNIQUES'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Wrench className="w-4 h-4" /> Contrôles Techniques (ENACTa / CTC) ({statsCT.totalVehicules})
          {statsCT.expires > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
              {statsCT.expires} en retard
            </span>
          )}
        </button>
      </div>

      {/* ============================================================ */}
      {/* VUE 1 : INVENTAIRE DU PARC */}
      {/* ============================================================ */}
      {activeMainTab === 'INVENTAIRE' && (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
        {/* Barre de recherche et sélecteurs de filtres */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Inventaire des Véhicules & Engins ({filteredVehicules.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Recherche multi-critères par numéro interne, immatriculation, conducteur ou type.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Input recherche */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Rechercher (ex: Hilux, Kerax, 12345...)"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 shadow-sm"
              />
            </div>

            {/* Filtre Catégorie */}
            <select
              value={selectedCategorie}
              onChange={e => setSelectedCategorie(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            >
              <option value="TOUTES">Toutes catégories</option>
              <option value="VEHICULE_LEGER">Véhicules légers (VL)</option>
              <option value="POIDS_LOURD">Poids lourds (PL)</option>
              <option value="ENGIN_TERRASSEMENT">Engins terrassement</option>
              <option value="ENGIN_LEVAGE">Engins levage (Grues)</option>
            </select>

            {/* Filtre Statut */}
            <select
              value={selectedStatut}
              onChange={e => setSelectedStatut(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            >
              <option value="TOUS">Tous statuts</option>
              <option value="ACTIF">Actif</option>
              <option value="EN_PANNE">En panne</option>
              <option value="EN_REPARATION">En réparation</option>
              <option value="EN_MAINTENANCE">En maintenance</option>
            </select>

            {/* Filtre Chantier si utilisateur central */}
            {!isChantierUser && (
              <select
                value={selectedChantierFilter}
                onChange={e => setSelectedChantierFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              >
                <option value="TOUS">Tous les chantiers</option>
                {chantiers.map(ch => (
                  <option key={ch.id} value={ch.id}>{ch.nom_projet}</option>
                ))}
              </select>
            )}

            {/* Bascule Grille / Tableau */}
            <div className="flex rounded-xl border border-slate-200 bg-white p-0.5 shadow-sm">
              <button
                onClick={() => setViewMode('GRILLE')}
                className={`p-1.5 rounded-lg transition ${viewMode === 'GRILLE' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                title="Affichage Cartes"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('TABLEAU')}
                className={`p-1.5 rounded-lg transition ${viewMode === 'TABLEAU' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                title="Affichage Tableau"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Vue Grille de cartes */}
        {viewMode === 'GRILLE' && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicules.map(v => {
              const chant = chantiers.find(c => c.id === v.chantier_id);
              const pneuAlert = piecesRemplacables.some(p => p.vehicule_id === v.id && p.type === 'PNEU' && (p.etat === 'A_REMPLACER' || (p.profondeur_sculpture_mm && p.profondeur_sculpture_mm <= 3)));

              return (
                <div
                  key={v.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 hover:shadow-xl p-5 flex flex-col justify-between space-y-4 ${
                    selectedVehiculeId === v.id ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-lg' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {v.num_interne}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        v.statut === 'ACTIF' ? 'bg-emerald-100 text-emerald-800' :
                        v.statut === 'EN_PANNE' ? 'bg-rose-100 text-rose-800 animate-pulse' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {v.statut}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-black text-base text-slate-900 group-hover:text-indigo-600 transition">
                        {v.marque} {v.modele}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        Immat : {v.immatriculation} • {v.annee}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Chantier :</span>
                        <strong className="text-slate-800 truncate max-w-[170px]">
                          {chant?.nom_projet || v.historique_affectations?.[0]?.chantier_nom || 'Parc Central'}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Conducteur :</span>
                        <span className="font-semibold text-slate-700 truncate max-w-[170px]">
                          {v.conducteur_nom || 'Non affecté'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Compteur :</span>
                        <span className="font-mono font-bold text-slate-900">
                          {v.kilometrage > 0 ? `${v.kilometrage.toLocaleString()} km` : ''}
                          {v.kilometrage > 0 && v.heures_fonctionnement > 0 ? ' • ' : ''}
                          {v.heures_fonctionnement > 0 ? `${v.heures_fonctionnement}h` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Alertes badge sur la carte */}
                    <div className="flex flex-wrap gap-1.5">
                      {pneuAlert && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Pneu à remplacer
                        </span>
                      )}
                      {v.date_prochaine_vidange && new Date(v.date_prochaine_vidange) < new Date() && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                          <Wrench className="w-3 h-3" /> Vidange requise
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVehiculeId(v.id);
                      }}
                      className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition flex-1 justify-center shadow-sm"
                    >
                      <FileText className="w-3.5 h-3.5" /> Fiche Complète
                    </button>
                    <button
                      onClick={() => handleOpenAffectation(v)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                      title="Transférer chantier"
                    >
                      <ArrowLeftRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenCompteur(v)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                      title="Relevé compteur"
                    >
                      <Gauge className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Vue Tableau */}
        {viewMode === 'TABLEAU' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Immatriculation</th>
                  <th className="py-3.5 px-4">Marque & Modèle</th>
                  <th className="py-3.5 px-4">Catégorie</th>
                  <th className="py-3.5 px-4">Chantier d'affectation</th>
                  <th className="py-3.5 px-4">Conducteur</th>
                  <th className="py-3.5 px-4">Compteur</th>
                  <th className="py-3.5 px-4">Statut</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVehicules.map(v => (
                  <tr 
                    key={v.id} 
                    className="hover:bg-indigo-50/40 transition cursor-pointer"
                    onClick={() => setSelectedVehiculeId(v.id)}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{v.num_interne}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">{v.immatriculation}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{v.marque} {v.modele}</td>
                    <td className="py-3 px-4 text-slate-600">{v.categorie?.replace('_', ' ')}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {v.historique_affectations?.[0]?.chantier_nom || 'Parc Central'}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{v.conducteur_nom || 'Non affecté'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {v.kilometrage > 0 ? `${v.kilometrage.toLocaleString()} km` : `${v.heures_fonctionnement}h`}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        v.statut === 'ACTIF' ? 'bg-emerald-100 text-emerald-800' :
                        v.statut === 'EN_PANNE' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {v.statut}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedVehiculeId(v.id)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
                      >
                        Consulter la fiche
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* ============================================================ */}
      {/* VUE 2 : TABLEAU DE BORD & SUIVI DES ASSURANCES DU PARC */}
      {/* ============================================================ */}
      {activeMainTab === 'ASSURANCES' && (
        <div className="space-y-6">
          {/* Bandeau d'indicateurs Assurances */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Polices Souscrites</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{statsAssurance.totalVehicules} matériels</span>
              <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">{statsAssurance.valides} conformes et actives</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Échéances sous 30 jours</span>
              <span className={`text-2xl font-black mt-1 block ${statsAssurance.proches > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {statsAssurance.proches}
              </span>
              <span className="text-[11px] text-amber-700 font-semibold mt-0.5 block">Renouvellement à anticiper</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Polices Expirées</span>
              <span className={`text-2xl font-black mt-1 block ${statsAssurance.expirees > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-900'}`}>
                {statsAssurance.expirees}
              </span>
              <span className="text-[11px] text-rose-700 font-semibold mt-0.5 block">Interdiction stricte de circuler</span>
            </div>

            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-sm">
              <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block">Budget Annuel Assurances</span>
              <span className="text-xl font-mono font-black text-white mt-1 block">
                {statsAssurance.primeTotale.toLocaleString()} DZD
              </span>
              <span className="text-[11px] text-indigo-200 mt-0.5 block">Primes globales de la flotte</span>
            </div>
          </div>

          {/* Tableau exhaustif des assurances */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  Registre Central des Polices d'Assurance (Algérie)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Suivi des contrats souscrits auprès des compagnies agréées (CAAT, SAA, CAAR, CIAR, Cash Assurances).
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Véhicule / Engin</th>
                    <th className="py-3.5 px-4">Immatriculation</th>
                    <th className="py-3.5 px-4">Compagnie Assureur</th>
                    <th className="py-3.5 px-4">Numéro de Police</th>
                    <th className="py-3.5 px-4">Date d'Échéance</th>
                    <th className="py-3.5 px-4">Délai Restant</th>
                    <th className="py-3.5 px-4">Prime Annuelle</th>
                    <th className="py-3.5 px-4">Statut</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vehiculesAccessibles.map(v => {
                    const dateMaintenant = new Date();
                    const dEcheance = v.date_fin_assurance ? new Date(v.date_fin_assurance) : null;
                    const diffJours = dEcheance ? Math.ceil((dEcheance.getTime() - dateMaintenant.getTime()) / (1000 * 3600 * 24)) : null;
                    const isExpire = diffJours !== null && diffJours < 0;
                    const isProche = diffJours !== null && diffJours >= 0 && diffJours <= 30;

                    return (
                      <tr key={v.id} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                              {v.num_interne}
                            </span>
                            <span className="font-bold text-slate-900">{v.marque} {v.modele}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                          {v.immatriculation}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                            {v.assurance_compagnie || 'CAAT Assurances'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          {v.assurance_police || 'POL-FLOTTE-2024'}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {v.date_fin_assurance || 'Non renseignée'}
                        </td>
                        <td className="py-3.5 px-4 font-semibold">
                          {diffJours !== null ? (
                            isExpire ? (
                              <span className="text-rose-700 font-bold">Expiré depuis {Math.abs(diffJours)} jour(s)</span>
                            ) : (
                              <span className={diffJours <= 30 ? 'text-amber-700 font-bold' : 'text-slate-600'}>
                                {diffJours} jour(s) restant(s)
                              </span>
                            )
                          ) : (
                            <span className="text-slate-400 italic">N/A</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-extrabold text-indigo-600">
                          {v.assurance_cout_dzd ? `${v.assurance_cout_dzd.toLocaleString()} DZD` : 'N/A'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isExpire
                              ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse'
                              : isProche
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {isExpire ? 'Expirée' : isProche ? 'À renouveler' : 'Valide'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenAssurance(v)}
                              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition"
                            >
                              <RefreshCw className="w-3.5 h-3.5" /> Renouveler
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedVehiculeId(v.id);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1"
                              title="Voir fiche complète"
                            >
                              <FileText className="w-3.5 h-3.5" /> Fiche
                            </button>
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

      {/* ============================================================ */}
      {/* VUE 3 : CONTRÔLES TECHNIQUES (ENACTa / CTC) */}
      {/* ============================================================ */}
      {activeMainTab === 'CONTROLES_TECHNIQUES' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Véhicules & Engins Soumis</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{statsCT.totalVehicules} matériels</span>
              <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">{statsCT.valides} contrôlés et conformes</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Visites Imminentes (&lt;30j)</span>
              <span className={`text-2xl font-black mt-1 block ${statsCT.proches > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {statsCT.proches}
              </span>
              <span className="text-[11px] text-amber-700 font-semibold mt-0.5 block">Passage au centre requis</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Visites En Retard</span>
              <span className={`text-2xl font-black mt-1 block ${statsCT.expires > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-900'}`}>
                {statsCT.expires}
              </span>
              <span className="text-[11px] text-rose-700 font-semibold mt-0.5 block">Défaut de conformité légale</span>
            </div>

            <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Organismes Agréés</span>
              <span className="text-base font-bold text-white mt-1 block">ENACTa & CTC Levage</span>
              <span className="text-[11px] text-slate-300 mt-0.5 block">Centres Chéraga, Rouiba & Oran</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50/70">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-indigo-600" />
                Registre des Visites Périodiques & Contrôles de Sécurité
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Matériel</th>
                    <th className="py-3.5 px-4">Immatriculation</th>
                    <th className="py-3.5 px-4">Organisme Agréé</th>
                    <th className="py-3.5 px-4">Dernière Visite</th>
                    <th className="py-3.5 px-4">Prochain Contrôle</th>
                    <th className="py-3.5 px-4">Statut Réglementaire</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vehiculesAccessibles.map(v => {
                    const dateMaintenant = new Date();
                    const dCT = v.date_prochain_controle_technique ? new Date(v.date_prochain_controle_technique) : null;
                    const diffJours = dCT ? Math.ceil((dCT.getTime() - dateMaintenant.getTime()) / (1000 * 3600 * 24)) : null;
                    const isExpire = diffJours !== null && diffJours < 0;
                    const isProche = diffJours !== null && diffJours >= 0 && diffJours <= 30;

                    return (
                      <tr key={v.id} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {v.num_interne} • {v.marque} {v.modele}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">{v.immatriculation}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{v.ct_organisme || 'ENACTa Chéraga'}</td>
                        <td className="py-3.5 px-4 text-slate-600">{v.ct_date_dernier || 'N/A'}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{v.date_prochain_controle_technique || 'N/A'}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            isExpire
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : isProche
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {isExpire ? 'En retard' : isProche ? 'À renouveler' : 'Conforme'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEntretien(v)}
                              className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs"
                            >
                              Visite CT
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedVehiculeId(v.id);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1"
                              title="Voir fiche complète"
                            >
                              <FileText className="w-3.5 h-3.5" /> Fiche
                            </button>
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

      {/* ============================================================ */}
      {/* MODALE 1 : NOUVEAU VÉHICULE / ENGIN */}
      {/* ============================================================ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 md:p-8 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">Enregistrer un Véhicule ou Engin BTP</h3>
                <p className="text-xs text-slate-500">Ajout à l'inventaire du parc matériel de l'entreprise</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={async e => {
                e.preventDefault();
                const result = await ajouterVehicule({
                  ...formDataVehicule,
                  entreprise_id: 'ent-001',
                  historique_affectations: [
                    {
                      id: `aff-${Date.now()}`,
                      chantier_id: formDataVehicule.chantier_id,
                      chantier_nom: chantiers.find(c => c.id === formDataVehicule.chantier_id)?.nom_projet || 'Chantier',
                      conducteur_nom: formDataVehicule.conducteur_nom,
                      date_debut: new Date().toISOString().split('T')[0],
                      motif: 'Affectation initiale'
                    }
                  ]
                });
                if (!result) return;
                setIsAddModalOpen(false);
              }}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Numéro Interne *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: CAM-002, ENG-004"
                    value={formDataVehicule.num_interne}
                    onChange={e => setFormDataVehicule({ ...formDataVehicule, num_interne: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Immatriculation *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 12345-122-16"
                    value={formDataVehicule.immatriculation}
                    onChange={e => setFormDataVehicule({ ...formDataVehicule, immatriculation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Marque *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Toyota, Caterpillar, Renault"
                    value={formDataVehicule.marque}
                    onChange={e => setFormDataVehicule({ ...formDataVehicule, marque: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Modèle *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Hilux 4x4, 320 GC, Kerax"
                    value={formDataVehicule.modele}
                    onChange={e => setFormDataVehicule({ ...formDataVehicule, modele: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Catégorie Matériel *</label>
                  <select
                    value={formDataVehicule.categorie}
                    onChange={e => setFormDataVehicule({ ...formDataVehicule, categorie: e.target.value as CategorieMateriel })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 font-bold"
                  >
                    <option value="VEHICULE_LEGER">Véhicule Léger (VL / Pick-up)</option>
                    <option value="POIDS_LOURD">Poids Lourd (Camion Benne / Toupie)</option>
                    <option value="ENGIN_TERRASSEMENT">Engin de Terrassement (Pelle, Rétro)</option>
                    <option value="ENGIN_LEVAGE">Engin de Levage (Grue, Chariot)</option>
                    <option value="COMPACTAGE">Matériel de Compactage</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Chantier d'affectation initiale *</label>
                  <select
                    value={formDataVehicule.chantier_id}
                    onChange={e => setFormDataVehicule({ ...formDataVehicule, chantier_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 font-bold"
                  >
                    {chantiers.map(ch => (
                      <option key={ch.id} value={ch.id}>{ch.nom_projet}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Conducteur / Chauffeur attitré</label>
                  <input
                    type="text"
                    placeholder="Nom complet du chauffeur"
                    value={formDataVehicule.conducteur_nom}
                    onChange={e => setFormDataVehicule({ ...formDataVehicule, conducteur_nom: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kilométrage initial</label>
                  <input
                    type="number"
                    value={formDataVehicule.kilometrage}
                    onChange={e => setFormDataVehicule({ ...formDataVehicule, kilometrage: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-md shadow-indigo-600/30"
                >
                  Enregistrer le matériel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODALE 2 : AFFECTATION / DÉPLACEMENT CHANTIER */}
      {/* ============================================================ */}
      {isAffectModalOpen && targetVehicule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Transférer vers un Chantier</h3>
                <p className="text-xs text-slate-500">{targetVehicule.marque} {targetVehicule.modele} ({targetVehicule.num_interne})</p>
              </div>
              <button onClick={() => setIsAffectModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form
              onSubmit={async e => {
                e.preventDefault();
                const chant = chantiers.find(c => c.id === formAffectation.chantier_id);
                const result = await affecterVehiculeChantier(
                  targetVehicule.id,
                  formAffectation.chantier_id,
                  chant?.nom_projet || 'Chantier',
                  formAffectation.conducteur_nom,
                  formAffectation.motif,
                  formAffectation.bon_transfert_ref
                );
                if (!result) return;
                setIsAffectModalOpen(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Chantier Destination *</label>
                <select
                  value={formAffectation.chantier_id}
                  onChange={e => setFormAffectation({ ...formAffectation, chantier_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold focus:ring-2 focus:ring-indigo-500"
                >
                  {chantiers.map(ch => (
                    <option key={ch.id} value={ch.id}>{ch.nom_projet} ({ch.wilaya})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nouveau Conducteur / Opérateur *</label>
                <input
                  type="text"
                  required
                  value={formAffectation.conducteur_nom}
                  onChange={e => setFormAffectation({ ...formAffectation, conducteur_nom: e.target.value })}
                  placeholder="Nom du chauffeur responsable"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Référence Bon de Transfert</label>
                <input
                  type="text"
                  value={formAffectation.bon_transfert_ref}
                  onChange={e => setFormAffectation({ ...formAffectation, bon_transfert_ref: e.target.value })}
                  placeholder="Ex: BT-2026-088"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Motif du déplacement</label>
                <textarea
                  rows={2}
                  value={formAffectation.motif}
                  onChange={e => setFormAffectation({ ...formAffectation, motif: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAffectModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Confirmer le transfert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODALE 3 : RELEVÉ COMPTEUR (KM / HEURES) */}
      {/* ============================================================ */}
      {isCompteurModalOpen && targetVehicule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Relevé de Compteur</h3>
                <p className="text-xs text-slate-500">{targetVehicule.num_interne} • {targetVehicule.immatriculation}</p>
              </div>
              <button onClick={() => setIsCompteurModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form
              onSubmit={async e => {
                e.preventDefault();
                const result = await mettreAJourCompteur(
                  targetVehicule.id,
                  formCompteur.nouveauKm,
                  formCompteur.nouvellesHeures
                );
                if (!result) return;
                setIsCompteurModalOpen(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Index Kilométrique (km)</label>
                <input
                  type="number"
                  value={formCompteur.nouveauKm}
                  onChange={e => setFormCompteur({ ...formCompteur, nouveauKm: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-base font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Compteur Heures de Marche (Engins)</label>
                <input
                  type="number"
                  value={formCompteur.nouvellesHeures}
                  onChange={e => setFormCompteur({ ...formCompteur, nouvellesHeures: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-base font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCompteurModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Valider le relevé
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODALE 4 : ENREGISTRER UN ENTRETIEN / VIDANGE */}
      {/* ============================================================ */}
      {isEntretienModalOpen && targetVehicule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Enregistrer une Intervention / Vidange</h3>
                <p className="text-xs text-slate-500">{targetVehicule.marque} {targetVehicule.modele} ({targetVehicule.num_interne})</p>
              </div>
              <button onClick={() => setIsEntretienModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form
              onSubmit={async e => {
                e.preventDefault();
                const result = await enregistrerEntretien({
                  ...formEntretien,
                  vehicule_id: targetVehicule.id,
                  vehicule_nom: `${targetVehicule.marque} ${targetVehicule.modele}`
                });
                if (!result) return;
                setIsEntretienModalOpen(false);
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Type d'opération *</label>
                  <select
                    value={formEntretien.type}
                    onChange={e => setFormEntretien({ ...formEntretien, type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="VIDANGE">Vidange & Filtres</option>
                    <option value="PREVENTIF">Entretien Préventif</option>
                    <option value="CURATIF">Réparation Curative</option>
                    <option value="CONTROLE_TECHNIQUE">Contrôle Technique</option>
                    <option value="PNEUMATIQUE">Intervention Pneumatiques</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date d'intervention *</label>
                  <input
                    type="date"
                    required
                    value={formEntretien.date}
                    onChange={e => setFormEntretien({ ...formEntretien, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Index Kilométrique</label>
                  <input
                    type="number"
                    value={formEntretien.kilometrage_entretien}
                    onChange={e => setFormEntretien({ ...formEntretien, kilometrage_entretien: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Coût Total (DZD) *</label>
                  <input
                    type="number"
                    required
                    value={formEntretien.cout}
                    onChange={e => setFormEntretien({ ...formEntretien, cout: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description des travaux *</label>
                <textarea
                  required
                  rows={2}
                  value={formEntretien.description}
                  onChange={e => setFormEntretien({ ...formEntretien, description: e.target.value })}
                  placeholder="Détail des opérations réalisées"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Garage / Intervenant</label>
                  <input
                    type="text"
                    value={formEntretien.garage_nom}
                    onChange={e => setFormEntretien({ ...formEntretien, garage_nom: e.target.value })}
                    placeholder="Ex: Station Naftal, ENACTa"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">N° Facture / Pièce comptable</label>
                  <input
                    type="text"
                    value={formEntretien.facture_ref}
                    onChange={e => setFormEntretien({ ...formEntretien, facture_ref: e.target.value })}
                    placeholder="Ex: FAC-2026-99"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEntretienModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Valider l'intervention
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODALE 5 : DÉCLARATION DE PANNE */}
      {/* ============================================================ */}
      {isPanneModalOpen && targetVehicule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-rose-700 flex items-center gap-1.5">
                  <AlertOctagon className="w-5 h-5 text-rose-600" /> Signaler une Panne / Incident
                </h3>
                <p className="text-xs text-slate-500">{targetVehicule.marque} {targetVehicule.modele} ({targetVehicule.num_interne})</p>
              </div>
              <button onClick={() => setIsPanneModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form
              onSubmit={async e => {
                e.preventDefault();
                const result = await declarerPanne(
                  targetVehicule.id,
                  formPanne.description,
                  formPanne.gravite,
                  formPanne.garage_nom,
                  formPanne.coutEstime
                );
                if (!result) return;
                setIsPanneModalOpen(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Niveau de Gravité *</label>
                <select
                  value={formPanne.gravite}
                  onChange={e => setFormPanne({ ...formPanne, gravite: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold focus:ring-2 focus:ring-rose-500 text-rose-700"
                >
                  <option value="IMMOBILISATION">IMMOBILISATION TOTALE (Arrêt de chantier)</option>
                  <option value="CRITIQUE">CRITIQUE (Dégradation rapide si non traité)</option>
                  <option value="MOYENNE">MOYENNE (Fonctionnement dégradé)</option>
                  <option value="FAIBLE">FAIBLE (Anomalie mineure)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description de la panne constatée *</label>
                <textarea
                  required
                  rows={3}
                  value={formPanne.description}
                  onChange={e => setFormPanne({ ...formPanne, description: e.target.value })}
                  placeholder="Ex: Casse flexible hydraulique, surchauffe moteur, problème démarreur..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPanneModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
                >
                  Immobiliser et déclarer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODALE 6 : PERMUTATION DE PNEUS */}
      {/* ============================================================ */}
      {isPermutModalOpen && targetVehicule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Permutation Croisée de Pneus</h3>
                <p className="text-xs text-slate-500">{targetVehicule.marque} {targetVehicule.modele} ({targetVehicule.num_interne})</p>
              </div>
              <button onClick={() => setIsPermutModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form
              onSubmit={async e => {
                e.preventDefault();
                const result = await permuterPneus(
                  targetVehicule.id,
                  formPermut.pneu1Id,
                  formPermut.pneu2Id,
                  formPermut.km,
                  formPermut.motif,
                  formPermut.operateur
                );
                if (!result) return;
                setIsPermutModalOpen(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Premier Pneu *</label>
                <select
                  value={formPermut.pneu1Id}
                  onChange={e => setFormPermut({ ...formPermut, pneu1Id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold focus:ring-2 focus:ring-indigo-500"
                >
                  {piecesRemplacables
                    .filter(p => p.vehicule_id === targetVehicule.id && p.type === 'PNEU')
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.designation} ({p.position}) - {p.numero_serie}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Pneu à permuter avec *</label>
                <select
                  value={formPermut.pneu2Id}
                  onChange={e => setFormPermut({ ...formPermut, pneu2Id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold focus:ring-2 focus:ring-indigo-500"
                >
                  {piecesRemplacables
                    .filter(p => p.vehicule_id === targetVehicule.id && p.type === 'PNEU' && p.id !== formPermut.pneu1Id)
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.designation} ({p.position}) - {p.numero_serie}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kilométrage actuel *</label>
                  <input
                    type="number"
                    value={formPermut.km}
                    onChange={e => setFormPermut({ ...formPermut, km: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Opérateur / Garage *</label>
                  <input
                    type="text"
                    value={formPermut.operateur}
                    onChange={e => setFormPermut({ ...formPermut, operateur: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPermutModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Valider la permutation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODALE 7 : REMPLACEMENT DE PIÈCE OU PNEU */}
      {/* ============================================================ */}
      {isRemplacementModalOpen && targetVehicule && targetPiece && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Remplacer un Composant</h3>
                <p className="text-xs text-slate-500">
                  Remplacement de {targetPiece.designation} ({targetPiece.numero_serie})
                </p>
              </div>
              <button onClick={() => setIsRemplacementModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form
              onSubmit={async e => {
                e.preventDefault();
                const result = await remplacerPieceRemplacable(
                  targetPiece.id,
                  {
                    vehicule_id: targetVehicule.id,
                    type: targetPiece.type,
                    designation: formRemplacement.designation,
                    marque: formRemplacement.marque,
                    dimensions: formRemplacement.dimensions,
                    numero_serie: formRemplacement.numero_serie,
                    date_installation: new Date().toISOString().split('T')[0],
                    kilometrage_installation: targetVehicule.kilometrage || 0,
                    position: formRemplacement.position || targetPiece.position,
                    etat: 'NEUF',
                    cout_achat_dzd: formRemplacement.cout_achat_dzd,
                    fournisseur: formRemplacement.fournisseur
                  },
                  formRemplacement.motif,
                  formRemplacement.note
                );
                if (!result) return;
                setIsRemplacementModalOpen(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nouveau Numéro de Série *</label>
                <input
                  type="text"
                  required
                  value={formRemplacement.numero_serie}
                  onChange={e => setFormRemplacement({ ...formRemplacement, numero_serie: e.target.value })}
                  placeholder="Ex: MICH-315-8890"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Marque *</label>
                  <input
                    type="text"
                    required
                    value={formRemplacement.marque}
                    onChange={e => setFormRemplacement({ ...formRemplacement, marque: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Dimensions / Réf</label>
                  <input
                    type="text"
                    value={formRemplacement.dimensions}
                    onChange={e => setFormRemplacement({ ...formRemplacement, dimensions: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Motif du remplacement *</label>
                <select
                  value={formRemplacement.motif}
                  onChange={e => setFormRemplacement({ ...formRemplacement, motif: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="USURE_NORMALE">Usure normale / Fin de vie</option>
                  <option value="CREVAISON_IRREPARABLE">Crevaison irréparable</option>
                  <option value="ECLATEMENT">Éclatement / Déformation</option>
                  <option value="PANNE">Panne électrique / Décharge profonde</option>
                  <option value="PREVENTIF">Remplacement préventif</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Coût d'achat (DZD)</label>
                  <input
                    type="number"
                    value={formRemplacement.cout_achat_dzd}
                    onChange={e => setFormRemplacement({ ...formRemplacement, cout_achat_dzd: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fournisseur</label>
                  <input
                    type="text"
                    value={formRemplacement.fournisseur}
                    onChange={e => setFormRemplacement({ ...formRemplacement, fournisseur: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRemplacementModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Enregistrer le remplacement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODALE 8 : RENOUVELER LA POLICE D'ASSURANCE */}
      {/* ============================================================ */}
      {isAssuranceModalOpen && targetVehicule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" /> Renouveler Police d'Assurance
                </h3>
                <p className="text-xs text-slate-500">{targetVehicule.num_interne} • {targetVehicule.marque} {targetVehicule.modele} ({targetVehicule.immatriculation})</p>
              </div>
              <button onClick={() => setIsAssuranceModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form
              onSubmit={async e => {
                e.preventDefault();
                const result = await renouvelerAssurance(
                  targetVehicule.id,
                  formAssurance.nouvelleCompagnie,
                  formAssurance.nouvellePolice,
                  formAssurance.dateDebut,
                  formAssurance.dateFin,
                  formAssurance.coutDzd,
                  formAssurance.quittanceRef
                );
                if (!result) return;
                setIsAssuranceModalOpen(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Compagnie d'Assurance Agréée *</label>
                <select
                  value={formAssurance.nouvelleCompagnie}
                  onChange={e => setFormAssurance({ ...formAssurance, nouvelleCompagnie: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="CAAT Assurances">CAAT (Compagnie Algérienne des Assurances)</option>
                  <option value="SAA Assurances">SAA (Société Nationale d'Assurance)</option>
                  <option value="CAAR Assurances">CAAR (Caisse Algérienne d'Assurance et de Réassurance)</option>
                  <option value="CIAR Assurances">CIAR (Compagnie Internationale d'Assurance)</option>
                  <option value="Cash Assurances">Cash Assurances (Spécialiste Risques Industriels & BTP)</option>
                  <option value="Alliance Assurances">Alliance Assurances</option>
                  <option value="Macir Vie">Macir Vie</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Numéro de Police d'Assurance *</label>
                <input
                  type="text"
                  required
                  value={formAssurance.nouvellePolice}
                  onChange={e => setFormAssurance({ ...formAssurance, nouvellePolice: e.target.value })}
                  placeholder="Ex: POL-AUTO-2026-99120"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date d'effet (Début) *</label>
                  <input
                    type="date"
                    required
                    value={formAssurance.dateDebut}
                    onChange={e => setFormAssurance({ ...formAssurance, dateDebut: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date d'Échéance *</label>
                  <input
                    type="date"
                    required
                    value={formAssurance.dateFin}
                    onChange={e => setFormAssurance({ ...formAssurance, dateFin: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Prime Annuelle (DZD) *</label>
                  <input
                    type="number"
                    required
                    value={formAssurance.coutDzd}
                    onChange={e => setFormAssurance({ ...formAssurance, coutDzd: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Réf Quittance / Reçu</label>
                  <input
                    type="text"
                    value={formAssurance.quittanceRef}
                    onChange={e => setFormAssurance({ ...formAssurance, quittanceRef: e.target.value })}
                    placeholder="Ex: QUIT-2026-441"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssuranceModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Valider le renouvellement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
