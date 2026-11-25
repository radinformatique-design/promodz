'use client';

import React from 'react';
import {
  X,
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
  MessageSquareText,
  Crown
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ModuleCode } from '../types/database';
import { getAllowedNavItemsForUser, hasExplicitPermission, isUserAdmin, isUserGerant } from '../lib/modularPermissions';

export const Sidebar: React.FC = () => {
  const {
    activeNav,
    setActiveNav,
    unreadNotificationsCount,
    unreadMessagesCount,
    currentUser,
    entreprise,
    verifyAccess,
    logout,
    demandesAchat,
    bonsCommande,
    articlesStock,
    chantiers,
    rolePermissions,
    isMobileMenuOpen,
    setIsMobileMenuOpen
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
    { id: 'gerant', module: 'GERANT', label: 'Espace Gérant (Global)', icon: Crown, isSpecial: true },
    { id: 'suivi-travaux', module: 'CHANTIERS', label: 'Suivi des travaux', icon: HardHat },
    { id: 'metres', module: 'TECHNIQUE', label: 'Métrés', icon: Ruler },
    { id: 'pointage', module: 'POINTAGE', label: 'Pointage & Présences', icon: Clock },
    { id: 'chantiers', module: 'CHANTIERS', label: 'Chantiers (Projets)', icon: Building },
    { id: 'materiel', module: 'MATERIEL', label: 'Matériel', icon: Truck },
    { id: 'approvisionnements', module: 'APPROVISIONNEMENTS', label: 'Approvisionnements', icon: ShoppingCart, badge: approBadgeCount },
    { id: 'magasin', module: 'MAGASIN', label: 'Magasin & Stocks', icon: Store, badge: magasinBadgeCount },
    { id: 'rh', module: 'RH', label: 'Ressources humaines', icon: Users },
    { id: 'commercial', module: 'COMMERCIAL', label: 'Commercial', icon: Building2 },
    { id: 'comptabilite', module: 'COMPTABILITE', label: 'Comptabilité et fiscalité', icon: ReceiptText },
    { id: 'juridique', module: 'JURIDIQUE', label: 'Juridique', icon: Scale },
    { id: 'administration', module: 'ADMINISTRATION', label: 'Administration', icon: ShieldCheck },
    { id: 'notifications', module: 'NOTIFICATIONS', label: 'Notifications', icon: Bell, badge: unreadNotificationsCount },
    { id: 'messagerie', module: 'MESSAGERIE', label: 'Messagerie & Canaux', icon: MessageSquareText, badge: unreadMessagesCount },
    { id: 'documents', module: 'DOCUMENTS', label: 'Documents & GED', icon: FolderOpen },
    { id: 'parametres', module: 'PARAMETRES', label: 'Paramètres', icon: Settings2 }
  ];

  // Architecture STRICTEMENT modulaire : chaque utilisateur (Chantier ET Central)
  // ne voit QUE ses modules métiers dédiés et les outils transversaux indispensables autorisés par RBAC
  const filteredNavItems = React.useMemo(() => {
    if (!currentUser) return [];
    if (isUserAdmin(currentUser) && !isUserGerant(currentUser)) {
      return navItems;
    }
    const allowedIds = getAllowedNavItemsForUser(currentUser, rolePermissions);
    return navItems.filter((item) => {
      if (!allowedIds.includes(item.id)) return false;

      // Double verrou : si la permission de consulter les documents est décochée dans RBAC, masquer immédiatement
      if (item.id === 'documents') {
        return hasExplicitPermission(currentUser, 'DOCUMENTS', 'CONSULTER', rolePermissions);
      }

      return true;
    });
  }, [navItems, currentUser, rolePermissions]);

  return (
    <>
      {/* Backdrop sombre sur Mobile/Tablette (Android & iPhone) */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Responsive : fixe sur Desktop, Tiroir glissant sur Mobile/iPhone/Android */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw] lg:w-64 bg-[#030712] text-slate-200 flex flex-col shrink-0 border-r border-slate-800/80 select-none h-[100dvh] max-h-[100dvh] transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Brand & Corporate Identity + Bouton Fermer sur Mobile */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 font-bold text-lg shadow-sm shrink-0">
              <Building className="w-5 h-5 text-orange-400" />
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

          {/* Bouton Fermer X (Visible uniquement sur mobile/iPhone/Android) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden transition-colors shrink-0"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          {currentUser?.type === 'CHANTIER' ? 'Espace Chantier Dédié' : 'Espace Métier Dédié'}
        </div>

        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;

          return (
            <button
              key={item.id}
              onClick={() => { setActiveNav(item.id); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-all text-left ${
                isActive
                  ? 'bg-orange-500 text-white font-bold shadow-md shadow-orange-500/25'
                  : item.isSpecial
                  ? 'text-orange-400 hover:bg-orange-950/40 hover:text-orange-300'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
              title={item.label}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.isSpecial ? 'text-orange-400' : 'text-slate-400'}`} />
              <span className="truncate flex-1">{item.label}</span>

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
        <div className="p-3 border-t border-slate-800 bg-[#060b19] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[#0b132b] border border-slate-800">
            <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-xs font-bold text-orange-400 shrink-0">
              {currentUser.prenom[0]}{currentUser.nom[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-200 truncate">
                  {currentUser.prenom} {currentUser.nom}
                </span>
                <UserCheck className="w-3 h-3 text-orange-400 shrink-0" />
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
    </>
  );
};





