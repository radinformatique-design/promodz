/**
 * Architecture Relationnelle - BatiProm Algérie
 * Système de Gestion Multi-Chantiers pour Promoteur Immobilier
 */

export type UserType = 'CENTRAL' | 'CHANTIER';

export type UserRole = 
  // Utilisateurs Centraux
  | 'ADMINISTRATEUR'
  | 'RESPONSABLE_RH'
  | 'RESPONSABLE_JURIDIQUE'
  | 'RESPONSABLE_COMPTABILITE'
  | 'RESPONSABLE_TECHNIQUE'
  | 'RESPONSABLE_MATERIEL'
  | 'RESPONSABLE_COMMERCIAL'
  | 'RESPONSABLE_APPROVISIONNEMENTS'
  // Utilisateurs Chantiers
  | 'CONDUCTEUR_TRAVAUX'
  | 'METREUR_VERIFICATEUR'
  | 'MAGASINIER';

export type PermissionAction = 
  | 'CONSULTER'
  | 'AJOUTER'
  | 'MODIFIER'
  | 'SUPPRIMER'
  | 'VALIDER'
  | 'REFUSER'
  | 'EXPORTER';

export type ModuleCode = 
  | 'DASHBOARD'
  | 'ADMINISTRATION'
  | 'RH'
  | 'JURIDIQUE'
  | 'COMPTABILITE'
  | 'TECHNIQUE'
  | 'MATERIEL'
  | 'COMMERCIAL'
  | 'APPROVISIONNEMENTS'
  | 'MAGASIN'
  | 'CHANTIERS'
  | 'NOTIFICATIONS'
  | 'PARAMETRES'
  | 'DOCUMENTS';

export type ChantierStatut = 
  | 'ETUDE_FONCIERE'
  | 'PERMIS_EN_COURS'
  | 'TERRASSEMENT'
  | 'GROS_OEUVRE'
  | 'SECOND_OEUVRE'
  | 'FINITIONS'
  | 'LIVRAISON_RECEPTION'
  | 'CLOTURE';

export type NotificationType = 'INFO' | 'AVERTISSEMENT' | 'CRITIQUE' | 'VALIDATION_REQUISE';

export type AuditAction = 
  | 'CREATION'
  | 'MODIFICATION'
  | 'SUPPRESSION'
  | 'VALIDATION_FINANCIERE'
  | 'APPROBATION_TECHNIQUE'
  | 'TRANSFERT_MATERIEL'
  | 'ACCES_REFUSE'
  | 'EXPORT_DONNEES';

// ==========================================
// ENTITÉS RELATIONNELLES CENTRALES
// ==========================================

