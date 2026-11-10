'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  BienImmobilier,
  StatutBienImmobilier,
  ClientProspect,
  ReservationVenteVEFA,
  TrancheEcheancierVEFA
} from '../types/database';
import {
  Building2,
  Home,
  Users,
  FileCheck,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  Ban,
  DollarSign,
  Calendar,
  Layers,
  Compass,
  Maximize2,
  FileText,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  AlertCircle,
  TrendingUp,
  X,
  CreditCard
} from 'lucide-react';

export const CommercialView: React.FC = () => {
  const {
    biensImmobiliers,
    clientsProspects,
    reservationsVEFA,
    allChantiers,
    selectedChantierId,
    ajouterBienImmobilier,
    changerStatutBienImmobilier,
    ajouterClientProspect,
    creerReservationVEFA,
    currentUser,
    hasPermission
  } = useApp();

  const [activeTab, setActiveTab] = useState<'catalogue' | 'crm' | 'vefa'>('catalogue');

  // Filters for Catalogue
  const [filterChantier, setFilterChantier] = useState<string>(selectedChantierId !== 'ALL' ? selectedChantierId : 'ALL');
  const [filterStatut, setFilterStatut] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [selectedBienDetail, setSelectedBienDetail] = useState<BienImmobilier | null>(null);
  const [showAddBienModal, setShowAddBienModal] = useState<boolean>(false);
  const [showAddProspectModal, setShowAddProspectModal] = useState<boolean>(false);
  const [showAddReservationModal, setShowAddReservationModal] = useState<boolean>(false);
  const [selectedReservationDetail, setSelectedReservationDetail] = useState<ReservationVenteVEFA | null>(null);
  const [showStatusChangeModal, setShowStatusChangeModal] = useState<boolean>(false);
  const [bienForStatusChange, setBienForStatusChange] = useState<BienImmobilier | null>(null);

  // Form states
  const [newBien, setNewBien] = useState({
    reference: '',
    chantier_id: allChantiers[0]?.id || '',
    batiment_bloc: 'Bloc A',
    etage: 'RDC',
    num_porte: 'A-01',
    type_bien: 'LOGEMENT_F3' as const,
    orientation: 'SUD' as const,
    superficie_habitable_m2: 85,
    superficie_utile_m2: 92,
    superficie_terrasse_m2: 12,
    prix_vente_dzd: 14500000,
    prix_m2_dzd: 170588,
    statut: 'DISPONIBLE' as StatutBienImmobilier
  });

  const [newProspect, setNewProspect] = useState({
    nom: '',
    prenom: '',
    nin: '',
    telephone: '',
    email: '',
    adresse: '',
    wilaya: 'Alger (16)',
    type: 'PROSPECT' as const,
    budget_max_dzd: 18000000,
    typologie_recherchee: 'F3 / F4',
    canal_acquisition: 'PASSAGE_AGENCE' as const,
    chantier_interet_id: allChantiers[0]?.id || ''
  });

  const [newReservation, setNewReservation] = useState({
    bienId: '',
    clientId: '',
    notaireNom: 'Maître Benchikh Mustapha - Notaire à Alger',
    prixConvenu: 15000000
  });

  const [statusChangeForm, setStatusChangeForm] = useState({
    statut: 'OPTION_RESERVATION' as StatutBienImmobilier,
    clientNom: '',
    clientTel: '',
    remarques: ''
  });

  // Filtered lists
  const filteredBiens = biensImmobiliers.filter(bien => {
    if (filterChantier !== 'ALL' && bien.chantier_id !== filterChantier) return false;
    if (filterStatut !== 'ALL' && bien.statut !== filterStatut) return false;
    if (filterType !== 'ALL' && bien.type_bien !== filterType) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        bien.reference.toLowerCase().includes(q) ||
        bien.chantier_nom.toLowerCase().includes(q) ||
        bien.batiment_bloc.toLowerCase().includes(q) ||
        (bien.client_reservataire_nom && bien.client_reservataire_nom.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const filteredClients = clientsProspects.filter(cli => {
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        cli.nom.toLowerCase().includes(q) ||
        cli.prenom.toLowerCase().includes(q) ||
        cli.telephone.includes(q) ||
        cli.nin.includes(q) ||
        cli.numero_fiche.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // KPI Calculations
  const totalBiens = biensImmobiliers.length;
  const disponiblesCount = biensImmobiliers.filter(b => b.statut === 'DISPONIBLE').length;
  const reservesCount = biensImmobiliers.filter(b => b.statut === 'RESERVE' || b.statut === 'OPTION_RESERVATION').length;
  const vendusCount = biensImmobiliers.filter(b => b.statut === 'VENDU').length;
  const totalEncaisseVEFA = reservationsVEFA.reduce((acc, r) => acc + r.montant_encaisse_dzd, 0);
  const totalSoldeVEFA = reservationsVEFA.reduce((acc, r) => acc + r.solde_restant_dzd, 0);

  // Status helper badges
  const getStatusBadge = (statut: StatutBienImmobilier) => {
    switch (statut) {
      case 'DISPONIBLE':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200"><CheckCircle2 className="w-3 h-3 me-1" /> Disponible</span>;
      case 'OPTION_RESERVATION':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200"><Clock className="w-3 h-3 me-1" /> Option Réservation</span>;
      case 'RESERVE':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"><FileCheck className="w-3 h-3 me-1" /> Réservé (VEFA)</span>;
      case 'VENDU':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200"><Building2 className="w-3 h-3 me-1" /> Vendu & Acté</span>;
      case 'ANNULE':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200"><Ban className="w-3 h-3 me-1" /> Annulé</span>;
      default:
        return null;
    }
  };

  const handleCreateBien = (e: React.FormEvent) => {
    e.preventDefault();
    const chantierObj = allChantiers.find(c => c.id === newBien.chantier_id);
    const prixM2 = Math.round(newBien.prix_vente_dzd / (newBien.superficie_habitable_m2 || 1));
    ajouterBienImmobilier({
      ...newBien,
      prix_m2_dzd: prixM2,
      chantier_nom: chantierObj?.nom_projet || 'Projet Immobilier'
    });
    setShowAddBienModal(false);
  };

  const handleCreateProspect = (e: React.FormEvent) => {
    e.preventDefault();
    const chantierObj = allChantiers.find(c => c.id === newProspect.chantier_interet_id);
    ajouterClientProspect({
      ...newProspect,
      chantier_interet_nom: chantierObj?.nom_projet
    });
    setShowAddProspectModal(false);
  };

  const handleCreateReservationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReservation.bienId || !newReservation.clientId) return;
    creerReservationVEFA({
      bienId: newReservation.bienId,
      clientId: newReservation.clientId,
      notaireNom: newReservation.notaireNom,
      prixConvenu: newReservation.prixConvenu
    });
    setShowAddReservationModal(false);
  };

  const handleChangeStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bienForStatusChange) return;
    changerStatutBienImmobilier(
      bienForStatusChange.id,
      statusChangeForm.statut,
      statusChangeForm.clientNom,
      statusChangeForm.clientTel,
      statusChangeForm.remarques
    );
    setShowStatusChangeModal(false);
    setBienForStatusChange(null);
    if (selectedBienDetail && selectedBienDetail.id === bienForStatusChange.id) {
      setSelectedBienDetail(prev => prev ? { ...prev, statut: statusChangeForm.statut } : null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner & Title */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Module Commercial & Promotion Immobilière</h1>
                <p className="text-sm text-slate-500">
                  Gestion des programmes immobiliers, catalogue des lots, CRM prospects et contrats de vente VEFA (Loi 11-04)
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === 'catalogue' && (
              <button
                onClick={() => setShowAddBienModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg flex items-center gap-2 shadow-sm transition"
              >
                <Plus className="w-4 h-4" /> Nouveau Lot Immobilier
              </button>
            )}
            {activeTab === 'crm' && (
              <button
                onClick={() => setShowAddProspectModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg flex items-center gap-2 shadow-sm transition"
              >
                <UserPlus className="w-4 h-4" /> Nouveau Prospect
              </button>
            )}
            {activeTab === 'vefa' && (
              <button
                onClick={() => setShowAddReservationModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg flex items-center gap-2 shadow-sm transition"
              >
                <FileCheck className="w-4 h-4" /> Nouvelle Réservation VEFA
              </button>
            )}
          </div>
        </div>

        {/* KPI Counter Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Lots</span>
            <div className="text-xl font-bold text-slate-900 mt-1">{totalBiens}</div>
            <span className="text-xs text-slate-500">Logements & Locaux</span>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Disponibles</span>
            <div className="text-xl font-bold text-emerald-800 mt-1">{disponiblesCount}</div>
            <span className="text-xs text-emerald-600">Prêts à la vente</span>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Options & Réservés</span>
            <div className="text-xl font-bold text-amber-800 mt-1">{reservesCount}</div>
            <span className="text-xs text-amber-600">En cours d'acquisition</span>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3.5">
            <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Vendus & Actés</span>
            <div className="text-xl font-bold text-purple-800 mt-1">{vendusCount}</div>
            <span className="text-xs text-purple-600">Contrats VEFA actés</span>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3.5">
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Recettes Encaissées</span>
            <div className="text-lg font-bold text-blue-900 mt-1">{totalEncaisseVEFA.toLocaleString('fr-DZ')} DZD</div>
            <span className="text-xs text-blue-600">Tranches réglées VEFA</span>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3.5">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Soldes à Recouvrer</span>
            <div className="text-lg font-bold text-rose-900 mt-1">{totalSoldeVEFA.toLocaleString('fr-DZ')} DZD</div>
            <span className="text-xs text-rose-600">Tranches à échoir</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2">
        <button
          onClick={() => setActiveTab('catalogue')}
          className={`px-4 py-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition ${
            activeTab === 'catalogue'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Home className="w-4 h-4" /> Catalogue & Grille des Biens ({filteredBiens.length})
        </button>

        <button
          onClick={() => setActiveTab('crm')}
          className={`px-4 py-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition ${
            activeTab === 'crm'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" /> CRM Prospects & Acquereurs ({clientsProspects.length})
        </button>

        <button
          onClick={() => setActiveTab('vefa')}
          className={`px-4 py-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition ${
            activeTab === 'vefa'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileCheck className="w-4 h-4" /> Contrats VEFA & Échéanciers ({reservationsVEFA.length})
        </button>
      </div>

      {/* TAB 1: CATALOGUE & GRILLE DES BIENS */}
      {activeTab === 'catalogue' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Rechercher par référence lot, bloc, acquéreur..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select
                value={filterChantier}
                onChange={e => setFilterChantier(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Tous les projets/chantiers</option>
                {allChantiers.map(c => (
                  <option key={c.id} value={c.id}>{c.nom_projet}</option>
                ))}
              </select>

              <select
                value={filterStatut}
                onChange={e => setFilterStatut(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="DISPONIBLE">Disponible</option>
                <option value="OPTION_RESERVATION">Option de réservation</option>
                <option value="RESERVE">Réservé (VEFA)</option>
                <option value="VENDU">Vendu & Acté</option>
                <option value="ANNULE">Annulé</option>
              </select>

              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Toutes typologies</option>
                <option value="LOGEMENT_F2">F2</option>
                <option value="LOGEMENT_F3">F3</option>
                <option value="LOGEMENT_F4">F4</option>
                <option value="LOGEMENT_F5">F5</option>
                <option value="DUPLEX">Duplex</option>
                <option value="LOCAL_COMMERCIAL">Local Commercial</option>
                <option value="BOX_PARKING">Box / Parking</option>
              </select>
            </div>
          </div>

          {/* Grid of Units */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBiens.map(bien => (
              <div
                key={bien.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                          {bien.batiment_bloc} • {bien.etage}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">Porte {bien.num_porte}</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mt-1">{bien.reference}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" /> {bien.chantier_nom}
                      </p>
                    </div>
                    {getStatusBadge(bien.statut)}
                  </div>

                  {/* Surface and Price details */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg text-xs my-3">
                    <div>
                      <span className="text-slate-500 block">Typologie</span>
                      <span className="font-semibold text-slate-800">{bien.type_bien.replace('_', ' ')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Superficie Habitable</span>
                      <span className="font-semibold text-slate-800">{bien.superficie_habitable_m2} m²</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Orientation</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <Compass className="w-3 h-3 text-blue-500" /> {bien.orientation}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Terrasse</span>
                      <span className="font-semibold text-slate-800">{bien.superficie_terrasse_m2} m²</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 mt-3 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block">Prix de vente total</span>
                      <span className="text-base font-bold text-blue-900">{bien.prix_vente_dzd.toLocaleString('fr-DZ')} DZD</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Prix / m²</span>
                      <span className="text-xs font-semibold text-slate-700">{bien.prix_m2_dzd.toLocaleString('fr-DZ')} DZD/m²</span>
                    </div>
                  </div>

                  {bien.client_reservataire_nom && (
                    <div className="mt-3 p-2.5 bg-blue-50/70 border border-blue-100 rounded-lg text-xs">
                      <span className="text-slate-500 font-medium block">Acquéreur / Réservataire :</span>
                      <div className="font-bold text-blue-900">{bien.client_reservataire_nom}</div>
                      {bien.client_reservataire_tel && (
                        <div className="text-slate-600 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" /> {bien.client_reservataire_tel}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedBienDetail(bien)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> Fiche Complète & Historique
                  </button>

                  <button
                    onClick={() => {
                      setBienForStatusChange(bien);
                      setStatusChangeForm({
                        statut: bien.statut,
                        clientNom: bien.client_reservataire_nom || '',
                        clientTel: bien.client_reservataire_tel || '',
                        remarques: ''
                      });
                      setShowStatusChangeModal(true);
                    }}
                    className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 px-2.5 py-1 rounded shadow-xs"
                  >
                    Changer Statut
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredBiens.length === 0 && (
            <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-700">Aucun lot ne correspond à la recherche</h3>
              <p className="text-sm text-slate-500 mt-1">Ajustez vos filtres ou ajoutez un nouveau bien immobilier au catalogue.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CRM CLIENTS & PROSPECTS */}
      {activeTab === 'crm' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Rechercher par nom, téléphone, NIN ou N° Fiche..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="text-sm text-slate-500">
              Total Fiches Prospects : <span className="font-bold text-slate-800">{clientsProspects.length}</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-700">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Fiche N°</th>
                    <th className="px-4 py-3">Nom & Prénom</th>
                    <th className="px-4 py-3">NIN (Identifiant National)</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Typologie & Budget</th>
                    <th className="px-4 py-3">Canal</th>
                    <th className="px-4 py-3">Statut CRM</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredClients.map(cli => (
                    <tr key={cli.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-mono font-bold text-xs text-blue-900">{cli.numero_fiche}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{cli.nom} {cli.prenom}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{cli.nin}</td>
                      <td className="px-4 py-3 text-xs">
                        <div className="flex items-center gap-1 font-semibold text-slate-800">
                          <Phone className="w-3.5 h-3.5 text-slate-400" /> {cli.telephone}
                        </div>
                        <div className="text-slate-500">{cli.email}</div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="font-bold text-emerald-800">{cli.budget_max_dzd.toLocaleString('fr-DZ')} DZD</div>
                        <div className="text-slate-500">Recherche : {cli.typologie_recherchee}</div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-medium">
                          {cli.canal_acquisition.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {cli.type === 'PROSPECT' && <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold">Prospect</span>}
                        {cli.type === 'ACQUEREUR_RESERVATAIRE' && <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold">Réservataire VEFA</span>}
                        {cli.type === 'PROPRIETAIRE_VEFA' && <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-semibold">Propriétaire</span>}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <button
                          onClick={() => {
                            setNewReservation(prev => ({
                              ...prev,
                              clientId: cli.id
                            }));
                            setShowAddReservationModal(true);
                          }}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded border border-indigo-200 transition"
                        >
                          Créer VEFA
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONTRATS VEFA & ÉCHÉANCIERS */}
      {activeTab === 'vefa' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1">Contrats de Vente en l'État Futur d'Achèvement (Loi 11-04)</h3>
            <p className="text-xs text-slate-500">
              Réglementation algérienne VEFA : 20% à la réservation, 15% fondations, 25% structure gros-œuvre, 20% second-œuvre, 20% remise des clefs.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {reservationsVEFA.map(res => (
              <div key={res.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-bold rounded font-mono">
                        {res.numero_contrat_vefa}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-purple-100 text-purple-800 rounded">
                        Acte Notarié
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">{res.client_nom} — Lot {res.bien_ref}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Notaire rédacteur : <span className="font-medium text-slate-700">{res.notaire_nom}</span> | NIN : {res.client_nin}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Prix Convenu total</span>
                    <span className="text-xl font-extrabold text-blue-900">{res.prix_total_convenu_dzd.toLocaleString('fr-DZ')} DZD</span>
                    <div className="flex items-center gap-3 text-xs mt-1 justify-end">
                      <span className="text-emerald-700 font-semibold">Encaissé : {res.montant_encaisse_dzd.toLocaleString('fr-DZ')} DZD</span>
                      <span className="text-rose-700 font-semibold">Solde : {res.solde_restant_dzd.toLocaleString('fr-DZ')} DZD</span>
                    </div>
                  </div>
                </div>

                {/* Echeancier Table */}
                <div className="mt-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" /> Échéancier Réglementaire des Tranches
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-600 font-semibold">
                        <tr>
                          <th className="px-3 py-2">Tranche / Phase</th>
                          <th className="px-3 py-2">% Exigé</th>
                          <th className="px-3 py-2">Montant DZD</th>
                          <th className="px-3 py-2">Échéance Prévue</th>
                          <th className="px-3 py-2">Réf. Reçu CPA / Banque</th>
                          <th className="px-3 py-2">Statut Règlement</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {res.echeancier_tranches.map(tranche => (
                          <tr key={tranche.id} className="hover:bg-slate-50">
                            <td className="px-3 py-2 font-medium text-slate-800">{tranche.libelle_tranche}</td>
                            <td className="px-3 py-2 font-bold text-slate-700">{tranche.pct_exige}%</td>
                            <td className="px-3 py-2 font-mono font-bold text-slate-900">{tranche.montant_tranche_dzd.toLocaleString('fr-DZ')} DZD</td>
                            <td className="px-3 py-2 text-slate-600">{tranche.date_echeance_prevue}</td>
                            <td className="px-3 py-2 font-mono text-slate-500">{tranche.reference_recu_cpa || '—'}</td>
                            <td className="px-3 py-2">
                              {tranche.statut === 'PAYEE' && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">PAYÉE</span>}
                              {tranche.statut === 'EXIGIBLE' && <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold">EXIGIBLE</span>}
                              {tranche.statut === 'EN_ATTENTE' && <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded">En Attente</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: FICHE COMPLÈTE DU LOGEMENT / LOCAL */}
      {selectedBienDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                    Fiche Lot Technique & Commerciale
                  </span>
                  {getStatusBadge(selectedBienDetail.statut)}
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-1">Lot Réf : {selectedBienDetail.reference}</h2>
              </div>
              <button onClick={() => setSelectedBienDetail(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Core Features */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block">Programme / Chantier</span>
                  <span className="font-bold text-slate-900">{selectedBienDetail.chantier_nom}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Bloc & Niveau</span>
                  <span className="font-bold text-slate-900">{selectedBienDetail.batiment_bloc} — {selectedBienDetail.etage}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Typologie</span>
                  <span className="font-bold text-slate-900">{selectedBienDetail.type_bien.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Orientation</span>
                  <span className="font-bold text-slate-900">{selectedBienDetail.orientation}</span>
                </div>
              </div>

              {/* Surfaces & Pricing */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Maximize2 className="w-4 h-4 text-blue-600" /> Superficies et Valorisation Financière
                </h4>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-blue-50/50 rounded-lg">
                    <span className="text-slate-500 block">Surf. Habitable</span>
                    <span className="text-base font-bold text-blue-900">{selectedBienDetail.superficie_habitable_m2} m²</span>
                  </div>
                  <div className="p-3 bg-blue-50/50 rounded-lg">
                    <span className="text-slate-500 block">Surf. Utile</span>
                    <span className="text-base font-bold text-blue-900">{selectedBienDetail.superficie_utile_m2} m²</span>
                  </div>
                  <div className="p-3 bg-blue-50/50 rounded-lg">
                    <span className="text-slate-500 block">Surf. Terrasse</span>
                    <span className="text-base font-bold text-blue-900">{selectedBienDetail.superficie_terrasse_m2} m²</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <div>
                    <span className="text-xs text-slate-500 block">Prix de vente global DZD</span>
                    <span className="text-xl font-extrabold text-blue-900">{selectedBienDetail.prix_vente_dzd.toLocaleString('fr-DZ')} DZD</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Ratio Prix au m²</span>
                    <span className="text-sm font-bold text-slate-700">{selectedBienDetail.prix_m2_dzd.toLocaleString('fr-DZ')} DZD / m²</span>
                  </div>
                </div>
              </div>

              {/* Commercial History */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" /> Historique des Événements Commerciaux
                </h4>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {selectedBienDetail.historique_commercial.map(hist => (
                    <div key={hist.id} className="p-3 text-xs flex items-start gap-3">
                      <div className="p-1.5 bg-slate-100 rounded text-slate-600 mt-0.5">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between font-semibold text-slate-800">
                          <span>{hist.action} par {hist.auteur}</span>
                          <span className="text-slate-400 font-normal">{hist.date}</span>
                        </div>
                        <p className="text-slate-600 mt-0.5">{hist.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOUVEAU LOT IMMOBILIER */}
      {showAddBienModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full border border-slate-200 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Ajouter un Lot au Catalogue</h3>
              <button onClick={() => setShowAddBienModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBien} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chantier / Programme</label>
                <select
                  value={newBien.chantier_id}
                  onChange={e => setNewBien({ ...newBien, chantier_id: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  required
                >
                  {allChantiers.map(c => (
                    <option key={c.id} value={c.id}>{c.nom_projet}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Référence Lot</label>
                  <input
                    type="text"
                    placeholder="ex: CHT1-A-F3-04"
                    value={newBien.reference}
                    onChange={e => setNewBien({ ...newBien, reference: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bloc</label>
                  <input
                    type="text"
                    value={newBien.batiment_bloc}
                    onChange={e => setNewBien({ ...newBien, batiment_bloc: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Étage</label>
                  <input
                    type="text"
                    value={newBien.etage}
                    onChange={e => setNewBien({ ...newBien, etage: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Typologie</label>
                  <select
                    value={newBien.type_bien}
                    onChange={e => setNewBien({ ...newBien, type_bien: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  >
                    <option value="LOGEMENT_F2">Logement F2</option>
                    <option value="LOGEMENT_F3">Logement F3</option>
                    <option value="LOGEMENT_F4">Logement F4</option>
                    <option value="LOGEMENT_F5">Logement F5</option>
                    <option value="DUPLEX">Duplex</option>
                    <option value="LOCAL_COMMERCIAL">Local Commercial</option>
                    <option value="BOX_PARKING">Box / Parking</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Orientation</label>
                  <select
                    value={newBien.orientation}
                    onChange={e => setNewBien({ ...newBien, orientation: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  >
                    <option value="SUD">SUD</option>
                    <option value="NORD">NORD</option>
                    <option value="EST">EST</option>
                    <option value="OUEST">OUEST</option>
                    <option value="NORD_EST">NORD-EST</option>
                    <option value="SUD_OUEST">SUD-OUEST</option>
                    <option value="DOUBLE_FACADE">DOUBLE FAÇADE</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Surf. Habitable (m²)</label>
                  <input
                    type="number"
                    value={newBien.superficie_habitable_m2}
                    onChange={e => setNewBien({ ...newBien, superficie_habitable_m2: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Surf. Utile (m²)</label>
                  <input
                    type="number"
                    value={newBien.superficie_utile_m2}
                    onChange={e => setNewBien({ ...newBien, superficie_utile_m2: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Terrasse (m²)</label>
                  <input
                    type="number"
                    value={newBien.superficie_terrasse_m2}
                    onChange={e => setNewBien({ ...newBien, superficie_terrasse_m2: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Prix de Vente Total (DZD)</label>
                <input
                  type="number"
                  value={newBien.prix_vente_dzd}
                  onChange={e => setNewBien({ ...newBien, prix_vente_dzd: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded-lg font-bold text-blue-900"
                  required
                />
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddBienModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                >
                  Enregistrer au Catalogue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOUVEAU PROSPECT */}
      {showAddProspectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full border border-slate-200 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Créer une Fiche Prospect CRM</h3>
              <button onClick={() => setShowAddProspectModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProspect} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nom</label>
                  <input
                    type="text"
                    value={newProspect.nom}
                    onChange={e => setNewProspect({ ...newProspect, nom: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prénom</label>
                  <input
                    type="text"
                    value={newProspect.prenom}
                    onChange={e => setNewProspect({ ...newProspect, prenom: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIN (Identifiant National)</label>
                  <input
                    type="text"
                    placeholder="18 chiffres"
                    value={newProspect.nin}
                    onChange={e => setNewProspect({ ...newProspect, nin: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={newProspect.telephone}
                    onChange={e => setNewProspect({ ...newProspect, telephone: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Adresse Email</label>
                <input
                  type="email"
                  value={newProspect.email}
                  onChange={e => setNewProspect({ ...newProspect, email: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Budget Max (DZD)</label>
                  <input
                    type="number"
                    value={newProspect.budget_max_dzd}
                    onChange={e => setNewProspect({ ...newProspect, budget_max_dzd: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Typologie Recherchée</label>
                  <input
                    type="text"
                    value={newProspect.typologie_recherchee}
                    onChange={e => setNewProspect({ ...newProspect, typologie_recherchee: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProspectModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg"
                >
                  Enregistrer Prospect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOUVELE RÉSERVATION VEFA */}
      {showAddReservationModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full border border-slate-200 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Nouvelle Réservation Contrat VEFA (Loi 11-04)</h3>
              <button onClick={() => setShowAddReservationModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReservationSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sélectionner le Lot Disponibles</label>
                <select
                  value={newReservation.bienId}
                  onChange={e => {
                    const selected = biensImmobiliers.find(b => b.id === e.target.value);
                    setNewReservation({
                      ...newReservation,
                      bienId: e.target.value,
                      prixConvenu: selected ? selected.prix_vente_dzd : 15000000
                    });
                  }}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  required
                >
                  <option value="">-- Choisir un bien disponible --</option>
                  {biensImmobiliers.filter(b => b.statut === 'DISPONIBLE' || b.statut === 'OPTION_RESERVATION').map(b => (
                    <option key={b.id} value={b.id}>
                      {b.reference} — {b.type_bien.replace('_', ' ')} ({b.superficie_habitable_m2}m²) — {b.prix_vente_dzd.toLocaleString('fr-DZ')} DZD
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sélectionner l'Acquéreur / Client</label>
                <select
                  value={newReservation.clientId}
                  onChange={e => setNewReservation({ ...newReservation, clientId: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  required
                >
                  <option value="">-- Choisir un prospect / client --</option>
                  {clientsProspects.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nom} {c.prenom} (NIN : {c.nin})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notaire Rédacteur de l'Acte VEFA</label>
                <input
                  type="text"
                  value={newReservation.notaireNom}
                  onChange={e => setNewReservation({ ...newReservation, notaireNom: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Prix Convenu Final (DZD)</label>
                <input
                  type="number"
                  value={newReservation.prixConvenu}
                  onChange={e => setNewReservation({ ...newReservation, prixConvenu: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded-lg font-bold text-indigo-900"
                  required
                />
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-900 text-xs">
                <span className="font-bold block">Génération Automatique de l'Échéancier VEFA (Loi 11-04) :</span>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-indigo-800">
                  <li>Tranche 1 (20%) : Réservation & Signature Acte</li>
                  <li>Tranche 2 (15%) : Achèvement des Fondations</li>
                  <li>Tranche 3 (25%) : Achèvement du Gros-œuvre (Structure)</li>
                  <li>Tranche 4 (20%) : Achèvement du Second-œuvre</li>
                  <li>Tranche 5 (20%) : Remise des Clefs & Livraison</li>
                </ul>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddReservationModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg"
                >
                  Générer Contrat VEFA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHANGER STATUT DU BIEN */}
      {showStatusChangeModal && bienForStatusChange && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Changer Statut : {bienForStatusChange.reference}</h3>
              <button onClick={() => setShowStatusChangeModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangeStatusSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nouveau Statut</label>
                <select
                  value={statusChangeForm.statut}
                  onChange={e => setStatusChangeForm({ ...statusChangeForm, statut: e.target.value as any })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                >
                  <option value="DISPONIBLE">Disponible</option>
                  <option value="OPTION_RESERVATION">Option de Réservation</option>
                  <option value="RESERVE">Réservé (VEFA)</option>
                  <option value="VENDU">Vendu & Acté</option>
                  <option value="ANNULE">Annulé</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nom du Client Acquéreur</label>
                <input
                  type="text"
                  value={statusChangeForm.clientNom}
                  onChange={e => setStatusChangeForm({ ...statusChangeForm, clientNom: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  placeholder="ex: Khelifa Mourad"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Téléphone Client</label>
                <input
                  type="text"
                  value={statusChangeForm.clientTel}
                  onChange={e => setStatusChangeForm({ ...statusChangeForm, clientTel: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  placeholder="ex: 0550 12 34 56"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Remarques / Motif</label>
                <textarea
                  value={statusChangeForm.remarques}
                  onChange={e => setStatusChangeForm({ ...statusChangeForm, remarques: e.target.value })}
                  rows={2}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  placeholder="Option valable 15 jours..."
                />
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowStatusChangeModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                >
                  Mettre à jour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
