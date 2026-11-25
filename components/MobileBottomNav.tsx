'use client';

import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Menu,
  Home,
  FolderOpen,
  Bell,
  MessageSquareText
} from 'lucide-react';
import { getDefaultNavForUser } from '../lib/modularPermissions';

export const MobileBottomNav: React.FC = () => {
  const {
    activeNav,
    setActiveNav,
    unreadNotificationsCount,
    unreadMessagesCount,
    currentUser,
    toggleMobileMenu
  } = useApp();

  const defaultNav = getDefaultNavForUser(currentUser);
  const isHomeActive = activeNav === defaultNav;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-white/95 dark:bg-[#070d1f]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800/90 shadow-lg px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-colors duration-200 select-none"
      aria-label="Navigation mobile principale"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {/* 1. Menu Tiroir (Tous les modules) */}
        <button
          type="button"
          onClick={toggleMobileMenu}
          className="flex flex-col items-center justify-center p-1.5 text-slate-500 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 active:scale-95 transition-transform"
        >
          <div className="relative">
            <Menu className="w-5 h-5 text-orange-500" />
            {(unreadNotificationsCount > 0 || unreadMessagesCount > 0) && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </div>
          <span className="text-[10px] font-medium mt-0.5">Modules</span>
        </button>

        {/* 2. Espace Dédié (Accueil Métier) */}
        <button
          type="button"
          onClick={() => setActiveNav(defaultNav)}
          className={`flex flex-col items-center justify-center p-1.5 active:scale-95 transition-transform ${
            isHomeActive
              ? 'text-orange-500 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">Mon Espace</span>
        </button>

        {/* 3. Documents & GED */}
        <button
          type="button"
          onClick={() => setActiveNav('documents')}
          className={`flex flex-col items-center justify-center p-1.5 active:scale-95 transition-transform ${
            activeNav === 'documents'
              ? 'text-orange-500 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400'
          }`}
        >
          <FolderOpen className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">GED</span>
        </button>

        {/* 4. Messagerie & Canaux */}
        <button
          type="button"
          onClick={() => setActiveNav('messagerie')}
          className={`relative flex flex-col items-center justify-center p-1.5 active:scale-95 transition-transform ${
            activeNav === 'messagerie'
              ? 'text-orange-500 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400'
          }`}
        >
          <div className="relative">
            <MessageSquareText className="w-5 h-5" />
            {unreadMessagesCount > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1 min-w-[15px] h-[15px] rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center leading-none ring-2 ring-white dark:ring-slate-900">
                {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium mt-0.5">Chat</span>
        </button>

        {/* 5. Notifications */}
        <button
          type="button"
          onClick={() => setActiveNav('notifications')}
          className={`relative flex flex-col items-center justify-center p-1.5 active:scale-95 transition-transform ${
            activeNav === 'notifications'
              ? 'text-orange-500 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400'
          }`}
        >
          <div className="relative">
            <Bell className="w-5 h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1 min-w-[15px] h-[15px] rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center leading-none ring-2 ring-white dark:ring-slate-900">
                {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium mt-0.5">Alertes</span>
        </button>
      </div>
    </nav>
  );
};
