'use client';

import React, { createContext, useContext, useState, useMemo, ReactNode, useEffect } from 'react';
import {
  Entreprise,
  Chantier,
  Utilisateur,
  Role,
  Permission,
  RolePermission,
  Notification,
  NotificationActionHistory,
  AuditLog,
  DocumentGED,
  UserSession,
  ModuleCode,
  PermissionAction,
  AuditAction,
  CompteBancaire,
  ParametresGeneraux,
  Employe,
  AffectationHistorique,
  PointageLigne,
  DemandeDerogationPointage,
  CongeAbsence,
  Fournisseur,
  DemandeAchat,
  DemandeAchatValidationHistorique,
  ComparaisonOffre,
  BonCommande,
  BonLivraisonReception,
  FactureFournisseur,
  StatutDemandeAchat,
  NiveauUrgence,
  ArticleStock,
  MouvementStock,
  BonSortie,
  TransfertInterChantier,
  InventaireMagasin,
  Vehicule,
  Entretien,
  PieceRemplacable,
  HistoriquePermutationPneu,
  HistoriqueRemplacementPiece,
  LotTravaux,
  StructureChantier,
  PosteTravaux,
  MetreVérification,
  RapportChantier,
  ControleCTC,
  PlanBET,
  SituationTravaux,
  FactureClient,
  TransactionFinanciere,
  DeclarationFiscale,
  ClotureComptableMensuelle,
  EcritureComptable,
  ContratJuridique,
  DocumentFoncierAdmin,
  DossierLitige,
  BienImmobilier,
  StatutBienImmobilier,
  ClientProspect,
  ReservationVenteVEFA
} from '../types/database';
import { authService, VerificationResult } from '../services/authService';

interface AppContextType {
  entreprise: Entreprise;
  updateEntreprise: (updates: Partial<Entreprise>) => void;
  chantiers: Chantier[];
  allChantiers: Chantier[]; // Liste complète pour l'administration
  selectedChantierId: string | 'ALL';
  setSelectedChantierId: (id: string | 'ALL') => void;
  currentChantier: Chantier | null;
  addChantier: (data: Partial<Chantier>) => void;
  updateChantier: (id: string, data: Partial<Chantier>) => void;
  deleteChantierControlled: (id: string) => { success: boolean; message: string };
  
  // Comptes Bancaires
  comptesBancaires: CompteBancaire[];
  addCompteBancaire: (data: Omit<CompteBancaire, 'id' | 'created_at' | 'updated_at'>) => void;
  updateCompteBancaire: (id: string, updates: Partial<CompteBancaire>) => void;
  deleteCompteBancaire: (id: string) => void;
  
  // Paramètres Généraux
  parametresGeneraux: ParametresGeneraux;
  updateParametresGeneraux: (updates: Partial<ParametresGeneraux>) => void;
  currentLanguage: 'fr' | 'ar';
  setLanguage: (lang: 'fr' | 'ar') => void;
  isRtl: boolean;
  
  // Authentification & Utilisateurs
  currentUser: Utilisateur | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, deviceInfo?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchUserPersona: (user: Utilisateur) => void;
  resetUserPassword: (email: string, newPassword?: string) => { success: boolean; message: string; tempPassword?: string };
  
  utilisateurs: Utilisateur[];
  addUtilisateur: (data: Parameters<typeof authService.createUser>[0]) => Utilisateur;
  updateUtilisateur: (id: string, updates: Partial<Utilisateur>) => Utilisateur;
  deleteUtilisateur: (id: string) => { success: boolean; message: string };
  
  // Sessions
  getUserSessions: (userId: string) => UserSession[];
  revokeSession: (sessionId: string) => boolean;
  
  // RBAC & Permissions
  roles: Role[];
  permissions: Permission[];
  rolePermissions: RolePermission[];
  updateRolePermission: (roleId: string, permissionId: string, grant: boolean) => void;
  saveRbacMatrix: (matrix: RolePermission[]) => void;
  verifyAccess: (module: ModuleCode, action?: PermissionAction, targetChantierId?: string | 'ALL') => VerificationResult;
  hasPermission: (module: ModuleCode, action: PermissionAction) => boolean;
  
  // Sécurité & Audit
  notifications: Notification[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  traiterValidationNotificationDirection: (
    notifId: string,
    decision: 'VALIDER' | 'REFUSER',
    motif?: string
  ) => { success: boolean; message: string };
  auditLogs: AuditLog[];
  logOperation: (
    action: AuditAction,
    module: ModuleCode,
    entite_cible: string,
    entite_id: string,
    description: string,
    chantier_id?: string,
    details?: { avant?: Record<string, unknown>; apres?: Record<string, unknown> }
  ) => void;
  
  // GED
  documents: DocumentGED[];
  addDocument: (doc: Omit<DocumentGED, 'id' | 'created_at' | 'updated_at' | 'uploade_par_id' | 'uploade_par_nom'>) => void;
  
  // Ressources Humaines & Pointage
  employes: Employe[];
  addEmploye: (data: Omit<Employe, 'id' | 'created_at' | 'updated_at'>) => Employe;
  updateEmploye: (id: string, updates: Partial<Employe>) => void;
  transfererEmploye: (employeId: string, chantierCibleId: string, motif: string, dateEffet: string) => void;
  affectationsHistorique: AffectationHistorique[];
  congesAbsences: CongeAbsence[];
  addCongeAbsence: (data: Omit<CongeAbsence, 'id' | 'created_at'>) => void;
  updateCongeStatut: (id: string, statut: 'VALIDE' | 'REFUSE') => void;
  pointages: PointageLigne[];
  enregistrerPointage: (chantierId: string, date: string, lignes: PointageLigne[]) => { success: boolean; message: string; locked?: boolean };
  demandesDerogation: DemandeDerogationPointage[];
  soumettreDemandeDerogationPointage: (demande: Omit<DemandeDerogationPointage, 'id' | 'statut_demande_approbation' | 'created_at'>) => void;
  traiterDemandeDerogation: (demandeId: string, decision: 'VALIDER' | 'REFUSER', motifRefus?: string) => void;
  simulatedPointageTime: string;
  setSimulatedPointageTime: (time: string) => void;

  // Achats et Approvisionnements (Circuit Direct Chantiers)
  fournisseurs: Fournisseur[];
  demandesAchat: DemandeAchat[];
  comparaisonsOffres: ComparaisonOffre[];
  bonsCommande: BonCommande[];
  receptionsChantier: BonLivraisonReception[];
  facturesFournisseurs: FactureFournisseur[];
  
  creerDemandeAchat: (data: {
    chantier_id: string;
    designation_produit: string;
    famille_article: string;
    quantite_demandee: number;
    unite_mesure: string;
    niveau_urgence: NiveauUrgence;
    justification: string;
    date_besoin_chantier: string;
    estimation_budget_dzd?: number;
  }) => { success: boolean; message: string; da?: DemandeAchat };

  validerDemandeAchatComptabilite: (
    daId: string,
    decision: 'VALIDER' | 'REFUSER',
    motif?: string
  ) => { success: boolean; message: string };

  enregistrerOffresFournisseurs: (
    daId: string,
    offres: Omit<ComparaisonOffre, 'id' | 'demande_achat_id'>[]
  ) => { success: boolean; message: string };

  choisirOffreRetenue: (daId: string, offreId: string) => void;

  emettreBonCommande: (data: {
    demande_achat_id: string;
    fournisseur_id: string;
    quantite_commandee: number;
    prix_unitaire_ht_dzd: number;
    taux_tva_pct?: number;
    date_livraison_prevue: string;
    delai_paiement?: string;
  }) => { success: boolean; message: string; bc?: BonCommande };

  enregistrerReceptionChantier: (data: {
    bon_commande_id: string;
    numero_bl_fournisseur: string;
    quantite_recue: number;
    quantite_conforme: number;
    quantite_rejetee: number;
    conformite_qualite: 'CONFORME' | 'NON_CONFORME' | 'RESERVES';
    motif_rejet_ou_reserves?: string;
    numero_plaque_camion?: string;
    nom_chauffeur?: string;
  }) => { success: boolean; message: string; br?: BonLivraisonReception };

  enregistrerFactureFournisseur: (data: {
    bon_commande_id: string;
    bon_reception_ref: string;
    numero_facture: string;
    date_facture: string;
    date_echeance: string;
    montant_ht_dzd: number;
    mode_paiement: 'VIREMENT_BANCAIRE' | 'CHEQUE_BANCAIRE' | 'TRAITE';
  }) => { success: boolean; message: string; facture?: FactureFournisseur };

  validerFactureCompta: (factureId: string, statut: 'BON_A_PAYER' | 'LITIGE' | 'PAYEE') => void;

  addFournisseur: (data: Omit<Fournisseur, 'id' | 'created_at'>) => Fournisseur;
  updateFournisseur: (id: string, updates: Partial<Fournisseur>) => void;

  // Magasin & Gestion des Stocks (100% indépendant par chantier)
  articlesStock: ArticleStock[];
  mouvementsStock: MouvementStock[];
  bonsSortie: BonSortie[];
  transfertsInterChantier: TransfertInterChantier[];
  inventairesMagasin: InventaireMagasin[];
  
  creerBonSortie: (data: {
    chantier_id: string;
    article_id: string;
    quantite: number;
    destination: string;
    beneficiaire: string;
    motif: string;
  }) => { success: boolean; message: string; bs?: BonSortie };

  validerBonSortieConducteur: (
    bsId: string,
    decision: 'VALIDE' | 'REFUSE',
    motifRefus?: string
  ) => { success: boolean; message: string };

  confirmerBonSortieMagasinier: (bsId: string) => { success: boolean; message: string };

  creerTransfertInterChantier: (data: {
    chantier_source_id: string;
    chantier_cible_id: string;
    article_id: string;
    quantite: number;
    motif: string;
  }) => { success: boolean; message: string };

  enregistrerInventaire: (data: {
    chantier_id: string;
    lignes: { article_id: string; stock_physique: number; observation?: string }[];
  }) => { success: boolean; message: string };

  ajouterArticleStock: (data: Omit<ArticleStock, 'id' | 'updated_at'>) => ArticleStock;

  // Matériel & Parc Automobile
  vehicules: Vehicule[];
  entretiens: Entretien[];
  piecesRemplacables: PieceRemplacable[];
  
  ajouterVehicule: (data: Omit<Vehicule, 'id' | 'created_at'>) => Vehicule;
  modifierVehicule: (id: string, updates: Partial<Vehicule>) => Vehicule | null;
  supprimerVehicule: (id: string) => boolean;
  affecterVehiculeChantier: (vehiculeId: string, chantierId: string, chantierNom: string, conducteurNom: string, motif?: string, bonTransfertRef?: string) => Vehicule | null;
  mettreAJourCompteur: (vehiculeId: string, nouveauKm?: number, nouvellesHeures?: number) => Vehicule | null;
  enregistrerEntretien: (data: Omit<Entretien, 'id' | 'created_at'>) => Entretien;
  declarerPanne: (vehiculeId: string, description: string, gravite?: 'FAIBLE' | 'MOYENNE' | 'CRITIQUE' | 'IMMOBILISATION', garageNom?: string, coutEstime?: number) => Entretien;
  renouvelerAssurance: (vehiculeId: string, nouvelleCompagnie: string, nouvellePolice: string, dateDebut: string, dateFin: string, coutDzd: number, quittanceRef?: string) => Vehicule | null;
  gererPieceRemplacable: (data: Omit<PieceRemplacable, 'id' | 'created_at'>) => PieceRemplacable;
  permuterPneus: (vehiculeId: string, pieceId1: string, pieceId2: string, km: number, motif: string, operateur: string) => Promise<boolean>;
  remplacerPieceRemplacable: (pieceId: string, nouvellePiece: Omit<PieceRemplacable, 'id' | 'created_at'>, motif: string, note?: string) => Promise<PieceRemplacable | null>;

  // Comptabilité & Fiscalité
  facturesClients: FactureClient[];
  transactions: TransactionFinanciere[];
  declarationsFiscales: DeclarationFiscale[];
  cloturesComptables: ClotureComptableMensuelle[];
  
  isPeriodeCloturee: (dateStr: string) => boolean;
  executerClotureMensuelle: (annee: number, mois: number, observations?: string) => { success: boolean; message: string; cloture?: ClotureComptableMensuelle };
  deverrouillerPeriodeComptable: (periodeCle: string) => { success: boolean; message: string };
  
  creerFactureClient: (data: Omit<FactureClient, 'id' | 'created_at' | 'statut_paiement'>) => FactureClient;
  enregistrerTransaction: (data: Omit<TransactionFinanciere, 'id' | 'created_at'>) => TransactionFinanciere;
  payerFactureFournisseur: (factureId: string, compteBancaireId: string, reference: string) => void;
  payerFactureClient: (factureId: string, compteBancaireId: string, reference: string) => void;
  soumettreDeclarationFiscale: (data: Omit<DeclarationFiscale, 'id' | 'created_at' | 'statut'>) => DeclarationFiscale;

  // Module Juridique & Contentieux
  contratsJuridiques: ContratJuridique[];
  documentsFonciers: DocumentFoncierAdmin[];
  dossiersLitiges: DossierLitige[];
  ajouterContratJuridique: (data: Omit<ContratJuridique, 'id' | 'created_at' | 'historique_modifications' | 'pieces_jointes'>) => ContratJuridique;
  ajouterDocumentFoncier: (data: Omit<DocumentFoncierAdmin, 'id' | 'created_at' | 'pieces_jointes'>) => DocumentFoncierAdmin;
  ajouterDossierLitige: (data: Omit<DossierLitige, 'id' | 'created_at' | 'historique_audiences' | 'pieces_jointes'>) => DossierLitige;
  ajouterPieceJointeJuridique: (type: 'CONTRAT' | 'FONCIER' | 'LITIGE', targetId: string, titre: string, nom_fichier: string, taille_ko: number) => void;

  // Module Commercial & Promotion Immobilière
  biensImmobiliers: BienImmobilier[];
  clientsProspects: ClientProspect[];
  reservationsVEFA: ReservationVenteVEFA[];
  ajouterBienImmobilier: (data: Omit<BienImmobilier, 'id' | 'created_at' | 'updated_at' | 'historique_commercial'>) => BienImmobilier;
  changerStatutBienImmobilier: (bienId: string, statut: StatutBienImmobilier, clientNom?: string, clientTel?: string, remarques?: string) => void;
  ajouterClientProspect: (data: Omit<ClientProspect, 'id' | 'created_at' | 'numero_fiche' | 'nb_visites'>) => ClientProspect;
  creerReservationVEFA: (data: { bienId: string; clientId: string; notaireNom: string; prixConvenu: number }) => ReservationVenteVEFA;

  // Service Technique
  lotsTravaux: LotTravaux[];
  structuresChantier: StructureChantier[];
  postesTravaux: PosteTravaux[];
  metres: MetreVérification[];
  rapportsChantier: RapportChantier[];
  controlesCTC: ControleCTC[];
  plansBET: PlanBET[];
  situationsTravaux: SituationTravaux[];
  
  ajouterLotTravaux: (lot: Omit<LotTravaux, 'id'>) => LotTravaux;
  ajouterPosteTravaux: (poste: Omit<PosteTravaux, 'id'>) => PosteTravaux;
  ajouterMetre: (data: Omit<MetreVérification, 'id' | 'statut'>) => MetreVérification;
  validerMetre: (metreId: string, decision: 'VALIDE' | 'REJETE') => void;
  soumettreRapportChantier: (data: Omit<RapportChantier, 'id' | 'statut'>) => RapportChantier;
  ajouterControleCTC: (ctc: Omit<ControleCTC, 'id'>) => ControleCTC;
  ajouterPlanBET: (plan: Omit<PlanBET, 'id'>) => PlanBET;
  ajouterSituationTravaux: (sit: Omit<SituationTravaux, 'id'>) => SituationTravaux;
  validerSituationTravaux: (id: string, statut: SituationTravaux['statut']) => void;

  // Navigation & Access Guard
  activeNav: string;
  setActiveNav: (nav: string) => void;
  securityViolation: { module: string; message: string; ruleCode: string } | null;
  clearSecurityViolation: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [entreprise, setEntreprise] = useState<Entreprise>({} as Entreprise);
  const [comptesBancaires, setComptesBancaires] = useState<CompteBancaire[]>([]);
  const [parametresGeneraux, setParametresGeneraux] = useState<ParametresGeneraux>({} as ParametresGeneraux);
  const [currentLanguage, setCurrentLanguageState] = useState<'fr' | 'ar'>('fr');
  const [allChantiers, setAllChantiers] = useState<Chantier[]>([]);
  const [currentUser, setCurrentUser] = useState<Utilisateur | null>(null);
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  
  const [selectedChantierId, setSelectedChantierId] = useState<string | 'ALL'>('ALL');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [documents, setDocuments] = useState<DocumentGED[]>([]);
  const [activeNav, setActiveNavState] = useState<string>('dashboard');
  const [securityViolation, setSecurityViolation] = useState<{ module: string; message: string; ruleCode: string } | null>(null);

  // RH & Pointage State
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [affectationsHistorique, setAffectationsHistorique] = useState<AffectationHistorique[]>([]);
  const [congesAbsences, setCongesAbsences] = useState<CongeAbsence[]>([]);
  const [pointages, setPointages] = useState<PointageLigne[]>([]);
  const [demandesDerogation, setDemandesDerogation] = useState<DemandeDerogationPointage[]>([]);
  const [simulatedPointageTime, setSimulatedPointageTime] = useState<string>('08:00');

  // Approvisionnements State (Circuit Direct Chantiers)
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [demandesAchat, setDemandesAchat] = useState<DemandeAchat[]>([]);
  const [comparaisonsOffres, setComparaisonsOffres] = useState<ComparaisonOffre[]>([]);
  const [bonsCommande, setBonsCommande] = useState<BonCommande[]>([]);
  const [receptionsChantier, setReceptionsChantier] = useState<BonLivraisonReception[]>([]);
  const [facturesFournisseurs, setFacturesFournisseurs] = useState<FactureFournisseur[]>([]);

  // Magasin & Stock State (100% indépendant par chantier)
  const [articlesStock, setArticlesStock] = useState<ArticleStock[]>([]);
  const [mouvementsStock, setMouvementsStock] = useState<MouvementStock[]>([]);
  const [bonsSortie, setBonsSortie] = useState<BonSortie[]>([]);
  const [transfertsInterChantier, setTransfertsInterChantier] = useState<TransfertInterChantier[]>([]);
  const [inventairesMagasin, setInventairesMagasin] = useState<InventaireMagasin[]>([]);

  // Matériel & Parc Automobile
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [entretiens, setEntretiens] = useState<Entretien[]>([]);
  const [piecesRemplacables, setPiecesRemplacables] = useState<PieceRemplacable[]>([]);

  // Comptabilité & Fiscalité State
  const [facturesClients, setFacturesClients] = useState<FactureClient[]>([]);
  const [transactions, setTransactions] = useState<TransactionFinanciere[]>([]);
  const [declarationsFiscales, setDeclarationsFiscales] = useState<DeclarationFiscale[]>([]);
  const [cloturesComptables, setCloturesComptables] = useState<ClotureComptableMensuelle[]>([]);

  // Module Juridique State
  const [contratsJuridiques, setContratsJuridiques] = useState<ContratJuridique[]>([]);
  const [documentsFonciers, setDocumentsFonciers] = useState<DocumentFoncierAdmin[]>([]);
  const [dossiersLitiges, setDossiersLitiges] = useState<DossierLitige[]>([]);

  // Module Commercial State
  const [biensImmobiliers, setBiensImmobiliers] = useState<BienImmobilier[]>([]);
  const [clientsProspects, setClientsProspects] = useState<ClientProspect[]>([]);
  const [reservationsVEFA, setReservationsVEFA] = useState<ReservationVenteVEFA[]>([]);

  // Service Technique State
  const [lotsTravaux, setLotsTravaux] = useState<LotTravaux[]>([]);
  const [structuresChantier, setStructuresChantier] = useState<StructureChantier[]>([]);
  const [postesTravaux, setPostesTravaux] = useState<PosteTravaux[]>([]);
  const [metres, setMetres] = useState<MetreVérification[]>([]);
  const [rapportsChantier, setRapportsChantier] = useState<RapportChantier[]>([]);
  const [controlesCTC, setControlesCTC] = useState<ControleCTC[]>([]);
  const [plansBET, setPlansBET] = useState<PlanBET[]>([]);
  const [situationsTravaux, setSituationsTravaux] = useState<SituationTravaux[]>([]);

  // RTL & Langue
  const isRtl = useMemo(() => {
    return currentLanguage === 'ar' || parametresGeneraux.is_rtl;
  }, [currentLanguage, parametresGeneraux.is_rtl]);

  const loadApplicationData = async () => {
    try {
      const readApi = async (path: string) => {
        const response = await fetch(path, { cache: 'no-store' });
        if (!response.ok) return null;
        return response.json();
      };

      const [
        bootstrap,
        supplierRows,
        demandRows,
        orderRows,
        receptionRows,
        invoiceRows,
        notificationRows,
        auditRows,
        pointageRows,
        leaveRows,
        materialRows,
        userRows,
        rbac,
      ] = await Promise.all([
        readApi('/api/app/bootstrap'),
        readApi('/api/approvisionnements/fournisseurs'),
        readApi('/api/approvisionnements/demandes'),
        readApi('/api/approvisionnements/commandes'),
        readApi('/api/approvisionnements/receptions'),
        readApi('/api/approvisionnements/factures'),
        readApi('/api/notifications'),
        readApi('/api/audit-logs'),
        readApi('/api/rh/pointages'),
        readApi('/api/rh/conges'),
        readApi('/api/materiel/parc'),
        readApi('/api/admin/users'),
        readApi('/api/admin/rbac'),
      ]);

      if (bootstrap) {
        if (bootstrap.entreprise) setEntreprise(bootstrap.entreprise);
        if (bootstrap.parametresGeneraux) setParametresGeneraux(bootstrap.parametresGeneraux);
        setAllChantiers(bootstrap.chantiers || []);
        setComptesBancaires(bootstrap.comptesBancaires || []);
        setEmployes((bootstrap.employes || []).map((employee: any) => ({
          ...employee,
          entreprise_id: bootstrap.entreprise?.id || '',
          date_naissance: employee.date_naissance || '',
          lieu_naissance: '',
          wilaya_naissance: '',
          nationalite: 'Algérienne',
          nin: '',
          num_cnas: employee.num_securite_sociale || '',
          commune: employee.chantierActuel?.commune || '',
          wilaya: employee.chantierActuel?.wilaya || '',
          personne_urgence_nom: '',
          personne_urgence_tel: '',
          categorie: employee.fonction || 'OUVRIER',
          date_embauche: employee.date_recrutement || '',
          salaire_base_dzd: Number(employee.salaire_base_dzd || 0),
          chantier_actuel_nom: employee.chantierActuel?.nom_projet || '',
          date_affectation_actuelle: '',
          documents_fournis: {
            carte_chifa_cnas: false,
            certificat_medical_aptitude: false,
            copie_cni_nin: false,
            attestation_travail_ou_diplome: false,
            photos_identite: false,
            fiche_anthropometrique: false,
          },
          updated_at: employee.created_at,
        })) as unknown as Employe[]);
      }

      if (materialRows) {
        setVehicules(materialRows.map((row: any) => ({
          ...row,
          entreprise_id: row.entreprise_id,
          num_interne: row.code_parc,
          categorie: row.type_engin,
          statut: row.statut_operationnel,
          heures_fonctionnement: row.compteur_heures,
          chantier_id: row.chantier_actuel_id || undefined,
          date_prochaine_vidange: row.date_prochaine_vidange || undefined,
          date_prochain_controle_technique: row.date_prochain_controle_technique || undefined,
          date_fin_assurance: row.date_fin_assurance || undefined,
          created_at: row.created_at,
        })) as unknown as Vehicule[]);
        setEntretiens(materialRows.flatMap((vehicle: any) => (vehicle.entretiens || []).map((item: any) => ({
          ...item,
          vehicule_id: vehicle.id,
          vehicule_nom: [vehicle.marque, vehicle.modele].filter(Boolean).join(' '),
          date: item.date,
          cout: Number(item.cout || 0),
          piece_rechange_utilisee: item.piece_rechange || '',
        }))) as unknown as Entretien[]);
        setPiecesRemplacables(materialRows.flatMap((vehicle: any) => (vehicle.piecesRemplacables || []).map((item: any) => ({
          ...item,
          vehicule_id: vehicle.id,
          cout_achat_dzd: Number(item.cout_achat_dzd || 0),
          date_installation: item.date_installation,
          profondeur_sculpture_mm: item.profondeur_sculpture_mm == null ? undefined : Number(item.profondeur_sculpture_mm),
        }))) as unknown as PieceRemplacable[]);
      }

      if (supplierRows) setFournisseurs(supplierRows.map((row: any) => ({
        ...row,
        nom_fournisseur: row.raison_sociale,
        forme_juridique: 'SARL',
        nif: row.nif || '',
        rc: row.rc || '',
        nis: row.nis || '',
        contact_commercial: '',
        delai_livraison_moyen_jours: 0,
        conditions_paiement: '',
        note_qualite: Number(row.note_evaluation ?? 4),
      })) as unknown as Fournisseur[]);

      if (demandRows) setDemandesAchat(demandRows.map((row: any) => {
        const line = Array.isArray(row.lignes_articles) ? row.lignes_articles[0] || {} : {};
        return {
          ...row,
          chantier_nom: row.chantier?.nom_projet || '',
          demandeur_nom: [row.demandeur?.prenom, row.demandeur?.nom].filter(Boolean).join(' '),
          demandeur_role: row.demandeur?.role?.libelle || '',
          designation_produit: line.designation || line.designation_produit || row.description,
          famille_article: line.famille_article || line.categorie || '',
          quantite_demandee: Number(line.quantite_demandee ?? line.quantite ?? 0),
          unite_mesure: line.unite_mesure || line.unite || 'Unité',
          niveau_urgence: row.priorite,
          justification: row.description,
          date_besoin_chantier: line.date_besoin_chantier || '',
          estimation_budget_dzd: Number(row.montant_estime || 0),
          historique_validations: [],
          bon_commande_id: row.bonsCommande?.[0]?.id,
        };
      }) as unknown as DemandeAchat[]);

      if (orderRows) setBonsCommande(orderRows.map((row: any) => {
        const line = Array.isArray(row.lignes_articles) ? row.lignes_articles[0] || {} : {};
        return {
          ...row,
          demande_achat_ref: row.demandeAchat?.numero_da || '',
          fournisseur_nom: row.fournisseur?.raison_sociale || '',
          fournisseur_nif: row.fournisseur?.nif || '',
          fournisseur_rc: row.fournisseur?.rc || '',
          fournisseur_telephone: row.fournisseur?.telephone || '',
          chantier_destinataire_id: row.chantier_id,
          chantier_destinataire_nom: row.chantier?.nom_projet || '',
          adresse_livraison: row.chantier?.adresse_site || '',
          contact_reception_magasinier: '',
          date_livraison_prevue: row.delai_livraison || row.date_commande,
          designation_marchandise: line.designation || line.designation_produit || '',
          quantite_commandee: Number(line.quantite_commandee ?? line.quantite ?? 0),
          unite_mesure: line.unite_mesure || line.unite || 'Unité',
          prix_unitaire_ht_dzd: Number(line.prix_unitaire_ht_dzd ?? line.prix_unitaire_ht ?? 0),
          montant_total_ht_dzd: Number(row.total_ht || 0),
          taux_tva_pct: Number(row.total_ht) > 0 ? Number(row.total_tva) / Number(row.total_ht) * 100 : 0,
          montant_tva_dzd: Number(row.total_tva || 0),
          montant_total_ttc_dzd: Number(row.total_ttc || 0),
          delai_paiement: '',
          statut: row.statut === 'RECU_PARTIEL' ? 'LIVRE_PARTIEL' : row.statut === 'RECU_TOTAL' ? 'LIVRE_TOTAL' : row.statut,
        };
      }) as unknown as BonCommande[]);

      if (receptionRows) setReceptionsChantier(receptionRows.map((row: any) => {
        const lines = Array.isArray(row.lignes_recues) ? row.lignes_recues : [];
        const quantity = lines.reduce((sum: number, line: any) => sum + Number(line.quantite_recue ?? line.quantite ?? 0), 0);
        return {
          ...row,
          numero_bl_fournisseur: row.numero_bl,
          numero_br_interne: row.numero_bl,
          bon_commande_ref: row.bonCommande?.numero_bc || '',
          chantier_nom: row.chantier?.nom_projet || '',
          magasinier_id: currentUser?.id || '',
          magasinier_nom: currentUser ? [currentUser.prenom, currentUser.nom].join(' ') : '',
          fournisseur_nom: row.bonCommande?.fournisseur?.raison_sociale || '',
          quantite_recue: quantity,
          unite_mesure: lines[0]?.unite_mesure || lines[0]?.unite || 'Unité',
          quantite_conforme: row.statut_conforme ? quantity : 0,
          quantite_rejetee: row.statut_conforme ? 0 : quantity,
          conformite_qualite: row.statut_conforme ? 'CONFORME' : 'NON_CONFORME',
          visa_magasinier: true,
          statut: row.statut_conforme ? 'RECEPTIONNE_CONFORME' : 'AVEC_RESERVES',
        };
      }) as unknown as BonLivraisonReception[]);

      if (invoiceRows) setFacturesFournisseurs(invoiceRows.map((row: any) => ({
        ...row,
        bon_commande_ref: row.bonCommande?.numero_bc || '',
        bon_reception_ref: '',
        fournisseur_nom: row.fournisseur?.raison_sociale || '',
        fournisseur_nif: row.fournisseur?.nif || '',
        chantier_id: row.bonCommande?.chantier_id || '',
        chantier_nom: row.bonCommande?.chantier?.nom_projet || '',
        montant_ht_dzd: Number(row.total_ht || 0),
        montant_tva_dzd: Number(row.total_tva || 0),
        montant_ttc_dzd: Number(row.total_ttc || 0),
        statut_comptable: row.statut_paiement === 'PAYEE' ? 'PAYEE' : row.statut_paiement === 'PARTIELLE' ? 'BON_A_PAYER' : 'EN_ATTENTE_CONTROLE',
      })) as unknown as FactureFournisseur[]);

      if (notificationRows) setNotifications(notificationRows.map((row: any) => ({
        ...row,
        lu: Boolean(row.est_lue),
        date_lecture: row.date_lecture || undefined,
        lien_action: row.lien || undefined,
      })) as unknown as Notification[]);

      if (pointageRows) setPointages(pointageRows.map((row: any) => ({
        ...row,
        employe_nom: [row.employe?.prenom, row.employe?.nom].filter(Boolean).join(' '),
        employe_matricule: row.employe?.matricule || '',
        employe_categorie: row.employe?.fonction || 'OUVRIER',
        statut: row.statut_pointage,
        heures_travaillees: Number(row.heures_normales || 0) + Number(row.heures_sup || 0),
        saisi_par_id: row.valide_par || '',
        saisi_par_nom: '',
        verrouille: false,
        updated_at: row.created_at,
      })) as unknown as PointageLigne[]);

      if (leaveRows) setCongesAbsences(leaveRows.map((row: any) => ({
        ...row,
        employe_nom: [row.employe?.prenom, row.employe?.nom].filter(Boolean).join(' '),
        employe_matricule: row.employe?.matricule || '',
        chantier_id: row.employe?.chantier_actuel_id || '',
        nombre_jours: row.jours_ouvrables,
        motif: row.motif || '',
        statut: row.statut === 'ACCEPTE' ? 'VALIDE' : row.statut === 'REFUSE' ? 'REFUSE' : 'EN_ATTENTE',
      })) as unknown as CongeAbsence[]);

      if (auditRows) setAuditLogs(auditRows.map((row: any) => ({
        ...row,
        utilisateur_nom: [row.utilisateur?.prenom, row.utilisateur?.nom].filter(Boolean).join(' '),
        utilisateur_email: row.utilisateur?.email || '',
        chantier_nom: row.chantier?.nom_projet || '',
        entite_cible: row.table_nom,
        entite_id: row.enregistrement_id || '',
        adresse_ip: row.adresse_ip || '',
        details_modifications: {
          avant: row.donnees_anciennes || undefined,
          apres: row.donnees_nouvelles || undefined,
        },
      })) as unknown as AuditLog[]);

      if (userRows) setUtilisateurs(userRows);
      if (rbac) {
        setRoles(rbac.roles || []);
        setPermissions(rbac.permissions || []);
        setRolePermissions(rbac.rolePermissions || []);
        authService.updateAuthorizationData(
          rbac.roles || [],
          rbac.permissions || [],
          rbac.rolePermissions || [],
          userRows || undefined
        );
      }
    } catch (error) {
      console.error('[BatiProm] Chargement des données PostgreSQL impossible :', error);
    }
  };

  useEffect(() => {
    let active = true;
    const restoreSession = async () => {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        if (!active || !data.user) return;
        setCurrentUser(data.user);
        authService.restoreAuthenticatedSession(
          data.user,
          data.roles || [],
          data.permissions || [],
          data.rolePermissions || []
        );
        setUtilisateurs((previous) => previous.some((item) => item.id === data.user.id)
          ? previous.map((item) => item.id === data.user.id ? data.user : item)
          : [...previous, data.user]);
        setRoles(data.roles || []);
        setPermissions(data.permissions || []);
        setRolePermissions(data.rolePermissions || []);
        await loadApplicationData();
      } catch (error) {
        console.error('[BatiProm] Restauration de session Supabase impossible :', error);
      }
    };
    void restoreSession();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (isRtl) {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'fr';
    }
  }, [isRtl]);

