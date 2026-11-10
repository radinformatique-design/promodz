'use client';

import React from 'react';
import { AppProvider, useApp } from '../context/AppContext';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { LoginView } from '../views/LoginView';
import { AccessDeniedView } from '../components/AccessDeniedView';
import { DashboardView } from '../views/DashboardView';
import { ChantiersView } from '../views/ChantiersView';
import { AdministrationView } from '../views/AdministrationView';
import { NotificationsView } from '../views/NotificationsView';
import { DocumentsView } from '../views/DocumentsView';
import { SchemaViewer } from '../components/SchemaViewer';
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
import { CaisseView } from '../views/CaisseView';
import { JuridiqueView } from '../views/JuridiqueView';
import { CommercialView } from '../views/CommercialView';
import { ErrorBoundary } from '../components/ErrorBoundary';

const AppContent: React.FC = () => {
  const { isAuthenticated, activeNav, securityViolation } = useApp();

  // Si l'utilisateur n'est pas connecté, afficher la page de connexion sécurisée
  if (!isAuthenticated) {
    return <LoginView />;
  }

  const renderActiveView = () => {
    // Si une violation de sécurité a été interceptée par le moteur RBAC
    if (securityViolation) {
      return <AccessDeniedView />;
    }

    switch (activeNav) {
      case 'dashboard':
        return <DashboardView />;
      case 'chantiers':
        return <ChantiersView />;
      case 'administration':
        return <AdministrationView />;
      case 'notifications':
        return <NotificationsView />;
      case 'documents':
        return <DocumentsView />;
      case 'schema':
        return <SchemaViewer />;
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
      case 'caisse':
        return <CaisseView />;
      case 'juridique':
        return <JuridiqueView />;
      case 'commercial':
        return <CommercialView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 antialiased font-sans">
      {/* Sidebar Navigation avec état des droits */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header avec sélecteur multi-chantiers et profils */}
        <Header />

        {/* Viewport */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">{renderActiveView()}</div>
        </main>
      </div>
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