export interface Entreprise {
  id: string;
  raison_sociale: string;
  nom_commercial: string;
  forme_juridique: 'SARL' | 'SPA' | 'EURL' | 'SNC';
  capital_social: number; // en DZD
  rc: string; // Registre du Commerce
  nif: string; // Numéro d'Identification Fiscale
  nis: string; // Numéro d'Identification Statistique
  article_imposition: string;
  agrement_promoteur: string; // Numéro d'agrément Ministère de l'Habitat
  date_agrement?: string;
  adresse_siege: string;
  wilaya: string;
  commune_siege?: string;
  code_postal?: string;
  telephone: string;
  email: string;
  site_web?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CompteBancaire {
  id: string;
  entreprise_id: string; // FK -> Entreprise
  nom_banque: string; // BNA, BEA, CPA, BDL, CNEP, BADR, SGA, Al Baraka...
  code_banque: string;
  agence: string;
  titulaire: string;
  rib: string; // 20 chiffres
  iban?: string;
  swift_bic?: string;
  devise: 'DZD' | 'EUR' | 'USD';
  actif: boolean;
  is_compte_principal: boolean;
  type_compte: 'COURANT' | 'SEQUESTRE_VEFA' | 'EPARGNE' | 'DEVISES';
  chantier_dedie_id?: string; // FK -> Chantier si compte dédié VEFA
  chantier_dedie_nom?: string;
  created_at: string;
  updated_at: string;
}

export interface UniteMesure {
  id: string;
  code: string;
  libelle: string;
  symbole: string;
  categorie: 'SURFACE' | 'VOLUME' | 'POIDS' | 'LONGUEUR' | 'UNITE';
}

export interface ExerciceComptable {
  id: string;
  annee: number;
  date_debut: string;
  date_fin: string;
  statut: 'OUVERT' | 'CLOTURE';
  observations?: string;
}

export interface ParametresGeneraux {
  id: string;
  entreprise_id: string;
  devise_principale: 'DZD' | 'EUR' | 'USD';
  langue_defaut: 'fr' | 'ar';
  is_rtl: boolean;
  format_date: 'JJ/MM/AAAA' | 'AAAA-MM-JJ' | 'JJ-MM-AAAA';
  horaires_travail: {
    debut: string; // ex: "08:00"
    fin: string; // ex: "16:30"
    pause_dejeuner_debut: string;
    pause_dejeuner_fin: string;
    jours_ouvres: string[]; // Dimanche au Jeudi
  };
  heure_limite_pointage: string; // ex: "08:15"
  notifications_config: {
    email_actif: boolean;
    sms_actif: boolean;
    alerte_depassement_budget_pct: number; // 85%
    rappel_delai_jours_ctc: number; // 15 jours
    alerte_stock_critique: boolean;
    alerte_retard_livraison: boolean;
    notifier_direction_generale: boolean;
  };
  unites_mesure: UniteMesure[];
  exercices_comptables: ExerciceComptable[];
  updated_at: string;
}

export interface Chantier {
  id: string;
  entreprise_id: string; // FK -> Entreprise
  code_chantier: string; // e.g. "CHT-2024-001"
  nom_projet: string;
  description?: string;
  wilaya: string; // Wilaya en Algérie (Alger, Oran, Constantine, etc.)
  commune: string;
  adresse_site: string;
  superficie_terrain_m2: number;
  surface_plancher_m2: number;
  nombre_logements: number;
  nombre_locaux_commerciaux: number;
  nombre_niveaux: string; // ex: 2SS + RDC + 9
  permis_construire_ref?: string;
  date_obtention_permis?: string;
  date_ouverture_chantier: string;
  date_livraison_prevue: string;
  budget_global_prevu: number; // en DZD
  budget_engage: number; // en DZD
  statut: ChantierStatut;
  taux_avancement_physique: number; // 0 - 100 %
  directeur_chantier_id?: string; // FK -> Utilisateur
  conducteur_travaux_id?: string; // FK -> Utilisateur
  bureau_etudes?: string;
  organisme_ctc?: string; // Organisme CTC Algérie
  geolocalisation?: {
    latitude: number;
    longitude: number;
  };
  created_at: string;
  updated_at: string;
}

export interface Utilisateur {
  id: string;
  entreprise_id: string; // FK -> Entreprise
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  poste: string;
  type: UserType; // CENTRAL (Siège) ou CHANTIER (Terrain)
  role_id: string; // FK -> Role
  statut: 'ACTIF' | 'SUSPENDU' | 'DESACTIVE';
  photo_url?: string;
  chantiers_assignes: string[]; // Liste des IDs de chantiers autorisés
  dernier_acces?: string;
  must_change_password?: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  token: string;
  ip_address: string;
  device_info: string;
  created_at: string;
  expires_at: string;
  is_revoked: boolean;
  last_activity: string;
}

export interface PasswordResetRequest {
  id: string;
  email: string;
  token: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}

export interface Role {
  id: string;
  code: UserRole;
  libelle: string;
  description: string;
  is_system: boolean;
  niveau_hierarchique: number;
  created_at: string;
}

export interface Permission {
  id: string;
  module: ModuleCode;
  action: PermissionAction;
  code: string; // ex: "CHANTIER:CREATE", "COMPTABILITE:VALIDATE"
  description: string;
}

export interface RolePermission {
  role_id: string; // FK -> Role
  permission_id: string; // FK -> Permission
}

export interface UtilisateurChantierAffectation {
  id: string;
  utilisateur_id: string; // FK -> Utilisateur
  chantier_id: string; // FK -> Chantier
  role_specifique_chantier?: string;
  date_affectation: string;
  is_responsable_principal: boolean;
  actif: boolean;
}

// ==========================================
// SÉCURITÉ, AUDIT ET NOTIFICATIONS
// ==========================================

export interface AuditLog {
  id: string;
  created_at: string;
  utilisateur_id: string; // FK -> Utilisateur
  utilisateur_nom: string;
  utilisateur_email: string;
  chantier_id?: string; // FK -> Chantier (optionnel si opération centrale)
  chantier_nom?: string;
  module: ModuleCode;
  action: AuditAction;
  entite_cible: string; // Nom de la table ou de l'entité
  entite_id: string;
  description: string;
  adresse_ip: string;
  user_agent?: string;
  details_modifications?: {
    avant?: Record<string, unknown>;
    apres?: Record<string, unknown>;
  };
}

export interface NotificationActionHistory {
  id: string;
  date: string;
  auteur: string;
  action: string;
  commentaire?: string;
}

export interface Notification {
  id: string;
  created_at: string;
  titre: string;
  message: string;
  type: NotificationType;
  module: ModuleCode;
  priorite?: 'BASSE' | 'NORMALE' | 'HAUTE' | 'URGENTE';
  statut_validation?: 'EN_ATTENTE' | 'VALIDE' | 'REFUSE' | 'NON_APPLICABLE';
  expediteur_id?: string;
  expediteur_nom?: string;
  expediteur_role?: string;
  destinataire_id?: string;
  destinataire_role?: string;
  destinataire_nom?: string;
  chantier_id?: string; // FK -> Chantier (null si notification globale)
  chantier_nom?: string;
  lu: boolean;
  date_lecture?: string;
  lien_action?: string;
  historique_actions?: NotificationActionHistory[];
  entite_type?: 'DEMANDE_ACHAT' | 'DEROGATION_POINTAGE' | 'CONGE' | 'TRANSFERT_STOCK' | 'MATERIEL' | 'SITUATION_TRAVAUX' | 'RAPPORT' | 'AUTRE';
  entite_id?: string;
}

export interface DocumentGED {
  id: string;
  titre: string;
  reference_officielle?: string;
  chantier_id?: string; // FK -> Chantier (null si document général siège)
  chantier_nom?: string;
  module: ModuleCode;
  categorie: 
    | 'PERMIS_ET_JURIDIQUE'
    | 'PLAN_TECHNIQUE'
    | 'CONTRAT_SOUS_TRAITANT'
    | 'FACTURE_ET_SITUATION'
    | 'RAPPORT_CTC'
    | 'BON_COMMANDE'
    | 'FICHE_SECURITE'
    | 'RH_CONTRAT';
  nom_fichier: string;
  extension: string;
  taille_ko: number;
  mime_type: string;
  version: string;
  est_valide_juridiquement: boolean;
  uploade_par_id: string; // FK -> Utilisateur
  uploade_par_nom: string;
  created_at: string;
  updated_at: string;
}

// ==========================================
// RESSOURCES HUMAINES & GESTION DU PERSONNEL
// ==========================================

export type CategorieProfessionnelle =
  | 'MACON'
  | 'CONDUCTEUR_ENGIN'
  | 'FERRAILLEUR'
  | 'COFFREUR'
  | 'MANOEUVRE'
  | 'ELECTRICIEN'
  | 'PLOMBIER'
  | 'TOPOGRAPHE'
  | 'CHEF_EQUIPE'
  | 'SOUDEUR'
  | 'PEINTRE'
  | 'ETANCHEUR'
  | 'CADRE_ADMINISTRATIF'
  | 'INGENIEUR'
  | 'COMPTABLE'
  | 'JURISTE'
  | 'ASSISTANT'
  | 'COMMERCIAL';

export type TypeContrat =
  | 'CDD_CHANTIER' // Contrat de chantier à durée déterminée
  | 'CDD'          // Contrat à durée déterminée (Administration / Siège)
  | 'CDI'          // Contrat à durée indéterminée
  | 'JOURNALIER'   // Tâcheron / Prestation journalière
  | 'STAGE'        // Stage d'insertion professionnelle
  | 'APPRENTI';

export type QualificationEmploye =
  | 'QUALIFIE'
  | 'HAUTEMENT_QUALIFIE'
  | 'SPECIALISE'
  | 'MANOEUVRE_ORDINAIRE'
  | 'MAITRISE'
  | 'CADRE_DIRIGEANT'
  | 'CADRE_SUPERIEUR'
  | 'INGENIEUR_ETUDES'
  | 'TECHNICIEN_SUPERIEUR'
  | 'AGENT_ADMINISTRATIF';

export type EmployeStatut =
  | 'ACTIF'
  | 'EN_CONGE'
  | 'ARRET_MALADIE'
  | 'SUSPENDU'
  | 'FIN_DE_CONTRAT';

export interface Employe {
  id: string;
  entreprise_id: string;
  matricule: string; // ex: "EMP-2024-0012"
  nom: string;
  prenom: string;
  date_naissance: string;
  lieu_naissance: string;
  wilaya_naissance: string;
  nationalite: string;
  nin: string; // Numéro d'Identification National (18 chiffres)
  num_cnas: string; // Numéro de Sécurité Sociale CNAS
  groupe_sanguin?: string;
  telephone: string;
  adresse: string;
  commune: string;
  wilaya: string;
  personne_urgence_nom: string;
  personne_urgence_tel: string;
  
