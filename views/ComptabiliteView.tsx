'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ReceiptText, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Plus, 
  Search, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  CreditCard, 
  Calculator,
  ArrowRight,
  Filter,
  Download,
  Calendar,
  ShieldCheck,
  Building,
  PieChart,
  Clock,
  Printer,
  RefreshCw,
  Eye,
  Info,
  Check,
  X,
  FileCheck,
  Lock,
  LockOpen,
  BookOpen,
  ShieldAlert
} from 'lucide-react';
import { 
  TransactionFinanciere, 
  FactureClient, 
  FactureFournisseur, 
  DeclarationFiscale,
  DemandeAchat,
  CompteBancaire,
  ClotureComptableMensuelle,
  EcritureComptable
} from '../types/database';

type ComptaTab = 'dashboard' | 'transactions' | 'factures_clients' | 'factures_fournisseurs' | 'da' | 'banque' | 'fiscalite' | 'balance_agee' | 'cloture_journaux';

export const ComptabiliteView: React.FC = () => {
  const { 
    selectedChantierId, 
    currentChantier,
    chantiers,
    comptesBancaires,
    transactions,
    facturesClients,
    facturesFournisseurs,
    declarationsFiscales,
    demandesAchat,
    cloturesComptables,
    isPeriodeCloturee,
    executerClotureMensuelle,
    deverrouillerPeriodeComptable,
    currentUser,
    validerDemandeAchatComptabilite,
    enregistrerTransaction,
    payerFactureFournisseur,
    payerFactureClient,
    creerFactureClient,
    soumettreDeclarationFiscale,
    addCompteBancaire
  } = useApp();

  const [activeTab, setActiveTab] = useState<ComptaTab>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');

  // Closure tab states
  const [selectedClosureYear, setSelectedClosureYear] = useState<number>(2026);
  const [selectedClosureMonth, setSelectedClosureMonth] = useState<number>(10);
  const [selectedJournalFilter, setSelectedJournalFilter] = useState<'ALL' | 'J-TRESO' | 'J-VENTES' | 'J-ACHATS' | 'J-OD'>('ALL');
  const [showExecuteClosureModal, setShowExecuteClosureModal] = useState<boolean>(false);
  const [closureObservation, setClosureObservation] = useState<string>('');

  // Modals visibility states
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showFactureClientModal, setShowFactureClientModal] = useState(false);
  const [showFactureFournisseurModal, setShowFactureFournisseurModal] = useState(false);
  const [showG50Modal, setShowG50Modal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState<{ type: 'CLIENT' | 'FOURNISSEUR'; id: string; num: string; montant: number } | null>(null);

  // Form states for modals
  const [newTrData, setNewTrData] = useState({
    type: 'RECETTE' as 'RECETTE' | 'DEPENSE',
    categorie: 'VENTE_VEFA' as TransactionFinanciere['categorie'],
    libelle: '',
    montant_dzd: '',
    chantier_id: selectedChantierId === 'ALL' ? (chantiers[0]?.id || '') : selectedChantierId,
    compte_bancaire_id: comptesBancaires[0]?.id || '',
    mode_paiement: 'VIREMENT_BANCAIRE' as TransactionFinanciere['mode_paiement'],
    reference_paiement: ''
  });

  const [newClientFac, setNewClientFac] = useState({
    numero_facture: `FAC-VEFA-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    client_nom: '',
    client_nif: '',
    chantier_id: selectedChantierId === 'ALL' ? (chantiers[0]?.id || '') : selectedChantierId,
    lot_vendu_id: 'Appartement F4 Bloc A N°',
    date_facture: new Date().toISOString().split('T')[0],
    date_echeance: new Date(Date.now() + 30*86400000).toISOString().split('T')[0],
    montant_ht_dzd: '',
    montant_tva_dzd: '',
    tranche_vefa: 'Tranche 1 - Réservation (20%)'
  });

  const [newG50Data, setNewG50Data] = useState({
    periode_mois: new Date().getMonth() + 1,
    periode_annee: new Date().getFullYear(),
    tva_collectee: '',
    tva_deductible: '',
    irg_salaires: '',
    acompte_ibs: '',
    reliquat_tap: '0'
  });

  const [paymentFormData, setPaymentFormData] = useState({
    compte_bancaire_id: comptesBancaires[0]?.id || '',
    reference: `VIR-${Math.floor(10000 + Math.random() * 90000)}`
  });

  const [newBankData, setNewBankData] = useState({
    nom_banque: 'Banque Nationale d’Algérie (BNA)',
    code_banque: '001',
    agence: 'Agence Amirouche Alger',
    titulaire: 'BatiProm Immobilier SPA',
    rib: '001 00601 0200012345 99',
    devise: 'DZD' as 'DZD' | 'EUR',
    type_compte: 'COURANT' as 'COURANT' | 'SEQUESTRE_VEFA' | 'EPARGNE' | 'DEVISES',
    chantier_dedie_id: ''
  });

  // Visas DA comments state
  const [daComments, setDaComments] = useState<Record<string, string>>({});

  // Filters
  const filteredTransactions = useMemo(() => 
    transactions.filter(t => {
      const matchChantier = selectedChantierId === 'ALL' || t.chantier_id === selectedChantierId;
      const matchSearch = searchTerm === '' || 
        t.libelle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.categorie.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.reference_paiement && t.reference_paiement.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchChantier && matchSearch;
    }),
  [transactions, selectedChantierId, searchTerm]);

  const filteredFacturesClients = useMemo(() => 
    facturesClients.filter(f => {
      const matchChantier = selectedChantierId === 'ALL' || f.chantier_id === selectedChantierId;
      const matchSearch = searchTerm === '' || 
        f.client_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.numero_facture.toLowerCase().includes(searchTerm.toLowerCase());
      return matchChantier && matchSearch;
    }),
  [facturesClients, selectedChantierId, searchTerm]);

  const filteredFacturesFournisseurs = useMemo(() => 
    facturesFournisseurs.filter(f => {
      const matchChantier = selectedChantierId === 'ALL' || f.chantier_id === selectedChantierId;
      const matchSearch = searchTerm === '' || 
        f.fournisseur_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.numero_facture.toLowerCase().includes(searchTerm.toLowerCase());
      return matchChantier && matchSearch;
    }),
  [facturesFournisseurs, selectedChantierId, searchTerm]);

  const pendingDA = useMemo(() => 
    demandesAchat.filter(d => d.statut === 'EN_ATTENTE_COMPTABILITE' && (selectedChantierId === 'ALL' || d.chantier_id === selectedChantierId)),
  [demandesAchat, selectedChantierId]);

  // Écritures du Grand Livre (Période sélectionnée)
  const filteredEcritures = useMemo(() => {
    const periodeKey = `${selectedClosureYear}-${String(selectedClosureMonth).padStart(2, '0')}`;
    const cloture = cloturesComptables.find(c => c.periode_cle === periodeKey);
    let list: EcritureComptable[] = [];

    if (cloture && cloture.ecritures && cloture.ecritures.length > 0) {
      list = cloture.ecritures;
    } else {
      // Écritures prévisionnelles en brouillon pour la période non encore clôturée
      facturesClients
        .filter(f => f.date_facture.startsWith(periodeKey))
        .forEach(f => {
          list.push({
            id: `draft-v-${f.id}-1`,
            piece_ref: f.numero_facture,
            date: f.date_facture,
            journal_code: 'J-VENTES',
            journal_libelle: 'Journal Ventes VEFA',
            compte_num: '411000',
            compte_libelle: 'Clients - Appels de fonds VEFA',
            libelle: `Appel de fond VEFA - ${f.client_nom}`,
            debit_dzd: f.montant_ttc_dzd,
            credit_dzd: 0,
            chantier_id: f.chantier_id,
            chantier_nom: f.chantier_nom
          });
          list.push({
            id: `draft-v-${f.id}-2`,
            piece_ref: f.numero_facture,
            date: f.date_facture,
            journal_code: 'J-VENTES',
            journal_libelle: 'Journal Ventes VEFA',
            compte_num: '701000',
            compte_libelle: 'Ventes d’immeubles bâtis (VEFA HT)',
            libelle: `Chiffre d’affaires VEFA HT`,
            debit_dzd: 0,
            credit_dzd: f.montant_ht_dzd,
            chantier_id: f.chantier_id,
            chantier_nom: f.chantier_nom
          });
          if (f.montant_tva_dzd > 0) {
            list.push({
              id: `draft-v-${f.id}-3`,
              piece_ref: f.numero_facture,
              date: f.date_facture,
              journal_code: 'J-VENTES',
              journal_libelle: 'Journal Ventes VEFA',
              compte_num: '445700',
              compte_libelle: 'TVA Collectée 19%',
              libelle: `TVA collectée sur VEFA`,
              debit_dzd: 0,
              credit_dzd: f.montant_tva_dzd,
              chantier_id: f.chantier_id,
              chantier_nom: f.chantier_nom
            });
          }
        });

      facturesFournisseurs
        .filter(f => f.date_facture.startsWith(periodeKey))
        .forEach(f => {
          const ret = Math.round(f.montant_ht_dzd * 0.05);
          const net = f.montant_ttc_dzd - ret;

          list.push({
            id: `draft-a-${f.id}-1`,
            piece_ref: f.numero_facture,
            date: f.date_facture,
            journal_code: 'J-ACHATS',
            journal_libelle: 'Journal Achats & Sous-traitance',
            compte_num: '601000',
            compte_libelle: 'Achats de matières premières & fournitures BTPH',
            libelle: `Achat HT - ${f.fournisseur_nom}`,
            debit_dzd: f.montant_ht_dzd,
            credit_dzd: 0,
            chantier_id: f.chantier_id,
            chantier_nom: f.chantier_nom
          });

          if (f.montant_tva_dzd > 0) {
            list.push({
              id: `draft-a-${f.id}-2`,
              piece_ref: f.numero_facture,
              date: f.date_facture,
              journal_code: 'J-ACHATS',
              journal_libelle: 'Journal Achats & Sous-traitance',
              compte_num: '445600',
              compte_libelle: 'TVA Déductible 19%',
              libelle: `TVA déductible sur achat BTPH`,
              debit_dzd: f.montant_tva_dzd,
              credit_dzd: 0,
              chantier_id: f.chantier_id,
              chantier_nom: f.chantier_nom
            });
          }

          list.push({
            id: `draft-a-${f.id}-3`,
            piece_ref: f.numero_facture,
            date: f.date_facture,
            journal_code: 'J-ACHATS',
            journal_libelle: 'Journal Achats & Sous-traitance',
            compte_num: '401000',
            compte_libelle: 'Fournisseurs d’investissements et stocks',
            libelle: `Net à payer Fournisseur ${f.fournisseur_nom}`,
            debit_dzd: 0,
            credit_dzd: net,
            chantier_id: f.chantier_id,
            chantier_nom: f.chantier_nom
          });

          if (ret > 0) {
            list.push({
              id: `draft-a-${f.id}-4`,
              piece_ref: f.numero_facture,
              date: f.date_facture,
              journal_code: 'J-ACHATS',
              journal_libelle: 'Journal Achats & Sous-traitance',
              compte_num: '404000',
              compte_libelle: 'Fournisseurs - Retenues de garantie (5% BTPH)',
              libelle: `Retenue de garantie 5% conservée`,
              debit_dzd: 0,
              credit_dzd: ret,
              chantier_id: f.chantier_id,
              chantier_nom: f.chantier_nom
            });
          }
        });

      transactions
        .filter(t => t.date.startsWith(periodeKey))
        .forEach(t => {
          const pieceRef = t.reference_paiement || `TR-${t.id.slice(-6)}`;
          if (t.type === 'RECETTE') {
            list.push({
              id: `draft-t-${t.id}-1`,
              piece_ref: pieceRef,
              date: t.date,
              journal_code: 'J-TRESO',
              journal_libelle: 'Journal Trésorerie & Banque',
              compte_num: '512000',
              compte_libelle: 'Banques & Comptes Séquestres VEFA',
              libelle: `Encaissement : ${t.libelle}`,
              debit_dzd: t.montant_dzd,
              credit_dzd: 0,
              chantier_id: t.chantier_id,
              chantier_nom: t.chantier_nom
            });
            list.push({
              id: `draft-t-${t.id}-2`,
              piece_ref: pieceRef,
              date: t.date,
              journal_code: 'J-TRESO',
              journal_libelle: 'Journal Trésorerie & Banque',
              compte_num: t.categorie === 'VENTE_VEFA' ? '411000' : '758000',
              compte_libelle: t.categorie === 'VENTE_VEFA' ? 'Clients VEFA (Règlement)' : 'Produits divers',
              libelle: `Contrepartie encaissement`,
              debit_dzd: 0,
              credit_dzd: t.montant_dzd,
              chantier_id: t.chantier_id,
              chantier_nom: t.chantier_nom
            });
          } else {
            list.push({
              id: `draft-t-${t.id}-1`,
              piece_ref: pieceRef,
              date: t.date,
              journal_code: 'J-TRESO',
              journal_libelle: 'Journal Trésorerie & Banque',
              compte_num: t.categorie === 'SALAIRES' ? '641000' : '401000',
              compte_libelle: t.categorie === 'SALAIRES' ? 'Rémunérations du personnel' : 'Fournisseurs (Règlement)',
              libelle: `Décaissement : ${t.libelle}`,
              debit_dzd: t.montant_dzd,
              credit_dzd: 0,
              chantier_id: t.chantier_id,
              chantier_nom: t.chantier_nom
            });
            list.push({
              id: `draft-t-${t.id}-2`,
              piece_ref: pieceRef,
              date: t.date,
              journal_code: 'J-TRESO',
              journal_libelle: 'Journal Trésorerie & Banque',
              compte_num: '512000',
              compte_libelle: 'Banques & Trésorerie',
              libelle: `Crédit Compte Bancaire`,
              debit_dzd: 0,
              credit_dzd: t.montant_dzd,
              chantier_id: t.chantier_id,
              chantier_nom: t.chantier_nom
            });
          }
        });
    }

    return list.filter(e => {
      const matchJournal = selectedJournalFilter === 'ALL' || e.journal_code === selectedJournalFilter;
      const matchChantier = selectedChantierId === 'ALL' || e.chantier_id === selectedChantierId;
      const matchSearch = searchTerm === '' ||
        e.compte_num.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.compte_libelle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.piece_ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.libelle.toLowerCase().includes(searchTerm.toLowerCase());
      return matchJournal && matchChantier && matchSearch;
    });
  }, [selectedClosureYear, selectedClosureMonth, cloturesComptables, facturesClients, facturesFournisseurs, transactions, selectedJournalFilter, selectedChantierId, searchTerm]);

  const totalDebitDisplay = useMemo(() => filteredEcritures.reduce((s, e) => s + e.debit_dzd, 0), [filteredEcritures]);
  const totalCreditDisplay = useMemo(() => filteredEcritures.reduce((s, e) => s + e.credit_dzd, 0), [filteredEcritures]);

  // Statistics calculation
  const stats = useMemo(() => {
    const recettes = filteredTransactions.filter(t => t.type === 'RECETTE').reduce((sum, t) => sum + t.montant_dzd, 0);
    const depenses = filteredTransactions.filter(t => t.type === 'DEPENSE').reduce((sum, t) => sum + t.montant_dzd, 0);
    const balanceTrésorerie = recettes - depenses;
    
    const creancesTotal = filteredFacturesClients.filter(f => f.statut_paiement !== 'PAYEE').reduce((sum, f) => sum + f.montant_ttc_dzd, 0);
    const dettesTotal = filteredFacturesFournisseurs.filter(f => f.statut_comptable !== 'PAYEE').reduce((sum, f) => sum + f.montant_ttc_dzd, 0);
    const retenuesGarantie = filteredFacturesFournisseurs.reduce((sum, f) => sum + (f.montant_ht_dzd * 0.05), 0);

    return { recettes, depenses, balanceTrésorerie, creancesTotal, dettesTotal, retenuesGarantie };
  }, [filteredTransactions, filteredFacturesClients, filteredFacturesFournisseurs]);

  // Export functions
  const handleExportExcel = () => {
    let csvContent = "\uFEFF"; // UTF-8 BOM for Excel
    csvContent += "CONTRÔLE COMPTABLE ET FINANCIER - BATIPROM IMMOBILIER\n";
    csvContent += `Périmètre: ${selectedChantierId === 'ALL' ? 'Tous les chantiers (Siège)' : (currentChantier?.nom_projet || 'Chantier')}\n`;
    csvContent += `Date d'exportation: ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR')}\n\n`;

    csvContent += "JOURNAL DE TRÉSORERIE & TRANSACTIONS\n";
    csvContent += "ID;Date;Type;Catégorie;Libellé;Chantier;Mode Paiement;Référence;Montant DZD\n";

    filteredTransactions.forEach(t => {
      csvContent += `"${t.id}";"${t.date}";"${t.type}";"${t.categorie}";"${t.libelle.replace(/"/g, '""')}";"${t.chantier_nom || 'Siège'}";"${t.mode_paiement}";"${t.reference_paiement || ''}";"${t.montant_dzd}"\n`;
    });

    csvContent += "\n\nFACTURES CLIENTS (VEFA)\n";
    csvContent += "N° Facture;Client;NIF;Chantier;Date;Échéance;Montant HT;TVA;Montant TTC;Statut\n";
    filteredFacturesClients.forEach(f => {
      csvContent += `"${f.numero_facture}";"${f.client_nom.replace(/"/g, '""')}";"${f.client_nif || ''}";"${f.chantier_nom}";"${f.date_facture}";"${f.date_echeance}";"${f.montant_ht_dzd}";"${f.montant_tva_dzd}";"${f.montant_ttc_dzd}";"${f.statut_paiement}"\n`;
    });

    if (filteredEcritures.length > 0) {
      csvContent += "\n\nGRAND LIVRE DES ÉCRITURES COMPTABLES SCF\n";
      csvContent += "Date;Journal;Compte N°;Compte Libellé;N° Pièce;Libellé Écriture;Débit DZD;Crédit DZD;Chantier\n";
      filteredEcritures.forEach(e => {
        csvContent += `"${e.date}";"${e.journal_code}";"${e.compte_num}";"${e.compte_libelle.replace(/"/g, '""')}";"${e.piece_ref}";"${e.libelle.replace(/"/g, '""')}";"${e.debit_dzd}";"${e.credit_dzd}";"${e.chantier_nom || 'Siège'}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `comptabilite_batiprom_${selectedChantierId}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    window.print();
  };

  // Submit handlers
  const handleCreateTransactionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const m = parseFloat(newTrData.montant_dzd);
    if (!m || m <= 0 || !newTrData.libelle) {
      alert("Veuillez saisir un libellé et un montant valide.");
      return;
    }

    const targetChantier = chantiers.find(c => c.id === newTrData.chantier_id);
    enregistrerTransaction({
      date: new Date().toISOString().split('T')[0],
      type: newTrData.type,
      categorie: newTrData.categorie,
      libelle: newTrData.libelle,
      montant_dzd: m,
      chantier_id: newTrData.chantier_id,
      chantier_nom: targetChantier?.nom_projet || 'Siège Central',
      compte_bancaire_id: newTrData.compte_bancaire_id,
      mode_paiement: newTrData.mode_paiement,
      reference_paiement: newTrData.reference_paiement || `REF-${Math.floor(10000 + Math.random()*90000)}`,
      cree_par_id: currentUser?.id || 'system'
    });

    setShowTransactionModal(false);
    setNewTrData({
      type: 'RECETTE',
      categorie: 'VENTE_VEFA',
      libelle: '',
      montant_dzd: '',
      chantier_id: selectedChantierId === 'ALL' ? (chantiers[0]?.id || '') : selectedChantierId,
      compte_bancaire_id: comptesBancaires[0]?.id || '',
      mode_paiement: 'VIREMENT_BANCAIRE',
      reference_paiement: ''
    });
  };

  const handleCreateClientFacSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ht = parseFloat(newClientFac.montant_ht_dzd);
    if (!ht || ht <= 0 || !newClientFac.client_nom) {
      alert("Veuillez remplir le nom du client et le montant HT.");
      return;
    }
    const tva = parseFloat(newClientFac.montant_tva_dzd) || (ht * 0.19);
    const ttc = ht + tva;

    const targetChantier = chantiers.find(c => c.id === newClientFac.chantier_id);
    creerFactureClient({
      numero_facture: newClientFac.numero_facture,
      client_nom: newClientFac.client_nom,
      client_nif: newClientFac.client_nif,
      chantier_id: newClientFac.chantier_id,
      chantier_nom: targetChantier?.nom_projet || 'Chantier',
      lot_vendu_id: `${newClientFac.lot_vendu_id} (${newClientFac.tranche_vefa})`,
      date_facture: newClientFac.date_facture,
      date_echeance: newClientFac.date_echeance,
      montant_ht_dzd: ht,
      montant_tva_dzd: tva,
      montant_ttc_dzd: ttc
    });

    setShowFactureClientModal(false);
    setNewClientFac({
      numero_facture: `FAC-VEFA-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      client_nom: '',
      client_nif: '',
      chantier_id: selectedChantierId === 'ALL' ? (chantiers[0]?.id || '') : selectedChantierId,
      lot_vendu_id: 'Appartement F4 Bloc A N°',
      date_facture: new Date().toISOString().split('T')[0],
      date_echeance: new Date(Date.now() + 30*86400000).toISOString().split('T')[0],
      montant_ht_dzd: '',
      montant_tva_dzd: '',
      tranche_vefa: 'Tranche 1 - Réservation (20%)'
    });
  };

  const handleCreateG50Submit = (e: React.FormEvent) => {
    e.preventDefault();
    const tvaColl = parseFloat(newG50Data.tva_collectee) || 0;
    const tvaDed = parseFloat(newG50Data.tva_deductible) || 0;
    const irg = parseFloat(newG50Data.irg_salaires) || 0;
    const ibs = parseFloat(newG50Data.acompte_ibs) || 0;
    const tapReliquat = parseFloat(newG50Data.reliquat_tap) || 0;

    const netTva = Math.max(0, tvaColl - tvaDed);
    const totalG50 = netTva + irg + ibs + tapReliquat;

    soumettreDeclarationFiscale({
      type: 'G50',
      periode_mois: Number(newG50Data.periode_mois),
      periode_annee: Number(newG50Data.periode_annee),
      date_declaration: new Date().toISOString().split('T')[0],
      montant_total_dzd: totalG50,
      details_impots: {
        tva_collectee: tvaColl,
        tva_deductible: tvaDed,
        tap_montant: tapReliquat,
        irg_salaires: irg,
        ibs_acompte: ibs
      }
    });

    setShowG50Modal(false);
    alert(`Déclaration G50 enregistrée avec succès. Montant total exigible : ${totalG50.toLocaleString()} DZD.`);
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayModal) return;

    if (showPayModal.type === 'FOURNISSEUR') {
      payerFactureFournisseur(showPayModal.id, paymentFormData.compte_bancaire_id, paymentFormData.reference);
      alert(`Règlement de la facture ${showPayModal.num} validé et débité du compte sélectionné.`);
    } else {
      payerFactureClient(showPayModal.id, paymentFormData.compte_bancaire_id, paymentFormData.reference);
      alert(`Encaissement de la facture client ${showPayModal.num} enregistré avec succès.`);
    }

    setShowPayModal(null);
  };

  const handleCreateBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankData.nom_banque || !newBankData.rib) {
      alert("Nom de banque et RIB 20 chiffres obligatoires.");
      return;
    }

    addCompteBancaire({
      entreprise_id: 'ent-001',
      nom_banque: newBankData.nom_banque,
      code_banque: newBankData.code_banque,
      agence: newBankData.agence,
      titulaire: newBankData.titulaire,
      rib: newBankData.rib,
      devise: newBankData.devise,
      actif: true,
      is_compte_principal: false,
      type_compte: newBankData.type_compte,
      chantier_dedie_id: newBankData.chantier_dedie_id || undefined,
      chantier_dedie_nom: chantiers.find(c => c.id === newBankData.chantier_dedie_id)?.nom_projet
    });

    setShowBankModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Printable Header - Visible only during print */}
      <div className="hidden print:block text-slate-900 border-b-2 border-slate-900 pb-4 mb-6">
        <h1 className="text-2xl font-black uppercase">BATIPROM IMMOBILIER ALGÉRIE</h1>
        <p className="text-xs">Direction Générale & Comptabilité Analytique des Chantiers</p>
        <p className="text-xs font-bold mt-2">Rapport Financier Officiel - Extrait du {new Date().toLocaleDateString('fr-FR')}</p>
      </div>

      {/* Main Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-500/20 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-1">
              <ReceiptText className="w-4 h-4 text-emerald-400" />
              <span>Direction Comptabilité & Fiscalité</span>
              <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-mono border border-emerald-500/30">
                Périmètre : {selectedChantierId === 'ALL' ? 'Tous Chantiers (Siège)' : currentChantier?.nom_projet}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Gestion Financière & Fiscale</h1>
            <p className="text-indigo-200/70 text-sm mt-1 max-w-2xl font-medium">
              Suivi de trésorerie, facturation VEFA, dettes/créances et déclarations fiscales algériennes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all border border-white/10"
            >
              <Printer className="w-4 h-4" /> Imprimer / PDF
            </button>
            <button 
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 text-white"
            >
              <Download className="w-4 h-4" /> Export Excel (CSV)
            </button>
            <button 
              onClick={() => setShowTransactionModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 text-white"
            >
              <Plus className="w-4 h-4" /> Saisie Transaction
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 mt-8 bg-black/30 p-1 rounded-xl w-fit border border-white/10 overflow-x-auto max-w-full no-scrollbar">
          <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={TrendingUp} label="Dashboard" />
          <TabButton active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} icon={Wallet} label="Journal Trésorerie" />
          <TabButton active={activeTab === 'factures_clients'} onClick={() => setActiveTab('factures_clients')} icon={Building2} label="Ventes (VEFA)" />
          <TabButton active={activeTab === 'factures_fournisseurs'} onClick={() => setActiveTab('factures_fournisseurs')} icon={CreditCard} label="Achats & Retenues" />
          <TabButton active={activeTab === 'da'} onClick={() => setActiveTab('da')} icon={FileCheck} label={`Visas DA (${pendingDA.length})`} badge={pendingDA.length} />
          <TabButton active={activeTab === 'banque'} onClick={() => setActiveTab('banque')} icon={Calculator} label="Multi-RIB Banques" />
          <TabButton active={activeTab === 'fiscalite'} onClick={() => setActiveTab('fiscalite')} icon={FileText} label="Fiscalité & G50" />
          <TabButton active={activeTab === 'balance_agee'} onClick={() => setActiveTab('balance_agee')} icon={Clock} label="Balance Âgée" />
          <TabButton active={activeTab === 'cloture_journaux'} onClick={() => setActiveTab('cloture_journaux')} icon={Lock} label="Clôture & Journaux" />
        </div>
      </div>

      {/* Main Viewport */}
      <div className="min-h-[500px]">
        {/* ========================================== */}
        {/* TAB 1: DASHBOARD */}
        {/* ========================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Solde Trésorerie Net" value={stats.balanceTrésorerie} icon={Wallet} color={stats.balanceTrésorerie >= 0 ? "emerald" : "rose"} subtext="Recettes - Dépenses" />
              <StatCard title="Recettes Encassées (VEFA)" value={stats.recettes} icon={TrendingUp} color="emerald" trend="+14.2%" />
              <StatCard title="Créances Clients VEFA" value={stats.creancesTotal} icon={Building2} color="amber" subtext="Appels de fonds non réglés" />
              <StatCard title="Dettes Fournisseurs" value={stats.dettesTotal} icon={CreditCard} color="indigo" subtext={`Dont Retenues 5% : ${stats.retenuesGarantie.toLocaleString()} DZD`} />
            </div>

            {/* Analytical Budget Breakdown per Chantier */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-extrabold text-slate-800 text-sm">Suivi Budgétaire Analytique par Chantier</h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Centre de Profit</span>
                </div>
                <div className="p-6 space-y-6">
                  {chantiers.map(cht => {
                    const pct = Math.round((cht.budget_engage / cht.budget_global_prevu) * 100);
                    const isWarning = pct >= 85 && pct < 100;
                    const isAlert = pct >= 100;
                    
                    return (
                      <div key={cht.id} className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-extrabold text-slate-900 text-sm">{cht.nom_projet}</span>
                            <span className="text-[10px] text-slate-500 font-mono ml-2">[{cht.code_chantier}]</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                              isAlert ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse' :
                              isWarning ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                              'bg-emerald-100 text-emerald-800'
                            }`}>
                              {pct}% Consommé
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Budget Prevu</span>
                            <p className="font-bold text-slate-800">{cht.budget_global_prevu.toLocaleString()} DZD</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Engagé</span>
                            <p className="font-black text-indigo-700">{cht.budget_engage.toLocaleString()} DZD</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Disponible</span>
                            <p className="font-bold text-slate-600">{(cht.budget_global_prevu - cht.budget_engage).toLocaleString()} DZD</p>
                          </div>
                        </div>

                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${isAlert ? 'bg-rose-600' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${Math.min(100, pct)}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Multi-RIB Financial Accounts Widget */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-800 text-sm">Comptes Bancaires & Séquestres</h3>
                  </div>
                  <button 
                    onClick={() => setShowBankModal(true)}
                    className="p-1 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {comptesBancaires.map(b => (
                    <div key={b.id} className="p-3 rounded-xl border border-slate-100 hover:border-indigo-200 transition-colors bg-slate-50/50">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{b.nom_banque}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                          b.type_compte === 'SEQUESTRE_VEFA' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {b.type_compte === 'SEQUESTRE_VEFA' ? 'SÉQUESTRE VEFA (LOI 11-04)' : b.type_compte}
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-slate-500 mt-1">RIB: {b.rib}</p>
                      {b.chantier_dedie_nom && (
                        <p className="text-[10px] text-indigo-600 font-medium italic mt-0.5">Dédié : {b.chantier_dedie_nom}</p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-700" /> Conformité Loi 11-04 VEFA
                  </p>
                  <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                    Les versements d'acquéreurs doivent impérativement être déposés sur les comptes séquestres agréés FGCMPI.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 2: TRANSACTIONS / JOURNAL DE TRÉSORERIE */}
        {/* ========================================== */}
        {activeTab === 'transactions' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
            <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
              <div className="flex items-center gap-4">
                <h2 className="text-sm font-bold text-slate-900">Journal de Trésorerie ({filteredTransactions.length})</h2>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Rechercher une opération..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
                  />
                </div>
              </div>
              <button 
                onClick={() => setShowTransactionModal(true)}
                className="px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-700 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Saisir Transaction
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Libellé & Catégorie</th>
                    <th className="py-3 px-4">Compte Bancaire (RIB)</th>
                    <th className="py-3 px-4">Chantier / Imputation</th>
                    <th className="py-3 px-4 text-right">Montant (DZD)</th>
                    <th className="py-3 px-4 text-center">Réf. Pièce</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map(tr => {
                    const bank = comptesBancaires.find(b => b.id === tr.compte_bancaire_id);
                    return (
                      <tr key={tr.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-600">{tr.date}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            tr.type === 'RECETTE' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}>
                            {tr.type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{tr.libelle}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-mono">{tr.categorie.replace('_', ' ')}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-800">{bank?.nom_banque || 'Banque'}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{bank?.rib ? `...${bank.rib.slice(-6)}` : ''}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                            {tr.chantier_nom || 'Siège Central'}
                          </span>
                        </td>
                        <td className={`py-3 px-4 text-right font-black ${tr.type === 'RECETTE' ? 'text-emerald-600' : 'text-slate-900'}`}>
                          {tr.type === 'RECETTE' ? '+' : '-'}{tr.montant_dzd.toLocaleString()} DZD
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-500 text-[10px]">
                          {tr.reference_paiement || 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 3: FACTURES CLIENTS (VEFA) */}
        {/* ========================================== */}
        {activeTab === 'factures_clients' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Appels de Fonds Vente sur Plans (VEFA - Loi 11-04)</h3>
              </div>
              <button 
                onClick={() => setShowFactureClientModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" /> Nouvel Appel de Fonds VEFA
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFacturesClients.map(fac => (
                <div key={fac.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:border-indigo-300 transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-indigo-600">{fac.numero_facture}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        fac.statut_paiement === 'PAYEE' ? 'bg-emerald-100 text-emerald-800' :
                        fac.statut_paiement === 'PARTIELLEMENT_PAYEE' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {fac.statut_paiement}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base">{fac.client_nom}</h4>
                      {fac.client_nif && <p className="text-[10px] text-slate-400 font-mono">NIF: {fac.client_nif}</p>}
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs">
                      <p className="text-slate-500 font-medium">{fac.chantier_nom}</p>
                      <p className="font-semibold text-indigo-700">{fac.lot_vendu_id}</p>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100">
                      <span className="text-slate-500">Montant TTC Exigible :</span>
                      <span className="font-black text-slate-900 text-sm">{fac.montant_ttc_dzd.toLocaleString()} DZD</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Échéance: {fac.date_echeance}</span>
                    {fac.statut_paiement !== 'PAYEE' && (
                      <button 
                        onClick={() => setShowPayModal({ type: 'CLIENT', id: fac.id, num: fac.numero_facture, montant: fac.montant_ttc_dzd })}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
                      >
                        Enregistrer Règlement
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 4: ACHATS & FACTURES FOURNISSEURS */}
        {/* ========================================== */}
        {activeTab === 'factures_fournisseurs' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Factures Fournisseurs & Retenues de Garantie (5%)</h3>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">N° Facture</th>
                    <th className="py-3 px-4">Fournisseur & NIF</th>
                    <th className="py-3 px-4">Chantier</th>
                    <th className="py-3 px-4">Montant HT</th>
                    <th className="py-3 px-4">TVA (19%)</th>
                    <th className="py-3 px-4">Retenue (5%)</th>
                    <th className="py-3 px-4 text-right">Net Exigible (TTC)</th>
                    <th className="py-3 px-4 text-center">Statut</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFacturesFournisseurs.map(fac => {
                    const retenue = fac.montant_ht_dzd * 0.05;
                    return (
                      <tr key={fac.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{fac.numero_facture}</td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{fac.fournisseur_nom}</p>
                          <p className="text-[10px] text-slate-400 font-mono">NIF: {fac.fournisseur_nif}</p>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700">{fac.chantier_nom}</td>
                        <td className="py-3 px-4 font-mono">{fac.montant_ht_dzd.toLocaleString()} DZD</td>
                        <td className="py-3 px-4 font-mono">{fac.montant_tva_dzd.toLocaleString()} DZD</td>
                        <td className="py-3 px-4 font-mono text-amber-700 font-bold">{retenue.toLocaleString()} DZD</td>
                        <td className="py-3 px-4 font-black text-right text-slate-900 font-mono">{fac.montant_ttc_dzd.toLocaleString()} DZD</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            fac.statut_comptable === 'PAYEE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {fac.statut_comptable}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {fac.statut_comptable !== 'PAYEE' ? (
                            <button 
                              onClick={() => setShowPayModal({ type: 'FOURNISSEUR', id: fac.id, num: fac.numero_facture, montant: fac.montant_ttc_dzd })}
                              className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700"
                            >
                              Régler
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono">Réglée ({fac.reference_virement || 'Virement'})</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 5: VISAS SUR DEMANDES D'ACHAT (WORKFLOW) */}
        {/* ========================================== */}
        {activeTab === 'da' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {pendingDA.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-900">Aucune demande en attente de visa</h3>
                <p className="text-xs text-slate-500 mt-1">Toutes les demandes d'achat des conducteurs de travaux ont été visées.</p>
              </div>
            ) : (
              pendingDA.map(da => (
                <div key={da.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row gap-6 hover:border-indigo-300 transition-all">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 font-mono font-bold">
                          DA
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{da.numero_da}</p>
                          <h4 className="font-extrabold text-slate-900 text-base">{da.designation_produit}</h4>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        da.niveau_urgence === 'CRITIQUE_ARRET_CHANTIER' ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {da.niveau_urgence}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-slate-400 font-bold uppercase text-[9px]">Quantité</p>
                        <p className="font-black text-slate-800">{da.quantite_demandee} {da.unite_mesure}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-bold uppercase text-[9px]">Budget Est.</p>
                        <p className="font-black text-indigo-700">{(da.estimation_budget_dzd || 0).toLocaleString()} DZD</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-bold uppercase text-[9px]">Demandeur</p>
                        <p className="font-bold text-slate-800">{da.demandeur_nom}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-bold uppercase text-[9px]">Chantier</p>
                        <p className="font-bold text-emerald-700">{da.chantier_nom}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 text-xs text-amber-900">
                      <p className="text-[10px] text-amber-700 font-bold uppercase mb-0.5">Justification du conducteur de travaux</p>
                      <p className="italic">"{da.justification}"</p>
                    </div>
                  </div>

                  <div className="md:w-72 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 flex flex-col justify-between space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Avis Comptable / Commentaire</label>
                      <textarea 
                        value={daComments[da.id] || ''}
                        onChange={e => setDaComments({ ...daComments, [da.id]: e.target.value })}
                        placeholder="Contrôle imputation & disponible budgétaire..."
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => validerDemandeAchatComptabilite(da.id, 'REFUSER', daComments[da.id] || 'Non conforme au budget')}
                        className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-rose-50 hover:text-rose-700 transition-colors border border-slate-200"
                      >
                        Refuser Visa
                      </button>
                      <button 
                        onClick={() => validerDemandeAchatComptabilite(da.id, 'VALIDER', daComments[da.id] || 'Visa comptable accordé')}
                        className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-1"
                      >
                        <Check className="w-4 h-4" /> Accorder Visa
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 6: MULTI-RIB COMPTES BANCAIRES */}
        {/* ========================================== */}
        {activeTab === 'banque' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Comptes Bancaires Officiels de BatiProm SPA</h3>
                <p className="text-xs text-slate-500">Gestion des RIB d'exploitation et des comptes séquestres VEFA obligatoires.</p>
              </div>
              <button 
                onClick={() => setShowBankModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" /> Ajouter un RIB Societaire
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {comptesBancaires.map(b => (
                <div key={b.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{b.code_banque}</span>
                      <h4 className="font-extrabold text-slate-900 text-lg">{b.nom_banque}</h4>
                      <p className="text-xs text-slate-500">{b.agence}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                      b.type_compte === 'SEQUESTRE_VEFA' ? 'bg-purple-100 text-purple-900 border border-purple-300' :
                      b.type_compte === 'DEVISES' ? 'bg-emerald-100 text-emerald-900' :
                      'bg-blue-100 text-blue-900'
                    }`}>
                      {b.type_compte}
                    </span>
                  </div>

                  <div className="mt-6 p-4 bg-slate-900 text-white rounded-xl space-y-2">
                    <p className="text-[10px] text-slate-400 font-mono uppercase">Numéro de RIB (20 Chiffres)</p>
                    <p className="text-sm font-mono font-bold tracking-wider text-emerald-400">{b.rib}</p>
                    {b.iban && <p className="text-[10px] font-mono text-slate-300">IBAN: {b.iban}</p>}
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-slate-600">
                    <span>Titulaire : <strong>{b.titulaire}</strong></span>
                    {b.chantier_dedie_nom && <span className="font-bold text-indigo-600 italic">Dédié : {b.chantier_dedie_nom}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 7: FISCALITÉ & DÉCLARATIONS G50 (SAISIE MANUELLE) */}
        {/* ========================================== */}
        {activeTab === 'fiscalite' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Algerian Tax Regulations Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-3 text-amber-900">
                <Calculator className="w-6 h-6 text-amber-700" />
                <h3 className="text-lg font-extrabold tracking-tight">Déclaration Fiscale G50 (Cadre Algérien - Saisie Manuelle)</h3>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>Rappel Réglementaire (Loi de Finances 2024) :</strong> La Taxe sur l’Activité Professionnelle (<strong>TAP</strong>) a été <strong>supprimée</strong> à compter du 1er janvier 2024 (Articles 14 & 24 de la LF 2024). Conformément aux règles fiscales, l'ensemble des valeurs du G50 (TVA Collectée, TVA Déductible, IRG Salaires, IBS et éventuels reliquats d'exercices antérieurs) sont <strong>entièrement saisis manuellement</strong> par le comptable sans imposition de taux fixes automatiques.
              </p>
            </div>

            {/* Recent Declarations Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-sm font-bold text-slate-900">Historique des Déclarations G50</h2>
                <button 
                  onClick={() => setShowG50Modal(true)}
                  className="px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4" /> Établir Déclaration G50
                </button>
              </div>

              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Période</th>
                    <th className="py-3 px-4">Date Déclaration</th>
                    <th className="py-3 px-4">TVA Collectée</th>
                    <th className="py-3 px-4">TVA Déductible</th>
                    <th className="py-3 px-4">IRG Salaires</th>
                    <th className="py-3 px-4">TAP (Reliquat)</th>
                    <th className="py-3 px-4 text-right">Net G50 Exigible</th>
                    <th className="py-3 px-4 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {declarationsFiscales.map(dec => (
                    <tr key={dec.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{String(dec.periode_mois).padStart(2, '0')}/{dec.periode_annee}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{dec.date_declaration}</td>
                      <td className="py-3 px-4 font-mono">{dec.details_impots.tva_collectee.toLocaleString()} DZD</td>
                      <td className="py-3 px-4 font-mono">{dec.details_impots.tva_deductible.toLocaleString()} DZD</td>
                      <td className="py-3 px-4 font-mono">{dec.details_impots.irg_salaires.toLocaleString()} DZD</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{dec.details_impots.tap_montant ? `${dec.details_impots.tap_montant.toLocaleString()} DZD` : '0 (Supprimée)'}</td>
                      <td className="py-3 px-4 text-right font-black font-mono text-slate-900">{dec.montant_total_dzd.toLocaleString()} DZD</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          dec.statut === 'PAYEE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {dec.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 8: BALANCE ÂGÉE CLIENTS & FOURNISSEURS */}
        {/* ========================================== */}
        {activeTab === 'balance_agee' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="font-extrabold text-slate-900 text-base">Balance Âgée des Créances VEFA & Dettes BTPH</h3>
              <p className="text-xs text-slate-500">Analyse de la vétusté des paiements pour gestion du risque de trésorerie.</p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">Moins de 30 Jours</span>
                  <p className="text-xl font-black text-emerald-950 mt-1">14,280,000 DZD</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                  <span className="text-[10px] font-bold text-blue-700 uppercase">30 à 60 Jours</span>
                  <p className="text-xl font-black text-blue-950 mt-1">8,500,000 DZD</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                  <span className="text-[10px] font-bold text-amber-700 uppercase">60 à 90 Jours</span>
                  <p className="text-xl font-black text-amber-950 mt-1">4,200,000 DZD</p>
                </div>
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-100">
                  <span className="text-[10px] font-bold text-rose-700 uppercase">Plus de 90 Jours</span>
                  <p className="text-xl font-black text-rose-950 mt-1">1,800,000 DZD</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 9: CLÔTURE COMPTABLE & JOURNAUX SCF */}
        {/* ========================================== */}
        {activeTab === 'cloture_journaux' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Banner Info */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-white">Clôture Comptable Mensuelle & Grand Livre SCF</h2>
                    <p className="text-slate-300 text-xs mt-1 max-w-3xl leading-relaxed">
                      Procédure de clôture périodique automatisée conforme au Système Comptable Financier (SCF Algérie). 
                      Génération des écritures comptables en partie double (Trésorerie, Ventes VEFA, Achats BTPH & Retenues 5%, Fiscalité G50) et verrouillage strict des périodes clôturées.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Équilibre Comptable</p>
                    <p className="text-xs font-black text-emerald-400">Débit = Crédit (100% Vérifié)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls Bar for Period Selection & Action */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Année Comptable</label>
                  <select
                    value={selectedClosureYear}
                    onChange={e => setSelectedClosureYear(Number(e.target.value))}
                    className="p-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 bg-slate-50 focus:bg-white"
                  >
                    <option value={2026}>2026</option>
                    <option value={2025}>2025</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Mois Période</label>
                  <select
                    value={selectedClosureMonth}
                    onChange={e => setSelectedClosureMonth(Number(e.target.value))}
                    className="p-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 bg-slate-50 focus:bg-white"
                  >
                    {[
                      { m: 1, name: 'Janvier' },
                      { m: 2, name: 'Février' },
                      { m: 3, name: 'Mars' },
                      { m: 4, name: 'Avril' },
                      { m: 5, name: 'Mai' },
                      { m: 6, name: 'Juin' },
                      { m: 7, name: 'Juillet' },
                      { m: 8, name: 'Août' },
                      { m: 9, name: 'Septembre' },
                      { m: 10, name: 'Octobre' },
                      { m: 11, name: 'Novembre' },
                      { m: 12, name: 'Décembre' }
                    ].map(item => (
                      <option key={item.m} value={item.m}>{item.name}</option>
                    ))}
                  </select>
                </div>

                {/* Period Status Indicator */}
                <div className="pl-2 border-l border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Statut du Verrouillage</p>
                  {isPeriodeCloturee(`${selectedClosureYear}-${String(selectedClosureMonth).padStart(2, '0')}`) ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-xs font-black">
                      <Lock className="w-3.5 h-3.5 text-rose-600" /> Période Clôturée & Verrouillée
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-black">
                      <LockOpen className="w-3.5 h-3.5 text-emerald-600" /> Période Ouverte (Modifications autorisées)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isPeriodeCloturee(`${selectedClosureYear}-${String(selectedClosureMonth).padStart(2, '0')}`) ? (
                  <button
                    onClick={() => {
                      const key = `${selectedClosureYear}-${String(selectedClosureMonth).padStart(2, '0')}`;
                      if (confirm(`Voulez-vous déverrouiller la période comptable ${key} ?\nAttention : cela permettra la modification des pièces sur cette période.`)) {
                        deverrouillerPeriodeComptable(key);
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-extrabold transition-all shadow-xs"
                  >
                    <LockOpen className="w-4 h-4 text-amber-600" /> Déverrouiller la Période (Supervision)
                  </button>
                ) : (
                  <button
                    onClick={() => setShowExecuteClosureModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-lg shadow-indigo-600/20"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Exécuter Clôture Mensuelle & Générer Journaux
                  </button>
                )}
              </div>
            </div>

            {/* Filterable Grand Livre Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-extrabold text-slate-800 text-sm">Grand Livre des Écritures Comptables SCF</h3>
                </div>
                <div className="flex items-center gap-3">
                  {/* Filter by Journal */}
                  <select
                    value={selectedJournalFilter}
                    onChange={e => setSelectedJournalFilter(e.target.value as any)}
                    className="p-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white"
                  >
                    <option value="ALL">Tous les Journaux Auxiliaires</option>
                    <option value="J-TRESO">Journal Trésorerie (J-TRESO / 512)</option>
                    <option value="J-VENTES">Journal Ventes VEFA (J-VENTES / 701)</option>
                    <option value="J-ACHATS">Journal Achats & Retenues (J-ACHATS / 601)</option>
                    <option value="J-OD">Journal Fiscalité & OD (J-OD / 445-447)</option>
                  </select>

                  {/* Search filter */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Rechercher écriture, pièce, compte..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white w-56"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                      <th className="p-3">Date</th>
                      <th className="p-3">Journal</th>
                      <th className="p-3">Compte SCF</th>
                      <th className="p-3">N° Pièce</th>
                      <th className="p-3">Libellé de l'Écriture</th>
                      <th className="p-3 text-right">Débit (DZD)</th>
                      <th className="p-3 text-right">Crédit (DZD)</th>
                      <th className="p-3">Chantier</th>
                      <th className="p-3 text-center">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                    {filteredEcritures.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                          Aucune écriture comptable générée pour les critères sélectionnés.
                        </td>
                      </tr>
                    ) : (
                      filteredEcritures.map((ecr, idx) => (
                        <tr key={ecr.id || idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-mono font-bold text-slate-800">{ecr.date}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              ecr.journal_code === 'J-VENTES' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                              ecr.journal_code === 'J-ACHATS' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              ecr.journal_code === 'J-TRESO' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                              'bg-purple-100 text-purple-800 border border-purple-200'
                            }`}>
                              {ecr.journal_code}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded mr-1">
                              {ecr.compte_num}
                            </span>
                            <span className="text-[11px] text-slate-500 font-semibold">{ecr.compte_libelle}</span>
                          </td>
                          <td className="p-3 font-mono font-extrabold text-slate-900">{ecr.piece_ref}</td>
                          <td className="p-3 font-semibold text-slate-800">{ecr.libelle}</td>
                          <td className="p-3 text-right font-mono font-extrabold text-emerald-700">
                            {ecr.debit_dzd > 0 ? ecr.debit_dzd.toLocaleString('fr-DZ') : '-'}
                          </td>
                          <td className="p-3 text-right font-mono font-extrabold text-indigo-700">
                            {ecr.credit_dzd > 0 ? ecr.credit_dzd.toLocaleString('fr-DZ') : '-'}
                          </td>
                          <td className="p-3 text-[11px] font-semibold text-slate-500">{ecr.chantier_nom || 'Siège Central'}</td>
                          <td className="p-3 text-center">
                            {isPeriodeCloturee(`${selectedClosureYear}-${String(selectedClosureMonth).padStart(2, '0')}`) ? (
                              <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-[10px]">
                                <Lock className="w-3 h-3" /> Verrouillé
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-slate-400 font-semibold text-[10px]">
                                Brouillon
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-300 bg-slate-50 text-xs font-black text-slate-900">
                    <tr>
                      <td colSpan={5} className="p-3 text-right uppercase tracking-wider">Total Général du Grand Livre :</td>
                      <td className="p-3 text-right font-mono text-emerald-700 text-sm">{totalDebitDisplay.toLocaleString('fr-DZ')} DZD</td>
                      <td className="p-3 text-right font-mono text-indigo-700 text-sm">{totalCreditDisplay.toLocaleString('fr-DZ')} DZD</td>
                      <td colSpan={2} className="p-3 text-center">
                        {totalDebitDisplay === totalCreditDisplay ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full border border-emerald-300 font-black">
                            ✓ 100% Équilibré
                          </span>
                        ) : (
                          <span className="bg-rose-100 text-rose-800 text-[10px] px-2 py-0.5 rounded-full border border-rose-300 font-black">
                            ⚠ Écart Débit/Crédit
                          </span>
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Historical Monthly Closures Log */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Historique des Clôtures Mensuelles Rétrospectives</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cloturesComptables.map(clot => (
                  <div key={clot.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-200 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black font-mono text-slate-900">Période {clot.periode_cle}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        clot.statut === 'CLOTUREE' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {clot.statut === 'CLOTUREE' ? '🔒 Clôturée' : '🔓 Ouverte'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium">{clot.observations}</p>
                    <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>{clot.nombre_ecritures} Écritures générées</span>
                      <span className="font-bold text-slate-700">{clot.total_debit_dzd.toLocaleString()} DZD</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* MODAL: EXÉCUTER CLÔTURE MENSUELLE */}
      {/* ========================================== */}
      {showExecuteClosureModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900">
                <ShieldAlert className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-base">Validation de la Clôture Comptable Mensuelle</h3>
              </div>
              <button onClick={() => setShowExecuteClosureModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl text-xs space-y-2">
              <p className="font-extrabold flex items-center gap-1.5 text-amber-900">
                <Lock className="w-4 h-4 text-amber-600" /> Action Irréversible de Clôture & Verrouillage
              </p>
              <p className="text-amber-800 leading-relaxed font-medium">
                Vous allez clôturer la période <strong>{String(selectedClosureMonth).padStart(2, '0')}/{selectedClosureYear}</strong>.
                Toutes les pièces de ventes VEFA, factures d'achats BTPH, règlements bancaires et déclarations G50 de ce mois seront compilées en écritures SCF et la période sera verrouillée contre toute modification ultérieure.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Période concernée</label>
                <div className="p-3 bg-slate-100 rounded-xl font-mono font-bold text-slate-900 flex items-center justify-between">
                  <span>Période : {String(selectedClosureMonth).padStart(2, '0')}/{selectedClosureYear}</span>
                  <span className="text-indigo-600 font-extrabold">{filteredEcritures.length} écritures SCF</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observations / Procès-verbal de Clôture (Optionnel)</label>
                <textarea
                  value={closureObservation}
                  onChange={e => setClosureObservation(e.target.value)}
                  placeholder="Remarques du chef comptable, PV de réconciliation bancaire..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 h-20 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowExecuteClosureModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 text-xs"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = executerClotureMensuelle(selectedClosureYear, selectedClosureMonth, closureObservation);
                  setShowExecuteClosureModal(false);
                  setClosureObservation('');
                  alert(res.message);
                }}
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 text-xs flex items-center gap-1.5"
              >
                <Lock className="w-4 h-4" /> Confirmer la Clôture & Verrouiller
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: SAISIE TRANSACTION */}
      {/* ========================================== */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Saisie d'une Nouvelle Transaction</h3>
              <button onClick={() => setShowTransactionModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreateTransactionSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Type de mouvement</label>
                  <select 
                    value={newTrData.type}
                    onChange={e => setNewTrData({ ...newTrData, type: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold"
                  >
                    <option value="RECETTE">RECETTE (+)</option>
                    <option value="DEPENSE">DÉPENSE (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Catégorie Comptable</label>
                  <select 
                    value={newTrData.categorie}
                    onChange={e => setNewTrData({ ...newTrData, categorie: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="VENTE_VEFA">Vente VEFA / Acquéreur</option>
                    <option value="ACHAT_MATERIAUX">Achat Matériaux / Acier / Ciment</option>
                    <option value="SOUS_TRAITANCE">Sous-traitance BTPH</option>
                    <option value="SALAIRES">Salaires & CNAS</option>
                    <option value="IMPOTS">Impôts & Taxes (G50)</option>
                    <option value="FRAIS_SIEGE">Frais de Siège / Honoraires BET</option>
                    <option value="AUTRE">Autre Opération</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Libellé de la transaction *</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Règlement facture ciment Lafarge Chéraga"
                  value={newTrData.libelle}
                  onChange={e => setNewTrData({ ...newTrData, libelle: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Montant (DZD) *</label>
                  <input 
                    type="number"
                    required
                    placeholder="Montant en DZD"
                    value={newTrData.montant_dzd}
                    onChange={e => setNewTrData({ ...newTrData, montant_dzd: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chantier d'imputation</label>
                  <select 
                    value={newTrData.chantier_id}
                    onChange={e => setNewTrData({ ...newTrData, chantier_id: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    {chantiers.map(c => (
                      <option key={c.id} value={c.id}>{c.nom_projet}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Compte Bancaire (RIB)</label>
                  <select 
                    value={newTrData.compte_bancaire_id}
                    onChange={e => setNewTrData({ ...newTrData, compte_bancaire_id: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono text-[11px]"
                  >
                    {comptesBancaires.map(b => (
                      <option key={b.id} value={b.id}>{b.nom_banque} (...{b.rib.slice(-6)})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mode de Paiement</label>
                  <select 
                    value={newTrData.mode_paiement}
                    onChange={e => setNewTrData({ ...newTrData, mode_paiement: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="VIREMENT_BANCAIRE">Virement Bancaire</option>
                    <option value="CHEQUE_BANCAIRE">Chèque Bancaire</option>
                    <option value="TRAITE">Traite</option>
                    <option value="ESPECES">Espèces (Caisse)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Référence Pièce / N° Chèque</label>
                <input 
                  type="text"
                  placeholder="Ex: CHQ-BNA-0091823"
                  value={newTrData.reference_paiement}
                  onChange={e => setNewTrData({ ...newTrData, reference_paiement: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowTransactionModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-sm"
                >
                  Enregistrer l'Écriture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: NOUVEL APPEL DE FONDS VEFA */}
      {/* ========================================== */}
      {showFactureClientModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Émettre un Appel de Fonds VEFA (Client)</h3>
              <button onClick={() => setShowFactureClientModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreateClientFacSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">N° Appel / Facture</label>
                  <input 
                    type="text"
                    required
                    value={newClientFac.numero_facture}
                    onChange={e => setNewClientFac({ ...newClientFac, numero_facture: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nom de l'Acquéreur *</label>
                  <input 
                    type="text"
                    required
                    placeholder="M. Haddad Tarik"
                    value={newClientFac.client_nom}
                    onChange={e => setNewClientFac({ ...newClientFac, client_nom: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chantier</label>
                  <select 
                    value={newClientFac.chantier_id}
                    onChange={e => setNewClientFac({ ...newClientFac, chantier_id: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    {chantiers.map(c => (
                      <option key={c.id} value={c.id}>{c.nom_projet}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tranche VEFA Certifiée CTC</label>
                  <select 
                    value={newClientFac.tranche_vefa}
                    onChange={e => setNewClientFac({ ...newClientFac, tranche_vefa: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Tranche 1 - Réservation (20%)">Tranche 1 - Réservation (20%)</option>
                    <option value="Tranche 2 - Fondations (15%)">Tranche 2 - Fondations (15%)</option>
                    <option value="Tranche 3 - Gros Œuvre Dalle (25%)">Tranche 3 - Gros Œuvre Dalle (25%)</option>
                    <option value="Tranche 4 - Second Œuvre (20%)">Tranche 4 - Second Œuvre (20%)</option>
                    <option value="Tranche 5 - Remise Clés (20%)">Tranche 5 - Remise Clés (20%)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Désignation du Lot Vendu</label>
                <input 
                  type="text"
                  placeholder="Appartement F4 - Bloc A - N°12 (115 m²)"
                  value={newClientFac.lot_vendu_id}
                  onChange={e => setNewClientFac({ ...newClientFac, lot_vendu_id: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Montant HT (DZD) *</label>
                  <input 
                    type="number"
                    required
                    placeholder="Ex: 5000000"
                    value={newClientFac.montant_ht_dzd}
                    onChange={e => setNewClientFac({ ...newClientFac, montant_ht_dzd: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">TVA DZD (Optionnel)</label>
                  <input 
                    type="number"
                    placeholder="Auto 19% si vide"
                    value={newClientFac.montant_tva_dzd}
                    onChange={e => setNewClientFac({ ...newClientFac, montant_tva_dzd: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowFactureClientModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-sm"
                >
                  Générer Appel de Fonds
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: DÉCLARATION FISCALE G50 (SAISIE MANUELLE) */}
      {/* ========================================== */}
      {showG50Modal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Établir Déclaration G50 (Saisie Manuelle)</h3>
              <button onClick={() => setShowG50Modal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreateG50Submit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mois Fiscal</label>
                  <select 
                    value={newG50Data.periode_mois}
                    onChange={e => setNewG50Data({ ...newG50Data, periode_mois: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>Mois {String(m).padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Année Fiscale</label>
                  <input 
                    type="number"
                    value={newG50Data.periode_annee}
                    onChange={e => setNewG50Data({ ...newG50Data, periode_annee: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1 text-[11px]">
                <p className="font-bold">Saisie manuelle des valeurs réelles du G50 :</p>
                <p>La TAP est supprimée depuis la LF 2024. Saisissez directement les montants de vos tableaux d'amortissement et livres d'achats/ventes.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">TVA Collectée (Ventes) DZD</label>
                  <input 
                    type="number"
                    placeholder="Saisie libre"
                    value={newG50Data.tva_collectee}
                    onChange={e => setNewG50Data({ ...newG50Data, tva_collectee: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">TVA Déductible (Achats) DZD</label>
                  <input 
                    type="number"
                    placeholder="Saisie libre"
                    value={newG50Data.tva_deductible}
                    onChange={e => setNewG50Data({ ...newG50Data, tva_deductible: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">IRG Salaires DZD</label>
                  <input 
                    type="number"
                    placeholder="Saisie libre barème"
                    value={newG50Data.irg_salaires}
                    onChange={e => setNewG50Data({ ...newG50Data, irg_salaires: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Acompte IBS DZD</label>
                  <input 
                    type="number"
                    placeholder="Saisie libre"
                    value={newG50Data.acompte_ibs}
                    onChange={e => setNewG50Data({ ...newG50Data, acompte_ibs: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reliquat TAP (Optionnel si antérieur à 2024)</label>
                <input 
                  type="number"
                  placeholder="0 (L.F. 2024)"
                  value={newG50Data.reliquat_tap}
                  onChange={e => setNewG50Data({ ...newG50Data, reliquat_tap: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowG50Modal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-sm"
                >
                  Enregistrer Déclaration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: RÈGLEMENT FACTURE CLIENT / FOURNISSEUR */}
      {/* ========================================== */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">
                {showPayModal.type === 'FOURNISSEUR' ? 'Paiement Facture Fournisseur' : 'Encaissement Client VEFA'}
              </h3>
              <button onClick={() => setShowPayModal(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleProcessPayment} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Facture Référence</p>
                <p className="font-mono font-bold text-slate-900">{showPayModal.num}</p>
                <p className="text-sm font-black text-indigo-700 mt-1">{showPayModal.montant.toLocaleString()} DZD</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Compte Bancaire Imputé (RIB)</label>
                <select 
                  value={paymentFormData.compte_bancaire_id}
                  onChange={e => setPaymentFormData({ ...paymentFormData, compte_bancaire_id: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono text-xs font-bold"
                >
                  {comptesBancaires.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.nom_banque} ({b.type_compte === 'SEQUESTRE_VEFA' ? 'Séquestre VEFA' : 'Courant'}) - RIB ...{b.rib.slice(-6)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">N° de Virement / Chèque / Référence</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: VIR-BNA-991203"
                  value={paymentFormData.reference}
                  onChange={e => setPaymentFormData({ ...paymentFormData, reference: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowPayModal(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-sm"
                >
                  Confirmer le Règlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: AJOUTER BANQUE / RIB */}
      {/* ========================================== */}
      {showBankModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Ajouter un Compte Bancaire (RIB)</h3>
              <button onClick={() => setShowBankModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreateBankSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nom de la Banque *</label>
                  <input 
                    type="text"
                    required
                    placeholder="Banque Nationale d’Algérie (BNA)"
                    value={newBankData.nom_banque}
                    onChange={e => setNewBankData({ ...newBankData, nom_banque: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Code Banque</label>
                  <input 
                    type="text"
                    placeholder="001"
                    value={newBankData.code_banque}
                    onChange={e => setNewBankData({ ...newBankData, code_banque: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Numéro RIB 20 Chiffres *</label>
                <input 
                  type="text"
                  required
                  placeholder="001 00601 0200012345 67"
                  value={newBankData.rib}
                  onChange={e => setNewBankData({ ...newBankData, rib: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold text-sm tracking-wider"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Type de Compte</label>
                  <select 
                    value={newBankData.type_compte}
                    onChange={e => setNewBankData({ ...newBankData, type_compte: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold"
                  >
                    <option value="COURANT">Compte Courant Exploitation</option>
                    <option value="SEQUESTRE_VEFA">Compte Séquestre VEFA (FGCMPI - Loi 11-04)</option>
                    <option value="EPARGNE">Compte Épargne</option>
                    <option value="DEVISES">Compte Devises</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chantier Dédié (Optionnel)</label>
                  <select 
                    value={newBankData.chantier_dedie_id}
                    onChange={e => setNewBankData({ ...newBankData, chantier_dedie_id: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="">Aucun (Siège / Général)</option>
                    {chantiers.map(c => (
                      <option key={c.id} value={c.id}>{c.nom_projet}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowBankModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-sm"
                >
                  Enregistrer le RIB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: any; label: string; badge?: number }> = ({ active, onClick, icon: Icon, label, badge }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap relative ${
      active ? 'bg-indigo-600 text-white shadow-lg' : 'text-indigo-200 hover:bg-white/10 hover:text-white'
    }`}
  >
    <Icon className="w-4 h-4" /> 
    <span>{label}</span>
    {badge !== undefined && badge > 0 && (
      <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full border border-rose-600 animate-pulse">
        {badge}
      </span>
    )}
  </button>
);

const StatCard: React.FC<{ title: string; value: number; icon: any; color: 'emerald' | 'rose' | 'amber' | 'indigo'; subtext?: string; trend?: string }> = ({ title, value, icon: Icon, color, subtext, trend }) => {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100'
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-indigo-300 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${colors[color]} group-hover:scale-110 transition-transform shadow-xs`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${trend.startsWith('+') ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        <p className="text-xl font-black text-slate-900 mt-1 font-mono">{value.toLocaleString()} <span className="text-[10px] font-bold text-slate-400">DZD</span></p>
        {subtext && <p className="text-[10px] text-slate-400 mt-1 font-medium italic">{subtext}</p>}
      </div>
    </div>
  );
};
