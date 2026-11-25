'use client';

import React from 'react';
import {
  Users,
  Scale,
  ReceiptText,
  Layers,
  Truck,
  Building2,
  ShoppingCart,
  Settings2,
  Database,
  ArrowRight,
  Shield,
  Layers as LayersIcon,
  HardHat,
  FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DATABASE_SCHEMA_TABLES } from '../data/schemaDefinition';

interface ModuleFoundationViewProps {
  moduleId: string;
}

export const ModuleFoundationView: React.FC<ModuleFoundationViewProps> = ({ moduleId }) => {
  const { setActiveNav, selectedChantierId, currentChantier } = useApp();

  const getModuleConfig = () => {
    switch (moduleId) {
      case 'rh':
        return {
          title: 'Ressources Humaines',
          icon: Users,
          description: 'Gestion des effectifs centraux et des équipes affectées aux chantiers en Algérie.',
          targetTable: 'rh_employes',
          color: 'blue',
          algerianRules: [
            'Déclaration CNAS et gestion des ouvriers sous contrat de chantier (CDD de chantier).',
            'Pointage journalier par conducteur de travaux sur le chantier d’affectation.',
            'Suivi des qualifications professionnelles (ferrailleurs, coffreurs, grutiers, chefs de corps d’état).'
          ]
        };
      case 'juridique':
        return {
          title: 'Juridique & Foncier',
          icon: Scale,
          description: 'Gestion de la conformité foncière, des permis de construire et des contentieux.',
          targetTable: 'juridique_dossiers',
          color: 'emerald',
          algerianRules: [
            'Actes notariés et publication à la Conservation Foncière (Loi 90-25 et Code Civil algérien).',
            'Suivi de l’Arrêté de Permis de Construire (APC / Direction de l’Urbanisme).',
            'Contrats de sous-traitance et conformité des garanties décennales obligatoires.'
          ]
        };
      case 'comptabilite':
        return {
          title: 'Comptabilité et Fiscalité',
          icon: ReceiptText,
          description: 'Comptabilité analytique par chantier, situations de travaux et fiscalité algérienne.',
          targetTable: 'comptabilite_budgets',
          color: 'amber',
          algerianRules: [
            'Ventilation analytique des dépenses par chantier (Centre de profit indépendant).',
            'Facturation des situations de travaux et retenues de garantie (5% à 10%).',
            'Gestion fiscale en Dinar Algérien : TVA (19%), TAP, acomptes IBS et droit de timbre.'
          ]
        };
      case 'technique':
        return {
          title: 'Direction Technique & Bureau d’Études',
          icon: Layers,
          description: 'Lots techniques, suivi d’avancement des travaux et visas CTC.',
          targetTable: 'technique_lots',
          color: 'purple',
          algerianRules: [
            'Approbation obligatoire des plans par l’Organisme National de Contrôle Technique (CTC).',
            'Découpage par corps d’état : Gros-œuvre, Étanchéité, Fluides, Électricité, Finitions.',
            'Procès-Verbaux de réception technique contradictoires sur le terrain.'
          ]
        };
      case 'materiel':
        return {
          title: 'Parc Matériel & Engins',
          icon: Truck,
          description: 'Affectation des grues, engins de terrassement et outillage lourd entre chantiers.',
          targetTable: 'materiel_engins',
          color: 'indigo',
          algerianRules: [
            'Suivi des transferts d’engins entre chantiers (Bons de transfert inter-sites).',
            'Visites réglementaires et carnet de maintenance périodique des appareils de levage.',
            'Consommation de carburant et taux d’utilisation par chantier rattaché.'
          ]
        };
      case 'commercial':
        return {
          title: 'Direction Commerciale & VEFA',
          icon: Building2,
          description: 'Programmes de vente sur plans (Loi 11-04 régissant la promotion immobilière en Algérie).',
          targetTable: 'commercial_programmes_lots',
          color: 'rose',
          algerianRules: [
            'Contrats de réservation et Vente sur Plans (VEFA) conformément à la loi 11-04.',
            'Échéanciers de paiement indexés sur l’avancement certifié par l’organisme CTC.',
            'Gestion des versements acquéreurs domiciliés auprès du Fonds de Garantie (FGCMPI).'
          ]
        };
      case 'approvisionnements':
        return {
          title: 'Approvisionnements & Achats',
          icon: ShoppingCart,
          description: 'Centralisation des expressions de besoins des chantiers et commandes de matériaux.',
          targetTable: 'approvisionnement_demandes_achat',
          color: 'cyan',
          algerianRules: [
            'Circuit de validation : Demande d’Achat (DA) du conducteur → Visa Achats Siège → Bon de commande.',
            'Approvisionnement stratégique en Algérie : Ciment (GICA / Lafarge), Acier rond à béton, Agrégats.',
            'Contrôle quantitatif et qualitatif à la réception sur le site du chantier (Bon de réception).'
          ]
        };
      case 'parametres':
      default:
        return {
          title: 'Paramètres du Système',
          icon: Settings2,
          description: 'Configurations générales, nomenclature des wilayas, devises et gestion du SGBD.',
          targetTable: 'entreprises',
          color: 'slate',
          algerianRules: [
            'Nomenclature officielle des 58 Wilayas d’Algérie.',
            'Devise monétaire par défaut : Dinar Algérien (DZD).',
            'Gestion des sauvegardes et synchronisation avec Cloud SQL / PostgreSQL.'
          ]
        };
    }
  };

  const config = getModuleConfig();
  const Icon = config.icon;
  const relatedTable = DATABASE_SCHEMA_TABLES.find(t => t.tableName === config.targetTable);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-1">
            <Icon className="w-4 h-4" />
            <span>Fondations Techniques & Architecture Validée</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Module : {config.title}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {config.description} Le schéma relationnel, les contraintes de clés étrangères vers <code className="font-mono text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">chantiers</code> et les permissions RBAC sont déjà implémentés.
          </p>
        </div>

        <button
          onClick={() => setActiveNav('schema')}
          className="flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs shrink-0 self-start md:self-auto"
        >
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Explorer le Schéma BDD</span>
        </button>
      </div>

      {/* Scope info */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <HardHat className="w-4 h-4 text-emerald-600" />
          <span>
            Périmètre d'application actuel : <strong>{selectedChantierId === 'ALL' ? 'Tous les chantiers (Consolidé Siège)' : currentChantier?.nom_projet}</strong>
          </span>
        </div>
        <span className="text-emerald-700 font-semibold bg-emerald-100/60 px-2 py-0.5 rounded text-[11px]">
          Prêt pour branchement applicatif
        </span>
      </div>

      {/* Grid: Database Foundation & Domain Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Relational Schema Table Card (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Table Relationnelle Associée : <span className="font-mono text-emerald-700">{config.targetTable}</span>
              </h3>
            </div>
            <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
              Clé étrangère : chantier_id
            </span>
          </div>

          <p className="text-xs text-slate-600">
            {relatedTable?.description}
          </p>

          {/* Columns list */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                <tr>
                  <th className="py-2 px-3">Colonne</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Contrainte</th>
                  <th className="py-2 px-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {relatedTable?.columns.map((c) => (
                  <tr key={c.name} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 font-semibold text-slate-900">{c.name}</td>
                    <td className="py-2 px-3 text-slate-600">{c.type}</td>
                    <td className="py-2 px-3 text-[10px]">
                      {c.isPrimaryKey ? (
                        <span className="text-amber-700 bg-amber-50 px-1 py-0.5 rounded">PK</span>
                      ) : c.isForeignKey ? (
                        <span className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-sans">
                          FK → {c.referencesTable}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-sans">{c.nullable ? 'NULL' : 'NOT NULL'}</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-600 font-sans text-[11px]">{c.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Algerian Promotion Immobilière Domain Rules (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Shield className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              Cadre Réglementaire & Spécificités Algérie
            </h3>
          </div>

          <div className="space-y-3">
            {config.algerianRules.map((rule, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  0{idx + 1}
                </span>
                <span className="text-slate-700 leading-relaxed">{rule}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-950">
            <span className="font-semibold block mb-1">Architecture prête pour l'étape suivante :</span>
            Ce module dispose déjà de son modèle relationnel normalisé et s'intègrera directement avec le sélecteur multi-chantiers et le journal d'audit.
          </div>
        </div>
      </div>
    </div>
  );
};
