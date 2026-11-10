'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  UserCheck,
  UserPlus,
  ArrowRightLeft,
  CalendarDays,
  Clock,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building,
  FileText,
  BadgeCheck,
  Clock3,
  Calendar,
  Lock,
  Unlock,
  Eye,
  Edit,
  Save,
  ChevronRight,
  TrendingUp,
  HardHat,
  Briefcase,
  Layers,
  Sparkles,
  Check,
  X,
  Calculator,
  Printer,
  Download,
  CreditCard,
  DollarSign
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  Employe,
  CategorieProfessionnelle,
  TypeContrat,
  PointageStatut,
  DemandeDerogationPointage
} from '../types/database';

const CATEGORIE_LABELS: Record<CategorieProfessionnelle, string> = {
  CHEF_EQUIPE: 'Chef d’équipe gros-œuvre',
  MACON: 'Maçon qualifié',
  FERRAILLEUR: 'Ferrailleur',
  COFFREUR: 'Coffreur bancheur',
  CONDUCTEUR_ENGIN: 'Conducteur d’engins (Grue/Pelle)',
  MANOEUVRE: 'Manœuvre ordinaire',
  ELECTRICIEN: 'Électricien bâtiment',
  PLOMBIER: 'Plombier sanitaire',
  TOPOGRAPHE: 'Topographe BTP',
  SOUDEUR: 'Soudeur qualifié',
  PEINTRE: 'Peintre en bâtiment',
  ETANCHEUR: 'Étancheur',
  CADRE_ADMINISTRATIF: 'Cadre Administratif & Direction',
  INGENIEUR: 'Ingénieur d’Études / Génie Civil',
  COMPTABLE: 'Comptable / Gestionnaire Paie',
  JURISTE: 'Juriste d’Entreprise',
  ASSISTANT: 'Assistant(e) de Direction & RH',
  COMMERCIAL: 'Conseiller Commercial VEFA'
};

const CONTRAT_LABELS: Record<TypeContrat, string> = {
  CDD_CHANTIER: 'CDD de Chantier (Loi 90-11)',
  CDD: 'CDD Classique (Administration / Siège)',
  CDI: 'CDI (Contrat à Durée Indéterminée)',
  JOURNALIER: 'Tâcheron / Journalier',
  STAGE: 'Stage Professionnel / Insertion',
  APPRENTI: 'Contrat d’apprentissage BTP'
};

const CATEGORIES_CHANTIER: CategorieProfessionnelle[] = [
  'CHEF_EQUIPE',
  'MACON',
  'FERRAILLEUR',
  'COFFREUR',
  'CONDUCTEUR_ENGIN',
  'MANOEUVRE',
  'ELECTRICIEN',
  'PLOMBIER',
  'TOPOGRAPHE',
  'SOUDEUR',
  'PEINTRE',
  'ETANCHEUR'
];

const CATEGORIES_ADMINISTRATION: CategorieProfessionnelle[] = [
  'CADRE_ADMINISTRATIF',
  'INGENIEUR',
  'COMPTABLE',
  'JURISTE',
  'ASSISTANT',
  'COMMERCIAL'
];

const QUALIFICATIONS_CHANTIER = [
  { value: 'MAITRISE', label: 'Maîtrise / Chef d’équipe' },
  { value: 'HAUTEMENT_QUALIFIE', label: 'Hautement Qualifié (OHQ)' },
  { value: 'QUALIFIE', label: 'Qualifié (OQ)' },
  { value: 'SPECIALISE', label: 'Spécialisé (OS)' },
  { value: 'MANOEUVRE_ORDINAIRE', label: 'Manœuvre Ordinaire' }
];

const QUALIFICATIONS_ADMINISTRATION = [
  { value: 'CADRE_DIRIGEANT', label: 'Cadre Dirigeant / Direction' },
  { value: 'CADRE_SUPERIEUR', label: 'Cadre Supérieur / Chef de Service' },
  { value: 'INGENIEUR_ETUDES', label: 'Ingénieur d’Études / Génie Civil' },
  { value: 'MAITRISE', label: 'Agent de Maîtrise / Superviseur' },
  { value: 'TECHNICIEN_SUPERIEUR', label: 'Technicien Supérieur (TS)' },
  { value: 'AGENT_ADMINISTRATIF', label: 'Agent / Employé Administratif' }
];

const QUALIFICATION_LABELS: Record<string, string> = {
  QUALIFIE: 'Qualifié',
  HAUTEMENT_QUALIFIE: 'Hautement Qualifié',
  SPECIALISE: 'Spécialisé',
  MANOEUVRE_ORDINAIRE: 'Manœuvre Ordinaire',
  MAITRISE: 'Maîtrise / Chef d’équipe',
  CADRE_DIRIGEANT: 'Cadre Dirigeant',
  CADRE_SUPERIEUR: 'Cadre Supérieur',
  INGENIEUR_ETUDES: 'Ingénieur d’Études',
  TECHNICIEN_SUPERIEUR: 'Technicien Supérieur',
  AGENT_ADMINISTRATIF: 'Agent Administratif'
};

