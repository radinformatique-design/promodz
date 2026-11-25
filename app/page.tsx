'use client';

import React from 'react';
import { AppProvider, useApp } from '../context/AppContext';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { LoginView } from '../views/LoginView';
import { AccessDeniedView } from '../components/AccessDeniedView';
import { DashboardView } from '../views/DashboardView';
import { ChantiersView } from '../views/ChantiersView';
import { AdministrationView } from '../views/AdministrationView';
import { NotificationsView } from '../views/NotificationsView';
import { DocumentsView } from '../views/DocumentsView';
import { ParametresView } from '../views/ParametresView';
import { RHView } from '../views/RHView';
import { ApprovisionnementsView } from '../views/ApprovisionnementsView';
import { MagasinView } from '../views/MagasinView';
import { MaterielView } from '../views/MaterielView';
import { SuiviTravauxView } from '../views/SuiviTravauxView';
import { MetresView } from '../views/MetresView';
import { PointageView } from '../views/PointageView';
import { TechniqueView } from '../views/TechniqueView';
import { ComptabiliteView } from '../views/ComptabiliteView';
import { JuridiqueView } from '../views/JuridiqueView';
import { CommercialView } from '../views/CommercialView';
import { MessagerieView } from '../views/MessagerieView';
import { GerantView } from '../views/GerantView';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ModuleCode } from '../types/database';
import { isNavAllowedForUser } from '../lib/modularPermissions';

const navToModule: Record<string, ModuleCode> = {
  dashboard: 'DASHBOARD',
  gerant: 'GERANT',
  'suivi-travaux': 'CHANTIERS',
  chantiers: 'CHANTIERS',
  metres: 'TECHNIQUE',
  technique: 'TECHNIQUE',
  pointage: 'POINTAGE',
  materiel: 'MATERIEL',
  approvisionnements: 'APPROVISIONNEMENTS',
  magasin: 'MAGASIN',
  rh: 'RH',
  commercial: 'COMMERCIAL',
  comptabilite: 'COMPTABILITE',
  juridique: 'JURIDIQUE',
  administration: 'ADMINISTRATION',
  notifications: 'NOTIFICATIONS',
  messagerie: 'MESSAGERIE',
  documents: 'DOCUMENTS',
  parametres: 'PARAMETRES',
  schema: 'DASHBOARD'
};

const AppContent: React.FC = () => {
  const { isAuthenticated, activeNav, securityViolation, currentUser, verifyAccess, rolePermissions } = useApp();

  // Si l'utilisateur n'est pas connecté, afficher la page de connexion sécurisée
  if (!isAuthenticated) {
    return <LoginView />;
  }

  const renderActiveView = () => {
    // Si une violation de sécurité a été interceptée par le moteur RBAC
    if (securityViolation) {
      return <AccessDeniedView />;
    }

    // Contrôle d'accès STRICT : chaque utilisateur (Chantier ET Central)
    // ne peut accéder qu'à ses modules métiers dédiés
    if (currentUser && !isNavAllowedForUser(activeNav, currentUser, rolePermissions)) {
      return <AccessDeniedView />;
    }

    switch (activeNav) {
      case 'dashboard':
        return <DashboardView />;
      case 'gerant':
        return <GerantView />;
      case 'chantiers':
        return <ChantiersView />;
      case 'administration':
        return <AdministrationView />;
      case 'notifications':
        return <NotificationsView />;
      case 'messagerie':
        return <MessagerieView />;
      case 'documents':
        return <DocumentsView />;
      case 'parametres':
        return <ParametresView />;
      case 'rh':
        return <RHView />;
      case 'approvisionnements':
        return <ApprovisionnementsView />;
      case 'magasin':
        return <MagasinView />;
      case 'materiel':
        return <MaterielView />;
      case 'suivi-travaux':
        return <SuiviTravauxView />;
      case 'metres':
        return <MetresView />;
      case 'pointage':
        return <PointageView />;
      case 'technique':
        return <MetresView />;
      case 'comptabilite':
        return <ComptabiliteView />;
      case 'juridique':
        return <JuridiqueView />;
      case 'commercial':
        return <CommercialView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 dark:bg-[#020617] text-slate-900 dark:text-slate-100 antialiased font-sans">
      {/* Sidebar Navigation avec état des droits */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-100 dark:bg-[#020617]">
        {/* Top Header avec sélecteur multi-chantiers et profils */}
        <Header />

        {/* Viewport */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8 pb-20 sm:pb-24 lg:pb-8 bg-slate-100 dark:bg-[#020617]">
          <div className="max-w-7xl mx-auto">{renderActiveView()}</div>
        </main>
      </div>

      {/* Barre de navigation mobile inférieure (iPhone & Android) */}
      <MobileBottomNav />
    </div>
  );
};

export default function Page() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}



