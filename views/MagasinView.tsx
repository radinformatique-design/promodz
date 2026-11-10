'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Store,
  Package,
  Truck,
  FileText,
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRightLeft,
  ClipboardList,
  Download,
  Printer,
  ShieldCheck,
  Building2,
  Lock,
  Check,
  X,
  Layers,
  Sparkles
} from 'lucide-react';
import { ArticleStock, BonSortie } from '../types/database';

export const MagasinView: React.FC = () => {
  const {
    currentUser,
    chantiers,
    selectedChantierId,
    articlesStock,
    mouvementsStock,
    bonsSortie,
    transfertsInterChantier,
    inventairesMagasin,
    fournisseurs,
    receptionsChantier,
    creerBonSortie,
    validerBonSortieConducteur,
    confirmerBonSortieMagasinier,
    creerTransfertInterChantier,
    enregistrerInventaire,
    ajouterArticleStock
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'stocks' | 'sorties' | 'mouvements' | 'transferts' | 'inventaires' | 'receptions'
  >('stocks');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterFamille, setFilterFamille] = useState<string>('ALL');

  // Modales
  const [showCreateBsModal, setShowCreateBsModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showAddArticleModal, setShowAddArticleModal] = useState(false);
  const [showRefuseBsModal, setShowRefuseBsModal] = useState(false);

  const [selectedBs, setSelectedBs] = useState<BonSortie | null>(null);
  const [refusMotif, setRefusMotif] = useState('');

  // Formulaires
  const [newBsForm, setNewBsForm] = useState({
    chantier_id: chantiers[0]?.id || '',
    article_id: '',
    quantite: 1,
    destination: '',
    beneficiaire: '',
    motif: ''
  });

  const [newTransferForm, setNewTransferForm] = useState({
    chantier_source_id: chantiers[0]?.id || '',
    chantier_cible_id: chantiers[1]?.id || chantiers[0]?.id || '',
    article_id: '',
    quantite: 1,
    motif: ''
  });

  const [newArticleForm, setNewArticleForm] = useState({
    chantier_id: chantiers[0]?.id || '',
    code_article: '',
    designation: '',
    famille: 'MATERIAUX_GROS_OEUVRE' as ArticleStock['famille'],
    unite_mesure: 'Tonne' as ArticleStock['unite_mesure'],
    quantite_stock: 0,
    seuil_alerte_minimum: 5,
    prix_unitaire_moyen_dzd: 1000,
    emplacement_magasin: 'Zone A - Alvéole 1'
  });

  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Rôles
  const isMagasinier = currentUser?.role_id === 'role-magasinier';
  const isConducteur = currentUser?.role_id === 'role-ct' || currentUser?.role_id === 'role-metreur';
  const isAdmin = currentUser?.role_id === 'role-admin';

  // Chantiers autorisés
  const filteredChantierIds = useMemo(() => {
    if (selectedChantierId !== 'ALL') return [selectedChantierId];
    if (currentUser?.type === 'CHANTIER') return currentUser.chantiers_assignes;
    return chantiers.map(c => c.id);
  }, [selectedChantierId, currentUser, chantiers]);

  // Articles filtrés (100% indépendants par chantier)
  const filteredArticles = useMemo(() => {
    return articlesStock.filter(art => {
      if (!filteredChantierIds.includes(art.chantier_id)) return false;
      if (filterFamille !== 'ALL' && art.famille !== filterFamille) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return art.designation.toLowerCase().includes(term) || art.code_article.toLowerCase().includes(term);
      }
      return true;
    });
  }, [articlesStock, filteredChantierIds, filterFamille, searchTerm]);

  // Alertes stock minimum
  const lowStockArticles = useMemo(() => {
    return articlesStock.filter(art => filteredChantierIds.includes(art.chantier_id) && art.quantite_stock <= art.seuil_alerte_minimum);
  }, [articlesStock, filteredChantierIds]);

  // Bons de sortie filtrés
  const filteredBonsSortie = useMemo(() => {
    return bonsSortie.filter(bs => filteredChantierIds.includes(bs.chantier_id));
  }, [bonsSortie, filteredChantierIds]);

  // Mouvements filtrés
  const filteredMouvements = useMemo(() => {
    return mouvementsStock.filter(m => filteredChantierIds.includes(m.chantier_id));
  }, [mouvementsStock, filteredChantierIds]);

  // Handlers
  const handleCreateBs = (e: React.FormEvent) => {
    e.preventDefault();
    setActionFeedback(null);
    const res = creerBonSortie(newBsForm);
    if (res.success) {
      setActionFeedback({ type: 'success', message: res.message });
      setShowCreateBsModal(false);
      setNewBsForm({
        chantier_id: chantiers[0]?.id || '',
        article_id: '',
        quantite: 1,
        destination: '',
        beneficiaire: '',
        motif: ''
      });
    } else {
      setActionFeedback({ type: 'error', message: res.message });
    }
  };

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setActionFeedback(null);
    if (newTransferForm.chantier_source_id === newTransferForm.chantier_cible_id) {
      setActionFeedback({ type: 'error', message: 'Le chantier source et le chantier cible doivent être différents.' });
      return;
    }
    const res = creerTransfertInterChantier(newTransferForm);
    if (res.success) {
      setActionFeedback({ type: 'success', message: res.message });
      setShowTransferModal(false);
    } else {
      setActionFeedback({ type: 'error', message: res.message });
    }
  };

  const handleAddArticle = (e: React.FormEvent) => {
    e.preventDefault();
    const chantier = chantiers.find(c => c.id === newArticleForm.chantier_id);
    if (!chantier) return;

    ajouterArticleStock({
      ...newArticleForm,
      entreprise_id: 'ent-001',
      chantier_nom: chantier.nom_projet
    });
    setShowAddArticleModal(false);
    setActionFeedback({ type: 'success', message: 'Article créé dans le magasin du chantier avec succès.' });
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Code,Désignation,Chantier,Famille,Unité,Stock,Seuil Alerte,Prix PMP (DZD)']
        .concat(
          filteredArticles.map(a =>
            `"${a.code_article}","${a.designation}","${a.chantier_nom}","${a.famille}","${a.unite_mesure}",${a.quantite_stock},${a.seuil_alerte_minimum},${a.prix_unitaire_moyen_dzd}`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `etat_stock_batiprom_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setActionFeedback({ type: 'success', message: 'État des stocks exporté en format CSV/Excel avec succès.' });
  };

  return (
    <div className="space-y-6">
      {/* 1. BANNIÈRE RÈGLE D'OR : MAGASINS INDÉPENDANTS PAR CHANTIER */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
              <Store className="w-3.5 h-3.5 text-emerald-400" />
              GESTION DÉCENTRALISÉE DES MAGASINS CHANTIERS
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Magasin & Gestion des Stocks Chantiers
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Chaque chantier possède son propre magasin totalement indépendant. <strong className="text-emerald-300 font-semibold">Il n’existe aucun magasin central.</strong> Le magasinier supervise les réceptions, entrées, inventaires et sorties sous double validation obligatoire du Conducteur de Travaux.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowCreateBsModal(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Nouveau Bon de Sortie (BS)
            </button>

            <button
              onClick={() => setShowTransferModal(true)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm backdrop-blur border border-white/20 flex items-center gap-2 transition"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Transfert Inter-Chantier
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportExcel}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium backdrop-blur border border-white/20 flex items-center gap-1.5"
                title="Exporter Excel"
              >
                <Download className="w-4 h-4" /> Excel
              </button>
              <button
                onClick={handleExportPDF}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium backdrop-blur border border-white/20 flex items-center gap-1.5"
                title="Imprimer / PDF"
              >
                <Printer className="w-4 h-4" /> PDF
              </button>
            </div>
          </div>
        </div>

        {/* Indicateurs rapides d'alerte stock */}
        {lowStockArticles.length > 0 && (
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-3 text-xs bg-amber-500/10 p-3 rounded-xl border border-amber-400/20 text-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 animate-bounce" />
            <span>
              <strong>Alerte Stock Minimum :</strong> {lowStockArticles.length} article(s) ont atteint ou dépassé leur seuil d'alerte critique dans les magasins de chantiers. Réapprovisionnement requis.
            </span>
          </div>
        )}
      </div>

      {/* Feedback */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between shadow-sm border ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-3 text-sm font-medium">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-slate-400 hover:text-slate-700 font-semibold">✕</button>
        </div>
      )}

      {/* Onglets */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'stocks', label: `État des Stocks (${filteredArticles.length})`, icon: Package },
            { id: 'sorties', label: `Bons de Sortie (${filteredBonsSortie.length})`, icon: FileText },
            { id: 'mouvements', label: `Mouvements (${filteredMouvements.length})`, icon: Layers },
            { id: 'transferts', label: `Transferts Chantiers (${transfertsInterChantier.length})`, icon: ArrowRightLeft },
            { id: 'inventaires', label: `Inventaires (${inventairesMagasin.length})`, icon: ClipboardList },
            { id: 'receptions', label: `Bons de Réception (${receptionsChantier.length})`, icon: Truck }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Rechercher article, code..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-52"
            />
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* ONGLET 1 : ÉTAT DES STOCKS PAR MAGASIN     */}
      {/* ========================================== */}
      {activeTab === 'stocks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 uppercase">Filtrer par famille :</span>
              <select
                value={filterFamille}
                onChange={e => setFilterFamille(e.target.value)}
                className="text-xs rounded-lg border-slate-300 bg-white py-1.5 px-3 focus:ring-emerald-500"
              >
                <option value="ALL">Toutes les familles</option>
                <option value="ACIER_ARMATURES">Acier & Armatures</option>
                <option value="CIMENT_BETON">Ciment & Béton</option>
                <option value="MATERIAUX_GROS_OEUVRE">Matériaux Gros Œuvre</option>
                <option value="OUTILLAGE_EPI">Outillage & EPI</option>
              </select>
            </div>

            {(isMagasinier || isAdmin) && (
              <button
                onClick={() => setShowAddArticleModal(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-2"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> Ajouter un Article au Magasin
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Code Article</th>
                  <th className="py-3 px-4">Désignation</th>
                  <th className="py-3 px-4">Chantier (Magasin)</th>
                  <th className="py-3 px-4">Famille</th>
                  <th className="py-3 px-4">Emplacement</th>
                  <th className="py-3 px-4">Quantité en Stock</th>
                  <th className="py-3 px-4">Seuil Alerte</th>
                  <th className="py-3 px-4">PMP (DZD)</th>
                  <th className="py-3 px-4 text-right">Statut Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredArticles.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Aucun article en stock dans ce magasin.
                    </td>
                  </tr>
                ) : (
                  filteredArticles.map(art => {
                    const isLow = art.quantite_stock <= art.seuil_alerte_minimum;
                    return (
                      <tr key={art.id} className={isLow ? 'bg-amber-50/50 hover:bg-amber-50' : 'hover:bg-slate-50/70'}>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{art.code_article}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{art.designation}</td>
                        <td className="py-3 px-4 font-medium text-emerald-800">{art.chantier_nom}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                            {art.famille.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{art.emplacement_magasin}</td>
                        <td className="py-3 px-4 font-bold text-slate-900 text-sm font-mono">
                          {art.quantite_stock} <span className="text-xs font-normal text-slate-500">{art.unite_mesure}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono">
                          {art.seuil_alerte_minimum} {art.unite_mesure}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                          {art.prix_unitaire_moyen_dzd.toLocaleString('fr-DZ')} DZD
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isLow ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-600" /> Stock Critique
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Stock Normal
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* ONGLET 2 : BONS DE SORTIE (BS)             */}
      {/* ========================================== */}
      {activeTab === 'sorties' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Gestion des Bons de Sortie (BS)</h3>
              <p className="text-xs text-slate-500">
                Toute sortie nécessite une double validation : le Conducteur de Travaux valide, puis le Magasinier confirme pour décrémenter le stock.
              </p>
            </div>
            <button
              onClick={() => setShowCreateBsModal(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Émettre un Bon de Sortie
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">N° BS</th>
                  <th className="py-3 px-4">Chantier</th>
                  <th className="py-3 px-4">Article & Quantité</th>
                  <th className="py-3 px-4">Destination / Motif</th>
                  <th className="py-3 px-4">Bénéficiaire</th>
                  <th className="py-3 px-4">Validation Conducteur (CT)</th>
                  <th className="py-3 px-4">Confirmation Magasinier</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBonsSortie.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Aucun bon de sortie enregistré.
                    </td>
                  </tr>
                ) : (
                  filteredBonsSortie.map(bs => (
                    <tr key={bs.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{bs.numero_bs}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{bs.chantier_nom}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{bs.designation_article}</div>
                        <div className="text-emerald-700 font-bold">{bs.quantite} {bs.unite_mesure}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{bs.destination}</div>
                        <div className="text-[10px] text-slate-500">{bs.motif}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{bs.beneficiaire}</td>
                      
                      {/* Validation Conducteur Travaux */}
                      <td className="py-3 px-4">
                        {bs.statut_validation_ct === 'VALIDE' ? (
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-max">
                            <Check className="w-3 h-3" /> Validé ({bs.conducteur_validateur_nom})
                          </span>
                        ) : bs.statut_validation_ct === 'REFUSE' ? (
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800 flex items-center gap-1 w-max">
                            <X className="w-3 h-3" /> Refusé
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 flex items-center gap-1 w-max">
                            <Clock className="w-3 h-3" /> En attente CT
                          </span>
                        )}
                      </td>

                      {/* Confirmation Magasinier */}
                      <td className="py-3 px-4">
                        {bs.statut_confirmation_magasinier === 'CONFIRME' ? (
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-teal-100 text-teal-800 flex items-center gap-1 w-max">
                            <Lock className="w-3 h-3" /> Confirmé & Sortie Validée
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600 flex items-center gap-1 w-max">
                            <Clock className="w-3 h-3" /> En attente magasinier
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Conducteur valide */}
                          {bs.statut_validation_ct === 'EN_ATTENTE' && (isConducteur || isAdmin) && (
                            <>
                              <button
                                onClick={() => {
                                  validerBonSortieConducteur(bs.id, 'VALIDE');
                                  setActionFeedback({ type: 'success', message: `Bon de sortie ${bs.numero_bs} validé par le Conducteur de Travaux.` });
                                }}
                                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                              >
                                Valider
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedBs(bs);
                                  setShowRefuseBsModal(true);
                                }}
                                className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                              >
                                Refuser
                              </button>
                            </>
                          )}

                          {/* Magasinier confirme (seulement si validé par CT) */}
                          {bs.statut_validation_ct === 'VALIDE' && bs.statut_confirmation_magasinier === 'EN_ATTENTE' && (isMagasinier || isAdmin) && (
                            <button
                              onClick={() => {
                                const res = confirmerBonSortieMagasinier(bs.id);
                                if (res.success) {
                                  setActionFeedback({ type: 'success', message: res.message });
                                } else {
                                  setActionFeedback({ type: 'error', message: res.message });
                                }
                              }}
                              className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Confirmer Sortie Stock
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* ONGLET 3 : MOUVEMENTS DE STOCK             */}
      {/* ========================================== */}
      {activeTab === 'mouvements' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900">Historique Complet des Mouvements de Stock</h3>
            <p className="text-xs text-slate-500">
              Traçabilité immuable de toutes les entrées (achats) et sorties (bons de sortie) par magasin de chantier.
            </p>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type Mouvement</th>
                <th className="py-3 px-4">Chantier (Magasin)</th>
                <th className="py-3 px-4">Article</th>
                <th className="py-3 px-4">Quantité</th>
                <th className="py-3 px-4">Réf. Pièce</th>
                <th className="py-3 px-4">Bénéficiaire / Provenance</th>
                <th className="py-3 px-4">Opérateur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMouvements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Aucun mouvement enregistré.
                  </td>
                </tr>
              ) : (
                filteredMouvements.map(mvt => (
                  <tr key={mvt.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 text-slate-600 font-mono">{mvt.date_mouvement}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        mvt.type_mouvement === 'ENTREE_ACHAT'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {mvt.type_mouvement.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{mvt.chantier_nom}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{mvt.article_designation}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {mvt.type_mouvement === 'ENTREE_ACHAT' ? '+' : '-'}{mvt.quantite} {mvt.unite_mesure}
                    </td>
                    <td className="py-3 px-4 font-mono text-indigo-700 font-semibold">{mvt.reference_piece}</td>
                    <td className="py-3 px-4 text-slate-700">{mvt.beneficiaire_ou_provenance}</td>
                    <td className="py-3 px-4 text-slate-600">{mvt.auteur_nom}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================== */}
      {/* ONGLET 4 : TRANSFERTS INTER-CHANTIERS      */}
      {/* ========================================== */}
      {activeTab === 'transferts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Transferts Autorisés Entre Chantiers</h3>
            <button
              onClick={() => setShowTransferModal(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm"
            >
              <ArrowRightLeft className="w-4 h-4" /> Nouveau Transfert Inter-Chantier
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">N° Transfert</th>
                  <th className="py-3 px-4">Chantier Source</th>
                  <th className="py-3 px-4">Chantier Cible</th>
                  <th className="py-3 px-4">Article Transféré</th>
                  <th className="py-3 px-4">Quantité</th>
                  <th className="py-3 px-4">Motif</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4">Demandeur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transfertsInterChantier.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Aucun transfert inter-chantier enregistré.
                    </td>
                  </tr>
                ) : (
                  transfertsInterChantier.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{t.numero_transfert}</td>
                      <td className="py-3 px-4 font-semibold text-rose-700">{t.chantier_source_nom}</td>
                      <td className="py-3 px-4 font-semibold text-emerald-700">{t.chantier_cible_nom}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{t.article_designation}</td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">{t.quantite} {t.unite_mesure}</td>
                      <td className="py-3 px-4 text-slate-600">{t.motif}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-teal-100 text-teal-800">
                          {t.statut}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{t.demandeur_nom}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* ONGLET 5 : INVENTAIRES MAGASIN             */}
      {/* ========================================== */}
      {activeTab === 'inventaires' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Inventaires Physiques & Rapprochements Magasins</h3>
            <button
              onClick={() => {
                const res = enregistrerInventaire({
                  chantier_id: chantiers[0]?.id || '',
                  lignes: articlesStock.filter(a => a.chantier_id === chantiers[0]?.id).map(a => ({
                    article_id: a.id,
                    stock_physique: a.quantite_stock,
                    observation: 'Inventaire périodique conforme'
                  }))
                });
                setActionFeedback({ type: 'success', message: res.message });
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm"
            >
              <ClipboardList className="w-4 h-4" /> Lancer & Clôturer Inventaire Magasin
            </button>
          </div>

          <div className="space-y-4">
            {inventairesMagasin.map(inv => (
              <div key={inv.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-sm">{inv.numero_inventaire}</span>
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                        {inv.statut.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Chantier : <strong>{inv.chantier_nom}</strong> · Date : {inv.date_inventaire} · Magasinier : {inv.magasinier_nom}
                    </p>
                  </div>
                </div>

                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Code Article</th>
                      <th className="py-2.5 px-3">Désignation</th>
                      <th className="py-2.5 px-3 text-right">Stock Théorique</th>
                      <th className="py-2.5 px-3 text-right">Stock Physique Compté</th>
                      <th className="py-2.5 px-3 text-right">Écart Constaté</th>
                      <th className="py-2.5 px-3">Observations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inv.lignes.map((l, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{l.code_article}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800">{l.designation}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-600">{l.stock_theorique}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{l.stock_physique}</td>
                        <td className={`py-2 px-3 text-right font-mono font-bold ${l.ecart < 0 ? 'text-rose-600' : l.ecart > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                          {l.ecart > 0 ? `+${l.ecart}` : l.ecart}
                        </td>
                        <td className="py-2 px-3 text-slate-500 italic">{l.observation || 'Conforme'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* ONGLET 6 : BONS DE RÉCEPTION (FOURNISSEUR) */}
      {/* ========================================== */}
      {activeTab === 'receptions' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900">Consultation des Bons de Réception & Fournisseurs</h3>
            <p className="text-xs text-slate-500">
              Historique des marchandises livrées directement aux magasins des chantiers par les fournisseurs agréés.
            </p>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Réf. BR Interne</th>
                <th className="py-3 px-4">BL Fournisseur</th>
                <th className="py-3 px-4">Fournisseur</th>
                <th className="py-3 px-4">Chantier Destinataire</th>
                <th className="py-3 px-4">Quantité Reçue & Conforme</th>
                <th className="py-3 px-4">Camion & Chauffeur</th>
                <th className="py-3 px-4">Visa Magasinier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {receptionsChantier.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Aucun bon de réception enregistré.
                  </td>
                </tr>
              ) : (
                receptionsChantier.map(br => (
                  <tr key={br.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{br.numero_br_interne}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{br.numero_bl_fournisseur}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{br.fournisseur_nom}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{br.chantier_nom}</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">
                      {br.quantite_conforme} {br.unite_mesure}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{br.numero_plaque_camion || 'N/A'}</div>
                      <div className="text-[10px] text-slate-400">{br.nom_chauffeur}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-max">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Visé & Archivé
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================== */}
      {/* MODALE 1 : NOUVEAU BON DE SORTIE (BS)      */}
      {/* ========================================== */}
      {showCreateBsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Émettre un Bon de Sortie (BS)</h3>
              </div>
              <button onClick={() => setShowCreateBsModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateBs} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Chantier Source (Magasin) *</label>
                <select
                  value={newBsForm.chantier_id}
                  onChange={e => setNewBsForm({ ...newBsForm, chantier_id: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 bg-white"
                >
                  {chantiers.map(c => (
                    <option key={c.id} value={c.id}>{c.nom_projet}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Article en Stock *</label>
                <select
                  value={newBsForm.article_id}
                  onChange={e => setNewBsForm({ ...newBsForm, article_id: e.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 bg-white font-semibold"
                >
                  <option value="">Sélectionner un article...</option>
                  {articlesStock
                    .filter(a => a.chantier_id === newBsForm.chantier_id)
                    .map(a => (
                      <option key={a.id} value={a.id}>
                        {a.designation} (Stock dispo : {a.quantite_stock} {a.unite_mesure})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Quantité Demandée *</label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  required
                  value={newBsForm.quantite}
                  onChange={e => setNewBsForm({ ...newBsForm, quantite: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-300 p-2.5"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Destination sur le Chantier *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Coulage dalle R+2 Bloc B"
                  value={newBsForm.destination}
                  onChange={e => setNewBsForm({ ...newBsForm, destination: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bénéficiaire / Équipe *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Brigade Maçonnerie A (Chef Amar)"
                  value={newBsForm.beneficiaire}
                  onChange={e => setNewBsForm({ ...newBsForm, beneficiaire: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Motif de la Sortie *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Justification technique..."
                  value={newBsForm.motif}
                  onChange={e => setNewBsForm({ ...newBsForm, motif: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                <strong>Sécurité :</strong> Nécessite la validation obligatoire du Conducteur de Travaux et la confirmation finale du Magasinier.
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateBsModal(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Émettre Bon de Sortie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODALE 2 : TRANSFERT INTER-CHANTIER        */}
      {/* ========================================== */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Transfert Inter-Chantier Autorisé</h3>
              </div>
              <button onClick={() => setShowTransferModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateTransfer} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chantier Source (Départ) *</label>
                  <select
                    value={newTransferForm.chantier_source_id}
                    onChange={e => setNewTransferForm({ ...newTransferForm, chantier_source_id: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 bg-white font-semibold text-rose-700"
                  >
                    {chantiers.map(c => (
                      <option key={c.id} value={c.id}>{c.nom_projet}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chantier Cible (Arrivée) *</label>
                  <select
                    value={newTransferForm.chantier_cible_id}
                    onChange={e => setNewTransferForm({ ...newTransferForm, chantier_cible_id: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 bg-white font-semibold text-emerald-700"
                  >
                    {chantiers.map(c => (
                      <option key={c.id} value={c.id}>{c.nom_projet}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Article en Stock (Source) *</label>
                <select
                  value={newTransferForm.article_id}
                  onChange={e => setNewTransferForm({ ...newTransferForm, article_id: e.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 bg-white font-semibold"
                >
                  <option value="">Sélectionner un article...</option>
                  {articlesStock
                    .filter(a => a.chantier_id === newTransferForm.chantier_source_id)
                    .map(a => (
                      <option key={a.id} value={a.id}>
                        {a.designation} (Dispo : {a.quantite_stock} {a.unite_mesure})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Quantité à Transférer *</label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  required
                  value={newTransferForm.quantite}
                  onChange={e => setNewTransferForm({ ...newTransferForm, quantite: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-300 p-2.5"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Motif du Transfert *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Justification logistique..."
                  value={newTransferForm.motif}
                  onChange={e => setNewTransferForm({ ...newTransferForm, motif: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Exécuter le Transfert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODALE 3 : AJOUTER ARTICLE EN STOCK        */}
      {/* ========================================== */}
      {showAddArticleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Ajouter un Article au Magasin du Chantier</h3>
              </div>
              <button onClick={() => setShowAddArticleModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAddArticle} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Chantier (Magasin) *</label>
                <select
                  value={newArticleForm.chantier_id}
                  onChange={e => setNewArticleForm({ ...newArticleForm, chantier_id: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 bg-white font-semibold"
                >
                  {chantiers.map(c => (
                    <option key={c.id} value={c.id}>{c.nom_projet}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Code Article *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: MAT-ACIER-14"
                    value={newArticleForm.code_article}
                    onChange={e => setNewArticleForm({ ...newArticleForm, code_article: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Famille *</label>
                  <select
                    value={newArticleForm.famille}
                    onChange={e => setNewArticleForm({ ...newArticleForm, famille: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-300 p-2.5"
                  >
                    <option value="ACIER_ARMATURES">Acier & Armatures</option>
                    <option value="CIMENT_BETON">Ciment & Béton</option>
                    <option value="MATERIAUX_GROS_OEUVRE">Matériaux Gros Œuvre</option>
                    <option value="OUTILLAGE_EPI">Outillage & EPI</option>
                    <option value="ELECTRICITE_PLOMBERIE">Électricité & Plomberie</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Désignation *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Acier FeE500 Diam 14mm"
                  value={newArticleForm.designation}
                  onChange={e => setNewArticleForm({ ...newArticleForm, designation: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quantité Initiale *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={newArticleForm.quantite_stock}
                    onChange={e => setNewArticleForm({ ...newArticleForm, quantite_stock: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unité *</label>
                  <select
                    value={newArticleForm.unite_mesure}
                    onChange={e => setNewArticleForm({ ...newArticleForm, unite_mesure: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-300 p-2.5"
                  >
                    <option value="Tonne">Tonne</option>
                    <option value="Sac (50kg)">Sac (50kg)</option>
                    <option value="m³">m³</option>
                    <option value="m²">m²</option>
                    <option value="ML">ML</option>
                    <option value="Unité">Unité</option>
                    <option value="Litre">Litre</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Seuil Alerte *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newArticleForm.seuil_alerte_minimum}
                    onChange={e => setNewArticleForm({ ...newArticleForm, seuil_alerte_minimum: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prix Unitaire PMP (DZD) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newArticleForm.prix_unitaire_moyen_dzd}
                    onChange={e => setNewArticleForm({ ...newArticleForm, prix_unitaire_moyen_dzd: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Emplacement Magasin *</label>
                  <input
                    type="text"
                    required
                    value={newArticleForm.emplacement_magasin}
                    onChange={e => setNewArticleForm({ ...newArticleForm, emplacement_magasin: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddArticleModal(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Créer l'Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