export const RHView: React.FC = () => {
  const {
    employes,
    addEmploye,
    updateEmploye,
    transfererEmploye,
    affectationsHistorique,
    congesAbsences,
    addCongeAbsence,
    updateCongeStatut,
    pointages,
    demandesDerogation,
    traiterDemandeDerogation,
    parametresGeneraux,
    allChantiers,
    currentUser,
    hasPermission,
    simulatedPointageTime,
    setSimulatedPointageTime
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'employes' | 'recrutement' | 'affectations' | 'conges' | 'pointages' | 'derogations' | 'paie'
  >('dashboard');

  // State Paie BTPH
  const [selectedMoisPaie, setSelectedMoisPaie] = useState<string>('2026-11');
  const [selectedEmployePaieModal, setSelectedEmployePaieModal] = useState<Employe | null>(null);

  // Helper Calcul Paie BTPH Algérie (CNAS 9%, CACOBATPH 0.75%, Barème IRG)
  const calculatePaieBTPH = (employe: Employe, joursTravailles = 22) => {
    const salaireBaseTotal = employe.salaire_base_dzd;
    const tauxJournalier = Math.round(salaireBaseTotal / 22);
    const salaireRealise = Math.round(tauxJournalier * Math.min(joursTravailles, 22));

    const primePanierDay = 350; // DZD par jour
    const primeTransportDay = 250; // DZD par jour
    const primePanierTotal = primePanierDay * Math.min(joursTravailles, 22);
    const primeTransportTotal = primeTransportDay * Math.min(joursTravailles, 22);
    const primeInsalubriteBTP = employe.categorie === 'MACON' || employe.categorie === 'COFFREUR' || employe.categorie === 'FERRAILLEUR' ? 4000 : 2500;

    const salaireBrut = salaireRealise + primePanierTotal + primeTransportTotal + primeInsalubriteBTP;

    // Assiette CNAS (Brut imposable CNAS - Panier & Transport non imposables dans la limite légale)
    const assietteCNAS = salaireRealise + primeInsalubriteBTP;
    const cnasSalarie9Pct = Math.round(assietteCNAS * 0.09);
    const cnasPatronal26Pct = Math.round(assietteCNAS * 0.26);
    const cacobatphPatronal075Pct = Math.round(assietteCNAS * 0.0075); // Cotisation Chômage Intempéries CACOBATPH

    // Assiette IRG = Salaire Brut - Cotisation CNAS Salarié 9%
    const assietteIRG = Math.max(0, salaireBrut - cnasSalarie9Pct);

    // Barème IRG Algérie
    let irgCalcule = 0;
    if (assietteIRG <= 30000) {
      irgCalcule = 0; // Exonération totale salaires <= 30 000 DZD
    } else if (assietteIRG <= 38000) {
      irgCalcule = Math.round((assietteIRG - 30000) * 0.20);
    } else {
      const tranche1 = (38000 - 30000) * 0.20; // 1600 DZD
      const tranche2 = (assietteIRG - 38000) * 0.30;
      let irgBrut = tranche1 + tranche2;
      let abattement = Math.min(1500, Math.max(1000, irgBrut * 0.40));
      irgCalcule = Math.max(0, Math.round(irgBrut - abattement));
    }

    const netAPayer = Math.round(salaireBrut - cnasSalarie9Pct - irgCalcule);

    return {
      joursTravailles,
      tauxJournalier,
      salaireRealise,
      primePanierTotal,
      primeTransportTotal,
      primeInsalubriteBTP,
      salaireBrut,
      assietteCNAS,
      cnasSalarie9Pct,
      cnasPatronal26Pct,
      cacobatphPatronal075Pct,
      assietteIRG,
      irgCalcule,
      netAPayer
    };
  };

  // Filtres Employés
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChantierFilter, setSelectedChantierFilter] = useState<string>('ALL');
  const [selectedCategorieFilter, setSelectedCategorieFilter] = useState<string>('ALL');

  // Modal Détails Employé
  const [selectedEmployeModal, setSelectedEmployeModal] = useState<Employe | null>(null);
  const [employeModalTab, setEmployeModalTab] = useState<'info' | 'contrat' | 'pieces' | 'affectations'>('info');

  // Modal Édition / Modification Employé
  const [editingEmploye, setEditingEmploye] = useState<Employe | null>(null);

  const handleUpdateEmployeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmploye) return;
    const isSiege = editingEmploye.chantier_actuel_id === 'siege';
    const targetChantierObj = allChantiers.find(c => c.id === editingEmploye.chantier_actuel_id);
    const updatedNomChantier = isSiege
      ? 'Siège Administratif (Alger)'
      : (targetChantierObj ? targetChantierObj.nom_projet : editingEmploye.chantier_actuel_nom);

    updateEmploye(editingEmploye.id, {
      ...editingEmploye,
      chantier_actuel_nom: updatedNomChantier
    });

    showToast(`Dossier du collaborateur ${editingEmploye.nom} ${editingEmploye.prenom} (${editingEmploye.matricule}) mis à jour avec succès.`);
    setEditingEmploye(null);
  };

  // Modal Transfert
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferTargetEmployeId, setTransferTargetEmployeId] = useState<string>('');
  const [transferChantierCibleId, setTransferChantierCibleId] = useState<string>('');
  const [transferMotif, setTransferMotif] = useState<string>('');
  const [transferDateEffet, setTransferDateEffet] = useState<string>(new Date().toISOString().split('T')[0]);

  // Modal Congé
  const [isCongeModalOpen, setIsCongeModalOpen] = useState(false);
  const [congeEmployeId, setCongeEmployeId] = useState('');
  const [congeType, setCongeType] = useState<'CONGE_PAYE' | 'MALADIE_CNAS' | 'ACCIDENT_TRAVAIL' | 'SANS_SOLDE' | 'EVENEMENT_FAMILIAL'>('CONGE_PAYE');
  const [congeDateDebut, setCongeDateDebut] = useState(new Date().toISOString().split('T')[0]);
  const [congeDateFin, setCongeDateFin] = useState(new Date().toISOString().split('T')[0]);
  const [congeNombreJours, setCongeNombreJours] = useState(3);
  const [congeMotif, setCongeMotif] = useState('');
  const [congeRefCnas, setCongeRefCnas] = useState('');

  // Modal Rejet Dérogation
  const [rejectionModalId, setRejectionModalId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Formulaire Recrutement
  const [recrutementType, setRecrutementType] = useState<'CHANTIER' | 'ADMINISTRATION'>('CHANTIER');

  const [recrutementForm, setRecrutementForm] = useState({
    nom: '',
    prenom: '',
    date_naissance: '1992-05-10',
    lieu_naissance: 'Alger',
    wilaya_naissance: 'Alger (16)',
    nationalite: 'Algérienne',
    nin: '119921600123456789',
    num_cnas: '16/920510001-44',
    groupe_sanguin: 'O+',
    telephone: '+213 550 00 00 00',
    adresse: 'Bouchaoui, Chéraga',
    commune: 'Chéraga',
    wilaya: 'Alger (16)',
    personne_urgence_nom: 'Fatima (Épouse)',
    personne_urgence_tel: '+213 661 00 00 00',
    categorie: 'MACON' as CategorieProfessionnelle,
    qualification: 'QUALIFIE',
    type_contrat: 'CDD_CHANTIER' as TypeContrat,
    date_embauche: new Date().toISOString().split('T')[0],
    date_fin_contrat: '2027-06-30',
    salaire_base_dzd: 60000,
    chantier_actuel_id: allChantiers[0]?.id || 'cht-001',
    documents_fournis: {
      carte_chifa_cnas: true,
      certificat_medical_aptitude: true,
      copie_cni_nin: true,
      attestation_travail_ou_diplome: true,
      photos_identite: true,
      fiche_anthropometrique: true
    }
  });

  // Basculer entre profil Chantier et profil Administration
  const handleSwitchRecrutementType = (type: 'CHANTIER' | 'ADMINISTRATION') => {
    setRecrutementType(type);
    if (type === 'ADMINISTRATION') {
      setRecrutementForm(prev => ({
        ...prev,
        categorie: 'CADRE_ADMINISTRATIF',
        qualification: 'CADRE_SUPERIEUR',
        type_contrat: 'CDI',
        chantier_actuel_id: 'siege',
        salaire_base_dzd: 120000
      }));
    } else {
      setRecrutementForm(prev => ({
        ...prev,
        categorie: 'MACON',
        qualification: 'QUALIFIE',
        type_contrat: 'CDD_CHANTIER',
        chantier_actuel_id: allChantiers[0]?.id || 'cht-001',
        salaire_base_dzd: 60000
      }));
    }
  };

  const [notificationMsg, setNotificationMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const showToast = (text: string, isError = false) => {
    setNotificationMsg({ text, isError });
    setTimeout(() => setNotificationMsg(null), 4500);
  };

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Dérogations en attente
  const pendingDerogations = useMemo(() => {
    return demandesDerogation.filter(d => d.statut_demande_approbation === 'EN_ATTENTE');
  }, [demandesDerogation]);

  // Pointages d'aujourd'hui
  const todayPointages = useMemo(() => {
    return pointages.filter(p => p.date === todayStr);
  }, [pointages, todayStr]);

  const stats = useMemo(() => {
    const totalEmployes = employes.length;
    const presents = todayPointages.filter(p => p.statut === 'PRESENT').length;
    const retards = todayPointages.filter(p => p.statut === 'RETARD').length;
    const absents = todayPointages.filter(p => p.statut === 'ABSENT_INJUSTIFIE' || p.statut === 'ABSENT_JUSTIFIE').length;
    const effectifPointe = todayPointages.length;
    const tauxPresence = effectifPointe > 0 ? Math.round(((presents + retards) / effectifPointe) * 100) : 0;

    return { totalEmployes, presents, retards, absents, tauxPresence, pendingDerogationsCount: pendingDerogations.length };
  }, [employes, todayPointages, pendingDerogations]);

  // Filtrage Employés
  const filteredEmployes = useMemo(() => {
    return employes.filter(emp => {
      const matchSearch =
        emp.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.matricule.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.nin.includes(searchQuery) ||
        emp.num_cnas.includes(searchQuery);

      const matchChantier = selectedChantierFilter === 'ALL' || emp.chantier_actuel_id === selectedChantierFilter;
      const matchCat = selectedCategorieFilter === 'ALL' || emp.categorie === selectedCategorieFilter;

      return matchSearch && matchChantier && matchCat;
    });
  }, [employes, searchQuery, selectedChantierFilter, selectedCategorieFilter]);

  // Soumission Recrutement
  const handleRecrutementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recrutementForm.nom || !recrutementForm.prenom) {
      showToast('Veuillez renseigner le nom et le prénom du candidat.', true);
      return;
    }

    const isAdministration = recrutementType === 'ADMINISTRATION' || recrutementForm.chantier_actuel_id === 'siege';
    const autoMatricule = isAdministration
      ? `EMP-ADM-${new Date().getFullYear()}-${String(employes.filter(e => e.chantier_actuel_id === 'siege').length + 1).padStart(3, '0')}`
      : `EMP-BTP-${new Date().getFullYear()}-${String(employes.filter(e => e.chantier_actuel_id !== 'siege').length + 1).padStart(3, '0')}`;

    const isSiege = recrutementForm.chantier_actuel_id === 'siege';
    const chantierNom = isSiege
      ? 'Siège Administratif (Alger)'
      : (allChantiers.find(c => c.id === recrutementForm.chantier_actuel_id)?.nom_projet || 'Chantier Terrain');

    addEmploye({
      entreprise_id: 'ent-001',
      matricule: autoMatricule,
      nom: recrutementForm.nom,
      prenom: recrutementForm.prenom,
      date_naissance: recrutementForm.date_naissance,
      lieu_naissance: recrutementForm.lieu_naissance,
      wilaya_naissance: recrutementForm.wilaya_naissance,
      nationalite: recrutementForm.nationalite,
      nin: recrutementForm.nin,
      num_cnas: recrutementForm.num_cnas,
      groupe_sanguin: recrutementForm.groupe_sanguin,
      telephone: recrutementForm.telephone,
      adresse: recrutementForm.adresse,
      commune: recrutementForm.commune,
      wilaya: recrutementForm.wilaya,
      personne_urgence_nom: recrutementForm.personne_urgence_nom,
      personne_urgence_tel: recrutementForm.personne_urgence_tel,
      categorie: recrutementForm.categorie,
      qualification: recrutementForm.qualification,
      type_contrat: recrutementForm.type_contrat,
      date_embauche: recrutementForm.date_embauche,
      date_fin_contrat: ['CDD_CHANTIER', 'CDD'].includes(recrutementForm.type_contrat) ? recrutementForm.date_fin_contrat : undefined,
      salaire_base_dzd: Number(recrutementForm.salaire_base_dzd),
      chantier_actuel_id: recrutementForm.chantier_actuel_id,
      chantier_actuel_nom: chantierNom,
      date_affectation_actuelle: recrutementForm.date_embauche,
      statut: 'ACTIF',
      documents_fournis: recrutementForm.documents_fournis
    });

    if (isSiege) {
      showToast(`Cadre / Agent ${recrutementForm.nom} ${recrutementForm.prenom} recruté avec succès (${autoMatricule}) et affecté au Siège Administratif.`);
    } else {
      showToast(`Personnel ${recrutementForm.nom} ${recrutementForm.prenom} recruté avec succès (${autoMatricule}) et affecté au chantier "${chantierNom}".`);
    }

    setRecrutementForm({
      nom: '',
      prenom: '',
      date_naissance: '1995-01-01',
      lieu_naissance: 'Alger',
      wilaya_naissance: 'Alger (16)',
      nationalite: 'Algérienne',
      nin: '',
      num_cnas: '',
      groupe_sanguin: 'O+',
      telephone: '',
      adresse: '',
      commune: '',
      wilaya: 'Alger (16)',
      personne_urgence_nom: '',
      personne_urgence_tel: '',
      categorie: isAdministration ? 'CADRE_ADMINISTRATIF' : 'MACON',
      qualification: isAdministration ? 'CADRE_SUPERIEUR' : 'QUALIFIE',
      type_contrat: isAdministration ? 'CDI' : 'CDD_CHANTIER',
      date_embauche: new Date().toISOString().split('T')[0],
      date_fin_contrat: '2027-06-30',
      salaire_base_dzd: isAdministration ? 120000 : 60000,
      chantier_actuel_id: isAdministration ? 'siege' : (allChantiers[0]?.id || 'cht-001'),
      documents_fournis: {
        carte_chifa_cnas: true,
        certificat_medical_aptitude: true,
        copie_cni_nin: true,
        attestation_travail_ou_diplome: true,
        photos_identite: true,
        fiche_anthropometrique: true
      }
    });

    setActiveTab('employes');
  };

  // Soumission Transfert
  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTargetEmployeId || !transferChantierCibleId) {
      showToast('Veuillez sélectionner un employé et un chantier cible.', true);
      return;
    }
    transfererEmploye(transferTargetEmployeId, transferChantierCibleId, transferMotif, transferDateEffet);
    setIsTransferModalOpen(false);
    showToast('Transfert d’ouvrier enregistré et notifié avec succès.');
    setTransferTargetEmployeId('');
    setTransferChantierCibleId('');
    setTransferMotif('');
  };

  // Soumission Congé
  const handleCongeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employes.find(e => e.id === congeEmployeId);
    if (!emp) {
      showToast('Veuillez sélectionner un employé.', true);
      return;
    }

    addCongeAbsence({
      employe_id: emp.id,
      employe_nom: `${emp.nom} ${emp.prenom}`,
      employe_matricule: emp.matricule,
      chantier_id: emp.chantier_actuel_id,
      type: congeType,
      date_debut: congeDateDebut,
      date_fin: congeDateFin,
      nombre_jours: Number(congeNombreJours),
      motif: congeMotif || 'Demande de congé',
      certificat_medical_ref: congeRefCnas || undefined,
      statut: 'EN_ATTENTE'
    });

    setIsCongeModalOpen(false);
    showToast('Demande de congé/absence enregistrée avec succès.');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notificationMsg && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium border transition-all ${
            notificationMsg.isError
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {notificationMsg.isError ? (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          )}
          <span>{notificationMsg.text}</span>
        </div>
      )}

      {/* En-tête du Module */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">
                  Ressources Humaines & Gestion du Personnel
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                  Responsable RH Exclusif
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilotage centralisé des effectifs BTP, gestion des contrats, dossiers CNAS, transferts inter-chantiers et validation des pointages.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('recrutement')}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-xs transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Recruter un ouvrier
            </button>
            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium shadow-xs transition-colors"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Nouveau transfert
            </button>
            <button
              onClick={() => setIsCongeModalOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-xs transition-colors"
            >
              <CalendarDays className="w-4 h-4" />
              Déclarer absence / congé
            </button>
          </div>
        </div>

        {/* Bannière de Clôture & Paramétrage */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-slate-600">
            <div className="flex items-center gap-1.5 font-medium">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Heure limite légale du pointage :</span>
              <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                {parametresGeneraux.heure_limite_pointage || '08:15'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>Au-delà de cette heure, la modification exige une dérogation RH.</span>
            </div>
          </div>

          {/* Outil de simulation rapide de l'heure */}
          <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="text-[11px] text-slate-500 font-medium">Heure simulée :</span>
            <button
              onClick={() => setSimulatedPointageTime('08:00')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                simulatedPointageTime === '08:00'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              08:00 (Avant clôture)
            </button>
            <button
              onClick={() => setSimulatedPointageTime('08:35')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                simulatedPointageTime === '08:35'
                  ? 'bg-rose-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              08:35 (Verrouillé post-clôture)
            </button>
          </div>
        </div>
      </div>

      {/* 4 KPI Cards Métriques Globales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Effectif Total BTP</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalEmployes}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Sur 3 chantiers en Algérie</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <HardHat className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Taux Présence du Jour</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.tauxPresence}%</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {stats.presents} présents • {stats.retards} retards
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Absences & Arrêts</p>
              <p className="text-2xl font-bold text-rose-600 mt-1">{stats.absents}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Injustifiées & CNAS</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('derogations')}
          className={`bg-white p-4 rounded-xl border cursor-pointer transition-all ${
            stats.pendingDerogationsCount > 0
              ? 'border-amber-300 bg-amber-50/40 hover:bg-amber-50'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Dérogations Post-Clôture</p>
                {stats.pendingDerogationsCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                )}
              </div>
              <p className={`text-2xl font-bold mt-1 ${stats.pendingDerogationsCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {stats.pendingDerogationsCount}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {stats.pendingDerogationsCount > 0 ? 'En attente de votre décision' : 'Toutes traitées'}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              stats.pendingDerogationsCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
            }`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Onglets de Navigation Principale */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto pb-1" aria-label="Tabs">
          {[
            { id: 'dashboard', label: 'Tableau de bord global', icon: TrendingUp },
            { id: 'employes', label: `Dossiers des employés (${employes.length})`, icon: Users },
            { id: 'recrutement', label: 'Recrutement & Embauche', icon: UserPlus },
            { id: 'affectations', label: 'Affectations & Transferts', icon: ArrowRightLeft },
            { id: 'conges', label: `Absences & Congés (${congesAbsences.length})`, icon: CalendarDays },
            { id: 'pointages', label: 'Supervision des pointages', icon: Clock3 },
            {
              id: 'derogations',
              label: 'Dérogations post-clôture',
              icon: ShieldAlert,
              badge: stats.pendingDerogationsCount
            },
            {
              id: 'paie',
              label: 'Bulletins de Paie BTPH (CNAS/IRG)',
              icon: Calculator
            }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-medium text-xs whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-lg font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-purple-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* CONTENU DE L'ONGLET SÉLECTIONNÉ */}

      {/* 1. TABLEAU DE BORD GLOBAL */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Répartition par Catégorie Professionnelle */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-purple-600" />
                Répartition des Effectifs par Catégorie Professionnelle BTP
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Structure des compétences et métiers mobilisés sur les chantiers de construction.
              </p>

              <div className="space-y-3">
                {Object.entries(CATEGORIE_LABELS).map(([catKey, catLabel]) => {
                  const count = employes.filter(e => e.categorie === catKey).length;
                  if (count === 0) return null;
                  const pct = Math.round((count / employes.length) * 100);

                  return (
                    <div key={catKey} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-700">{catLabel}</span>
                        <span className="text-slate-500 font-semibold">{count} ouvriers ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Effectifs par Chantier */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <Building className="w-4 h-4 text-emerald-600" />
                  Effectifs Affectés par Chantier
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Répartition géographique sur les projets immobiliers.
                </p>

                <div className="space-y-3">
                  {allChantiers.map(chantier => {
                    const siteCount = employes.filter(e => e.chantier_actuel_id === chantier.id).length;
                    const sitePointages = todayPointages.filter(p => p.chantier_id === chantier.id);
                    const presentsCount = sitePointages.filter(p => p.statut === 'PRESENT' || p.statut === 'RETARD').length;

                    return (
                      <div key={chantier.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/60">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{chantier.nom_projet}</span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            {siteCount} ouvriers
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                          <span>Wilaya : {chantier.wilaya}</span>
                          <span>Présents ajd : {presentsCount}/{siteCount}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setIsTransferModalOpen(true)}
                  className="w-full py-2 px-3 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  Transférer du personnel entre chantiers
                </button>
              </div>
            </div>
          </div>

          {/* Alertes Dérogations en Attente (si présentes) */}
          {pendingDerogations.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-amber-900">
                    {pendingDerogations.length} demande(s) d'autorisation post-clôture en attente de validation RH
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Des conducteurs de travaux ont sollicité des rectifications d'assiduité après l'heure limite légale ({parametresGeneraux.heure_limite_pointage}).
                  </p>
                  <div className="mt-3">
                    <button
                      onClick={() => setActiveTab('derogations')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white font-medium text-xs hover:bg-amber-700 transition-colors"
                    >
                      Examiner les demandes
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. DOSSIERS DES EMPLOYÉS (ANNUAIRE) */}
      {activeTab === 'employes' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Barres d'outils et de filtres */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row gap-3 justify-between items-center">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, matricule, NIN, CNAS..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={selectedChantierFilter}
                onChange={e => setSelectedChantierFilter(e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-medium"
              >
                <option value="ALL">Toutes les affectations (Siège & Chantiers)</option>
                <option value="siege">🏢 Siège Administratif (Cadres & Administration)</option>
                <optgroup label="Chantiers en cours">
                  {allChantiers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nom_projet} ({c.wilaya})
                    </option>
                  ))}
                </optgroup>
              </select>

              <select
                value={selectedCategorieFilter}
                onChange={e => setSelectedCategorieFilter(e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              >
                <option value="ALL">Tous les corps de métier</option>
                {Object.entries(CATEGORIE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tableau des Employés */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Matricule & Identité</th>
                  <th className="py-3 px-4">Catégorie & Métier</th>
                  <th className="py-3 px-4">Chantier Affecté</th>
                  <th className="py-3 px-4">Contrat & Salaire DZD</th>
                  <th className="py-3 px-4">Sécurité Sociale (CNAS)</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployes.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center shrink-0 text-xs">
                          {emp.prenom[0]}{emp.nom[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{emp.nom} {emp.prenom}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{emp.matricule}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{CATEGORIE_LABELS[emp.categorie]}</p>
                      <p className="text-[11px] text-slate-500">{emp.qualification}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <Building className="w-3 h-3 text-emerald-600" />
                        {emp.chantier_actuel_nom}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800">{CONTRAT_LABELS[emp.type_contrat]}</p>
                      <p className="text-[11px] font-bold text-purple-700">{emp.salaire_base_dzd.toLocaleString()} DZD/mois</p>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      <div>CNAS: {emp.num_cnas}</div>
                      <div className="text-[10px] text-slate-400">NIN: {emp.nin}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        emp.statut === 'ACTIF'
                          ? 'bg-emerald-100 text-emerald-800'
                          : emp.statut === 'EN_CONGE'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {emp.statut}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedEmployeModal(emp);
                            setEmployeModalTab('info');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-purple-100 hover:text-purple-700 text-slate-700 font-medium text-xs transition-colors"
                          title="Consulter le dossier complet"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Dossier
                        </button>
                        <button
                          onClick={() => setEditingEmploye(emp)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-medium text-xs transition-colors"
                          title="Modifier les informations"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Modifier
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredEmployes.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                      Aucun employé ne correspond aux critères de recherche.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. RECRUTEMENT & EMBAUCHE */}
      {activeTab === 'recrutement' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-4xl mx-auto space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 uppercase tracking-wider mb-1">
              <UserPlus className="w-4 h-4" />
              <span>Module Ressources Humaines • Recrutement</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Dossier de Recrutement & Embauche RH
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enregistrez un nouveau collaborateur de l'entreprise : ouvrier de chantier ou cadre / agent administratif du siège, avec contrat de travail et immatriculation CNAS.
            </p>
          </div>

          <form onSubmit={handleRecrutementSubmit} className="space-y-6">
            {/* SÉLECTEUR DE TYPOLOGIE : OUVRIER CHANTIER VS CADRE / AGENT ADMINISTRATION */}
            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                1. Typologie du Profil & Périmètre de Recrutement *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => handleSwitchRecrutementType('CHANTIER')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                    recrutementType === 'CHANTIER'
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                  }`}
                >
                  <div className={`p-2.5 rounded-lg shrink-0 ${
                    recrutementType === 'CHANTIER' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    <HardHat className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">Personnel de Chantier & Métiers BTP</h4>
                      {recrutementType === 'CHANTIER' && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.2 rounded-full">
                          Sélectionné
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Maçons, coffreurs, ferrailleurs, grutiers, chefs d'équipe, manœuvres. Affectation directe sur un chantier avec suivi du pointage par le conducteur de travaux.
                    </p>
                    <span className="inline-block mt-2 font-mono text-[10px] text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">
                      Matricule généré : EMP-BTP-2026-XXX
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => handleSwitchRecrutementType('ADMINISTRATION')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                    recrutementType === 'ADMINISTRATION'
                      ? 'border-purple-600 bg-purple-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                  }`}
                >
                  <div className={`p-2.5 rounded-lg shrink-0 ${
                    recrutementType === 'ADMINISTRATION' ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">Cadre & Agent d'Administration (Siège)</h4>
                      {recrutementType === 'ADMINISTRATION' && (
                        <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-2 py-0.2 rounded-full">
                          Sélectionné
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Cadres dirigeants, ingénieurs génie civil, comptables, juristes, assistants RH, conseillers commerciaux VEFA. Affectation au siège administratif central.
                    </p>
                    <span className="inline-block mt-2 font-mono text-[10px] text-purple-700 bg-purple-100/60 px-2 py-0.5 rounded">
                      Matricule généré : EMP-ADM-2026-XXX
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2 : ÉTAT CIVIL & IDENTITÉ */}
            <div className="pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 text-purple-700">
                2. État Civil & Identification Nationale (Algérie)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Nom du candidat *</label>
                  <input
                    type="text"
                    required
                    value={recrutementForm.nom}
                    onChange={e => setRecrutementForm({ ...recrutementForm, nom: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="ex: Zerrouki"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={recrutementForm.prenom}
                    onChange={e => setRecrutementForm({ ...recrutementForm, prenom: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="ex: Ahmed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Date de naissance</label>
                  <input
                    type="date"
                    value={recrutementForm.date_naissance}
                    onChange={e => setRecrutementForm({ ...recrutementForm, date_naissance: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Lieu & Wilaya de naissance</label>
                  <input
                    type="text"
                    value={recrutementForm.lieu_naissance}
                    onChange={e => setRecrutementForm({ ...recrutementForm, lieu_naissance: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                    placeholder="ex: Médéa (26) ou Alger"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">NIN (Identification Nationale - 18 chiffres) *</label>
                  <input
                    type="text"
                    required
                    value={recrutementForm.nin}
                    onChange={e => setRecrutementForm({ ...recrutementForm, nin: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg font-mono"
                    placeholder="119842600123456789"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">N° Sécurité Sociale (CNAS) *</label>
                  <input
                    type="text"
                    required
                    value={recrutementForm.num_cnas}
                    onChange={e => setRecrutementForm({ ...recrutementForm, num_cnas: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg font-mono"
                    placeholder="16/840612001-44"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Téléphone mobile de contact</label>
                  <input
                    type="text"
                    value={recrutementForm.telephone}
                    onChange={e => setRecrutementForm({ ...recrutementForm, telephone: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                    placeholder="+213 550 12 34 56"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Adresse de résidence</label>
                  <input
                    type="text"
                    value={recrutementForm.adresse}
                    onChange={e => setRecrutementForm({ ...recrutementForm, adresse: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                    placeholder="ex: Cité 500 logts, Chéraga"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Groupe Sanguin</label>
                  <select
                    value={recrutementForm.groupe_sanguin}
                    onChange={e => setRecrutementForm({ ...recrutementForm, groupe_sanguin: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 3 : POSTE, MÉTIER & QUALIFICATION */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 text-purple-700 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-purple-600" />
                <span>
                  3. {recrutementType === 'ADMINISTRATION' ? 'Fonction Administrative & Niveau Hiérarchique' : 'Métier BTP & Corps d’État Chantier'}
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {recrutementType === 'ADMINISTRATION' ? 'Fonction / Poste Administratif *' : 'Corps d’état / Métier BTP *'}
                  </label>
                  <select
                    value={recrutementForm.categorie}
                    onChange={e => setRecrutementForm({ ...recrutementForm, categorie: e.target.value as any })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white font-semibold text-slate-800"
                  >
                    {(recrutementType === 'ADMINISTRATION' ? CATEGORIES_ADMINISTRATION : CATEGORIES_CHANTIER).map(k => (
                      <option key={k} value={k}>
                        {CATEGORIE_LABELS[k]}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {recrutementType === 'ADMINISTRATION'
                      ? 'Profil cadre / agent affecté aux départements centraux (Direction, Comptabilité, RH, Juridique, Technique, Commercial).'
                      : 'Ouvrier ou technicien spécialisé affecté directement aux opérations de construction terrain.'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Niveau de qualification / Grade *</label>
                  <select
                    value={recrutementForm.qualification}
                    onChange={e => setRecrutementForm({ ...recrutementForm, qualification: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white font-semibold text-slate-800"
                  >
                    {(recrutementType === 'ADMINISTRATION' ? QUALIFICATIONS_ADMINISTRATION : QUALIFICATIONS_CHANTIER).map(q => (
                      <option key={q.value} value={q.value}>
                        {q.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Définit la grille de rémunération et la classification conventionnelle.
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 4 : MODALITÉS CONTRACTUELLES & RÉMUNÉRATION */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 text-purple-700">
                4. Modalités Contractuelles & Rémunération en Dinar Algérien (DZD)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Type de Contrat *</label>
                  <select
                    value={recrutementForm.type_contrat}
                    onChange={e => setRecrutementForm({ ...recrutementForm, type_contrat: e.target.value as any })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    {recrutementType === 'ADMINISTRATION' ? (
                      <>
                        <option value="CDI">CDI (Contrat à Durée Indéterminée)</option>
                        <option value="CDD">CDD (Contrat à Durée Déterminée)</option>
                        <option value="STAGE">Stage Professionnel / Insertion</option>
                      </>
                    ) : (
                      <>
                        <option value="CDD_CHANTIER">CDD de Chantier (Loi 90-11)</option>
                        <option value="CDI">CDI (Contrat à Durée Indéterminée)</option>
                        <option value="JOURNALIER">Journalier / Tâcheron</option>
                        <option value="APPRENTI">Contrat d'Apprentissage BTP</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Date d'embauche</label>
                  <input
                    type="date"
                    value={recrutementForm.date_embauche}
                    onChange={e => setRecrutementForm({ ...recrutementForm, date_embauche: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Date fin contrat {['CDD_CHANTIER', 'CDD'].includes(recrutementForm.type_contrat) ? '*' : '(Optionnel)'}
                  </label>
                  <input
                    type="date"
                    disabled={!['CDD_CHANTIER', 'CDD', 'STAGE'].includes(recrutementForm.type_contrat)}
                    value={recrutementForm.date_fin_contrat}
                    onChange={e => setRecrutementForm({ ...recrutementForm, date_fin_contrat: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Salaire brut mensuel de base (DZD) *</label>
                  <input
                    type="number"
                    required
                    value={recrutementForm.salaire_base_dzd}
                    onChange={e => setRecrutementForm({ ...recrutementForm, salaire_base_dzd: Number(e.target.value) })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg font-bold text-purple-700 font-mono"
                    placeholder="ex: 120000"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 5 : LIEU D'AFFECTATION & RATTACHEMENT OPÉRATIONNEL */}
            <div className={`p-4 rounded-xl border transition-all ${
              recrutementForm.chantier_actuel_id === 'siege'
                ? 'bg-purple-50/50 border-purple-200'
                : 'bg-emerald-50/50 border-emerald-200'
            }`}>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 text-slate-900">
                <Building className="w-4 h-4 text-purple-700" />
                <span>5. Lieu d'Affectation & Rattachement Hiérarchique *</span>
              </h3>
              <p className="text-xs text-slate-600 mb-3">
                Sélectionnez l'entité où exercera le collaborateur (Siège administratif central ou l'un des chantiers actifs).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Entité d'affectation *</label>
                  <select
                    value={recrutementForm.chantier_actuel_id}
                    onChange={e => setRecrutementForm({ ...recrutementForm, chantier_actuel_id: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white font-bold text-slate-900"
                  >
                    <option value="siege">🏢 Siège Administratif & Direction Centrale (Alger)</option>
                    <optgroup label="Chantiers Opérationnels Terrain">
                      {allChantiers.map(c => (
                        <option key={c.id} value={c.id}>
                          🏗️ {c.nom_projet} ({c.wilaya})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div className="flex items-center text-xs p-3 rounded-lg bg-white border border-slate-200">
                  <CheckCircle2 className={`w-4 h-4 mr-2 shrink-0 ${
                    recrutementForm.chantier_actuel_id === 'siege' ? 'text-purple-600' : 'text-emerald-600'
                  }`} />
                  <div>
                    {recrutementForm.chantier_actuel_id === 'siege' ? (
                      <div>
                        <strong className="text-purple-900 font-bold block">Affectation Siège & Direction</strong>
                        <span className="text-slate-500 text-[11px]">
                          Le collaborateur apparaîtra dans le pointage administratif central sous la supervision directe du Responsable RH.
                        </span>
                      </div>
                    ) : (
                      <div>
                        <strong className="text-emerald-900 font-bold block">Affectation Chantier Terrain</strong>
                        <span className="text-slate-500 text-[11px]">
                          Le collaborateur apparaîtra dans la feuille de pointage du conducteur de travaux sur le chantier concerné.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 6 : DOSSIER ADMINISTRATIF & CONFORMITÉ */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 text-purple-700">
                6. Dossier Administratif & Conformité Réglementaire
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Pièces justificatives vérifiées et versées au dossier personnel du collaborateur.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {Object.entries({
                  carte_chifa_cnas: 'Carte Chifa / Affiliation CNAS',
                  certificat_medical_aptitude: recrutementType === 'ADMINISTRATION' ? 'Certificat médical d’aptitude au poste' : 'Certificat médical d’aptitude BTP',
                  copie_cni_nin: 'Copie Carte Nationale d’Identité (NIN)',
                  attestation_travail_ou_diplome: recrutementType === 'ADMINISTRATION' ? 'Diplôme universitaire / Ingénieur' : 'Diplôme ou Certificat de travail',
                  photos_identite: '2 Photos d’identité récentes',
                  fiche_anthropometrique: 'Fiche anthropométrique / Casier n°3'
                }).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={(recrutementForm.documents_fournis as any)[key]}
                      onChange={e =>
                        setRecrutementForm({
                          ...recrutementForm,
                          documents_fournis: {
                            ...recrutementForm.documents_fournis,
                            [key]: e.target.checked
                          }
                        })
                      }
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-[11px] text-slate-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* BOUTONS D'ACTION */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                L'embauche déclenche la création du dossier et l'inscription sur le registre employeur.
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('employes')}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-all hover:shadow"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    Valider le Recrutement ({recrutementType === 'ADMINISTRATION' ? 'Cadre / Agent Siège' : 'Personnel Chantier'})
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* 4. AFFECTATIONS & TRANSFERTS INTER-CHANTIERS */}
      {activeTab === 'affectations' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-purple-600" />
                  Historique Exhaustif des Mutations & Transferts Inter-Chantiers
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Traçabilité immuable des mouvements de personnel entre les projets de construction.
                </p>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium shadow-xs transition-colors"
              >
                <ArrowRightLeft className="w-4 h-4" />
                Effectuer une nouvelle mutation
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-3">Date d'Effet</th>
                    <th className="py-2.5 px-3">Ouvrier & Matricule</th>
                    <th className="py-2.5 px-3">Chantier d'Origine</th>
                    <th className="py-2.5 px-3">Chantier de Destination</th>
                    <th className="py-2.5 px-3">Motif Opérationnel</th>
                    <th className="py-2.5 px-3">Validé par</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {affectationsHistorique.map(aff => (
                    <tr key={aff.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-700">
                        {aff.date_effet}
                      </td>
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-slate-900">{aff.employe_nom}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{aff.employe_matricule}</p>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {aff.chantier_source_nom || <span className="text-slate-400 italic">Affectation initiale</span>}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {aff.chantier_cible_nom}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 max-w-xs truncate" title={aff.motif}>
                        {aff.motif}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                        {aff.valide_par_nom}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. GESTION DES ABSENCES & CONGÉS */}
      {activeTab === 'conges' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-purple-600" />
                Gestion des Congés, Arrêts de Travail & Visas Médicaux CNAS
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Validation des congés payés, arrêts maladie et événements familiaux des ouvriers.
              </p>
            </div>
            <button
              onClick={() => setIsCongeModalOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-xs transition-colors"
            >
              <CalendarDays className="w-4 h-4" />
              Nouvelle demande de congé
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3">Ouvrier</th>
                  <th className="py-2.5 px-3">Type d'Absence</th>
                  <th className="py-2.5 px-3">Période</th>
                  <th className="py-2.5 px-3">Durée</th>
                  <th className="py-2.5 px-3">Motif / Réf CNAS</th>
                  <th className="py-2.5 px-3">Statut</th>
                  <th className="py-2.5 px-3 text-right">Décision RH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {congesAbsences.map(cng => (
                  <tr key={cng.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3">
                      <p className="font-bold text-slate-900">{cng.employe_nom}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{cng.employe_matricule}</p>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {cng.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                      du {cng.date_debut} au {cng.date_fin}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">
                      {cng.nombre_jours} jour(s)
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                      {cng.motif}
                      {cng.certificat_medical_ref && (
                        <span className="block text-[10px] font-mono text-purple-700">
                          Visa: {cng.certificat_medical_ref}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        cng.statut === 'VALIDE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : cng.statut === 'REFUSE'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {cng.statut}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {cng.statut === 'EN_ATTENTE' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              updateCongeStatut(cng.id, 'VALIDE');
                              showToast(`Demande de congé pour ${cng.employe_nom} validée.`);
                            }}
                            className="p-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800"
                            title="Valider"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              updateCongeStatut(cng.id, 'REFUSE');
                              showToast(`Demande de congé refusée.`);
                            }}
                            className="p-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-800"
                            title="Refuser"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          Traité par {cng.valide_par_nom || 'RH'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. SUPERVISION CENTRALISÉE DES POINTAGES */}
      {activeTab === 'pointages' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock3 className="w-4 h-4 text-purple-600" />
                Supervision Centralisée des Feuilles de Pointage Journalier (Multi-Chantiers)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Consolidation des données enregistrées par les conducteurs de travaux sur le terrain.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                Date : {todayStr}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3">Chantier</th>
                  <th className="py-2.5 px-3">Ouvrier & Matricule</th>
                  <th className="py-2.5 px-3">Statut Pointé</th>
                  <th className="py-2.5 px-3">Heure d'Entrée</th>
                  <th className="py-2.5 px-3">Heures Validées</th>
                  <th className="py-2.5 px-3">Observations Terrain</th>
                  <th className="py-2.5 px-3">Saisi par</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {todayPointages.map(ptg => {
                  const chantier = allChantiers.find(c => c.id === ptg.chantier_id);
                  return (
                    <tr key={ptg.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {chantier?.nom_projet || ptg.chantier_id}
                      </td>
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-slate-800">{ptg.employe_nom}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{ptg.employe_matricule}</p>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ptg.statut === 'PRESENT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ptg.statut === 'RETARD'
                            ? 'bg-amber-100 text-amber-800'
                            : ptg.statut === 'ABSENT_INJUSTIFIE'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {ptg.statut === 'PRESENT' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {ptg.statut === 'RETARD' && <Clock className="w-3 h-3 text-amber-600" />}
                          {ptg.statut === 'ABSENT_INJUSTIFIE' && <XCircle className="w-3 h-3 text-rose-600" />}
                          {ptg.statut}
                          {ptg.minutes_retard ? ` (+${ptg.minutes_retard}m)` : ''}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                        {ptg.heure_arrivee || '--:--'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">
                        {ptg.heures_travaillees}h
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={ptg.observations}>
                        {ptg.observations || <span className="text-slate-400 italic">Aucune</span>}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                        {ptg.saisi_par_nom}
                      </td>
                    </tr>
                  );
                })}

                {todayPointages.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                      Aucun pointage enregistré pour cette date.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. DÉROGATIONS POST-CLÔTURE DU POINTAGE */}
      {activeTab === 'derogations' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                Demandes d'Autorisation de Modification de Pointage Post-Clôture
              </h3>
              <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-bold">
                {pendingDerogations.length} en attente
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Conformément à la politique RH de BatiProm Algérie, toute modification soumise après l'heure de clôture ({parametresGeneraux.heure_limite_pointage}) doit être motivée et validée par le Responsable RH. L'Administrateur reçoit une copie d'information de chaque décision.
            </p>
          </div>

          <div className="space-y-4">
            {demandesDerogation.map(derogation => {
              const isPending = derogation.statut_demande_approbation === 'EN_ATTENTE';

              return (
                <div
                  key={derogation.id}
                  className={`bg-white rounded-xl border p-5 shadow-xs transition-all ${
                    isPending
                      ? 'border-amber-300 ring-1 ring-amber-200'
                      : derogation.statut_demande_approbation === 'VALIDEE'
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">
                          {derogation.employe_nom}
                        </span>
                        <span className="text-slate-400 font-mono text-xs">({derogation.employe_matricule})</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-xs">
                          {derogation.chantier_nom}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-500 font-mono">Date : {derogation.date_pointage}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div>
                          <span className="text-slate-500">Statut initial clôturé : </span>
                          <span className="font-bold text-rose-700">{derogation.statut_actuel}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Statut sollicité : </span>
                          <span className="font-bold text-emerald-700">
                            {derogation.statut_demande}
                            {derogation.heure_arrivee_demandee ? ` (Arrivée à ${derogation.heure_arrivee_demandee})` : ''}
                          </span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-slate-500">Demandeur : </span>
                          <span className="font-medium text-slate-800">
                            {derogation.demandeur_nom} ({derogation.demandeur_role})
                          </span>
                        </div>
                        <div className="sm:col-span-2 pt-1 border-t border-slate-200">
                          <span className="text-slate-500 block font-semibold mb-0.5">Motif circonstancié :</span>
                          <p className="text-slate-800 italic bg-white p-2 rounded border border-slate-200">
                            « {derogation.motif_demande} »
                          </p>
                        </div>
                      </div>

                      {derogation.motif_refus && (
                        <div className="text-xs text-rose-800 bg-rose-50 p-2.5 rounded border border-rose-200">
                          <strong>Motif du rejet par le RH :</strong> {derogation.motif_refus}
                        </div>
                      )}
                    </div>

                    {/* Actions de validation ou Statut */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        isPending
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : derogation.statut_demande_approbation === 'VALIDEE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {derogation.statut_demande_approbation}
                      </span>

                      {isPending ? (
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => {
                              traiterDemandeDerogation(derogation.id, 'VALIDER');
                              showToast(`Dérogation validée pour ${derogation.employe_nom}. Le pointage a été corrigé et l'administrateur informé.`);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Valider la dérogation
                          </button>
                          <button
                            onClick={() => {
                              setRejectionModalId(derogation.id);
                              setRejectionReason('');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-semibold transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            Refuser
                          </button>
                        </div>
                      ) : (
                        <div className="text-right text-[11px] text-slate-400 mt-1">
                          Décision prise par {derogation.traite_par_nom || 'RH'}
                          <br />
                          {derogation.date_traitement?.split('T')[0]}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {demandesDerogation.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
                Aucune demande de dérogation enregistrée.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. BULLETINS DE PAIE BTPH (CNAS, CACOBATPH, BARÈME IRG ALGÉRIE) */}
      {activeTab === 'paie' && (
        <div className="space-y-6">
          {/* Header Paie */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 uppercase tracking-wider mb-1">
                <Calculator className="w-4 h-4" />
                <span>Calculateur de Paie BTPH & Cotisations Sociales Algérie</span>
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                Bulletins de Paie Mensuels, Déclarations CNAS & CACOBATPH
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
                Calcul automatique basé sur les pointages réels, avec application stricte des retenues CNAS (9%), des cotisations CACOBATPH (0.75%), des indemnités de panier/transport BTP et du barème IRG 2026.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600">Période de Paie :</span>
              <select
                value={selectedMoisPaie}
                onChange={e => setSelectedMoisPaie(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-purple-900 focus:ring-2 focus:ring-purple-500"
              >
                <option value="2026-11">Novembre 2026 (En cours)</option>
                <option value="2026-10">Octobre 2026 (Clôturé)</option>
                <option value="2026-09">Septembre 2026 (Clôturé)</option>
              </select>
            </div>
          </div>

          {/* Synthèse globale Masse Salariale du mois */}
          {(() => {
            let totalBrut = 0;
            let totalCnas9 = 0;
            let totalCnas26 = 0;
            let totalCacobatph = 0;
            let totalIrg = 0;
            let totalNet = 0;

            employes.forEach(emp => {
              const paie = calculatePaieBTPH(emp);
              totalBrut += paie.salaireBrut;
              totalCnas9 += paie.cnasSalarie9Pct;
              totalCnas26 += paie.cnasPatronal26Pct;
              totalCacobatph += paie.cacobatphPatronal075Pct;
              totalIrg += paie.irgCalcule;
              totalNet += paie.netAPayer;
            });

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1">
                  <div className="text-slate-500 font-semibold uppercase text-[10px]">Masse Salariale Brut</div>
                  <div className="text-xl font-bold text-slate-900">{totalBrut.toLocaleString()} DZD</div>
                  <div className="text-[11px] text-slate-400">Pour {employes.length} salariés BTP</div>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1">
                  <div className="text-slate-500 font-semibold uppercase text-[10px]">Cotisations CNAS (9% + 26%)</div>
                  <div className="text-xl font-bold text-blue-700 font-mono">{(totalCnas9 + totalCnas26).toLocaleString()} DZD</div>
                  <div className="text-[11px] text-blue-600">Salarié : {totalCnas9.toLocaleString()} • Patronal : {totalCnas26.toLocaleString()}</div>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1">
                  <div className="text-slate-500 font-semibold uppercase text-[10px]">CACOBATPH (Intempéries BTP)</div>
                  <div className="text-xl font-bold text-emerald-700 font-mono">{totalCacobatph.toLocaleString()} DZD</div>
                  <div className="text-[11px] text-emerald-600">Cotisation chômage intempéries (0.75%)</div>
                </div>

                <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl shadow-xs space-y-1">
                  <div className="text-purple-700 font-semibold uppercase text-[10px]">Total Net à Verser Aux Salariés</div>
                  <div className="text-xl font-bold text-purple-950 font-mono">{totalNet.toLocaleString()} DZD</div>
                  <div className="text-[11px] text-purple-800">Retenues IRG Totales : {totalIrg.toLocaleString()} DZD</div>
                </div>
              </div>
            );
          })()}

          {/* Tableau des Bulletins de Paie du Personnel */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-xs">
                État Récapitulatif de la Paie du Personnel - Mois de {selectedMoisPaie}
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">
                Conforme au barème IRG 2026 & Décret d'exemption salaires &le; 30 000 DZD
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-3">Employé & Matricule</th>
                    <th className="py-2.5 px-3">Chantier</th>
                    <th className="py-2.5 px-3">Jours Pointés</th>
                    <th className="py-2.5 px-3">Salaire de Base</th>
                    <th className="py-2.5 px-3">Primes BTP (Panier/Transp)</th>
                    <th className="py-2.5 px-3">CNAS (9%)</th>
                    <th className="py-2.5 px-3">IRG (Barème)</th>
                    <th className="py-2.5 px-3">Net à Payer (DZD)</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employes.map(emp => {
                    const paie = calculatePaieBTPH(emp);
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">
                          <p className="font-bold text-slate-900">{emp.nom} {emp.prenom}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{emp.matricule} • CNAS: {emp.num_cnas}</p>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-700">
                          {emp.chantier_actuel_nom}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {paie.joursTravailles} / 22 jours
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-800">
                          {emp.salaire_base_dzd.toLocaleString()} DZD
                        </td>
                        <td className="py-2.5 px-3 font-mono text-emerald-700">
                          +{(paie.primePanierTotal + paie.primeTransportTotal + paie.primeInsalubriteBTP).toLocaleString()} DZD
                        </td>
                        <td className="py-2.5 px-3 font-mono text-rose-700">
                          -{paie.cnasSalarie9Pct.toLocaleString()} DZD
                        </td>
                        <td className="py-2.5 px-3 font-mono text-amber-700">
                          -{paie.irgCalcule.toLocaleString()} DZD
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-purple-900 text-sm">
                          {paie.netAPayer.toLocaleString()} DZD
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => setSelectedEmployePaieModal(emp)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-[11px] border border-purple-200 transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Fiche de Paie
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL : BULLETIN DE PAIE INDIVIDUEL (IMPRIMABLE) */}
      {selectedEmployePaieModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 text-xs space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Action Bar */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-700" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Bulletin de Paie Officiel - Mois de {selectedMoisPaie}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Imprimer le bulletin
                </button>
                <button
                  onClick={() => setSelectedEmployePaieModal(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Payslip Document Body */}
            {(() => {
              const paie = calculatePaieBTPH(selectedEmployePaieModal);
              return (
                <div className="border border-slate-300 rounded-xl p-6 bg-white space-y-4 font-sans text-slate-900">
                  {/* Company Header */}
                  <div className="flex justify-between items-start border-b border-slate-300 pb-3">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">BATIPROM ALGÉRIE (SPA)</h4>
                      <p className="text-[11px] text-slate-600">Promotion Immobilière & BTPH</p>
                      <p className="text-[10px] text-slate-500 font-mono">Agrément Ministériel : AGR-MHUV-16-2018-0412</p>
                      <p className="text-[10px] text-slate-500 font-mono">NIF: 001816012345678 • RC: 16/00-0041235B16</p>
                    </div>
                    <div className="text-right">
                      <h5 className="font-extrabold text-purple-900 text-sm uppercase tracking-wide">BULLETIN DE PAIE</h5>
                      <p className="text-xs font-mono font-bold text-slate-700">Période : {selectedMoisPaie}</p>
                    </div>
                  </div>

                  {/* Employee Info Box */}
                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Nom & Prénom du Salarié</span>
                      <strong className="text-slate-900 text-xs">{selectedEmployePaieModal.nom} {selectedEmployePaieModal.prenom}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Matricule & Poste</span>
                      <strong className="text-slate-900 font-mono">{selectedEmployePaieModal.matricule} • {CATEGORIE_LABELS[selectedEmployePaieModal.categorie]}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">N° Sécurité Sociale (CNAS)</span>
                      <strong className="text-purple-800 font-mono">{selectedEmployePaieModal.num_cnas}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Chantier d'Imputation</span>
                      <strong className="text-emerald-800">{selectedEmployePaieModal.chantier_actuel_nom}</strong>
                    </div>
                  </div>

                  {/* Pay Table Breakdown */}
                  <table className="w-full text-left border-collapse text-xs border border-slate-200">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Rubrique de Paie</th>
                        <th className="py-2 px-3 text-center">Base / Nbre</th>
                        <th className="py-2 px-3 text-right">Gains (DZD)</th>
                        <th className="py-2 px-3 text-right">Retenues (DZD)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="py-1.5 px-3 font-medium">Salaire de Base Mensuel</td>
                        <td className="py-1.5 px-3 text-center font-mono">{paie.joursTravailles} jours</td>
                        <td className="py-1.5 px-3 text-right font-mono font-semibold">{paie.salaireRealise.toLocaleString()}</td>
                        <td className="py-1.5 px-3 text-right font-mono text-slate-400">-</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 font-medium">Indemnité de Panier BTP (350 DZD/j)</td>
                        <td className="py-1.5 px-3 text-center font-mono">{paie.joursTravailles} jours</td>
                        <td className="py-1.5 px-3 text-right font-mono font-semibold">{paie.primePanierTotal.toLocaleString()}</td>
                        <td className="py-1.5 px-3 text-right font-mono text-slate-400">-</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 font-medium">Indemnité de Transport (250 DZD/j)</td>
                        <td className="py-1.5 px-3 text-center font-mono">{paie.joursTravailles} jours</td>
                        <td className="py-1.5 px-3 text-right font-mono font-semibold">{paie.primeTransportTotal.toLocaleString()}</td>
                        <td className="py-1.5 px-3 text-right font-mono text-slate-400">-</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 font-medium">Prime de Risque & Insalubrité BTP</td>
                        <td className="py-1.5 px-3 text-center font-mono">Forfait</td>
                        <td className="py-1.5 px-3 text-right font-mono font-semibold">{paie.primeInsalubriteBTP.toLocaleString()}</td>
                        <td className="py-1.5 px-3 text-right font-mono text-slate-400">-</td>
                      </tr>
                      <tr className="bg-rose-50/50">
                        <td className="py-1.5 px-3 font-medium text-rose-900">Cotisation Sécurité Sociale CNAS (9%)</td>
                        <td className="py-1.5 px-3 text-center font-mono text-rose-700">9%</td>
                        <td className="py-1.5 px-3 text-right font-mono text-slate-400">-</td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold text-rose-700">-{paie.cnasSalarie9Pct.toLocaleString()}</td>
                      </tr>
                      <tr className="bg-amber-50/50">
                        <td className="py-1.5 px-3 font-medium text-amber-900">Impôt sur le Revenu Global (IRG Barème 2026)</td>
                        <td className="py-1.5 px-3 text-center font-mono text-amber-700">Barème</td>
                        <td className="py-1.5 px-3 text-right font-mono text-slate-400">-</td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold text-amber-700">-{paie.irgCalcule.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Summary Totals */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Total Brut :</span>
                        <strong className="font-mono">{paie.salaireBrut.toLocaleString()} DZD</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Assiette CNAS Imposable :</span>
                        <strong className="font-mono">{paie.assietteCNAS.toLocaleString()} DZD</strong>
                      </div>
                      <div className="flex justify-between text-blue-700">
                        <span>Cotisation Patronale CNAS (26%) :</span>
                        <strong className="font-mono">{paie.cnasPatronal26Pct.toLocaleString()} DZD</strong>
                      </div>
                      <div className="flex justify-between text-emerald-700">
                        <span>Cotisation CACOBATPH (0.75%) :</span>
                        <strong className="font-mono">{paie.cacobatphPatronal075Pct.toLocaleString()} DZD</strong>
                      </div>
                    </div>

                    <div className="p-4 bg-purple-900 text-white rounded-lg flex flex-col justify-between shadow-sm">
                      <span className="text-purple-200 text-xs font-semibold uppercase">Net à Payer Salarié</span>
                      <div className="text-2xl font-extrabold font-mono text-amber-300">
                        {paie.netAPayer.toLocaleString()} DZD
                      </div>
                      <span className="text-[10px] text-purple-200">Payable par Virement / Chèque bancaire</span>
                    </div>
                  </div>

                  {/* Signature Box */}
                  <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-300 text-[11px]">
                    <div className="text-center p-3 border border-dashed border-slate-300 rounded-lg">
                      <span className="font-bold text-slate-700 block mb-8">Visa & Cachet Direction RH / BatiProm</span>
                      <span className="text-[9px] text-slate-400">Signature de l'Employeur</span>
                    </div>
                    <div className="text-center p-3 border border-dashed border-slate-300 rounded-lg">
                      <span className="font-bold text-slate-700 block mb-8">Émargement / Empreinte du Salarié</span>
                      <span className="text-[9px] text-slate-400">Reçu le salaire net mentionné</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL : DOSSIER COMPLET EMPLOYÉ */}
      {selectedEmployeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl">
            {/* Header Modal */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-sm">
                  {selectedEmployeModal.prenom[0]}{selectedEmployeModal.nom[0]}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {selectedEmployeModal.nom} {selectedEmployeModal.prenom}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Matricule : {selectedEmployeModal.matricule} • {CATEGORIE_LABELS[selectedEmployeModal.categorie]}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmployeModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Onglets Modal */}
            <div className="px-5 pt-3 border-b border-slate-200 flex gap-4 text-xs font-semibold">
              <button
                onClick={() => setEmployeModalTab('info')}
                className={`pb-2 border-b-2 ${employeModalTab === 'info' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500'}`}
              >
                1. Identité & État Civil
              </button>
              <button
                onClick={() => setEmployeModalTab('contrat')}
                className={`pb-2 border-b-2 ${employeModalTab === 'contrat' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500'}`}
              >
                2. Contrat & Salaire
              </button>
              <button
                onClick={() => setEmployeModalTab('pieces')}
                className={`pb-2 border-b-2 ${employeModalTab === 'pieces' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500'}`}
              >
                3. Pièces Administratives
              </button>
              <button
                onClick={() => setEmployeModalTab('affectations')}
                className={`pb-2 border-b-2 ${employeModalTab === 'affectations' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500'}`}
              >
                4. Historique Affectations
              </button>
            </div>

            {/* Contenu de la fiche */}
            <div className="p-5 text-xs space-y-4">
              {employeModalTab === 'info' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 block">Date et lieu de naissance :</span>
                    <span className="font-semibold text-slate-800">{selectedEmployeModal.date_naissance} à {selectedEmployeModal.lieu_naissance} ({selectedEmployeModal.wilaya_naissance})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Nationalité :</span>
                    <span className="font-semibold text-slate-800">{selectedEmployeModal.nationalite}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">NIN (18 chiffres) :</span>
                    <span className="font-mono font-bold text-slate-900">{selectedEmployeModal.nin}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">N° CNAS :</span>
                    <span className="font-mono font-bold text-purple-700">{selectedEmployeModal.num_cnas}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Groupe Sanguin :</span>
                    <span className="font-bold text-slate-800">{selectedEmployeModal.groupe_sanguin || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Téléphone personnel :</span>
                    <span className="font-semibold text-slate-800">{selectedEmployeModal.telephone}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block">Adresse de résidence :</span>
                    <span className="font-semibold text-slate-800">{selectedEmployeModal.adresse}, {selectedEmployeModal.commune} ({selectedEmployeModal.wilaya})</span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-100">
                    <span className="text-slate-400 block">Contact en cas d'urgence :</span>
                    <span className="font-semibold text-slate-800">{selectedEmployeModal.personne_urgence_nom} - Tél: {selectedEmployeModal.personne_urgence_tel}</span>
                  </div>
                </div>
              )}

              {employeModalTab === 'contrat' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 block">Type de Contrat :</span>
                    <span className="font-bold text-slate-800">{CONTRAT_LABELS[selectedEmployeModal.type_contrat]}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Qualification :</span>
                    <span className="font-semibold text-slate-800">{selectedEmployeModal.qualification}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Date d'embauche :</span>
                    <span className="font-semibold text-slate-800">{selectedEmployeModal.date_embauche}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Échéance du contrat :</span>
                    <span className="font-semibold text-slate-800">{selectedEmployeModal.date_fin_contrat || 'Indéterminée (CDI)'}</span>
                  </div>
                  <div className="col-span-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <span className="text-purple-700 block text-xs">Salaire de Base Mensuel :</span>
                    <span className="text-xl font-bold text-purple-900">{selectedEmployeModal.salaire_base_dzd.toLocaleString()} DZD</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block">Chantier d'affectation actuel :</span>
                    <span className="font-bold text-emerald-800">{selectedEmployeModal.chantier_actuel_nom} (Depuis le {selectedEmployeModal.date_affectation_actuelle})</span>
                  </div>
                </div>
              )}

              {employeModalTab === 'pieces' && (
                <div className="space-y-2">
                  {Object.entries({
                    carte_chifa_cnas: 'Carte Chifa / Immatriculation CNAS',
                    certificat_medical_aptitude: 'Certificat médical d’aptitude aux travaux BTP',
                    copie_cni_nin: 'Copie Carte Nationale d’Identité Biométrique',
                    attestation_travail_ou_diplome: 'Attestation de travail / Diplôme professionnel',
                    photos_identite: 'Photos d’identité conformes',
                    fiche_anthropometrique: 'Fiche anthropométrique'
                  }).map(([key, label]) => {
                    const isProvided = (selectedEmployeModal.documents_fournis as any)[key];
                    return (
                      <div key={key} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                        <span className="text-slate-700">{label}</span>
                        {isProvided ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            Fourni & Conforme
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                            <X className="w-3.5 h-3.5 text-rose-600" />
                            Manquant
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {employeModalTab === 'affectations' && (
                <div className="space-y-3">
                  {affectationsHistorique
                    .filter(a => a.employe_id === selectedEmployeModal.id)
                    .map(aff => (
                      <div key={aff.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{aff.chantier_cible_nom}</span>
                          <span className="font-mono text-[11px] text-slate-500">{aff.date_effet}</span>
                        </div>
                        <p className="text-slate-600 mt-1">{aff.motif}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Validé par : {aff.valide_par_nom}</p>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setTransferTargetEmployeId(selectedEmployeModal.id);
                    setSelectedEmployeModal(null);
                    setIsTransferModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-white font-medium text-xs hover:bg-slate-900 transition-colors flex items-center gap-1.5"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  Transférer vers un autre chantier
                </button>
                <button
                  onClick={() => {
                    setEditingEmploye(selectedEmployeModal);
                    setSelectedEmployeModal(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 text-white font-semibold text-xs hover:bg-purple-700 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Modifier les informations
                </button>
              </div>

              <button
                onClick={() => setSelectedEmployeModal(null)}
                className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-medium text-xs hover:bg-white"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL : MODIFICATION / ÉDITION DOSSIER EMPLOYÉ */}
      {editingEmploye && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Modifier le dossier de {editingEmploye.nom} {editingEmploye.prenom}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Matricule : {editingEmploye.matricule} • N° CNAS : {editingEmploye.num_cnas}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingEmploye(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateEmployeSubmit} className="space-y-5 text-xs">
              {/* Section 1: État civil */}
              <div>
                <h4 className="font-bold text-purple-800 uppercase tracking-wider mb-2 text-[11px]">
                  1. État Civil & Coordonnées (Algérie)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Nom *</label>
                    <input
                      type="text"
                      required
                      value={editingEmploye.nom}
                      onChange={e => setEditingEmploye({ ...editingEmploye, nom: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Prénom *</label>
                    <input
                      type="text"
                      required
                      value={editingEmploye.prenom}
                      onChange={e => setEditingEmploye({ ...editingEmploye, prenom: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Date de naissance</label>
                    <input
                      type="date"
                      value={editingEmploye.date_naissance}
                      onChange={e => setEditingEmploye({ ...editingEmploye, date_naissance: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Lieu de naissance</label>
                    <input
                      type="text"
                      value={editingEmploye.lieu_naissance}
                      onChange={e => setEditingEmploye({ ...editingEmploye, lieu_naissance: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Wilaya de naissance</label>
                    <input
                      type="text"
                      value={editingEmploye.wilaya_naissance}
                      onChange={e => setEditingEmploye({ ...editingEmploye, wilaya_naissance: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Nationalité</label>
                    <input
                      type="text"
                      value={editingEmploye.nationalite}
                      onChange={e => setEditingEmploye({ ...editingEmploye, nationalite: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Numéros Officiels */}
              <div className="pt-3 border-t border-slate-100">
                <h4 className="font-bold text-purple-800 uppercase tracking-wider mb-2 text-[11px]">
                  2. Identifiants Légaux & Sécurité Sociale
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">NIN (18 chiffres) *</label>
                    <input
                      type="text"
                      required
                      value={editingEmploye.nin}
                      onChange={e => setEditingEmploye({ ...editingEmploye, nin: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">N° Sécurité Sociale CNAS *</label>
                    <input
                      type="text"
                      required
                      value={editingEmploye.num_cnas}
                      onChange={e => setEditingEmploye({ ...editingEmploye, num_cnas: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Groupe sanguin</label>
                    <input
                      type="text"
                      value={editingEmploye.groupe_sanguin || ''}
                      onChange={e => setEditingEmploye({ ...editingEmploye, groupe_sanguin: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                      placeholder="O+, A+, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Contact & Adresse */}
              <div className="pt-3 border-t border-slate-100">
                <h4 className="font-bold text-purple-800 uppercase tracking-wider mb-2 text-[11px]">
                  3. Contact & Adresse de Résidence
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Téléphone mobile *</label>
                    <input
                      type="text"
                      required
                      value={editingEmploye.telephone}
                      onChange={e => setEditingEmploye({ ...editingEmploye, telephone: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Adresse</label>
                    <input
                      type="text"
                      value={editingEmploye.adresse}
                      onChange={e => setEditingEmploye({ ...editingEmploye, adresse: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Commune & Wilaya</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={editingEmploye.commune}
                        onChange={e => setEditingEmploye({ ...editingEmploye, commune: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-lg"
                        placeholder="Commune"
                      />
                      <input
                        type="text"
                        value={editingEmploye.wilaya}
                        onChange={e => setEditingEmploye({ ...editingEmploye, wilaya: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-lg"
                        placeholder="Wilaya"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Contact d'urgence (Nom)</label>
                    <input
                      type="text"
                      value={editingEmploye.personne_urgence_nom}
                      onChange={e => setEditingEmploye({ ...editingEmploye, personne_urgence_nom: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Contact d'urgence (Téléphone)</label>
                    <input
                      type="text"
                      value={editingEmploye.personne_urgence_tel}
                      onChange={e => setEditingEmploye({ ...editingEmploye, personne_urgence_tel: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Statut d'Activité RH</label>
                    <select
                      value={editingEmploye.statut}
                      onChange={e => setEditingEmploye({ ...editingEmploye, statut: e.target.value as any })}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white font-semibold"
                    >
                      <option value="ACTIF">ACTIF</option>
                      <option value="EN_CONGE">EN CONGÉ</option>
                      <option value="ARRET_MALADIE">ARRÊT MALADIE</option>
                      <option value="SUSPENDU">SUSPENDU</option>
                      <option value="FIN_DE_CONTRAT">FIN DE CONTRAT</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 4: Métier, Contrat & Salaire */}
              <div className="pt-3 border-t border-slate-100">
                <h4 className="font-bold text-purple-800 uppercase tracking-wider mb-2 text-[11px]">
                  4. Qualification, Contrat BTP & Salaire DZD
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Corps de métier BTP *</label>
                    <select
                      value={editingEmploye.categorie}
                      onChange={e => setEditingEmploye({ ...editingEmploye, categorie: e.target.value as any })}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    >
                      {Object.entries(CATEGORIE_LABELS).map(([k, label]) => (
                        <option key={k} value={k}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Qualification</label>
                    <select
                      value={editingEmploye.qualification}
                      onChange={e => setEditingEmploye({ ...editingEmploye, qualification: e.target.value as any })}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="QUALIFIE">Qualifié</option>
                      <option value="HAUTEMENT_QUALIFIE">Hautement Qualifié</option>
                      <option value="SPECIALISE">Spécialisé</option>
                      <option value="MANOEUVRE_ORDINAIRE">Manœuvre Ordinaire</option>
                      <option value="MAITRISE">Maîtrise / Encadrement</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Type de Contrat</label>
                    <select
                      value={editingEmploye.type_contrat}
                      onChange={e => setEditingEmploye({ ...editingEmploye, type_contrat: e.target.value as any })}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="CDD_CHANTIER">CDD de Chantier</option>
                      <option value="CDI">CDI</option>
                      <option value="JOURNALIER">Journalier / Tâcheron</option>
                      <option value="APPRENTI">Apprentissage</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Salaire de Base Mensuel (DZD) *</label>
                    <input
                      type="number"
                      required
                      value={editingEmploye.salaire_base_dzd}
                      onChange={e => setEditingEmploye({ ...editingEmploye, salaire_base_dzd: Number(e.target.value) })}
                      className="w-full p-2 border border-slate-300 rounded-lg font-bold text-purple-700"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Date d'embauche</label>
                    <input
                      type="date"
                      value={editingEmploye.date_embauche}
                      onChange={e => setEditingEmploye({ ...editingEmploye, date_embauche: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Date fin contrat (si CDD)</label>
                    <input
                      type="date"
                      value={editingEmploye.date_fin_contrat || ''}
                      onChange={e => setEditingEmploye({ ...editingEmploye, date_fin_contrat: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-medium text-slate-700 mb-1">Chantier d'affectation actuel *</label>
                    <select
                      value={editingEmploye.chantier_actuel_id}
                      onChange={e => setEditingEmploye({ ...editingEmploye, chantier_actuel_id: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white font-semibold text-slate-800"
                    >
                      <option value="siege">🏢 Siège Administratif & Direction Centrale (Alger)</option>
                      <optgroup label="Chantiers Opérationnels Terrain">
                        {allChantiers.map(c => (
                          <option key={c.id} value={c.id}>
                            🏗️ {c.nom_projet} ({c.wilaya})
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 5: Pièces Administratives */}
              <div className="pt-3 border-t border-slate-100">
                <h4 className="font-bold text-purple-800 uppercase tracking-wider mb-2 text-[11px]">
                  5. Pièces & Documents Administratifs Fournis
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries({
                    carte_chifa_cnas: 'Carte Chifa / Attestation CNAS',
                    certificat_medical_aptitude: 'Certificat médical d’aptitude BTP',
                    copie_cni_nin: 'Copie Carte CNI (NIN)',
                    attestation_travail_ou_diplome: 'Diplôme / Attestation de travail',
                    photos_identite: 'Photos d’identité',
                    fiche_anthropometrique: 'Fiche anthropométrique'
                  }).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean((editingEmploye.documents_fournis as any)?.[key])}
                        onChange={e =>
                          setEditingEmploye({
                            ...editingEmploye,
                            documents_fournis: {
                              ...editingEmploye.documents_fournis,
                              [key]: e.target.checked
                            }
                          })
                        }
                        className="rounded text-purple-600"
                      />
                      <span className="text-[11px] text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingEmploye(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center gap-2 shadow-xs transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL : MUTATION / TRANSFERT INTER-CHANTIERS */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-purple-600" />
                Mutation / Transfert d'Ouvrier entre Chantiers
              </h3>
              <button onClick={() => setIsTransferModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Sélectionner l'ouvrier à transférer *</label>
                <select
                  required
                  value={transferTargetEmployeId}
                  onChange={e => setTransferTargetEmployeId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">-- Choisir un ouvrier --</option>
                  {employes.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.nom} {e.prenom} ({e.matricule}) - Actuel : {e.chantier_actuel_nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Chantier de destination *</label>
                <select
                  required
                  value={transferChantierCibleId}
                  onChange={e => setTransferChantierCibleId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-semibold"
                >
                  <option value="">-- Choisir le chantier cible --</option>
                  {allChantiers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nom_projet} ({c.wilaya})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Date d'effet du transfert *</label>
                <input
                  type="date"
                  required
                  value={transferDateEffet}
                  onChange={e => setTransferDateEffet(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Motif opérationnel *</label>
                <textarea
                  required
                  rows={3}
                  value={transferMotif}
                  onChange={e => setTransferMotif(e.target.value)}
                  placeholder="ex: Renfort coulage dalle et voiles de sous-sol bloc A"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold"
                >
                  Confirmer le transfert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL : DÉCLARATION CONGÉ */}
      {isCongeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-emerald-600" />
                Déclaration d'Absence ou Congé Ouvrier
              </h3>
              <button onClick={() => setIsCongeModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleCongeSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Sélectionner l'ouvrier *</label>
                <select
                  required
                  value={congeEmployeId}
                  onChange={e => setCongeEmployeId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">-- Choisir un ouvrier --</option>
                  {employes.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.nom} {e.prenom} ({e.matricule}) - {e.chantier_actuel_nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Type de Congé / Absence *</label>
                <select
                  value={congeType}
                  onChange={e => setCongeType(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="CONGE_PAYE">Congé Payé Annuel</option>
                  <option value="MALADIE_CNAS">Arrêt Maladie (Conventionné CNAS)</option>
                  <option value="ACCIDENT_TRAVAIL">Accident du Travail</option>
                  <option value="EVENEMENT_FAMILIAL">Événement Familial (Mariage, Naissance, Décès)</option>
                  <option value="SANS_SOLDE">Congé Sans Solde</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Date début *</label>
                  <input
                    type="date"
                    required
                    value={congeDateDebut}
                    onChange={e => setCongeDateDebut(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Date fin *</label>
                  <input
                    type="date"
                    required
                    value={congeDateFin}
                    onChange={e => setCongeDateFin(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Nbre Jours</label>
                  <input
                    type="number"
                    min="1"
                    value={congeNombreJours}
                    onChange={e => setCongeNombreJours(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
              </div>

              {congeType === 'MALADIE_CNAS' && (
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Référence Certificat Médical / CNAS</label>
                  <input
                    type="text"
                    value={congeRefCnas}
                    onChange={e => setCongeRefCnas(e.target.value)}
                    placeholder="ex: CNAS-AT-16-2026/891"
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1">Motif ou Observations</label>
                <textarea
                  rows={2}
                  value={congeMotif}
                  onChange={e => setCongeMotif(e.target.value)}
                  placeholder="Justificatifs remis au bureau RH"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCongeModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
                >
                  Enregistrer la demande
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL : MOTIF DE REJET DÉROGATION */}
      {rejectionModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6">
            <h3 className="font-bold text-slate-900 text-sm mb-2 text-rose-700 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-600" />
              Motif du Refus de la Dérogation Post-Clôture
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Ce motif sera notifié par écrit au conducteur de travaux et consigné dans l'historique d'audit.
            </p>

            <textarea
              required
              rows={3}
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="ex: Absence non justifiée par des éléments matériels probants. Retard trop important sans préavis."
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectionModalId(null)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  traiterDemandeDerogation(rejectionModalId, 'REFUSER', rejectionReason || 'Non conforme aux règles du chantier');
                  setRejectionModalId(null);
                  showToast('Demande de dérogation rejetée. Le conducteur a été notifié.');
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Confirmer le refus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