  // Informations Professionnelles
  categorie: CategorieProfessionnelle;
  qualification: QualificationEmploye | string;
  type_contrat: TypeContrat;
  date_embauche: string;
  date_fin_contrat?: string;
  salaire_base_dzd: number;
  
  // Affectation actuelle
  chantier_actuel_id: string; // FK -> Chantier
  chantier_actuel_nom: string;
  date_affectation_actuelle: string;
  
  statut: EmployeStatut;
  
  // Dossier & Pièces Administratives
  documents_fournis: {
    carte_chifa_cnas: boolean;
    certificat_medical_aptitude: boolean;
    copie_cni_nin: boolean;
    attestation_travail_ou_diplome: boolean;
    photos_identite: boolean;
    fiche_anthropometrique: boolean;
  };
  
  created_at: string;
  updated_at: string;
}

export interface AffectationHistorique {
  id: string;
  employe_id: string;
  employe_nom: string;
  employe_matricule: string;
  chantier_source_id?: string;
  chantier_source_nom?: string;
  chantier_cible_id: string;
  chantier_cible_nom: string;
  date_effet: string;
  date_fin?: string;
  motif: string;
  valide_par_id: string;
  valide_par_nom: string;
  created_at: string;
}

export type PointageStatut =
  | 'PRESENT'
  | 'ABSENT_INJUSTIFIE'
  | 'ABSENT_JUSTIFIE'
  | 'RETARD'
  | 'CONGE';

export interface PointageLigne {
  id: string;
  chantier_id: string;
  employe_id: string;
  employe_nom: string;
  employe_matricule: string;
  employe_categorie: CategorieProfessionnelle;
  date: string; // "AAAA-MM-JJ"
  statut: PointageStatut;
  heure_arrivee?: string; // "07:55", "08:30"
  heure_depart?: string;  // "16:30"
  minutes_retard?: number;
  heures_travaillees: number; // ex: 8
  observations?: string;
  saisi_par_id: string;
  saisi_par_nom: string;
  verrouille: boolean;
  derogation_id?: string;
  updated_at: string;
}

export interface DemandeDerogationPointage {
  id: string;
  pointage_id?: string;
  chantier_id: string;
  chantier_nom: string;
  date_pointage: string;
  employe_id: string;
  employe_nom: string;
  employe_matricule: string;
  demandeur_id: string;
  demandeur_nom: string;
  demandeur_role: string;
  statut_actuel: PointageStatut;
  statut_demande: PointageStatut;
  heure_arrivee_demandee?: string;
  motif_demande: string;
  statut_demande_approbation: 'EN_ATTENTE' | 'VALIDEE' | 'REFUSEE';
  traite_par_id?: string;
  traite_par_nom?: string;
  date_traitement?: string;
  motif_refus?: string;
  created_at: string;
}

export interface CongeAbsence {
  id: string;
  employe_id: string;
  employe_nom: string;
  employe_matricule: string;
  chantier_id: string;
  type: 'CONGE_PAYE' | 'MALADIE_CNAS' | 'ACCIDENT_TRAVAIL' | 'SANS_SOLDE' | 'EVENEMENT_FAMILIAL';
  date_debut: string;
  date_fin: string;
  nombre_jours: number;
  motif: string;
  certificat_medical_ref?: string;
  statut: 'EN_ATTENTE' | 'VALIDE' | 'REFUSE';
  valide_par_nom?: string;
  created_at: string;
}

// ==========================================
// ACHATS, FOURNISSEURS & APPROVISIONNEMENTS CHANTIERS
// ==========================================

export type StatutDemandeAchat =
  | 'BROUILLON'
  | 'EN_ATTENTE_DIRECTION'
  | 'EN_ATTENTE_COMPTABILITE'
  | 'REFUSEE'
  | 'VALIDEE'
  | 'EN_COURS_APPROVISIONNEMENT'
  | 'COMMANDEE'
  | 'PARTIELLEMENT_LIVREE'
  | 'LIVREE'
  | 'RECEPTIONNEE'
  | 'CLOTUREE';

export type NiveauUrgence = 'NORMAL' | 'URGENT' | 'CRITIQUE_ARRET_CHANTIER';

export interface Fournisseur {
  id: string;
  entreprise_id: string;
  nom_fournisseur: string;
  forme_juridique: 'SARL' | 'SPA' | 'EURL';
  categorie: 'MATERIAUX_GROS_OEUVRE' | 'ACIER_ARMATURES' | 'CIMENT_BETON' | 'SECOND_OEUVRE' | 'ELECTRICITE_PLOMBERIE' | 'LOCATION_ENGINS' | 'OUTILLAGE_EPI';
  nif: string;
  rc: string;
  nis: string;
  adresse: string;
  wilaya: string;
  telephone: string;
  email: string;
  contact_commercial: string;
  delai_livraison_moyen_jours: number;
  conditions_paiement: string;
  rib?: string; // RIB Bancaire / CCP 20 chiffres
  banque_nom?: string; // Nom Banque (ex: BNA, BEA, CPA, BDL, CNEP)
  agence_banque?: string; // Agence bancaire
  actif: boolean;
  note_qualite: number; // 1-5
  created_at: string;
}

export interface DemandeAchatValidationHistorique {
  id: string;
  statut_precedent: StatutDemandeAchat;
  nouveau_statut: StatutDemandeAchat;
  auteur_id: string;
  auteur_nom: string;
  auteur_role: string;
  date: string;
  commentaire?: string;
}

export interface DemandeAchat {
  id: string;
  numero_da: string; // ex: "DA-2026-CHT01-0042"
  chantier_id: string; // FK -> Chantier
  chantier_nom: string;
  demandeur_id: string; // FK -> Utilisateur (Conducteur de travaux)
  demandeur_nom: string;
  demandeur_role: string;
  date_demande: string;
  designation_produit: string;
  famille_article: string;
  quantite_demandee: number;
  unite_mesure: string; // Tonne, Sac 50kg, m³, m², ML, Unité...
  niveau_urgence: NiveauUrgence;
  justification: string;
  date_besoin_chantier: string;
  estimation_budget_dzd?: number;
  statut: StatutDemandeAchat;
  historique_validations: DemandeAchatValidationHistorique[];
  bon_commande_id?: string;
  bon_commande_ref?: string;
  created_at: string;
  updated_at: string;
}

export interface ComparaisonOffre {
  id: string;
  demande_achat_id: string;
  fournisseur_id: string;
  fournisseur_nom: string;
  prix_unitaire_ht_dzd: number;
  tva_pct: number; // ex: 19%
  delai_livraison_jours: number;
  frais_transport_dzd: number;
  modalite_paiement: string;
  retenu: boolean;
  observations?: string;
}

export interface BonCommande {
  id: string;
  numero_bc: string; // ex: "BC-2026-0019"
  demande_achat_id: string;
  demande_achat_ref: string;
  fournisseur_id: string;
  fournisseur_nom: string;
  fournisseur_nif: string;
  fournisseur_rc: string;
  fournisseur_telephone: string;
  
