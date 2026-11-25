'use client';

import React, { useState } from 'react';
import {
  FolderOpen,
  FileText,
  Upload,
  Download,
  Search,
  CheckCircle,
  FileCheck,
  Building,
  HardHat,
  X,
  FileBadge
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DocumentGED, ModuleCode } from '../types/database';

export const DocumentsView: React.FC = () => {
  const {
    documents,
    addDocument,
    chantiers,
    selectedChantierId
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // New Document state
  const [newDoc, setNewDoc] = useState({
    titre: '',
    reference_officielle: '',
    chantier_id: (selectedChantierId !== 'ALL' ? selectedChantierId : 'cht-001'),
    module: 'TECHNIQUE' as ModuleCode,
    categorie: 'PLAN_TECHNIQUE' as DocumentGED['categorie'],
    nom_fichier: '',
    extension: 'PDF',
    taille_ko: 2450,
    mime_type: 'application/pdf',
    version: 'v1.0',
    est_valide_juridiquement: true
  });

  const categories = [
    { id: 'ALL', label: 'Toutes les pièces' },
    { id: 'PERMIS_ET_JURIDIQUE', label: 'Permis & Actes Juridiques' },
    { id: 'PLAN_TECHNIQUE', label: 'Plans & Architecture' },
    { id: 'RAPPORT_CTC', label: 'Rapports & PV CTC' },
    { id: 'CONTRAT_SOUS_TRAITANT', label: 'Contrats Sous-traitants' },
    { id: 'FACTURE_ET_SITUATION', label: 'Situations de Travaux' }
  ];

  const filteredDocs = documents.filter(d => {
    const matchesSearch = d.titre.toLowerCase().includes(search.toLowerCase()) ||
                          d.nom_fichier.toLowerCase().includes(search.toLowerCase()) ||
                          (d.reference_officielle && d.reference_officielle.toLowerCase().includes(search.toLowerCase()));
    const matchesChantier = selectedChantierId === 'ALL' || d.chantier_id === selectedChantierId;
    const matchesCat = selectedCategory === 'ALL' || d.categorie === selectedCategory;
    return matchesSearch && matchesChantier && matchesCat;
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.titre) return;

    addDocument({
      ...newDoc,
      nom_fichier: newDoc.nom_fichier || `${newDoc.titre.toLowerCase().replace(/\s+/g, '_')}.pdf`
    });

    setIsUploadModalOpen(false);
    setNewDoc({
      titre: '',
      reference_officielle: '',
      chantier_id: (selectedChantierId !== 'ALL' ? selectedChantierId : 'cht-001'),
      module: 'TECHNIQUE',
      categorie: 'PLAN_TECHNIQUE',
      nom_fichier: '',
      extension: 'PDF',
      taille_ko: 2450,
      mime_type: 'application/pdf',
      version: 'v1.0',
      est_valide_juridiquement: true
    });
  };

  const formatFileSize = (ko: number) => {
    if (ko >= 1024) {
      return `${(ko / 1024).toFixed(1)} Mo`;
    }
    return `${ko} Ko`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-1">
            <FolderOpen className="w-4 h-4" />
            <span>Gestion Électronique des Documents (GED)</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Référentiel Documentaire & Pièces Justificatives
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Archivage et indexation relationnelle : chaque permis de construire, acte notarié, plan d'exécution approuvé par le CTC ou situation de travaux est rattaché à son chantier respectif.
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs shrink-0 self-start md:self-auto"
        >
          <Upload className="w-4 h-4" />
          <span>Téléverser une pièce</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Rechercher par titre, n° réf..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => {
          return (
            <div
              key={doc.id}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 shadow-xs flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs shrink-0 font-mono">
                    {doc.extension}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {doc.est_valide_juridiquement && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200" title="Pièce officielle visée / paraphée">
                        <FileCheck className="w-3 h-3" />
                        Visé CTC/Notaire
                      </span>
                    )}
                    <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {doc.version}
                    </span>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-sm mb-1 leading-snug">
                  {doc.titre}
                </h3>

                {doc.reference_officielle && (
                  <div className="text-[11px] font-mono text-slate-500 mb-2">
                    Réf : {doc.reference_officielle}
                  </div>
                )}

                <div className="space-y-1 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-medium truncate">
                    {doc.chantier_id ? <HardHat className="w-3 h-3 shrink-0" /> : <Building className="w-3 h-3 shrink-0" />}
                    <span className="truncate">{doc.chantier_nom || 'Siège Central'}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Fichier : <span className="font-mono text-slate-600">{doc.nom_fichier}</span> ({formatFileSize(doc.taille_ko)})
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Ajouté par {doc.uploade_par_nom} le {new Date(doc.created_at).toLocaleDateString('fr-DZ')}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[10px] uppercase font-semibold text-slate-400">
                  {doc.categorie.replace(/_/g, ' ')}
                </span>

                <button
                  onClick={() => alert(`Téléchargement simulé de la pièce "${doc.nom_fichier}" (${formatFileSize(doc.taille_ko)}).`)}
                  className="flex items-center gap-1 text-emerald-700 font-semibold hover:text-emerald-900 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Consulter</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: UPLOAD */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-900 text-base">
                Téléverser une pièce dans la GED
              </h3>
              <button onClick={() => setIsUploadModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Intitulé du document *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: PV de coulage plancher haut R+6"
                  value={newDoc.titre}
                  onChange={(e) => setNewDoc({ ...newDoc, titre: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Référence officielle (facultatif)
                </label>
                <input
                  type="text"
                  placeholder="ex: PV-CTC-2024-045"
                  value={newDoc.reference_officielle}
                  onChange={(e) => setNewDoc({ ...newDoc, reference_officielle: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Chantier rattaché *
                  </label>
                  <select
                    value={newDoc.chantier_id}
                    onChange={(e) => setNewDoc({ ...newDoc, chantier_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    {chantiers.map(c => (
                      <option key={c.id} value={c.id}>{c.nom_projet}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Catégorie *
                  </label>
                  <select
                    value={newDoc.categorie}
                    onChange={(e) => setNewDoc({ ...newDoc, categorie: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    <option value="PLAN_TECHNIQUE">Plan Technique & Architecture</option>
                    <option value="PERMIS_ET_JURIDIQUE">Permis & Juridique</option>
                    <option value="RAPPORT_CTC">Rapport CTC</option>
                    <option value="CONTRAT_SOUS_TRAITANT">Contrat Sous-traitant</option>
                    <option value="FACTURE_ET_SITUATION">Facture & Situation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Nom du fichier simulé
                  </label>
                  <input
                    type="text"
                    placeholder="plan_technique.pdf"
                    value={newDoc.nom_fichier}
                    onChange={(e) => setNewDoc({ ...newDoc, nom_fichier: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Version
                  </label>
                  <input
                    type="text"
                    value={newDoc.version}
                    onChange={(e) => setNewDoc({ ...newDoc, version: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Indexation et enregistrement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
