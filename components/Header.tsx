'use client';

import React, { useState } from 'react';
import {
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
  Lock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GlobalSearchBar } from './GlobalSearchBar';

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
    setActiveNav,
    activeNav,
    logout
  } = useApp();

  const [isChantierDropdownOpen, setIsChantierDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const getModuleTitle = (nav: string) => {
    switch (nav) {
      case 'dashboard': return 'Tableau de bord consolidé';
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
      case 'schema': return 'Architecture & Schéma BDD';
      case 'parametres': return 'Paramètres du Système';
      default: return 'Plateforme Promotion Immobilière';
    }
  };

  const isSiteUser = currentUser?.type === 'CHANTIER';
  const centralUsers = utilisateurs.filter(u => u.type === 'CENTRAL');
  const siteUsers = utilisateurs.filter(u => u.type === 'CHANTIER');

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-4 shrink-0 z-20">
      {/* Zone 1: Breadcrumb Context */}
      <div className="flex items-center gap-2 text-sm text-slate-600 min-w-0">
        <span className="font-semibold text-slate-900 whitespace-nowrap">
          {getModuleTitle(activeNav)}
        </span>
        <span className="text-slate-300">/</span>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate max-w-[140px] xl:max-w-none">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">
            {selectedChantierId === 'ALL'
              ? 'Périmètre Global'
              : currentChantier?.nom_projet}
          </span>
        </div>
      </div>

      {/* Global Real-Time Search Bar */}
      <GlobalSearchBar />

      {/* Zone 2: Multi-Chantier Scope Selector (Enforcing Rules 4, 5, 6) */}
      <div className="relative">
        <button
          onClick={() => setIsChantierDropdownOpen(!isChantierDropdownOpen)}
          className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-medium text-slate-700 transition-colors shadow-xs"
        >
          {isSiteUser ? (
            <HardHat className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          ) : (
            <Building className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          )}
          <span className="truncate max-w-[200px]">
            {selectedChantierId === 'ALL'
              ? 'Tous les chantiers (Vue Siège)'
              : currentChantier?.nom_projet}
          </span>
          <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
        </button>

        {isChantierDropdownOpen && (
          <div className="absolute left-0 mt-1.5 w-72 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-30 text-xs">
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
                  className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    selectedChantierId === 'ALL' ? 'text-emerald-700 font-semibold bg-emerald-50/50' : 'text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-medium">Vue Consolidée (Siège)</div>
                      <div className="text-[10px] text-slate-400">Tous les chantiers d'Algérie</div>
                    </div>
                  </div>
                  {selectedChantierId === 'ALL' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
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
                className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-50 transition-colors ${
                  selectedChantierId === c.id ? 'text-emerald-700 font-semibold bg-emerald-50/50' : 'text-slate-700'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="font-medium truncate">{c.nom_projet}</div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {c.wilaya} · {c.code_chantier} · {c.taux_avancement_physique}%
                  </div>
                </div>
                {selectedChantierId === c.id && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
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
      <div className="flex items-center gap-3 shrink-0">
        {/* Quick Schema viewer */}
        <button
          onClick={() => setActiveNav('schema')}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          title="Explorer le modèle relationnel et les tables"
        >
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span>Schéma BDD</span>
        </button>

        {/* Notifications */}
        <button
          onClick={() => setActiveNav('notifications')}
          className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
          aria-label="Centre de notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
          )}
        </button>

        {/* User Persona Switcher (Testing all 11 profiles) */}
        {currentUser && (
          <div className="relative">
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 text-xs transition-colors"
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] text-white ${
                currentUser.type === 'CENTRAL' ? 'bg-slate-900' : 'bg-amber-600'
              }`}>
                {currentUser.prenom[0]}{currentUser.nom[0]}
              </div>
              <div className="text-left hidden md:block">
                <div className="font-semibold text-slate-800 leading-none truncate max-w-[130px]">
                  {currentUser.prenom} {currentUser.nom}
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  {currentUser.poste}
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isUserDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-30 text-xs max-h-[500px] overflow-y-auto">
                <div className="px-3 py-1.5 text-[10px] uppercase font-semibold text-slate-400 tracking-wider border-b border-slate-100 flex items-center justify-between">
                  <span>Simulateur RBAC (11 Profils)</span>
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                </div>

                {/* Groupe A: Centraux */}
                <div className="px-3 py-1 text-[10px] font-bold text-blue-700 uppercase tracking-wider bg-blue-50/50 mt-1">
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
                      currentUser.id === u.id ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                      {u.prenom[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[11px]">{u.prenom} {u.nom}</div>
                      <div className="text-[10px] text-slate-400 truncate">{u.poste}</div>
                    </div>
                    {currentUser.id === u.id && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-1" />}
                  </button>
                ))}

                {/* Groupe B: Chantiers */}
                <div className="px-3 py-1 text-[10px] font-bold text-amber-700 uppercase tracking-wider bg-amber-50/50 mt-2">
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

                {/* Logout option */}
                <div className="mt-2 pt-2 border-t border-slate-100 px-2">
                  <button
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      logout();
                    }}
                    className="w-full px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium transition-colors"
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
    </header>
  );
};