  // LIVRAISON DIRECTE AU MAGASIN DU CHANTIER (Pas de magasin central)
  chantier_destinataire_id: string;
  chantier_destinataire_nom: string;
  adresse_livraison: string;
  contact_reception_magasinier: string;
  
  date_commande: string;
  date_livraison_prevue: string;
  designation_marchandise: string;
  quantite_commandee: number;
  unite_mesure: string;
  prix_unitaire_ht_dzd: number;
  montant_total_ht_dzd: number;
  taux_tva_pct: number; // 19%
  montant_tva_dzd: number;
  montant_total_ttc_dzd: number;
  delai_paiement: string;
  statut: 'EMIS' | 'CONFIRME_FOURNISSEUR' | 'EN_LIVRAISON' | 'LIVRE_PARTIEL' | 'LIVRE_TOTAL' | 'FACTURE' | 'ANNULE';
  etabli_par_id: string;
  etabli_par_nom: string;
  created_at: string;
}

export interface BonLivraisonReception {
  id: string;
  numero_bl_fournisseur: string; // ex: "BL-GICA-98214"
  numero_br_interne: string;     // ex: "BR-2026-CHT01-0012"
  bon_commande_id: string;
  bon_commande_ref: string;
  chantier_id: string;
  chantier_nom: string;
  magasinier_id: string;
  magasinier_nom: string;
  fournisseur_nom: string;
  date_reception: string;
  quantite_recue: number;
  unite_mesure: string;
  quantite_conforme: number;
  quantite_rejetee: number;
  conformite_qualite: 'CONFORME' | 'NON_CONFORME' | 'RESERVES';
  motif_rejet_ou_reserves?: string;
  numero_plaque_camion?: string;
  nom_chauffeur?: string;
  visa_magasinier: boolean;
  statut: 'RECEPTIONNE_CONFORME' | 'AVEC_RESERVES' | 'REFUSE';
  created_at: string;
}

export interface FactureFournisseur {
  id: string;
  numero_facture: string;
  bon_commande_id: string;
  bon_commande_ref: string;
  bon_reception_ref: string;
  fournisseur_id: string;
  fournisseur_nom: string;
  fournisseur_nif: string;
  chantier_id: string;
  chantier_nom: string;
  date_facture: string;
  date_echeance: string;
  montant_ht_dzd: number;
  montant_tva_dzd: number;
  montant_ttc_dzd: number;
  statut_comptable: 'EN_ATTENTE_CONTROLE' | 'BON_A_PAYER' | 'PAYEE' | 'LITIGE';
  mode_paiement: 'VIREMENT_BANCAIRE' | 'CHEQUE_BANCAIRE' | 'TRAITE' | 'ESPECES';
  compte_bancaire_societe_id?: string;
  reference_virement?: string;
  pj_url?: string; // Pièce jointe
  created_at: string;
}

export interface FactureClient {
  id: string;
  numero_facture: string;
  client_nom: string;
  client_nif?: string;
  chantier_id: string;
  chantier_nom: string;
  lot_vendu_id?: string; // Appartement / Local
  date_facture: string;
  date_echeance: string;
  montant_ht_dzd: number;
  montant_tva_dzd: number;
  montant_ttc_dzd: number;
  statut_paiement: 'NON_PAYEE' | 'PARTIELLEMENT_PAYEE' | 'PAYEE' | 'ANNULEE';
  pj_url?: string;
  created_at: string;
}

export interface TransactionFinanciere {
  id: string;
  date: string;
  type: 'RECETTE' | 'DEPENSE';
  categorie: 'ACHAT_MATERIAUX' | 'SALAIRES' | 'SOUS_TRAITANCE' | 'VENTE_VEFA' | 'IMPOTS' | 'FRAIS_SIEGE' | 'AUTRE';
  libelle: string;
  montant_dzd: number;
  chantier_id?: string; // Facultatif si frais siège
  chantier_nom?: string;
  compte_bancaire_id: string;
  mode_paiement: 'VIREMENT_BANCAIRE' | 'CHEQUE_BANCAIRE' | 'TRAITE' | 'ESPECES';
  reference_paiement?: string;
  facture_id?: string; // Lien optionnel vers FactureClient ou FactureFournisseur
  justificatif_url?: string;
  cree_par_id: string;
  created_at: string;
}

export interface DeclarationFiscale {
  id: string;
  type: 'G50' | 'IBS' | 'TAP' | 'TVA';
  periode_mois: number;
  periode_annee: number;
  date_declaration: string;
  montant_total_dzd: number;
  details_impots: {
    tva_collectee: number;
    tva_deductible: number;
    tap_montant: number;
    irg_salaires: number;
    ibs_acompte?: number;
  };
  statut: 'BROUILLON' | 'DECLAREE' | 'PAYEE';
  pj_url?: string;
  created_at: string;
}

export interface EcritureComptable {
  id: string;
  piece_ref: string;
  date: string;
  journal_code: 'J-TRESO' | 'J-VENTES' | 'J-ACHATS' | 'J-OD';
  journal_libelle: string;
  compte_num: string;
  compte_libelle: string;
  libelle: string;
  debit_dzd: number;
  credit_dzd: number;
  chantier_id?: string;
  chantier_nom?: string;
}

export interface ClotureComptableMensuelle {
  id: string;
  periode_cle: string; // e.g., "2026-09", "2026-10"
  annee: number;
  mois: number;
  statut: 'CLOTUREE' | 'OUVERTE';
  date_cloture: string;
  cloture_par_id: string;
  cloture_par_nom: string;
  total_debit_dzd: number;
  total_credit_dzd: number;
  nombre_ecritures: number;
  ecritures: EcritureComptable[];
  observations?: string;
}


// ==========================================
// MODULE MAGASIN ET GESTION DES STOCKS (100% INDÉPENDANT PAR CHANTIER)
// ==========================================

export interface ArticleStock {
  id: string;
  entreprise_id: string;
  chantier_id: string;
  chantier_nom: string;
  code_article: string; // ex: "MAT-ACIER-14"
  designation: string;
  famille: 'ACIER_ARMATURES' | 'CIMENT_BETON' | 'MATERIAUX_GROS_OEUVRE' | 'SECOND_OEUVRE' | 'ELECTRICITE_PLOMBERIE' | 'OUTILLAGE_EPI';
  unite_mesure: 'Tonne' | 'Sac (50kg)' | 'm³' | 'm²' | 'ML' | 'Unité' | 'Litre' | 'Pièce' | 'Kg';
  quantite_stock: number;
  seuil_alerte_minimum: number;
  prix_unitaire_moyen_dzd: number;
  emplacement_magasin: string; // ex: "Zone Stockage A - Alvéole 3"
  updated_at: string;
}

export interface MouvementStock {
  id: string;
  chantier_id: string;
  chantier_nom: string;
  article_id: string;
  article_designation: string;
  type_mouvement: 'ENTREE_ACHAT' | 'SORTIE_CHANTIER' | 'TRANSFERT_ENTRANT' | 'TRANSFERT_SORTANT' | 'AJUSTEMENT_INVENTAIRE';
  quantite: number;
  unite_mesure: string;
  reference_piece: string; // ex: "BR-2026-0008" ou "BS-2026-0012"
  beneficiaire_ou_provenance: string;
  date_mouvement: string;
  auteur_id: string;
  auteur_nom: string;
  created_at: string;
}

export interface BonSortie {
  id: string;
  numero_bs: string; // ex: "BS-2026-CHT01-0014"
  chantier_id: string;
  chantier_nom: string;
  date_emission: string;
  article_id: string;
  designation_article: string;
  quantite: number;
  unite_mesure: string;
  destination: string; // ex: "Coulage voile R+3 Bloc A"
  beneficiaire: string; // ex: "Équipe Coffrage B"
  motif: string;
  
