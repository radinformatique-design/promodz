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
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LoginView: React.FC = () => {
  const { login } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setErrorMessage(null);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      setResetSuccessMessage('Si cette adresse correspond à un compte, un lien sécurisé de réinitialisation vient d’être envoyé.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Impossible d’envoyer le lien de réinitialisation.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background architectural grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand identity */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/50">
            <Building2 className="w-8 h-8" />
          </div>
        </div>
        <h2 className="text-center text-2xl font-extrabold text-white tracking-tight">
          BatiProm Algérie SPA
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          ERP Promoteur Immobilier Multi-Chantiers · Système de Sécurité Centralisé
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Login Form (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
          <div className="border-b border-slate-800 pb-3 mb-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Connexion Sécurisée</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Accès contrôlé par jeton de session et privilèges RBAC.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Adresse email professionnelle
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@batiprom-dz.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-medium text-slate-300">
                  Mot de passe
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setResetSuccessMessage(null);
                    setIsResetModalOpen(true);
                  }}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold shadow-lg shadow-emerald-950/40 transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              <span>{isLoading ? 'Vérification des droits...' : 'Se connecter'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </div>

        <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xs space-y-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <Shield className="w-4 h-4" />
            <span>Authentification sécurisée</span>
          </div>
          <h3 className="text-base font-bold text-white">Connexion BatiProm</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Les comptes et mots de passe sont gérés par Supabase Auth. Saisissez l’adresse e-mail et le mot de passe qui vous ont été communiqués par l’administrateur de votre entreprise.
          </p>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3 text-xs text-slate-300">
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Chaque collaborateur utilise son propre compte professionnel.</span>
            </div>
            <div className="flex items-start gap-3">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Les mots de passe ne sont ni stockés dans BatiProm ni partagés entre utilisateurs.</span>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Les accès aux chantiers et aux modules dépendent du profil attribué par le siège.</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500">En cas de difficulté, contactez l’administrateur de votre entreprise ou utilisez « Mot de passe oublié ? ».</p>
        </div>
      </div>

      {/* MODAL: RESET PASSWORD */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-xs text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2 font-bold text-white text-sm">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                <span>Réinitialisation par e-mail</span>
              </div>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetSuccessMessage ? (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-950/50 border border-emerald-500/30 rounded-xl text-emerald-300 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{resetSuccessMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold"
                >
                  Fermer et retourner à la connexion
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <p className="text-slate-400 leading-relaxed">
                  Saisissez votre adresse e-mail. Supabase vous enverra un lien sécurisé pour choisir un nouveau mot de passe.
                </p>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Email professionnel
                  </label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsResetModalOpen(false)}
                    className="px-3 py-1.5 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-800"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold"
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
