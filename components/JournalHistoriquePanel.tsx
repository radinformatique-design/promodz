'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Search,
  Filter,
  Printer,
  Download,
  Clock,
  Users,
  CloudSun,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Eye,
  X,
  Building2,
  Wrench,
  ClipboardList,
  LayoutList,
  LayoutGrid,
  Table as TableIcon,
  Plus,
  RotateCcw,
  UserCheck,
  CloudRain
} from 'lucide-react';
import { Chantier, RapportChantier } from '../types/database';

interface JournalHistoriquePanelProps {
  rapports: RapportChantier[];
  chantiers: Chantier[];
  selectedChantierId?: string | 'ALL';
  title?: string;
  subtitle?: string;
  accentColor?: 'amber' | 'indigo' | 'orange' | 'slate';
  allowChantierFilter?: boolean;
  onNewRapport?: () => void;
  newRapportLabel?: string;
  onValidateRapport?: (rapportId: string) => void;
}

type ViewMode = 'timeline' | 'table' | 'cards';

export const JournalHistoriquePanel: React.FC<JournalHistoriquePanelProps> = ({
  rapports,
  chantiers,
  selectedChantierId = 'ALL',
  title = 'Historique des Journaux de Chantier',
  subtitle = 'Traçabilité chronologique des rapports journaliers, hebdomadaires et mensuels rédigés par les conducteurs de travaux.',
  accentColor = 'orange',
  allowChantierFilter = true,
  onNewRapport,
  newRapportLabel = 'Nouveau Rapport Journalier',
  onValidateRapport
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [localChantierFilter, setLocalChantierFilter] = useState<string>(
    selectedChantierId || 'ALL'
  );
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'JOURNALIER' | 'HEBDOMADAIRE' | 'MENSUEL'>('ALL');
  const [statutFilter, setStatutFilter] = useState<'ALL' | 'VALIDE' | 'EN_COURS'>('ALL');
  const [onlyWithAlerts, setOnlyWithAlerts] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [selectedRapport, setSelectedRapport] = useState<RapportChantier | null>(null);

  const effectiveChantierFilter = allowChantierFilter ? localChantierFilter : selectedChantierId;

  const chantierMap = useMemo(() => {
    const map = new Map<string, Chantier>();
    chantiers.forEach(c => map.set(c.id, c));
    return map;
  }, [chantiers]);

  const getChantierLabel = (chantierId: string) => {
    const c = chantierMap.get(chantierId);
    return c ? `${c.code_chantier} • ${c.nom_projet}` : chantierId;
  };

  const getChantierCode = (chantierId: string) => {
    const c = chantierMap.get(chantierId);
    return c ? c.code_chantier : chantierId;
  };

  const hasIncidentOrAnomaly = (r: RapportChantier) => {
    const hasAnomalie = Boolean(r.anomalies_retards && r.anomalies_retards.trim().length > 0);
    const inc = (r.incidents_securite || '').toLowerCase();
    const hasRealIncident =
      inc.length > 0 &&
      !inc.includes('aucun incident') &&
      !inc.includes('ras') &&
      !inc.includes('néant');
    return { hasAnomalie, hasRealIncident, anyAlert: hasAnomalie || hasRealIncident };
  };

  const filteredRapports = useMemo(() => {
    return [...rapports]
      .filter(r => {
        if (effectiveChantierFilter && effectiveChantierFilter !== 'ALL' && r.chantier_id !== effectiveChantierFilter) {
          return false;
        }
        if (typeFilter !== 'ALL' && r.type !== typeFilter) return false;
        if (statutFilter !== 'ALL' && r.statut !== statutFilter) return false;
        if (dateFrom && r.date_rapport < dateFrom) return false;
        if (dateTo && r.date_rapport > dateTo) return false;
        if (onlyWithAlerts && !hasIncidentOrAnomaly(r).anyAlert) return false;

        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const chLabel = getChantierLabel(r.chantier_id).toLowerCase();
          const haystack = [
            r.date_rapport,
            r.redacteur_nom,
            r.activites_realisees,
            r.materiel_sur_site || '',
            r.anomalies_retards || '',
            r.incidents_securite || '',
            r.meteo,
            chLabel
          ]
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.date_rapport.localeCompare(a.date_rapport));
  }, [
    rapports,
    effectiveChantierFilter,
    typeFilter,
    statutFilter,
    dateFrom,
    dateTo,
    onlyWithAlerts,
    searchTerm,
    chantierMap
  ]);

  // Group by YYYY-MM for Timeline view
  const groupedByMonth = useMemo(() => {
    const groups: { monthKey: string; monthLabel: string; items: RapportChantier[] }[] = [];
    const map = new Map<string, RapportChantier[]>();

    filteredRapports.forEach(r => {
      const monthKey = r.date_rapport ? r.date_rapport.slice(0, 7) : 'SANS-DATE';
      if (!map.has(monthKey)) map.set(monthKey, []);
      map.get(monthKey)!.push(r);
    });

    map.forEach((items, monthKey) => {
      let monthLabel = monthKey;
      if (/^\d{4}-\d{2}$/.test(monthKey)) {
        const [y, m] = monthKey.split('-').map(Number);
        const dateObj = new Date(y, m - 1, 1);
        monthLabel = dateObj.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        monthLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
      }
      groups.push({ monthKey, monthLabel, items });
    });

    return groups;
  }, [filteredRapports]);

  const stats = useMemo(() => {
    const total = filteredRapports.length;
    const journaliers = filteredRapports.filter(r => r.type === 'JOURNALIER').length;
    const hebdoMensuels = total - journaliers;
    const avgEffectif =
      total > 0
        ? Math.round(filteredRapports.reduce((acc, r) => acc + (r.effectif_total || 0), 0) / total)
        : 0;
    const totalIntemperies = filteredRapports.reduce((acc, r) => acc + (r.heures_intemperies || 0), 0);
    const alertsCount = filteredRapports.filter(r => hasIncidentOrAnomaly(r).anyAlert).length;
    const distinctChantiers = new Set(filteredRapports.map(r => r.chantier_id)).size;

    return { total, journaliers, hebdoMensuels, avgEffectif, totalIntemperies, alertsCount, distinctChantiers };
  }, [filteredRapports]);

  const resetFilters = () => {
    setSearchTerm('');
    if (allowChantierFilter) setLocalChantierFilter('ALL');
    setTypeFilter('ALL');
    setStatutFilter('ALL');
    setOnlyWithAlerts(false);
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    (allowChantierFilter && localChantierFilter !== 'ALL') ||
    typeFilter !== 'ALL' ||
    statutFilter !== 'ALL' ||
    onlyWithAlerts ||
    dateFrom !== '' ||
    dateTo !== '';

  const handleExportCSV = () => {
    const headers = [
      'Date',
      'Chantier',
      'Type',
      'Statut',
      'Rédacteur',
      'Effectif',
      'Météo',
      'Heures Intempéries',
      'Matériel sur site',
      'Activités réalisées',
      'Anomalies & Retards',
      'Incidents Sécurité'
    ];

    const escapeCsv = (val: string | number | undefined) => {
      const s = String(val ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ');
      return `"${s}"`;
    };

    const rows = filteredRapports.map(r =>
      [
        r.date_rapport,
        getChantierLabel(r.chantier_id),
        r.type,
        r.statut,
        r.redacteur_nom,
        r.effectif_total,
        r.meteo,
        r.heures_intemperies ?? 0,
        r.materiel_sur_site ?? '',
        r.activites_realisees,
        r.anomalies_retards ?? '',
        r.incidents_securite ?? ''
      ]
        .map(escapeCsv)
        .join(';')
    );

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historique_journaux_chantier_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const accentBadge =
    accentColor === 'indigo'
      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
      : accentColor === 'slate'
        ? 'bg-slate-900 hover:bg-slate-800 text-white'
        : 'bg-orange-600 hover:bg-orange-700 text-white';

  const activePill =
    accentColor === 'indigo'
      ? 'bg-indigo-600 text-white shadow-sm'
      : 'bg-orange-600 text-white shadow-sm';

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-tight">{title}</h3>
              <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={filteredRapports.length === 0}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Imprimer
          </button>
          {onNewRapport && (
            <button
              onClick={onNewRapport}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${accentBadge}`}
            >
              <Plus className="w-4 h-4" /> {newRapportLabel}
            </button>
          )}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>Rapports Archivés</span>
            <Calendar className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.total}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {stats.journaliers} journaliers • {stats.hebdoMensuels} hebdo/mensuels
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>Effectif Moyen / Jour</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.avgEffectif} <span className="text-xs font-semibold text-slate-500">ouvr.</span></div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Sur {stats.distinctChantiers} chantier(s) actif(s)
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>Intempéries Cumulées</span>
            <CloudRain className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.totalIntemperies} <span className="text-xs font-semibold text-slate-500">h</span></div>
          <div className="text-[11px] text-slate-500 mt-0.5">Arrêts météo déclarés</div>
        </div>

        <div
          onClick={() => setOnlyWithAlerts(prev => !prev)}
          className={`rounded-2xl border p-4 shadow-sm cursor-pointer transition-all ${
            onlyWithAlerts
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20'
              : 'bg-white border-slate-200 hover:border-rose-300'
          }`}
          title="Cliquer pour filtrer les rapports avec anomalies ou incidents"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>Anomalies & Incidents</span>
            <AlertTriangle className={`w-4 h-4 ${stats.alertsCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`} />
          </div>
          <div className={`text-2xl font-black ${stats.alertsCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {stats.alertsCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {onlyWithAlerts ? 'Filtre actif (cliquer pour tout voir)' : 'Cliquer pour isoler les alertes'}
          </div>
        </div>
      </div>

      {/* Filter & View Switcher Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Rechercher activité, conducteur, engin, incident..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
          </div>

          {/* Chantier filter */}
          {allowChantierFilter && (
            <select
              value={localChantierFilter}
              onChange={e => setLocalChantierFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            >
              <option value="ALL">Tous les chantiers</option>
              {chantiers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.code_chantier} — {c.nom_projet}
                </option>
              ))}
            </select>
          )}

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          >
            <option value="ALL">Tous les types</option>
            <option value="JOURNALIER">Journalier</option>
            <option value="HEBDOMADAIRE">Hebdomadaire</option>
            <option value="MENSUEL">Mensuel</option>
          </select>

          {/* Statut filter */}
          <select
            value={statutFilter}
            onChange={e => setStatutFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="VALIDE">Validé</option>
            <option value="EN_COURS">En cours</option>
          </select>

          {/* Date range compact */}
          <div className={`flex items-center gap-1.5 ${allowChantierFilter ? '' : 'lg:col-span-2'}`}>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              title="Date de début"
              className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-700"
            />
            <span className="text-slate-400 text-xs">→</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              title="Date de fin"
              className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-700"
            />
          </div>
        </div>

        {/* Bottom bar: active count + reset + view switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>
              <strong className="text-slate-800">{filteredRapports.length}</strong> rapport(s) affiché(s)
              {rapports.length !== filteredRapports.length && ` sur ${rapports.length}`}
            </span>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="ml-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Réinitialiser
              </button>
            )}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'timeline' ? activePill : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" /> Chronologie
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table' ? activePill : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" /> Tableau
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'cards' ? activePill : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Cartes
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredRapports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-2 shadow-sm">
          <ClipboardList className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">Aucun journal de chantier trouvé</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Aucun rapport ne correspond aux critères sélectionnés. Modifiez les filtres ou créez un nouveau rapport journalier depuis l'espace Conducteur de Travaux.
          </p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Afficher tout l'historique
            </button>
          )}
        </div>
      ) : (
        <>
          {/* MODE 1 : TIMELINE CHRONOLOGIQUE GROUPÉE PAR MOIS */}
          {viewMode === 'timeline' && (
            <div className="space-y-6">
              {groupedByMonth.map(group => (
                <div key={group.monthKey} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold tracking-wide">
                      {group.monthLabel}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {group.items.length} rapport(s)
                    </span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>

                  <div className="relative pl-5 sm:pl-7 border-l-2 border-slate-200 space-y-4 ml-2">
                    {group.items.map(rap => {
                      const alerts = hasIncidentOrAnomaly(rap);
                      return (
                        <div key={rap.id} className="relative">
                          {/* Timeline Dot */}
                          <span
                            className={`absolute -left-[27px] sm:-left-[35px] top-5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${
                              alerts.anyAlert
                                ? 'bg-rose-500'
                                : rap.statut === 'VALIDE'
                                  ? 'bg-emerald-500'
                                  : 'bg-amber-500'
                            }`}
                          />

                          <div className="bg-white rounded-2xl border border-slate-200 hover:border-orange-300 shadow-sm hover:shadow-md transition-all p-4 sm:p-5 space-y-3">
                            {/* Top Row */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 text-orange-800 border border-orange-200 text-xs font-black">
                                  <Calendar className="w-3.5 h-3.5" /> {rap.date_rapport}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                                  {rap.type}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[11px] font-bold">
                                  <Building2 className="w-3 h-3" /> {getChantierCode(rap.chantier_id)}
                                </span>
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    rap.statut === 'VALIDE'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {rap.statut === 'VALIDE' ? 'VALIDÉ' : 'EN COURS'}
                                </span>
                                {alerts.anyAlert && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                                    <AlertTriangle className="w-3 h-3" /> Signalement
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                                <span>
                                  Conducteur : <strong className="text-slate-800">{rap.redacteur_nom}</strong>
                                </span>
                              </div>
                            </div>

                            {/* Metadata Strip */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                              <div className="bg-slate-50 rounded-xl px-3 py-2 flex items-center gap-2">
                                <Users className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                                <div>
                                  <div className="text-[10px] text-slate-400 font-semibold">Effectif</div>
                                  <div className="font-bold text-slate-800">{rap.effectif_total} ouvriers</div>
                                </div>
                              </div>
                              <div className="bg-slate-50 rounded-xl px-3 py-2 flex items-center gap-2">
                                <CloudSun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <div className="min-w-0">
                                  <div className="text-[10px] text-slate-400 font-semibold">Météo</div>
                                  <div className="font-bold text-slate-800 truncate">{rap.meteo}</div>
                                </div>
                              </div>
                              <div className="bg-slate-50 rounded-xl px-3 py-2 flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                                <div>
                                  <div className="text-[10px] text-slate-400 font-semibold">Intempéries</div>
                                  <div className="font-bold text-slate-800">{rap.heures_intemperies ?? 0} h</div>
                                </div>
                              </div>
                              <div className="bg-slate-50 rounded-xl px-3 py-2 flex items-center gap-2">
                                <Wrench className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                                <div className="min-w-0">
                                  <div className="text-[10px] text-slate-400 font-semibold">Engins</div>
                                  <div className="font-bold text-slate-800 truncate">
                                    {rap.materiel_sur_site || 'Non renseigné'}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Body */}
                            <div className="space-y-2">
                              <div>
                                <div className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">
                                  Travaux & Activités Réalisées
                                </div>
                                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                                  {rap.activites_realisees}
                                </p>
                              </div>

                              {(alerts.hasAnomalie || alerts.hasRealIncident) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                                  {alerts.hasAnomalie && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-900">
                                      <strong className="flex items-center gap-1 text-[11px] mb-0.5">
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Anomalies / Retards :
                                      </strong>
                                      {rap.anomalies_retards}
                                    </div>
                                  )}
                                  {alerts.hasRealIncident && (
                                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-xs text-rose-900">
                                      <strong className="flex items-center gap-1 text-[11px] mb-0.5">
                                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Sécurité / Incidents :
                                      </strong>
                                      {rap.incidents_securite}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                              <span className="text-[11px] text-slate-500">
                                {getChantierLabel(rap.chantier_id)}
                              </span>
                              <div className="flex items-center gap-2">
                                {onValidateRapport && rap.statut !== 'VALIDE' && (
                                  <button
                                    onClick={() => onValidateRapport(rap.id)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Viser
                                  </button>
                                )}
                                <button
                                  onClick={() => setSelectedRapport(rap)}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-orange-100 hover:text-orange-800 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" /> Fiche complète
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MODE 2 : TABLEAU STRUCTURÉ */}
          {viewMode === 'table' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                      <th className="py-3 px-4">Date & Type</th>
                      <th className="py-3 px-4">Chantier</th>
                      <th className="py-3 px-4">Conducteur</th>
                      <th className="py-3 px-4">Météo / Effectif</th>
                      <th className="py-3 px-4">Activités réalisées</th>
                      <th className="py-3 px-4">Alertes</th>
                      <th className="py-3 px-4">Statut</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRapports.map(rap => {
                      const alerts = hasIncidentOrAnomaly(rap);
                      return (
                        <tr key={rap.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-bold text-slate-900">{rap.date_rapport}</div>
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">{rap.type}</div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-bold text-[11px]">
                              {getChantierCode(rap.chantier_id)}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-700">
                            {rap.redacteur_nom}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="text-slate-700 font-medium">{rap.meteo}</div>
                            <div className="text-[11px] text-orange-700 font-bold">
                              {rap.effectif_total} ouvriers
                              {(rap.heures_intemperies ?? 0) > 0 && ` • ${rap.heures_intemperies}h intemp.`}
                            </div>
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <p className="line-clamp-2 text-slate-700">{rap.activites_realisees}</p>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {alerts.anyAlert ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                                <AlertTriangle className="w-3 h-3" /> Oui
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                                <ShieldCheck className="w-3 h-3" /> RAS
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                rap.statut === 'VALIDE'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {rap.statut}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => setSelectedRapport(rap)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-orange-100 hover:text-orange-800 text-slate-700 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" /> Détails
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MODE 3 : GRILLE DE CARTES */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredRapports.map(rap => {
                const alerts = hasIncidentOrAnomaly(rap);
                return (
                  <div
                    key={rap.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:border-orange-400 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-700">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-black text-slate-900">{rap.date_rapport}</div>
                            <div className="text-[10px] uppercase font-bold text-slate-400">
                              {rap.type} • {getChantierCode(rap.chantier_id)}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            rap.statut === 'VALIDE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {rap.statut}
                        </span>
                      </div>

                      <div className="p-4 space-y-2.5 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Météo :</span>
                          <strong className="text-slate-800">{rap.meteo}</strong>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Effectif présent :</span>
                          <span className="font-bold text-orange-800 bg-orange-50 px-2 py-0.5 rounded">
                            {rap.effectif_total} ouvriers
                          </span>
                        </div>
                        {rap.materiel_sur_site && (
                          <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 line-clamp-2">
                            <strong className="text-slate-800">Engins : </strong>
                            {rap.materiel_sur_site}
                          </div>
                        )}
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Activités réalisées</div>
                          <p className="text-slate-700 line-clamp-3 leading-relaxed">{rap.activites_realisees}</p>
                        </div>
                        {alerts.anyAlert && (
                          <div className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Anomalie ou incident signalé
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[10px] text-slate-500">
                        Par <strong className="text-slate-700">{rap.redacteur_nom}</strong>
                      </span>
                      <button
                        onClick={() => setSelectedRapport(rap)}
                        className="text-orange-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> Fiche complète
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* MODALE FICHE DÉTAILLÉE STRUCTURÉE */}
      {selectedRapport && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base">
                    Journal de Chantier du {selectedRapport.date_rapport}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {getChantierLabel(selectedRapport.chantier_id)} • {selectedRapport.type}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRapport(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Rédacteur + Statut */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-orange-600" />
                  <span className="text-slate-600">
                    Rédigé par : <strong className="text-slate-900">{selectedRapport.redacteur_nom}</strong>
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                    selectedRapport.statut === 'VALIDE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {selectedRapport.statut === 'VALIDE' ? 'VALIDÉ' : 'EN COURS'}
                </span>
              </div>

              {/* Conditions & Ressources */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl border border-slate-200 bg-white">
                  <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Conditions Météo</div>
                  <div className="font-bold text-slate-800">{selectedRapport.meteo}</div>
                </div>
                <div className="p-3 rounded-2xl border border-slate-200 bg-white">
                  <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Heures Intempéries</div>
                  <div className="font-bold text-slate-800">{selectedRapport.heures_intemperies ?? 0} heure(s)</div>
                </div>
                <div className="p-3 rounded-2xl border border-slate-200 bg-white">
                  <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Effectif Mobilisé</div>
                  <div className="font-bold text-orange-700">{selectedRapport.effectif_total} ouvriers</div>
                </div>
              </div>

              {/* Corps d'état si présent */}
              {selectedRapport.corps_etat_presents && selectedRapport.corps_etat_presents.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400 mb-1.5">
                    Répartition par Corps d'État
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedRapport.corps_etat_presents.map((ce, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px]"
                      >
                        {ce.metier} : <strong>{ce.nombre}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Matériel sur site */}
              {selectedRapport.materiel_sur_site && (
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Matériel & Engins sur Site
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700">
                    {selectedRapport.materiel_sur_site}
                  </div>
                </div>
              )}

              {/* Activités réalisées */}
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Activités Réalisées & Avancement
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-line">
                  {selectedRapport.activites_realisees}
                </div>
              </div>

              {/* Anomalies & Retards */}
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Anomalies & Retards</div>
                {selectedRapport.anomalies_retards ? (
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
                    {selectedRapport.anomalies_retards}
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 italic">
                    Aucune anomalie ni retard signalé.
                  </div>
                )}
              </div>

              {/* Incidents Sécurité */}
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Sécurité Chantier & Incidents (HSE)
                </div>
                <div
                  className={`p-3 rounded-2xl border ${
                    hasIncidentOrAnomaly(selectedRapport).hasRealIncident
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  {selectedRapport.incidents_securite || 'Aucun incident répertorié.'}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 rounded-b-3xl flex items-center justify-between gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Imprimer la fiche
              </button>
              <button
                onClick={() => setSelectedRapport(null)}
                className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
