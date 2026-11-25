'use client';

import React, { useState } from 'react';
import {
  Database,
  Key,
  Link,
  Code2,
  Copy,
  Check,
  Search,
  ArrowRight,
  ShieldAlert,
  HardHat,
  Building,
  Table as TableIcon
} from 'lucide-react';
import { DATABASE_SCHEMA_TABLES, generatePostgreSqlDDL } from '../data/schemaDefinition';
import { SchemaTable } from '../types/database';

export const SchemaViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tables' | 'diagram' | 'ddl' | 'security'>('tables');
  const [selectedTable, setSelectedTable] = useState<SchemaTable>(DATABASE_SCHEMA_TABLES[1]); // chantiers default
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'ENTITE_CENTRALE' | 'FONDATION_SYSTEME' | 'METIER_OPERATIONNEL'>('ALL');

  const filteredTables = DATABASE_SCHEMA_TABLES.filter(t => {
    const matchesSearch = t.tableName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.module.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleCopyDDL = () => {
    const ddl = generatePostgreSqlDDL();
    navigator.clipboard.writeText(ddl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-1">
              <Database className="w-4 h-4" />
              <span>Modèle Relationnel Centralisé & Architecture Technique</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Schéma Relationnel & Cloisonnement Multi-Chantiers
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Base de données PostgreSQL normalisée (3NF) : chaque chantier constitue une entité indépendante rattachée au promoteur. Toutes les données opérationnelles sont isolées via des clés étrangères strictes (<code className="font-mono text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">chantier_id</code>).
            </p>
          </div>

          {/* Sub-nav tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg shrink-0 self-start md:self-auto text-xs">
            <button
              onClick={() => setActiveTab('tables')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
                activeTab === 'tables' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dictionnaire ({DATABASE_SCHEMA_TABLES.length} tables)
            </button>
            <button
              onClick={() => setActiveTab('diagram')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
                activeTab === 'diagram' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Relations & ERD
            </button>
            <button
              onClick={() => setActiveTab('ddl')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
                activeTab === 'ddl' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Script DDL SQL
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
                activeTab === 'security' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fondations Sécurité
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: DATA DICTIONARY */}
      {activeTab === 'tables' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Table List (Left col) */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
            <div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filtrer une table, module..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Category Segmented control */}
              <div className="flex items-center gap-1 mt-3 text-[11px] overflow-x-auto pb-1">
                <button
                  onClick={() => setCategoryFilter('ALL')}
                  className={`px-2 py-1 rounded-md whitespace-nowrap ${categoryFilter === 'ALL' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Tous ({DATABASE_SCHEMA_TABLES.length})
                </button>
                <button
                  onClick={() => setCategoryFilter('ENTITE_CENTRALE')}
                  className={`px-2 py-1 rounded-md whitespace-nowrap ${categoryFilter === 'ENTITE_CENTRALE' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Centrales
                </button>
                <button
                  onClick={() => setCategoryFilter('FONDATION_SYSTEME')}
                  className={`px-2 py-1 rounded-md whitespace-nowrap ${categoryFilter === 'FONDATION_SYSTEME' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Système
                </button>
                <button
                  onClick={() => setCategoryFilter('METIER_OPERATIONNEL')}
                  className={`px-2 py-1 rounded-md whitespace-nowrap ${categoryFilter === 'METIER_OPERATIONNEL' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Métiers
                </button>
              </div>
            </div>

            <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
              {filteredTables.map((table) => {
                const isSelected = selectedTable.tableName === table.tableName;
                return (
                  <button
                    key={table.tableName}
                    onClick={() => setSelectedTable(table)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950'
                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold text-xs text-slate-900">
                        {table.tableName}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                        {table.columns.length} col.
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                      {table.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                      <span>Module: {table.module}</span>
                      <span>·</span>
                      <span className="font-mono text-emerald-600">
                        {table.category === 'ENTITE_CENTRALE' ? 'Noyau' : table.category === 'FONDATION_SYSTEME' ? 'Socle' : 'Chantier'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table Details (Right col) */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <TableIcon className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-lg font-bold font-mono text-slate-900">
                    {selectedTable.tableName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedTable.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Columns Table */}
            <div>
              <h4 className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-2">
                Colonnes et Contraintes ({selectedTable.columns.length})
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                    <tr>
                      <th className="py-2.5 px-3">Nom de la colonne</th>
                      <th className="py-2.5 px-3">Type SQL</th>
                      <th className="py-2.5 px-3">Clé / Contrainte</th>
                      <th className="py-2.5 px-3">Nullable</th>
                      <th className="py-2.5 px-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedTable.columns.map((col) => (
                      <tr key={col.name} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2 px-3 font-mono font-medium text-slate-900">
                          {col.name}
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                          {col.type}
                        </td>
                        <td className="py-2 px-3">
                          {col.isPrimaryKey ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-mono text-[10px] font-semibold">
                              <Key className="w-3 h-3" /> PK
                            </span>
                          ) : col.isForeignKey ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[10px] font-semibold">
                              <Link className="w-3 h-3" /> FK → {col.referencesTable}.{col.referencesColumn}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`font-mono text-[11px] ${col.nullable ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                            {col.nullable ? 'NULL' : 'NOT NULL'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600 text-[11px]">
                          {col.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Indexes */}
            <div>
              <h4 className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-2">
                Index & Clés de recherche ({selectedTable.indexes.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedTable.indexes.map((idx, i) => (
                  <span key={i} className="font-mono text-[11px] px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-md">
                    {idx}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ERD & RELATIONS */}
      {activeTab === 'diagram' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">
              Modèle Conceptuel de Données (MCD) & Arbre des Dépendances
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Visualisation des dépendances relationnelles : <code className="font-mono text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">chantiers</code> est le point d'ancrage obligatoire (1:N) de toutes les tables opérationnelles de l'ERP.
            </p>
          </div>

          {/* Central Architecture Visual Flow */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Box 1: Entreprise */}
            <div className="border-2 border-emerald-500/40 bg-emerald-50/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building className="w-5 h-5 text-emerald-700" />
                <h4 className="font-bold text-slate-900 text-sm">1. Entité Mère : ENTREPRISES</h4>
              </div>
              <p className="text-xs text-slate-600 mb-3">
                Promoteur immobilier au sens juridique algérien (SARL/SPA, RC, NIF, Agrément du Ministère de l'Habitat).
              </p>
              <div className="space-y-1 text-[11px] font-mono text-slate-700 bg-white p-2.5 rounded border border-emerald-200">
                <div>• id (PK, UUID)</div>
                <div>• raison_sociale</div>
                <div>• rc, nif, nis</div>
                <div>• capital_social</div>
              </div>
              <div className="mt-3 text-emerald-800 text-xs font-semibold flex items-center gap-1">
                <span>Rattache 1:N vers Chantiers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Box 2: Chantier */}
            <div className="border-2 border-blue-500/40 bg-blue-50/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <HardHat className="w-5 h-5 text-blue-700" />
                <h4 className="font-bold text-slate-900 text-sm">2. Pivot Central : CHANTIERS</h4>
              </div>
              <p className="text-xs text-slate-600 mb-3">
                Entité indépendante avec son compte d'imputation, wilaya, permis de construire, budget et conducteurs.
              </p>
              <div className="space-y-1 text-[11px] font-mono text-slate-700 bg-white p-2.5 rounded border border-blue-200">
                <div>• id (PK, UUID)</div>
                <div>• entreprise_id (FK → entreprises.id)</div>
                <div>• code_chantier, wilaya, commune</div>
                <div>• budget_global_prevu, statut</div>
              </div>
              <div className="mt-3 text-blue-800 text-xs font-semibold flex items-center gap-1">
                <span>Isole 1:N tous les flux métiers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Box 3: Modules Métiers */}
            <div className="border-2 border-purple-500/40 bg-purple-50/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TableIcon className="w-5 h-5 text-purple-700" />
                <h4 className="font-bold text-slate-900 text-sm">3. Tables Métiers Décloisonnées</h4>
              </div>
              <p className="text-xs text-slate-600 mb-3">
                Chaque enregistrement métier porte obligatoirement une clé étrangère vers le chantier concerné.
              </p>
              <div className="space-y-1 text-[11px] font-mono text-slate-700 bg-white p-2.5 rounded border border-purple-200">
                <div>• documents_ged (chantier_id)</div>
                <div>• technique_lots (chantier_id)</div>
                <div>• comptabilite_budgets (chantier_id)</div>
                <div>• approvisionnement_da (chantier_id)</div>
                <div>• commercial_lots (chantier_id)</div>
              </div>
              <div className="mt-3 text-purple-800 text-xs font-semibold">
                Contrainte ON DELETE RESTRICT
              </div>
            </div>
          </div>

          {/* Relations Matrix Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 border-b border-slate-200">
              Matrice Complète des Clés Étrangères (Foreign Keys)
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-medium">
                <tr>
                  <th className="py-2 px-3">Table Source</th>
                  <th className="py-2 px-3">Colonne FK</th>
                  <th className="py-2 px-3">Table Référencée</th>
                  <th className="py-2 px-3">Cardinalité</th>
                  <th className="py-2 px-3">Règle de Gestion / Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2 px-3 font-mono text-emerald-700 font-semibold">chantiers</td>
                  <td className="py-2 px-3 font-mono">entreprise_id</td>
                  <td className="py-2 px-3 font-mono font-medium text-slate-900">entreprises(id)</td>
                  <td className="py-2 px-3 font-mono text-[11px]">N : 1</td>
                  <td className="py-2 px-3 text-slate-600">Rattachement légal du chantier à la société promotrice.</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-mono text-blue-700 font-semibold">utilisateurs</td>
                  <td className="py-2 px-3 font-mono">role_id</td>
                  <td className="py-2 px-3 font-mono font-medium text-slate-900">roles(id)</td>
                  <td className="py-2 px-3 font-mono text-[11px]">N : 1</td>
                  <td className="py-2 px-3 text-slate-600">Définit les droits RBAC de l'utilisateur.</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-mono text-purple-700 font-semibold">utilisateur_chantiers</td>
                  <td className="py-2 px-3 font-mono">chantier_id</td>
                  <td className="py-2 px-3 font-mono font-medium text-slate-900">chantiers(id)</td>
                  <td className="py-2 px-3 font-mono text-[11px]">N : M</td>
                  <td className="py-2 px-3 text-slate-600">Cloisonnement : un utilisateur ne voit que les chantiers affectés.</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-mono text-purple-700 font-semibold">documents_ged</td>
                  <td className="py-2 px-3 font-mono">chantier_id</td>
                  <td className="py-2 px-3 font-mono font-medium text-slate-900">chantiers(id)</td>
                  <td className="py-2 px-3 font-mono text-[11px]">N : 1</td>
                  <td className="py-2 px-3 text-slate-600">Indexation GED par chantier (plans, permis, PV CTC).</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-mono text-purple-700 font-semibold">audit_logs</td>
                  <td className="py-2 px-3 font-mono">chantier_id</td>
                  <td className="py-2 px-3 font-mono font-medium text-slate-900">chantiers(id)</td>
                  <td className="py-2 px-3 font-mono text-[11px]">N : 1</td>
                  <td className="py-2 px-3 text-slate-600">Traçabilité de toute action sensible opérée sur le chantier.</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-mono text-purple-700 font-semibold">notifications</td>
                  <td className="py-2 px-3 font-mono">chantier_id</td>
                  <td className="py-2 px-3 font-mono font-medium text-slate-900">chantiers(id)</td>
                  <td className="py-2 px-3 font-mono text-[11px]">N : 1</td>
                  <td className="py-2 px-3 text-slate-600">Routage des alertes terrain vers les équipes concernées.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SQL DDL SCRIPT */}
      {activeTab === 'ddl' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Script DDL PostgreSQL Officiel
              </h3>
              <p className="text-xs text-slate-500">
                Script prêt pour création des tables, clés primaires, clés étrangères et index de performance.
              </p>
            </div>
            <button
              onClick={handleCopyDDL}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copié !' : 'Copier le script SQL'}</span>
            </button>
          </div>

          <div className="relative">
            <pre className="bg-slate-950 text-slate-200 font-mono text-[11px] p-4 rounded-xl overflow-x-auto max-h-[600px] border border-slate-800 leading-relaxed">
              <code>{generatePostgreSqlDDL()}</code>
            </pre>
          </div>
        </div>
      )}

      {/* TAB 4: SECURITY & RBAC FOUNDATIONS */}
      {activeTab === 'security' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-rose-600 text-xs font-semibold uppercase tracking-wider mb-1">
              <ShieldAlert className="w-4 h-4" />
              <span>Gouvernance & Sécurité Centralisée</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Fondations de Sécurité : Multi-Niveaux et Rôles RBAC
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Architecture conçue pour garantir que les intervenants d'un chantier ne puissent jamais accéder ou modifier les données des chantiers adjacents, tout en garantissant une vision consolidée pour la Direction Générale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wide">
                1. Cloisonnement des Utilisateurs (Siège vs Chantiers)
              </h4>
              <ul className="text-xs text-slate-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span><strong>Utilisateurs Centraux (Siège) :</strong> Direction Générale, Direction Technique, Direction Juridique, Contrôle de Gestion, Achats. Possèdent une vue consolidée sur l'ensemble du patrimoine immobilier.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <span><strong>Utilisateurs Chantiers (Terrain) :</strong> Directeurs de site, Conducteurs de travaux, Magasiniers, Chefs de projet. Strictement limités aux chantiers sur lesquels une affectation active (<code className="font-mono text-blue-700 bg-blue-50 px-1 py-0.5 rounded">utilisateur_chantiers</code>) est formalisée.</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wide">
                2. Traçabilité & Journal d'Audit Immuable
              </h4>
              <ul className="text-xs text-slate-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span><strong>Opérations sensibles tracées :</strong> Validation de situations de travaux, approbation de permis de construire, décaissements, passation de commandes d'acier/béton, affectation de personnel.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span><strong>Métadonnées d'audit enregistrées :</strong> Horodatage serveur milliseconde, User ID, Chantier ID, Adresse IP, User Agent, snapshot JSON avant et après modification.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
