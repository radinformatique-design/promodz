'use client';

import React, { useState } from 'react';
import {
  Menu,
  Building,
  Bell,
  Database,
  ChevronDown,
  Shield,
  Layers,
  MapPin,
  Check,
  LogOut,
  HardHat,
  Lock,
  KeyRound,
  MessageSquareText,
  Sun,
  Moon
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GlobalSearchBar } from './GlobalSearchBar';
import { ChangePasswordModal } from './ChangePasswordModal';

export const Header: React.FC = () => {
  const {
    chantiers,
    selectedChantierId,
    setSelectedChantierId,
    currentChantier,
    currentUser,
    switchUserPersona,
    utilisateurs,
    unreadNotificationsCount,
    unreadMessagesCount,
    setActiveNav,
    activeNav,
    logout,
    theme,
    toggleTheme,
    toggleMobileMenu
  } = useApp();

  const [isChantierDropdownOpen, setIsChantierDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const getModuleTitle = (nav: string) => {
    switch (nav) {
      case 'dashboard': return 'Tableau de bord consolidé';
      case 'gerant': return 'Espace Gérant (Consultation Globale)';
      case 'chantiers': return 'Gestion des Chantiers';
      case 'administration': return 'Administration & Matrice RBAC';
      case 'rh': return 'Ressources Humaines';
      case 'juridique': return 'Juridique & Foncier';
      case 'comptabilite': return 'Comptabilité & Fiscalité';
      case 'technique': return 'Direction Technique';
      case 'materiel': return 'Parc Matériel & Engins';
      case 'commercial': return 'Direction Commerciale & VEFA';
      case 'approvisionnements': return 'Approvisionnements & Achats';
      case 'notifications': return 'Centre de Notifications';
      case 'documents': return 'Gestion Électronique des Documents';
      case 'parametres': return 'Paramètres du Système';
      default: return 'Plateforme Promotion Immobilière';
    }
  };

  const isSiteUser = currentUser?.type === 'CHANTIER';
  const centralUsers = utilisateurs.filter(u => u.type === 'CENTRAL');
  const siteUsers = utilisateurs.filter(u => u.type === 'CHANTIER');

  return (
    <header className="h-14 sm:h-16 bg-white dark:bg-[#070d1f] border-b border-slate-200 dark:border-slate-800/80 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 shrink-0 z-20 pt-[env(safe-area-inset-top,0px)]">
      {/* Zone 1: Hamburger Menu Mobile + Breadcrumb Context */}
      <div className="flex items-center gap-2 sm:gap-3 text-sm text-slate-600 min-w-0">
        {/* Bouton Hamburger Mobile (iPhone & Android) */}
        <button
          type="button"
          onClick={toggleMobileMenu}
          className="p-1.5 sm:p-2 -ml-1 text-slate-700 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg lg:hidden transition-colors shrink-0"
          title="Ouvrir le menu de navigation"
          aria-label="Ouvrir le menu de navigation"
        >
          <Menu className="w-5 h-5 text-orange-500" />
        </button>

        <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate max-w-[130px] sm:max-w-[200px] md:max-w-none">
          {getModuleTitle(activeNav)}
        </span>
        <span className="text-slate-300 hidden sm:inline">/</span>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 truncate max-w-[120px] xl:max-w-none">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">
            {selectedChantierId === 'ALL'
              ? 'Périmètre Global'
              : currentChantier?.nom_projet}
          </span>
        </div>
      </div>

      {/* Global Real-Time Search Bar */}
      <div className="hidden md:block flex-1 max-w-md mx-2"><GlobalSearchBar /></div>

      {/* Zone 2: Multi-Chantier Scope Selector (Enforcing Rules 4, 5, 6) */}
      <div className="relative">
        <button
          onClick={() => setIsChantierDropdownOpen(!isChantierDropdownOpen)}
          className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors shadow-xs"
        >
          {isSiteUser ? (
            <HardHat className="w-3.5 h-3.5 text-orange-500 shrink-0" />
          ) : (
            <Building className="w-3.5 h-3.5 text-orange-500 shrink-0" />
          )}
          <span className="truncate max-w-[200px]">
            {selectedChantierId === 'ALL'
              ? 'Tous les chantiers (Vue Siège)'
              : currentChantier?.nom_projet}
          </span>
          <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
        </button>

        {isChantierDropdownOpen && (
          <div className="absolute left-0 mt-1.5 w-64 sm:w-72 max-w-[85vw] bg-white dark:bg-[#0b132b] rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-30 text-xs">
            <div className="px-3 py-1.5 text-[10px] uppercase font-semibold text-slate-400 tracking-wider border-b border-slate-100 flex items-center justify-between">
              <span>Chantier d'intervention</span>
              {isSiteUser && (
                <span className="text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-semibold">
                  Cloisonné
                </span>
              )}
            </div>

            {/* Vue consolidée autorisée UNIQUEMENT pour les utilisateurs centraux */}
            {!isSiteUser && (
              <>
                <button
                  onClick={() => {
                    setSelectedChantierId('ALL');
                    setIsChantierDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                    selectedChantierId === 'ALL' ? 'text-orange-600 dark:text-orange-400 font-semibold bg-orange-50/50 dark:bg-orange-950/40' : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-orange-500" />
                    <div>
                      <div className="font-medium">Vue Consolidée (Siège)</div>
                      <div className="text-[10px] text-slate-400">Tous les chantiers d'Algérie</div>
                    </div>
                  </div>
                  {selectedChantierId === 'ALL' && <Check className="w-3.5 h-3.5 text-orange-500" />}
                </button>
                <div className="my-1 border-t border-slate-100" />
              </>
            )}

            {/* Liste des chantiers autorisés pour l'utilisateur en cours */}
            {chantiers.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedChantierId(c.id);
                  setIsChantierDropdownOpen(false);
                }}
                className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                  selectedChantierId === c.id ? 'text-orange-600 dark:text-orange-400 font-semibold bg-orange-50/50 dark:bg-orange-950/40' : 'text-slate-700 dark:text-slate-200'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="font-medium truncate">{c.nom_projet}</div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {c.wilaya} · {c.code_chantier} · {c.taux_avancement_physique}%
                  </div>
                </div>
                {selectedChantierId === c.id && <Check className="w-3.5 h-3.5 text-orange-500 shrink-0" />}
              </button>
            ))}

            {isSiteUser && chantiers.length === 1 && (
              <div className="px-3 py-2 text-[10px] text-slate-400 bg-slate-50 border-t border-slate-100">
                Règle N°4/5/6 : Vous êtes restreint à votre chantier affecté.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Zone 3: Actions & 11-Persona Switcher */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">

        {/* Quick Messagerie */}
        <button
          onClick={() => setActiveNav('messagerie')}
          className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label={unreadMessagesCount > 0 ? `Messagerie (${unreadMessagesCount} non lus)` : 'Messagerie'}
          title={unreadMessagesCount > 0 ? `Messagerie (${unreadMessagesCount} non lu${unreadMessagesCount > 1 ? 's' : ''})` : 'Messagerie & Canaux'}
        >
          <MessageSquareText className="w-4 h-4" />
          {unreadMessagesCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none border-2 border-white dark:border-slate-900 shadow-xs">
              {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
            </span>
          )}
        </button>

        {/* Notifications */}
        <button
          onClick={() => setActiveNav('notifications')}
          className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label={unreadNotificationsCount > 0 ? `Centre de notifications (${unreadNotificationsCount} non lues)` : 'Centre de notifications'}
          title={unreadNotificationsCount > 0 ? `${unreadNotificationsCount} notification${unreadNotificationsCount > 1 ? 's' : ''} non lue${unreadNotificationsCount > 1 ? 's' : ''}` : 'Aucune notification non lue'}
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none border-2 border-white shadow-xs">
              {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* Toggle Mode Sombre / Mode Clair */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
          title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-orange-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* User Persona Switcher (Testing all 11 profiles) */}
        {currentUser && (
          <div className="relative">
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/80 text-xs transition-colors"
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] text-white ${
                currentUser.type === 'CENTRAL' ? 'bg-slate-900' : 'bg-amber-600'
              }`}>
                {currentUser.prenom[0]}{currentUser.nom[0]}
              </div>
              <div className="text-left hidden md:block">
                <div className="font-semibold text-slate-800 dark:text-slate-100 leading-none truncate max-w-[130px]">
                  {currentUser.prenom} {currentUser.nom}
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  {currentUser.poste}
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isUserDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-72 sm:w-80 max-w-[92vw] bg-white dark:bg-[#0b132b] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-30 text-xs max-h-[480px] overflow-y-auto">
                <div className="px-3 py-1.5 text-[10px] uppercase font-semibold text-slate-400 tracking-wider border-b border-slate-100 flex items-center justify-between">
                  <span>Simulateur RBAC ({utilisateurs.length} Comptes)</span>
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                </div>

                {/* Groupe A: Centraux */}
                <div className="px-3 py-1 text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider bg-blue-50/50 dark:bg-blue-950/40 mt-1">
                  A. Utilisateurs Centraux ({centralUsers.length})
                </div>
                {centralUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchUserPersona(u);
                      setIsUserDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left flex items-start gap-2 hover:bg-slate-50 transition-colors ${
                      currentUser.id === u.id ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-900 dark:text-orange-200 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                      {u.prenom[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[11px]">{u.prenom} {u.nom}</div>
                      <div className="text-[10px] text-slate-400 truncate">{u.poste}</div>
                    </div>
                    {currentUser.id === u.id && <Check className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-1" />}
                  </button>
                ))}

                {/* Groupe B: Chantiers */}
                <div className="px-3 py-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider bg-amber-50/50 dark:bg-amber-950/40 mt-2">
                  B. Utilisateurs des Chantiers ({siteUsers.length})
                </div>
                {siteUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchUserPersona(u);
                      setIsUserDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left flex items-start gap-2 hover:bg-slate-50 transition-colors ${
                      currentUser.id === u.id ? 'bg-amber-50 text-amber-900 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                      {u.prenom[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[11px]">{u.prenom} {u.nom}</div>
                      <div className="text-[10px] text-slate-400 truncate">{u.poste}</div>
                    </div>
                    {currentUser.id === u.id && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-1" />}
                  </button>
                ))}

                {/* Security & Logout options */}
                <div className="mt-2 pt-2 border-t border-slate-100 px-2 space-y-1">
                  <button
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      setIsChangePasswordOpen(true);
                    }}
                    className="w-full px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 font-medium transition-colors"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                    <span>Changer mon mot de passe</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      logout();
                    }}
                    className="w-full px-3 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 font-medium transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Déconnexion complète</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Changement de Mot de Passe */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </header>
  );
};




