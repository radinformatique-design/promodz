'use client';

import React, { useState, useMemo } from 'react';
import { 
  Vehicule, 
  Entretien, 
  PieceRemplacable, 
  HistoriquePermutationPneu,
  HistoriqueRemplacementPiece,
  StatutMateriel 
} from '../types/database';
import { useApp } from '../context/AppContext';
import { materielService } from '../services/materielService';
import { 
  Truck, 
  Wrench, 
  Clock, 
  User, 
  Settings, 
  AlertTriangle, 
  ShieldCheck, 
  Calendar, 
  FileText, 
  Gauge, 
  DollarSign, 
  ArrowLeftRight, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Plus,
  RefreshCw,
  ExternalLink,
  Phone,
  Layers,
  Fuel,
  Weight
} from 'lucide-react';

interface FicheTechniqueMaterielProps {
  vehicule: Vehicule;
  entretiens: Entretien[];
  pieces: PieceRemplacable[];
  onClose?: () => void;
  onAffecterChantier?: (vehicule: Vehicule) => void;
  onEnregistrerEntretien?: (vehicule: Vehicule) => void;
  onDeclarerPanne?: (vehicule: Vehicule) => void;
  onMettreAJourCompteur?: (vehicule: Vehicule) => void;
  onPermuterPneus?: (vehicule: Vehicule) => void;
  onRemplacerPiece?: (vehicule: Vehicule, piece: PieceRemplacable) => void;
}