  // Double validation obligatoire (Conducteur de travaux + Magasinier)
  statut_validation_ct: 'EN_ATTENTE' | 'VALIDE' | 'REFUSE';
  conducteur_validateur_id?: string;
  conducteur_validateur_nom?: string;
  date_validation_ct?: string;
  motif_refus_ct?: string;

  statut_confirmation_magasinier: 'EN_ATTENTE' | 'CONFIRME' | 'ANNULE';
  magasinier_confirmateur_id?: string;
  magasinier_confirmateur_nom?: string;
  date_confirmation_magasinier?: string;
  
  created_at: string;
}

export interface TransfertInterChantier {
  id: string;
  numero_transfert: string; // ex: "TRF-2026-0003"
  chantier_source_id: string;
  chantier_source_nom: string;
  chantier_cible_id: string;
  chantier_cible_nom: string;
  article_designation: string;
  quantite: number;
  unite_mesure: string;
  motif: string;
  statut: 'EN_ATTENTE' | 'VALIDE_DEPART' | 'RECEPTIONNE' | 'REFUSE';
  demandeur_id: string;
  demandeur_nom: string;
  created_at: string;
}

export interface InventaireMagasin {
  id: string;
  numero_inventaire: string; // ex: "INV-2026-CHT01-02"
  chantier_id: string;
  chantier_nom: string;
  date_inventaire: string;
  magasinier_id: string;
  magasinier_nom: string;
  lignes: {
    article_id: string;
    code_article: string;
    designation: string;
    stock_theorique: number;
    stock_physique: number;
    ecart: number;
    observation?: string;
  }[];
  statut: 'EN_COURS' | 'VALIDE_ET_CLOTURE';
  created_at: string;
}


// ==========================================
// MODULE MATÉRIEL ET PARC AUTOMOBILE
// ==========================================
// MODULE MATÉRIEL & PARC AUTOMOBILE (ALGÉRIE)
// ==========================================

export type CategorieMateriel = 
  | 'VEHICULE_LEGER' 
  | 'POIDS_LOURD' 
  | 'ENGIN_TERRASSEMENT' 
  | 'ENGIN_LEVAGE' 
  | 'COMPACTAGE' 
  | 'GROUPE_ELECTROGENE' 
  | 'AUTRE';

export type TypeCarburant = 'DIESEL' | 'ESSENCE' | 'ELECTRIQUE' | 'HYBRIDE';

export type StatutMateriel = 'ACTIF' | 'EN_REPARATION' | 'EN_PANNE' | 'EN_MAINTENANCE' | 'EN_TRANSFERT' | 'REFORME';

export interface AffectationMaterielChantier {
  id: string;
  chantier_id: string;
  chantier_nom: string;
  conducteur_nom: string;
  date_debut: string;
  date_fin?: string;
  motif?: string;
  bon_transfert_ref?: string;
}

export interface Vehicule {
  id: string;
  entreprise_id: string;
  num_interne: string; // Ex: ENG-001, CAM-002, VL-003
  immatriculation: string;
  marque: string;
  modele: string;
  annee: number;
  categorie?: CategorieMateriel;
  carburant?: TypeCarburant;
  puissance?: string;
  tonnage?: number;
  capacite?: string;
  compteur_type?: 'KILOMETRAGE' | 'HEURES' | 'MIXTE';
  caracteristiques?: string;
  chantier_id?: string;
  conducteur_id?: string;
  conducteur_nom?: string;
  conducteur_telephone?: string;
  conducteur_permis?: string;
  statut: StatutMateriel;
  kilometrage: number;
  heures_fonctionnement: number;

