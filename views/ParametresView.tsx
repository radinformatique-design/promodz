'use client';

import React, { useState } from 'react';
import {
  Building2,
  Landmark,
  Sliders,
  HardHat,
  Save,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  CreditCard,
  Calendar,
  Clock,
  Bell,
  Globe,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Lock,
  Layers,
  MapPin,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CompteBancaire, Chantier, ChantierStatut, UniteMesure, ExerciceComptable } from '../types/database';

export const ParametresView: React.FC = () => {
  const {
    entreprise,
    updateEntreprise,
    comptesBancaires,
    addCompteBancaire,
    updateCompteBancaire,
    deleteCompteBancaire,
    parametresGeneraux,
    updateParametresGeneraux,
    currentLanguage,
    setLanguage,
    isRtl,
    allChantiers,
    addChantier,
    updateChantier,
    deleteChantierControlled,
    utilisateurs,
    hasPermission,
    currentUser
  } = useApp();

  const [activeTab, setActiveTab] = useState<'identite' | 'banques' | 'general' | 'chantiers'>('identite');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canEdit = currentUser?.role_id === 'role-admin' || hasPermission('PARAMETRES', 'MODIFIER');

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      setSuccessMessage(null);
    } else {
      setSuccessMessage(msg);
      setErrorMessage(null);
    }
    setTimeout(() => {
      setSuccessMessage(null);
      setErrorMessage(null);
    }, 4000);
  };

  // 1. STATE FOR IDENTITÉ DE L'ENTREPRISE
  const [identiteForm, setIdentiteForm] = useState({
    raison_sociale: entreprise.raison_sociale,
    nom_commercial: entreprise.nom_commercial,
    forme_juridique: entreprise.forme_juridique,
    capital_social: entreprise.capital_social,
    rc: entreprise.rc,
    nif: entreprise.nif,
    nis: entreprise.nis,
    article_imposition: entreprise.article_imposition,
    agrement_promoteur: entreprise.agrement_promoteur || 'AGR-MHUV-16-2018-0412',
    date_agrement: entreprise.date_agrement || '2018-05-22',
    adresse_siege: entreprise.adresse_siege,
    wilaya: entreprise.wilaya,
    commune_siege: entreprise.commune_siege || 'Alger Centre',
    code_postal: entreprise.code_postal || '16000',
    telephone: entreprise.telephone,
    email: entreprise.email,
    site_web: entreprise.site_web || 'https://www.batiprom-dz.com',
    logo_url: entreprise.logo_url || ''
  });

  const handleSaveIdentite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      showNotification("Accès refusé : Seul l'administrateur peut modifier l'identité de l'entreprise.", true);
      return;
    }
    updateEntreprise(identiteForm);
    showNotification("Identité de l'entreprise mise à jour et enregistrée avec succès.");
  };

  // 2. STATE FOR INFORMATIONS BANCAIRES
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [bankFormData, setBankFormData] = useState({
    nom_banque: 'Banque Nationale d’Algérie (BNA)',
    code_banque: '001',
    agence: '',
    titulaire: entreprise.raison_sociale,
    rib: '',
    iban: '',
    swift_bic: '',
    devise: 'DZD' as 'DZD' | 'EUR' | 'USD',
    actif: true,
    is_compte_principal: false,
    type_compte: 'COURANT' as CompteBancaire['type_compte'],
    chantier_dedie_id: ''
  });

  const handleOpenAddBank = () => {
    setEditingBankId(null);
    setBankFormData({
      nom_banque: 'Banque Nationale d’Algérie (BNA)',
      code_banque: '001',
      agence: 'Agence Amirouche (Alger)',
      titulaire: entreprise.raison_sociale,
      rib: '001 00601 ',
      iban: '',
      swift_bic: 'BNAL DZA AL',
      devise: 'DZD',
      actif: true,
      is_compte_principal: false,
      type_compte: 'COURANT',
      chantier_dedie_id: ''
    });
    setIsBankModalOpen(true);
  };

  const handleOpenEditBank = (compte: CompteBancaire) => {
    setEditingBankId(compte.id);
    setBankFormData({
      nom_banque: compte.nom_banque,
      code_banque: compte.code_banque,
      agence: compte.agence,
      titulaire: compte.titulaire,
      rib: compte.rib,
      iban: compte.iban || '',
      swift_bic: compte.swift_bic || '',
      devise: compte.devise,
      actif: compte.actif,
      is_compte_principal: compte.is_compte_principal,
      type_compte: compte.type_compte,
      chantier_dedie_id: compte.chantier_dedie_id || ''
    });
    setIsBankModalOpen(true);
  };

  const handleSaveBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      showNotification("Accès refusé : Seul l'administrateur peut modifier les comptes bancaires.", true);
      return;
    }

    const dedicatedChantier = allChantiers.find(c => c.id === bankFormData.chantier_dedie_id);

    if (editingBankId) {
      updateCompteBancaire(editingBankId, {
        ...bankFormData,
        chantier_dedie_nom: dedicatedChantier?.nom_projet
      });
      showNotification("Coordonnées bancaires mises à jour.");
    } else {
      addCompteBancaire({
        ...bankFormData,
        entreprise_id: entreprise.id,
        chantier_dedie_nom: dedicatedChantier?.nom_projet
      });
      showNotification("Nouveau compte bancaire enregistré avec succès.");
    }
    setIsBankModalOpen(false);
  };

  // 3. STATE FOR PARAMÈTRES GÉNÉRAUX
  const [generalForm, setGeneralForm] = useState({
    devise_principale: parametresGeneraux.devise_principale,
    format_date: parametresGeneraux.format_date,
    horaire_debut: parametresGeneraux.horaires_travail.debut,
    horaire_fin: parametresGeneraux.horaires_travail.fin,
    pause_debut: parametresGeneraux.horaires_travail.pause_dejeuner_debut,
    pause_fin: parametresGeneraux.horaires_travail.pause_dejeuner_fin,
    heure_limite_pointage: parametresGeneraux.heure_limite_pointage,
    email_actif: parametresGeneraux.notifications_config.email_actif,
    sms_actif: parametresGeneraux.notifications_config.sms_actif,
    alerte_budget_pct: parametresGeneraux.notifications_config.alerte_depassement_budget_pct,
    rappel_ctc_jours: parametresGeneraux.notifications_config.rappel_delai_jours_ctc,
    alerte_stock: parametresGeneraux.notifications_config.alerte_stock_critique,
    notifier_dg: parametresGeneraux.notifications_config.notifier_direction_generale
  });

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      showNotification("Accès refusé : Seul l'administrateur peut modifier les paramètres généraux.", true);
      return;
    }

    updateParametresGeneraux({
      devise_principale: generalForm.devise_principale,
      format_date: generalForm.format_date,
      horaires_travail: {
        debut: generalForm.horaire_debut,
        fin: generalForm.horaire_fin,
        pause_dejeuner_debut: generalForm.pause_debut,
        pause_dejeuner_fin: generalForm.pause_fin,
        jours_ouvres: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi']
      },
      heure_limite_pointage: generalForm.heure_limite_pointage,
      notifications_config: {
        ...parametresGeneraux.notifications_config,
        email_actif: generalForm.email_actif,
        sms_actif: generalForm.sms_actif,
        alerte_depassement_budget_pct: Number(generalForm.alerte_budget_pct),
        rappel_delai_jours_ctc: Number(generalForm.rappel_ctc_jours),
        alerte_stock_critique: generalForm.alerte_stock,
        notifier_direction_generale: generalForm.notifier_dg
      }
    });

    showNotification("Paramètres généraux et seuils de notifications enregistrés.");
  };

  // 4. STATE FOR CHANTIERS MANAGEMENT INSIDE PARAMÈTRES
  const [isChantierModalOpen, setIsChantierModalOpen] = useState(false);
  const [editingChantierId, setEditingChantierId] = useState<string | null>(null);
  const [chantierForm, setChantierForm] = useState({
    code_chantier: '',
    nom_projet: '',
    description: '',
    wilaya: 'Alger (16)',
    commune: '',
    adresse_site: '',
    date_ouverture_chantier: new Date().toISOString().split('T')[0],
    date_livraison_prevue: '2027-12-31',
    budget_global_prevu: 1500000000,
    statut: 'ETUDE_FONCIERE' as ChantierStatut,
    directeur_chantier_id: '',
    conducteur_travaux_id: '',
    superficie_terrain_m2: 3500,
    surface_plancher_m2: 12500,
    nombre_logements: 80,
    nombre_locaux_commerciaux: 4,
    nombre_niveaux: '2SS + RDC + 9',
    permis_construire_ref: '',
    organisme_ctc: 'CTC Centre'
  });

  const handleOpenAddChantier = () => {
    setEditingChantierId(null);
    setChantierForm({
      code_chantier: `CHT-ALG-${new Date().getFullYear()}-${allChantiers.length + 1}`,
      nom_projet: '',
      description: '',
      wilaya: 'Alger (16)',
      commune: 'Chéraga',
      adresse_site: '',
      date_ouverture_chantier: new Date().toISOString().split('T')[0],
      date_livraison_prevue: '2027-12-31',
      budget_global_prevu: 1500000000,
      statut: 'ETUDE_FONCIERE',
      directeur_chantier_id: 'user-admin',
      conducteur_travaux_id: 'user-ct',
      superficie_terrain_m2: 3500,
      surface_plancher_m2: 12500,
      nombre_logements: 80,
      nombre_locaux_commerciaux: 4,
      nombre_niveaux: '2SS + RDC + 9',
      permis_construire_ref: '',
      organisme_ctc: 'CTC Centre'
    });
    setIsChantierModalOpen(true);
  };

  const handleOpenEditChantier = (c: Chantier) => {
    setEditingChantierId(c.id);
    setChantierForm({
      code_chantier: c.code_chantier,
      nom_projet: c.nom_projet,
      description: c.description || '',
      wilaya: c.wilaya,
      commune: c.commune,
      adresse_site: c.adresse_site,
      date_ouverture_chantier: c.date_ouverture_chantier,
      date_livraison_prevue: c.date_livraison_prevue,
      budget_global_prevu: c.budget_global_prevu,
      statut: c.statut,
      directeur_chantier_id: c.directeur_chantier_id || '',
      conducteur_travaux_id: c.conducteur_travaux_id || '',
      superficie_terrain_m2: c.superficie_terrain_m2,
      surface_plancher_m2: c.surface_plancher_m2,
      nombre_logements: c.nombre_logements,
      nombre_locaux_commerciaux: c.nombre_locaux_commerciaux,
      nombre_niveaux: c.nombre_niveaux,
      permis_construire_ref: c.permis_construire_ref || '',
      organisme_ctc: c.organisme_ctc || 'CTC Centre'
    });
    setIsChantierModalOpen(true);
  };

  const handleSaveChantierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      showNotification("Accès refusé : Vous n'avez pas l'autorisation de modifier les chantiers.", true);
      return;
    }

    if (editingChantierId) {
      updateChantier(editingChantierId, chantierForm);
      showNotification(`Chantier "${chantierForm.nom_projet}" mis à jour avec succès.`);
    } else {
      addChantier(chantierForm);
      showNotification(`Nouveau chantier "${chantierForm.nom_projet}" créé avec succès.`);
    }
    setIsChantierModalOpen(false);
  };

  const handleDeleteChantier = (id: string) => {
    if (!canEdit) {
      showNotification("Accès refusé : Action réservée à l'administrateur.", true);
      return;
    }
    const res = deleteChantierControlled(id);
    if (!res.success) {
      showNotification(res.message, true);
    } else {
      showNotification(res.message);
    }
  };

  return (
    <div className={`space-y-6 ${isRtl ? 'text-right' : 'text-left'}`}>
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-1">
            <Sliders className="w-4 h-4" />
            <span>Configuration & Gouvernance de l'Entreprise</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {isRtl ? 'إعدادات الشركة وإدارة المشاريع' : "Paramètres de l'Entreprise & Multi-Chantiers"}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {isRtl
              ? 'تكوين الهوية القانونية للترقية العقارية، الحسابات البنكية، الإعدادات العامة ونظام المشاريع.'
              : "Configuration officielle du promoteur immobilier : identité légale, agrément ministériel, comptes bancaires et RIB, devises, bilinguisme FR/AR avec support RTL, et paramétrage des chantiers."}
          </p>
        </div>

        {/* Global language toggle shortcut */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg shrink-0 self-start md:self-auto text-xs">
          <button
            onClick={() => setLanguage('fr')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
              currentLanguage === 'fr' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Français
          </button>
          <button
            onClick={() => setLanguage('ar')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
              currentLanguage === 'ar' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            العربية (RTL)
          </button>
        </div>
      </div>

      {/* Feedback Alerts */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Security alert if not admin */}
      {!canEdit && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Mode Consultation : Seul l'administrateur ou les utilisateurs autorisés peuvent enregistrer les modifications de paramètres.</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('identite')}
          className={`pb-3 px-4 font-semibold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'identite'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Identité de l'entreprise</span>
        </button>

        <button
          onClick={() => setActiveTab('banques')}
          className={`pb-3 px-4 font-semibold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'banques'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>Informations bancaires ({comptesBancaires.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('general')}
          className={`pb-3 px-4 font-semibold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'general'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Paramètres généraux & Horaires</span>
        </button>

        <button
          onClick={() => setActiveTab('chantiers')}
          className={`pb-3 px-4 font-semibold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'chantiers'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <HardHat className="w-4 h-4" />
          <span>Gestion des chantiers ({allChantiers.length})</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* ONGLET 1 : IDENTITÉ DE L'ENTREPRISE */}
      {/* ============================================================ */}
      {activeTab === 'identite' && (
        <form onSubmit={handleSaveIdentite} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Fiche Signalétique & Identifiants Administratifs
              </h3>
              <p className="text-xs text-slate-500">
                Informations officielles de la société de promotion immobilière agréée en Algérie.
              </p>
            </div>
            {canEdit && (
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Enregistrer les modifications</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Raison Sociale *</label>
              <input
                type="text"
                required
                disabled={!canEdit}
                value={identiteForm.raison_sociale}
                onChange={(e) => setIdentiteForm({ ...identiteForm, raison_sociale: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Nom Commercial / Marque *</label>
              <input
                type="text"
                required
                disabled={!canEdit}
                value={identiteForm.nom_commercial}
                onChange={(e) => setIdentiteForm({ ...identiteForm, nom_commercial: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Forme Juridique *</label>
              <select
                disabled={!canEdit}
                value={identiteForm.forme_juridique}
                onChange={(e) => setIdentiteForm({ ...identiteForm, forme_juridique: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white disabled:bg-slate-50"
              >
                <option value="SPA">SPA (Société par Actions)</option>
                <option value="SARL">SARL (Société à Responsabilité Limitée)</option>
                <option value="EURL">EURL (Entreprise Unipersonnelle)</option>
                <option value="SNC">SNC (Société en Nom Collectif)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Capital Social (DZD) *</label>
              <input
                type="number"
                required
                disabled={!canEdit}
                value={identiteForm.capital_social}
                onChange={(e) => setIdentiteForm({ ...identiteForm, capital_social: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-semibold disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Registre du Commerce (RC) *</label>
              <input
                type="text"
                required
                disabled={!canEdit}
                value={identiteForm.rc}
                onChange={(e) => setIdentiteForm({ ...identiteForm, rc: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">NIF (Identifiant Fiscal) *</label>
              <input
                type="text"
                required
                disabled={!canEdit}
                value={identiteForm.nif}
                onChange={(e) => setIdentiteForm({ ...identiteForm, nif: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">NIS (Identifiant Statistique) *</label>
              <input
                type="text"
                required
                disabled={!canEdit}
                value={identiteForm.nis}
                onChange={(e) => setIdentiteForm({ ...identiteForm, nis: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Article d'Imposition *</label>
              <input
                type="text"
                required
                disabled={!canEdit}
                value={identiteForm.article_imposition}
                onChange={(e) => setIdentiteForm({ ...identiteForm, article_imposition: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">N° Agrément Promoteur Immobilier *</label>
              <input
                type="text"
                required
                disabled={!canEdit}
                value={identiteForm.agrement_promoteur}
                onChange={(e) => setIdentiteForm({ ...identiteForm, agrement_promoteur: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono text-emerald-800 font-semibold disabled:bg-slate-50"
                placeholder="AGR-MHUV-16-..."
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Date d'Obtention de l'Agrément</label>
              <input
                type="date"
                disabled={!canEdit}
                value={identiteForm.date_agrement}
                onChange={(e) => setIdentiteForm({ ...identiteForm, date_agrement: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Wilaya du Siège *</label>
              <input
                type="text"
                required
                disabled={!canEdit}
                value={identiteForm.wilaya}
                onChange={(e) => setIdentiteForm({ ...identiteForm, wilaya: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Commune du Siège</label>
              <input
                type="text"
                disabled={!canEdit}
                value={identiteForm.commune_siege}
                onChange={(e) => setIdentiteForm({ ...identiteForm, commune_siege: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs disabled:bg-slate-50"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">Adresse Complète du Siège Social *</label>
              <input
                type="text"
                required
                disabled={!canEdit}
                value={identiteForm.adresse_siege}
                onChange={(e) => setIdentiteForm({ ...identiteForm, adresse_siege: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Téléphone Standard *</label>
              <input
                type="text"
                required
                disabled={!canEdit}
                value={identiteForm.telephone}
                onChange={(e) => setIdentiteForm({ ...identiteForm, telephone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Email Corporate Officiel *</label>
              <input
                type="email"
                required
                disabled={!canEdit}
                value={identiteForm.email}
                onChange={(e) => setIdentiteForm({ ...identiteForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Site Web Corporate</label>
              <input
                type="text"
                disabled={!canEdit}
                value={identiteForm.site_web}
                onChange={(e) => setIdentiteForm({ ...identiteForm, site_web: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs disabled:bg-slate-50"
                placeholder="https://..."
              />
            </div>
          </div>
        </form>
      )}

      {/* ============================================================ */}
      {/* ONGLET 2 : INFORMATIONS BANCAIRES */}
      {/* ============================================================ */}
      {activeTab === 'banques' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Comptes Bancaires & Relevés d'Identité Bancaire (RIB)
              </h3>
              <p className="text-xs text-slate-500">
                Gestion des comptes courants, comptes séquestres VEFA (conformes au Fonds de Garantie FGCMPI) et comptes devises.
              </p>
            </div>

            {canEdit && (
              <button
                onClick={handleOpenAddBank}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter un compte bancaire</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {comptesBancaires.map((compte) => (
              <div
                key={compte.id}
                className={`bg-white rounded-xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                  compte.is_compte_principal
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                } ${!compte.actif ? 'opacity-60 bg-slate-50' : ''}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                        <Landmark className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs line-clamp-1">
                          {compte.nom_banque}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {compte.agence}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {compte.is_compte_principal && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          Principal
                        </span>
                      )}
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        compte.actif ? 'bg-blue-50 text-blue-700' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {compte.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  </div>

                  {/* RIB Display */}
                  <div className="my-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs">
                    <div className="text-[10px] text-slate-400 uppercase font-sans">Relevé d'Identité Bancaire (20 chiffres)</div>
                    <div className="font-bold text-slate-900 tracking-wider text-xs mt-0.5">
                      {compte.rib}
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400 text-[11px]">Titulaire :</span>{' '}
                      <span className="font-semibold text-slate-800">{compte.titulaire}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Devise : <strong className="font-mono">{compte.devise}</strong></span>
                      <span>Type : <strong className="text-emerald-800">{compte.type_compte}</strong></span>
                    </div>
                    {compte.chantier_dedie_nom && (
                      <div className="mt-2 text-[10px] text-blue-700 bg-blue-50 p-1.5 rounded font-medium">
                        Compte séquestre dédié au chantier : {compte.chantier_dedie_nom}
                      </div>
                    )}
                  </div>
                </div>

                {canEdit && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      onClick={() => handleOpenEditBank(compte)}
                      className="text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Modifier</span>
                    </button>

                    <button
                      onClick={() => deleteCompteBancaire(compte.id)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                      title="Supprimer le compte"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ONGLET 3 : PARAMÈTRES GÉNÉRAUX */}
      {/* ============================================================ */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveGeneral} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Paramètres Système, Horaires & Alertes Automatiques
              </h3>
              <p className="text-xs text-slate-500">
                Configurations globales des devises, formats de date, pointage et notifications.
              </p>
            </div>
            {canEdit && (
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Enregistrer les paramètres généraux</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
            {/* Box 1: Langue & Devise */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span>Devise & Localisation</span>
              </h4>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Devise Principale</label>
                <select
                  disabled={!canEdit}
                  value={generalForm.devise_principale}
                  onChange={(e) => setGeneralForm({ ...generalForm, devise_principale: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white font-mono font-bold"
                >
                  <option value="DZD">DZD - Dinar Algérien (د.ج)</option>
                  <option value="EUR">EUR - Euro (€)</option>
                  <option value="USD">USD - Dollar US ($)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Format d'affichage des dates</label>
                <select
                  disabled={!canEdit}
                  value={generalForm.format_date}
                  onChange={(e) => setGeneralForm({ ...generalForm, format_date: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white font-mono"
                >
                  <option value="JJ/MM/AAAA">JJ/MM/AAAA (ex: 08/11/2026)</option>
                  <option value="AAAA-MM-JJ">AAAA-MM-JJ (ex: 2026-11-08)</option>
                  <option value="JJ-MM-AAAA">JJ-MM-AAAA (ex: 08-11-2026)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Orientation de l'Interface</label>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-600">
                  {isRtl ? 'Orientation RTL (من اليمين إلى اليسار)' : 'Orientation LTR (De gauche à droite)'}
                </div>
              </div>
            </div>

            {/* Box 2: Horaires de travail & Pointage */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Horaires & Pointage Chantier</span>
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Début de journée</label>
                  <input
                    type="time"
                    disabled={!canEdit}
                    value={generalForm.horaire_debut}
                    onChange={(e) => setGeneralForm({ ...generalForm, horaire_debut: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Fin de journée</label>
                  <input
                    type="time"
                    disabled={!canEdit}
                    value={generalForm.horaire_fin}
                    onChange={(e) => setGeneralForm({ ...generalForm, horaire_fin: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Heure limite de pointage (Matin) *</label>
                <input
                  type="time"
                  disabled={!canEdit}
                  value={generalForm.heure_limite_pointage}
                  onChange={(e) => setGeneralForm({ ...generalForm, heure_limite_pointage: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white font-mono font-bold text-amber-700"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Tout pointage au-delà de cette heure déclenche une alerte de retard.
                </span>
              </div>

              <div className="pt-2 text-[11px] text-slate-600">
                Jours ouvrés officiels : <strong>Dimanche au Jeudi</strong> (Algérie).
              </div>
            </div>

            {/* Box 3: Paramètres des notifications & alertes */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-purple-600" />
                <span>Seuils d'Alertes Automatiques</span>
              </h4>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Seuil Alerte Dépassement Budget (%)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="50"
                    max="100"
                    disabled={!canEdit}
                    value={generalForm.alerte_budget_pct}
                    onChange={(e) => setGeneralForm({ ...generalForm, alerte_budget_pct: Number(e.target.value) })}
                    className="w-24 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white font-mono font-bold"
                  />
                  <span className="text-slate-500 font-mono">% du budget global</span>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Rappel Échéances CTC (Jours avant)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    disabled={!canEdit}
                    value={generalForm.rappel_ctc_jours}
                    onChange={(e) => setGeneralForm({ ...generalForm, rappel_ctc_jours: Number(e.target.value) })}
                    className="w-24 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white font-mono"
                  />
                  <span className="text-slate-500">jours avant visite CTC</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!canEdit}
                    checked={generalForm.alerte_stock}
                    onChange={(e) => setGeneralForm({ ...generalForm, alerte_stock: e.target.checked })}
                    className="rounded text-emerald-600 border-slate-300"
                  />
                  <span className="text-slate-700">Alerte rupture stock matériaux (Acier/Ciment)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!canEdit}
                    checked={generalForm.notifier_dg}
                    onChange={(e) => setGeneralForm({ ...generalForm, notifier_dg: e.target.checked })}
                    className="rounded text-emerald-600 border-slate-300"
                  />
                  <span className="text-slate-700">Notifier la Direction Générale sur dépassements</span>
                </label>
              </div>
            </div>
          </div>

          {/* Tables des Unités & Exercices */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            {/* Unités de mesure */}
            <div>
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
                Référentiel des Unités de Mesure BTP
              </h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="py-2 px-3">Code</th>
                      <th className="py-2 px-3">Libellé</th>
                      <th className="py-2 px-3">Symbole</th>
                      <th className="py-2 px-3">Catégorie</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parametresGeneraux.unites_mesure.map((u) => (
                      <tr key={u.id}>
                        <td className="py-1.5 px-3 font-mono font-semibold">{u.code}</td>
                        <td className="py-1.5 px-3">{u.libelle}</td>
                        <td className="py-1.5 px-3 font-mono font-bold text-emerald-700">{u.symbole}</td>
                        <td className="py-1.5 px-3 text-[10px] text-slate-500">{u.categorie}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Exercices comptables */}
            <div>
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
                Exercices Comptables & Fiscaux (DZD)
              </h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="py-2 px-3">Année</th>
                      <th className="py-2 px-3">Période</th>
                      <th className="py-2 px-3">Statut</th>
                      <th className="py-2 px-3">Observations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parametresGeneraux.exercices_comptables.map((ex) => (
                      <tr key={ex.id}>
                        <td className="py-1.5 px-3 font-mono font-bold">{ex.annee}</td>
                        <td className="py-1.5 px-3 font-mono text-[11px] text-slate-600">
                          {ex.date_debut} au {ex.date_fin}
                        </td>
                        <td className="py-1.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ex.statut === 'OUVERT' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {ex.statut}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-slate-500 text-[11px] truncate max-w-xs">{ex.observations}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ============================================================ */}
      {/* ONGLET 4 : GESTION DES CHANTIERS */}
      {/* ============================================================ */}
      {activeTab === 'chantiers' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Paramétrage & Affectations des Chantiers
              </h3>
              <p className="text-xs text-slate-500">
                Création de code unique, localisation wilaya/commune, calendrier de réalisation, budgets et nomination des conducteurs de travaux.
              </p>
            </div>

            {canEdit && (
              <button
                onClick={handleOpenAddChantier}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Créer un nouveau chantier</span>
              </button>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Code & Projet</th>
                    <th className="py-3 px-4">Localisation (Wilaya)</th>
                    <th className="py-3 px-4">Calendrier Prévu</th>
                    <th className="py-3 px-4">Budget Global (DZD)</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4">Responsables Affectés</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allChantiers.map((c) => {
                    const directeur = utilisateurs.find(u => u.id === c.directeur_chantier_id);
                    const conducteur = utilisateurs.find(u => u.id === c.conducteur_travaux_id);

                    return (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded inline-block font-semibold border border-emerald-200">
                            {c.code_chantier}
                          </div>
                          <div className="font-bold text-slate-900 mt-1">{c.nom_projet}</div>
                          <div className="text-[11px] text-slate-500">{c.nombre_logements} logts · {c.nombre_niveaux}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 text-slate-800 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{c.commune}, {c.wilaya}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">{c.adresse_site}</div>
                        </td>

                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                          <div>Du : {c.date_ouverture_chantier}</div>
                          <div>Au : {c.date_livraison_prevue}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-slate-900">
                            {c.budget_global_prevu.toLocaleString()} DZD
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Engagé : {c.budget_engage.toLocaleString()} DZD
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 uppercase">
                            {c.statut.replace(/_/g, ' ')}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-xs">
                          <div>
                            <span className="text-slate-400 text-[10px]">Conducteur :</span>{' '}
                            <span className="font-semibold text-slate-800">{conducteur ? `${conducteur.prenom} ${conducteur.nom}` : 'Non assigné'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px]">Directeur :</span>{' '}
                            <span className="text-slate-700">{directeur ? `${directeur.prenom} ${directeur.nom}` : 'Direction'}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditChantier(c)}
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900"
                              title="Modifier la configuration du chantier"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {canEdit && (
                              <button
                                onClick={() => handleDeleteChantier(c.id)}
                                className="p-1.5 rounded hover:bg-rose-50 text-rose-500 hover:text-rose-700"
                                title="Suppression contrôlée"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
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
      {/* MODAL : AJOUT / MODIFICATION COMPTE BANCAIRE */}
      {/* ============================================================ */}
      {isBankModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Landmark className="w-4 h-4 text-emerald-600" />
                <span>{editingBankId ? 'Modifier les Coordonnées Bancaires' : 'Ajouter un Compte Bancaire'}</span>
              </h3>
              <button onClick={() => setIsBankModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveBankSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Établissement Bancaire *</label>
                  <select
                    value={bankFormData.nom_banque}
                    onChange={(e) => setBankFormData({ ...bankFormData, nom_banque: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-xs"
                  >
                    <option value="Banque Nationale d’Algérie (BNA)">BNA - Banque Nationale d’Algérie</option>
                    <option value="Crédit Populaire d’Algérie (CPA)">CPA - Crédit Populaire d’Algérie</option>
                    <option value="Banque Extérieure d’Algérie (BEA)">BEA - Banque Extérieure d’Algérie</option>
                    <option value="Banque de Développement Local (BDL)">BDL - Banque de Développement Local</option>
                    <option value="CNEP Banque">CNEP Banque</option>
                    <option value="BADR Banque">BADR Banque</option>
                    <option value="Al Baraka Bank Algeria">Al Baraka Bank Algeria</option>
                    <option value="Société Générale Algérie">Société Générale Algérie</option>
                    <option value="Banque de l’Habitat (Algérie)">Banque de l’Habitat</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Agence de Domiciliation *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Agence Chéraga 142"
                    value={bankFormData.agence}
                    onChange={(e) => setBankFormData({ ...bankFormData, agence: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Titulaire du Compte *</label>
                <input
                  type="text"
                  required
                  value={bankFormData.titulaire}
                  onChange={(e) => setBankFormData({ ...bankFormData, titulaire: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Relevé d'Identité Bancaire (RIB - 20 Chiffres) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="001 00601 0200012345 67"
                  value={bankFormData.rib}
                  onChange={(e) => setBankFormData({ ...bankFormData, rib: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Structure officielle Banque d'Algérie : 3 chiffres banque + 5 guichet + 10 compte + 2 clé.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Devise du compte *</label>
                  <select
                    value={bankFormData.devise}
                    onChange={(e) => setBankFormData({ ...bankFormData, devise: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-xs font-mono font-bold"
                  >
                    <option value="DZD">DZD (Dinar Algérien)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="USD">USD (Dollar)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Type de compte bancaire *</label>
                  <select
                    value={bankFormData.type_compte}
                    onChange={(e) => setBankFormData({ ...bankFormData, type_compte: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-xs"
                  >
                    <option value="COURANT">Compte Courant Exploitation</option>
                    <option value="SEQUESTRE_VEFA">Compte Séquestre VEFA (FGCMPI)</option>
                    <option value="DEVISES">Compte Devises</option>
                    <option value="EPARGNE">Compte Épargne / Dépôt</option>
                  </select>
                </div>
              </div>

              {/* Raccordement à un chantier spécifique */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Chantier rattaché (obligatoire si compte séquestre VEFA)
                </label>
                <select
                  value={bankFormData.chantier_dedie_id}
                  onChange={(e) => setBankFormData({ ...bankFormData, chantier_dedie_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-xs"
                >
                  <option value="">Compte général siège (Non dédié)</option>
                  {allChantiers.map(c => (
                    <option key={c.id} value={c.id}>{c.nom_projet} ({c.wilaya})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bankFormData.actif}
                    onChange={(e) => setBankFormData({ ...bankFormData, actif: e.target.checked })}
                    className="rounded text-emerald-600 border-slate-300"
                  />
                  <span className="font-medium text-slate-700">Compte Actif</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bankFormData.is_compte_principal}
                    onChange={(e) => setBankFormData({ ...bankFormData, is_compte_principal: e.target.checked })}
                    className="rounded text-emerald-600 border-slate-300"
                  />
                  <span className="font-medium text-slate-700">Compte Principal de l'Entreprise</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  {editingBankId ? 'Mettre à jour' : 'Enregistrer le compte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL : CRÉATION OU ÉDITION DU CHANTIER */}
      {/* ============================================================ */}
      {isChantierModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 text-xs my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <HardHat className="w-4 h-4 text-emerald-600" />
                <span>{editingChantierId ? 'Modifier les Paramètres du Chantier' : 'Ouvrir un Nouveau Chantier'}</span>
              </h3>
              <button onClick={() => setIsChantierModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveChantierSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Code Unique Chantier *</label>
                  <input
                    type="text"
                    required
                    value={chantierForm.code_chantier}
                    onChange={(e) => setChantierForm({ ...chantierForm, code_chantier: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Nom du Projet Immobilier *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Résidence El Bahia"
                    value={chantierForm.nom_projet}
                    onChange={(e) => setChantierForm({ ...chantierForm, nom_projet: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Wilaya (Algérie) *</label>
                  <select
                    value={chantierForm.wilaya}
                    onChange={(e) => setChantierForm({ ...chantierForm, wilaya: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Alger (16)">Alger (16)</option>
                    <option value="Oran (31)">Oran (31)</option>
                    <option value="Constantine (25)">Constantine (25)</option>
                    <option value="Annaba (23)">Annaba (23)</option>
                    <option value="Blida (09)">Blida (09)</option>
                    <option value="Tipaza (42)">Tipaza (42)</option>
                    <option value="Boumerdès (35)">Boumerdès (35)</option>
                    <option value="Sétif (19)">Sétif (19)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Commune d'implantation *</label>
                  <input
                    type="text"
                    required
                    value={chantierForm.commune}
                    onChange={(e) => setChantierForm({ ...chantierForm, commune: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Adresse Physique du Site *</label>
                <input
                  type="text"
                  required
                  value={chantierForm.adresse_site}
                  onChange={(e) => setChantierForm({ ...chantierForm, adresse_site: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Date de début (PV ouverture) *</label>
                  <input
                    type="date"
                    required
                    value={chantierForm.date_ouverture_chantier}
                    onChange={(e) => setChantierForm({ ...chantierForm, date_ouverture_chantier: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Date de livraison prévue *</label>
                  <input
                    type="date"
                    required
                    value={chantierForm.date_livraison_prevue}
                    onChange={(e) => setChantierForm({ ...chantierForm, date_livraison_prevue: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Budget Prévisionnel (DZD) *</label>
                  <input
                    type="number"
                    required
                    value={chantierForm.budget_global_prevu}
                    onChange={(e) => setChantierForm({ ...chantierForm, budget_global_prevu: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Phase / Statut du Chantier *</label>
                  <select
                    value={chantierForm.statut}
                    onChange={(e) => setChantierForm({ ...chantierForm, statut: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="ETUDE_FONCIERE">Étude Foncière & Permis</option>
                    <option value="TERRASSEMENT">Terrassement & Fondations</option>
                    <option value="GROS_OEUVRE">Gros Œuvre & Béton Armé</option>
                    <option value="SECOND_OEUVRE">Second Œuvre & CES</option>
                    <option value="FINITIONS">Finitions & VRD</option>
                    <option value="LIVRAISON_RECEPTION">Livraison & Réception</option>
                    <option value="CLOTURE">Chantier Clôturé</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Conducteur de Travaux Affecté *</label>
                  <select
                    value={chantierForm.conducteur_travaux_id}
                    onChange={(e) => setChantierForm({ ...chantierForm, conducteur_travaux_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="">Sélectionner un conducteur de travaux</option>
                    {utilisateurs.filter(u => u.type === 'CHANTIER' || u.role_id === 'role-ct').map(u => (
                      <option key={u.id} value={u.id}>{u.prenom} {u.nom} ({u.poste})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsChantierModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  {editingChantierId ? 'Mettre à jour le chantier' : 'Enregistrer le chantier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
