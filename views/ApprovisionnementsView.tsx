'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  StatutDemandeAchat,
  NiveauUrgence,
  DemandeAchat,
  Fournisseur,
  BonCommande,
  BonLivraisonReception,
  FactureFournisseur
} from '../types/database';
import {
  ShoppingCart,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Building2,
  Truck,
  FileText,
  DollarSign,
  Plus,
  Search,
  Filter,
  Eye,
  Check,
  X,
  History,
  Shield,
  ShieldAlert,
  ArrowRight,
  Package,
  Layers,
  Phone,
  Mail,
  MapPin,
  ClipboardList,
  Store,
  ChevronRight,
  UserCheck,
  Edit
} from 'lucide-react';

// Helper Validation & Formatage RIB Algérien (20 chiffres)
const formatAndValidateRIB = (rawRib: string): { isValid: boolean; cleanRib: string; formattedRib: string; message: string } => {
  const cleanRib = (rawRib || '').replace(/[\s-]/g, '');
  if (!cleanRib) {
    return {
      isValid: false,
      cleanRib: '',
      formattedRib: '',
      message: 'Le Relevé d\'Identité Bancaire (RIB) est obligatoire.'
    };
  }
  if (!/^\d+$/.test(cleanRib)) {
    return {
      isValid: false,
      cleanRib,
      formattedRib: rawRib,
      message: 'Le RIB bancaire ne doit contenir que des chiffres (0-9).'
    };
  }
  if (cleanRib.length !== 20) {
    return {
      isValid: false,
      cleanRib,
      formattedRib: rawRib,
      message: `Le RIB bancaire algérien doit comporter exactement 20 chiffres (Banque: 3, Agence: 5, Compte: 10, Clé: 2). Longueur actuelle: ${cleanRib.length}/20.`
    };
  }

  const formattedRib = `${cleanRib.substring(0, 3)} ${cleanRib.substring(3, 8)} ${cleanRib.substring(8, 18)} ${cleanRib.substring(18, 20)}`;
  return {
    isValid: true,
    cleanRib,
    formattedRib,
    message: 'RIB conforme aux standards de la Banque d\'Algérie (20 chiffres).'
  };
};

