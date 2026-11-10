'use client';

import React from 'react';
import { ShieldAlert, ArrowLeft, UserCheck, Lock } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AccessDeniedView: React.FC = () => {
  const { securityViolation, clearSecurityViolation, setActiveNav, currentUser, switchUserPersona, utilisateurs } = useApp();

  const adminUser = utilisateurs.find(u => u.role_id === 'role-admin');

  return (
    <div className="bg-white border-2 border-rose-200 rounded-2xl p-8 max-w-2xl mx-auto my-12 text-center shadow-lg">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <div className="inline-block px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-mono font-bold mb-3">
        {securityViolation?.ruleCode || 'ACCES_INTERDIT'}
      </div>

      <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
        Accès Bloqué par le Contrôleur de Sécurité RBAC
      </h2>

      <p className="text-sm text-slate-600 mt-2 max-w-lg mx-auto leading-relaxed">
        {securityViolation?.message || 'Vos permissions actuelles ne vous autorisent pas à accéder à cette section.'}
      </p>

      {currentUser && (
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 max-w-md mx-auto text-left flex items-start gap-3">
          <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-slate-800">
              Profil connecté : {currentUser.prenom} {currentUser.nom} ({currentUser.poste})
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Catégorie : <strong>{currentUser.type === 'CENTRAL' ? 'Siège Central' : 'Chantier Local'}</strong> · Chantiers autorisés : {currentUser.chantiers_assignes.length}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={() => {
            clearSecurityViolation();
            setActiveNav('dashboard');
          }}
          className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retourner au Tableau de bord</span>
        </button>

        {adminUser && (
          <button
            onClick={() => {
              switchUserPersona(adminUser);
              clearSecurityViolation();
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <UserCheck className="w-4 h-4" />
            <span>Tester en Administrateur Global</span>
          </button>
        )}
      </div>
    </div>
  );
};
