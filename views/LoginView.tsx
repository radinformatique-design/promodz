'use client';

import React, { useState } from 'react';
import {
  Building2,
  Lock,
  Mail,
  Shield,
  ArrowRight,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  Sun,
  Moon
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LoginView: React.FC = () => {
  const { login, resetUserPassword, entreprise, theme, toggleTheme } = useApp();

  const [email, setEmail] = useState('admin@batiprom-dz.com');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot password modal state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await login(email, password, `${navigator.platform} - Navigateur Web`);
      if (!res.success) {
        setErrorMessage(res.error || 'Erreur d’authentification.');
      }
    } catch {
      setErrorMessage('Erreur de connexion au serveur de sécurité.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;

    const res = resetUserPassword(resetEmail);
    if (res.success) {
      setResetSuccessMessage(`${res.message} Nouveau mot de passe temporaire : ${res.tempPassword}`);
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 flex flex-col justify-center py-8 sm:py-12 px-3 sm:px-6 lg:px-8 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] relative overflow-hidden transition-colors duration-200">
      {/* Background architectural grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e120_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e120_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b20_1px,transparent_1px),linear-gradient(to_bottom,#1e293b20_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Theme toggle button (Icon only, no text) */}
      <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-20 pt-[env(safe-area-inset-top,0px)]">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-md flex items-center justify-center cursor-pointer"
          title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
          aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-orange-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand identity */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/15 border border-orange-500/40 flex items-center justify-center text-orange-500 dark:text-orange-400 shadow-lg shadow-orange-500/10">
            <Building2 className="w-8 h-8" />
          </div>
        </div>
        <h2 className="text-center text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {entreprise?.nom_commercial || entreprise?.raison_sociale || 'BatiProm Promotion Immobilière'}
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500 dark:text-slate-400">
          ERP Promoteur Immobilier Multi-Chantiers · Système Sécurisé
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white dark:bg-[#0b132b]/95 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 sm:p-7 shadow-xl dark:shadow-2xl backdrop-blur-md">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3 mb-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-orange-500 dark:text-orange-400" />
              <span>Connexion Sécurisée</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Accès contrôlé par jeton de session et privilèges RBAC.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Adresse Email Professionnelle
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@entreprise.dz"
                  className="block w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Mot de passe
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsResetModalOpen(true);
                    setResetSuccessMessage(null);
                    setResetEmail(email);
                  }}
                  className="text-[11px] text-orange-600 dark:text-orange-400 hover:text-orange-500 transition-colors"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 sm:py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl sm:rounded-lg font-semibold shadow-lg shadow-orange-500/20 dark:shadow-orange-950/40 transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-50 text-sm sm:text-xs cursor-pointer min-h-[44px]"
            >
              <span>{isLoading ? 'Vérification des droits...' : 'Se connecter'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-center gap-4 text-[11px] text-slate-500">
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
              <span>Chiffrement SSL/TLS</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-orange-500" />
              <span>RBAC Certifié</span>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: RESET PASSWORD */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 text-xs text-slate-800 dark:text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                <KeyRound className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                <span>Réinitialisation Sécurisée</span>
              </div>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetSuccessMessage ? (
              <div className="space-y-4">
                <div className="p-3 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-500/30 rounded-xl text-orange-800 dark:text-orange-200 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <span>{resetSuccessMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Fermer et retourner à la connexion
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Saisissez l'adresse email professionnelle du collaborateur. Un mot de passe temporaire sera généré et consigné dans le journal d'audit.
                </p>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email professionnel
                  </label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsResetModalOpen(false)}
                    className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold cursor-pointer"
                  >
                    Réinitialiser le mot de passe
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

