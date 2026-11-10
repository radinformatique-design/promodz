'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  CheckCheck,
  Building,
  ArrowRight,
  Filter,
  User,
  Shield,
  Send,
  Calendar,
  AlertCircle,
  History,
  X,
  RefreshCw,
  Search
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { NotificationType, ModuleCode } from '../types/database';

export const NotificationsView: React.FC = () => {
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    traiterValidationNotificationDirection,
    selectedChantierId,
    allChantiers,
    currentUser,
    setActiveNav
  } = useApp();

  // Filters
  const [filterType, setFilterType] = useState<'ALL' | NotificationType>('ALL');
  const [filterModule, setFilterModule] = useState<'ALL' | ModuleCode>('ALL');
  const [filterChantier, setFilterChantier] = useState<string>('ALL');
  const [filterPeriod, setFilterPeriod] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');
  const [filterReadStatus, setFilterReadStatus] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyPendingValidation, setOnlyPendingValidation] = useState<boolean>(false);

  // Selected Notification for History Modal
  const [selectedHistoryNotifId, setSelectedHistoryNotifId] = useState<string | null>(null);

  // Decision Modal for Director
  const [validationModal, setValidationModal] = useState<{
    notifId: string;
    decision: 'VALIDER' | 'REFUSER';
    titre: string;
    chantierNom?: string;
  } | null>(null);
  const [validationMotif, setValidationMotif] = useState<string>('');
  const [validationFeedback, setValidationFeedback] = useState<{ message: string; success: boolean } | null>(null);

  // Auto-refresh simulation state
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [autoRefreshActive, setAutoRefreshActive] = useState<boolean>(true);

  // Simulated auto-refresh timer every 15s
  useEffect(() => {
    if (!autoRefreshActive) return;
    const interval = setInterval(() => {
      setLastRefreshed(new Date());
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefreshActive]);

  const isAdmin = currentUser?.role_id === 'role-admin' || currentUser?.type === 'CENTRAL' && currentUser.poste.includes('Admin');

  // Filter logic: Targeting & Access Rules
  const targetedNotifications = notifications.filter(n => {
    // 1. Admin gets GLOBAL visibility over all company notifications
    if (isAdmin) {
      // Continue to next filters
    } else {
      // Non-admin users receive ONLY notifications targeted to them or their role/chantier
      const isTargetUser = !n.destinataire_id || n.destinataire_id === currentUser?.id;
      const isTargetRole = !n.destinataire_role || n.destinataire_role === currentUser?.role_id || n.destinataire_role === currentUser?.poste;
      const isTargetChantier = currentUser?.type === 'CENTRAL' || !n.chantier_id || (currentUser?.chantiers_assignes && currentUser.chantiers_assignes.includes(n.chantier_id));

      if (!isTargetUser && !isTargetRole) return false;
      if (!isTargetChantier) return false;
    }

    // 2. Chantier filter
    if (filterChantier !== 'ALL' && n.chantier_id && n.chantier_id !== filterChantier) return false;
    if (selectedChantierId !== 'ALL' && n.chantier_id && n.chantier_id !== selectedChantierId) return false;

    // 3. Module filter
    if (filterModule !== 'ALL' && n.module !== filterModule) return false;

    // 4. Type filter
    if (filterType !== 'ALL' && n.type !== filterType) return false;

    // 5. Read status filter
    if (filterReadStatus === 'UNREAD' && n.lu) return false;
    if (filterReadStatus === 'READ' && !n.lu) return false;

    // 6. Period filter
    if (filterPeriod !== 'ALL') {
      const notifDate = new Date(n.created_at);
      const now = new Date();
      if (filterPeriod === 'TODAY') {
        if (notifDate.toDateString() !== now.toDateString()) return false;
      } else if (filterPeriod === 'WEEK') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (notifDate < weekAgo) return false;
      } else if (filterPeriod === 'MONTH') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (notifDate < monthAgo) return false;
      }
    }

    // 7. Text Search
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        n.titre.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        (n.expediteur_nom && n.expediteur_nom.toLowerCase().includes(q)) ||
        (n.chantier_nom && n.chantier_nom.toLowerCase().includes(q))
      );
    }

    // 8. Pending validation filter
    if (onlyPendingValidation && n.statut_validation !== 'EN_ATTENTE') return false;

    return true;
  });

  const pendingDirectionCount = notifications.filter(
    n => n.statut_validation === 'EN_ATTENTE' && (n.type === 'VALIDATION_REQUISE' || n.destinataire_role === 'ADMINISTRATEUR' || n.destinataire_id === 'user-admin')
  ).length;

  const handleConfirmValidation = () => {
    if (!validationModal) return;
    if (validationModal.decision === 'REFUSER' && !validationMotif.trim()) {
      alert('Veuillez spécifier le motif du refus pour information du chantier et des services centraux.');
      return;
    }
    const res = traiterValidationNotificationDirection(
      validationModal.notifId,
      validationModal.decision,
      validationMotif
    );
    setValidationFeedback(res);
    setValidationModal(null);
    setValidationMotif('');
    setTimeout(() => setValidationFeedback(null), 5000);
  };

  const getPriorityBadge = (priorite?: string) => {
    switch (priorite) {
      case 'URGENTE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-600 text-white animate-pulse">URGENT</span>;
      case 'HAUTE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white">HAUTE</span>;
      case 'NORMALE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">NORMALE</span>;
      case 'BASSE':
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">BASSE</span>;
    }
  };

  const getSeverityBadge = (type: NotificationType) => {
    switch (type) {
      case 'CRITIQUE':
        return {
          icon: AlertTriangle,
          badge: 'bg-rose-100 text-rose-800 border-rose-300'
        };
      case 'VALIDATION_REQUISE':
        return {
          icon: Clock,
          badge: 'bg-amber-100 text-amber-900 border-amber-300'
        };
      case 'AVERTISSEMENT':
        return {
          icon: AlertTriangle,
          badge: 'bg-amber-50 text-amber-700 border-amber-200'
        };
      case 'INFO':
      default:
        return {
          icon: Info,
          badge: 'bg-blue-50 text-blue-800 border-blue-200'
        };
    }
  };

  const selectedNotifForModal = notifications.find(n => n.id === selectedHistoryNotifId);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <Bell className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">Système Centralisé de Notifications & Workflows</h2>
                {isAdmin && (
                  <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 text-xs font-bold rounded-full flex items-center gap-1 border border-purple-200">
                    <Shield className="w-3 h-3" /> Vue globale Administrateur
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Routage ciblé des alertes métiers (Comptabilité, Approvisionnements, RH, Matériel, Magasin) avec suivi d'acquittement et historique d'actions.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${autoRefreshActive ? 'animate-spin' : ''}`} />
            <span>Actualisé : {lastRefreshed.toLocaleTimeString('fr-DZ')}</span>
            <button
              onClick={() => setAutoRefreshActive(!autoRefreshActive)}
              className="ml-1 text-[10px] underline text-blue-600 font-semibold"
            >
              {autoRefreshActive ? 'Pause' : 'Activer'}
            </button>
          </div>

          <button
            onClick={markAllNotificationsAsRead}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Tout marquer comme lu</span>
          </button>
        </div>
      </div>

      {/* Filter Bar with Multi-Criteria */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-blue-600" /> Filtres Avancés par Service, Chantier, Période et Statut
          </span>
          <span className="text-xs font-semibold text-slate-500">
            {targetedNotifications.length} notification(s) affichée(s)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Search text */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Rechercher titre, expediteur..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg"
            />
          </div>

          {/* Chantier Filter */}
          <div>
            <select
              value={filterChantier}
              onChange={e => setFilterChantier(e.target.value)}
              className="w-full p-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 font-medium"
            >
              <option value="ALL">Tous les chantiers</option>
              {allChantiers.map(c => (
                <option key={c.id} value={c.id}>{c.nom_projet}</option>
              ))}
            </select>
          </div>

          {/* Module / Service Filter */}
          <div>
            <select
              value={filterModule}
              onChange={e => setFilterModule(e.target.value as any)}
              className="w-full p-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 font-medium"
            >
              <option value="ALL">Tous les services / modules</option>
              <option value="APPROVISIONNEMENTS">Approvisionnements & Achats</option>
              <option value="COMPTABILITE">Comptabilité & Fiscalité</option>
              <option value="RH">Ressources Humaines</option>
              <option value="MAGASIN">Magasin & Stocks</option>
              <option value="MATERIEL">Matériel & Engins</option>
              <option value="JURIDIQUE">Juridique & Foncier</option>
              <option value="TECHNIQUE">Direction Technique</option>
            </select>
          </div>

          {/* Period Filter */}
          <div>
            <select
              value={filterPeriod}
              onChange={e => setFilterPeriod(e.target.value as any)}
              className="w-full p-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 font-medium"
            >
              <option value="ALL">Toutes les périodes</option>
              <option value="TODAY">Aujourd'hui</option>
              <option value="WEEK">7 derniers jours</option>
              <option value="MONTH">Ce mois-ci</option>
            </select>
          </div>

          {/* Read / Validation Status Filter */}
          <div>
            <select
              value={filterReadStatus}
              onChange={e => setFilterReadStatus(e.target.value as any)}
              className="w-full p-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 font-medium"
            >
              <option value="ALL">Tous les statuts de lecture</option>
              <option value="UNREAD">Non lues uniquement</option>
              <option value="READ">Lues / Acquittées</option>
            </select>
          </div>
        </div>

        {/* Severity Type Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-medium text-[11px]">Niveau :</span>
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              filterType === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Toutes ({notifications.length})
          </button>
          <button
            onClick={() => setFilterType('CRITIQUE')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              filterType === 'CRITIQUE' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            Critique / Bloquant
          </button>
          <button
            onClick={() => setFilterType('VALIDATION_REQUISE')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              filterType === 'VALIDATION_REQUISE' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Validation Requise
          </button>
          <button
            onClick={() => setFilterType('AVERTISSEMENT')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              filterType === 'AVERTISSEMENT' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
            }`}
          >
            Avertissements
          </button>
          <button
            onClick={() => setFilterType('INFO')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              filterType === 'INFO' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            Informations
          </button>
          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />
          <button
            onClick={() => setOnlyPendingValidation(!onlyPendingValidation)}
            className={`px-2.5 py-1 rounded-md font-bold transition flex items-center gap-1.5 ${
              onlyPendingValidation ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>👑 Chantiers à valider par Direction ({pendingDirectionCount})</span>
          </button>
        </div>
      </div>

      {/* Validation Feedback Banner */}
      {validationFeedback && (
        <div className={`p-4 rounded-xl text-sm font-semibold flex items-center justify-between border ${
          validationFeedback.success ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : 'bg-rose-50 text-rose-900 border-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {validationFeedback.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />}
            <span>{validationFeedback.message}</span>
          </div>
          <button onClick={() => setValidationFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Notifications Cards Container */}
      <div className="space-y-4">
        {targetedNotifications.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h4 className="font-bold text-slate-800 text-base">Aucune notification correspondant aux critères</h4>
            <p className="text-xs text-slate-500 mt-1">Modifiez vos filtres ou réinitialisez le périmètre de recherche.</p>
          </div>
        ) : (
          targetedNotifications.map(notif => {
            const config = getSeverityBadge(notif.type);
            const Icon = config.icon;

            return (
              <div
                key={notif.id}
                className={`bg-white border rounded-xl p-5 shadow-xs transition-all flex flex-col gap-4 ${
                  notif.lu ? 'border-slate-200 bg-slate-50/40 opacity-95' : 'border-slate-300 ring-1 ring-blue-200 bg-white'
                }`}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${config.badge}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      {/* Header line badges */}
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${config.badge}`}>
                          {notif.type.replace('_', ' ')}
                        </span>
                        {getPriorityBadge(notif.priorite)}

                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          Service : {notif.module}
                        </span>

                        {notif.chantier_nom && (
                          <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            {notif.chantier_nom}
                          </span>
                        )}

                        {notif.statut_validation && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            notif.statut_validation === 'VALIDE' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                            notif.statut_validation === 'REFUSE' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                            'bg-amber-100 text-amber-900 border-amber-300'
                          }`}>
                            Statut Workflow : {notif.statut_validation.replace('_', ' ')}
                          </span>
                        )}
                      </div>

                      <h3 className={`font-bold text-base ${notif.lu ? 'text-slate-800' : 'text-slate-900'}`}>
                        {notif.titre}
                      </h3>

                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                        {notif.message}
                      </p>

                      {/* Sender and Target Details */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                        {notif.expediteur_nom && (
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <Send className="w-3 h-3 text-blue-500" /> Expéditeur : {notif.expediteur_nom} ({notif.expediteur_role || 'Agent'})
                          </span>
                        )}
                        {notif.destinataire_nom && (
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <User className="w-3 h-3 text-emerald-500" /> Destinataire : {notif.destinataire_nom}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-slate-400">
                          <Calendar className="w-3 h-3" /> {new Date(notif.created_at).toLocaleString('fr-DZ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Action Block */}
                  <div className="flex flex-col sm:flex-row md:flex-col items-end gap-2 shrink-0 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {notif.historique_actions && notif.historique_actions.length > 0 && (
                        <button
                          onClick={() => setSelectedHistoryNotifId(notif.id)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg flex items-center gap-1 border border-slate-200"
                          title="Voir l'historique des actions"
                        >
                          <History className="w-3.5 h-3.5" /> Historique ({notif.historique_actions.length})
                        </button>
                      )}

                      {!notif.lu && (
                        <button
                          onClick={() => markNotificationAsRead(notif.id)}
                          className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition"
                        >
                          Acquitter (Lu)
                        </button>
                      )}
                    </div>

                    {notif.lien_action && (
                      <button
                        onClick={() => {
                          markNotificationAsRead(notif.id);
                          const targetNav = notif.lien_action?.replace('/', '') || 'dashboard';
                          setActiveNav(targetNav);
                        }}
                        className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-2xs transition"
                      >
                        <span>Consulter dans le Module</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* ZONE D'ARBITRAGE DIRECTION GÉNÉRALE POUR DEMANDES DE CHANTIER */}
                {isAdmin && notif.statut_validation === 'EN_ATTENTE' && (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-xl p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                          <span>Arbitrage de la Direction Générale Requis</span>
                          <span className="px-1.5 py-0.2 text-[10px] bg-amber-200 text-amber-900 rounded font-black">BLOQUANT</span>
                        </div>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          Cette demande émise du chantier attend votre décision souveraine. Les services centraux concernés sont informés en attente de visa.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-amber-200/60">
                      <button
                        onClick={() => {
                          setValidationModal({
                            notifId: notif.id,
                            decision: 'VALIDER',
                            titre: notif.titre,
                            chantierNom: notif.chantier_nom
                          });
                          setValidationMotif('Validation accordée par la Direction Générale. Transmission aux services centraux autorisée.');
                        }}
                        className="flex-1 md:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Valider la Demande</span>
                      </button>
                      <button
                        onClick={() => {
                          setValidationModal({
                            notifId: notif.id,
                            decision: 'REFUSER',
                            titre: notif.titre,
                            chantierNom: notif.chantier_nom
                          });
                          setValidationMotif('');
                        }}
                        className="flex-1 md:flex-initial px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition"
                      >
                        <X className="w-4 h-4" />
                        <span>Refuser</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* BANNIÈRE INFORMATIVE POUR LES SERVICES CENTRAUX (NON-ADMIN) */}
                {!isAdmin && notif.statut_validation === 'EN_ATTENTE' && (
                  <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 flex items-center gap-2.5 text-xs text-blue-900">
                    <Info className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                      <strong>Notification pour information :</strong> Cette demande émise par le chantier attend la validation souveraine préalable de la <strong>Direction Générale</strong> avant exécution par votre service.
                    </span>
                  </div>
                )}

                {/* ÉTAT VISÉ DIRECTION */}
                {notif.statut_validation === 'VALIDE' && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center gap-2 text-xs font-semibold text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Demande approuvée par la Direction Générale — Dossier débloqué pour exécution opérationnelle.</span>
                  </div>
                )}

                {/* ÉTAT REJETÉ DIRECTION */}
                {notif.statut_validation === 'REFUSE' && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 flex items-center gap-2 text-xs font-semibold text-rose-900">
                    <X className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Demande refusée par la Direction Générale — Traitement annulé.</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: HISTORIQUE DES ACTIONS DU WORKFLOW */}
      {selectedNotifForModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Historique des Actions Workflow</h3>
              </div>
              <button onClick={() => setSelectedHistoryNotifId(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg text-xs">
                <span className="font-bold text-slate-900 block">{selectedNotifForModal.titre}</span>
                <span className="text-slate-500 block mt-0.5">{selectedNotifForModal.message}</span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {selectedNotifForModal.historique_actions?.map(act => (
                  <div key={act.id} className="p-3 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>{act.action}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{act.date}</span>
                    </div>
                    <div className="text-slate-600 mt-0.5">Auteur : <strong>{act.auteur}</strong></div>
                    {act.commentaire && (
                      <div className="text-slate-500 italic mt-1 bg-white p-2 rounded border border-slate-100">
                        "{act.commentaire}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setSelectedHistoryNotifId(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold text-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ARBITRAGE DIRECTION GÉNÉRALE */}
      {validationModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className={`p-2 rounded-xl ${validationModal.decision === 'VALIDER' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {validationModal.decision === 'VALIDER' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {validationModal.decision === 'VALIDER' ? 'Validation Direction Générale' : 'Refus de la Demande Chantier'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {validationModal.chantierNom ? `Chantier : ${validationModal.chantierNom}` : 'Origine : Chantier'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setValidationModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
              <span className="font-bold text-slate-900 block">{validationModal.titre}</span>
              <p className="text-slate-600 mt-1">
                {validationModal.decision === 'VALIDER'
                  ? "En validant cette demande de chantier, vous débloquez le flux pour les services centraux concernés (ex: visa budgétaire de la comptabilité, bon de commande des approvisionnements, mise à disposition de matériel). Une notification de confirmation sera envoyée à l'émetteur."
                  : "En refusant, l'opération sera bloquée et une notification sera transmise à l'émetteur sur chantier ainsi qu'aux services centraux avec le motif spécifié ci-dessous."
                }
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {validationModal.decision === 'VALIDER' ? 'Observations & Consignes de la Direction (Optionnel)' : 'Motif obligatoire du refus *'}
              </label>
              <textarea
                value={validationMotif}
                onChange={e => setValidationMotif(e.target.value)}
                placeholder={validationModal.decision === 'VALIDER' ? 'Ex: Validation accordée sous réserve de vérification de conformité...' : 'Ex: Dépassement budgétaire non justifié, merci de reformuler...'}
                rows={3}
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setValidationModal(null)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-xs"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmValidation}
                className={`px-4 py-2 text-white rounded-xl font-bold text-xs shadow-xs flex items-center gap-1.5 ${
                  validationModal.decision === 'VALIDER'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {validationModal.decision === 'VALIDER' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmer la Validation</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4" />
                    <span>Confirmer le Rejet</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