  const setLanguage = (lang: 'fr' | 'ar') => {
    setCurrentLanguageState(lang);
    setParametresGeneraux(prev => ({
      ...prev,
      langue_defaut: lang,
      is_rtl: lang === 'ar',
      updated_at: new Date().toISOString()
    }));
  };

  // RÈGLE 4 : Filtrage des chantiers autorisés selon le type d'utilisateur
  const authorizedChantiers = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.type === 'CENTRAL') {
      return allChantiers;
    }
    // Pour un utilisateur de chantier : uniquement les chantiers autorisés
    return allChantiers.filter(c => currentUser.chantiers_assignes.includes(c.id));
  }, [allChantiers, currentUser]);

  // Si un utilisateur de chantier est connecté, s'assurer que le chantier sélectionné lui appartient
  useEffect(() => {
    if (currentUser?.type === 'CHANTIER') {
      if (selectedChantierId === 'ALL' || !currentUser.chantiers_assignes.includes(selectedChantierId)) {
        if (currentUser.chantiers_assignes.length > 0) {
          setSelectedChantierId(currentUser.chantiers_assignes[0]);
        }
      }
    }
  }, [currentUser, selectedChantierId]);

  const currentChantier = useMemo(() => {
    if (selectedChantierId === 'ALL') return null;
    return allChantiers.find(c => c.id === selectedChantierId) || null;
  }, [selectedChantierId, allChantiers]);

  // Log audit helper
  const logOperation = (
    action: AuditAction,
    module: ModuleCode,
    entite_cible: string,
    entite_id: string,
    description: string,
    chantier_id?: string,
    details?: { avant?: Record<string, unknown>; apres?: Record<string, unknown> }
  ) => {
    const author = currentUser || {
      id: 'system',
      nom: 'Système',
      prenom: 'Automate',
      email: 'system@batiprom-dz.com'
    };

    const targetChantierId = chantier_id || (selectedChantierId !== 'ALL' ? selectedChantierId : undefined);
    const targetChantier = allChantiers.find(c => c.id === targetChantierId);

    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      created_at: new Date().toISOString(),
      utilisateur_id: author.id,
      utilisateur_nom: `${author.prenom} ${author.nom}`,
      utilisateur_email: author.email,
      chantier_id: targetChantierId,
      chantier_nom: targetChantier?.nom_projet,
      module,
      action,
      entite_cible,
      entite_id,
      description,
      adresse_ip: '',
      user_agent: navigator.userAgent,
      details_modifications: details
    };

    setAuditLogs(prev => [newLog, ...prev]);

    if (currentUser) {
      void fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chantier_id: targetChantierId,
          module,
          action,
          table_nom: entite_cible,
          enregistrement_id: entite_id,
          description,
          donnees_anciennes: details?.avant,
          donnees_nouvelles: details?.apres,
        }),
      }).then(async response => {
        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          console.warn('[BatiProm] Journal d’audit non persisté :', result.error || response.status);
        }
      }).catch(error => console.warn('[BatiProm] API audit indisponible :', error));
    }
  };

  // ==========================================
  // SÉCURITÉ & VÉRIFICATION RBAC
  // ==========================================

  const verifyAccess = (
    module: ModuleCode,
    action: PermissionAction = 'CONSULTER',
    targetChantierId?: string | 'ALL'
  ): VerificationResult => {
    const scopeId = targetChantierId || selectedChantierId;
    return authService.verifyAccess(currentUser, module, action, scopeId);
  };

  const hasPermission = (module: ModuleCode, action: PermissionAction): boolean => {
    const res = verifyAccess(module, action);
    return res.allowed;
  };

  // Intercepteur de navigation sécurisé (Règles 1, 2, 8, 9)
  const setActiveNav = (nav: string) => {
    // Si la page cible est le schéma ou le dashboard, toujours autoriser
    if (nav === 'schema') {
      setSecurityViolation(null);
      setActiveNavState(nav);
      return;
    }

    const moduleMapping: Record<string, ModuleCode> = {
      dashboard: 'DASHBOARD',
      chantiers: 'CHANTIERS',
      'suivi-travaux': 'CHANTIERS',
      metres: 'TECHNIQUE',
      pointage: 'CHANTIERS',
      administration: 'ADMINISTRATION',
      rh: 'RH',
      juridique: 'JURIDIQUE',
      comptabilite: 'COMPTABILITE',
      technique: 'TECHNIQUE',
      materiel: 'MATERIEL',
      commercial: 'COMMERCIAL',
      approvisionnements: 'APPROVISIONNEMENTS',
      notifications: 'NOTIFICATIONS',
      documents: 'DOCUMENTS',
      parametres: 'PARAMETRES'
    };

    const targetModule = moduleMapping[nav] || 'DASHBOARD';
    const check = verifyAccess(targetModule, 'CONSULTER', selectedChantierId);

    if (!check.allowed) {
      logOperation(
        'ACCES_REFUSE',
        targetModule,
        'navigation_routes',
        nav,
        `Tentative d'accès non autorisé au module "${targetModule}". Règle violée : ${check.ruleViolated || 'NON_AUTORISE'}`
      );

      setSecurityViolation({
        module: targetModule,
        message: check.reason || 'Accès non autorisé selon la matrice des permissions.',
        ruleCode: check.ruleViolated || 'ACCES_INTERDIT'
      });
      return;
    }

    setSecurityViolation(null);
    setActiveNavState(nav);
  };

  const clearSecurityViolation = () => {
    setSecurityViolation(null);
  };

  // ==========================================
  // AUTHENTIFICATION & COMPTES
  // ==========================================

  const login = async (email: string, password: string, deviceInfo?: string) => {
    const res = await authService.login(email, password, deviceInfo);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      setUtilisateurs(authService.getAllUsers());
      setRoles(authService.getAllRoles());
      setPermissions(authService.getAllPermissions());
      setRolePermissions(authService.getRolePermissions());
      await loadApplicationData();
      if (res.user.type === 'CHANTIER') {
        setSelectedChantierId(res.user.chantiers_assignes[0] || 'ALL');
        if (res.user.role_id === 'role-ct') {
          setActiveNavState('suivi-travaux');
        } else if (res.user.role_id === 'role-metreur') {
          setActiveNavState('metres');
        } else if (res.user.role_id === 'role-magasinier') {
          setActiveNavState('magasin');
        }
      }
      logOperation(
        'CREATION',
        'ADMINISTRATION',
        'user_sessions',
        res.user.id,
        `Connexion réussie de ${res.user.prenom} ${res.user.nom} (${res.user.poste})`
      );
    }
    return { success: res.success, error: res.error };
  };

  const logout = () => {
    if (currentUser) {
      logOperation(
        'SUPPRESSION',
        'ADMINISTRATION',
        'user_sessions',
        currentUser.id,
        `Déconnexion de ${currentUser.prenom} ${currentUser.nom}`
      );
    }
    authService.logout();
    setCurrentUser(null);
    setSelectedChantierId('ALL');
  };

  const switchUserPersona = (user: Utilisateur) => {
    // L'impersonation UI est réservée au développement ; en production,
    // toute identité doit provenir d'une session Supabase Auth réelle.
    if (process.env.NODE_ENV === 'production') return;
    authService.setAuthenticatedUser(user);
    setCurrentUser(user);
    setSecurityViolation(null);

    // Ajuste le chantier sélectionné et l'espace de travail
    if (user.type === 'CHANTIER') {
      setSelectedChantierId(user.chantiers_assignes[0] || 'ALL');
      if (user.role_id === 'role-ct') {
        setActiveNavState('suivi-travaux');
      } else if (user.role_id === 'role-metreur') {
        setActiveNavState('metres');
      } else if (user.role_id === 'role-magasinier') {
        setActiveNavState('magasin');
      }
    } else {
      setSelectedChantierId('ALL');
    }

    logOperation(
      'MODIFICATION',
      'ADMINISTRATION',
      'utilisateurs',
      user.id,
      `Bascule d'environnement simulée sur l'utilisateur : ${user.prenom} ${user.nom} (${user.poste})`
    );
  };

  const resetUserPassword = (email: string, newPassword?: string) => {
    const res = authService.resetPassword(email, newPassword);
    if (res.success) {
      logOperation(
        'MODIFICATION',
        'ADMINISTRATION',
        'utilisateurs_passwords',
        email,
        `Réinitialisation du mot de passe pour le compte ${email}`
      );
    }
    return res;
  };

  const addUtilisateur = (data: Parameters<typeof authService.createUser>[0]) => {
    const newUser = authService.createUser(data);
    setUtilisateurs(authService.getAllUsers());
    logOperation(
      'CREATION',
      'ADMINISTRATION',
      'utilisateurs',
      newUser.id,
      `Création du compte utilisateur : ${newUser.prenom} ${newUser.nom} (${newUser.type} - ${newUser.poste})`
    );
    return newUser;
  };

  const updateUtilisateur = (id: string, updates: Partial<Utilisateur>) => {
    const updated = authService.updateUser(id, updates);
    setUtilisateurs(authService.getAllUsers());
    if (currentUser?.id === id) {
      setCurrentUser(updated);
    }
    logOperation(
      'MODIFICATION',
      'ADMINISTRATION',
      'utilisateurs',
      id,
      `Mise à jour du compte utilisateur ${updated.prenom} ${updated.nom} (Statut: ${updated.statut})`
    );
    return updated;
  };

  const deleteUtilisateur = (id: string) => {
    const res = authService.deleteUserControlled(id);
    if (res.success) {
      setUtilisateurs(authService.getAllUsers());
      logOperation(
        'SUPPRESSION',
        'ADMINISTRATION',
        'utilisateurs',
        id,
        `Suppression contrôlée de l'utilisateur ID: ${id}`
      );
    }
    return res;
  };

  const getUserSessions = (userId: string) => {
    return authService.getSessionsForUser(userId);
  };

  const revokeSession = (sessionId: string) => {
    const res = authService.revokeSession(sessionId);
    if (res) {
      logOperation(
        'MODIFICATION',
        'ADMINISTRATION',
        'user_sessions',
        sessionId,
        `Révocation manuelle de la session ID: ${sessionId}`
      );
    }
    return res;
  };

  // ==========================================
  // GESTION MATRICE RBAC
  // ==========================================

  const updateRolePermission = (roleId: string, permissionId: string, grant: boolean) => {
    authService.updateRolePermission(roleId, permissionId, grant);
    setRolePermissions(authService.getRolePermissions());
    logOperation(
      'MODIFICATION',
      'ADMINISTRATION',
      'role_permissions',
      roleId,
      `Modification du privilège ${permissionId} pour le rôle ${roleId} : ${grant ? 'ACCORDÉ' : 'RÉVOQUÉ'}`
    );
  };

  const saveRbacMatrix = (matrix: RolePermission[]) => {
    authService.saveConfigurableMatrix(matrix);
    setRolePermissions(authService.getRolePermissions());
    logOperation(
      'MODIFICATION',
      'ADMINISTRATION',
      'role_permissions',
      'matrix',
      `Enregistrement global de la nouvelle matrice de permissions RBAC`
    );
  };

  // ==========================================
  // CHANTIERS & DOCUMENTS
  // ==========================================

  const addChantier = (data: Partial<Chantier>) => {
    const newChantier: Chantier = {
      id: `cht-${Date.now()}`,
      entreprise_id: entreprise.id,
      code_chantier: data.code_chantier || `CHT-ALG-${new Date().getFullYear()}-${allChantiers.length + 1}`,
      nom_projet: data.nom_projet || 'Nouveau Chantier',
      description: data.description || '',
      wilaya: data.wilaya || 'Alger (16)',
      commune: data.commune || 'Alger Centre',
      adresse_site: data.adresse_site || 'Site en cours de viabilisation',
      superficie_terrain_m2: data.superficie_terrain_m2 || 3500,
      surface_plancher_m2: data.surface_plancher_m2 || 12000,
      nombre_logements: data.nombre_logements || 60,
      nombre_locaux_commerciaux: data.nombre_locaux_commerciaux || 4,
      nombre_niveaux: data.nombre_niveaux || '2SS + RDC + 8 ÉTAGES',
      permis_construire_ref: data.permis_construire_ref || 'En cours d’instruction APC',
      date_ouverture_chantier: data.date_ouverture_chantier || new Date().toISOString().split('T')[0],
      date_livraison_prevue: data.date_livraison_prevue || '2027-12-31',
      budget_global_prevu: data.budget_global_prevu || 1000000000,
      budget_engage: 0,
      statut: data.statut || 'ETUDE_FONCIERE',
      taux_avancement_physique: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setAllChantiers(prev => [...prev, newChantier]);
    logOperation(
      'CREATION',
      'CHANTIERS',
      'chantiers',
      newChantier.id,
      `Création de la nouvelle entité de chantier : "${newChantier.nom_projet}" (${newChantier.wilaya})`,
      newChantier.id
    );
  };

  const updateChantier = (id: string, data: Partial<Chantier>) => {
    setAllChantiers(prev => prev.map(c => {
      if (c.id === id) {
        const updated = { ...c, ...data, updated_at: new Date().toISOString() };
        logOperation(
          'MODIFICATION',
          'CHANTIERS',
          'chantiers',
          id,
          `Mise à jour des paramètres du chantier "${updated.nom_projet}"`,
          id
        );
        return updated;
      }
      return c;
    }));
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true, date_lecture: new Date().toISOString() } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, lu: true, date_lecture: new Date().toISOString() })));
  };

  const notifierDemandeChantier = ({
    titre,
    message,
    module,
    chantierId,
    chantierNom,
    entiteType,
    entiteId,
    lienAction,
    servicesCentraux,
    priorite = 'HAUTE',
  }: {
    titre: string;
    message: string;
    module: ModuleCode;
    chantierId?: string;
    chantierNom?: string;
    entiteType?: 'DEMANDE_ACHAT' | 'DEROGATION_POINTAGE' | 'CONGE' | 'TRANSFERT_STOCK' | 'MATERIEL' | 'SITUATION_TRAVAUX' | 'RAPPORT' | 'AUTRE';
    entiteId?: string;
    lienAction?: string;
    servicesCentraux: Array<{ id?: string; role: string; nom: string }>;
    priorite?: 'BASSE' | 'NORMALE' | 'HAUTE' | 'URGENTE';
  }) => {
    const nowIso = new Date().toISOString();
    const demandeurNom = currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Agent de Chantier';
    const demandeurRole = currentUser?.poste || 'Chantier';
    const notifsToAdd: Notification[] = [];

    // 1. Notification au Directeur Général (Validation requise & bloquante)
    notifsToAdd.push({
      id: `notif-dir-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      titre: `[VALIDATION DIRECTION REQUISE] ${titre}`,
      message: `${message}\n\n⚠️ Origine : Chantier "${chantierNom || 'Non spécifié'}" — Émis par ${demandeurNom} (${demandeurRole}). En attente de validation souveraine de la Direction Générale.`,
      type: 'VALIDATION_REQUISE',
      module: module,
      priorite: priorite,
      statut_validation: 'EN_ATTENTE',
      expediteur_id: currentUser?.id,
      expediteur_nom: demandeurNom,
      expediteur_role: demandeurRole,
      destinataire_id: 'user-admin',
      destinataire_role: 'ADMINISTRATEUR',
      destinataire_nom: 'Directeur Général (Siège Central)',
      chantier_id: chantierId,
      chantier_nom: chantierNom,
      lu: false,
      lien_action: lienAction,
      entite_type: entiteType,
      entite_id: entiteId,
      created_at: nowIso,
      historique_actions: [
        {
          id: `act-init-${Date.now()}`,
          date: nowIso,
          auteur: demandeurNom,
          action: 'Demande soumise depuis le chantier - En attente arbitrage Direction'
        }
      ]
    });

    // 2. Notifications aux services centraux concernés pour information préalable
    servicesCentraux.forEach((svc, idx) => {
      notifsToAdd.push({
        id: `notif-svc-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        titre: `[INFO DIRECTION & SERVICE] ${titre}`,
        message: `${message}\n\nℹ️ Information de suivi : Cette demande émise par le chantier "${chantierNom || ''}" est actuellement en attente d'arbitrage par la Direction Générale avant exécution opérationnelle.`,
        type: 'INFO',
        module: module,
        priorite: 'NORMALE',
        statut_validation: 'EN_ATTENTE',
        expediteur_id: currentUser?.id,
        expediteur_nom: demandeurNom,
        expediteur_role: demandeurRole,
        destinataire_id: svc.id,
        destinataire_role: svc.role,
        destinataire_nom: svc.nom,
        chantier_id: chantierId,
        chantier_nom: chantierNom,
        lu: false,
        lien_action: lienAction,
        entite_type: entiteType,
        entite_id: entiteId,
        created_at: nowIso
      });
    });

    setNotifications(prev => [...notifsToAdd, ...prev]);
  };

  const traiterValidationNotificationDirection = (
    notifId: string,
    decision: 'VALIDER' | 'REFUSER',
    motif?: string
  ): { success: boolean; message: string } => {
    const isDirection = currentUser?.role_id === 'role-admin' || currentUser?.poste?.includes('Directeur') || currentUser?.type === 'CENTRAL';
    if (!isDirection) {
      return {
        success: false,
        message: 'Sécurité : Seul le Directeur Général ou l’Administrateur Central est habilité à arbitrer cette demande.'
      };
    }

    const notif = notifications.find(n => n.id === notifId);
    if (!notif) {
      return { success: false, message: 'Notification introuvable.' };
    }

    const nowIso = new Date().toISOString();
    const dirNom = currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Directeur Général';
    const nouveauStatutVal: 'VALIDE' | 'REFUSE' = decision === 'VALIDER' ? 'VALIDE' : 'REFUSE';

    const actionHist: NotificationActionHistory = {
      id: `act-dir-${Date.now()}`,
      date: nowIso,
      auteur: `${dirNom} (Direction Générale)`,
      action: decision === 'VALIDER' ? 'Approbation accordée par la Direction Générale' : 'Refus prononcé par la Direction Générale',
      commentaire: motif || (decision === 'VALIDER' ? 'Demande visée et autorisée.' : 'Rejeté par la Direction.')
    };

    // 1. Mettre à jour la notification ciblée ainsi que les notifications sœurs (même entité)
    setNotifications(prev => prev.map(n => {
      if (n.id === notifId || (notif.entite_id && n.entite_id === notif.entite_id)) {
        return {
          ...n,
          statut_validation: nouveauStatutVal,
          lu: true,
          date_lecture: nowIso,
          historique_actions: [...(n.historique_actions || []), actionHist]
        };
      }
      return n;
    }));

    // 2. Débloquer ou rejeter l'entité sous-jacente selon son type
    if (notif.entite_type === 'DEMANDE_ACHAT' && notif.entite_id) {
      setDemandesAchat(prev => prev.map(da => {
        if (da.id === notif.entite_id) {
          const nextStatut: StatutDemandeAchat = decision === 'VALIDER' ? 'EN_ATTENTE_COMPTABILITE' : 'REFUSEE';
          return {
            ...da,
            statut: nextStatut,
            historique_validations: [
              ...da.historique_validations,
              {
                id: `hist-dir-${Date.now()}`,
                statut_precedent: da.statut,
                nouveau_statut: nextStatut,
                auteur_id: currentUser?.id || 'user-admin',
                auteur_nom: dirNom,
                auteur_role: 'Directeur Général',
                date: nowIso,
                commentaire: decision === 'VALIDER'
                  ? (motif || 'Autorisation accordée par la Direction Générale. Transmission à la Comptabilité pour visa budgétaire.')
                  : (motif || 'Refusé par la Direction Générale.')
              }
            ],
            updated_at: nowIso
          };
        }
        return da;
      }));
    } else if (notif.entite_type === 'DEROGATION_POINTAGE' && notif.entite_id) {
      setDemandesDerogation(prev => prev.map(d => {
        if (d.id === notif.entite_id) {
          return {
            ...d,
            statut_demande_approbation: decision === 'VALIDER' ? 'VALIDEE' : 'REFUSEE',
            traite_par_id: currentUser?.id || 'user-admin',
            traite_par_nom: `${dirNom} (Direction Générale)`,
            date_traitement: nowIso,
            motif_refus: decision === 'REFUSER' ? (motif || 'Refus Direction') : undefined
          };
        }
        return d;
      }));
    } else if (notif.entite_type === 'CONGE' && notif.entite_id) {
      setCongesAbsences(prev => prev.map(c => {
        if (c.id === notif.entite_id) {
          return {
            ...c,
            statut: decision === 'VALIDER' ? 'VALIDE' : 'REFUSE',
            valide_par_nom: `${dirNom} (Direction Générale)`
          };
        }
        return c;
      }));
    } else if (notif.entite_type === 'SITUATION_TRAVAUX' && notif.entite_id) {
      setSituationsTravaux(prev => prev.map(s => {
        if (s.id === notif.entite_id) {
          return {
            ...s,
            statut: decision === 'VALIDER' ? 'VISEE_DIRECTEUR' : 'BROUILLON',
            valide_par_nom: `${dirNom} (Direction Générale)`
          };
        }
        return s;
      }));
    }

    // 3. Émettre les notifications de retour (Feedback)
    const feedbackNotifs: Notification[] = [];

    // Notification au demandeur du chantier
    if (notif.expediteur_id) {
      feedbackNotifs.push({
        id: `notif-fb-dem-${Date.now()}`,
        titre: decision === 'VALIDER' ? `[VALIDÉ PAR DIRECTION] ${notif.titre.replace(/\[.*?\]\s*/g, '')}` : `[REFUSÉ PAR DIRECTION] ${notif.titre.replace(/\[.*?\]\s*/g, '')}`,
        message: decision === 'VALIDER'
          ? `Votre demande concernant le chantier "${notif.chantier_nom || ''}" a été APPROUVÉE par la Direction Générale (${dirNom}). Les services centraux concernés ont été notifiés pour le traitement opérationnel.`
          : `Votre demande concernant le chantier "${notif.chantier_nom || ''}" a été REFUSÉE par la Direction Générale. Motif : ${motif || 'Non spécifié'}.`,
        type: decision === 'VALIDER' ? 'INFO' : 'AVERTISSEMENT',
        module: notif.module,
        priorite: 'HAUTE',
        destinataire_id: notif.expediteur_id,
        destinataire_nom: notif.expediteur_nom,
        destinataire_role: notif.expediteur_role,
        chantier_id: notif.chantier_id,
        chantier_nom: notif.chantier_nom,
        lu: false,
        created_at: nowIso
      });
    }

    // Notification aux services centraux
    feedbackNotifs.push({
      id: `notif-fb-svc-${Date.now()}`,
      titre: decision === 'VALIDER' ? `[VISA DIRECTION ACCORDÉ] Dossier chantier débloqué` : `[VISA DIRECTION REFUSÉ] Dossier chantier classé`,
      message: decision === 'VALIDER'
        ? `La Direction Générale a validé la demande du chantier "${notif.chantier_nom || ''}" (${notif.titre.replace(/\[.*?\]\s*/g, '')}). Vous pouvez désormais finaliser les opérations administratives et logistiques.`
        : `La Direction Générale a refusé la demande du chantier "${notif.chantier_nom || ''}". Motif : ${motif || 'Non spécifié'}. Traitement arrêté.`,
      type: decision === 'VALIDER' ? 'INFO' : 'AVERTISSEMENT',
      module: notif.module,
      priorite: 'NORMALE',
      destinataire_role: `RESPONSABLE_${notif.module}`,
      chantier_id: notif.chantier_id,
      chantier_nom: notif.chantier_nom,
      lu: false,
      created_at: nowIso
    });

    setNotifications(prev => [...feedbackNotifs, ...prev]);

    logOperation(
      decision === 'VALIDER' ? 'APPROBATION_TECHNIQUE' : 'MODIFICATION',
      notif.module,
      'notifications_direction',
      notifId,
      `Décision souveraine de la Direction Générale (${decision}) sur demande chantier "${notif.chantier_nom || 'Général'}" : ${notif.titre}. ${motif ? `Motif: ${motif}` : ''}`,
      notif.chantier_id
    );

    return {
      success: true,
      message: decision === 'VALIDER'
        ? 'Demande validée avec succès par la Direction Générale. Notification transmise au chantier et aux services centraux.'
        : 'Demande refusée par la Direction Générale. Notification d’information transmise.'
    };
  };

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter(n => {
      if (n.lu) return false;
      if (selectedChantierId !== 'ALL' && n.chantier_id && n.chantier_id !== selectedChantierId) {
        return false;
      }
      return true;
    }).length;
  }, [notifications, selectedChantierId]);

  const addDocument = (doc: Omit<DocumentGED, 'id' | 'created_at' | 'updated_at' | 'uploade_par_id' | 'uploade_par_nom'>) => {
    const targetChantierId = doc.chantier_id || (selectedChantierId !== 'ALL' ? selectedChantierId : undefined);
    const targetChantier = allChantiers.find(c => c.id === targetChantierId);

    const newDoc: DocumentGED = {
      ...doc,
      id: `doc-${Date.now()}`,
      chantier_id: targetChantierId,
      chantier_nom: targetChantier?.nom_projet || 'Siège Central',
      uploade_par_id: currentUser?.id || 'system',
      uploade_par_nom: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Système',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setDocuments(prev => [newDoc, ...prev]);

    logOperation(
      'CREATION',
      'DOCUMENTS',
      'documents_ged',
      newDoc.id,
      `Téléversement du document GED "${newDoc.titre}" (Catégorie: ${newDoc.categorie})`,
      targetChantierId
    );
  };

  // ==========================================
  // PARAMÈTRES DE L'ENTREPRISE & INFORMATIONS BANCAIRES
  // ==========================================

  const updateEntreprise = (updates: Partial<Entreprise>) => {
    setEntreprise(prev => {
      const updated = { ...prev, ...updates, updated_at: new Date().toISOString() };
      logOperation(
        'MODIFICATION',
        'PARAMETRES',
        'entreprises',
        updated.id,
        `Mise à jour des paramètres légaux et administratifs de l'entreprise : ${updated.raison_sociale}`
      );
      return updated;
    });
  };

  const addCompteBancaire = (data: Omit<CompteBancaire, 'id' | 'created_at' | 'updated_at'>) => {
    const newAccount: CompteBancaire = {
      ...data,
      id: `cpt-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setComptesBancaires(prev => {
      if (newAccount.is_compte_principal) {
        return [newAccount, ...prev.map(c => ({ ...c, is_compte_principal: false }))];
      }
      return [newAccount, ...prev];
    });
    logOperation(
      'CREATION',
      'PARAMETRES',
      'comptes_bancaires',
      newAccount.id,
      `Ajout du compte bancaire ${newAccount.nom_banque} - RIB: ${newAccount.rib}`
    );
  };

  const updateCompteBancaire = (id: string, updates: Partial<CompteBancaire>) => {
    setComptesBancaires(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, ...updates, updated_at: new Date().toISOString() };
      }
      if (updates.is_compte_principal && c.id !== id) {
        return { ...c, is_compte_principal: false };
      }
      return c;
    }));
    logOperation(
      'MODIFICATION',
      'PARAMETRES',
      'comptes_bancaires',
      id,
      `Mise à jour des coordonnées bancaires ID: ${id}`
    );
  };

  const deleteCompteBancaire = (id: string) => {
    const target = comptesBancaires.find(c => c.id === id);
    setComptesBancaires(prev => prev.filter(c => c.id !== id));
    logOperation(
      'SUPPRESSION',
      'PARAMETRES',
      'comptes_bancaires',
      id,
      `Suppression du compte bancaire : ${target?.nom_banque} (${target?.rib})`
    );
  };

  const updateParametresGeneraux = (updates: Partial<ParametresGeneraux>) => {
    setParametresGeneraux(prev => {
      const updated = { ...prev, ...updates, updated_at: new Date().toISOString() };
      logOperation(
        'MODIFICATION',
        'PARAMETRES',
        'parametres_generaux',
        updated.id,
        `Mise à jour des paramètres généraux (Langue, Devise, Horaires, Pointage, Notifications)`
      );
      return updated;
    });
  };

  const deleteChantierControlled = (id: string): { success: boolean; message: string } => {
    const chantier = allChantiers.find(c => c.id === id);
    if (!chantier) {
      return { success: false, message: 'Chantier introuvable.' };
    }
    // Règle de gestion : interdire la suppression si le chantier a des engagements financiers ou travaux en cours
    if (chantier.budget_engage > 0 || chantier.taux_avancement_physique > 0) {
      return {
        success: false,
        message: `Suppression bloquée : Le chantier "${chantier.nom_projet}" a des engagements engagés (${chantier.budget_engage.toLocaleString()} DZD) et un avancement de ${chantier.taux_avancement_physique}%. Seuls les chantiers sans engagement peuvent être supprimés.`
      };
    }
    setAllChantiers(prev => prev.filter(c => c.id !== id));
    logOperation(
      'SUPPRESSION',
      'CHANTIERS',
      'chantiers',
      id,
      `Suppression contrôlée du chantier "${chantier.nom_projet}"`
    );
    return { success: true, message: `Le chantier "${chantier.nom_projet}" a été supprimé avec succès.` };
  };

  // ==========================================
  // RESSOURCES HUMAINES & POINTAGE CHANTIERS
  // ==========================================

  const addEmploye = (data: Omit<Employe, 'id' | 'created_at' | 'updated_at'>): Employe => {
    const newId = `emp-${Date.now()}`;
    const targetChantier = allChantiers.find(c => c.id === data.chantier_actuel_id);
    const nowIso = new Date().toISOString();

    const newEmploye: Employe = {
      ...data,
      id: newId,
      chantier_actuel_nom: targetChantier?.nom_projet || 'Chantier non assigné',
      created_at: nowIso,
      updated_at: nowIso
    };

    setEmployes(prev => [newEmploye, ...prev]);

    // Enregistrement automatique de l'affectation initiale
    const newAffectation: AffectationHistorique = {
      id: `aff-${Date.now()}`,
      employe_id: newId,
      employe_nom: `${newEmploye.nom} ${newEmploye.prenom}`,
      employe_matricule: newEmploye.matricule,
      chantier_cible_id: data.chantier_actuel_id,
      chantier_cible_nom: targetChantier?.nom_projet || 'Chantier affecté',
      date_effet: data.date_affectation_actuelle || data.date_embauche,
      motif: 'Recrutement et affectation initiale sur chantier',
      valide_par_id: currentUser?.id || 'user-rh',
      valide_par_nom: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Responsable RH',
      created_at: nowIso
    };
    setAffectationsHistorique(prev => [newAffectation, ...prev]);

    // Notification envoyée au Conducteur de travaux du chantier
    if (targetChantier?.conducteur_travaux_id) {
      const notifCt: Notification = {
        id: `notif-${Date.now()}`,
        titre: 'Nouvel ouvrier affecté à votre chantier',
        message: `${newEmploye.nom} ${newEmploye.prenom} (${newEmploye.categorie}) a été recruté et affecté à ${targetChantier.nom_projet}. Il figure désormais dans votre liste de pointage quotidien.`,
        type: 'INFO',
        module: 'RH',
        chantier_id: targetChantier.id,
        chantier_nom: targetChantier.nom_projet,
        destinataire_id: targetChantier.conducteur_travaux_id,
        lu: false,
        created_at: nowIso
      };
      setNotifications(prev => [notifCt, ...prev]);
    }

    logOperation(
      'CREATION',
      'RH',
      'rh_employes',
      newId,
      `Recrutement et création du dossier employé : ${newEmploye.nom} ${newEmploye.prenom} (${newEmploye.matricule}, ${newEmploye.categorie}) affecté à ${targetChantier?.nom_projet}`,
      data.chantier_actuel_id
    );

    return newEmploye;
  };

  const updateEmploye = (id: string, updates: Partial<Employe>) => {
    setEmployes(prev => prev.map(emp => {
      if (emp.id === id) {
        const updated = { ...emp, ...updates, updated_at: new Date().toISOString() };
        logOperation(
          'MODIFICATION',
          'RH',
          'rh_employes',
          id,
          `Mise à jour du dossier employé : ${updated.nom} ${updated.prenom} (${updated.matricule})`,
          updated.chantier_actuel_id
        );
        return updated;
      }
      return emp;
    }));
  };

  const transfererEmploye = (employeId: string, chantierCibleId: string, motif: string, dateEffet: string) => {
    const employe = employes.find(e => e.id === employeId);
    const chantierCible = allChantiers.find(c => c.id === chantierCibleId);
    const sourceChantier = allChantiers.find(c => c.id === employe?.chantier_actuel_id);

    if (!employe || !chantierCible) return;

    const nowIso = new Date().toISOString();

    // 1. Mettre à jour l'employé
    setEmployes(prev => prev.map(e => {
      if (e.id === employeId) {
        return {
          ...e,
          chantier_actuel_id: chantierCibleId,
          chantier_actuel_nom: chantierCible.nom_projet,
          date_affectation_actuelle: dateEffet,
          updated_at: nowIso
        };
      }
      return e;
    }));

    // 2. Enregistrer l'historique d'affectation
    const newAff: AffectationHistorique = {
      id: `aff-${Date.now()}`,
      employe_id: employe.id,
      employe_nom: `${employe.nom} ${employe.prenom}`,
      employe_matricule: employe.matricule,
      chantier_source_id: sourceChantier?.id,
      chantier_source_nom: sourceChantier?.nom_projet,
      chantier_cible_id: chantierCible.id,
      chantier_cible_nom: chantierCible.nom_projet,
      date_effet: dateEffet,
      motif,
      valide_par_id: currentUser?.id || 'user-rh',
      valide_par_nom: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Responsable RH',
      created_at: nowIso
    };
    setAffectationsHistorique(prev => [newAff, ...prev]);

    // 3. Notification au conducteur du chantier cible
    if (chantierCible.conducteur_travaux_id) {
      setNotifications(prev => [
        {
          id: `notif-${Date.now()}-transfert`,
          titre: 'Transfert d’ouvrier vers votre chantier',
          message: `${employe.nom} ${employe.prenom} (${employe.categorie}) a été transféré vers ${chantierCible.nom_projet} à compter du ${dateEffet}. Motif : ${motif}`,
          type: 'INFO',
          module: 'RH',
          chantier_id: chantierCible.id,
          chantier_nom: chantierCible.nom_projet,
          destinataire_id: chantierCible.conducteur_travaux_id,
          lu: false,
          created_at: nowIso
        },
        ...prev
      ]);
    }

    logOperation(
      'MODIFICATION',
      'RH',
      'rh_affectations_historique',
      newAff.id,
      `Transfert de l'ouvrier ${employe.nom} ${employe.prenom} de "${sourceChantier?.nom_projet || 'Non affecté'}" vers "${chantierCible.nom_projet}" (Effet: ${dateEffet})`,
      chantierCible.id
    );
  };

  const addCongeAbsence = (data: Omit<CongeAbsence, 'id' | 'created_at'>) => {
    const newConge: CongeAbsence = {
      ...data,
      id: `cng-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setCongesAbsences(prev => [newConge, ...prev]);

    logOperation(
      'CREATION',
      'RH',
      'rh_conges_absences',
      newConge.id,
      `Déclaration d'absence/congé pour ${data.employe_nom} (${data.type}, du ${data.date_debut} au ${data.date_fin})`,
      data.chantier_id
    );

    if (data.chantier_id) {
      const cNom = allChantiers.find(c => c.id === data.chantier_id)?.nom_projet || 'Chantier';
      notifierDemandeChantier({
        titre: `Demande Congé/Absence : ${data.employe_nom} (${data.type})`,
        message: `Demande de congé/absence déposée pour l'employé de chantier ${data.employe_nom} du ${data.date_debut} au ${data.date_fin}. Motif : ${data.motif || 'Non renseigné'}.`,
        module: 'RH',
        chantierId: data.chantier_id,
        chantierNom: cNom,
        entiteType: 'CONGE',
        entiteId: newConge.id,
        lienAction: '/rh',
        servicesCentraux: [
          { id: 'user-rh', role: 'RESPONSABLE_RH', nom: 'Nadia Benali (Service RH)' }
        ]
      });
    }
  };

  const updateCongeStatut = (id: string, statut: 'VALIDE' | 'REFUSE') => {
    setCongesAbsences(prev => prev.map(c => {
      if (c.id === id) {
        const updated = {
          ...c,
          statut,
          valide_par_nom: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Responsable RH'
        };
        logOperation(
          statut === 'VALIDE' ? 'APPROBATION_TECHNIQUE' : 'MODIFICATION',
          'RH',
          'rh_conges_absences',
          id,
          `Décision RH sur demande de congé/absence (${statut}) pour ${c.employe_nom}`,
          c.chantier_id
        );
        return updated;
      }
      return c;
    }));
  };

  const enregistrerPointage = (
    chantierId: string,
    date: string,
    nouvellesLignes: PointageLigne[]
  ): { success: boolean; message: string; locked?: boolean } => {
    const heureLimite = parametresGeneraux.heure_limite_pointage || '08:15';
    const isLocked = simulatedPointageTime > heureLimite;
    const isSuperUser = currentUser?.role_id === 'role-admin' || currentUser?.role_id === 'role-rh';

    if (isLocked && !isSuperUser) {
      return {
        success: false,
        message: `Pointage verrouillé. L'heure limite de clôture (${heureLimite}) est dépassée. Une demande d'autorisation est requise auprès du RH.`,
        locked: true
      };
    }

    setPointages(prev => {
      // Filtrer les anciennes lignes pour ce chantier et cette date
      const others = prev.filter(p => !(p.chantier_id === chantierId && p.date === date));
      return [...others, ...nouvellesLignes];
    });

    const targetChantier = allChantiers.find(c => c.id === chantierId);

    logOperation(
      'CREATION',
      'RH',
      'rh_pointages_journaliers',
      `${chantierId}-${date}`,
      `Enregistrement de la feuille de pointage journalière du ${date} pour le chantier "${targetChantier?.nom_projet}" (${nouvellesLignes.length} ouvriers pointés)`,
      chantierId
    );

    return {
      success: true,
      message: `Feuille de pointage du ${date} enregistrée avec succès (${nouvellesLignes.length} ouvriers).`
    };
  };

  const soumettreDemandeDerogationPointage = (
    demande: Omit<DemandeDerogationPointage, 'id' | 'statut_demande_approbation' | 'created_at'>
  ) => {
    const nowIso = new Date().toISOString();
    const newDerogation: DemandeDerogationPointage = {
      ...demande,
      id: `drg-${Date.now()}`,
      statut_demande_approbation: 'EN_ATTENTE',
      created_at: nowIso
    };

    setDemandesDerogation(prev => [newDerogation, ...prev]);

    // Notification systématique : Direction Générale pour validation, Service RH pour information
    notifierDemandeChantier({
      titre: `Dérogation pointage post-clôture : ${demande.employe_nom}`,
      message: `${demande.demandeur_nom} (${demande.demandeur_role}) sollicite une modification de pointage pour l'ouvrier ${demande.employe_nom} sur le chantier "${demande.chantier_nom}" (Date: ${demande.date_pointage}). Nouveau statut demandé: ${demande.statut_demande}. Motif: ${demande.motif_demande}.`,
      module: 'RH',
      chantierId: demande.chantier_id,
      chantierNom: demande.chantier_nom,
      entiteType: 'DEROGATION_POINTAGE',
      entiteId: newDerogation.id,
      lienAction: '/pointage',
      servicesCentraux: [
        { id: 'user-rh', role: 'RESPONSABLE_RH', nom: 'Nadia Benali (Service RH)' }
      ]
    });

    logOperation(
      'CREATION',
      'RH',
      'rh_demandes_derogation',
      newDerogation.id,
      `Soumission d'une demande de dérogation post-clôture pour l'ouvrier ${demande.employe_nom} sur ${demande.chantier_nom} (Statut demandé: ${demande.statut_demande}). Motif: ${demande.motif_demande}`,
      demande.chantier_id
    );
  };

  const traiterDemandeDerogation = (
    demandeId: string,
    decision: 'VALIDER' | 'REFUSER',
    motifRefus?: string
  ) => {
    const nowIso = new Date().toISOString();
    const demande = demandesDerogation.find(d => d.id === demandeId);
    if (!demande) return;

    // 1. Mettre à jour la demande
    setDemandesDerogation(prev => prev.map(d => {
      if (d.id === demandeId) {
        return {
          ...d,
          statut_demande_approbation: decision === 'VALIDER' ? 'VALIDEE' : 'REFUSEE',
          traite_par_id: currentUser?.id || 'user-rh',
          traite_par_nom: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Responsable RH',
          date_traitement: nowIso,
          motif_refus: decision === 'REFUSER' ? motifRefus : undefined
        };
      }
      return d;
    }));

    // 2. Si VALIDÉE : Répercuter immédiatement la modification dans la table des pointages
    if (decision === 'VALIDER') {
      setPointages(prev => {
        const index = prev.findIndex(p => p.chantier_id === demande.chantier_id && p.date === demande.date_pointage && p.employe_id === demande.employe_id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            statut: demande.statut_demande,
            heure_arrivee: demande.heure_arrivee_demandee || updated[index].heure_arrivee || '08:00',
            heures_travaillees: demande.statut_demande === 'ABSENT_INJUSTIFIE' ? 0 : 8,
            observations: `${updated[index].observations ? updated[index].observations + ' | ' : ''}Rectifié sur dérogation validée par ${currentUser?.prenom || 'RH'} ${currentUser?.nom || ''}`,
            verrouille: true,
            derogation_id: demandeId,
            updated_at: nowIso
          };
          return updated;
        } else {
          // Créer une nouvelle ligne si non existante
          const newLigne: PointageLigne = {
            id: `ptg-${Date.now()}`,
            chantier_id: demande.chantier_id,
            employe_id: demande.employe_id,
            employe_nom: demande.employe_nom,
            employe_matricule: demande.employe_matricule,
            employe_categorie: 'MANOEUVRE',
            date: demande.date_pointage,
            statut: demande.statut_demande,
            heure_arrivee: demande.heure_arrivee_demandee || '08:00',
            heures_travaillees: 8,
            observations: `Créé sur dérogation validée par ${currentUser?.prenom || 'RH'} ${currentUser?.nom || ''}`,
            saisi_par_id: currentUser?.id || 'user-rh',
            saisi_par_nom: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Responsable RH',
            verrouille: true,
            derogation_id: demandeId,
            updated_at: nowIso
          };
          return [...prev, newLigne];
        }
      });
    }

    // 3. Notification de retour au conducteur de travaux demandeur
    const notifDemandeur: Notification = {
      id: `notif-drg-res-${Date.now()}`,
      titre: decision === 'VALIDER' ? 'Dérogation de pointage ACCEPTÉE' : 'Dérogation de pointage REFUSÉE',
      message: decision === 'VALIDER'
        ? `Votre demande de modification de pointage pour ${demande.employe_nom} du ${demande.date_pointage} sur ${demande.chantier_nom} a été VALIDÉE par le Responsable RH. La feuille de présence a été mise à jour.`
        : `Votre demande de modification de pointage pour ${demande.employe_nom} a été REFUSÉE par le Responsable RH. Motif : ${motifRefus || 'Non conforme aux règles du chantier'}.`,
      type: decision === 'VALIDER' ? 'INFO' : 'AVERTISSEMENT',
      module: 'RH',
      chantier_id: demande.chantier_id,
      chantier_nom: demande.chantier_nom,
      destinataire_id: demande.demandeur_id,
      lu: false,
      created_at: nowIso
    };

    // 4. Notification d'information à l'administrateur
    const notifAdmin: Notification = {
      id: `notif-drg-admin-res-${Date.now()}`,
      titre: `Décision dérogation pointage : ${decision === 'VALIDER' ? 'Validée' : 'Refusée'}`,
      message: `La dérogation post-clôture soumise par ${demande.demandeur_nom} pour ${demande.employe_nom} (${demande.chantier_nom}) a été ${decision === 'VALIDER' ? 'validée' : 'refusée'} par ${currentUser?.prenom || 'RH'} ${currentUser?.nom || ''}.`,
      type: 'INFO',
      module: 'RH',
      chantier_id: demande.chantier_id,
      chantier_nom: demande.chantier_nom,
      destinataire_id: 'user-admin',
      lu: false,
      created_at: nowIso
    };

    setNotifications(prev => [notifDemandeur, notifAdmin, ...prev]);

    // 5. Journalisation d'audit immuable
    logOperation(
      decision === 'VALIDER' ? 'APPROBATION_TECHNIQUE' : 'MODIFICATION',
      'RH',
      'rh_demandes_derogation',
      demandeId,
      `Décision RH (${decision}) sur la demande de dérogation post-clôture pour l'ouvrier ${demande.employe_nom} sur ${demande.chantier_nom} (Date: ${demande.date_pointage}). Nouveau statut: ${demande.statut_demande}${decision === 'REFUSER' ? ` | Motif refus: ${motifRefus}` : ''}`,
      demande.chantier_id
    );
  };

  // ==========================================
  // CIRCUIT D'APPROVISIONNEMENT & ACHATS DIRECTS CHANTIERS
  // ==========================================

  const creerDemandeAchat = (data: {
    chantier_id: string;
    designation_produit: string;
    famille_article: string;
    quantite_demandee: number;
    unite_mesure: string;
    niveau_urgence: NiveauUrgence;
    justification: string;
    date_besoin_chantier: string;
    estimation_budget_dzd?: number;
  }): { success: boolean; message: string; da?: DemandeAchat } => {
    const nowIso = new Date().toISOString();
    const todayStr = nowIso.split('T')[0];
    const targetChantier = allChantiers.find(c => c.id === data.chantier_id);
    
    if (!targetChantier) {
      return { success: false, message: 'Chantier destinataire invalide ou introuvable.' };
    }

    // Contrôle de cloisonnement : un utilisateur chantier doit appartenir au chantier
    if (currentUser?.type === 'CHANTIER' && !currentUser.chantiers_assignes.includes(data.chantier_id)) {
      return { success: false, message: 'Vous ne pouvez émettre une DA que pour votre propre chantier assigné.' };
    }

    const nextIdNum = demandesAchat.length + 1;
    const siteCodeShort = targetChantier.code_chantier.split('-')[1] || 'CHT';
    const numeroDa = `DA-2026-${siteCodeShort}-${String(nextIdNum).padStart(4, '0')}`;

    const newDa: DemandeAchat = {
      id: `da-${Date.now()}`,
      numero_da: numeroDa,
      chantier_id: data.chantier_id,
      chantier_nom: targetChantier.nom_projet,
      demandeur_id: currentUser?.id || 'user-ct',
      demandeur_nom: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Conducteur de Travaux',
      demandeur_role: currentUser?.role_id === 'role-metreur' ? 'Métreur Vérificateur' : 'Conducteur de Travaux',
      date_demande: todayStr,
      designation_produit: data.designation_produit,
      famille_article: data.famille_article,
      quantite_demandee: data.quantite_demandee,
      unite_mesure: data.unite_mesure,
      niveau_urgence: data.niveau_urgence,
      justification: data.justification,
      date_besoin_chantier: data.date_besoin_chantier,
      estimation_budget_dzd: data.estimation_budget_dzd || 0,
      statut: 'EN_ATTENTE_DIRECTION', // TOUTE DEMANDE DE CHANTIER NÉCESSITE LA VALIDATION PRÉALABLE DU DIRECTEUR
      historique_validations: [
        {
          id: `hist-da-${Date.now()}`,
          statut_precedent: 'BROUILLON',
          nouveau_statut: 'EN_ATTENTE_DIRECTION',
          auteur_id: currentUser?.id || 'user-ct',
          auteur_nom: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Conducteur de Travaux',
          auteur_role: currentUser?.role_id === 'role-metreur' ? 'Métreur Vérificateur' : 'Conducteur de Travaux',
          date: nowIso,
          commentaire: `Émission de la demande d'achat terrain. En attente d'arbitrage de la Direction Générale. Justification: "${data.justification}". Niveau d'urgence: ${data.niveau_urgence}.`
        }
      ],
      created_at: nowIso,
      updated_at: nowIso
    };

    setDemandesAchat(prev => [newDa, ...prev]);

    // Notification systématique : Direction Générale pour validation souveraine, Comptabilité & Approvisionnements pour information
    notifierDemandeChantier({
      titre: `Demande d'Achat : ${numeroDa} - ${data.designation_produit}`,
      message: `Le chantier "${targetChantier.nom_projet}" sollicite ${data.quantite_demandee} ${data.unite_mesure} de "${data.designation_produit}" (Urgence : ${data.niveau_urgence}, Budget estimé : ${(data.estimation_budget_dzd || 0).toLocaleString('fr-DZ')} DZD). Justification : "${data.justification}".`,
      module: 'APPROVISIONNEMENTS',
      chantierId: data.chantier_id,
      chantierNom: targetChantier.nom_projet,
      entiteType: 'DEMANDE_ACHAT',
      entiteId: newDa.id,
      lienAction: '/approvisionnements',
      priorite: data.niveau_urgence === 'CRITIQUE_ARRET_CHANTIER' ? 'URGENTE' : (data.niveau_urgence === 'URGENT' ? 'HAUTE' : 'NORMALE'),
      servicesCentraux: [
        { id: 'user-compta', role: 'RESPONSABLE_COMPTABILITE', nom: 'Farid Saidi (Comptabilité & Contrôle)' },
        { id: 'user-appro', role: 'RESPONSABLE_APPROVISIONNEMENTS', nom: 'Yacine Bouzid (Approvisionnements)' }
      ]
    });

    logOperation(
      'CREATION',
      'APPROVISIONNEMENTS',
      'appro_demandes_achat',
      newDa.id,
      `Création de la Demande d'Achat ${numeroDa} pour le chantier ${targetChantier.nom_projet} (${data.quantite_demandee} ${data.unite_mesure} de ${data.designation_produit}). Transmise à la Direction pour validation.`,
      data.chantier_id
    );

    return {
      success: true,
      message: `Demande d'achat ${numeroDa} émise avec succès. Notifiée au Directeur Général pour validation souveraine, et aux services Comptabilité & Approvisionnements pour information.`,
      da: newDa
    };
  };

  const validerDemandeAchatComptabilite = (
    daId: string,
    decision: 'VALIDER' | 'REFUSER',
    motif?: string
  ): { success: boolean; message: string } => {
    const da = demandesAchat.find(d => d.id === daId);
    if (!da) {
      return { success: false, message: 'Demande d’achat introuvable.' };
    }

    // RÈGLE OBLIGATOIRE : Le conducteur ne doit pas pouvoir valider sa propre demande d'achat
    if (currentUser?.id === da.demandeur_id) {
      logOperation(
        'MODIFICATION',
        'APPROVISIONNEMENTS',
        'appro_demandes_achat',
        daId,
        `[VIOLATION INTERCEPTÉE] Le demandeur ${currentUser.email} a tenté de valider sa propre demande d'achat ${da.numero_da}. Opération bloquée.`,
        da.chantier_id
      );
      return {
        success: false,
        message: 'Sécurité : Le conducteur de travaux ne peut en aucun cas valider sa propre demande d’achat (séparation des tâches requise).'
      };
    }

    // RÈGLE OBLIGATOIRE : Seule la comptabilité (ou l'administrateur) valide la demande à cette étape
    const isComptaOrAdmin = currentUser?.role_id === 'role-compta' || currentUser?.role_id === 'role-admin';
    if (!isComptaOrAdmin) {
      return {
        success: false,
        message: 'Seul le Responsable Comptabilité & Fiscalité est habilité à viser budgétairement cette demande.'
      };
    }

    const nowIso = new Date().toISOString();
    const nouveauStatut: StatutDemandeAchat = decision === 'VALIDER' ? 'VALIDEE' : 'REFUSEE';

    const newHist: DemandeAchatValidationHistorique = {
      id: `hist-da-${Date.now()}`,
      statut_precedent: da.statut,
      nouveau_statut: nouveauStatut,
      auteur_id: currentUser?.id || 'user-compta',
      auteur_nom: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Responsable Comptabilité',
      auteur_role: currentUser?.role_id === 'role-admin' ? 'Administrateur Central' : 'Responsable Comptabilité & Fiscalité',
      date: nowIso,
      commentaire: decision === 'VALIDER'
        ? (motif || 'Contrôle budgétaire conforme. Imputation sur le budget prévisionnel du chantier autorisée.')
        : (motif || 'Refus pour motif budgétaire ou dépassement de ligne non justifié.')
    };

    setDemandesAchat(prev => prev.map(d => {
      if (d.id === daId) {
        return {
          ...d,
          statut: nouveauStatut,
          historique_validations: [...d.historique_validations, newHist],
          updated_at: nowIso
        };
      }
      return d;
    }));

    // Notifications automatiques selon décision
    const notifs: Notification[] = [];

    // Notification au demandeur (conducteur)
    notifs.push({
      id: `notif-da-dem-${Date.now()}`,
      titre: decision === 'VALIDER' ? `DA ${da.numero_da} VALIDÉE par la Comptabilité` : `DA ${da.numero_da} REFUSÉE par la Comptabilité`,
      message: decision === 'VALIDER'
        ? `Votre demande d'achat pour ${da.designation_produit} sur "${da.chantier_nom}" a été validée par la Comptabilité et transmise au service Approvisionnements.`
        : `Votre demande d'achat a été refusée par la Comptabilité. Motif : ${motif || 'Non spécifié'}.`,
      type: decision === 'VALIDER' ? 'INFO' : 'AVERTISSEMENT',
      module: 'APPROVISIONNEMENTS',
      chantier_id: da.chantier_id,
      chantier_nom: da.chantier_nom,
      destinataire_id: da.demandeur_id,
      lu: false,
      created_at: nowIso
    });

    // Si validée, transmission automatique au Responsable Approvisionnements (CIRCUIT ÉTAPE 5)
    if (decision === 'VALIDER') {
      notifs.push({
        id: `notif-da-appro-${Date.now()}`,
        titre: `DA ${da.numero_da} prête pour consultation et commande`,
        message: `La demande pour "${da.designation_produit}" (${da.quantite_demandee} ${da.unite_mesure}) destinée au chantier "${da.chantier_nom}" a reçu le visa comptable. Procédez aux consultations fournisseurs.`,
        type: 'VALIDATION_REQUISE',
        module: 'APPROVISIONNEMENTS',
        chantier_id: da.chantier_id,
        chantier_nom: da.chantier_nom,
        destinataire_id: 'user-appro',
        lu: false,
        created_at: nowIso
      });
    }

    setNotifications(prev => [...notifs, ...prev]);

    logOperation(
      decision === 'VALIDER' ? 'APPROBATION_TECHNIQUE' : 'MODIFICATION',
      'APPROVISIONNEMENTS',
      'appro_demandes_achat',
      daId,
      `Décision comptable (${decision}) sur DA ${da.numero_da} (${da.chantier_nom}). ${motif ? `Motif: ${motif}` : ''}`,
      da.chantier_id
    );

    return {
      success: true,
      message: decision === 'VALIDER'
        ? `Demande d'achat ${da.numero_da} validée par la comptabilité et transmise au Service Approvisionnements.`
        : `Demande d'achat ${da.numero_da} refusée.`
    };
  };

  const enregistrerOffresFournisseurs = (
    daId: string,
    offresData: Omit<ComparaisonOffre, 'id' | 'demande_achat_id'>[]
  ): { success: boolean; message: string } => {
    // RÈGLE OBLIGATOIRE : La comptabilité ne doit pas pouvoir effectuer les opérations réservées aux approvisionnements
    if (currentUser?.role_id === 'role-compta') {
      return {
        success: false,
        message: 'Séparation stricte : La comptabilité ne peut pas effectuer les opérations réservées au Service Approvisionnements.'
      };
    }

    const da = demandesAchat.find(d => d.id === daId);
    if (!da) return { success: false, message: 'Demande d’achat introuvable.' };

    const newOffres: ComparaisonOffre[] = offresData.map((o, idx) => ({
      ...o,
      id: `off-${Date.now()}-${idx}`,
      demande_achat_id: daId
    }));

    setComparaisonsOffres(prev => [
      ...prev.filter(item => item.demande_achat_id !== daId),
      ...newOffres
    ]);

    // Basculer la DA en cours d'approvisionnement si elle était validée
    if (da.statut === 'VALIDEE') {
      const nowIso = new Date().toISOString();
      setDemandesAchat(prev => prev.map(d => {
        if (d.id === daId) {
          return {
            ...d,
            statut: 'EN_COURS_APPROVISIONNEMENT',
            updated_at: nowIso
          };
        }
        return d;
      }));
    }

    logOperation(
      'MODIFICATION',
      'APPROVISIONNEMENTS',
      'appro_comparatifs_offres',
      daId,
      `Enregistrement de ${newOffres.length} offres fournisseurs pour la DA ${da.numero_da}`,
      da.chantier_id
    );

    return { success: true, message: 'Offres comparatives enregistrées avec succès.' };
  };

  const choisirOffreRetenue = (daId: string, offreId: string) => {
    setComparaisonsOffres(prev => prev.map(o => {
      if (o.demande_achat_id === daId) {
        return {
          ...o,
          retenu: o.id === offreId
        };
      }
      return o;
    }));
  };

  const emettreBonCommande = (data: {
    demande_achat_id: string;
    fournisseur_id: string;
    quantite_commandee: number;
    prix_unitaire_ht_dzd: number;
    taux_tva_pct?: number;
    date_livraison_prevue: string;
    delai_paiement?: string;
  }): { success: boolean; message: string; bc?: BonCommande } => {
    // RÈGLE OBLIGATOIRE : La comptabilité ne peut pas émettre de bon de commande
    if (currentUser?.role_id === 'role-compta') {
      return {
        success: false,
        message: 'Interdit : La comptabilité ne peut pas émettre de bon de commande. Cette opération est réservée au Service Approvisionnements.'
      };
    }

    const da = demandesAchat.find(d => d.id === data.demande_achat_id);
    if (!da) return { success: false, message: 'Demande d’achat introuvable.' };

    const fourn = fournisseurs.find(f => f.id === data.fournisseur_id);
    if (!fourn) return { success: false, message: 'Fournisseur introuvable.' };

    const targetChantier = allChantiers.find(c => c.id === da.chantier_id);
    if (!targetChantier) return { success: false, message: 'Chantier destinataire introuvable.' };

    const nowIso = new Date().toISOString();
    const todayStr = nowIso.split('T')[0];
    const tvaPct = data.taux_tva_pct ?? 19;
    const montantHt = data.quantite_commandee * data.prix_unitaire_ht_dzd;
    const montantTva = Math.round(montantHt * (tvaPct / 100));
    const montantTtc = montantHt + montantTva;

    const bcNum = `BC-2026-${String(bonsCommande.length + 1).padStart(4, '0')}`;

    // RÈGLE DE FONCTIONNEMENT FONDAMENTALE :
    // IL N'EXISTE PAS DE MAGASIN CENTRAL. LIVRAISON DIRECTE AU MAGASIN DU CHANTIER CONCERNÉ.
    const adresseMagasinChantier = `Magasin du Chantier ${targetChantier.nom_projet}, ${targetChantier.adresse_site}, ${targetChantier.commune} (${targetChantier.wilaya})`;

    const newBc: BonCommande = {
      id: `bc-${Date.now()}`,
      numero_bc: bcNum,
      demande_achat_id: da.id,
      demande_achat_ref: da.numero_da,
      fournisseur_id: fourn.id,
      fournisseur_nom: fourn.nom_fournisseur,
      fournisseur_nif: fourn.nif,
      fournisseur_rc: fourn.rc,
      fournisseur_telephone: fourn.telephone,
      chantier_destinataire_id: da.chantier_id,
      chantier_destinataire_nom: targetChantier.nom_projet,
      adresse_livraison: adresseMagasinChantier, // STRICTEMENT DIRECT MAGASIN CHANTIER
      contact_reception_magasinier: `Magasinier du Chantier ${targetChantier.nom_projet}`,
      date_commande: todayStr,
      date_livraison_prevue: data.date_livraison_prevue,
      designation_marchandise: da.designation_produit,
      quantite_commandee: data.quantite_commandee,
      unite_mesure: da.unite_mesure,
      prix_unitaire_ht_dzd: data.prix_unitaire_ht_dzd,
      montant_total_ht_dzd: montantHt,
      taux_tva_pct: tvaPct,
      montant_tva_dzd: montantTva,
      montant_total_ttc_dzd: montantTtc,
      delai_paiement: data.delai_paiement || fourn.conditions_paiement,
      statut: 'EMIS',
      etabli_par_id: currentUser?.id || 'user-appro',
      etabli_par_nom: currentUser ? `${currentUser.prenom} ${currentUser.nom} (Approvisionnements)` : 'Responsable Approvisionnements',
      created_at: nowIso
    };

    setBonsCommande(prev => [newBc, ...prev]);

    // Mettre à jour la DA liée -> STATUT "COMMANDEE"
    const newHist: DemandeAchatValidationHistorique = {
      id: `hist-da-${Date.now()}`,
      statut_precedent: da.statut,
      nouveau_statut: 'COMMANDEE',
      auteur_id: currentUser?.id || 'user-appro',
      auteur_nom: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Responsable Approvisionnements',
      auteur_role: 'Responsable Approvisionnements',
      date: nowIso,
      commentaire: `Bon de commande ${bcNum} émis vers ${fourn.nom_fournisseur} pour livraison directe au magasin du chantier ${targetChantier.nom_projet}. Montant TTC : ${montantTtc.toLocaleString('fr-DZ')} DZD.`
    };

    setDemandesAchat(prev => prev.map(d => {
      if (d.id === da.id) {
        return {
          ...d,
          statut: 'COMMANDEE',
          bon_commande_id: newBc.id,
          bon_commande_ref: bcNum,
          historique_validations: [...d.historique_validations, newHist],
          updated_at: nowIso
        };
      }
      return d;
    }));

    // Notifications automatiques
    const notifMagasinier: Notification = {
      id: `notif-bc-mag-${Date.now()}`,
      titre: `Nouvelle commande en cours de livraison au magasin : ${bcNum}`,
      message: `Commande de ${data.quantite_commandee} ${da.unite_mesure} de "${da.designation_produit}" auprès de ${fourn.nom_fournisseur}. Livraison directe prévue le ${data.date_livraison_prevue} au magasin de votre chantier.`,
      type: 'INFO',
      module: 'APPROVISIONNEMENTS',
      chantier_id: da.chantier_id,
      chantier_nom: targetChantier.nom_projet,
      destinataire_id: 'user-magasinier',
      lu: false,
      created_at: nowIso
    };

    const notifCompta: Notification = {
      id: `notif-bc-cpt-${Date.now()}`,
      titre: `Bon de commande émis : ${bcNum} (${montantTtc.toLocaleString('fr-DZ')} DZD)`,
      message: `Commande passée à ${fourn.nom_fournisseur} pour le chantier "${targetChantier.nom_projet}". Engagement de dépenses enregistré.`,
      type: 'INFO',
      module: 'APPROVISIONNEMENTS',
      chantier_id: da.chantier_id,
      chantier_nom: targetChantier.nom_projet,
      destinataire_id: 'user-compta',
      lu: false,
      created_at: nowIso
    };

    setNotifications(prev => [notifMagasinier, notifCompta, ...prev]);

    logOperation(
      'CREATION',
      'APPROVISIONNEMENTS',
      'appro_bons_commande',
      newBc.id,
      `Émission du Bon de Commande ${bcNum} vers ${fourn.nom_fournisseur} pour livraison directe au magasin du chantier ${targetChantier.nom_projet} (${montantTtc} DZD TTC).`,
      da.chantier_id
    );

    return {
      success: true,
      message: `Bon de commande ${bcNum} émis avec succès pour livraison directe au magasin du chantier ${targetChantier.nom_projet}.`,
      bc: newBc
    };
  };

  const enregistrerReceptionChantier = (data: {
    bon_commande_id: string;
    numero_bl_fournisseur: string;
    quantite_recue: number;
    quantite_conforme: number;
    quantite_rejetee: number;
    conformite_qualite: 'CONFORME' | 'NON_CONFORME' | 'RESERVES';
    motif_rejet_ou_reserves?: string;
    numero_plaque_camion?: string;
    nom_chauffeur?: string;
  }): { success: boolean; message: string; br?: BonLivraisonReception } => {
    const bc = bonsCommande.find(b => b.id === data.bon_commande_id);
    if (!bc) return { success: false, message: 'Bon de commande introuvable.' };

    const targetChantier = allChantiers.find(c => c.id === bc.chantier_destinataire_id);

    // Contrôle d'accès magasinier : le magasinier ne peut réceptionner que pour son chantier
    if (currentUser?.type === 'CHANTIER' && !currentUser.chantiers_assignes.includes(bc.chantier_destinataire_id)) {
      return { success: false, message: 'Vous ne pouvez réceptionner de marchandises que pour le magasin de votre propre chantier assigné.' };
    }

    const nowIso = new Date().toISOString();
    const todayStr = nowIso.split('T')[0];
    const siteCodeShort = targetChantier?.code_chantier.split('-')[1] || 'CHT';
    const brNum = `BR-2026-${siteCodeShort}-${String(receptionsChantier.length + 1).padStart(4, '0')}`;

    const isTotal = data.quantite_conforme >= bc.quantite_commandee;
    const statutBr = data.conformite_qualite === 'NON_CONFORME'
      ? 'REFUSE'
      : (data.conformite_qualite === 'RESERVES' ? 'AVEC_RESERVES' : 'RECEPTIONNE_CONFORME');

    const newBr: BonLivraisonReception = {
      id: `br-${Date.now()}`,
      numero_bl_fournisseur: data.numero_bl_fournisseur,
      numero_br_interne: brNum,
      bon_commande_id: bc.id,
      bon_commande_ref: bc.numero_bc,
      chantier_id: bc.chantier_destinataire_id,
      chantier_nom: bc.chantier_destinataire_nom,
      magasinier_id: currentUser?.id || 'user-magasinier',
      magasinier_nom: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Magasinier du Chantier',
      fournisseur_nom: bc.fournisseur_nom,
      date_reception: todayStr,
      quantite_recue: data.quantite_recue,
      unite_mesure: bc.unite_mesure,
      quantite_conforme: data.quantite_conforme,
      quantite_rejetee: data.quantite_rejetee,
      conformite_qualite: data.conformite_qualite,
      motif_rejet_ou_reserves: data.motif_rejet_ou_reserves,
      numero_plaque_camion: data.numero_plaque_camion,
      nom_chauffeur: data.nom_chauffeur,
      visa_magasinier: true,
      statut: statutBr,
      created_at: nowIso
    };

    setReceptionsChantier(prev => [newBr, ...prev]);

    // Mettre à jour le Bon de Commande
    setBonsCommande(prev => prev.map(b => {
      if (b.id === bc.id) {
        return {
          ...b,
          statut: isTotal ? 'LIVRE_TOTAL' : 'LIVRE_PARTIEL'
        };
      }
      return b;
    }));

    // Mettre à jour la DA associée
    const da = demandesAchat.find(d => d.id === bc.demande_achat_id);
    if (da) {
      const nouveauStatutDa: StatutDemandeAchat = isTotal ? 'RECEPTIONNEE' : 'PARTIELLEMENT_LIVREE';
      const histEntry: DemandeAchatValidationHistorique = {
        id: `hist-da-${Date.now()}`,
        statut_precedent: da.statut,
        nouveau_statut: nouveauStatutDa,
        auteur_id: currentUser?.id || 'user-magasinier',
        auteur_nom: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Magasinier Chantier',
        auteur_role: 'Magasinier (Chantier)',
        date: nowIso,
        commentaire: `Réception effectuée au magasin du chantier ${bc.chantier_destinataire_nom} par le magasinier. BR: ${brNum}, BL Fournisseur: ${data.numero_bl_fournisseur}. Conforme: ${data.quantite_conforme} ${bc.unite_mesure}${data.motif_rejet_ou_reserves ? ` | Réserves: ${data.motif_rejet_ou_reserves}` : ''}. Camion: ${data.numero_plaque_camion || 'Non renseigné'}.`
      };

      setDemandesAchat(prev => prev.map(d => {
        if (d.id === da.id) {
          return {
            ...d,
            statut: nouveauStatutDa,
            historique_validations: [...d.historique_validations, histEntry],
            updated_at: nowIso
          };
        }
        return d;
      }));
    }

    // Notifications automatiques
    const notifAppro: Notification = {
      id: `notif-br-app-${Date.now()}`,
      titre: `Marchandises réceptionnées au chantier : ${brNum}`,
      message: `${data.quantite_conforme} ${bc.unite_mesure} de "${bc.designation_marchandise}" réceptionnés avec succès au magasin du chantier "${bc.chantier_destinataire_nom}".`,
      type: data.conformite_qualite === 'CONFORME' ? 'INFO' : 'AVERTISSEMENT',
      module: 'APPROVISIONNEMENTS',
      chantier_id: bc.chantier_destinataire_id,
      chantier_nom: bc.chantier_destinataire_nom,
      destinataire_id: 'user-appro',
      lu: false,
      created_at: nowIso
    };

    const notifCt: Notification = {
      id: `notif-br-ct-${Date.now()}`,
      titre: `Matériaux livrés au magasin de votre chantier : ${bc.designation_marchandise}`,
      message: `Le magasinier vient de réceptionner ${data.quantite_conforme} ${bc.unite_mesure} (BL Fournisseur : ${data.numero_bl_fournisseur}). Vos équipes peuvent en disposer.`,
      type: 'INFO',
      module: 'APPROVISIONNEMENTS',
      chantier_id: bc.chantier_destinataire_id,
      chantier_nom: bc.chantier_destinataire_nom,
      destinataire_id: da?.demandeur_id || 'user-ct',
      lu: false,
      created_at: nowIso
    };

    setNotifications(prev => [notifAppro, notifCt, ...prev]);

    logOperation(
      'CREATION',
      'APPROVISIONNEMENTS',
      'appro_receptions_chantiers',
      newBr.id,
      `Réception au magasin du chantier ${bc.chantier_destinataire_nom} (BR ${brNum}, BL ${data.numero_bl_fournisseur}) : ${data.quantite_conforme} ${bc.unite_mesure} conformes. Camion: ${data.numero_plaque_camion || 'N/A'}.`,
      bc.chantier_destinataire_id
    );

    return {
      success: true,
      message: `Réception ${brNum} enregistrée au magasin du chantier avec succès.`,
      br: newBr
    };
  };

  const enregistrerFactureFournisseur = (data: {
    bon_commande_id: string;
    bon_reception_ref: string;
    numero_facture: string;
    date_facture: string;
    date_echeance: string;
    montant_ht_dzd: number;
    mode_paiement: 'VIREMENT_BANCAIRE' | 'CHEQUE_BANCAIRE' | 'TRAITE';
  }): { success: boolean; message: string; facture?: FactureFournisseur } => {
    const bc = bonsCommande.find(b => b.id === data.bon_commande_id);
    if (!bc) return { success: false, message: 'Bon de commande introuvable.' };

    const tva = Math.round(data.montant_ht_dzd * 0.19);
    const ttc = data.montant_ht_dzd + tva;
    const nowIso = new Date().toISOString();

    const newFacture: FactureFournisseur = {
      id: `fac-${Date.now()}`,
      numero_facture: data.numero_facture,
      bon_commande_id: bc.id,
      bon_commande_ref: bc.numero_bc,
      bon_reception_ref: data.bon_reception_ref,
      fournisseur_id: bc.fournisseur_id,
      fournisseur_nom: bc.fournisseur_nom,
      fournisseur_nif: bc.fournisseur_nif,
      chantier_id: bc.chantier_destinataire_id,
      chantier_nom: bc.chantier_destinataire_nom,
      date_facture: data.date_facture,
      date_echeance: data.date_echeance,
      montant_ht_dzd: data.montant_ht_dzd,
      montant_tva_dzd: tva,
      montant_ttc_dzd: ttc,
      statut_comptable: 'EN_ATTENTE_CONTROLE',
      mode_paiement: data.mode_paiement,
      created_at: nowIso
    };

    setFacturesFournisseurs(prev => [newFacture, ...prev]);

    logOperation(
      'CREATION',
      'COMPTABILITE',
      'appro_factures_fournisseurs',
      newFacture.id,
      `Enregistrement facture fournisseur ${data.numero_facture} (${newFacture.fournisseur_nom}, ${ttc} DZD TTC) pour le chantier ${bc.chantier_destinataire_nom}. Rapprochement 3-voies enclenché.`,
      bc.chantier_destinataire_id
    );

    return {
      success: true,
      message: `Facture fournisseur ${data.numero_facture} enregistrée. Rapprochement avec le bon de réception ${data.bon_reception_ref} et le bon de commande ${bc.numero_bc} prêt pour contrôle comptable.`,
      facture: newFacture
    };
  };

  const validerFactureCompta = (factureId: string, statut: 'BON_A_PAYER' | 'LITIGE' | 'PAYEE') => {
    setFacturesFournisseurs(prev => prev.map(f => {
      if (f.id === factureId) {
        return {
          ...f,
          statut_comptable: statut
        };
      }
      return f;
    }));

    logOperation(
      'MODIFICATION',
      'COMPTABILITE',
      'appro_factures_fournisseurs',
      factureId,
      `Mise à jour statut facture fournisseur vers "${statut}".`,
      undefined
    );
  };

  const addFournisseur = (data: Omit<Fournisseur, 'id' | 'created_at'>): Fournisseur => {
    const newFourn: Fournisseur = {
      ...data,
      id: `fourn-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setFournisseurs(prev => [...prev, newFourn]);

    logOperation(
      'CREATION',
      'APPROVISIONNEMENTS',
      'fournisseurs',
      newFourn.id,
      `Création nouveau fournisseur agréé : ${newFourn.nom_fournisseur} (${newFourn.forme_juridique}, Wilaya: ${newFourn.wilaya})`
    );

    return newFourn;
  };

  const updateFournisseur = (id: string, updates: Partial<Fournisseur>) => {
    setFournisseurs(prev => prev.map(f => (f.id === id ? { ...f, ...updates } : f)));
    logOperation(
      'MODIFICATION',
      'APPROVISIONNEMENTS',
      'fournisseurs',
      id,
      `Mise à jour des coordonnées/conditions du fournisseur ${id}`
    );
  };

  // ==========================================
  // MODULE MAGASIN ET GESTION DES STOCKS
  // ==========================================

  const creerBonSortie = (data: {
    chantier_id: string;
    article_id: string;
    quantite: number;
    destination: string;
    beneficiaire: string;
    motif: string;
  }): { success: boolean; message: string; bs?: BonSortie } => {
    const article = articlesStock.find(a => a.id === data.article_id);
    if (!article) return { success: false, message: 'Article en stock introuvable.' };

    const targetChantier = allChantiers.find(c => c.id === data.chantier_id);
    if (!targetChantier) return { success: false, message: 'Chantier introuvable.' };

    if (article.quantite_stock < data.quantite) {
      return {
        success: false,
        message: `Stock insuffisant au magasin de "${targetChantier.nom_projet}". Stock actuel : ${article.quantite_stock} ${article.unite_mesure}, demandé : ${data.quantite} ${article.unite_mesure}.`
      };
    }

    const nowIso = new Date().toISOString();
    const todayStr = nowIso.split('T')[0];
    const siteCodeShort = targetChantier.code_chantier.split('-')[1] || 'CHT';
    const numeroBs = `BS-2026-${siteCodeShort}-${String(bonsSortie.length + 1).padStart(4, '0')}`;

    const newBs: BonSortie = {
      id: `bs-${Date.now()}`,
      numero_bs: numeroBs,
      chantier_id: data.chantier_id,
      chantier_nom: targetChantier.nom_projet,
      date_emission: todayStr,
      article_id: article.id,
      designation_article: article.designation,
      quantite: data.quantite,
      unite_mesure: article.unite_mesure,
      destination: data.destination,
      beneficiaire: data.beneficiaire,
      motif: data.motif,
      statut_validation_ct: 'EN_ATTENTE',
      statut_confirmation_magasinier: 'EN_ATTENTE',
      created_at: nowIso
    };

    setBonsSortie(prev => [newBs, ...prev]);

    logOperation(
      'CREATION',
      'MAGASIN',
      'magasin_bons_sortie',
      newBs.id,
      `Émission du Bon de Sortie ${numeroBs} pour "${article.designation}" (${data.quantite} ${article.unite_mesure}) sur ${targetChantier.nom_projet}. En attente de validation du Conducteur de Travaux.`,
      data.chantier_id
    );

    return {
      success: true,
      message: `Bon de sortie ${numeroBs} créé avec succès et transmis au Conducteur de Travaux pour validation obligatoire.`,
      bs: newBs
    };
  };

  const validerBonSortieConducteur = (
    bsId: string,
    decision: 'VALIDE' | 'REFUSE',
    motifRefus?: string
  ): { success: boolean; message: string } => {
    const bs = bonsSortie.find(b => b.id === bsId);
    if (!bs) return { success: false, message: 'Bon de sortie introuvable.' };

    const nowIso = new Date().toISOString();

    setBonsSortie(prev => prev.map(b => {
      if (b.id === bsId) {
        return {
          ...b,
          statut_validation_ct: decision,
          conducteur_validateur_id: currentUser?.id || 'user-ct',
          conducteur_validateur_nom: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Conducteur de Travaux',
          date_validation_ct: nowIso,
          motif_refus_ct: decision === 'REFUSE' ? motifRefus : undefined
        };
      }
      return b;
    }));

    logOperation(
      'APPROBATION_TECHNIQUE',
      'MAGASIN',
      'magasin_bons_sortie',
      bsId,
      `Décision Conducteur de Travaux (${decision}) sur le Bon de Sortie ${bs.numero_bs} (${bs.chantier_nom}).${motifRefus ? ` Motif : ${motifRefus}` : ''}`,
      bs.chantier_id
    );

    return {
      success: true,
      message: decision === 'VALIDE'
        ? `Bon de sortie ${bs.numero_bs} validé par le Conducteur de Travaux. Transmis au Magasinier pour confirmation finale.`
        : `Bon de sortie ${bs.numero_bs} refusé.`
    };
  };

  const confirmerBonSortieMagasinier = (bsId: string): { success: boolean; message: string } => {
    const bs = bonsSortie.find(b => b.id === bsId);
    if (!bs) return { success: false, message: 'Bon de sortie introuvable.' };

    if (bs.statut_validation_ct !== 'VALIDE') {
      return { success: false, message: 'Impossible de confirmer : le bon de sortie n’a pas été validé par le Conducteur de Travaux.' };
    }

    const article = articlesStock.find(a => a.id === bs.article_id);
    if (!article) return { success: false, message: 'Article rattaché introuvable en stock.' };

    if (article.quantite_stock < bs.quantite) {
      return { success: false, message: 'Stock insuffisant pour finaliser la sortie magasin.' };
    }

    const nowIso = new Date().toISOString();

    setArticlesStock(prev => prev.map(a => {
      if (a.id === article.id) {
        return {
          ...a,
          quantite_stock: Number((a.quantite_stock - bs.quantite).toFixed(3)),
          updated_at: nowIso
        };
      }
      return a;
    }));

    setBonsSortie(prev => prev.map(b => {
      if (b.id === bsId) {
        return {
          ...b,
          statut_confirmation_magasinier: 'CONFIRME',
          magasinier_confirmateur_id: currentUser?.id || 'user-magasinier',
          magasinier_confirmateur_nom: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Magasinier du Chantier',
          date_confirmation_magasinier: nowIso
        };
      }
      return b;
    }));

    const newMvt: MouvementStock = {
      id: `mvt-${Date.now()}`,
      chantier_id: bs.chantier_id,
      chantier_nom: bs.chantier_nom,
      article_id: article.id,
      article_designation: article.designation,
      type_mouvement: 'SORTIE_CHANTIER',
      quantite: bs.quantite,
      unite_mesure: bs.unite_mesure,
      reference_piece: bs.numero_bs,
      beneficiaire_ou_provenance: `${bs.beneficiaire} (${bs.destination})`,
      date_mouvement: nowIso.split('T')[0],
      auteur_id: currentUser?.id || 'user-magasinier',
      auteur_nom: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Magasinier du Chantier',
      created_at: nowIso
    };

    setMouvementsStock(prev => [newMvt, ...prev]);

    logOperation(
      'VALIDATION_FINANCIERE',
      'MAGASIN',
      'magasin_mouvements',
      newMvt.id,
      `Confirmation de sortie magasin (BS ${bs.numero_bs}) : ${bs.quantite} ${bs.unite_mesure} de "${article.designation}" livrés à ${bs.beneficiaire}. Stock mis à jour.`,
      bs.chantier_id
    );

    return {
      success: true,
      message: `Sortie de stock confirmée par le magasinier. Stock mis à jour pour "${article.designation}". Mouvement verrouillé.`
    };
  };

  const creerTransfertInterChantier = (data: {
    chantier_source_id: string;
    chantier_cible_id: string;
    article_id: string;
    quantite: number;
    motif: string;
  }): { success: boolean; message: string } => {
    const sourceChantier = allChantiers.find(c => c.id === data.chantier_source_id);
    const cibleChantier = allChantiers.find(c => c.id === data.chantier_cible_id);
    const articleSource = articlesStock.find(a => a.id === data.article_id);

    if (!sourceChantier || !cibleChantier || !articleSource) {
      return { success: false, message: 'Chantiers ou article source invalides.' };
    }

    if (articleSource.quantite_stock < data.quantite) {
      return { success: false, message: 'Stock insuffisant sur le chantier source pour effectuer le transfert.' };
    }

    const nowIso = new Date().toISOString();
    const numeroTrf = `TRF-2026-${String(transfertsInterChantier.length + 1).padStart(4, '0')}`;

    const newTrf: TransfertInterChantier = {
      id: `trf-${Date.now()}`,
      numero_transfert: numeroTrf,
      chantier_source_id: sourceChantier.id,
      chantier_source_nom: sourceChantier.nom_projet,
      chantier_cible_id: cibleChantier.id,
      chantier_cible_nom: cibleChantier.nom_projet,
      article_designation: articleSource.designation,
      quantite: data.quantite,
      unite_mesure: articleSource.unite_mesure,
      motif: data.motif,
      statut: 'RECEPTIONNE',
      demandeur_id: currentUser?.id || 'user-ct',
      demandeur_nom: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Conducteur de Travaux',
      created_at: nowIso
    };

    setArticlesStock(prev => prev.map(a => {
      if (a.id === articleSource.id) {
        return { ...a, quantite_stock: Number((a.quantite_stock - data.quantite).toFixed(3)) };
      }
      return a;
    }));

    setArticlesStock(prev => {
      const existingCible = prev.find(a => a.chantier_id === cibleChantier.id && a.code_article === articleSource.code_article);
      if (existingCible) {
        return prev.map(a => a.id === existingCible.id ? { ...a, quantite_stock: Number((a.quantite_stock + data.quantite).toFixed(3)) } : a);
      } else {
        const newArt: ArticleStock = {
          ...articleSource,
          id: `art-${Date.now()}`,
          chantier_id: cibleChantier.id,
          chantier_nom: cibleChantier.nom_projet,
          quantite_stock: data.quantite,
          updated_at: nowIso
        };
        return [...prev, newArt];
      }
    });

    setTransfertsInterChantier(prev => [newTrf, ...prev]);

    // Notification systématique : Direction Générale pour validation, Approvisionnements & Magasin pour information
    notifierDemandeChantier({
      titre: `Transfert de stock inter-chantier : ${numeroTrf}`,
      message: `Demande de transfert de ${data.quantite} ${articleSource.unite_mesure} de "${articleSource.designation}" depuis "${sourceChantier.nom_projet}" vers "${cibleChantier.nom_projet}". Motif: ${data.motif}.`,
      module: 'MAGASIN',
      chantierId: sourceChantier.id,
      chantierNom: sourceChantier.nom_projet,
      entiteType: 'TRANSFERT_STOCK',
      entiteId: newTrf.id,
      lienAction: '/magasin',
      servicesCentraux: [
        { id: 'user-appro', role: 'RESPONSABLE_APPROVISIONNEMENTS', nom: 'Yacine Bouzid (Approvisionnements)' },
        { id: 'user-magasinier', role: 'MAGASINIER', nom: 'Rabah Ghezzal (Magasin Central)' }
      ]
    });

    logOperation(
      'CREATION',
      'MAGASIN',
      'magasin_transferts',
      newTrf.id,
      `Transfert inter-chantier ${numeroTrf} : ${data.quantite} ${articleSource.unite_mesure} de "${articleSource.designation}" transférés de ${sourceChantier.nom_projet} vers ${cibleChantier.nom_projet}.`,
      sourceChantier.id
    );

    return {
      success: true,
      message: `Transfert inter-chantier ${numeroTrf} exécuté avec succès. Les stocks des deux magasins ont été mis à jour de manière indépendante.`
    };
  };

  const enregistrerInventaire = (data: {
    chantier_id: string;
    lignes: { article_id: string; stock_physique: number; observation?: string }[];
  }): { success: boolean; message: string } => {
    const targetChantier = allChantiers.find(c => c.id === data.chantier_id);
    if (!targetChantier) return { success: false, message: 'Chantier introuvable.' };

    const nowIso = new Date().toISOString();
    const siteCodeShort = targetChantier.code_chantier.split('-')[1] || 'CHT';
    const numeroInv = `INV-2026-${siteCodeShort}-${String(inventairesMagasin.length + 1).padStart(2, '0')}`;

    const lignesInventaire = data.lignes.map(l => {
      const art = articlesStock.find(a => a.id === l.article_id);
      const theo = art ? art.quantite_stock : 0;
      const ecart = l.stock_physique - theo;
      return {
        article_id: l.article_id,
        code_article: art?.code_article || 'REF',
        designation: art?.designation || 'Article',
        stock_theorique: theo,
        stock_physique: l.stock_physique,
        ecart,
        observation: l.observation
      };
    });

    const newInv: InventaireMagasin = {
      id: `inv-${Date.now()}`,
      numero_inventaire: numeroInv,
      chantier_id: data.chantier_id,
      chantier_nom: targetChantier.nom_projet,
      date_inventaire: nowIso.split('T')[0],
      magasinier_id: currentUser?.id || 'user-magasinier',
      magasinier_nom: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Magasinier du Chantier',
      lignes: lignesInventaire,
      statut: 'VALIDE_ET_CLOTURE',
      created_at: nowIso
    };

    setArticlesStock(prev => prev.map(a => {
      const matchLigne = lignesInventaire.find(l => l.article_id === a.id);
      if (matchLigne && a.chantier_id === data.chantier_id) {
        return {
          ...a,
          quantite_stock: matchLigne.stock_physique,
          updated_at: nowIso
        };
      }
      return a;
    }));

    setInventairesMagasin(prev => [newInv, ...prev]);

    logOperation(
      'VALIDATION_FINANCIERE',
      'MAGASIN',
      'magasin_inventaires',
      newInv.id,
      `Clôture d'inventaire physique ${numeroInv} pour le magasin du chantier ${targetChantier.nom_projet}. ${lignesInventaire.length} articles comptés.`,
      data.chantier_id
    );

    return {
      success: true,
      message: `Inventaire physique ${numeroInv} enregistré, validé et clôturé. Les stocks du magasin ont été ajustés.`
    };
  };

  const ajouterArticleStock = (data: Omit<ArticleStock, 'id' | 'updated_at'>): ArticleStock => {
    const newArt: ArticleStock = {
      ...data,
      id: `art-${Date.now()}`,
      updated_at: new Date().toISOString()
    };
    setArticlesStock(prev => [...prev, newArt]);

    logOperation(
      'CREATION',
      'MAGASIN',
      'magasin_articles',
      newArt.id,
      `Création article en stock : ${newArt.designation} (${newArt.quantite_stock} ${newArt.unite_mesure}) sur ${newArt.chantier_nom}`,
      newArt.chantier_id
    );

    return newArt;
  };

  // ==========================================
  // MODULE MATÉRIEL ET PARC AUTOMOBILE
  // ==========================================

  const persistMaterialMutation = async (
    url: string,
    method: 'POST' | 'PATCH' | 'DELETE',
    body?: unknown
  ) => {
    try {
      const response = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Opération matériel refusée.');
      await loadApplicationData();
      return result;
    } catch (error) {
      console.error('[BatiProm] Opération matériel non persistée :', error);
      if (typeof window !== 'undefined') window.alert(error instanceof Error ? error.message : 'Opération matériel impossible.');
      return null;
    }
  };

  const ajouterVehicule = async (data: Omit<Vehicule, 'id' | 'created_at'>): Promise<Vehicule | null> => {
    const created = await persistMaterialMutation('/api/materiel/parc', 'POST', data);
    if (!created) return null;
    logOperation('CREATION', 'MATERIEL', 'materiel_engins', created.id, `Ajout véhicule/engin : ${created.marque} ${created.modele} (${created.code_parc})`);
    return created as Vehicule;
  };

  const modifierVehicule = async (id: string, updates: Partial<Vehicule>): Promise<Vehicule | null> => {
    const updated = await persistMaterialMutation('/api/materiel/parc', 'PATCH', { id, ...updates });
    if (!updated) return null;
    logOperation('MODIFICATION', 'MATERIEL', 'materiel_engins', id, `Mise à jour véhicule/engin ${updated.code_parc}`);
    return updated as Vehicule;
  };

  const supprimerVehicule = async (id: string): Promise<boolean> => {
    const vehicle = vehicules.find(item => item.id === id);
    const result = await persistMaterialMutation(`/api/materiel/parc?id=${encodeURIComponent(id)}`, 'DELETE');
    if (!result) return false;
    logOperation('MODIFICATION', 'MATERIEL', 'materiel_engins', id, `Désactivation matériel ${vehicle?.num_interne || id}`);
    return true;
  };

  const affecterVehiculeChantier = async (
    vehiculeId: string,
    chantierId: string,
    chantierNom: string,
    conducteurNom: string,
    motif?: string,
    bonTransfertRef?: string
  ): Promise<Vehicule | null> => {
    const vehicle = vehicules.find(item => item.id === vehiculeId);
    if (!vehicle) return null;
    const date = new Date().toISOString().split('T')[0];
    const history = (vehicle.historique_affectations || []).map(item =>
      !item.date_fin ? { ...item, date_fin: date } : item
    );
    const newAssignment = {
      id: `aff-${Date.now()}`,
      chantier_id: chantierId,
      chantier_nom: chantierNom,
      conducteur_nom: conducteurNom,
      date_debut: date,
      motif: motif || 'Nouvelle affectation opérationnelle',
      bon_transfert_ref: bonTransfertRef || `BT-${Date.now().toString().slice(-4)}`,
    };
    const updated = await persistMaterialMutation('/api/materiel/parc', 'PATCH', {
      id: vehiculeId,
      chantier_id: chantierId,
      conducteur_nom: conducteurNom,
      historique_affectations: [newAssignment, ...history],
      statut: 'ACTIF',
    });
    if (!updated) return null;
    logOperation('TRANSFERT_MATERIEL', 'MATERIEL', 'materiel_engins', vehiculeId, `Transfert ${vehicle.num_interne} vers ${chantierNom} (Conducteur : ${conducteurNom})`, chantierId);
    return updated as Vehicule;
  };

  const mettreAJourCompteur = async (
    vehiculeId: string,
    nouveauKm?: number,
    nouvellesHeures?: number
  ): Promise<Vehicule | null> => {
    const vehicle = vehicules.find(item => item.id === vehiculeId);
    if (!vehicle) return null;
    const updated = await persistMaterialMutation('/api/materiel/parc', 'PATCH', {
      id: vehiculeId,
      kilometrage: nouveauKm !== undefined ? nouveauKm : vehicle.kilometrage,
      heures_fonctionnement: nouvellesHeures !== undefined ? nouvellesHeures : vehicle.heures_fonctionnement,
    });
    if (!updated) return null;
    logOperation('MODIFICATION', 'MATERIEL', 'materiel_engins', vehiculeId, `Relevé compteur ${vehicle.num_interne} : Km=${nouveauKm ?? 'N/A'}, Heures=${nouvellesHeures ?? 'N/A'}`);
    return updated as Vehicule;
  };

  const enregistrerEntretien = async (data: Omit<Entretien, 'id' | 'created_at'>): Promise<Entretien | null> => {
    const created = await persistMaterialMutation('/api/materiel/entretiens', 'POST', {
      vehicule_id: data.vehicule_id,
      type: data.type,
      gravite: data.gravite || 'FAIBLE',
      statut_operation: data.statut_operation || 'EFFECTUE',
      description: data.description,
      date: data.date,
      kilometrage_entretien: data.kilometrage_entretien || 0,
      heures_entretien: data.heures_entretien || 0,
      cout: data.cout || 0,
      garage_nom: data.garage_nom || null,
      piece_rechange_utilisee: data.piece_rechange_utilisee || null,
      facture_ref: data.facture_ref || null,
    });
    if (!created) return null;
    logOperation('CREATION', 'MATERIEL', 'materiel_entretiens', created.id, `Entretien ${data.type} pour ${data.vehicule_nom || data.vehicule_id} (Coût : ${data.cout || 0} DZD)`);
    return created as Entretien;
  };

  const declarerPanne = async (
    vehiculeId: string,
    description: string,
    gravite: 'FAIBLE' | 'MOYENNE' | 'CRITIQUE' | 'IMMOBILISATION' = 'CRITIQUE',
    garageNom?: string,
    coutEstime?: number
  ): Promise<Entretien | null> => {
    const vehicle = vehicules.find(item => item.id === vehiculeId);
    const created = await persistMaterialMutation('/api/materiel/entretiens', 'POST', {
      vehicule_id: vehiculeId,
      type: 'PANNE',
      gravite,
      statut_operation: 'EN_COURS',
      description,
      date: new Date().toISOString().slice(0, 10),
      kilometrage_entretien: vehicle?.kilometrage || 0,
      heures_entretien: vehicle?.heures_fonctionnement || 0,
      cout: coutEstime || 0,
      garage_nom: garageNom || null,
    });
    if (!created) return null;
    logOperation('CREATION', 'MATERIEL', 'materiel_entretiens', created.id, `Déclaration de panne ${gravite} sur ${vehicle?.num_interne || vehiculeId} : ${description}`);
    return created as Entretien;
  };

  const renouvelerAssurance = async (
    vehiculeId: string,
    nouvelleCompagnie: string,
    nouvellePolice: string,
    dateDebut: string,
    dateFin: string,
    coutDzd: number,
    quittanceRef?: string
  ): Promise<Vehicule | null> => {
    const vehicle = vehicules.find(item => item.id === vehiculeId);
    if (!vehicle) return null;
    const updated = await persistMaterialMutation('/api/materiel/parc', 'PATCH', {
      id: vehiculeId,
      assurance_compagnie: nouvelleCompagnie,
      assurance_police: nouvellePolice,
      date_fin_assurance: dateFin,
      assurance_cout_dzd: coutDzd,
    });
    if (!updated) return null;
    await persistMaterialMutation('/api/materiel/entretiens', 'POST', {
      vehicule_id: vehiculeId,
      type: 'ASSURANCE',
      gravite: 'FAIBLE',
      statut_operation: 'EFFECTUE',
      description: `Renouvellement police ${nouvelleCompagnie} (N° ${nouvellePolice}) valable du ${dateDebut} au ${dateFin}.`,
      date: dateDebut,
      kilometrage_entretien: vehicle.kilometrage || 0,
      heures_entretien: vehicle.heures_fonctionnement || 0,
      cout: coutDzd,
      garage_nom: nouvelleCompagnie,
      facture_ref: quittanceRef || null,
    });
    logOperation('MODIFICATION', 'MATERIEL', 'materiel_engins', vehiculeId, `Renouvellement assurance ${vehicle.num_interne} : ${nouvelleCompagnie}, échéance ${dateFin}, prime ${coutDzd} DZD`);
    return updated as Vehicule;
  };

  const permuterPneus = async (
    vehiculeId: string,
    pieceId1: string,
    pieceId2: string,
    km: number,
    motif: string,
    operateur: string
  ): Promise<boolean> => {
    const result = await persistMaterialMutation('/api/materiel/pieces/permutation', 'POST', {
      piece1_id: pieceId1,
      piece2_id: pieceId2,
      kilometrage: km,
      motif,
      operateur,
    });
    if (!result) return false;
    logOperation('MODIFICATION', 'MATERIEL', 'materiel_pieces_remplacables', pieceId1, `Permutation croisée de pneus sur véhicule ${vehiculeId}`);
    return true;
  };

  const remplacerPieceRemplacable = async (
    pieceId: string,
    nouvellePiece: Omit<PieceRemplacable, 'id' | 'created_at'>,
    motif: string,
    note?: string
  ): Promise<PieceRemplacable | null> => {
    const created = await persistMaterialMutation('/api/materiel/pieces/remplacement', 'POST', {
      ancienne_piece_id: pieceId,
      nouvelle_piece: {
        materiel_id: nouvellePiece.vehicule_id,
        type: nouvellePiece.type,
        designation: nouvellePiece.designation,
        marque: nouvellePiece.marque,
        dimensions: nouvellePiece.dimensions,
        numero_serie: nouvellePiece.numero_serie,
        position: nouvellePiece.position,
        date_installation: nouvellePiece.date_installation,
        kilometrage_installation: nouvellePiece.kilometrage_installation,
        heures_installation: nouvellePiece.heures_installation,
        etat: nouvellePiece.etat,
        profondeur_sculpture_mm: nouvellePiece.profondeur_sculpture_mm,
        cout_achat_dzd: nouvellePiece.cout_achat_dzd,
        fournisseur: nouvellePiece.fournisseur,
      },
      motif,
      note,
    });
    if (!created) return null;
    logOperation('MODIFICATION', 'MATERIEL', 'materiel_pieces_remplacables', pieceId, `Remplacement de pièce : ${motif}`);
    return created as PieceRemplacable;
  };

  const gererPieceRemplacable = (data: Omit<PieceRemplacable, 'id' | 'created_at'>): PieceRemplacable => {
    const newPce: PieceRemplacable = {
      ...data,
      id: `pce-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setPiecesRemplacables(prev => [newPce, ...prev]);
    logOperation('CREATION', 'MATERIEL', 'pieces_remplacables', newPce.id, `Suivi composant ${data.type} (${data.designation}) pour véhicule ${data.vehicule_id}`);
    return newPce;
  };

  // Comptabilité & Fiscalité
  const isPeriodeCloturee = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const key = dateStr.slice(0, 7); // "YYYY-MM"
    const found = cloturesComptables.find(c => c.periode_cle === key);
    return found ? found.statut === 'CLOTUREE' : false;
  };

  const executerClotureMensuelle = (
    annee: number,
    mois: number,
    observations?: string
  ): { success: boolean; message: string; cloture?: ClotureComptableMensuelle } => {
    const moisPadded = String(mois).padStart(2, '0');
    const periodeKey = `${annee}-${moisPadded}`;

    const existing = cloturesComptables.find(c => c.periode_cle === periodeKey);
    if (existing && existing.statut === 'CLOTUREE') {
      return {
        success: false,
        message: `La période comptable ${moisPadded}/${annee} est déjà clôturée et verrouillée.`
      };
    }

    const generatedEcritures: EcritureComptable[] = [];

    // 1. Module Ventes VEFA -> Ecritures Ventes (Debit 411000, Credit 701000 & 445700)
    facturesClients
      .filter(f => f.date_facture.startsWith(periodeKey))
      .forEach(f => {
        generatedEcritures.push({
          id: `ecr-v-${f.id}-1`,
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
        generatedEcritures.push({
          id: `ecr-v-${f.id}-2`,
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
          generatedEcritures.push({
            id: `ecr-v-${f.id}-3`,
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

    // 2. Module Achats & Fournisseurs -> Ecritures Achats (Debit 601000 & 445600, Credit 401000 & 404000)
    facturesFournisseurs
      .filter(f => f.date_facture.startsWith(periodeKey))
      .forEach(f => {
        const retenueGarantie = Math.round(f.montant_ht_dzd * 0.05);
        const netFournisseur = f.montant_ttc_dzd - retenueGarantie;

        generatedEcritures.push({
          id: `ecr-a-${f.id}-1`,
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
          generatedEcritures.push({
            id: `ecr-a-${f.id}-2`,
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

        generatedEcritures.push({
          id: `ecr-a-${f.id}-3`,
          piece_ref: f.numero_facture,
          date: f.date_facture,
          journal_code: 'J-ACHATS',
          journal_libelle: 'Journal Achats & Sous-traitance',
          compte_num: '401000',
          compte_libelle: 'Fournisseurs d’investissements et stocks',
          libelle: `Net à payer Fournisseur ${f.fournisseur_nom}`,
          debit_dzd: 0,
          credit_dzd: netFournisseur,
          chantier_id: f.chantier_id,
          chantier_nom: f.chantier_nom
        });

        if (retenueGarantie > 0) {
          generatedEcritures.push({
            id: `ecr-a-${f.id}-4`,
            piece_ref: f.numero_facture,
            date: f.date_facture,
            journal_code: 'J-ACHATS',
            journal_libelle: 'Journal Achats & Sous-traitance',
            compte_num: '404000',
            compte_libelle: 'Fournisseurs - Retenues de garantie (5% BTPH)',
            libelle: `Retenue de garantie 5% conservée`,
            debit_dzd: 0,
            credit_dzd: retenueGarantie,
            chantier_id: f.chantier_id,
            chantier_nom: f.chantier_nom
          });
        }
      });

    // 3. Transactions Financières -> Journal Trésorerie
    transactions
      .filter(t => t.date.startsWith(periodeKey))
      .forEach(t => {
        const pieceRef = t.reference_paiement || `TR-${t.id.slice(-6)}`;
        if (t.type === 'RECETTE') {
          generatedEcritures.push({
            id: `ecr-t-${t.id}-1`,
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
          generatedEcritures.push({
            id: `ecr-t-${t.id}-2`,
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
          const compteDepense = t.categorie === 'SALAIRES' ? '641000' : (t.categorie === 'IMPOTS' ? '447000' : '401000');
          const compteLibelle = t.categorie === 'SALAIRES' ? 'Rémunérations du personnel' : (t.categorie === 'IMPOTS' ? 'Impôts et taxes exigibles' : 'Fournisseurs (Règlement)');

          generatedEcritures.push({
            id: `ecr-t-${t.id}-1`,
            piece_ref: pieceRef,
            date: t.date,
            journal_code: 'J-TRESO',
            journal_libelle: 'Journal Trésorerie & Banque',
            compte_num: compteDepense,
            compte_libelle: compteLibelle,
            libelle: `Décaissement : ${t.libelle}`,
            debit_dzd: t.montant_dzd,
            credit_dzd: 0,
            chantier_id: t.chantier_id,
            chantier_nom: t.chantier_nom
          });
          generatedEcritures.push({
            id: `ecr-t-${t.id}-2`,
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

    // 4. Déclarations Fiscales G50 -> Journal OD
    declarationsFiscales
      .filter(d => `${d.periode_annee}-${String(d.periode_mois).padStart(2, '0')}` === periodeKey)
      .forEach(d => {
        const pieceRef = `G50-${d.periode_mois}/${d.periode_annee}`;
        if (d.details_impots.tva_collectee > 0) {
          generatedEcritures.push({
            id: `ecr-g50-${d.id}-1`,
            piece_ref: pieceRef,
            date: d.date_declaration,
            journal_code: 'J-OD',
            journal_libelle: 'Journal Opérations Diverses & Fiscalité',
            compte_num: '445700',
            compte_libelle: 'TVA Collectée (Solde mensuel G50)',
            libelle: `Régularisation TVA Collectée G50`,
            debit_dzd: d.details_impots.tva_collectee,
            credit_dzd: 0
          });
        }
        if (d.details_impots.tva_deductible > 0) {
          generatedEcritures.push({
            id: `ecr-g50-${d.id}-2`,
            piece_ref: pieceRef,
            date: d.date_declaration,
            journal_code: 'J-OD',
            journal_libelle: 'Journal Opérations Diverses & Fiscalité',
            compte_num: '445600',
            compte_libelle: 'TVA Déductible (Solde mensuel G50)',
            libelle: `Imputation TVA Déductible G50`,
            debit_dzd: 0,
            credit_dzd: d.details_impots.tva_deductible
          });
        }
        if (d.details_impots.irg_salaires > 0) {
          generatedEcritures.push({
            id: `ecr-g50-${d.id}-3`,
            piece_ref: pieceRef,
            date: d.date_declaration,
            journal_code: 'J-OD',
            journal_libelle: 'Journal Opérations Diverses & Fiscalité',
            compte_num: '635000',
            compte_libelle: 'IRG Salaires retenu à la source',
            libelle: `Prélèvement IRG Salaires G50`,
            debit_dzd: d.details_impots.irg_salaires,
            credit_dzd: 0
          });
        }
        if (d.montant_total_dzd > 0) {
          generatedEcritures.push({
            id: `ecr-g50-${d.id}-4`,
            piece_ref: pieceRef,
            date: d.date_declaration,
            journal_code: 'J-OD',
            journal_libelle: 'Journal Opérations Diverses & Fiscalité',
            compte_num: '447000',
            compte_libelle: 'État - Impôts et taxes dus sur G50',
            libelle: `Dette fiscale nette G50 à payer Recette des Impôts`,
            debit_dzd: 0,
            credit_dzd: d.montant_total_dzd
          });
        }
      });

    const totalDebit = generatedEcritures.reduce((s, e) => s + e.debit_dzd, 0);
    const totalCredit = generatedEcritures.reduce((s, e) => s + e.credit_dzd, 0);

    const nowIso = new Date().toISOString();
    const newCloture: ClotureComptableMensuelle = {
      id: `clot-${periodeKey}`,
      periode_cle: periodeKey,
      annee,
      mois,
      statut: 'CLOTUREE',
      date_cloture: nowIso,
      cloture_par_id: currentUser?.id || 'user-compta',
      cloture_par_nom: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Chef Comptable',
      total_debit_dzd: totalDebit,
      total_credit_dzd: totalCredit,
      nombre_ecritures: generatedEcritures.length,
      ecritures: generatedEcritures,
      observations: observations || `Clôture mensuelle automatisée de la période ${moisPadded}/${annee}. Génération des journaux SCF et verrouillage actif.`
    };

    setCloturesComptables(prev => [newCloture, ...prev.filter(c => c.periode_cle !== periodeKey)]);

    logOperation(
      'VALIDATION_FINANCIERE',
      'COMPTABILITE',
      'clotures_comptables',
      newCloture.id,
      `Exécution de la clôture comptable mensuelle pour la période ${moisPadded}/${annee} (${generatedEcritures.length} écritures SCF générées, Total: ${totalDebit.toLocaleString('fr-DZ')} DZD). Période verrouillée.`
    );

    return {
      success: true,
      message: `Clôture mensuelle ${moisPadded}/${annee} exécutée avec succès ! ${generatedEcritures.length} écritures SCF ont été générées et la période est désormais verrouillée.`,
      cloture: newCloture
    };
  };

  const deverrouillerPeriodeComptable = (periodeCle: string): { success: boolean; message: string } => {
    setCloturesComptables(prev => prev.map(c => c.periode_cle === periodeCle ? { ...c, statut: 'OUVERTE' as const } : c));
    logOperation(
      'MODIFICATION',
      'COMPTABILITE',
      'clotures_comptables',
      periodeCle,
      `Déverrouillage exceptionnel de la période comptable ${periodeCle} par la supervision.`
    );
    return {
      success: true,
      message: `La période comptable ${periodeCle} a été déverrouillée.`
    };
  };

  const creerFactureClient = (data: Omit<FactureClient, 'id' | 'created_at' | 'statut_paiement'>): FactureClient => {
    if (isPeriodeCloturee(data.date_facture)) {
      throw new Error(`Période verrouillée : La date ${data.date_facture} appartient à une période comptable clôturée et verrouillée.`);
    }

    const newFac: FactureClient = {
      ...data,
      id: `fac-cli-${Date.now()}`,
      statut_paiement: 'NON_PAYEE',
      created_at: new Date().toISOString()
    };
    setFacturesClients(prev => [newFac, ...prev]);
    logOperation('CREATION', 'COMPTABILITE', 'factures_clients', newFac.id, `Création facture client ${newFac.numero_facture} pour ${newFac.client_nom}`);
    return newFac;
  };

  const enregistrerTransaction = (data: Omit<TransactionFinanciere, 'id' | 'created_at'>): TransactionFinanciere => {
    if (isPeriodeCloturee(data.date)) {
      throw new Error(`Période verrouillée : La date ${data.date} appartient à une période comptable clôturée et verrouillée.`);
    }

    const newTr: TransactionFinanciere = {
      ...data,
      id: `tr-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setTransactions(prev => [newTr, ...prev]);
    logOperation('CREATION', 'COMPTABILITE', 'transactions_financieres', newTr.id, `Enregistrement transaction ${newTr.libelle} (${newTr.montant_dzd} DZD)`);
    return newTr;
  };

  const payerFactureFournisseur = (factureId: string, compteBancaireId: string, reference: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (isPeriodeCloturee(todayStr)) {
      throw new Error(`Période verrouillée : Impossible d'enregistrer le paiement en date d'aujourd'hui (${todayStr}).`);
    }

    setFacturesFournisseurs(prev => prev.map(f => {
      if (f.id === factureId) {
        const updated = { ...f, statut_comptable: 'PAYEE' as const, compte_bancaire_societe_id: compteBancaireId, reference_virement: reference };
        
        // Enregistrer la transaction automatiquement
        enregistrerTransaction({
          date: todayStr,
          type: 'DEPENSE',
          categorie: 'ACHAT_MATERIAUX',
          libelle: `Règlement facture fournisseur ${f.numero_facture} - ${f.fournisseur_nom}`,
          montant_dzd: f.montant_ttc_dzd,
          chantier_id: f.chantier_id,
          chantier_nom: f.chantier_nom,
          compte_bancaire_id: compteBancaireId,
          mode_paiement: f.mode_paiement,
          reference_paiement: reference,
          facture_id: f.id,
          cree_par_id: currentUser?.id || 'system'
        });

        return updated;
      }
      return f;
    }));
  };

  const payerFactureClient = (factureId: string, compteBancaireId: string, reference: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (isPeriodeCloturee(todayStr)) {
      throw new Error(`Période verrouillée : Impossible d'enregistrer l'encaissement en date d'aujourd'hui (${todayStr}).`);
    }

    setFacturesClients(prev => prev.map(f => {
      if (f.id === factureId) {
        const updated = { ...f, statut_paiement: 'PAYEE' as const };
        
        enregistrerTransaction({
          date: todayStr,
          type: 'RECETTE',
          categorie: 'VENTE_VEFA',
          libelle: `Encaissement facture client ${f.numero_facture} - ${f.client_nom}`,
          montant_dzd: f.montant_ttc_dzd,
          chantier_id: f.chantier_id,
          chantier_nom: f.chantier_nom,
          compte_bancaire_id: compteBancaireId,
          mode_paiement: 'VIREMENT_BANCAIRE',
          reference_paiement: reference,
          facture_id: f.id,
          cree_par_id: currentUser?.id || 'system'
        });

        return updated;
      }
      return f;
    }));
  };

  const soumettreDeclarationFiscale = (data: Omit<DeclarationFiscale, 'id' | 'created_at' | 'statut'>): DeclarationFiscale => {
    const periodeStr = `${data.periode_annee}-${String(data.periode_mois).padStart(2, '0')}`;
    if (isPeriodeCloturee(periodeStr)) {
      throw new Error(`Période verrouillée : La période fiscale ${data.periode_mois}/${data.periode_annee} est clôturée et verrouillée.`);
    }

    const newDec: DeclarationFiscale = {
      ...data,
      id: `dec-${Date.now()}`,
      statut: 'DECLAREE',
      created_at: new Date().toISOString()
    };
    setDeclarationsFiscales(prev => [newDec, ...prev]);
    logOperation('CREATION', 'COMPTABILITE', 'declarations_fiscales', newDec.id, `Soumission déclaration fiscale ${data.type} - Période ${data.periode_mois}/${data.periode_annee}`);
    return newDec;
  };

  // Module Juridique & Contentieux
  const ajouterContratJuridique = (data: Omit<ContratJuridique, 'id' | 'created_at' | 'historique_modifications' | 'pieces_jointes'>): ContratJuridique => {
    const nowIso = new Date().toISOString();
    const newCtr: ContratJuridique = {
      ...data,
      id: `ctr-${Date.now()}`,
      responsable_juridique_nom: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Responsable Juridique',
      historique_modifications: [{
        id: `h-${Date.now()}`,
        date: nowIso.split('T')[0],
        auteur: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Service Juridique',
        action: 'Création du contrat',
        details: `Saisie initiale du contrat ${data.numero_contrat}`
      }],
      pieces_jointes: [],
      created_at: nowIso
    };
    setContratsJuridiques(prev => [newCtr, ...prev]);
    logOperation('CREATION', 'JURIDIQUE', 'contrats_juridiques', newCtr.id, `Création contrat juridique ${newCtr.numero_contrat} (${newCtr.titre})`, newCtr.chantier_id);
    return newCtr;
  };

  const ajouterDocumentFoncier = (data: Omit<DocumentFoncierAdmin, 'id' | 'created_at' | 'pieces_jointes'>): DocumentFoncierAdmin => {
    const nowIso = new Date().toISOString();
    const newDoc: DocumentFoncierAdmin = {
      ...data,
      id: `fonc-${Date.now()}`,
      pieces_jointes: [],
      created_at: nowIso
    };
    setDocumentsFonciers(prev => [newDoc, ...prev]);
    logOperation('CREATION', 'JURIDIQUE', 'documents_fonciers', newDoc.id, `Ajout document foncier/administratif ${newDoc.reference_officielle} (${newDoc.titre})`, newDoc.chantier_id);
    return newDoc;
  };

  const ajouterDossierLitige = (data: Omit<DossierLitige, 'id' | 'created_at' | 'historique_audiences' | 'pieces_jointes'>): DossierLitige => {
    const nowIso = new Date().toISOString();
    const newLit: DossierLitige = {
      ...data,
      id: `lit-${Date.now()}`,
      historique_audiences: [],
      pieces_jointes: [],
      created_at: nowIso
    };
    setDossiersLitiges(prev => [newLit, ...prev]);
    logOperation('CREATION', 'JURIDIQUE', 'dossiers_litiges', newLit.id, `Ouverture dossier litige/contentieux ${newLit.numero_dossier} contre ${newLit.partie_adverse}`);
    return newLit;
  };

  const ajouterPieceJointeJuridique = (type: 'CONTRAT' | 'FONCIER' | 'LITIGE', targetId: string, titre: string, nom_fichier: string, taille_ko: number) => {
    const nowIso = new Date().toISOString();
    const newPj = {
      id: `pj-${Date.now()}`,
      titre,
      nom_fichier,
      taille_ko,
      date_upload: nowIso.split('T')[0]
    };

    if (type === 'CONTRAT') {
      setContratsJuridiques(prev => prev.map(c => c.id === targetId ? { ...c, pieces_jointes: [...c.pieces_jointes, newPj] } : c));
    } else if (type === 'FONCIER') {
      setDocumentsFonciers(prev => prev.map(f => f.id === targetId ? { ...f, pieces_jointes: [...f.pieces_jointes, newPj] } : f));
    } else {
      setDossiersLitiges(prev => prev.map(l => l.id === targetId ? { ...l, pieces_jointes: [...l.pieces_jointes, newPj] } : l));
    }
  };

  // Module Commercial & Promotion Immobilière
  const ajouterBienImmobilier = (data: Omit<BienImmobilier, 'id' | 'created_at' | 'updated_at' | 'historique_commercial'>): BienImmobilier => {
    const nowIso = new Date().toISOString();
    const newBien: BienImmobilier = {
      ...data,
      id: `bien-${Date.now()}`,
      historique_commercial: [{
        id: `hc-${Date.now()}`,
        date: nowIso.split('T')[0],
        action: 'CREATION',
        auteur: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Service Commercial',
        description: `Mise au catalogue du lot ${data.reference} (${data.type_bien}, ${data.superficie_habitable_m2}m²)`
      }],
      created_at: nowIso,
      updated_at: nowIso
    };
    setBiensImmobiliers(prev => [newBien, ...prev]);
    logOperation('CREATION', 'COMMERCIAL', 'biens_immobiliers', newBien.id, `Création lot commercial ${newBien.reference} on ${newBien.chantier_nom}`, newBien.chantier_id);
    return newBien;
  };

  const changerStatutBienImmobilier = (bienId: string, statut: StatutBienImmobilier, clientNom?: string, clientTel?: string, remarques?: string) => {
    const nowIso = new Date().toISOString();
    setBiensImmobiliers(prev => prev.map(b => {
      if (b.id === bienId) {
        const actionHist = statut === 'RESERVE' ? 'RESERVATION' : (statut === 'OPTION_RESERVATION' ? 'OPTION' : (statut === 'VENDU' ? 'CONTRAT_VEFA' : 'ANNULE'));
        const newHistEntry = {
          id: `hc-${Date.now()}`,
          date: nowIso.split('T')[0],
          action: actionHist as any,
          auteur: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Agent Commercial',
          description: `Changement de statut vers ${statut}.${clientNom ? ` Client: ${clientNom}` : ''}${remarques ? ` (${remarques})` : ''}`
        };
        return {
          ...b,
          statut,
          client_reservataire_nom: clientNom || b.client_reservataire_nom,
          client_reservataire_tel: clientTel || b.client_reservataire_tel,
          date_reservation: (statut === 'RESERVE' || statut === 'OPTION_RESERVATION') ? nowIso.split('T')[0] : b.date_reservation,
          date_vente_vefa: statut === 'VENDU' ? nowIso.split('T')[0] : b.date_vente_vefa,
          historique_commercial: [newHistEntry, ...b.historique_commercial],
          updated_at: nowIso
        };
      }
      return b;
    }));
    logOperation('MODIFICATION', 'COMMERCIAL', 'biens_immobiliers', bienId, `Mise à jour statut bien commercial ID: ${bienId} -> ${statut}`);
  };

  const ajouterClientProspect = (data: Omit<ClientProspect, 'id' | 'created_at' | 'numero_fiche' | 'nb_visites'>): ClientProspect => {
    const nowIso = new Date().toISOString();
    const numFiche = `CLI-2026-${String(clientsProspects.length + 1).padStart(4, '0')}`;
    const newCli: ClientProspect = {
      ...data,
      id: `cli-${Date.now()}`,
      numero_fiche: numFiche,
      nb_visites: 1,
      created_at: nowIso
    };
    setClientsProspects(prev => [newCli, ...prev]);
    logOperation('CREATION', 'COMMERCIAL', 'clients_prospects', newCli.id, `Création fiche prospect/client ${numFiche} (${newCli.nom} ${newCli.prenom})`);
    return newCli;
  };

  const creerReservationVEFA = (data: { bienId: string; clientId: string; notaireNom: string; prixConvenu: number }): ReservationVenteVEFA => {
    const bien = biensImmobiliers.find(b => b.id === data.bienId);
    const client = clientsProspects.find(c => c.id === data.clientId);
    const nowIso = new Date().toISOString();
    const todayStr = nowIso.split('T')[0];

    const prixTotal = data.prixConvenu || bien?.prix_vente_dzd || 15000000;
    const tranche1 = Math.round(prixTotal * 0.20);
    const tranche2 = Math.round(prixTotal * 0.15);
    const tranche3 = Math.round(prixTotal * 0.25);
    const tranche4 = Math.round(prixTotal * 0.20);
    const tranche5 = Math.round(prixTotal * 0.20);

    const newRes: ReservationVenteVEFA = {
      id: `res-${Date.now()}`,
      numero_contrat_vefa: `VEFA-2026-${bien?.reference.replace(/[^a-zA-Z0-9]/g, '')}-${Math.floor(100+Math.random()*900)}`,
      bien_id: data.bienId,
      bien_ref: bien?.reference || 'Réf Bien',
      chantier_id: bien?.chantier_id || 'cht-001',
      chantier_nom: bien?.chantier_nom || 'Projet BatiProm',
      client_id: data.clientId,
      client_nom: client ? `${client.nom} ${client.prenom}` : 'Client Acquéreur',
      client_nin: client?.nin || '000000000000000000',
      client_tel: client?.telephone || '0550000000',
      notaire_nom: data.notaireNom,
      date_reservation: todayStr,
      date_promesse_vefa: todayStr,
      prix_total_convenu_dzd: prixTotal,
      montant_encaisse_dzd: tranche1,
      solde_restant_dzd: prixTotal - tranche1,
      statut: 'PROMESSE_SIGNEE',
      echeancier_tranches: [
        { id: `tr-${Date.now()}-1`, libelle_tranche: 'Tranche 1 - Réservation (20%)', pct_exige: 20, montant_tranche_dzd: tranche1, date_echeance_prevue: todayStr, statut: 'PAYEE', date_reglement_effectif: todayStr, reference_recu_cpa: `REC-CPA-${Math.floor(10000+Math.random()*90000)}` },
        { id: `tr-${Date.now()}-2`, libelle_tranche: 'Tranche 2 - Fondations (15%)', pct_exige: 15, montant_tranche_dzd: tranche2, date_echeance_prevue: '2026-11-30', statut: 'EXIGIBLE' },
        { id: `tr-${Date.now()}-3`, libelle_tranche: 'Tranche 3 - Structure (25%)', pct_exige: 25, montant_tranche_dzd: tranche3, date_echeance_prevue: '2027-02-28', statut: 'EN_ATTENTE' },
        { id: `tr-${Date.now()}-4`, libelle_tranche: 'Tranche 4 - Second-œuvre (20%)', pct_exige: 20, montant_tranche_dzd: tranche4, date_echeance_prevue: '2027-05-31', statut: 'EN_ATTENTE' },
        { id: `tr-${Date.now()}-5`, libelle_tranche: 'Tranche 5 - Clefs / Livraison (20%)', pct_exige: 20, montant_tranche_dzd: tranche5, date_echeance_prevue: '2027-08-31', statut: 'EN_ATTENTE' }
      ],
      created_at: nowIso
    };

    setReservationsVEFA(prev => [newRes, ...prev]);

    // Mettre à jour le statut du bien vers "RESERVE"
    changerStatutBienImmobilier(data.bienId, 'RESERVE', newRes.client_nom, newRes.client_tel, `Réservation VEFA ${newRes.numero_contrat_vefa}`);

    logOperation('CREATION', 'COMMERCIAL', 'reservations_vefa', newRes.id, `Création contrat réservation VEFA ${newRes.numero_contrat_vefa} pour le lot ${newRes.bien_ref}`);

    return newRes;
  };

  // Service Technique
  const ajouterLotTravaux = (lot: Omit<LotTravaux, 'id'>): LotTravaux => {
    const newLot: LotTravaux = {
      ...lot,
      id: `lot-${Date.now()}`
    };
    setLotsTravaux(prev => [...prev, newLot]);
    logOperation('CREATION', 'TECHNIQUE', 'lots_travaux', newLot.id, `Création du lot de travaux ${newLot.code_lot} - ${newLot.libelle}`);
    return newLot;
  };

  const ajouterPosteTravaux = (poste: Omit<PosteTravaux, 'id'>): PosteTravaux => {
    const newPoste: PosteTravaux = {
      ...poste,
      id: `pos-${Date.now()}`
    };
    setPostesTravaux(prev => [...prev, newPoste]);
    logOperation('CREATION', 'TECHNIQUE', 'postes_travaux', newPoste.id, `Création du poste ${newPoste.code_article} - ${newPoste.designation}`);
    return newPoste;
  };

  const ajouterMetre = (data: Omit<MetreVérification, 'id' | 'statut'>): MetreVérification => {
    const newMetre: MetreVérification = {
      ...data,
      id: `met-${Date.now()}`,
      statut: 'TRANSMIS'
    };
    setMetres(prev => [newMetre, ...prev]);

    const targetPoste = postesTravaux.find(p => p.id === data.poste_id);
    const targetStruct = structuresChantier.find(s => s.id === data.structure_id);
    const targetChantier = allChantiers.find(c => c.id === targetStruct?.chantier_id);

    // Notification systématique : Direction Générale pour arbitrage, Direction Technique pour information
    notifierDemandeChantier({
      titre: `Attachement métré terrain : ${data.saisi_par_nom}`,
      message: `Relevé contradictoire de métré saisi par ${data.saisi_par_nom} (Poste : "${targetPoste?.designation || data.poste_id}", Quantité constatée : ${data.quantite_executee}). Transmis pour arbitrage préalable Direction.`,
      module: 'TECHNIQUE',
      chantierId: targetStruct?.chantier_id,
      chantierNom: targetChantier?.nom_projet,
      entiteType: 'SITUATION_TRAVAUX',
      entiteId: newMetre.id,
      lienAction: '/metres',
      servicesCentraux: [
        { id: 'user-tech', role: 'RESPONSABLE_TECHNIQUE', nom: 'Direction Technique & Travaux' }
      ]
    });

    logOperation('CREATION', 'TECHNIQUE', 'metres_verifications', newMetre.id, `Saisie d'un nouveau métré par ${data.saisi_par_nom}`);
    return newMetre;
  };

  const validerMetre = (metreId: string, decision: 'VALIDE' | 'REJETE') => {
    setMetres(prev => prev.map(m => m.id === metreId ? { ...m, statut: decision } : m));
    logOperation(decision === 'VALIDE' ? 'APPROBATION_TECHNIQUE' : 'MODIFICATION', 'TECHNIQUE', 'metres_verifications', metreId, `Décision sur métré : ${decision}`);
  };

  const soumettreRapportChantier = (data: Omit<RapportChantier, 'id' | 'statut'>): RapportChantier => {
    const newRap: RapportChantier = {
      ...data,
      id: `rap-${Date.now()}`,
      statut: 'VALIDE'
    };
    setRapportsChantier(prev => [newRap, ...prev]);
    logOperation('CREATION', 'TECHNIQUE', 'rapports_chantier', newRap.id, `Nouveau rapport ${data.type} du ${data.date_rapport}`);
    return newRap;
  };

  const ajouterControleCTC = (ctc: Omit<ControleCTC, 'id'>): ControleCTC => {
    const newCtc: ControleCTC = {
      ...ctc,
      id: `ctc-${Date.now()}`
    };
    setControlesCTC(prev => [newCtc, ...prev]);
    logOperation('CREATION', 'TECHNIQUE', 'controles_ctc', newCtc.id, `Ajout PV Contrôle CTC ${newCtc.numero_pv} - Avis ${newCtc.avis}`);
    return newCtc;
  };

  const ajouterPlanBET = (plan: Omit<PlanBET, 'id'>): PlanBET => {
    const newPlan: PlanBET = {
      ...plan,
      id: `pln-${Date.now()}`
    };
    setPlansBET(prev => [newPlan, ...prev]);
    logOperation('CREATION', 'TECHNIQUE', 'plans_bet', newPlan.id, `Diffusion plan BET ${newPlan.code_plan} Indice ${newPlan.indice}`);
    return newPlan;
  };

  const ajouterSituationTravaux = (sit: Omit<SituationTravaux, 'id'>): SituationTravaux => {
    const newSit: SituationTravaux = {
      ...sit,
      id: `sit-${Date.now()}`
    };
    setSituationsTravaux(prev => [newSit, ...prev]);

    const cNom = allChantiers.find(c => c.id === sit.chantier_id)?.nom_projet || 'Chantier';

    // Notification systématique : Direction Générale pour validation, Direction Technique & Comptabilité pour information
    notifierDemandeChantier({
      titre: `Situation de travaux sous-traitant : ${newSit.numero_situation}`,
      message: `Situation de travaux transmise par ${newSit.entreprise_sous_traitante} pour le chantier "${cNom}" (Mois: ${newSit.periode_mois}, Montant cumulé: ${newSit.montant_cumule_ht_dzd.toLocaleString('fr-DZ')} DZD). Validation Direction requise avant paiement.`,
      module: 'TECHNIQUE',
      chantierId: sit.chantier_id,
      chantierNom: cNom,
      entiteType: 'SITUATION_TRAVAUX',
      entiteId: newSit.id,
      lienAction: '/suivi-travaux',
      servicesCentraux: [
        { id: 'user-tech', role: 'RESPONSABLE_TECHNIQUE', nom: 'Direction Technique & Travaux' },
        { id: 'user-compta', role: 'RESPONSABLE_COMPTABILITE', nom: 'Farid Saidi (Comptabilité & Fiscalité)' }
      ]
    });

    logOperation('CREATION', 'TECHNIQUE', 'situations_travaux', newSit.id, `Création situation travaux ${newSit.numero_situation}`);
    return newSit;
  };

  const validerSituationTravaux = (id: string, statut: SituationTravaux['statut']) => {
    setSituationsTravaux(prev => prev.map(s => s.id === id ? { ...s, statut, valide_par_nom: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : undefined } : s));
    logOperation('APPROBATION_TECHNIQUE', 'TECHNIQUE', 'situations_travaux', id, `Validation situation travaux -> ${statut}`);
  };

  return (
    <AppContext.Provider
      value={{
        entreprise,
        updateEntreprise,
        comptesBancaires,
        addCompteBancaire,
        updateCompteBancaire,
        deleteCompteBancaire,
        parametresGeneraux,
        updateParametresGeneraux,
        currentLanguage,
        setLanguage,
        isRtl,
        deleteChantierControlled,
        chantiers: authorizedChantiers,
        allChantiers,
        selectedChantierId,
        setSelectedChantierId,
        currentChantier,
        addChantier,
        updateChantier,
        currentUser,
        isAuthenticated: !!currentUser,
        login,
        logout,
        switchUserPersona,
        resetUserPassword,
        utilisateurs,
        addUtilisateur,
        updateUtilisateur,
        deleteUtilisateur,
        getUserSessions,
        revokeSession,
        roles,
        permissions,
        rolePermissions,
        updateRolePermission,
        saveRbacMatrix,
        verifyAccess,
        hasPermission,
        notifications,
        unreadNotificationsCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        traiterValidationNotificationDirection,
        auditLogs,
        logOperation,
        documents,
        addDocument,
        
        // RH & Pointage
        employes,
        addEmploye,
        updateEmploye,
        transfererEmploye,
        affectationsHistorique,
        congesAbsences,
        addCongeAbsence,
        updateCongeStatut,
        pointages,
        enregistrerPointage,
        demandesDerogation,
        soumettreDemandeDerogationPointage,
        traiterDemandeDerogation,
        simulatedPointageTime,
        setSimulatedPointageTime,

        // Achats & Approvisionnements (Circuit Direct Chantiers)
        fournisseurs,
        demandesAchat,
        comparaisonsOffres,
        bonsCommande,
        receptionsChantier,
        facturesFournisseurs,
        creerDemandeAchat,
        validerDemandeAchatComptabilite,
        enregistrerOffresFournisseurs,
        choisirOffreRetenue,
        emettreBonCommande,
        enregistrerReceptionChantier,
        enregistrerFactureFournisseur,
        validerFactureCompta,
        addFournisseur,
        updateFournisseur,

        // Magasin & Gestion des Stocks
        articlesStock,
        mouvementsStock,
        bonsSortie,
        transfertsInterChantier,
        inventairesMagasin,
        creerBonSortie,
        validerBonSortieConducteur,
        confirmerBonSortieMagasinier,
        creerTransfertInterChantier,
        enregistrerInventaire,
        ajouterArticleStock,

        // Matériel & Parc Automobile
        vehicules,
        entretiens,
        piecesRemplacables,
        ajouterVehicule,
        modifierVehicule,
        supprimerVehicule,
        affecterVehiculeChantier,
        mettreAJourCompteur,
        enregistrerEntretien,
        declarerPanne,
        renouvelerAssurance,
        gererPieceRemplacable,
        permuterPneus,
        remplacerPieceRemplacable,

        // Comptabilité & Fiscalité
        facturesClients,
        transactions,
        declarationsFiscales,
        cloturesComptables,
        isPeriodeCloturee,
        executerClotureMensuelle,
        deverrouillerPeriodeComptable,
        creerFactureClient,
        enregistrerTransaction,
        payerFactureFournisseur,
        payerFactureClient,
        soumettreDeclarationFiscale,

        // Module Juridique & Contentieux
        contratsJuridiques,
        documentsFonciers,
        dossiersLitiges,
        ajouterContratJuridique,
        ajouterDocumentFoncier,
        ajouterDossierLitige,
        ajouterPieceJointeJuridique,

        // Module Commercial & Promotion Immobilière
        biensImmobiliers,
        clientsProspects,
        reservationsVEFA,
        ajouterBienImmobilier,
        changerStatutBienImmobilier,
        ajouterClientProspect,
        creerReservationVEFA,

        // Service Technique
        lotsTravaux,
        structuresChantier,
        postesTravaux,
        metres,
        rapportsChantier,
        controlesCTC,
        plansBET,
        situationsTravaux,
        ajouterLotTravaux,
        ajouterPosteTravaux,
        ajouterMetre,
        validerMetre,
        soumettreRapportChantier,
        ajouterControleCTC,
        ajouterPlanBET,
        ajouterSituationTravaux,
        validerSituationTravaux,

        activeNav,
        setActiveNav,
        securityViolation,
        clearSecurityViolation
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
