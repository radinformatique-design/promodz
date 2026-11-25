'use client';

import React, { useState, useMemo } from 'react';
import {
  HardHat,
  Plus,
  MapPin,
  Building,
  CheckCircle2,
  X,
  Users,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  Chantier,
  ChantierStatut,
  CategorieProfessionnelle
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

export const ChantiersView: React.FC = () => {
  const {
    chantiers,
    addChantier,
    setSelectedChantierId,
    selectedChantierId,
    employes,
    setActiveNav
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'projets' | 'equipe'>('projets');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedChantierDetail, setSelectedChantierDetail] = useState<Chantier | null>(null);

  // Chantier filtré pour l'onglet équipe
  const [equipeChantierFilter, setEquipeChantierFilter] = useState<string>(
    selectedChantierId !== 'ALL' ? selectedChantierId : (chantiers[0]?.id || 'ALL')
  );

  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const showToast = (text: string, isError = false) => {
    setToastMessage({ text, isError });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Ouvriers affectés au(x) chantier(s)
  const assignedWorkers = useMemo(() => {
    if (equipeChantierFilter === 'ALL') {
      return employes.filter(e => e.chantier_actuel_id && e.chantier_actuel_id !== 'siege');
    }
    return employes.filter(e => e.chantier_actuel_id === equipeChantierFilter);
  }, [employes, equipeChantierFilter]);

  // Form State Création Chantier
  const [formData, setFormData] = useState({
    nom_projet: '',
    code_chantier: '',
    wilaya: 'Alger (16)',
    commune: 'Bouchaoui',
    adresse_site: '',
    superficie_terrain_m2: 3200,
    surface_plancher_m2: 11500,
    nombre_logements: 80,
    nombre_locaux_commerciaux: 6,
    nombre_niveaux: '2SS + RDC + 9',
    permis_construire_ref: '',
    date_ouverture_chantier: new Date().toISOString().split('T')[0],
    date_livraison_prevue: '2027-12-31',
    budget_global_prevu: 1500000000,
    statut: 'ETUDE_FONCIERE' as ChantierStatut,
    bureau_etudes: 'Cabinet d’Architecture & Génie Civil',
    organisme_ctc: 'CTC Centre'
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom_projet) return;

    addChantier({
      ...formData,
      code_chantier: formData.code_chantier || `CHT-ALG-${Date.now().toString().slice(-4)}`
    });

    setIsCreateModalOpen(false);
    showToast(`Chantier "${formData.nom_projet}" créé avec succès.`);
  };

  const formatDZD = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium border transition-all ${
            toastMessage.isError
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {toastMessage.isError ? (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Banner avec onglets intégrés */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-1">
              <HardHat className="w-4 h-4" />
              <span>Gestion Multi-Chantiers & Pilotage Terrain</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Entités Chantiers & Gestion du Parc Projets
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Chaque chantier est modélisé comme une entité autonome rattachée à l'entreprise avec ses équipes et ses budgets DZD.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Ouvrir un nouveau chantier</span>
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('projets')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeSubTab === 'projets'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Building className="w-4 h-4" />
            Entités Chantiers ({chantiers.length})
          </button>
          <button
            onClick={() => setActiveSubTab('equipe')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeSubTab === 'equipe'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Équipes & Effectifs Chantier ({assignedWorkers.length})
          </button>
        </div>
      </div>

      {/* SOUS-ONGLET 1 : PROJETS ET FICHES CHANTIERS */}
      {activeSubTab === 'projets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {chantiers.map((chantier) => {
            const ratioBudget = Math.round((chantier.budget_engage / chantier.budget_global_prevu) * 100);
            const isCurrentActive = selectedChantierId === chantier.id;
            const siteWorkersCount = employes.filter(e => e.chantier_actuel_id === chantier.id).length;

            return (
              <div
                key={chantier.id}
                className={`bg-white rounded-xl border transition-all shadow-xs flex flex-col ${
                  isCurrentActive ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="font-mono text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {chantier.code_chantier}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base mt-1.5">
                        {chantier.nom_projet}
                      </h3>
                    </div>

                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {chantier.statut.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{chantier.commune}, {chantier.wilaya}</span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                    {chantier.description || 'Projet résidentiel en cours de réalisation.'}
                  </p>

                  {/* Technical stats mini grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Unités logements</span>
                      <span className="font-bold text-slate-800 font-mono">{chantier.nombre_logements}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Effectif affecté</span>
                      <span className="font-bold text-purple-700 font-mono">{siteWorkersCount} ouvriers</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Surface Plancher</span>
                      <span className="font-mono text-slate-800 text-[11px]">{chantier.surface_plancher_m2.toLocaleString()} m²</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Organisme CTC</span>
                      <span className="text-slate-800 text-[11px] truncate block">{chantier.organisme_ctc || 'CTC Régional'}</span>
                    </div>
                  </div>

                  {/* Progress bars */}
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between text-slate-600 mb-1 text-[11px]">
                        <span>Avancement physique</span>
                        <span className="font-mono font-bold text-slate-900">{chantier.taux_avancement_physique}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${chantier.taux_avancement_physique}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-600 mb-1 text-[11px]">
                        <span>Budget consommé ({ratioBudget}%)</span>
                        <span className="font-mono text-slate-900">{formatDZD(chantier.budget_engage)}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${ratioBudget > 85 ? 'bg-amber-500' : 'bg-blue-600'}`}
                          style={{ width: `${Math.min(ratioBudget, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 rounded-b-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedChantierDetail(chantier)}
                      className="font-medium text-slate-700 hover:text-slate-900"
                    >
                      Fiche technique
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      onClick={() => setActiveNav('pointage')}
                      className="font-semibold text-purple-700 hover:text-purple-800"
                    >
                      Pointage ouvriers
                    </button>
                  </div>

                  <button
                    onClick={() => setSelectedChantierId(chantier.id)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      isCurrentActive
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {isCurrentActive ? 'Chantier Actif' : 'Sélectionner'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SOUS-ONGLET 2 : EFFECTIFS AFFECTÉS AU CHANTIER */}
      {activeSubTab === 'equipe' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                Liste Nominative des Ouvriers Affectés au Chantier
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Personnel actif sous la supervision du conducteur de travaux.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                {assignedWorkers.length} ouvriers actifs
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedWorkers.map(worker => (
              <div key={worker.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{worker.nom} {worker.prenom}</h4>
                      <p className="text-[11px] font-mono text-slate-500">{worker.matricule}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                      {CATEGORIE_LABELS[worker.categorie]}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-slate-600">
                    <p>Qualification : <strong className="text-slate-800">{worker.qualification}</strong></p>
                    <p>Contrat : <strong className="text-slate-800">{worker.type_contrat}</strong></p>
                    <p>N° CNAS : <span className="font-mono">{worker.num_cnas}</span></p>
                    <p>Tél : <span className="font-semibold">{worker.telephone}</span></p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Affecté le {worker.date_affectation_actuelle}</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    En poste
                  </span>
                </div>
              </div>
            ))}

            {assignedWorkers.length === 0 && (
              <div className="col-span-full py-8 text-center text-slate-500 text-xs">
                Aucun ouvrier n'est actuellement affecté à ce chantier.
              </div>
            )}
          </div>
        </div>
      )}

      {/* DETAIL DRAWER / MODAL CHANTIER */}
      {selectedChantierDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-xl border border-slate-200 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {selectedChantierDetail.code_chantier}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase font-semibold">
                    {selectedChantierDetail.statut}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-lg mt-1">
                  {selectedChantierDetail.nom_projet}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedChantierDetail.commune}, {selectedChantierDetail.wilaya} · {selectedChantierDetail.adresse_site}
                </p>
              </div>

              <button
                onClick={() => setSelectedChantierDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Assiette Foncière</span>
                <span className="text-base font-bold font-mono text-slate-900">{selectedChantierDetail.superficie_terrain_m2.toLocaleString()} m²</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Surface de Plancher</span>
                <span className="text-base font-bold font-mono text-slate-900">{selectedChantierDetail.surface_plancher_m2.toLocaleString()} m²</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Budget d'Investissement</span>
                <span className="text-xs font-bold font-mono text-slate-900">{formatDZD(selectedChantierDetail.budget_global_prevu)}</span>
              </div>
            </div>

            {/* Intervenants & Organismes */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2 text-xs mb-6">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Partenaires & Organismes Agréés en Algérie
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[11px]">Bureau d'Études Techniques (BET) :</span>
                  <span className="font-semibold text-slate-800">{selectedChantierDetail.bureau_etudes || 'Non spécifié'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Organisme de Contrôle Technique (CTC) :</span>
                  <span className="font-semibold text-slate-800">{selectedChantierDetail.organisme_ctc || 'CTC Régional'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Permis de Construire :</span>
                  <span className="font-semibold text-slate-800">{selectedChantierDetail.permis_construire_ref || 'En cours'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Date Prévisionnelle de Réception :</span>
                  <span className="font-semibold text-slate-800">{new Date(selectedChantierDetail.date_livraison_prevue).toLocaleDateString('fr-DZ')}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setSelectedChantierId(selectedChantierDetail.id);
                  setSelectedChantierDetail(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Sélectionner ce chantier
              </button>
              <button
                onClick={() => setSelectedChantierDetail(null)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE CHANTIER */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">
                  Ouverture d'une nouvelle Entité Chantier
                </h3>
                <p className="text-xs text-slate-500">
                  Rattachement relationnel immédiat à l'entreprise de promotion immobilière.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Nom du projet immobilier *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Résidence El Bahia"
                    value={formData.nom_projet}
                    onChange={(e) => setFormData({ ...formData, nom_projet: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Code de référence chantier
                  </label>
                  <input
                    type="text"
                    placeholder="ex: CHT-ALG-2024-04"
                    value={formData.code_chantier}
                    onChange={(e) => setFormData({ ...formData, code_chantier: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Wilaya (Algérie) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.wilaya}
                    onChange={(e) => setFormData({ ...formData, wilaya: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Commune
                  </label>
                  <input
                    type="text"
                    value={formData.commune}
                    onChange={(e) => setFormData({ ...formData, commune: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">
                    Adresse précise du terrain / site
                  </label>
                  <input
                    type="text"
                    placeholder="ex: Route Nationale 11, Bordj El Kiffan"
                    value={formData.adresse_site}
                    onChange={(e) => setFormData({ ...formData, adresse_site: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Budget d'investissement prévisionnel (DZD) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.budget_global_prevu}
                    onChange={(e) => setFormData({ ...formData, budget_global_prevu: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Date prévisionnelle de livraison
                  </label>
                  <input
                    type="date"
                    value={formData.date_livraison_prevue}
                    onChange={(e) => setFormData({ ...formData, date_livraison_prevue: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Créer et enregistrer le chantier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