export const FicheTechniqueMateriel: React.FC<FicheTechniqueMaterielProps> = ({
  vehicule,
  entretiens,
  pieces,
  onClose,
  onAffecterChantier,
  onEnregistrerEntretien,
  onDeclarerPanne,
  onMettreAJourCompteur,
  onPermuterPneus,
  onRemplacerPiece
}) => {
  const [activeTab, setActiveTab] = useState<'VUE_ENSEMBLE' | 'PNEUS_COMPOSANTS' | 'AFFECTATIONS' | 'ENTRETIENS' | 'DEPENSES'>('VUE_ENSEMBLE');
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);

  const entretiensVehicule = useMemo(() => 
    entretiens
      .filter(e => e.vehicule_id === vehicule.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [entretiens, vehicule.id]
  );

  const piecesVehicule = useMemo(() => 
    pieces.filter(p => p.vehicule_id === vehicule.id),
    [pieces, vehicule.id]
  );

  const pneusVehicule = useMemo(() => 
    piecesVehicule.filter(p => p.type === 'PNEU'),
    [piecesVehicule]
  );

  const autresComposants = useMemo(() => 
    piecesVehicule.filter(p => p.type !== 'PNEU'),
    [piecesVehicule]
  );

  const depenses = useMemo(() => 
    materielService.calculerDepensesVehicule(vehicule.id, entretiens, vehicule),
    [vehicule, entretiens]
  );

  // Vérification des statuts d'alerte spécifiques
  const dateMaintenant = new Date();
  const assuranceDate = vehicule.date_fin_assurance ? new Date(vehicule.date_fin_assurance) : null;
  const isAssuranceExpiree = assuranceDate ? assuranceDate < dateMaintenant : false;
  const isAssuranceProche = assuranceDate ? (assuranceDate.getTime() - dateMaintenant.getTime()) / (1000 * 3600 * 24) < 30 : false;

  const ctDate = vehicule.date_prochain_controle_technique ? new Date(vehicule.date_prochain_controle_technique) : null;
  const isCtExpire = ctDate ? ctDate < dateMaintenant : false;
  const isCtProche = ctDate ? (ctDate.getTime() - dateMaintenant.getTime()) / (1000 * 3600 * 24) < 30 : false;

  const isVidangeDateDepassee = vehicule.date_prochaine_vidange ? new Date(vehicule.date_prochaine_vidange) < dateMaintenant : false;
  const isVidangeKmDepassee = vehicule.km_prochaine_vidange && vehicule.kilometrage ? vehicule.kilometrage >= vehicule.km_prochaine_vidange : false;
  const isVidangeHeuresDepassee = vehicule.heures_prochaine_vidange && vehicule.heures_fonctionnement ? vehicule.heures_fonctionnement >= vehicule.heures_prochaine_vidange : false;
  const isVidangeAlerte = isVidangeDateDepassee || isVidangeKmDepassee || isVidangeHeuresDepassee;

  // Assistant visuel schéma des pneus
  const getPneuByPosition = (position: string) => {
    return pneusVehicule.find(p => p.position === position || p.position.includes(position));
  };

  const renderBadgePneu = (positionKey: string, label: string) => {
    const pneu = getPneuByPosition(positionKey);
    let bgColor = 'bg-slate-100 text-slate-500 border-slate-300';
    let dotColor = 'bg-slate-400';

    if (pneu) {
      if (pneu.etat === 'A_REMPLACER' || pneu.etat === 'HORS_SERVICE' || (pneu.profondeur_sculpture_mm && pneu.profondeur_sculpture_mm <= 3)) {
        bgColor = 'bg-rose-50 text-rose-800 border-rose-300 ring-2 ring-rose-400 animate-pulse';
        dotColor = 'bg-rose-600';
      } else if (pneu.etat === 'USURE_50' || pneu.etat === 'USURE_NORMALE') {
        bgColor = 'bg-amber-50 text-amber-800 border-amber-300';
        dotColor = 'bg-amber-500';
      } else {
        bgColor = 'bg-emerald-50 text-emerald-800 border-emerald-300';
        dotColor = 'bg-emerald-500';
      }
    }

    return (
      <button
        onClick={() => pneu && setSelectedPieceId(pneu.id)}
        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition shadow-sm hover:shadow-md cursor-pointer ${bgColor}`}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
          <span className="font-bold">{label}</span>
        </div>
        {pneu ? (
          <>
            <span className="text-[11px] font-mono font-medium truncate max-w-[110px]">{pneu.marque}</span>
            <span className="text-[10px] opacity-75 font-mono">{pneu.dimensions}</span>
            {pneu.profondeur_sculpture_mm !== undefined && (
              <span className="text-[10px] font-bold mt-1 px-1.5 py-0.5 rounded bg-white/70">
                {pneu.profondeur_sculpture_mm} mm
              </span>
            )}
          </>
        ) : (
          <span className="text-[10px] text-slate-400 italic">Non configuré</span>
        )}
      </button>
    );
  };

  const selectedPiece = piecesVehicule.find(p => p.id === selectedPieceId);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden space-y-0">
      {/* 1. Header Fiche Matériel */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-mono font-extrabold uppercase">
                {vehicule.num_interne}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-200 border border-slate-700 text-xs font-mono">
                Immat: {vehicule.immatriculation}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-700/60 text-slate-300">
                {vehicule.categorie?.replace('_', ' ') || 'MATÉRIEL BTP'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {vehicule.marque} {vehicule.modele} ({vehicule.annee})
            </h1>
            <p className="text-sm text-slate-300 flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-400" />
              Chantier d'affectation :{' '}
              <strong className="text-white">
                {vehicule.historique_affectations?.[0]?.chantier_nom || 'Parc Central BatiProm'}
              </strong>
              {vehicule.conducteur_nom && (
                <>
                  <span className="text-slate-500">•</span>
                  <User className="w-4 h-4 text-indigo-400" />
                  Conducteur : <strong className="text-white">{vehicule.conducteur_nom}</strong>
                </>
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="text-right sm:mr-3">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                vehicule.statut === 'ACTIF' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' 
                  : vehicule.statut === 'EN_PANNE'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30 animate-pulse'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
              }`}>
                {vehicule.statut === 'ACTIF' && <CheckCircle2 className="w-3.5 h-3.5" />}
                {vehicule.statut === 'EN_PANNE' && <XCircle className="w-3.5 h-3.5" />}
                {vehicule.statut}
              </span>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">
                {vehicule.kilometrage > 0 ? `${vehicule.kilometrage.toLocaleString()} km` : ''}
                {vehicule.kilometrage > 0 && vehicule.heures_fonctionnement > 0 ? ' • ' : ''}
                {vehicule.heures_fonctionnement > 0 ? `${vehicule.heures_fonctionnement} heures` : ''}
              </p>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-2xl bg-white/20 hover:bg-rose-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                title="Fermer la fiche technique"
              >
                ✕ Fermer la fiche
              </button>
            )}
          </div>
        </div>

        {/* Boutons d'actions rapides du matériel */}
        <div className="mt-6 pt-5 border-t border-slate-700/60 flex flex-wrap gap-2.5">
          <button
            onClick={() => onAffecterChantier?.(vehicule)}
            className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            <ArrowLeftRight className="w-4 h-4" /> Transférer / Changer Chantier
          </button>
          <button
            onClick={() => onMettreAJourCompteur?.(vehicule)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-bold text-xs flex items-center gap-1.5 transition"
          >
            <Gauge className="w-4 h-4 text-indigo-400" /> Relevé Compteur (Km / Heures)
          </button>
          <button
            onClick={() => onEnregistrerEntretien?.(vehicule)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-bold text-xs flex items-center gap-1.5 transition"
          >
            <Wrench className="w-4 h-4 text-emerald-400" /> Entretien / Vidange / CT
          </button>
          <button
            onClick={() => onDeclarerPanne?.(vehicule)}
            className="px-3 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition ml-auto"
          >
            <AlertTriangle className="w-4 h-4" /> Déclarer une Panne
          </button>
        </div>
      </div>

      {/* 2. Bandeau d'Alertes Clés Véhicule */}
      {(isAssuranceExpiree || isAssuranceProche || isCtExpire || isCtProche || isVidangeAlerte || vehicule.statut === 'EN_PANNE') && (
        <div className="bg-amber-50 border-b border-amber-200 p-4 px-6 flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-700" /> Alertes actives pour ce matériel :
          </div>
          <div className="flex flex-wrap gap-2">
            {isAssuranceExpiree && (
              <span className="px-2.5 py-1 rounded-md bg-rose-100 text-rose-800 font-bold border border-rose-200">
                Assurance expirée ({vehicule.date_fin_assurance})
              </span>
            )}
            {isAssuranceProche && !isAssuranceExpiree && (
              <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 font-bold border border-amber-200">
                Assurance à renouveler avant le {vehicule.date_fin_assurance}
              </span>
            )}
            {isCtExpire && (
              <span className="px-2.5 py-1 rounded-md bg-rose-100 text-rose-800 font-bold border border-rose-200">
                Contrôle technique en retard ({vehicule.date_prochain_controle_technique})
              </span>
            )}
            {isCtProche && !isCtExpire && (
              <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 font-bold border border-amber-200">
                Visite CT avant le {vehicule.date_prochain_controle_technique}
              </span>
            )}
            {isVidangeAlerte && (
              <span className="px-2.5 py-1 rounded-md bg-rose-100 text-rose-800 font-bold border border-rose-200">
                Vidange requise (Échéance: {vehicule.date_prochaine_vidange || `${vehicule.km_prochaine_vidange} km`})
              </span>
            )}
          </div>
        </div>
      )}

      {/* 3. Navigation par Onglets */}
      <div className="border-b border-slate-200 bg-slate-50 px-6">
        <nav className="flex space-x-6 overflow-x-auto text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('VUE_ENSEMBLE')}
            className={`py-3.5 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'VUE_ENSEMBLE'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" /> Vue d'ensemble & Fiche
          </button>
          <button
            onClick={() => setActiveTab('PNEUS_COMPOSANTS')}
            className={`py-3.5 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'PNEUS_COMPOSANTS'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4" /> Pneus & Composants Suivis ({piecesVehicule.length})
          </button>
          <button
            onClick={() => setActiveTab('AFFECTATIONS')}
            className={`py-3.5 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'AFFECTATIONS'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Truck className="w-4 h-4" /> Historique Chantiers ({vehicule.historique_affectations?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('ENTRETIENS')}
            className={`py-3.5 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'ENTRETIENS'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Wrench className="w-4 h-4" /> Entretiens & Vidanges ({entretiensVehicule.length})
          </button>
          <button
            onClick={() => setActiveTab('DEPENSES')}
            className={`py-3.5 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'DEPENSES'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4" /> Dépenses & TCO ({depenses.totalDepenses.toLocaleString()} DZD)
          </button>
        </nav>
      </div>

      {/* 4. Contenu des Onglets */}
      <div className="p-6 md:p-8">
        {/* ONGLET 1 : VUE D'ENSEMBLE */}
        {activeTab === 'VUE_ENSEMBLE' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Colonne 1 : Caractéristiques techniques */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-200 pb-2">
                <Settings className="w-4 h-4 text-indigo-600" /> Caractéristiques Techniques
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Marque & Modèle</span>
                  <span className="font-bold text-slate-800">{vehicule.marque} {vehicule.modele}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Numéro Interne</span>
                  <span className="font-mono font-bold text-indigo-600">{vehicule.num_interne}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Immatriculation</span>
                  <span className="font-mono font-bold text-slate-800">{vehicule.immatriculation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Année de mise en service</span>
                  <span className="font-semibold text-slate-800">{vehicule.annee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Énergie / Carburant</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    <Fuel className="w-3.5 h-3.5 text-slate-400" /> {vehicule.carburant || 'DIESEL'}
                  </span>
                </div>
                {vehicule.puissance && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Puissance</span>
                    <span className="font-semibold text-slate-800">{vehicule.puissance}</span>
                  </div>
                )}
                {vehicule.tonnage && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Poids / Tonnage</span>
                    <span className="font-semibold text-slate-800">{vehicule.tonnage} t</span>
                  </div>
                )}
                {vehicule.capacite && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Capacité de charge</span>
                    <span className="font-semibold text-slate-800">{vehicule.capacite}</span>
                  </div>
                )}
                {vehicule.caracteristiques && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-500 block mb-1">Équipements & Options :</span>
                    <p className="text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 text-[11px] leading-relaxed">
                      {vehicule.caracteristiques}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Colonne 2 : Échéances & Gestion Administrative */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-200 pb-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" /> Assurance & Contrôle Technique
              </h3>
              
              {/* Carte Assurance */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">Assurance Flotte / TRC</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isAssuranceExpiree ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {isAssuranceExpiree ? 'Expirée' : 'Valide'}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px]">Compagnie : <strong>{vehicule.assurance_compagnie || 'CAAT'}</strong></p>
                <p className="text-slate-600 text-[11px]">Police : <span className="font-mono">{vehicule.assurance_police || 'POL-BTP-2024'}</span></p>
                <p className="text-slate-600 text-[11px]">Échéance : <strong>{vehicule.date_fin_assurance || 'Non renseignée'}</strong></p>
                {vehicule.assurance_cout_dzd && (
                  <p className="text-indigo-600 font-mono font-bold text-[11px]">
                    Prime annuelle : {vehicule.assurance_cout_dzd.toLocaleString()} DZD
                  </p>
                )}
              </div>

              {/* Carte Contrôle Technique */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">Contrôle Technique Périodique</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isCtExpire ? 'bg-rose-100 text-rose-800' : isCtProche ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {isCtExpire ? 'En retard' : isCtProche ? 'À renouveler' : 'Conforme'}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px]">Organisme : <strong>{vehicule.ct_organisme || 'ENACTa Chéraga'}</strong></p>
                <p className="text-slate-600 text-[11px]">Dernière visite : {vehicule.ct_date_dernier || 'N/A'}</p>
                <p className="text-slate-600 text-[11px]">Prochaine visite : <strong>{vehicule.date_prochain_controle_technique || 'N/A'}</strong></p>
              </div>

              {/* Carte Vidange */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">Plan de Lubrification & Vidange</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isVidangeAlerte ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {isVidangeAlerte ? 'Requise' : 'À jour'}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px]">Dernière vidange : {vehicule.vidange_derniere_date || 'N/A'} ({vehicule.vidange_dernier_km || 0} km)</p>
                <p className="text-slate-600 text-[11px]">Prochaine vidange : <strong>{vehicule.date_prochaine_vidange || 'N/A'}</strong></p>
                {vehicule.km_prochaine_vidange && (
                  <p className="text-slate-600 text-[11px]">Seuil kilométrique : <strong>{vehicule.km_prochaine_vidange.toLocaleString()} km</strong></p>
                )}
                {vehicule.heures_prochaine_vidange && (
                  <p className="text-slate-600 text-[11px]">Seuil horaire engin : <strong>{vehicule.heures_prochaine_vidange} h</strong></p>
                )}
              </div>
            </div>

            {/* Colonne 3 : Conducteur & Affectation active */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-200 pb-2">
                <User className="w-4 h-4 text-indigo-600" /> Opérateur & Chantier Actuel
              </h3>
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Chantier d'affectation</span>
                  <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                    {vehicule.historique_affectations?.[0]?.chantier_nom || 'Parc Central BatiProm'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Conducteur / Grutier / Chauffeur</span>
                  <p className="text-sm font-bold text-indigo-600 mt-0.5">
                    {vehicule.conducteur_nom || 'Non assigné'}
                  </p>
                  {vehicule.conducteur_telephone && (
                    <p className="text-[11px] text-slate-600 flex items-center gap-1 mt-1">
                      <Phone className="w-3 h-3 text-slate-400" /> {vehicule.conducteur_telephone}
                    </p>
                  )}
                  {vehicule.conducteur_permis && (
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {vehicule.conducteur_permis}
                    </p>
                  )}
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-slate-500">Date d'arrivée sur site :</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {vehicule.historique_affectations?.[0]?.date_debut || 'N/A'}
                  </span>
                </div>
                {vehicule.historique_affectations?.[0]?.bon_transfert_ref && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Bon de transfert :</span>
                    <span className="font-mono text-indigo-600 font-bold">
                      {vehicule.historique_affectations[0].bon_transfert_ref}
                    </span>
                  </div>
                )}
              </div>

              {/* Résumé Dépenses */}
              <div className="bg-indigo-900 text-white p-4 rounded-xl space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Coût Total d'Exploitation (TCO)</span>
                <p className="text-2xl font-mono font-extrabold text-white">
                  {depenses.totalDepenses.toLocaleString()} DZD
                </p>
                <div className="flex justify-between text-[11px] text-indigo-200 pt-2 border-t border-indigo-800/80">
                  <span>{depenses.nbOperations} opérations de maintenance</span>
                  <span className="underline cursor-pointer" onClick={() => setActiveTab('DEPENSES')}>Détails →</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ONGLET 2 : SUIVI INDIVIDUEL DES PNEUS & PIÈCES REMPLAÇABLES */}
        {activeTab === 'PNEUS_COMPOSANTS' && (
          <div className="space-y-6">
            {/* Boîte d'action pour permutations et nouveaux composants */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Gestion des Pneumatiques & Composants Critiques</h3>
                <p className="text-xs text-slate-500">
                  Suivi unitaire par numéro de série, dimensions, positions des essieux et historique des permutations.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onPermuterPneus?.(vehicule)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
                >
                  <ArrowLeftRight className="w-4 h-4" /> Permuter 2 Pneus
                </button>
              </div>
            </div>

            {/* Schéma graphique des essieux / pneus */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-inner border border-slate-800">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-indigo-400" />
                  <h4 className="font-bold text-sm text-slate-200">
                    Schéma de Disposition des Pneumatiques — {vehicule.marque} {vehicule.modele}
                  </h4>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Bon état</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Usure normale</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> À remplacer (&lt;3mm)</span>
                </div>
              </div>

              {/* Grille Essieux / Pneus interactive */}
              <div className="max-w-xl mx-auto p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-8 my-4">
                <div className="text-center text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                  ▲ AVANT DU VÉHICULE (DIRECTION) ▲
                </div>

                {/* Essieu 1 (Avant) */}
                <div className="flex items-center justify-between gap-8">
                  {renderBadgePneu('AV_G', 'Avant Gauche (AV-G)')}
                  <div className="h-0.5 flex-1 bg-slate-600 relative">
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-slate-700 text-[10px] rounded text-slate-300 font-mono">
                      Essieu 1
                    </span>
                  </div>
                  {renderBadgePneu('AV_D', 'Avant Droit (AV-D)')}
                </div>

                {/* Essieu 2 (Arrière ou Motrice) */}
                <div className="flex items-center justify-between gap-8">
                  <div className="flex gap-2">
                    {pneusVehicule.some(p => p.position === 'AR_G_EXT') && renderBadgePneu('AR_G_EXT', 'AR-G Ext')}
                    {renderBadgePneu('AR_G', 'Arrière Gauche (AR-G)')}
                  </div>
                  <div className="h-0.5 flex-1 bg-slate-600 relative">
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-slate-700 text-[10px] rounded text-slate-300 font-mono">
                      Essieu 2 (Pont)
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {renderBadgePneu('AR_D', 'Arrière Droit (AR-D)')}
                    {pneusVehicule.some(p => p.position === 'AR_D_EXT') && renderBadgePneu('AR_D_EXT', 'AR-D Ext')}
                  </div>
                </div>

                {/* Roue de secours */}
                <div className="text-center pt-2 border-t border-slate-700 flex justify-center">
                  {renderBadgePneu('SECOURS', 'Roue de Secours')}
                </div>
              </div>

              <p className="text-center text-xs text-slate-400 italic">
                Cliquez sur un pneu dans le schéma ci-dessus pour inspecter son usure, son historique de permutations et de remplacement.
              </p>
            </div>

            {/* Détail de la pièce sélectionnée si clic */}
            {selectedPiece && (
              <div className="bg-indigo-50 border-2 border-indigo-200 p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-indigo-700" />
                    <div>
                      <h4 className="font-extrabold text-sm text-indigo-950">
                        Fiche Composant : {selectedPiece.designation} ({selectedPiece.numero_serie})
                      </h4>
                      <p className="text-xs text-indigo-700 font-mono">
                        Position : {selectedPiece.position} • Marque : {selectedPiece.marque || 'N/A'} • Dimensions : {selectedPiece.dimensions || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemplacerPiece?.(vehicule, selectedPiece)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Remplacer cette pièce
                  </button>
                </div>

                {/* Historique des permutations */}
                {selectedPiece.historique_permutations && selectedPiece.historique_permutations.length > 0 && (
                  <div className="bg-white p-3.5 rounded-xl border border-indigo-100 space-y-2">
                    <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                      <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600" /> Historique des permutations
                    </span>
                    <div className="space-y-1.5">
                      {selectedPiece.historique_permutations.map((perm, i) => (
                        <div key={i} className="text-xs flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <div>
                            <span className="font-bold text-slate-800">
                              {perm.ancienne_position} → {perm.nouvelle_position}
                            </span>
                            <span className="text-slate-500 text-[11px] ml-2">({perm.motif})</span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-600">
                            {perm.date} à {perm.kilometrage} km • Opérateur: {perm.operateur}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Historique des remplacements */}
                {selectedPiece.historique_remplacements && selectedPiece.historique_remplacements.length > 0 && (
                  <div className="bg-white p-3.5 rounded-xl border border-indigo-100 space-y-2">
                    <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 text-indigo-600" /> Historique des remplacements
                    </span>
                    <div className="space-y-1.5">
                      {selectedPiece.historique_remplacements.map((remp, i) => (
                        <div key={i} className="text-xs flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <div>
                            <span className="font-bold text-slate-800">Ancien N° : {remp.ancien_numero_serie}</span>
                            <span className="text-slate-500 text-[11px] ml-2">Motif : {remp.motif} ({remp.note || ''})</span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-600">
                            {remp.date} • {remp.cout_dzd ? `${remp.cout_dzd.toLocaleString()} DZD` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tableau complet de tous les composants du matériel */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Inventaire détaillé des composants suivis ({piecesVehicule.length})
                </h4>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Désignation</th>
                    <th className="py-3 px-4">N° de Série</th>
                    <th className="py-3 px-4">Position</th>
                    <th className="py-3 px-4">Date Install.</th>
                    <th className="py-3 px-4">État</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {piecesVehicule.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-bold text-indigo-600">{p.type}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900">{p.designation}</span>
                        {p.dimensions && <span className="text-slate-500 text-[11px] block">{p.dimensions}</span>}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium">{p.numero_serie}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{p.position}</td>
                      <td className="py-3 px-4 text-slate-600">{p.date_installation}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.etat === 'ACTIF' || p.etat === 'NEUF' || p.etat === 'BON'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.etat === 'A_REMPLACER' || p.etat === 'HORS_SERVICE'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {p.etat}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onRemplacerPiece?.(vehicule, p)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-bold text-[11px] transition"
                        >
                          Remplacer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ONGLET 3 : HISTORIQUE DES AFFECTATIONS ET DÉPLACEMENTS */}
        {activeTab === 'AFFECTATIONS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                Traçabilité des Déplacements et Affectations Chantiers
              </h3>
              <button
                onClick={() => onAffecterChantier?.(vehicule)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" /> Nouvelle Affectation
              </button>
            </div>

            <div className="space-y-3">
              {vehicule.historique_affectations && vehicule.historique_affectations.length > 0 ? (
                vehicule.historique_affectations.map((aff, i) => (
                  <div key={aff.id || i} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{aff.chantier_nom}</span>
                        {!aff.date_fin && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Affectation Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Conducteur attitré : <strong>{aff.conducteur_nom || 'Non spécifié'}</strong>
                      </p>
                      {aff.motif && (
                        <p className="text-xs text-slate-500 italic">
                          Motif : {aff.motif}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-xs space-y-1">
                      <p className="font-mono text-slate-700">
                        {aff.date_debut} → {aff.date_fin || 'À ce jour'}
                      </p>
                      {aff.bon_transfert_ref && (
                        <p className="text-[11px] font-mono text-indigo-600 font-bold">
                          Réf Bon: {aff.bon_transfert_ref}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-xs">
                  Aucun historique d'affectation disponible pour ce véhicule.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ONGLET 4 : ENTRETIENS, VIDANGES & RÉPARATIONS */}
        {activeTab === 'ENTRETIENS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                Journal Chronologique des Interventions & Réparations ({entretiensVehicule.length})
              </h3>
              <button
                onClick={() => onEnregistrerEntretien?.(vehicule)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Enregistrer Entretien
              </button>
            </div>

            <div className="space-y-3">
              {entretiensVehicule.map(e => (
                <div key={e.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        e.type === 'VIDANGE' ? 'bg-indigo-100 text-indigo-800' :
                        e.type === 'PANNE' ? 'bg-rose-100 text-rose-800' :
                        e.type === 'CONTROLE_TECHNIQUE' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-200 text-slate-800'
                      }`}>
                        {e.type}
                      </span>
                      <span className="font-bold text-sm text-slate-900">{e.description}</span>
                    </div>
                    <span className="text-sm font-mono font-extrabold text-indigo-600">
                      {e.cout.toLocaleString()} DZD
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-[11px] text-slate-600 pt-1">
                    <div>Date : <strong className="text-slate-800">{e.date}</strong></div>
                    <div>Compteur : <span className="font-mono">{e.kilometrage_entretien || e.heures_entretien} {e.kilometrage_entretien ? 'km' : 'heures'}</span></div>
                    <div>Intervenant : <strong>{e.garage_nom || e.prestataire || 'Interne'}</strong></div>
                    {e.facture_ref && <div>Facture N° : <span className="font-mono text-indigo-600">{e.facture_ref}</span></div>}
                  </div>

                  {e.piece_rechange_utilisee && (
                    <div className="text-[11px] bg-white p-2 rounded-lg border border-slate-200 text-slate-700">
                      <strong>Fournitures / Pièces utilisées :</strong> {e.piece_rechange_utilisee}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ONGLET 5 : DÉPENSES, FACTURES & TCO */}
        {activeTab === 'DEPENSES' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 text-white p-6 rounded-2xl">
                <span className="text-xs uppercase text-slate-400 font-bold">Total Cost of Ownership (TCO)</span>
                <p className="text-3xl font-mono font-extrabold mt-1 text-indigo-400">
                  {depenses.totalDepenses.toLocaleString()} DZD
                </p>
                <p className="text-xs text-slate-300 mt-2">Dépenses cumulées d'entretien, réparations et assurance.</p>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <span className="text-xs uppercase text-slate-500 font-bold">Total Maintenance & Réparations</span>
                <p className="text-2xl font-mono font-extrabold mt-1 text-slate-900">
                  {depenses.coutEntretiens.toLocaleString()} DZD
                </p>
                <p className="text-xs text-slate-500 mt-2">{depenses.nbOperations} interventions au total.</p>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <span className="text-xs uppercase text-slate-500 font-bold">Prime Annuelle d'Assurance</span>
                <p className="text-2xl font-mono font-extrabold mt-1 text-slate-900">
                  {depenses.coutAssurance.toLocaleString()} DZD
                </p>
                <p className="text-xs text-slate-500 mt-2">{vehicule.assurance_compagnie || 'Assurance'} ({vehicule.assurance_police || 'N/A'})</p>
              </div>
            </div>

            {/* Répartition des dépenses par type */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="font-bold text-sm text-slate-900">Répartition des Coûts par Catégorie de Dépense</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(depenses.repartitionParType).map(([type, total]) => (
                  <div key={type} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-xs text-slate-800">{type}</span>
                      <span className="text-[11px] text-slate-500 block">Dépense cumulée</span>
                    </div>
                    <span className="font-mono font-extrabold text-sm text-indigo-600">
                      {total.toLocaleString()} DZD
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
