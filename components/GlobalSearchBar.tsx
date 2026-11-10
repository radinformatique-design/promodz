'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  X,
  FileText,
  Users,
  Building2,
  ChevronRight,
  Scale,
  FolderLock,
  Phone,
  MapPin,
  Tag,
  CheckCircle2,
  Clock,
  Ban,
  Building
} from 'lucide-react';
import {
  ContratJuridique,
  DocumentFoncierAdmin,
  DossierLitige,
  ClientProspect,
  BienImmobilier
} from '../types/database';

export const GlobalSearchBar: React.FC = () => {
  const {
    contratsJuridiques,
    documentsFonciers,
    dossiersLitiges,
    clientsProspects,
    biensImmobiliers,
    setActiveNav
  } = useApp();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'ALL' | 'JURIDIQUE' | 'CLIENTS' | 'BIENS'>('ALL');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Real-time filtering logic
  const normalizedQuery = query.trim().toLowerCase();

  // 1. Documents Juridiques Search (Contrats, Fonciers, Litiges)
  const matchedContrats = normalizedQuery === '' ? [] : contratsJuridiques.filter(c =>
    c.numero_contrat.toLowerCase().includes(normalizedQuery) ||
    c.titre.toLowerCase().includes(normalizedQuery) ||
    c.partie_prenante_nom.toLowerCase().includes(normalizedQuery) ||
    (c.chantier_nom && c.chantier_nom.toLowerCase().includes(normalizedQuery)) ||
    c.type.toLowerCase().includes(normalizedQuery)
  );

  const matchedFonciers = normalizedQuery === '' ? [] : documentsFonciers.filter(f =>
    f.reference_officielle.toLowerCase().includes(normalizedQuery) ||
    f.titre.toLowerCase().includes(normalizedQuery) ||
    f.wilaya.toLowerCase().includes(normalizedQuery) ||
    f.type.toLowerCase().includes(normalizedQuery) ||
    (f.chantier_nom && f.chantier_nom.toLowerCase().includes(normalizedQuery))
  );

  const matchedLitiges = normalizedQuery === '' ? [] : dossiersLitiges.filter(l =>
    l.numero_dossier.toLowerCase().includes(normalizedQuery) ||
    l.titre_affaire.toLowerCase().includes(normalizedQuery) ||
    l.partie_adverse.toLowerCase().includes(normalizedQuery) ||
    l.juridiction.toLowerCase().includes(normalizedQuery) ||
    l.avocat_conseil_nom.toLowerCase().includes(normalizedQuery)
  );

  const totalJuridiqueMatches = matchedContrats.length + matchedFonciers.length + matchedLitiges.length;

  // 2. Clients & Prospects Search
  const matchedClients = normalizedQuery === '' ? [] : clientsProspects.filter(cli =>
    cli.nom.toLowerCase().includes(normalizedQuery) ||
    cli.prenom.toLowerCase().includes(normalizedQuery) ||
    cli.nin.toLowerCase().includes(normalizedQuery) ||
    cli.telephone.toLowerCase().includes(normalizedQuery) ||
    cli.email.toLowerCase().includes(normalizedQuery) ||
    cli.numero_fiche.toLowerCase().includes(normalizedQuery) ||
    cli.typologie_recherchee.toLowerCase().includes(normalizedQuery)
  );

  // 3. Biens Immobiliers Search
  const matchedBiens = normalizedQuery === '' ? [] : biensImmobiliers.filter(bien =>
    bien.reference.toLowerCase().includes(normalizedQuery) ||
    bien.chantier_nom.toLowerCase().includes(normalizedQuery) ||
    bien.batiment_bloc.toLowerCase().includes(normalizedQuery) ||
    bien.type_bien.toLowerCase().includes(normalizedQuery) ||
    (bien.client_reservataire_nom && bien.client_reservataire_nom.toLowerCase().includes(normalizedQuery)) ||
    (bien.client_reservataire_tel && bien.client_reservataire_tel.toLowerCase().includes(normalizedQuery))
  );

  const totalMatchesCount = totalJuridiqueMatches + matchedClients.length + matchedBiens.length;

  const handleSelectResult = (targetModule: 'juridique' | 'commercial') => {
    setActiveNav(targetModule);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md mx-2">
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Recherche globale (Documents, Clients, Biens)..."
          className="w-full pl-9 pr-16 py-1.5 bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
        />

        {query ? (
          <button
            onClick={() => setQuery('')}
            className="absolute right-2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <kbd className="hidden sm:inline-flex items-center gap-0.5 absolute right-2.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded shadow-2xs pointer-events-none">
            ⌘K
          </kbd>
        )}
      </div>

      {/* Instant Filter Dropdown Results */}
      {isOpen && normalizedQuery.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 max-h-[520px] flex flex-col">
          {/* Header & Category Pills */}
          <div className="p-3 bg-slate-50 border-b border-slate-100 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Résultats en temps réel ({totalMatchesCount})
              </span>
              <span className="text-[10px] text-slate-400">Recherche instantanée</span>
            </div>

            <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
              <button
                onClick={() => setActiveCategoryFilter('ALL')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  activeCategoryFilter === 'ALL'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Tous ({totalMatchesCount})
              </button>
              <button
                onClick={() => setActiveCategoryFilter('JURIDIQUE')}
                className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1 transition ${
                  activeCategoryFilter === 'JURIDIQUE'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Scale className="w-3 h-3" /> Juridique ({totalJuridiqueMatches})
              </button>
              <button
                onClick={() => setActiveCategoryFilter('CLIENTS')}
                className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1 transition ${
                  activeCategoryFilter === 'CLIENTS'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Users className="w-3 h-3" /> Clients ({matchedClients.length})
              </button>
              <button
                onClick={() => setActiveCategoryFilter('BIENS')}
                className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1 transition ${
                  activeCategoryFilter === 'BIENS'
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-3 h-3" /> Biens ({matchedBiens.length})
              </button>
            </div>
          </div>

          {/* Scrollable Results List */}
          <div className="overflow-y-auto divide-y divide-slate-100 p-2 space-y-3">
            {/* CATEGORY 1: DOCUMENTS JURIDIQUES */}
            {(activeCategoryFilter === 'ALL' || activeCategoryFilter === 'JURIDIQUE') && totalJuridiqueMatches > 0 && (
              <div>
                <div className="px-2 py-1 text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-amber-600" /> Documents & Dossiers Juridiques
                  </span>
                  <span>{totalJuridiqueMatches} trouvés</span>
                </div>

                {/* Contrats */}
                {matchedContrats.map(contrat => (
                  <div
                    key={contrat.id}
                    onClick={() => handleSelectResult('juridique')}
                    className="p-2.5 hover:bg-amber-50/60 rounded-lg cursor-pointer transition flex items-center justify-between group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-900">{contrat.numero_contrat}</span>
                        <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[10px] font-semibold rounded">
                          {contrat.type}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-800 truncate mt-0.5">{contrat.titre}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>Partie : <strong>{contrat.partie_prenante_nom}</strong></span>
                        <span>•</span>
                        <span>Montant : {contrat.montant_dzd.toLocaleString('fr-DZ')} DZD</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-600 transition" />
                  </div>
                ))}

                {/* Fonciers */}
                {matchedFonciers.map(foncier => (
                  <div
                    key={foncier.id}
                    onClick={() => handleSelectResult('juridique')}
                    className="p-2.5 hover:bg-amber-50/60 rounded-lg cursor-pointer transition flex items-center justify-between group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">{foncier.reference_officielle}</span>
                        <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded">
                          {foncier.type.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-800 truncate mt-0.5">{foncier.titre}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" /> {foncier.wilaya} {foncier.chantier_nom ? `• ${foncier.chantier_nom}` : ''}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-600 transition" />
                  </div>
                ))}

                {/* Litiges */}
                {matchedLitiges.map(litige => (
                  <div
                    key={litige.id}
                    onClick={() => handleSelectResult('juridique')}
                    className="p-2.5 hover:bg-amber-50/60 rounded-lg cursor-pointer transition flex items-center justify-between group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-rose-800">{litige.numero_dossier}</span>
                        <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 text-[10px] font-bold rounded">
                          LITIGE / CONTENTIEUX
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-800 truncate mt-0.5">{litige.titre_affaire}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>Adverse : <strong>{litige.partie_adverse}</strong></span>
                        <span>•</span>
                        <span>Avocat : {litige.avocat_conseil_nom}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-600 transition" />
                  </div>
                ))}
              </div>
            )}

            {/* CATEGORY 2: CLIENTS & PROSPECTS */}
            {(activeCategoryFilter === 'ALL' || activeCategoryFilter === 'CLIENTS') && matchedClients.length > 0 && (
              <div>
                <div className="px-2 py-1 text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-emerald-600" /> Clients & Prospects CRM
                  </span>
                  <span>{matchedClients.length} trouvés</span>
                </div>

                {matchedClients.map(client => (
                  <div
                    key={client.id}
                    onClick={() => handleSelectResult('commercial')}
                    className="p-2.5 hover:bg-emerald-50/60 rounded-lg cursor-pointer transition flex items-center justify-between group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{client.nom} {client.prenom}</span>
                        <span className="font-mono text-[10px] text-blue-800 bg-blue-50 px-1.5 py-0.2 rounded font-semibold">
                          {client.numero_fiche}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 flex items-center gap-3 mt-0.5">
                        <span>NIN : <strong className="font-mono">{client.nin}</strong></span>
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {client.telephone}</span>
                      </div>
                      <div className="text-[10px] text-emerald-800 font-semibold mt-0.5">
                        Budget max : {client.budget_max_dzd.toLocaleString('fr-DZ')} DZD ({client.typologie_recherchee})
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition" />
                  </div>
                ))}
              </div>
            )}

            {/* CATEGORY 3: BIENS IMMOBILIERS */}
            {(activeCategoryFilter === 'ALL' || activeCategoryFilter === 'BIENS') && matchedBiens.length > 0 && (
              <div>
                <div className="px-2 py-1 text-[10px] font-bold text-purple-700 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-purple-600" /> Biens Immobiliers & Lots
                  </span>
                  <span>{matchedBiens.length} trouvés</span>
                </div>

                {matchedBiens.map(bien => (
                  <div
                    key={bien.id}
                    onClick={() => handleSelectResult('commercial')}
                    className="p-2.5 hover:bg-purple-50/60 rounded-lg cursor-pointer transition flex items-center justify-between group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-blue-900 font-mono">{bien.reference}</span>
                        <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded">
                          {bien.batiment_bloc} • {bien.etage}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded">
                          {bien.statut}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-800 mt-0.5">
                        {bien.type_bien.replace('_', ' ')} — {bien.superficie_habitable_m2} m² ({bien.orientation})
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center justify-between mt-0.5 pr-2">
                        <span>Chantier : <strong>{bien.chantier_nom}</strong></span>
                        <span className="font-bold text-blue-900">{bien.prix_vente_dzd.toLocaleString('fr-DZ')} DZD</span>
                      </div>
                      {bien.client_reservataire_nom && (
                        <div className="text-[10px] text-blue-700 font-medium mt-0.5">
                          Acquéreur: {bien.client_reservataire_nom}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600 transition" />
                  </div>
                ))}
              </div>
            )}

            {/* Zero Matches State */}
            {totalMatchesCount === 0 && (
              <div className="p-8 text-center text-slate-500">
                <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">Aucun résultat trouvé pour "{query}"</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Essayez un nom de client, numéro de dossier juridique, référence de lot ou NIN.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