  // Vidange & Révisions
  date_prochaine_vidange?: string;
  km_prochaine_vidange?: number;
  heures_prochaine_vidange?: number;
  vidange_intervalle_km?: number;
  vidange_intervalle_heures?: number;
  vidange_derniere_date?: string;
  vidange_dernier_km?: number;
  vidange_dernieres_heures?: number;

  // Contrôle Technique (ENACTa / Centre agréé)
  date_prochain_controle_technique?: string;
  ct_organisme?: string;
  ct_date_dernier?: string;
  ct_statut?: 'VALIDE' | 'A_RENOUVELER' | 'EXPIRE';

  // Assurance (CAAT, SAA, CAAR, CIAR, Cash Assurances...)
  date_fin_assurance?: string;
  assurance_compagnie?: string;
  assurance_police?: string;
  assurance_date_debut?: string;
  assurance_cout_dzd?: number;

  // Historique des affectations chantiers
  historique_affectations?: AffectationMaterielChantier[];

  created_at: string;
}

export interface Entretien {
  id: string;
  vehicule_id: string;
  vehicule_nom?: string;
  type: 'PREVENTIF' | 'CURATIF' | 'VIDANGE' | 'CONTROLE_TECHNIQUE' | 'ASSURANCE' | 'REPARATION' | 'PNEUMATIQUE' | 'BATTERIE' | 'PANNE';
  nature?: 'PREVENTIF' | 'CURATIF';
  gravite?: 'FAIBLE' | 'MOYENNE' | 'CRITIQUE' | 'IMMOBILISATION';
  statut_operation?: 'PLANIFIE' | 'EN_COURS' | 'EFFECTUE' | 'ANNULE';
  description: string;
  date: string;
  kilometrage_entretien: number;
  heures_entretien: number;
  cout: number;
  prestataire?: 'ATELIER_INTERNE' | 'GARAGE_EXTERNE';
  garage_nom?: string;
  piece_rechange_utilisee?: string;
  facture_ref?: string;
  technicien?: string;
  observations?: string;
  created_at: string;
}

export interface HistoriquePermutationPneu {
  id: string;
  date: string;
  ancienne_position: string;
  nouvelle_position: string;
  kilometrage: number;
  motif: string;
  operateur: string;
}

export interface HistoriqueRemplacementPiece {
  id: string;
  date: string;
  ancien_numero_serie?: string;
  kilometrage: number;
  heures?: number;
  motif: 'USURE_NORMALE' | 'CREVAISON_IRREPARABLE' | 'ECLATEMENT' | 'DEFORMATION' | 'PANNE' | 'PREVENTIF' | string;
  note?: string;
  cout_dzd?: number;
}

export interface PieceRemplacable {
  id: string;
  vehicule_id: string;
  type: 'PNEU' | 'BATTERIE' | 'PIECE_MECANIQUE' | 'AUTRE';
  designation: string;
  marque?: string;
  dimensions?: string; // Ex: 315/80 R22.5 pour camion, 265/65 R17 pour Hilux
  numero_serie: string;
  date_installation: string;
  kilometrage_installation: number;
  heures_installation?: number;
  position: string; // Ex: AV_G, AV_D, AR_G_EXT, AR_D_INT, MOTEUR, CHASSIS...
  etat: 'ACTIF' | 'REMPLACE' | 'EN_STOCK' | 'NEUF' | 'BON' | 'USURE_NORMALE' | 'USURE_50' | 'A_REMPLACER' | 'HORS_SERVICE';
  profondeur_sculpture_mm?: number;
  garantie_mois?: number;
  cout_achat_dzd?: number;
  fournisseur?: string;
  motif_remplacement?: string;
  historique_permutations?: HistoriquePermutationPneu[];
  historique_remplacements?: HistoriqueRemplacementPiece[];
  created_at: string;
}

// ==========================================
// MODULE TECHNIQUE & SUIVI DE CHANTIER
// ==========================================

export interface LotTravaux {
  id: string;
  chantier_id: string;
  code_lot: string; // Ex: LOT-01, LOT-02
  libelle: string; // Ex: Gros Oeuvre, Étanchéité
  description?: string;
  budget_prevu: number;
  ordre: number;
}

export interface StructureChantier {
  id: string;
  chantier_id: string;
  parent_id?: string; // Pour arborescence Bâtiment -> Bloc -> Étage
  type: 'BATIMENT' | 'BLOC' | 'ETAGE' | 'OUVRAGE';
  libelle: string;
}

export interface PosteTravaux {
  id: string;
  lot_id: string;
  unite_id: string;
  unite_symbole: string;
  code_article: string;
  designation: string;
  quantite_prevue: number;
  prix_unitaire_ref: number;
}

export interface MetreVérification {
  id: string;
  poste_id: string;
  structure_id: string;
  quantite_executee: number;
  date_mesure: string;
  saisi_par_id: string;
  saisi_par_nom: string;
  statut: 'BROUILLON' | 'TRANSMIS' | 'VALIDE' | 'REJETE';
  commentaire?: string;
  localisation_detaillee?: string;
  details_calcul?: string;
  fichier_attache?: string;
}

export interface RapportChantier {
  id: string;
  chantier_id: string;
  date_rapport: string;
  type: 'JOURNALIER' | 'HEBDOMADAIRE' | 'MENSUEL';
  effectif_total: number;
  meteo: string;
  heures_intemperies?: number;
  materiel_sur_site?: string;
  incidents_securite?: string;
  corps_etat_presents?: { metier: string; nombre: number }[];
  activites_realisees: string;
  anomalies_retards?: string;
  photos_urls: string[];
  redacteur_id: string;
  redacteur_nom: string;
  statut: 'EN_COURS' | 'VALIDE';
}

export interface ControleCTC {
  id: string;
  chantier_id: string;
  numero_pv: string;
  date_visite: string;
  ouvrage_concerne: string;
  ingenieur_ctc: string;
  organisme_ctc: string;
  type_controle: 'FONDATIONS' | 'FERRAILLAGE' | 'COULAGE_BETON' | 'ETANCHEITE' | 'STRUCTURE_MACONNERIE' | 'SOL_TERRASSEMENT';
  avis: 'FAVORABLE' | 'FAVORABLE_RESERVES' | 'DEFAVORABLE';
  autorise_coulage: boolean;
  resistance_eprouvettes_28j?: number; // Ex: 31.4 MPa
  reserves?: string;
  statut_levee: 'LEVEES' | 'EN_ATTENTE' | 'SANS_OBJET';
}

export interface PlanBET {
  id: string;
  chantier_id: string;
  code_plan: string;
  titre: string;
  lot_id: string;
  structure_id?: string;
  indice: string;
  bureau_etudes: string;
  date_diffusion: string;
  date_visa_ctc?: string;
  statut_visa: 'BPE_VALIDE' | 'EN_REVUE_CTC' | 'MODIFICATIONS_REQUISES' | 'BROUILLON';
  fichier_nom?: string;
}

export interface SituationTravaux {
  id: string;
  chantier_id: string;
  numero_situation: string;
  periode_mois: string;
  entreprise_sous_traitante: string;
  lot_id: string;
  montant_cumule_precedent_dzd: number;
  montant_mois_ht_dzd: number;
  montant_cumule_ht_dzd: number;
  taux_retenue_garantie: number; // ex: 5%
  retenue_garantie_dzd: number;
  montant_net_dzd: number;
  statut: 'BROUILLON' | 'VERIFIEE_METREUR' | 'APPROUVEE_CT' | 'VISEE_DIRECTEUR';
  date_emission: string;
  valide_par_nom?: string;
}

// ==========================================
// MODULE JURIDIQUE & CONTENTIEUX
// ==========================================

export interface PieceJointeJuridique {
  id: string;
  titre: string;
  nom_fichier: string;
  taille_ko: number;
  date_upload: string;
}

export interface HistoriqueJuridique {
  id: string;
  date: string;
  auteur: string;
  action: string;
  details?: string;
}

export interface ContratJuridique {
  id: string;
  numero_contrat: string;
  titre: string;
  type: 'FOURNISSEUR' | 'CLIENT_VEFA' | 'SOUS_TRAITANCE' | 'BAIL_LOCATION' | 'PARTENARIAT';
  partie_prenante_nom: string;
  chantier_id?: string;
  chantier_nom?: string;
  date_signature: string;
  date_effet: string;
  date_echeance: string;
  montant_dzd: number;
  statut: 'EN_VIGUEUR' | 'EN_RENOUVELLEMENT' | 'EXPIRE' | 'RESILIE' | 'ARCHIVE';
  reconduction_automatique: boolean;
  delai_preavis_jours: number;
  responsable_juridique_nom: string;
  historique_modifications: HistoriqueJuridique[];
  pieces_jointes: PieceJointeJuridique[];
  notes?: string;
  created_at: string;
}

export interface DocumentFoncierAdmin {
  id: string;
  type: 'ACTE_PROPRIETE_FONCIER' | 'LIVRE_FONCIER' | 'PERMIS_DE_CONSTRUIRE' | 'CERTIFICAT_URBANISME' | 'CERTIFICAT_CONFORMITE_CTC' | 'AGREMENT_PROMOTEUR' | 'ARRETE_WILAYA';
  titre: string;
  reference_officielle: string;
  wilaya: string;
  commune: string;
  chantier_id?: string;
  chantier_nom?: string;
  notaire_nom?: string;
  date_delivrance: string;
  date_validite?: string;
  statut: 'VALIDE' | 'EN_COURS_RENOUVELLEMENT' | 'PERIME' | 'EN_INSTRUCTION';
  pieces_jointes: PieceJointeJuridique[];
  notes?: string;
  created_at: string;
}

export interface DossierLitige {
  id: string;
  numero_dossier: string;
  titre_affaire: string;
  juridiction: 'TRIBUNAL_ADMINISTRATIF' | 'TRIBUNAL_COMMERCIAL' | 'TRIBUNAL_CIVIL' | 'COUR_D_ALGER' | 'ARBITRAGE_AMIABLE';
  partie_adverse: string;
  qualite: 'DEMANDEUR' | 'DEFENDEUR';
  enjeu_financier_dzd: number;
  avocat_conseil_nom: string;
  statut: 'EN_INSTRUCTION' | 'AUDIENCE_PROGRAMMEE' | 'EN_CONCILIATION' | 'JUGEMENT_RENDU' | 'GAGNE' | 'PERDU' | 'ARCHIVE';
  date_ouverture: string;
  prochaine_audience_date?: string;
  resume_faits: string;
  historique_audiences: { id: string; date: string; objet: string; resultat?: string }[];
  pieces_jointes: PieceJointeJuridique[];
  created_at: string;
}

// ==========================================
// MODULE COMMERCIAL & PROGRAMMES IMMOBILIERS
// ==========================================

export type StatutBienImmobilier = 'DISPONIBLE' | 'OPTION_RESERVATION' | 'RESERVE' | 'VENDU' | 'ANNULE';

export interface HistoriqueCommercialBien {
  id: string;
  date: string;
  action: 'CREATION' | 'VISITE' | 'OPTION' | 'RESERVATION' | 'CONTRAT_VEFA' | 'PAIEMENT' | 'ANNULATION' | 'CHANGEMENT_PRIX';
  auteur: string;
  description: string;
  montant_dzd?: number;
}

export interface BienImmobilier {
  id: string;
  reference: string;
  chantier_id: string;
  chantier_nom: string;
  batiment_bloc: string;
  etage: string;
  num_porte: string;
  type_bien: 'LOGEMENT_F2' | 'LOGEMENT_F3' | 'LOGEMENT_F4' | 'LOGEMENT_F5' | 'DUPLEX' | 'PENTHOUSE' | 'LOCAL_COMMERCIAL' | 'BOX_PARKING';
  orientation: 'NORD' | 'SUD' | 'EST' | 'OUEST' | 'NORD_EST' | 'SUD_OUEST' | 'DOUBLE_FACADE';
  superficie_habitable_m2: number;
  superficie_utile_m2: number;
  superficie_terrasse_m2: number;
  prix_vente_dzd: number;
  prix_m2_dzd: number;
  statut: StatutBienImmobilier;
  client_reservataire_id?: string;
  client_reservataire_nom?: string;
  client_reservataire_tel?: string;
  date_reservation?: string;
  date_vente_vefa?: string;
  plan_bien_url?: string;
  historique_commercial: HistoriqueCommercialBien[];
  created_at: string;
  updated_at: string;
}

export interface ClientProspect {
  id: string;
  numero_fiche: string;
  nom: string;
  prenom: string;
  nin: string;
  telephone: string;
  email: string;
  adresse: string;
  wilaya: string;
  type: 'PROSPECT' | 'ACQUEREUR_RESERVATAIRE' | 'PROPRIETAIRE_VEFA';
  budget_max_dzd: number;
  typologie_recherchee: string;
  canal_acquisition: 'SALON_IMMOBILIER' | 'RESEAUX_SOCIAUX' | 'RECOMMANDATION' | 'PASSAGE_AGENCE' | 'SITE_WEB';
  chantier_interet_id?: string;
  chantier_interet_nom?: string;
  nb_visites: number;
  created_at: string;
}

export interface TrancheEcheancierVEFA {
  id: string;
  libelle_tranche: string;
  pct_exige: number;
  montant_tranche_dzd: number;
  date_echeance_prevue: string;
  statut: 'EN_ATTENTE' | 'EXIGIBLE' | 'PAYEE' | 'EN_RETARD';
  date_reglement_effectif?: string;
  reference_recu_cpa?: string;
}

export interface ReservationVenteVEFA {
  id: string;
  numero_contrat_vefa: string;
  bien_id: string;
  bien_ref: string;
  chantier_id: string;
  chantier_nom: string;
  client_id: string;
  client_nom: string;
  client_nin: string;
  client_tel: string;
  notaire_nom: string;
  date_reservation: string;
  date_promesse_vefa?: string;
  prix_total_convenu_dzd: number;
  montant_encaisse_dzd: number;
  solde_restant_dzd: number;
  statut: 'EN_COURS_RESERVATION' | 'PROMESSE_SIGNEE' | 'ACTE_NOTARIE_ENREGISTRE' | 'LIVRE_CLEFS_REMISES' | 'ANNULE';
  echeancier_tranches: TrancheEcheancierVEFA[];
  created_at: string;
}


// ==========================================
// SPÉCIFICATIONS DES TABLES MÉTIERS (FONDATIONS)
// ==========================================

export interface SchemaColumn {
  name: string;
  type: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  referencesTable?: string;
  referencesColumn?: string;
  nullable: boolean;
  description: string;
}

export interface SchemaTable {
  tableName: string;
  module: ModuleCode;
  description: string;
  category: 'FONDATION_SYSTEME' | 'ENTITE_CENTRALE' | 'METIER_OPERATIONNEL';
  columns: SchemaColumn[];
  indexes: string[];
}
