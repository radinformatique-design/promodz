'use client';

import React from 'react';
import {
  LayoutDashboard,
  HardHat,
  ShieldCheck,
  Users,
  Scale,
  ReceiptText,
  Layers,
  Ruler,
  ClipboardCheck,
  Truck,
  Building2,
  ShoppingCart,
  Bell,
  Settings2,
  FolderOpen,
  Database,
  Building,
  UserCheck,
  Lock,
  LogOut,
  Store,
  Clock,
  Wallet
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ModuleCode } from '../types/database';

export const Sidebar: React.FC = () => {
  const {
    activeNav,
    setActiveNav,
    unreadNotificationsCount,
    currentUser,
    entreprise,
    verifyAccess,
    logout,
    demandesAchat,
    bonsCommande,
    articlesStock,
    chantiers
  } = useApp();

  const approBadgeCount = React.useMemo(() => {
    if (!currentUser) return 0;
    if (currentUser.role_id === 'role-compta') {
      return demandesAchat.filter(d => d.statut === 'EN_ATTENTE_COMPTABILITE').length;
    }
    if (currentUser.role_id === 'role-appro') {
      return demandesAchat.filter(d => d.statut === 'VALIDEE' || d.statut === 'EN_COURS_APPROVISIONNEMENT').length;
    }
    if (currentUser.role_id === 'role-magasinier') {
      return bonsCommande.filter(b => ['EMIS', 'EN_LIVRAISON'].includes(b.statut) && currentUser.chantiers_assignes.includes(b.chantier_destinataire_id)).length;
    }
    return 0;
  }, [currentUser, demandesAchat, bonsCommande]);

  const magasinBadgeCount = React.useMemo(() => {
    if (!currentUser) return 0;
    const chantiersIds = currentUser.type === 'CHANTIER' ? currentUser.chantiers_assignes : chantiers.map((c: any) => c.id);
    return articlesStock.filter(a => chantiersIds.includes(a.chantier_id) && a.quantite_stock <= a.seuil_alerte_minimum).length;
  }, [currentUser, articlesStock, chantiers]);

  const navItems: { id: string; module: ModuleCode; label: string; icon: any; badge?: number; isSpecial?: boolean }[] = [
    { id: 'dashboard', module: 'DASHBOARD', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'suivi-travaux', module: 'CHANTIERS', label: 'Suivi des travaux', icon: HardHat },
    { id: 'metres', module: 'TECHNIQUE', label: 'Métrés', icon: Ruler },
    { id: 'pointage', module: 'CHANTIERS', label: 'Pointage & Présences', icon: Clock },
    { id: 'chantiers', module: 'CHANTIERS', label: 'Chantiers (Projets)', icon: Building },
    { id: 'materiel', module: 'MATERIEL', label: 'Matériel', icon: Truck },
    { id: 'approvisionnements', module: 'APPROVISIONNEMENTS', label: 'Approvisionnements', icon: ShoppingCart, badge: approBadgeCount },
    { id: 'magasin', module: 'MAGASIN', label: 'Magasin & Stocks', icon: Store, badge: magasinBadgeCount },
    { id: 'rh', module: 'RH', label: 'Ressources humaines', icon: Users },
    { id: 'commercial', module: 'COMMERCIAL', label: 'Commercial', icon: Building2 },
    { id: 'comptabilite', module: 'COMPTABILITE', label: 'Comptabilité et fiscalité', icon: ReceiptText },
    { id: 'caisse', module: 'CAISSE', label: 'Caisse chantier', icon: Wallet },
    { id: 'juridique', module: 'JURIDIQUE', label: 'Juridique', icon: Scale },
    { id: 'administration', module: 'ADMINISTRATION', label: 'Administration', icon: ShieldCheck },
    { id: 'notifications', module: 'NOTIFICATIONS', label: 'Notifications', icon: Bell, badge: unreadNotificationsCount },
    { id: 'documents', module: 'DOCUMENTS', label: 'Documents & GED', icon: FolderOpen },
    { id: 'schema', module: 'DASHBOARD', label: 'Schéma & Base de Données', icon: Database, isSpecial: true },
    { id: 'parametres', module: 'PARAMETRES', label: 'Paramètres', icon: Settings2 }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col shrink-0 border-r border-slate-800 select-none min-h-screen">
      {/* Brand & Corporate Identity */}
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg shadow-xs">
            <Building className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-slate-100 text-xs tracking-tight truncate">
              {entreprise.nom_commercial}
            </h1>
            <p className="text-[10px] text-slate-400 truncate">
              ERP Promotion Immobilière DZ
            </p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Modules ERP Multi-Chantiers
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          // Vérification de sécurité dynamique
          const isAllowed = item.id === 'schema' ? true : verifyAccess(item.module, 'CONSULTER').allowed;

          return (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-all text-left ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : item.isSpecial
                  ? 'text-emerald-400 hover:bg-emerald-950/40 hover:text-emerald-300'
                  : isAllowed
                  ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  : 'text-slate-500 hover:bg-slate-950/60 opacity-60 cursor-pointer'
              }`}
              title={!isAllowed ? 'Module verrouillé selon votre rôle RBAC' : item.label}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.isSpecial ? 'text-emerald-400' : isAllowed ? 'text-slate-400' : 'text-slate-600'}`} />
              <span className="truncate flex-1">{item.label}</span>

              {!isAllowed && (
                <Lock className="w-3 h-3 text-slate-500 shrink-0" />
              )}

              {item.badge && item.badge > 0 ? (
                <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500 text-white shrink-0">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Active User Persona Widget & Logout */}
      {currentUser && (
        <div className="p-3 border-t border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900 border border-slate-800">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 shrink-0">
              {currentUser.prenom[0]}{currentUser.nom[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-200 truncate">
                  {currentUser.prenom} {currentUser.nom}
                </span>
                <UserCheck className="w-3 h-3 text-emerald-400 shrink-0" />
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                {currentUser.type === 'CENTRAL' ? 'Siège Central' : 'Chantier Local'} · {currentUser.poste}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors shrink-0"
              title="Déconnexion sécurisée"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