export const ApprovisionnementsView: React.FC = () => {
  const {
    currentUser,
    chantiers,
    selectedChantierId,
    fournisseurs,
    demandesAchat,
    comparaisonsOffres,
    bonsCommande,
    receptionsChantier,
    facturesFournisseurs,
    creerDemandeAchat,
    validerDemandeAchatComptabilite,
    enregistrerOffresFournisseurs,
    choisirOffreRetenue,
    emettreBonCommande,
    enregistrerReceptionChantier,
    enregistrerFactureFournisseur,
    validerFactureCompta,
    addFournisseur,
    updateFournisseur,
    hasPermission
  } = useApp();

  // Navigation interne par onglets
  const [activeTab, setActiveTab] = useState<
    'pipeline' | 'da' | 'fournisseurs' | 'comparatifs' | 'bc' | 'receptions' | 'factures'
  >('pipeline');

  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('ALL');
  const [filterUrgence, setFilterUrgence] = useState<string>('ALL');

  // Modales
  const [showCreateDaModal, setShowCreateDaModal] = useState(false);
  const [showValiderComptaModal, setShowValiderComptaModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showCreateBcModal, setShowCreateBcModal] = useState(false);
  const [showReceptionModal, setShowReceptionModal] = useState(false);
  const [showFactureModal, setShowFactureModal] = useState(false);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showAddOffreModal, setShowAddOffreModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Fournisseur | null>(null);

  // Demande / Objet sélectionné pour action
  const [selectedDa, setSelectedDa] = useState<DemandeAchat | null>(null);
  const [selectedBc, setSelectedBc] = useState<BonCommande | null>(null);

  // Formulaires locaux
  const [newDaForm, setNewDaForm] = useState({
    chantier_id: chantiers[0]?.id || '',
    designation_produit: '',
    famille_article: 'MATERIAUX_GROS_OEUVRE',
    quantite_demandee: 1,
    unite_mesure: 'Tonne',
    niveau_urgence: 'NORMAL' as NiveauUrgence,
    justification: '',
    date_besoin_chantier: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    estimation_budget_dzd: 0
  });

  const [comptaDecisionForm, setComptaDecisionForm] = useState({
    decision: 'VALIDER' as 'VALIDER' | 'REFUSER',
    motif: ''
  });

  const [newBcForm, setNewBcForm] = useState({
    fournisseur_id: '',
    quantite_commandee: 1,
    prix_unitaire_ht_dzd: 1000,
    date_livraison_prevue: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    delai_paiement: '30 jours fin de mois'
  });

  const [newReceptionForm, setNewReceptionForm] = useState({
    numero_bl_fournisseur: '',
    quantite_recue: 1,
    quantite_conforme: 1,
    quantite_rejetee: 0,
    conformite_qualite: 'CONFORME' as 'CONFORME' | 'NON_CONFORME' | 'RESERVES',
    motif_rejet_ou_reserves: '',
    numero_plaque_camion: '',
    nom_chauffeur: ''
  });

  const [newFactureForm, setNewFactureForm] = useState({
    bon_commande_id: '',
    bon_reception_ref: '',
    numero_facture: '',
    date_facture: new Date().toISOString().split('T')[0],
    date_echeance: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    montant_ht_dzd: 0,
    mode_paiement: 'VIREMENT_BANCAIRE' as 'VIREMENT_BANCAIRE' | 'CHEQUE_BANCAIRE' | 'TRAITE'
  });

  const [newSupplierForm, setNewSupplierForm] = useState({
    entreprise_id: 'ent-001',
    nom_fournisseur: '',
    forme_juridique: 'SPA' as 'SPA' | 'SARL' | 'EURL',
    categorie: 'MATERIAUX_GROS_OEUVRE' as Fournisseur['categorie'],
    nif: '',
    rc: '',
    nis: '',
    rib: '',
    banque_nom: 'Banque Nationale d’Algérie (BNA)',
    agence_banque: '',
    adresse: '',
    wilaya: 'Alger (16)',
    telephone: '+213 ',
    email: 'contact@fournisseur.dz',
    contact_commercial: 'Service Commercial',
    delai_livraison_moyen_jours: 3,
    conditions_paiement: '30 jours fin de mois',
    actif: true,
    note_qualite: 4.5
  });

  const [newOffreForm, setNewOffreForm] = useState({
    fournisseur_id: '',
    prix_unitaire_ht_dzd: 1000,
    tva_pct: 19,
    delai_livraison_jours: 3,
    frais_transport_dzd: 15000,
    modalite_paiement: '30 jours par virement',
    observations: ''
  });

  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Rôles utilisateurs
  const isConducteur = currentUser?.role_id === 'role-ct';
  const isCompta = currentUser?.role_id === 'role-compta';
  const isAppro = currentUser?.role_id === 'role-appro';
  const isMagasinier = currentUser?.role_id === 'role-magasinier';
  const isAdmin = currentUser?.role_id === 'role-admin';

  // Chantiers filtrés
  const filteredChantierIds = useMemo(() => {
    if (selectedChantierId !== 'ALL') return [selectedChantierId];
    if (currentUser?.type === 'CHANTIER') return currentUser.chantiers_assignes;
    return chantiers.map(c => c.id);
  }, [selectedChantierId, currentUser, chantiers]);

  // DA filtrées
  const filteredDAs = useMemo(() => {
    return demandesAchat.filter(da => {
      // Filtrage par chantier
      const matchChantier = filteredChantierIds.includes(da.chantier_id);
      if (!matchChantier) return false;

      // Filtrage par statut
      if (filterStatut !== 'ALL' && da.statut !== filterStatut) return false;

      // Filtrage par urgence
      if (filterUrgence !== 'ALL' && da.niveau_urgence !== filterUrgence) return false;

      // Recherche texte
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchSearch =
          da.numero_da.toLowerCase().includes(term) ||
          da.designation_produit.toLowerCase().includes(term) ||
          da.chantier_nom.toLowerCase().includes(term) ||
          da.demandeur_nom.toLowerCase().includes(term);
        if (!matchSearch) return false;
      }

      return true;
    });
  }, [demandesAchat, filteredChantierIds, filterStatut, filterUrgence, searchTerm]);

  // Commandes filtrées
  const filteredBCs = useMemo(() => {
    return bonsCommande.filter(bc => filteredChantierIds.includes(bc.chantier_destinataire_id));
  }, [bonsCommande, filteredChantierIds]);

  // Réceptions filtrées
  const filteredReceptions = useMemo(() => {
    return receptionsChantier.filter(r => filteredChantierIds.includes(r.chantier_id));
  }, [receptionsChantier, filteredChantierIds]);

  // Factures filtrées
  const filteredFactures = useMemo(() => {
    return facturesFournisseurs.filter(f => filteredChantierIds.includes(f.chantier_id));
  }, [facturesFournisseurs, filteredChantierIds]);

  // Statistiques pour les badges & alertes
  const pendingComptaDAs = useMemo(() => {
    return demandesAchat.filter(da => da.statut === 'EN_ATTENTE_COMPTABILITE');
  }, [demandesAchat]);

  const validatedDAsForAppro = useMemo(() => {
    return demandesAchat.filter(da => da.statut === 'VALIDEE' || da.statut === 'EN_COURS_APPROVISIONNEMENT');
  }, [demandesAchat]);

  const incomingDeliveriesForMagasin = useMemo(() => {
    return bonsCommande.filter(bc =>
      ['EMIS', 'CONFIRME_FOURNISSEUR', 'EN_LIVRAISON', 'LIVRE_PARTIEL'].includes(bc.statut) &&
      filteredChantierIds.includes(bc.chantier_destinataire_id)
    );
  }, [bonsCommande, filteredChantierIds]);

  // Handlers
  const handleCreateDa = (e: React.FormEvent) => {
    e.preventDefault();
    setActionFeedback(null);
    const res = creerDemandeAchat(newDaForm);
    if (res.success) {
      setActionFeedback({ type: 'success', message: res.message });
      setShowCreateDaModal(false);
      setNewDaForm({
        chantier_id: chantiers[0]?.id || '',
        designation_produit: '',
        famille_article: 'MATERIAUX_GROS_OEUVRE',
        quantite_demandee: 1,
        unite_mesure: 'Tonne',
        niveau_urgence: 'NORMAL',
        justification: '',
        date_besoin_chantier: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        estimation_budget_dzd: 0
      });
    } else {
      setActionFeedback({ type: 'error', message: res.message });
    }
  };

  const handleComptaDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDa) return;
    setActionFeedback(null);
    const res = validerDemandeAchatComptabilite(
      selectedDa.id,
      comptaDecisionForm.decision,
      comptaDecisionForm.motif
    );
    if (res.success) {
      setActionFeedback({ type: 'success', message: res.message });
      setShowValiderComptaModal(false);
      setSelectedDa(null);
      setComptaDecisionForm({ decision: 'VALIDER', motif: '' });
    } else {
      setActionFeedback({ type: 'error', message: res.message });
    }
  };

  const handleCreateBc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDa) return;
    setActionFeedback(null);
    const res = emettreBonCommande({
      demande_achat_id: selectedDa.id,
      fournisseur_id: newBcForm.fournisseur_id,
      quantite_commandee: newBcForm.quantite_commandee,
      prix_unitaire_ht_dzd: newBcForm.prix_unitaire_ht_dzd,
      date_livraison_prevue: newBcForm.date_livraison_prevue,
      delai_paiement: newBcForm.delai_paiement
    });
    if (res.success) {
      setActionFeedback({ type: 'success', message: res.message });
      setShowCreateBcModal(false);
      setSelectedDa(null);
      setActiveTab('bc');
    } else {
      setActionFeedback({ type: 'error', message: res.message });
    }
  };

  const handleRegisterReception = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBc) return;
    setActionFeedback(null);
    const res = enregistrerReceptionChantier({
      bon_commande_id: selectedBc.id,
      numero_bl_fournisseur: newReceptionForm.numero_bl_fournisseur,
      quantite_recue: Number(newReceptionForm.quantite_recue),
      quantite_conforme: Number(newReceptionForm.quantite_conforme),
      quantite_rejetee: Number(newReceptionForm.quantite_rejetee),
      conformite_qualite: newReceptionForm.conformite_qualite,
      motif_rejet_ou_reserves: newReceptionForm.motif_rejet_ou_reserves,
      numero_plaque_camion: newReceptionForm.numero_plaque_camion,
      nom_chauffeur: newReceptionForm.nom_chauffeur
    });
    if (res.success) {
      setActionFeedback({ type: 'success', message: res.message });
      setShowReceptionModal(false);
      setSelectedBc(null);
      setActiveTab('receptions');
    } else {
      setActionFeedback({ type: 'error', message: res.message });
    }
  };

  const handleAddOffre = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDa) return;
    const fourn = fournisseurs.find(f => f.id === newOffreForm.fournisseur_id);
    if (!fourn) return;

    enregistrerOffresFournisseurs(selectedDa.id, [
      {
        fournisseur_id: fourn.id,
        fournisseur_nom: fourn.nom_fournisseur,
        prix_unitaire_ht_dzd: Number(newOffreForm.prix_unitaire_ht_dzd),
        tva_pct: Number(newOffreForm.tva_pct),
        delai_livraison_jours: Number(newOffreForm.delai_livraison_jours),
        frais_transport_dzd: Number(newOffreForm.frais_transport_dzd),
        modalite_paiement: newOffreForm.modalite_paiement,
        observations: newOffreForm.observations,
        retenu: false
      }
    ]);
    setShowAddOffreModal(false);
    setActionFeedback({ type: 'success', message: 'Offre comparative enregistrée.' });
  };

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    const ribCheck = formatAndValidateRIB(newSupplierForm.rib);
    if (!ribCheck.isValid) {
      setActionFeedback({ type: 'error', message: ribCheck.message });
      return;
    }

    addFournisseur({
      ...newSupplierForm,
      rib: ribCheck.formattedRib,
      nis: newSupplierForm.nis || newSupplierForm.nif
    });
    setShowAddSupplierModal(false);
    setActionFeedback({ type: 'success', message: `Nouveau fournisseur agréé ${newSupplierForm.nom_fournisseur} enregistré avec succès (RIB : ${ribCheck.formattedRib}).` });

    setNewSupplierForm({
      entreprise_id: 'ent-001',
      nom_fournisseur: '',
      forme_juridique: 'SPA',
      categorie: 'MATERIAUX_GROS_OEUVRE',
      nif: '',
      rc: '',
      nis: '',
      rib: '',
      banque_nom: 'Banque Nationale d’Algérie (BNA)',
      agence_banque: '',
      adresse: '',
      wilaya: 'Alger (16)',
      telephone: '+213 ',
      email: 'contact@fournisseur.dz',
      contact_commercial: 'Service Commercial',
      delai_livraison_moyen_jours: 3,
      conditions_paiement: '30 jours fin de mois',
      actif: true,
      note_qualite: 4.5
    });
  };

  const handleUpdateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier) return;
    const ribCheck = formatAndValidateRIB(editingSupplier.rib || '');
    if (!ribCheck.isValid) {
      setActionFeedback({ type: 'error', message: ribCheck.message });
      return;
    }

    updateFournisseur(editingSupplier.id, {
      ...editingSupplier,
      rib: ribCheck.formattedRib,
      nis: editingSupplier.nis || editingSupplier.nif
    });
    setEditingSupplier(null);
    setActionFeedback({ type: 'success', message: `Fiche du fournisseur ${editingSupplier.nom_fournisseur} mise à jour avec succès (RIB : ${ribCheck.formattedRib}).` });
  };

  const handleCreateFacture = (e: React.FormEvent) => {
    e.preventDefault();
    const res = enregistrerFactureFournisseur({
      bon_commande_id: newFactureForm.bon_commande_id,
      bon_reception_ref: newFactureForm.bon_reception_ref,
      numero_facture: newFactureForm.numero_facture,
      date_facture: newFactureForm.date_facture,
      date_echeance: newFactureForm.date_echeance,
      montant_ht_dzd: Number(newFactureForm.montant_ht_dzd),
      mode_paiement: newFactureForm.mode_paiement
    });
    if (res.success) {
      setActionFeedback({ type: 'success', message: res.message });
      setShowFactureModal(false);
      setActiveTab('factures');
    } else {
      setActionFeedback({ type: 'error', message: res.message });
    }
  };

  // Helper pour styliser le badge de statut
  const getStatusBadge = (statut: StatutDemandeAchat) => {
    switch (statut) {
      case 'BROUILLON':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-300">Brouillon</span>;
      case 'EN_ATTENTE_DIRECTION':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-purple-50 text-purple-900 border border-purple-300 flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-purple-600" /> En attente validation Direction</span>;
      case 'EN_ATTENTE_COMPTABILITE':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> En attente validation compta</span>;
      case 'REFUSEE':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-rose-50 text-rose-800 border border-rose-300 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Refusée par compta</span>;
      case 'VALIDEE':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Validée par compta</span>;
      case 'EN_COURS_APPROVISIONNEMENT':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-50 text-blue-800 border border-blue-300 flex items-center gap-1"><Search className="w-3.5 h-3.5" /> En cours appro</span>;
      case 'COMMANDEE':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-indigo-50 text-indigo-800 border border-indigo-300 flex items-center gap-1"><ShoppingCart className="w-3.5 h-3.5" /> Commandée</span>;
      case 'PARTIELLEMENT_LIVREE':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-orange-50 text-orange-800 border border-orange-300 flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Partiellement livrée</span>;
      case 'LIVREE':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-cyan-50 text-cyan-800 border border-cyan-300 flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Livrée au chantier</span>;
      case 'RECEPTIONNEE':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-teal-50 text-teal-800 border border-teal-300 flex items-center gap-1"><Store className="w-3.5 h-3.5" /> Réceptionnée magasin</span>;
      case 'CLOTUREE':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-200 text-slate-800 border border-slate-400">Clôturée</span>;
      default:
        return null;
    }
  };

  const getUrgenceBadge = (urg: NiveauUrgence) => {
    switch (urg) {
      case 'CRITIQUE_ARRET_CHANTIER':
        return (
          <span className="px-2 py-0.5 text-xs font-bold rounded bg-rose-600 text-white animate-pulse flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> CRITIQUE : ARRÊT CHANTIER
          </span>
        );
      case 'URGENT':
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Urgent (Sous 48h)
          </span>
        );
      case 'NORMAL':
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded bg-slate-100 text-slate-700">
            Normal
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. BANNIÈRE RÈGLE D'OR : PAS DE MAGASIN CENTRAL, LIVRAISON DIRECTE AUX CHANTIERS */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              RÈGLE D’OR ERP BTP : CIRCUIT SANS MAGASIN CENTRAL
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Achats & Approvisionnements Chantiers
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Toutes les livraisons s’effectuent <strong className="text-amber-300 font-semibold">directement aux magasins des chantiers</strong>.
              Circuit obligatoire avec séparation stricte des fonctions : émission par le conducteur, visa budgétaire comptable, commande centralisée par les approvisionnements, et réception contradictoire par le magasinier du chantier.
            </p>
          </div>

          {/* Quick Actions selon profil actif */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Conducteur de travaux */}
            {(isConducteur || isAdmin) && (
              <button
                onClick={() => setShowCreateDaModal(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center gap-2 transition"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                Nouvelle Demande d'Achat (DA)
              </button>
            )}

            {/* Approvisionnements */}
            {(isAppro || isAdmin) && (
              <button
                onClick={() => setShowAddSupplierModal(true)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm backdrop-blur border border-white/20 flex items-center gap-2 transition"
              >
                <Building2 className="w-4 h-4" />
                Nouveau Fournisseur Agréé
              </button>
            )}

            {/* Magasinier */}
            {(isMagasinier || isAdmin) && (
              <button
                onClick={() => {
                  setActiveTab('receptions');
                  if (bonsCommande.length > 0) {
                    setSelectedBc(bonsCommande[0]);
                    setShowReceptionModal(true);
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg flex items-center gap-2 transition"
              >
                <Store className="w-4 h-4" />
                Réceptionner Marchandise au Magasin
              </button>
            )}
          </div>
        </div>

        {/* Workflow Stepper interactif */}
        <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <div className="flex items-center justify-between text-xs text-amber-300 font-semibold mb-1">
              <span>1. Demande Chantier</span>
              <FileText className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs text-slate-300">Conducteur de Travaux crée la DA avec justification et urgence.</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold mb-1">
              <span>2. Visa Compta</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs text-slate-300">Comptabilité contrôle le budget et valide/refuse (auto-visa exclu).</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <div className="flex items-center justify-between text-xs text-blue-400 font-semibold mb-1">
              <span>3. Commande Appro</span>
              <ShoppingCart className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs text-slate-300">Approvisionnements consulte, négocie et émet le BC (HT + TVA 19%).</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <div className="flex items-center justify-between text-xs text-indigo-300 font-semibold mb-1">
              <span>4. Livraison Directe</span>
              <Truck className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs text-slate-300">Acheminement direct au magasin du chantier (pas de dépôt central).</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <div className="flex items-center justify-between text-xs text-teal-300 font-semibold mb-1">
              <span>5. Contrôle Magasin</span>
              <Store className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs text-slate-300">Magasinier réceptionne, vérifie la qualité, note le camion et vise le BR.</p>
          </div>
        </div>
      </div>

      {/* Message de notification d'action */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between shadow-sm border ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-3 text-sm font-medium">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-slate-400 hover:text-slate-700 text-sm font-semibold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Alertes d'actions requises selon le rôle */}
      {isCompta && pendingComptaDAs.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-between text-amber-900">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-200/60 text-amber-800">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">Contrôle Comptable Requis ({pendingComptaDAs.length} demande(s) en attente)</p>
              <p className="text-xs text-amber-800">
                Vous devez vérifier la couverture budgétaire et apposer votre visa de validation ou de refus motivé.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setActiveTab('da');
              setFilterStatut('EN_ATTENTE_COMPTABILITE');
            }}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition"
          >
            Examiner les DA en attente
          </button>
        </div>
      )}

      {isAppro && validatedDAsForAppro.length > 0 && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-300 flex items-center justify-between text-blue-900">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-200/60 text-blue-800">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">Demandes Visées par la Compta ({validatedDAsForAppro.length} prêtes à commander)</p>
              <p className="text-xs text-blue-800">
                Consultez les fournisseurs agréés pour obtenir les meilleures offres et émettez les bons de commande.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setActiveTab('da');
              setFilterStatut('VALIDEE');
            }}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition"
          >
            Générer les Bons de Commande
          </button>
        </div>
      )}

      {isMagasinier && incomingDeliveriesForMagasin.length > 0 && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-between text-emerald-900">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-200/60 text-emerald-800">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">Livraisons Attendues au Magasin ({incomingDeliveriesForMagasin.length} commande(s) en transit)</p>
              <p className="text-xs text-emerald-800">
                Préparez la zone de stockage du chantier pour la réception des camions de matériaux.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('bc')}
            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition"
          >
            Voir les commandes en livraison
          </button>
        </div>
      )}

      {/* Onglets de navigation du module */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'pipeline', label: 'Circuit & Pipeline', icon: Layers },
            { id: 'da', label: `Demandes d'Achat (DA) [${filteredDAs.length}]`, icon: FileText },
            { id: 'fournisseurs', label: `Fournisseurs Agréés [${fournisseurs.length}]`, icon: Building2 },
            { id: 'comparatifs', label: 'Comparatif des Offres', icon: DollarSign },
            { id: 'bc', label: `Bons de Commande [${filteredBCs.length}]`, icon: ShoppingCart },
            { id: 'receptions', label: `Réceptions Chantiers [${filteredReceptions.length}]`, icon: Store },
            { id: 'factures', label: `Factures Fournisseurs [${filteredFactures.length}]`, icon: ClipboardList }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Filtres de recherche */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Rechercher article, DA, tiers..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56"
            />
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* ONGLET 1 : PIPELINE & CIRCUIT VISUEL       */}
      {/* ========================================== */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase">1. En attente compta</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {demandesAchat.filter(d => d.statut === 'EN_ATTENTE_COMPTABILITE').length}
              </div>
              <p className="text-xs text-slate-500 mt-1">À viser par le Responsable Comptabilité</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase">2. Validées prêtes pour BC</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {demandesAchat.filter(d => d.statut === 'VALIDEE' || d.statut === 'EN_COURS_APPROVISIONNEMENT').length}
              </div>
              <p className="text-xs text-slate-500 mt-1">Service approvisionnements consulte</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase">3. Commandes en cours</span>
                <Truck className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {bonsCommande.filter(b => ['EMIS', 'EN_LIVRAISON', 'LIVRE_PARTIEL'].includes(b.statut)).length}
              </div>
              <p className="text-xs text-slate-500 mt-1">Acheminement direct magasin chantier</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase">4. Réceptions conformes</span>
                <Store className="w-4 h-4 text-teal-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {receptionsChantier.filter(r => r.statut === 'RECEPTIONNE_CONFORME').length}
              </div>
              <p className="text-xs text-slate-500 mt-1">Signées par le magasinier avec visa</p>
            </div>
          </div>

          {/* Kanban / Visual Stepper per DA */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Progression en temps réel du circuit d'approvisionnement
            </h2>
            <p className="text-xs text-slate-500">
              Suivi étape par étape depuis l’expression du besoin par le chantier jusqu’au rapprochement de la facture.
            </p>

            <div className="space-y-4 divide-y divide-slate-100">
              {filteredDAs.map(da => {
                const stepIndex =
                  da.statut === 'EN_ATTENTE_COMPTABILITE' ? 1 :
                  da.statut === 'REFUSEE' ? -1 :
                  da.statut === 'VALIDEE' ? 2 :
                  da.statut === 'EN_COURS_APPROVISIONNEMENT' ? 2.5 :
                  da.statut === 'COMMANDEE' ? 3 :
                  da.statut === 'PARTIELLEMENT_LIVREE' ? 3.5 :
                  da.statut === 'LIVREE' ? 4 :
                  da.statut === 'RECEPTIONNEE' ? 4 : 5;

                return (
                  <div key={da.id} className="pt-4 first:pt-0 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-slate-900">{da.numero_da}</span>
                          {getStatusBadge(da.statut)}
                          {getUrgenceBadge(da.niveau_urgence)}
                        </div>
                        <h4 className="text-sm font-semibold text-slate-800 mt-1">
                          {da.designation_produit} - <span className="text-indigo-600 font-bold">{da.quantite_demandee} {da.unite_mesure}</span>
                        </h4>
                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-0.5">
                          <span>Chantier : <strong>{da.chantier_nom}</strong></span>
                          <span>Demandeur : {da.demandeur_nom} ({da.demandeur_role})</span>
                          <span>Besoin : {da.date_besoin_chantier}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedDa(da);
                            setShowHistoryModal(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                        >
                          <History className="w-3.5 h-3.5" />
                          Historique ({da.historique_validations.length})
                        </button>

                        {/* Action selon étape et rôle */}
                        {da.statut === 'EN_ATTENTE_COMPTABILITE' && (isCompta || isAdmin) && (
                          <button
                            onClick={() => {
                              setSelectedDa(da);
                              setShowValiderComptaModal(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Contrôle Compta
                          </button>
                        )}

                        {(da.statut === 'VALIDEE' || da.statut === 'EN_COURS_APPROVISIONNEMENT') && (isAppro || isAdmin) && (
                          <button
                            onClick={() => {
                              setSelectedDa(da);
                              setNewBcForm({
                                fournisseur_id: fournisseurs[0]?.id || '',
                                quantite_commandee: da.quantite_demandee,
                                prix_unitaire_ht_dzd: Math.round((da.estimation_budget_dzd || 100000) / da.quantite_demandee),
                                date_livraison_prevue: da.date_besoin_chantier,
                                delai_paiement: '30 jours fin de mois'
                              });
                              setShowCreateBcModal(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1 shadow-sm"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            Générer Bon de Commande
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Stepper bar pour chaque DA */}
                    <div className="grid grid-cols-5 gap-2 pt-1">
                      <div className={`p-2 rounded-lg text-center text-xs font-medium border ${stepIndex >= 1 ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                        1. Émission Chantier
                      </div>
                      <div className={`p-2 rounded-lg text-center text-xs font-medium border ${da.statut === 'REFUSEE' ? 'bg-rose-50 border-rose-200 text-rose-800 font-bold' : (stepIndex >= 2 ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-400')}`}>
                        {da.statut === 'REFUSEE' ? '2. Refusée Compta' : '2. Visa Compta'}
                      </div>
                      <div className={`p-2 rounded-lg text-center text-xs font-medium border ${stepIndex >= 3 ? 'bg-blue-50 border-blue-200 text-blue-900 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                        3. Bon de Commande
                      </div>
                      <div className={`p-2 rounded-lg text-center text-xs font-medium border ${stepIndex >= 4 ? 'bg-amber-50 border-amber-200 text-amber-900 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                        4. Livraison Magasin
                      </div>
                      <div className={`p-2 rounded-lg text-center text-xs font-medium border ${stepIndex >= 5 || da.statut === 'RECEPTIONNEE' ? 'bg-teal-50 border-teal-200 text-teal-900 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                        5. Réception & Visa BR
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* ONGLET 2 : DEMANDES D'ACHAT (DA)           */}
      {/* ========================================== */}
      {activeTab === 'da' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header & Filter Controls */}
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Filtrer par statut :</span>
              <select
                value={filterStatut}
                onChange={e => setFilterStatut(e.target.value)}
                className="text-xs rounded-lg border-slate-300 bg-white py-1.5 px-2.5 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="ALL">Tous les statuts ({demandesAchat.length})</option>
                <option value="EN_ATTENTE_DIRECTION">En attente validation Direction</option>
                <option value="EN_ATTENTE_COMPTABILITE">En attente compta</option>
                <option value="VALIDEE">Validée compta</option>
                <option value="REFUSEE">Refusée</option>
                <option value="COMMANDEE">Commandée</option>
                <option value="RECEPTIONNEE">Réceptionnée magasin</option>
              </select>

              <select
                value={filterUrgence}
                onChange={e => setFilterUrgence(e.target.value)}
                className="text-xs rounded-lg border-slate-300 bg-white py-1.5 px-2.5 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="ALL">Toutes urgences</option>
                <option value="NORMAL">Normal</option>
                <option value="URGENT">Urgent (48h)</option>
                <option value="CRITIQUE_ARRET_CHANTIER">Critique arrêt chantier</option>
              </select>
            </div>

            {(isConducteur || isAdmin) && (
              <button
                onClick={() => setShowCreateDaModal(true)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 transition"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                Créer une Demande d'Achat
              </button>
            )}
          </div>

          {/* Table des Demandes d'Achat */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Réf. DA</th>
                  <th className="py-3 px-4">Chantier</th>
                  <th className="py-3 px-4">Désignation du Matériau / Produit</th>
                  <th className="py-3 px-4">Quantité</th>
                  <th className="py-3 px-4">Urgence</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4">Demandeur</th>
                  <th className="py-3 px-4">Date Besoin</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDAs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Aucune demande d'achat correspondant aux critères.
                    </td>
                  </tr>
                ) : (
                  filteredDAs.map(da => (
                    <tr key={da.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{da.numero_da}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{da.chantier_nom}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{da.designation_produit}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">{da.justification}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {da.quantite_demandee} {da.unite_mesure}
                        </span>
                      </td>
                      <td className="py-3 px-4">{getUrgenceBadge(da.niveau_urgence)}</td>
                      <td className="py-3 px-4">{getStatusBadge(da.statut)}</td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>{da.demandeur_nom}</div>
                        <div className="text-[10px] text-slate-400">{da.demandeur_role}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{da.date_besoin_chantier}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Traçabilité */}
                          <button
                            onClick={() => {
                              setSelectedDa(da);
                              setShowHistoryModal(true);
                            }}
                            title="Historique de validation"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          {/* Contrôle Compta */}
                          {da.statut === 'EN_ATTENTE_COMPTABILITE' && (isCompta || isAdmin) && (
                            <button
                              onClick={() => {
                                setSelectedDa(da);
                                setShowValiderComptaModal(true);
                              }}
                              className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
                            >
                              Viser
                            </button>
                          )}

                          {/* Commande Appro */}
                          {(da.statut === 'VALIDEE' || da.statut === 'EN_COURS_APPROVISIONNEMENT') && (isAppro || isAdmin) && (
                            <button
                              onClick={() => {
                                setSelectedDa(da);
                                setNewBcForm({
                                  fournisseur_id: fournisseurs[0]?.id || '',
                                  quantite_commandee: da.quantite_demandee,
                                  prix_unitaire_ht_dzd: Math.round((da.estimation_budget_dzd || 100000) / da.quantite_demandee),
                                  date_livraison_prevue: da.date_besoin_chantier,
                                  delai_paiement: '30 jours'
                                });
                                setShowCreateBcModal(true);
                              }}
                              className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
                            >
                              Commander
                            </button>
                          )}

                          {/* Offres */}
                          {(da.statut === 'VALIDEE' || da.statut === 'EN_COURS_APPROVISIONNEMENT') && (isAppro || isAdmin) && (
                            <button
                              onClick={() => {
                                setSelectedDa(da);
                                setNewOffreForm({
                                  fournisseur_id: fournisseurs[0]?.id || '',
                                  prix_unitaire_ht_dzd: Math.round((da.estimation_budget_dzd || 100000) / da.quantite_demandee),
                                  tva_pct: 19,
                                  delai_livraison_jours: 3,
                                  frais_transport_dzd: 15000,
                                  modalite_paiement: '30 jours virement',
                                  observations: ''
                                });
                                setShowAddOffreModal(true);
                              }}
                              title="Ajouter offre fournisseur"
                              className="p-1.5 rounded-lg border border-slate-200 text-blue-600 hover:bg-blue-50"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* ONGLET 3 : FOURNISSEURS AGRÉÉS             */}
      {/* ========================================== */}
      {activeTab === 'fournisseurs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Annuaire des Fournisseurs Agréés (Algérie)</h3>
              <p className="text-xs text-slate-500">
                Fournisseurs certifiés pour approvisionnement direct des chantiers (identifiants fiscaux NIF/RC vérifiés).
              </p>
            </div>
            {(isAppro || isAdmin) && (
              <button
                onClick={() => setShowAddSupplierModal(true)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                Ajouter un Fournisseur
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fournisseurs.map(f => (
              <div key={f.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {f.forme_juridique}
                    </span>
                    <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                      ★ {f.note_qualite} / 5
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-2">{f.nom_fournisseur}</h4>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700">
                    {f.categorie.replace(/_/g, ' ')}
                  </span>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="line-clamp-1">{f.adresse}, {f.wilaya}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{f.telephone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{f.email}</span>
                    </div>
                  </div>

                  {/* Bloc Coordonnées Bancaires & RIB (20 chiffres) */}
                  <div className="mt-3 p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
                      <span>Relevé d'Identité Bancaire (RIB)</span>
                      <span className="font-mono text-emerald-700 bg-white px-1.5 py-0.2 rounded border border-emerald-200">
                        {f.banque_nom || 'BNA'}
                      </span>
                    </div>
                    <div className="font-mono font-bold text-emerald-950 text-xs tracking-wider">
                      {f.rib || '001 00600 0000000000 00'}
                    </div>
                    {f.agence_banque && (
                      <div className="text-[10px] text-emerald-700 font-medium line-clamp-1">
                        {f.agence_banque}
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 text-[11px] text-slate-500 space-y-1">
                  <div><strong>NIF :</strong> {f.nif} | <strong>RC :</strong> {f.rc}</div>
                  <div><strong>Délai moyen :</strong> {f.delai_livraison_moyen_jours} jours</div>
                  <div className="flex items-center justify-between">
                    <span><strong>Paiement :</strong> {f.conditions_paiement}</span>
                    {(isAppro || isAdmin) && (
                      <button
                        onClick={() => setEditingSupplier(f)}
                        className="px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-[10px] flex items-center gap-1 transition shrink-0"
                        title="Modifier la fiche et le RIB bancaire"
                      >
                        <Edit className="w-3 h-3" />
                        Éditer RIB
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* ONGLET 4 : COMPARATIF DES OFFRES           */}
      {/* ========================================== */}
      {activeTab === 'comparatifs' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Tableau Comparatif des Offres Fournisseurs</h3>
              <p className="text-xs text-slate-500">
                Analyse technique et financière pour sélection de l’offre économiquement la plus avantageuse livrée au chantier.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Réf. DA</th>
                  <th className="py-3 px-4">Fournisseur Soumissionnaire</th>
                  <th className="py-3 px-4">Prix Unitaire HT</th>
                  <th className="py-3 px-4">TVA</th>
                  <th className="py-3 px-4">Frais Transport Chantier</th>
                  <th className="py-3 px-4">Délai Livraison</th>
                  <th className="py-3 px-4">Modalités Paiement</th>
                  <th className="py-3 px-4">Statut Décision</th>
                  <th className="py-3 px-4 text-right">Sélection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {comparaisonsOffres.map(off => {
                  const daAssociee = demandesAchat.find(d => d.id === off.demande_achat_id);
                  return (
                    <tr key={off.id} className={off.retenu ? 'bg-emerald-50/50' : 'hover:bg-slate-50/70'}>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {daAssociee ? daAssociee.numero_da : off.demande_achat_id}
                        <div className="text-[10px] text-slate-500 font-normal">{daAssociee?.designation_produit}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{off.fournisseur_nom}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {off.prix_unitaire_ht_dzd.toLocaleString('fr-DZ')} DZD
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-600">{off.tva_pct}%</td>
                      <td className="py-3 px-4 font-medium text-slate-600">
                        {off.frais_transport_dzd.toLocaleString('fr-DZ')} DZD
                      </td>
                      <td className="py-3 px-4 text-slate-700">{off.delai_livraison_jours} jours</td>
                      <td className="py-3 px-4 text-slate-600">{off.modalite_paiement}</td>
                      <td className="py-3 px-4">
                        {off.retenu ? (
                          <span className="px-2 py-0.5 text-xs font-bold rounded bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 w-max">
                            <Check className="w-3 h-3" /> Offre Retenue
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">Non retenue</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {(isAppro || isAdmin) && !off.retenu && (
                          <button
                            onClick={() => {
                              choisirOffreRetenue(off.demande_achat_id, off.id);
                              setActionFeedback({ type: 'success', message: `Offre de ${off.fournisseur_nom} retenue pour la commande.` });
                            }}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                          >
                            Retenir cette offre
                          </button>
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

      {/* ========================================== */}
      {/* ONGLET 5 : BONS DE COMMANDE (BC)           */}
      {/* ========================================== */}
      {activeTab === 'bc' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Bons de Commande Fournisseurs Émis</h3>
              <p className="text-xs text-slate-500">
                Chaque commande est rattachée directement au magasin du chantier destinataire.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">N° BC</th>
                  <th className="py-3 px-4">Fournisseur</th>
                  <th className="py-3 px-4">Chantier Destinataire & Adresse Magasin</th>
                  <th className="py-3 px-4">Marchandise</th>
                  <th className="py-3 px-4">Quantité</th>
                  <th className="py-3 px-4">Montant TTC (DZD)</th>
                  <th className="py-3 px-4">Livraison Prévue</th>
                  <th className="py-3 px-4">Statut BC</th>
                  <th className="py-3 px-4 text-right">Actions Magasinier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBCs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Aucun bon de commande pour ce chantier.
                    </td>
                  </tr>
                ) : (
                  filteredBCs.map(bc => (
                    <tr key={bc.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">{bc.numero_bc}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{bc.fournisseur_nom}</div>
                        <div className="text-[10px] text-slate-400">NIF : {bc.fournisseur_nif}</div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 flex items-center gap-1">
                          <Store className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                          {bc.chantier_destinataire_nom}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">{bc.adresse_livraison}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{bc.designation_marchandise}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{bc.quantite_commandee} {bc.unite_mesure}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {bc.montant_total_ttc_dzd.toLocaleString('fr-DZ')} DZD
                        <div className="text-[10px] text-slate-400 font-normal">TVA 19% incluse</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{bc.date_livraison_prevue}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {bc.statut.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {(isMagasinier || isAdmin) && bc.statut !== 'LIVRE_TOTAL' && (
                          <button
                            onClick={() => {
                              setSelectedBc(bc);
                              setNewReceptionForm({
                                numero_bl_fournisseur: `BL-${bc.fournisseur_nom.substring(0, 4).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`,
                                quantite_recue: bc.quantite_commandee,
                                quantite_conforme: bc.quantite_commandee,
                                quantite_rejetee: 0,
                                conformite_qualite: 'CONFORME',
                                motif_rejet_ou_reserves: '',
                                numero_plaque_camion: '01452-124-16',
                                nom_chauffeur: 'Chauffeur transporteur'
                              });
                              setShowReceptionModal(true);
                            }}
                            className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center gap-1 ml-auto"
                          >
                            <Store className="w-3.5 h-3.5" />
                            Réceptionner
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* ONGLET 6 : RÉCEPTIONS MAGASINS (BL / BR)   */}
      {/* ========================================== */}
      {activeTab === 'receptions' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Bons de Réception aux Magasins des Chantiers (BR)</h3>
              <p className="text-xs text-slate-500">
                Constats physiques établis par le magasinier lors de l'arrivée des camions fournisseurs sur chantier.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">N° BR Interne</th>
                  <th className="py-3 px-4">Réf. BL Fournisseur</th>
                  <th className="py-3 px-4">Réf. Commande</th>
                  <th className="py-3 px-4">Chantier & Magasin</th>
                  <th className="py-3 px-4">Magasinier Signataire</th>
                  <th className="py-3 px-4">Quantité Conforme</th>
                  <th className="py-3 px-4">Camion & Chauffeur</th>
                  <th className="py-3 px-4">Conformité Qualité</th>
                  <th className="py-3 px-4">Visa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReceptions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Aucune réception enregistrée pour ce chantier.
                    </td>
                  </tr>
                ) : (
                  filteredReceptions.map(br => (
                    <tr key={br.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-teal-800">{br.numero_br_interne}</td>
                      <td className="py-3 px-4 font-mono text-slate-700">{br.numero_bl_fournisseur}</td>
                      <td className="py-3 px-4 font-mono text-indigo-600 font-semibold">{br.bon_commande_ref}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{br.chantier_nom}</td>
                      <td className="py-3 px-4 text-slate-700">{br.magasinier_nom}</td>
                      <td className="py-3 px-4 font-bold text-emerald-700">
                        {br.quantite_conforme} {br.unite_mesure}
                        {br.quantite_rejetee > 0 && (
                          <span className="text-rose-600 block text-[10px]">Rejeté : {br.quantite_rejetee}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>{br.numero_plaque_camion || 'Non renseigné'}</div>
                        <div className="text-[10px] text-slate-400">{br.nom_chauffeur}</div>
                      </td>
                      <td className="py-3 px-4">
                        {br.conformite_qualite === 'CONFORME' ? (
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                            Conforme
                          </span>
                        ) : br.conformite_qualite === 'RESERVES' ? (
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">
                            Avec Réserves
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800">
                            Refusé
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Visé
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* ONGLET 7 : FACTURES FOURNISSEURS           */}
      {/* ========================================== */}
      {activeTab === 'factures' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Rapprochement & Factures Fournisseurs (Comptabilité)</h3>
              <p className="text-xs text-slate-500">
                Rapprochement 3-voies obligatoire (DA → BC → BR magasin → Facture) pour accord "Bon à Payer".
              </p>
            </div>
            {(isCompta || isAdmin) && (
              <button
                onClick={() => {
                  if (bonsCommande.length > 0 && receptionsChantier.length > 0) {
                    setNewFactureForm({
                      bon_commande_id: bonsCommande[0].id,
                      bon_reception_ref: receptionsChantier[0].numero_br_interne,
                      numero_facture: `FAC-${Date.now().toString().slice(-4)}`,
                      date_facture: new Date().toISOString().split('T')[0],
                      date_echeance: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
                      montant_ht_dzd: bonsCommande[0].montant_total_ht_dzd,
                      mode_paiement: 'VIREMENT_BANCAIRE'
                    });
                    setShowFactureModal(true);
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Enregistrer Facture
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">N° Facture</th>
                  <th className="py-3 px-4">Réf. BC & BR Rapprochés</th>
                  <th className="py-3 px-4">Fournisseur</th>
                  <th className="py-3 px-4">Chantier Imputé</th>
                  <th className="py-3 px-4">Montant TTC (DZD)</th>
                  <th className="py-3 px-4">Échéance</th>
                  <th className="py-3 px-4">Mode Paiement</th>
                  <th className="py-3 px-4">Statut Comptable</th>
                  <th className="py-3 px-4 text-right">Visa Compta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFactures.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Aucune facture fournisseur enregistrée.
                    </td>
                  </tr>
                ) : (
                  filteredFactures.map(fac => (
                    <tr key={fac.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{fac.numero_facture}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        <div>BC: {fac.bon_commande_ref}</div>
                        <div className="text-teal-700 text-[10px]">BR: {fac.bon_reception_ref}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{fac.fournisseur_nom}</td>
                      <td className="py-3 px-4 text-slate-800">{fac.chantier_nom}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {fac.montant_ttc_dzd.toLocaleString('fr-DZ')} DZD
                      </td>
                      <td className="py-3 px-4 text-slate-600">{fac.date_echeance}</td>
                      <td className="py-3 px-4 text-slate-600">{fac.mode_paiement.replace(/_/g, ' ')}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          fac.statut_comptable === 'BON_A_PAYER'
                            ? 'bg-emerald-100 text-emerald-800'
                            : fac.statut_comptable === 'PAYEE'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {fac.statut_comptable.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {(isCompta || isAdmin) && fac.statut_comptable === 'EN_ATTENTE_CONTROLE' && (
                          <button
                            onClick={() => {
                              validerFactureCompta(fac.id, 'BON_A_PAYER');
                              setActionFeedback({ type: 'success', message: `Facture ${fac.numero_facture} validée "Bon à Payer".` });
                            }}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                          >
                            Bon à Payer
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODALE 1 : CRÉATION DEMANDE D'ACHAT (CT)   */}
      {/* ========================================== */}
      {showCreateDaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Émettre une Demande d'Achat (DA)</h3>
                  <p className="text-xs text-slate-500">Saisie par le Conducteur de travaux pour son chantier</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateDaModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDa} className="space-y-4">
              {/* Chantier destinataire */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Chantier Destinataire *
                </label>
                <select
                  value={newDaForm.chantier_id}
                  onChange={e => setNewDaForm({ ...newDaForm, chantier_id: e.target.value })}
                  required
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {chantiers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nom_projet} ({c.wilaya})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Les marchandises seront livrées directement au magasin de ce chantier.
                </p>
              </div>

              {/* Produit & Catégorie */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Désignation du Matériau / Produit *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Acier Haute Adhérence FeE500 Diamètre 14mm..."
                  value={newDaForm.designation_produit}
                  onChange={e => setNewDaForm({ ...newDaForm, designation_produit: e.target.value })}
                  required
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Quantité *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={newDaForm.quantite_demandee}
                    onChange={e => setNewDaForm({ ...newDaForm, quantite_demandee: Number(e.target.value) })}
                    required
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Unité de Mesure *
                  </label>
                  <select
                    value={newDaForm.unite_mesure}
                    onChange={e => setNewDaForm({ ...newDaForm, unite_mesure: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Niveau d'Urgence *
                  </label>
                  <select
                    value={newDaForm.niveau_urgence}
                    onChange={e => setNewDaForm({ ...newDaForm, niveau_urgence: e.target.value as NiveauUrgence })}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold text-slate-900"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="URGENT">Urgent (48h)</option>
                    <option value="CRITIQUE_ARRET_CHANTIER">CRITIQUE : Arrêt Chantier</option>
                  </select>
                </div>
              </div>

              {/* Date besoin & estimation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Date de Besoin au Chantier *
                  </label>
                  <input
                    type="date"
                    value={newDaForm.date_besoin_chantier}
                    onChange={e => setNewDaForm({ ...newDaForm, date_besoin_chantier: e.target.value })}
                    required
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Estimation Budget (DZD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ex: 500000"
                    value={newDaForm.estimation_budget_dzd}
                    onChange={e => setNewDaForm({ ...newDaForm, estimation_budget_dzd: Number(e.target.value) })}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Justification technique */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Justification Technique de la Demande *
                </label>
                <textarea
                  rows={3}
                  placeholder="Préciser l'ouvrage concerné (ex: coulage plancher haut R+3, voiles périphériques, référence plans BET validés)..."
                  value={newDaForm.justification}
                  onChange={e => setNewDaForm({ ...newDaForm, justification: e.target.value })}
                  required
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Circuit d’approbation :</strong> Dès soumission, cette demande sera transmise automatiquement à la <strong>Comptabilité</strong> pour contrôle budgétaire. Vous ne pouvez pas la valider vous-même.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateDaModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md"
                >
                  Transmettre à la Comptabilité
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODALE 2 : DÉCISION COMPTABILITÉ (VISA DA) */}
      {/* ========================================== */}
      {showValiderComptaModal && selectedDa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Visa Comptable & Budgétaire</h3>
                  <p className="text-xs text-slate-500">Demande {selectedDa.numero_da}</p>
                </div>
              </div>
              <button
                onClick={() => setShowValiderComptaModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Chantier :</span>
                <span className="font-bold text-slate-900">{selectedDa.chantier_nom}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Produit demandé :</span>
                <span className="font-semibold text-slate-900">{selectedDa.designation_produit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Quantité :</span>
                <span className="font-bold text-indigo-700">{selectedDa.quantite_demandee} {selectedDa.unite_mesure}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Urgence :</span>
                <span>{getUrgenceBadge(selectedDa.niveau_urgence)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Demandeur :</span>
                <span>{selectedDa.demandeur_nom} ({selectedDa.demandeur_role})</span>
              </div>
              <div className="border-t border-slate-200 pt-2 text-slate-700">
                <strong>Justification :</strong> {selectedDa.justification}
              </div>
            </div>

            <form onSubmit={handleComptaDecision} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Décision du Responsable Comptabilité *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setComptaDecisionForm({ ...comptaDecisionForm, decision: 'VALIDER' })}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      comptaDecisionForm.decision === 'VALIDER'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Valider le Budget
                  </button>
                  <button
                    type="button"
                    onClick={() => setComptaDecisionForm({ ...comptaDecisionForm, decision: 'REFUSER' })}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      comptaDecisionForm.decision === 'REFUSER'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    Refuser la Demande
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Commentaire / Motif du Visa *
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    comptaDecisionForm.decision === 'VALIDER'
                      ? 'Ligne budgétaire conforme. Imputation sur compte de dépenses du chantier...'
                      : 'Motif obligatoire du refus (ex: dépassement budget mensuel, manque de justificatif BET)...'
                  }
                  value={comptaDecisionForm.motif}
                  onChange={e => setComptaDecisionForm({ ...comptaDecisionForm, motif: e.target.value })}
                  required
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowValiderComptaModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl font-bold text-xs text-white shadow-md ${
                    comptaDecisionForm.decision === 'VALIDER'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Confirmer la décision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODALE 3 : ÉMISSION BON DE COMMANDE (BC)   */}
      {/* ========================================== */}
      {showCreateBcModal && selectedDa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Émettre un Bon de Commande (BC)</h3>
                  <p className="text-xs text-slate-500">Service Approvisionnements → Livraison Magasin Chantier</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateBcModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900">
              <strong>LIVRAISON DIRECTE AU CHANTIER :</strong> La marchandise commandée sera acheminée directement à l'adresse du magasin de <strong>{selectedDa.chantier_nom}</strong>. Aucun passage par un magasin central.
            </div>

            <form onSubmit={handleCreateBc} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Fournisseur Agréé Retenu *
                </label>
                <select
                  value={newBcForm.fournisseur_id}
                  onChange={e => setNewBcForm({ ...newBcForm, fournisseur_id: e.target.value })}
                  required
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">Sélectionner un fournisseur...</option>
                  {fournisseurs.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.nom_fournisseur} ({f.wilaya}) - NIF: {f.nif}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Quantité Commandée ({selectedDa.unite_mesure}) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={newBcForm.quantite_commandee}
                    onChange={e => setNewBcForm({ ...newBcForm, quantite_commandee: Number(e.target.value) })}
                    required
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Prix Unitaire HT (DZD) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newBcForm.prix_unitaire_ht_dzd}
                    onChange={e => setNewBcForm({ ...newBcForm, prix_unitaire_ht_dzd: Number(e.target.value) })}
                    required
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Date de Livraison au Chantier *
                  </label>
                  <input
                    type="date"
                    value={newBcForm.date_livraison_prevue}
                    onChange={e => setNewBcForm({ ...newBcForm, date_livraison_prevue: e.target.value })}
                    required
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Modalités de Règlement *
                  </label>
                  <input
                    type="text"
                    value={newBcForm.delai_paiement}
                    onChange={e => setNewBcForm({ ...newBcForm, delai_paiement: e.target.value })}
                    required
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Calculs récapitulatifs */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total HT :</span>
                  <span className="font-semibold text-slate-900">
                    {(newBcForm.quantite_commandee * newBcForm.prix_unitaire_ht_dzd).toLocaleString('fr-DZ')} DZD
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">TVA (19%) :</span>
                  <span className="font-semibold text-slate-900">
                    {Math.round(newBcForm.quantite_commandee * newBcForm.prix_unitaire_ht_dzd * 0.19).toLocaleString('fr-DZ')} DZD
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5 text-sm font-bold">
                  <span className="text-slate-900">Total TTC à engager :</span>
                  <span className="text-indigo-700">
                    {Math.round(newBcForm.quantite_commandee * newBcForm.prix_unitaire_ht_dzd * 1.19).toLocaleString('fr-DZ')} DZD
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateBcModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md"
                >
                  Émettre le Bon de Commande
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODALE 4 : RÉCEPTION AU MAGASIN (MAGASINIER)*/}
      {/* ========================================== */}
      {showReceptionModal && selectedBc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Réception au Magasin du Chantier</h3>
                  <p className="text-xs text-slate-500">Commande {selectedBc.numero_bc} - {selectedBc.chantier_destinataire_nom}</p>
                </div>
              </div>
              <button
                onClick={() => setShowReceptionModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterReception} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    N° Bon de Livraison Fournisseur (BL) *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: BL-SIDER-98412"
                    value={newReceptionForm.numero_bl_fournisseur}
                    onChange={e => setNewReceptionForm({ ...newReceptionForm, numero_bl_fournisseur: e.target.value })}
                    required
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Quantité Reçue ({selectedBc.unite_mesure}) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={newReceptionForm.quantite_recue}
                    onChange={e => {
                      const qte = Number(e.target.value);
                      setNewReceptionForm({
                        ...newReceptionForm,
                        quantite_recue: qte,
                        quantite_conforme: qte
                      });
                    }}
                    required
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Plaque d'Immatriculation Camion *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 01452-124-16"
                    value={newReceptionForm.numero_plaque_camion}
                    onChange={e => setNewReceptionForm({ ...newReceptionForm, numero_plaque_camion: e.target.value })}
                    required
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nom du Chauffeur Livreur *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Mohamed Benali"
                    value={newReceptionForm.nom_chauffeur}
                    onChange={e => setNewReceptionForm({ ...newReceptionForm, nom_chauffeur: e.target.value })}
                    required
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Contrôle de Conformité & Qualité *
                </label>
                <select
                  value={newReceptionForm.conformite_qualite}
                  onChange={e => setNewReceptionForm({ ...newReceptionForm, conformite_qualite: e.target.value as any })}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                >
                  <option value="CONFORME">Conforme aux fiches techniques et au bon de commande</option>
                  <option value="RESERVES">Réceptionné AVEC RÉSERVES (avaries, humidité, sacs déchirés)</option>
                  <option value="NON_CONFORME">NON CONFORME - REJET TOTAL DE LA LIVRAISON</option>
                </select>
              </div>

              {newReceptionForm.conformite_qualite !== 'CONFORME' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Motif des Réserves ou du Rejet *
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Décrire précisément l'anomalie constatée par le magasinier..."
                    value={newReceptionForm.motif_rejet_ou_reserves}
                    onChange={e => setNewReceptionForm({ ...newReceptionForm, motif_rejet_ou_reserves: e.target.value })}
                    required
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 text-xs text-teal-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span>
                  L'enregistrement de cette réception générera automatiquement le <strong>Bon de Réception Interne (BR)</strong> visé par le magasinier.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReceptionModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md"
                >
                  Valider la Réception Chantier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODALE 5 : HISTORIQUE DE VALIDATION & AUDIT*/}
      {/* ========================================== */}
      {showHistoryModal && selectedDa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Historique de Traçabilité de la DA</h3>
                  <p className="text-xs text-slate-500">{selectedDa.numero_da}</p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
              {selectedDa.historique_validations.map((h, i) => (
                <div key={h.id || i} className="relative flex items-start gap-4">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 z-10 shadow">
                    {i + 1}
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{h.auteur_nom}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(h.date).toLocaleDateString('fr-DZ', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-[11px] text-indigo-700 font-medium">{h.auteur_role}</div>
                    <div className="flex items-center gap-1.5 text-slate-600 font-semibold pt-1">
                      <span>{h.statut_precedent}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="text-indigo-900">{h.nouveau_statut}</span>
                    </div>
                    {h.commentaire && (
                      <p className="text-slate-600 italic bg-white p-2 rounded border border-slate-100 mt-1">
                        "{h.commentaire}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODALE 6 : NOUVEAU FOURNISSEUR AGRÉÉ      */}
      {/* ========================================== */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Enregistrer un Fournisseur Agréé</h3>
              </div>
              <button onClick={() => setShowAddSupplierModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAddSupplier} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Raison Sociale Fournisseur *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Société des Carrières d'Alger SPA"
                  value={newSupplierForm.nom_fournisseur}
                  onChange={e => setNewSupplierForm({ ...newSupplierForm, nom_fournisseur: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Forme Juridique *</label>
                  <select
                    value={newSupplierForm.forme_juridique}
                    onChange={e => setNewSupplierForm({ ...newSupplierForm, forme_juridique: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-300 p-2.5"
                  >
                    <option value="SPA">SPA</option>
                    <option value="SARL">SARL</option>
                    <option value="EURL">EURL</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Catégorie *</label>
                  <select
                    value={newSupplierForm.categorie}
                    onChange={e => setNewSupplierForm({ ...newSupplierForm, categorie: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-300 p-2.5"
                  >
                    <option value="MATERIAUX_GROS_OEUVRE">Matériaux Gros Œuvre</option>
                    <option value="ACIER_ARMATURES">Acier & Armatures</option>
                    <option value="CIMENT_BETON">Ciment & Béton</option>
                    <option value="OUTILLAGE_EPI">Outillage & EPI</option>
                    <option value="ELECTRICITE_PLOMBERIE">Électricité & Plomberie</option>
                    <option value="LOCATION_ENGINS">Location Engins & Grues</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIF *</label>
                  <input
                    type="text"
                    required
                    placeholder="000000000000000"
                    value={newSupplierForm.nif}
                    onChange={e => setNewSupplierForm({ ...newSupplierForm, nif: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">RC *</label>
                  <input
                    type="text"
                    required
                    placeholder="16/00-0000000B16"
                    value={newSupplierForm.rc}
                    onChange={e => setNewSupplierForm({ ...newSupplierForm, rc: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Téléphone *</label>
                  <input
                    type="text"
                    required
                    value={newSupplierForm.telephone}
                    onChange={e => setNewSupplierForm({ ...newSupplierForm, telephone: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Wilaya *</label>
                  <input
                    type="text"
                    required
                    value={newSupplierForm.wilaya}
                    onChange={e => setNewSupplierForm({ ...newSupplierForm, wilaya: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5"
                  />
                </div>
              </div>

              {/* Coordonnées Bancaires Fournisseur (RIB) */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950 uppercase">Coordonnées Bancaires & RIB Obligatoire</span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-300">
                    Norme Banque d'Algérie
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-emerald-950 mb-1">Banque Domiciliataire *</label>
                    <select
                      value={newSupplierForm.banque_nom}
                      onChange={e => setNewSupplierForm({ ...newSupplierForm, banque_nom: e.target.value })}
                      className="w-full rounded-lg border border-emerald-300 p-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Banque Nationale d’Algérie (BNA)">BNA - Banque Nationale d'Algérie (001)</option>
                      <option value="Banque Extérieure d’Algérie (BEA)">BEA - Banque Extérieure d'Algérie (002)</option>
                      <option value="Crédit Populaire d’Algérie (CPA)">CPA - Crédit Populaire d'Algérie (004)</option>
                      <option value="Banque du Développement Local (BDL)">BDL - Banque du Développement Local (005)</option>
                      <option value="BADR">BADR - Banque de l'Agriculture et du Dev. Rural (003)</option>
                      <option value="CNEP-Banque">CNEP-Banque (006)</option>
                      <option value="Al Baraka Bank Algérie">Al Baraka Bank Algérie (014)</option>
                      <option value="Société Générale Algérie">Société Générale Algérie (021)</option>
                      <option value="BNP Paribas El Djazaïr">BNP Paribas El Djazaïr (022)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-emerald-950 mb-1">Agence Bancaire</label>
                    <input
                      type="text"
                      placeholder="Ex: Agence Rouiba Code 120"
                      value={newSupplierForm.agence_banque}
                      onChange={e => setNewSupplierForm({ ...newSupplierForm, agence_banque: e.target.value })}
                      className="w-full rounded-lg border border-emerald-300 p-2 text-xs bg-white"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-emerald-950 text-xs">
                      Relevé d'Identité Bancaire (RIB - 20 chiffres obligatoires) *
                    </label>
                    <span className="text-[10px] font-mono font-bold text-emerald-900">
                      {newSupplierForm.rib.replace(/[\s-]/g, '').length}/20 chiffres
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="001 00234 1234567890 12"
                    value={newSupplierForm.rib}
                    onChange={e => setNewSupplierForm({ ...newSupplierForm, rib: e.target.value })}
                    className="w-full rounded-lg border border-emerald-300 p-2 text-xs font-mono font-bold bg-white text-emerald-950 tracking-wider focus:ring-2 focus:ring-emerald-500"
                  />
                  {(() => {
                    const check = formatAndValidateRIB(newSupplierForm.rib);
                    if (!newSupplierForm.rib) {
                      return (
                        <p className="text-[11px] font-semibold text-amber-700 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          Le RIB est obligatoire pour tout virement ou règlement de facture.
                        </p>
                      );
                    }
                    if (!check.isValid) {
                      return (
                        <p className="text-[11px] font-semibold text-rose-700 mt-1 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          {check.message}
                        </p>
                      );
                    }
                    return (
                      <p className="text-[11px] font-semibold text-emerald-700 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        Format RIB conforme : <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-200">{check.formattedRib}</span>
                      </p>
                    );
                  })()}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Adresse Siège *</label>
                <input
                  type="text"
                  required
                  value={newSupplierForm.adresse}
                  onChange={e => setNewSupplierForm({ ...newSupplierForm, adresse: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs"
                >
                  Enregistrer Fournisseur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODALE 7 : ÉDITION FOURNISSEUR & RIB       */}
      {/* ========================================== */}
      {editingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">Éditer Fiche Fournisseur & RIB</h3>
                  <p className="text-xs text-slate-500 font-mono">{editingSupplier.nom_fournisseur}</p>
                </div>
              </div>
              <button onClick={() => setEditingSupplier(null)}>✕</button>
            </div>

            <form onSubmit={handleUpdateSupplier} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Raison Sociale Fournisseur *</label>
                <input
                  type="text"
                  required
                  value={editingSupplier.nom_fournisseur}
                  onChange={e => setEditingSupplier({ ...editingSupplier, nom_fournisseur: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Forme Juridique *</label>
                  <select
                    value={editingSupplier.forme_juridique}
                    onChange={e => setEditingSupplier({ ...editingSupplier, forme_juridique: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 bg-white"
                  >
                    <option value="SPA">SPA</option>
                    <option value="SARL">SARL</option>
                    <option value="EURL">EURL</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Catégorie *</label>
                  <select
                    value={editingSupplier.categorie}
                    onChange={e => setEditingSupplier({ ...editingSupplier, categorie: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 bg-white"
                  >
                    <option value="MATERIAUX_GROS_OEUVRE">Matériaux Gros Œuvre</option>
                    <option value="ACIER_ARMATURES">Acier & Armatures</option>
                    <option value="CIMENT_BETON">Ciment & Béton</option>
                    <option value="OUTILLAGE_EPI">Outillage & EPI</option>
                    <option value="ELECTRICITE_PLOMBERIE">Électricité & Plomberie</option>
                    <option value="LOCATION_ENGINS">Location Engins & Grues</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIF *</label>
                  <input
                    type="text"
                    required
                    value={editingSupplier.nif}
                    onChange={e => setEditingSupplier({ ...editingSupplier, nif: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">RC *</label>
                  <input
                    type="text"
                    required
                    value={editingSupplier.rc}
                    onChange={e => setEditingSupplier({ ...editingSupplier, rc: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5"
                  />
                </div>
              </div>

              {/* Section Coordonnées Bancaires & RIB */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950 uppercase">Coordonnées Bancaires & RIB Obligatoire</span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-300">
                    Norme Banque d'Algérie
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-emerald-950 mb-1">Banque Domiciliataire *</label>
                    <select
                      value={editingSupplier.banque_nom || 'Banque Nationale d’Algérie (BNA)'}
                      onChange={e => setEditingSupplier({ ...editingSupplier, banque_nom: e.target.value })}
                      className="w-full rounded-lg border border-emerald-300 p-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Banque Nationale d’Algérie (BNA)">BNA - Banque Nationale d'Algérie (001)</option>
                      <option value="Banque Extérieure d’Algérie (BEA)">BEA - Banque Extérieure d'Algérie (002)</option>
                      <option value="Crédit Populaire d’Algérie (CPA)">CPA - Crédit Populaire d'Algérie (004)</option>
                      <option value="Banque du Développement Local (BDL)">BDL - Banque du Développement Local (005)</option>
                      <option value="BADR">BADR - Banque de l'Agriculture et du Dev. Rural (003)</option>
                      <option value="CNEP-Banque">CNEP-Banque (006)</option>
                      <option value="Al Baraka Bank Algérie">Al Baraka Bank Algérie (014)</option>
                      <option value="Société Générale Algérie">Société Générale Algérie (021)</option>
                      <option value="BNP Paribas El Djazaïr">BNP Paribas El Djazaïr (022)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-emerald-950 mb-1">Agence Bancaire</label>
                    <input
                      type="text"
                      placeholder="Ex: Agence Rouiba Code 120"
                      value={editingSupplier.agence_banque || ''}
                      onChange={e => setEditingSupplier({ ...editingSupplier, agence_banque: e.target.value })}
                      className="w-full rounded-lg border border-emerald-300 p-2 text-xs bg-white"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-emerald-950 text-xs">
                      Relevé d'Identité Bancaire (RIB - 20 chiffres obligatoires) *
                    </label>
                    <span className="text-[10px] font-mono font-bold text-emerald-900">
                      {(editingSupplier.rib || '').replace(/[\s-]/g, '').length}/20 chiffres
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="001 00234 1234567890 12"
                    value={editingSupplier.rib || ''}
                    onChange={e => setEditingSupplier({ ...editingSupplier, rib: e.target.value })}
                    className="w-full rounded-lg border border-emerald-300 p-2 text-xs font-mono font-bold bg-white text-emerald-950 tracking-wider focus:ring-2 focus:ring-emerald-500"
                  />
                  {(() => {
                    const check = formatAndValidateRIB(editingSupplier.rib || '');
                    if (!editingSupplier.rib) {
                      return (
                        <p className="text-[11px] font-semibold text-amber-700 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          Le RIB est obligatoire pour tout virement ou règlement de facture.
                        </p>
                      );
                    }
                    if (!check.isValid) {
                      return (
                        <p className="text-[11px] font-semibold text-rose-700 mt-1 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          {check.message}
                        </p>
                      );
                    }
                    return (
                      <p className="text-[11px] font-semibold text-emerald-700 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        Format RIB conforme : <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-200">{check.formattedRib}</span>
                      </p>
                    );
                  })()}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Téléphone *</label>
                <input
                  type="text"
                  required
                  value={editingSupplier.telephone}
                  onChange={e => setEditingSupplier({ ...editingSupplier, telephone: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Adresse Siège *</label>
                <input
                  type="text"
                  required
                  value={editingSupplier.adresse}
                  onChange={e => setEditingSupplier({ ...editingSupplier, adresse: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingSupplier(null)}
                  className="px-4 py-2 rounded-xl border text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs"
                >
                  Enregistrer les Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
