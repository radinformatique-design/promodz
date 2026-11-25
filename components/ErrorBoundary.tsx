'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ShieldAlert, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in application:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6" dir="ltr">
          <div className="max-w-xl w-full bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto text-red-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-100">Une erreur inattendue est survenue</h1>
              <p className="text-slate-400 text-sm">
                Le système de protection applicative BatiProm a intercepté un dysfonctionnement. Vos données restent sécurisées et inchangées.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-left overflow-x-auto text-xs font-mono text-red-300">
                <p className="font-semibold text-slate-200">{this.state.error.name}: {this.state.error.message}</p>
                {this.state.errorInfo && (
                  <pre className="mt-2 text-slate-500 whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors shadow-lg shadow-emerald-900/20 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Réessayer le chargement
              </button>
              <button
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium text-sm transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Recharger la page entière
              </button>
            </div>

            <div className="pt-4 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                BatiProm Security Shield v2026.11
              </span>
              <span>Assistance technique: support@batiprom-dz.com</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
