import { SchemaTable } from '../types/database';

export const DATABASE_SCHEMA_TABLES: SchemaTable[] = [
  // 1. ENTREPRISE
  {
    tableName: 'entreprises',
    module: 'ADMINISTRATION',
    description: 'Promoteur immobilier central et entités juridiques mères (SARL, SPA)',
    category: 'ENTITE_CENTRALE',
    columns: [
      { name: 'id', type: 'UUID', isPrimaryKey: true, nullable: false, description: 'Identifiant unique de l’entreprise' },
      { name: 'raison_sociale', type: 'VARCHAR(255)', nullable: false, description: 'Dénomination légale' },
      { name: 'nom_commercial', type: 'VARCHAR(255)', nullable: false, description: 'Marque commerciale du promoteur' },
      { name: 'forme_juridique', type: 'VARCHAR(20)', nullable: false, description: 'SARL, SPA, EURL selon droit algérien' },
      { name: 'capital_social', type: 'NUMERIC(18,2)', nullable: false, description: 'Capital social déclaré en DZD' },
      { name: 'rc', type: 'VARCHAR(50)', nullable: false, description: 'Numéro de Registre du Commerce (Algérie)' },
      { name: 'nif', type: 'VARCHAR(30)', nullable: false, description: 'Numéro d’Identification Fiscale (NIF)' },
      { name: 'nis', type: 'VARCHAR(30)', nullable: false, description: 'Numéro d’Identification Statistique (NIS)' },
      { name: 'article_imposition', type: 'VARCHAR(30)', nullable: false, description: 'Numéro d’Article d’Imposition' },
      { name: 'adresse_siege', type: 'TEXT', nullable: false, description: 'Adresse officielle du siège social' },
      { name: 'wilaya', type: 'VARCHAR(100)', nullable: false, description: 'Wilaya du siège social' },
      { name: 'telephone', type: 'VARCHAR(30)', nullable: false, description: 'Standard téléphonique' },
      { name: 'email', type: 'VARCHAR(150)', nullable: false, description: 'Email corporate officiel' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, description: 'Horodatage création' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, description: 'Horodatage dernière mise à jour' }
    ],
    indexes: ['idx_entreprises_nif (nif)', 'idx_entreprises_rc (rc)']
  },

  // 1b. COMPTES_BANCAIRES
  {
    tableName: 'comptes_bancaires',
    module: 'PARAMETRES',
    description: 'Comptes bancaires du promoteur (BNA, BEA, CPA, Al Baraka...) et comptes séquestres VEFA (FGCMPI)',
    category: 'ENTITE_CENTRALE',
    columns: [
      { name: 'id', type: 'UUID', isPrimaryKey: true, nullable: false, description: 'Identifiant unique du compte' },
      { name: 'entreprise_id', type: 'UUID', isForeignKey: true, referencesTable: 'entreprises', referencesColumn: 'id', nullable: false, description: 'Promoteur titulaire' },
      { name: 'nom_banque', type: 'VARCHAR(150)', nullable: false, description: 'Établissement bancaire en Algérie' },
      { name: 'code_banque', type: 'VARCHAR(10)', nullable: false, description: 'Code interbancaire Banque d’Algérie' },
      { name: 'agence', type: 'VARCHAR(150)', nullable: false, description: 'Agence de domiciliation' },
      { name: 'titulaire', type: 'VARCHAR(255)', nullable: false, description: 'Intitulé exact du titulaire' },
      { name: 'rib', type: 'VARCHAR(30)', nullable: false, description: 'Relevé d’Identité Bancaire (20 chiffres)' },
      { name: 'iban', type: 'VARCHAR(50)', nullable: true, description: 'Format IBAN international' },
      { name: 'swift_bic', type: 'VARCHAR(20)', nullable: true, description: 'Code BIC SWIFT' },
      { name: 'devise', type: 'VARCHAR(10)', nullable: false, description: 'DZD, EUR, USD' },
      { name: 'actif', type: 'BOOLEAN', nullable: false, description: 'Statut du compte' },
      { name: 'is_compte_principal', type: 'BOOLEAN', nullable: false, description: 'Compte principal pour les opérations générales' },
      { name: 'type_compte', type: 'VARCHAR(50)', nullable: false, description: 'COURANT, SEQUESTRE_VEFA, EPARGNE, DEVISES' },
      { name: 'chantier_dedie_id', type: 'UUID', isForeignKey: true, referencesTable: 'chantiers', referencesColumn: 'id', nullable: true, description: 'Chantier rattaché si compte séquestre VEFA' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, description: 'Date de création' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, description: 'Dernière mise à jour' }
    ],
    indexes: ['idx_comptes_rib (rib)', 'idx_comptes_banque (nom_banque)', 'idx_comptes_actif (actif)']
  },

  // 1c. PARAMETRES_GENERAUX
  {
    tableName: 'parametres_generaux',
    module: 'PARAMETRES',
    description: 'Configurations globales de l’ERP : devise DZD, bilinguisme FR/AR, RTL, horaires et pointage',
    category: 'FONDATION_SYSTEME',
    columns: [
      { name: 'id', type: 'UUID', isPrimaryKey: true, nullable: false, description: 'Identifiant configuration' },
      { name: 'entreprise_id', type: 'UUID', isForeignKey: true, referencesTable: 'entreprises', referencesColumn: 'id', nullable: false, description: 'Promoteur rattaché' },
      { name: 'devise_principale', type: 'VARCHAR(10)', nullable: false, description: 'Devise monétaire par défaut (DZD)' },
      { name: 'langue_defaut', type: 'VARCHAR(5)', nullable: false, description: 'fr ou ar' },
      { name: 'is_rtl', type: 'BOOLEAN', nullable: false, description: 'Orientation de lecture droite-à-gauche' },
      { name: 'format_date', type: 'VARCHAR(20)', nullable: false, description: 'Format standardisé (JJ/MM/AAAA)' },
      { name: 'horaires_travail', type: 'JSONB', nullable: false, description: 'Plages horaires et jours ouvrés (Dimanche-Jeudi)' },
      { name: 'heure_limite_pointage', type: 'VARCHAR(10)', nullable: false, description: 'Heure de clôture pointage matinal' },
      { name: 'notifications_config', type: 'JSONB', nullable: false, description: 'Seuils d’alertes email/budget/stocks' },
      { name: 'unites_mesure', type: 'JSONB', nullable: false, description: 'Référentiel des unités BTP (m², m³, t, sac...)' },
      { name: 'exercices_comptables', type: 'JSONB', nullable: false, description: 'Années fiscales et statut de clôture' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, description: 'Dernière mise à jour' }
    ],
    indexes: ['idx_param_entreprise (entreprise_id)']
  },

  // 2. CHANTIERS
  {
    tableName: 'chantiers',
    module: 'CHANTIERS',
    description: 'Entités de chantier indépendantes rattachées au promoteur (Centre de profit et d’imputation)',
    category: 'ENTITE_CENTRALE',
    columns: [
      { name: 'id', type: 'UUID', isPrimaryKey: true, nullable: false, description: 'Identifiant unique du chantier' },
      { name: 'entreprise_id', type: 'UUID', isForeignKey: true, referencesTable: 'entreprises', referencesColumn: 'id', nullable: false, description: 'Rattachement au promoteur' },
      { name: 'code_chantier', type: 'VARCHAR(50)', nullable: false, description: 'Code de référence interne (ex: CHT-ALG-2024-01)' },
      { name: 'nom_projet', type: 'VARCHAR(255)', nullable: false, description: 'Nom commercial du programme immobilier' },
      { name: 'description', type: 'TEXT', nullable: true, description: 'Descriptif architectural du projet' },
      { name: 'wilaya', type: 'VARCHAR(100)', nullable: false, description: 'Wilaya du site (Alger, Oran, Constantine, etc.)' },
      { name: 'commune', type: 'VARCHAR(100)', nullable: false, description: 'Commune de situation foncière' },
      { name: 'adresse_site', type: 'TEXT', nullable: false, description: 'Localisation physique du chantier' },
      { name: 'superficie_terrain_m2', type: 'NUMERIC(12,2)', nullable: false, description: 'Assiette foncière totale en m²' },
      { name: 'surface_plancher_m2', type: 'NUMERIC(12,2)', nullable: false, description: 'Surface brute de plancher (SDP/SHON) en m²' },
      { name: 'nombre_logements', type: 'INT', nullable: false, description: 'Nombre d’unités d’habitation prévues' },
      { name: 'nombre_locaux_commerciaux', type: 'INT', nullable: false, description: 'Locaux commerciaux / bureaux au RDC' },
      { name: 'nombre_niveaux', type: 'VARCHAR(50)', nullable: false, description: 'Structure (ex: 2 Sous-sols + RDC + 9 étages)' },
      { name: 'permis_construire_ref', type: 'VARCHAR(100)', nullable: true, description: 'N° officiel de l’Arrêté de Permis de Construire' },
      { name: 'date_obtention_permis', type: 'DATE', nullable: true, description: 'Date de délivrance par l’APC/DOU' },
      { name: 'date_ouverture_chantier', type: 'DATE', nullable: false, description: 'Date PV d’implantation / ouverture' },
      { name: 'date_livraison_prevue', type: 'DATE', nullable: false, description: 'Date contractuelle de livraison prévisionnelle' },
      { name: 'budget_global_prevu', type: 'NUMERIC(18,2)', nullable: false, description: 'Budget d’investissement global prévisionnel (DZD)' },
      { name: 'budget_engage', type: 'NUMERIC(18,2)', nullable: false, description: 'Total des dépenses et commandes engagées (DZD)' },
      { name: 'statut', type: 'VARCHAR(50)', nullable: false, description: 'Phase du cycle de vie du chantier' },
      { name: 'taux_avancement_physique', type: 'NUMERIC(5,2)', nullable: false, description: 'Avancement pondéré certifié (0 à 100%)' },
      { name: 'directeur_chantier_id', type: 'UUID', isForeignKey: true, referencesTable: 'utilisateurs', referencesColumn: 'id', nullable: true, description: 'Directeur ou Chef de projet dédié' },
      { name: 'conducteur_travaux_id', type: 'UUID', isForeignKey: true, referencesTable: 'utilisateurs', referencesColumn: 'id', nullable: true, description: 'Conducteur des travaux sur le terrain' },
      { name: 'bureau_etudes', type: 'VARCHAR(255)', nullable: true, description: 'BET Architecture & Génie Civil' },
      { name: 'organisme_ctc', type: 'VARCHAR(100)', nullable: true, description: 'Antenne régionale CTC (Contrôle Technique)' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, description: 'Date de création de la fiche chantier' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, description: 'Dernière modification' }
    ],
    indexes: ['idx_chantiers_entreprise (entreprise_id)', 'idx_chantiers_code (code_chantier)', 'idx_chantiers_wilaya (wilaya)', 'idx_chantiers_statut (statut)']
  },

  // 3. UTILISATEURS
  {
    tableName: 'utilisateurs',
    module: 'ADMINISTRATION',
    description: 'Comptes des collaborateurs centraux (siège) et opérationnels (chantiers)',
    category: 'ENTITE_CENTRALE',
    columns: [
      { name: 'id', type: 'UUID', isPrimaryKey: true, nullable: false, description: 'Identifiant unique utilisateur' },
      { name: 'entreprise_id', type: 'UUID', isForeignKey: true, referencesTable: 'entreprises', referencesColumn: 'id', nullable: false, description: 'Entreprise de rattachement' },
      { name: 'nom', type: 'VARCHAR(100)', nullable: false, description: 'Nom de famille' },
      { name: 'prenom', type: 'VARCHAR(100)', nullable: false, description: 'Prénom' },
      { name: 'email', type: 'VARCHAR(150)', nullable: false, description: 'Email professionnel unique' },
      { name: 'telephone', type: 'VARCHAR(30)', nullable: false, description: 'Numéro de téléphone' },
      { name: 'poste', type: 'VARCHAR(150)', nullable: false, description: 'Intitulé exact du poste' },
      { name: 'type', type: 'VARCHAR(20)', nullable: false, description: 'CENTRAL (siège) ou CHANTIER (terrain)' },
      { name: 'role_id', type: 'UUID', isForeignKey: true, referencesTable: 'roles', referencesColumn: 'id', nullable: false, description: 'Rôle RBAC principal' },
      { name: 'statut', type: 'VARCHAR(20)', nullable: false, description: 'ACTIF, SUSPENDU, DESACTIVE' },
      { name: 'photo_url', type: 'VARCHAR(255)', nullable: true, description: 'Photo de profil' },
      { name: 'dernier_acces', type: 'TIMESTAMPTZ', nullable: true, description: 'Dernière connexion enregistrée' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, description: 'Date de création' }
    ],
    indexes: ['idx_utilisateurs_email (email)', 'idx_utilisateurs_type (type)', 'idx_utilisateurs_role (role_id)']
  },

  // 4. ROLES & RBAC
  {
    tableName: 'roles',
    module: 'ADMINISTRATION',
    description: 'Définition des profils de sécurité et niveaux d’habilitation RBAC',
    category: 'FONDATION_SYSTEME',
    columns: [
      { name: 'id', type: 'UUID', isPrimaryKey: true, nullable: false, description: 'Identifiant rôle' },
      { name: 'code', type: 'VARCHAR(50)', nullable: false, description: 'Code machine unique (SUPER_ADMIN, DIRECTEUR_TECHNIQUE...)' },
      { name: 'libelle', type: 'VARCHAR(100)', nullable: false, description: 'Nom affiché' },
      { name: 'description', type: 'TEXT', nullable: false, description: 'Périmètre et responsabilités du rôle' },
      { name: 'is_system', type: 'BOOLEAN', nullable: false, description: 'Indique si le rôle système est protégé contre la suppression' },
      { name: 'niveau_hierarchique', type: 'INT', nullable: false, description: '1 (Direction Générale) à 5 (Opérationnel terrain)' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, description: 'Date de création' }
    ],
    indexes: ['idx_roles_code (code)']
  },

  // 5. PERMISSIONS
  {
    tableName: 'permissions',
    module: 'ADMINISTRATION',
    description: 'Catalogue des droits d’accès granulaires par module applicatif et action',
    category: 'FONDATION_SYSTEME',
    columns: [
      { name: 'id', type: 'UUID', isPrimaryKey: true, nullable: false, description: 'Identifiant unique permission' },
      { name: 'module', type: 'VARCHAR(50)', nullable: false, description: 'Code du module concerné' },
      { name: 'action', type: 'VARCHAR(30)', nullable: false, description: 'READ, CREATE, UPDATE, DELETE, VALIDATE, EXPORT' },
      { name: 'code', type: 'VARCHAR(100)', nullable: false, description: 'Code composite (ex: COMPTABILITE:VALIDATE)' },
      { name: 'description', type: 'TEXT', nullable: false, description: 'Explication du privilège accordé' }
    ],
    indexes: ['idx_permissions_module (module)', 'idx_permissions_code (code)']
  },

  // 6. ROLE_PERMISSIONS
  {
    tableName: 'role_permissions',
    module: 'ADMINISTRATION',
    description: 'Table de liaison Many-to-Many entre rôles et permissions',
    category: 'FONDATION_SYSTEME',
    columns: [
      { name: 'role_id', type: 'UUID', isPrimaryKey: true, isForeignKey: true, referencesTable: 'roles', referencesColumn: 'id', nullable: false, description: 'FK vers rôle' },
      { name: 'permission_id', type: 'UUID', isPrimaryKey: true, isForeignKey: true, referencesTable: 'permissions', referencesColumn: 'id', nullable: false, description: 'FK vers permission' }
    ],
    indexes: ['idx_rp_role (role_id)', 'idx_rp_permission (permission_id)']
  },

  // 7. UTILISATEUR_CHANTIERS
  {
    tableName: 'utilisateur_chantiers',
    module: 'ADMINISTRATION',
    description: 'Cloisonnement d’accès : affectation des utilisateurs aux chantiers autorisés',
    category: 'FONDATION_SYSTEME',
    columns: [
      { name: 'id', type: 'UUID', isPrimaryKey: true, nullable: false, description: 'Identifiant affectation' },
      { name: 'utilisateur_id', type: 'UUID', isForeignKey: true, referencesTable: 'utilisateurs', referencesColumn: 'id', nullable: false, description: 'Utilisateur affecté' },
      { name: 'chantier_id', type: 'UUID', isForeignKey: true, referencesTable: 'chantiers', referencesColumn: 'id', nullable: false, description: 'Chantier autorisé' },
      { name: 'role_specifique_chantier', type: 'VARCHAR(100)', nullable: true, description: 'Rôle ponctuel sur ce chantier (ex: Conducteur Travaux Principal)' },
      { name: 'date_affectation', type: 'DATE', nullable: false, description: 'Date de début d’affectation' },
      { name: 'is_responsable_principal', type: 'BOOLEAN', nullable: false, description: 'Responsable en chef sur ce chantier' },
      { name: 'actif', type: 'BOOLEAN', nullable: false, description: 'Statut actif/inactif' }
    ],
    indexes: ['idx_uc_user (utilisateur_id)', 'idx_uc_chantier (chantier_id)']
  },

  // 7b. USER_SESSIONS
  {
    tableName: 'user_sessions',
    module: 'ADMINISTRATION',
    description: 'Gestion et traçabilité des sessions actives, jetons d’authentification et révocation',
    category: 'FONDATION_SYSTEME',
    columns: [
      { name: 'id', type: 'UUID', isPrimaryKey: true, nullable: false, description: 'Identifiant de session' },
      { name: 'user_id', type: 'UUID', isForeignKey: true, referencesTable: 'utilisateurs', referencesColumn: 'id', nullable: false, description: 'Utilisateur connecté' },
      { name: 'token', type: 'VARCHAR(255)', nullable: false, description: 'Jeton JWT / bearer sécurisé' },
      { name: 'ip_address', type: 'VARCHAR(45)', nullable: false, description: 'Adresse IP de connexion' },
      { name: 'device_info', type: 'VARCHAR(255)', nullable: false, description: 'Terminal et navigateur' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, description: 'Début de session' },
      { name: 'expires_at', type: 'TIMESTAMPTZ', nullable: false, description: 'Date d’expiration' },
      { name: 'is_revoked', type: 'BOOLEAN', nullable: false, description: 'Indicateur de révocation manuelle' },
      { name: 'last_activity', type: 'TIMESTAMPTZ', nullable: false, description: 'Dernière requête enregistrée' }
    ],
    indexes: ['idx_sessions_user (user_id)', 'idx_sessions_token (token)', 'idx_sessions_expires (expires_at)']
  },

  // 8. AUDIT_LOGS
  {
    tableName: 'audit_logs',
    module: 'ADMINISTRATION',
    description: 'Journal immuable de traçabilité des opérations sensibles (sécurité et conformité)',
    category: 'FONDATION_SYSTEME',
    columns: [
      { name: 'id', type: 'UUID', isPrimaryKey: true, nullable: false, description: 'Identifiant unique événement audit' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, description: 'Horodatage précis à la milliseconde' },
      { name: 'utilisateur_id', type: 'UUID', isForeignKey: true, referencesTable: 'utilisateurs', referencesColumn: 'id', nullable: false, description: 'Auteur de l’action' },
      { name: 'chantier_id', type: 'UUID', isForeignKey: true, referencesTable: 'chantiers', referencesColumn: 'id', nullable: true, description: 'Chantier ciblé (si applicable)' },
      { name: 'module', type: 'VARCHAR(50)', nullable: false, description: 'Module applicatif' },
      { name: 'action', type: 'VARCHAR(50)', nullable: false, description: 'Type d’action (CREATION, VALIDATION_FINANCIERE...)' },
      { name: 'entite_cible', type: 'VARCHAR(100)', nullable: false, description: 'Table ou entité modifiée' },
      { name: 'entite_id', type: 'VARCHAR(100)', nullable: false, description: 'Identifiant de l’entité impactée' },
      { name: 'description', type: 'TEXT', nullable: false, description: 'Libellé explicite de l’opération' },
      { name: 'adresse_ip', type: 'VARCHAR(45)', nullable: false, description: 'Adresse IP source' },
      { name: 'user_agent', type: 'TEXT', nullable: true, description: 'Navigateur / terminal' },
      { name: 'details_modifications', type: 'JSONB', nullable: true, description: 'Diff avant/après en format JSONB' }
    ],
    indexes: ['idx_audit_user (utilisateur_id)', 'idx_audit_chantier (chantier_id)', 'idx_audit_module (module)', 'idx_audit_date (created_at DESC)']
  },

  // 9. NOTIFICATIONS
  {
    tableName: 'notifications',
    module: 'NOTIFICATIONS',
    description: 'File centrale des alertes, rappels de jalons et notifications d’approbation',
    category: 'FONDATION_SYSTEME',
    columns: [
      { name: 'id', type: 'UUID', isPrimaryKey: true, nullable: false, description: 'Identifiant notification' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, description: 'Date d’émission' },
      { name: 'titre', type: 'VARCHAR(255)', nullable: false, description: 'Objet court de la notification' },
      { name: 'message', type: 'TEXT', nullable: false, description: 'Corps du message d’alerte' },
      { name: 'type', type: 'VARCHAR(30)', nullable: false, description: 'INFO, AVERTISSEMENT, CRITIQUE, VALIDATION_REQUISE' },
      { name: 'module', type: 'VARCHAR(50)', nullable: false, description: 'Module émetteur' },
      { name: 'chantier_id', type: 'UUID', isForeignKey: true, referencesTable: 'chantiers', referencesColumn: 'id', nullable: true, description: 'Chantier rattaché' },
      { name: 'destinataire_id', type: 'UUID', isForeignKey: true, referencesTable: 'utilisateurs', referencesColumn: 'id', nullable: true, description: 'Utilisateur ciblé (NULL = diffusion au rôle)' },
      { name: 'lu', type: 'BOOLEAN', nullable: false, description: 'État de lecture' },
      { name: 'date_lecture', type: 'TIMESTAMPTZ', nullable: true, description: 'Horodatage d’acquittement' },
      { name: 'lien_action', type: 'VARCHAR(255)', nullable: true, description: 'Lien direct vers l’objet à traiter' }
    ],
    indexes: ['idx_notif_destinataire (destinataire_id)', 'idx_notif_chantier (chantier_id)', 'idx_notif_lu (lu)', 'idx_notif_created (created_at DESC)']
  },

  // 10. DOCUMENTS_GED
  {
    tableName: 'documents_ged',
    module: 'DOCUMENTS',
    description: 'Gestion Électronique des Documents centralisée avec indexation multi-chantiers',
    category: 'FONDATION_SYSTEME',
    columns: [
      { name: 'id', type: 'UUID', isPrimaryKey: true, nullable: false, description: 'Identifiant unique document' },
      { name: 'titre', type: 'VARCHAR(255)', nullable: false, description: 'Intitulé explicite du document' },
      { name: 'reference_officielle', type: 'VARCHAR(100)', nullable: true, description: 'N° d’enregistrement officiel (ex: N° Acte, N° Contrat)' },
      { name: 'chantier_id', type: 'UUID', isForeignKey: true, referencesTable: 'chantiers', referencesColumn: 'id', nullable: true, description: 'Chantier rattaché (NULL = document siège)' },
      { name: 'module', type: 'VARCHAR(50)', nullable: false, description: 'Module fonctionnel propriétaire' },
      { name: 'categorie', type: 'VARCHAR(100)', nullable: false, description: 'Catégorie documentaire (Plans, Permis, Situations, etc.)' },
      { name: 'nom_fichier', type: 'VARCHAR(255)', nullable: false, description: 'Nom de fichier original' },
      { name: 'extension', type: 'VARCHAR(20)', nullable: false, description: 'Extension (PDF, DWG, XLSX, JPG...)' },
      { name: 'taille_ko', type: 'INT', nullable: false, description: 'Poids du fichier en Kilo-octets' },
      { name: 'mime_type', type: 'VARCHAR(100)', nullable: false, description: 'Type MIME officiel' },
      { name: 'version', type: 'VARCHAR(20)', nullable: false, description: 'Numéro de version (ex: v1.0, v2.1)' },
      { name: 'est_valide_juridiquement', type: 'BOOLEAN', nullable: false, description: 'Document visé / paraphé / certifié' },
      { name: 'uploade_par_id', type: 'UUID', isForeignKey: true, referencesTable: 'utilisateurs', referencesColumn: 'id', nullable: false, description: 'Utilisateur ayant téléversé la pièce' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, description: 'Date de téléversement' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, description: 'Dernière mise à jour' }
    ],
    indexes: ['idx_doc_chantier (chantier_id)', 'idx_doc_module (module)', 'idx_doc_categorie (categorie)', 'idx_doc_reference (reference_officielle)']
  },

  // 11. RH - GESTION DU PERSONNEL & DOSSIERS
  {
    tableName: 'rh_employes',
    module: 'RH',
    description: 'Dossiers complets du personnel : ouvriers BTP, conducteurs d’engins, encadrement de chantier et siège',
    category: 'METIER_OPERATIONNEL',
    columns: [
      { name: 'id', type: 'UUID', isPrimaryKey: true, nullable: false, description: 'ID unique employé' },
      { name: 'entreprise_id', type: 'UUID', isForeignKey: true, referencesTable: 'entreprises', referencesColumn: 'id', nullable: false, description: 'Entreprise employeur' },
      { name: 'matricule', type: 'VARCHAR(50)', nullable: false, description: 'Matricule interne unique (ex: EMP-BTP-2024-001)' },
      { name: 'nom', type: 'VARCHAR(100)', nullable: false, description: 'Nom de famille' },
      { name: 'prenom', type: 'VARCHAR(100)', nullable: false, description: 'Prénom' },
      { name: 'date_naissance', type: 'DATE', nullable: false, description: 'Date de naissance' },
      { name: 'lieu_naissance', type: 'VARCHAR(100)', nullable: false, description: 'Lieu de naissance' },
      { name: 'wilaya_naissance', type: 'VARCHAR(100)', nullable: false, description: 'Wilaya de naissance (Algérie)' },
      { name: 'nationalite', type: 'VARCHAR(50)', nullable: false, description: 'Nationalité' },
      { name: 'nin', type: 'VARCHAR(18)', nullable: false, description: 'Numéro d’Identification National (18 chiffres)' },
      { name: 'num_cnas', type: 'VARCHAR(50)', nullable: false, description: 'N° d’immatriculation CNAS (Sécurité Sociale)' },
      { name: 'telephone', type: 'VARCHAR(30)', nullable: false, description: 'Numéro de téléphone' },
      { name: 'adresse', type: 'TEXT', nullable: false, description: 'Adresse de résidence ou base-vie' },
      { name: 'personne_urgence_nom', type: 'VARCHAR(100)', nullable: false, description: 'Contact en cas d’accident du travail' },
      { name: 'personne_urgence_tel', type: 'VARCHAR(30)', nullable: false, description: 'Téléphone du contact d’urgence' },
      { name: 'categorie', type: 'VARCHAR(50)', nullable: false, description: 'MACON, CONDUCTEUR_ENGIN, FERRAILLEUR, COFFREUR, MANOEUVRE...' },
      { name: 'qualification', type: 'VARCHAR(50)', nullable: false, description: 'Niveau de qualification BTP' },
      { name: 'type_contrat', type: 'VARCHAR(30)', nullable: false, description: 'CDD_CHANTIER, CDI, JOURNALIER, APPRENTI' },
      { name: 'date_embauche', type: 'DATE', nullable: false, description: 'Date d’entrée en fonction' },
      { name: 'date_fin_contrat', type: 'DATE', nullable: true, description: 'Date d’échéance du contrat si CDD' },
      { name: 'salaire_base_dzd', type: 'NUMERIC(18,2)', nullable: false, description: 'Salaire de base mensuel en DZD' },
      { name: 'chantier_actuel_id', type: 'UUID', isForeignKey: true, referencesTable: 'chantiers', referencesColumn: 'id', nullable: false, description: 'Chantier d’affectation en cours' },
      { name: 'statut', type: 'VARCHAR(30)', nullable: false, description: 'ACTIF, EN_CONGE, ARRET_MALADIE, SUSPENDU, FIN_DE_CONTRAT' },
      { name: 'documents_fournis', type: 'JSONB', nullable: false, description: 'Checklist des pièces fournies (CNAS, Médical, CNI)' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, description: 'Date de recrutement' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, description: 'Dernière mise à jour' }
    ],
    indexes: ['idx_rh_chantier (chantier_actuel_id)', 'idx_rh_matricule (matricule)', 'idx_rh_cnas (num_cnas)', 'idx_rh_categorie (categorie)']
  },

  // 11b. RH - HISTORIQUE DES AFFECTATIONS & TRANSFERTS INTER-CHANTIERS
  {
    tableName: 'rh_affectations_historique',
    module: 'RH',
    description: 'Traçabilité immuable des affectations et mutations des ouvriers d’un chantier à un autre',
    category: 'METIER_OPERATIONNEL',
    columns: [
      { name: 'id', type: 'UUID', isPrimaryKey: true, nullable: false, description: 'ID de l’opération d’affectation' },
      { name: 'employe_id', type: 'UUID', isForeignKey: true, referencesTable: 'rh_employes', referencesColumn: 'id', nullable: false, description: 'Ouvrier concerné' },
      { name: 'chantier_source_id', type: 'UUID', isForeignKey: true, referencesTable: 'chantiers', referencesColumn: 'id', nullable: true, description: 'Chantier d’origine' },
      { name: 'chantier_cible_id', type: 'UUID', isForeignKey: true, referencesTable: 'chantiers', referencesColumn: 'id', nullable: false, description: 'Chantier de destination' },
      { name: 'date_effet', type: 'DATE', nullable: false, description: 'Date de prise de poste sur le chantier cible' },
      { name: 'motif', type: 'TEXT', nullable: false, description: 'Raison opérationnelle (renfort coulage, réaffectation fin de lot)' },
      { name: 'valide_par_id', type: 'UUID', isForeignKey: true, referencesTable: 'utilisateurs', referencesColumn: 'id', nullable: false, description: 'Responsable RH validateur' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, description: 'Date d’enregistrement' }
    ],
    indexes: ['idx_aff_employe (employe_id)', 'idx_aff_source (chantier_source_id)', 'idx_aff_cible (chantier_cible_id)']
  },

  // 11c. RH - POINTAGES JOURNALIERS DES CHANTIERS
  {
    tableName: 'rh_pointages_journaliers',
    module: 'RH',
    description: 'Feuilles de présence et de pointage quotidien renseignées par les conducteurs de travaux',
    category: 'METIER_OPERATIONNEL',
    columns: [
      { name: 'id', type: 'UUID', isPrimaryKey: true, nullable: false, description: 'ID pointage individuel' },
      { name: 'chantier_id', type: 'UUID', isForeignKey: true, referencesTable: 'chantiers', referencesColumn: 'id', nullable: false, description: 'Chantier concerné' },
      { name: 'employe_id', type: 'UUID', isForeignKey: true, referencesTable: 'rh_employes', referencesColumn: 'id', nullable: false, description: 'Ouvrier pointé' },
      { name: 'date', type: 'DATE', nullable: false, description: 'Jour de travail' },
      { name: 'statut', type: 'VARCHAR(30)', nullable: false, description: 'PRESENT, ABSENT_INJUSTIFIE, ABSENT_JUSTIFIE, RETARD, CONGE' },
      { name: 'heure_arrivee', type: 'TIME', nullable: true, description: 'Heure de pointage à l’entrée' },
      { name: 'heure_depart', type: 'TIME', nullable: true, description: 'Heure de sortie' },
      { name: 'minutes_retard', type: 'INTEGER', nullable: true, description: 'Retard constaté en minutes' },
      { name: 'heures_travaillees', type: 'NUMERIC(4,2)', nullable: false, description: 'Total d’heures productives validées' },
      { name: 'observations', type: 'TEXT', nullable: true, description: 'Remarques du conducteur de travaux' },
      { name: 'saisi_par_id', type: 'UUID', isForeignKey: true, referencesTable: 'utilisateurs', referencesColumn: 'id', nullable: false, description: 'Conducteur de travaux ayant saisi' },
      { name: 'verrouille', type: 'BOOLEAN', nullable: false, description: 'Clôturé automatiquement après l’heure limite' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, description: 'Dernière mise à jour' }
    ],
    indexes: ['idx_ptg_chantier_date (chantier_id, date)', 'idx_ptg_employe (employe_id)', 'idx_ptg_statut (statut)']
  },

  // 11d. RH - DEMANDES D’AUTORISATION POST-CLÔTURE DU POINTAGE
  {
    tableName: 'rh_demandes_derogation',
    module: 'RH',
    description: 'Workflow formel de demande de dérogation soumis par les conducteurs après clôture du pointage',
    category: 'METIER_OPERATIONNEL',
    columns: [
      { name: 'id', type: 'UUID', isPrimaryKey: true, nullable: false, description: 'ID demande de dérogation' },
      { name: 'chantier_id', type: 'UUID', isForeignKey: true, referencesTable: 'chantiers', referencesColumn: 'id', nullable: false, description: 'Chantier concerné' },
      { name: 'date_pointage', type: 'DATE', nullable: false, description: 'Date de la feuille de pointage à rectifier' },
      { name: 'employe_id', type: 'UUID', isForeignKey: true, referencesTable: 'rh_employes', referencesColumn: 'id', nullable: false, description: 'Ouvrier concerné' },
      { name: 'demandeur_id', type: 'UUID', isForeignKey: true, referencesTable: 'utilisateurs', referencesColumn: 'id', nullable: false, description: 'Conducteur de travaux demandeur' },
      { name: 'statut_actuel', type: 'VARCHAR(30)', nullable: false, description: 'Statut présentement enregistré' },
      { name: 'statut_demande', type: 'VARCHAR(30)', nullable: false, description: 'Nouveau statut sollicité' },
      { name: 'heure_arrivee_demandee', type: 'TIME', nullable: true, description: 'Heure d’arrivée effective déclarée' },
      { name: 'motif_demande', type: 'TEXT', nullable: false, description: 'Justification circonstanciée obligatoire' },
      { name: 'statut_demande_approbation', type: 'VARCHAR(20)', nullable: false, description: 'EN_ATTENTE, VALIDEE, REFUSEE' },
      { name: 'traite_par_id', type: 'UUID', isForeignKey: true, referencesTable: 'utilisateurs', referencesColumn: 'id', nullable: true, description: 'Responsable RH ayant statué' },
      { name: 'date_traitement', type: 'TIMESTAMPTZ', nullable: true, description: 'Horodatage de la décision' },
      { name: 'motif_refus', type: 'TEXT', nullable: true, description: 'Motif en cas de rejet par le RH' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, description: 'Date de soumission' }
    ],
    indexes: ['idx_drg_statut (statut_demande_approbation)', 'idx_drg_chantier (chantier_id)', 'idx_drg_employe (employe_id)']
  },

  // 11e. RH - GESTION DES CONGÉS ET ABSENCES
  {
    tableName: 'rh_conges_absences',
    module: 'RH',
    description: 'Congés payés, arrêts de travail CNAS, accidents du travail et absences justifiées',
    category: 'METIER_OPERATIONNEL',
    columns: [
      { name: 'id', type: 'UUID', isPrimaryKey: true, nullable: false, description: 'ID demande de congé' },
      { name: 'employe_id', type: 'UUID', isForeignKey: true, referencesTable: 'rh_employes', referencesColumn: 'id', nullable: false, description: 'Ouvrier demandeur' },
      { name: 'chantier_id', type: 'UUID', isForeignKey: true, referencesTable: 'chantiers', referencesColumn: 'id', nullable: false, description: 'Chantier de rattachement' },
      { name: 'type', type: 'VARCHAR(50)', nullable: false, description: 'CONGE_PAYE, MALADIE_CNAS, ACCIDENT_TRAVAIL, SANS_SOLDE, EVENEMENT_FAMILIAL' },
      { name: 'date_debut', type: 'DATE', nullable: false, description: 'Date de début' },
      { name: 'date_fin', type: 'DATE', nullable: false, description: 'Date de reprise' },
      { name: 'nombre_jours', type: 'INTEGER', nullable: false, description: 'Nombre de jours ouvrables' },
      { name: 'motif', type: 'TEXT', nullable: false, description: 'Motif ou référence certificat médical CNAS' },
      { name: 'certificat_medical_ref', type: 'VARCHAR(100)', nullable: true, description: 'Référence arrêt CNAS' },
      { name: 'statut', type: 'VARCHAR(20)', nullable: false, description: 'EN_ATTENTE, VALIDE, REFUSE' },
      { name: 'valide_par_nom', type: 'VARCHAR(100)', nullable: true, description: 'Responsable RH validateur' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, description: 'Date de saisie' }
    ],
    indexes: ['idx_cng_employe (employe_id)', 'idx_cng_dates (date_debut, date_fin)']
  },

  // 12. JURIDIQUE - DOSSIERS FONCIERS & CONTRATS
  {
    tableName: 'juridique_dossiers',
    module: 'JURIDIQUE',
    description: 'Actes notariés, livrets fonciers, permis de construire et contentieux par chantier',
    category: 'METIER_OPERATIONNEL',
    columns: [
      { name: 'id', type: 'UUID', isPrimaryKey: true, nullable: false, description: 'ID dossier' },
      { name: 'chantier_id', type: 'UUID', isForeignKey: true, referencesTable: 'chantiers', referencesColumn: 'id', nullable: false, description: 'Chantier rattaché' },
      { name: 'type_dossier', type: 'VARCHAR(50)', nullable: false, description: 'FONCIER, PERMIS_CONSTRUIRE, CONTRAT_ST, LITIGE' },
      { name: 'numero_enregistrement', type: 'VARCHAR(100)', nullable: false, description: 'N° d’enregistrement conservation foncière ou tribunal' },
      { name: 'notaire_huissier', type: 'VARCHAR(150)', nullable: true, description: 'Étude notariale ou huissier de justice' },
      { name: 'date_signature', type: 'DATE', nullable: true, description: 'Date de l’acte' },
      { name: 'statut_conformite', type: 'VARCHAR(50)', nullable: false, description: 'CONFORME, EN_ATTENTE_PURGE, RECOURS' }
    ],
    indexes: ['idx_juridique_chantier (chantier_id)', 'idx_juridique_type (type_dossier)']
  },

  // 13. COMPTABILITÉ & FISCALITÉ
  {
    tableName: 'comptabilite_budgets',
    module: 'COMPTABILITE',
    description: 'Découpage budgétaire prévisionnel et engagé par poste de coût et par chantier',
    category: 'METIER_OPERATIONNEL',
    columns: [
      { name: 'id', type: 'UUID', isPrimaryKey: true, nullable: false, description: 'ID ligne budgétaire' },
      { name: 'chantier_id', type: 'UUID', isForeignKey: true, referencesTable: 'chantiers', referencesColumn: 'id', nullable: false, description: 'Chantier rattaché' },
      { name: 'poste_code', type: 'VARCHAR(50)', nullable: false, description: 'Code nomenclature (Gros-œuvre, VRD, Électricité...)' },
      { name: 'intitule', type: 'VARCHAR(255)', nullable: false, description: 'Désignation du poste de dépense' },
      { name: 'montant_prevu_dzd', type: 'NUMERIC(18,2)', nullable: false, description: 'Budget alloué en DZD' },
      { name: 'montant_engage_dzd', type: 'NUMERIC(18,2)', nullable: false, description: 'Commandes engagées en DZD' },
      { name: 'montant_facture_dzd', type: 'NUMERIC(18,2)', nullable: false, description: 'Situations & factures validées en DZD' },
      { name: 'taux_consommation', type: 'NUMERIC(5,2)', nullable: false, description: 'Ratio consommé (%)' }
    ],
    indexes: ['idx_budget_chantier (chantier_id)', 'idx_budget_poste (poste_code)']
  },

  // 14. TECHNIQUE & CONTROLE CTC
  {
    tableName: 'technique_lots',
    module: 'TECHNIQUE',
    description: 'Lots techniques de construction (Terrassement, Béton armé, Maçonnerie, Second œuvre)',
    category: 'METIER_OPERATIONNEL',
    columns: [
      { name: 'id', type: 'UUID', isPrimaryKey: true, nullable: false, description: 'ID lot technique' },
      { name: 'chantier_id', type: 'UUID', isForeignKey: true, referencesTable: 'chantiers', referencesColumn: 'id', nullable: false, description: 'Chantier d’exécution' },
      { name: 'numero_lot', type: 'VARCHAR(20)', nullable: false, description: 'N° du lot technique (Lot 01, Lot 02...)' },
      { name: 'libelle_lot', type: 'VARCHAR(150)', nullable: false, description: 'Dénomination du corps d’état' },
      { name: 'entreprise_adjudicataire', type: 'VARCHAR(255)', nullable: true, description: 'Entreprise de réalisation ou régie directe' },
      { name: 'avis_ctc_requis', type: 'BOOLEAN', nullable: false, description: 'Soumis à réception et PV CTC' },
      { name: 'statut_avancement', type: 'VARCHAR(50)', nullable: false, description: 'NON_COMMENCE, EN_COURS, BLOQUE, RECEPTIONNE' },
      { name: 'taux_realise', type: 'NUMERIC(5,2)', nullable: false, description: 'Avancement métré (%)' }
    ],
    indexes: ['idx_technique_chantier (chantier_id)']
  },

  // 15. MATÉRIEL & PARC ENGINS
  {
    tableName: 'materiel_engins',
    module: 'MATERIEL',
    description: 'Inventaire des grues, centrales à béton, camions et affectations inter-chantiers',
    category: 'METIER_OPERATIONNEL',
    columns: [
      { name: 'id', type: 'UUID', isPrimaryKey: true, nullable: false, description: 'ID engin' },
      { name: 'code_materiel', type: 'VARCHAR(50)', nullable: false, description: 'Code d’identification interne' },
      { name: 'designation', type: 'VARCHAR(200)', nullable: false, description: 'Modèle et type d’engin' },
      { name: 'categorie', type: 'VARCHAR(50)', nullable: false, description: 'ENGIN_LEVAGE, ENGIN_TERRASSEMENT, TOUPIE_BETON, PETIT_OUTILLAGE' },
      { name: 'immatriculation_serie', type: 'VARCHAR(100)', nullable: true, description: 'N° Série constructeur ou immatriculation' },
      { name: 'chantier_actuel_id', type: 'UUID', isForeignKey: true, referencesTable: 'chantiers', referencesColumn: 'id', nullable: true, description: 'Chantier où l’engin est actuellement déployé' },
      { name: 'etat_fonctionnel', type: 'VARCHAR(30)', nullable: false, description: 'OPERATIONNEL, EN_PANNE, EN_MAINTENANCE' },
      { name: 'derniere_maintenance', type: 'DATE', nullable: true, description: 'Date dernière visite technique' }
    ],
    indexes: ['idx_materiel_chantier (chantier_actuel_id)', 'idx_materiel_code (code_materiel)']
  },

  // 16. COMMERCIAL & PROGRAMME DE VENTE
  {
    tableName: 'commercial_programmes_lots',
    module: 'COMMERCIAL',
    description: 'Unités immobilières en vente sur plans (VEFA) rattachées au chantier',
    category: 'METIER_OPERATIONNEL',
    columns: [
      { name: 'id', type: 'UUID', isPrimaryKey: true, nullable: false, description: 'ID unité en vente' },
      { name: 'chantier_id', type: 'UUID', isForeignKey: true, referencesTable: 'chantiers', referencesColumn: 'id', nullable: false, description: 'Programme immobilier rattaché' },
      { name: 'numero_lot_plan', type: 'VARCHAR(50)', nullable: false, description: 'N° d’appartement ou local (ex: Bâtiment A - Apt 104)' },
      { name: 'typologie', type: 'VARCHAR(30)', nullable: false, description: 'F2, F3, F4, F5, Duplex, Local Commercial' },
      { name: 'etage', type: 'INT', nullable: false, description: 'Étage' },
      { name: 'surface_utile_m2', type: 'NUMERIC(8,2)', nullable: false, description: 'Surface utile habitable' },
      { name: 'prix_vente_prevu_dzd', type: 'NUMERIC(18,2)', nullable: false, description: 'Prix au barème officiel en DZD' },
      { name: 'statut_vente', type: 'VARCHAR(30)', nullable: false, description: 'DISPONIBLE, RESERVE, CONTRAT_VEFA_SIGNE, LIVRE' }
    ],
    indexes: ['idx_commercial_chantier (chantier_id)', 'idx_commercial_statut (statut_vente)']
  },

  // 17. APPROVISIONNEMENTS, ACHATS & MAGASINS CHANTIERS
  {
    tableName: 'fournisseurs',
    module: 'APPROVISIONNEMENTS',
    description: 'Répertoire des fournisseurs agréés BTP (Acier, Ciment, Béton, Matériaux, Outillage)',
    category: 'METIER_OPERATIONNEL',
    columns: [
      { name: 'id', type: 'UUID', isPrimaryKey: true, nullable: false, description: 'ID unique fournisseur' },
      { name: 'entreprise_id', type: 'UUID', isForeignKey: true, referencesTable: 'entreprises', referencesColumn: 'id', nullable: false, description: 'Promoteur rattaché' },
      { name: 'nom_fournisseur', type: 'VARCHAR(255)', nullable: false, description: 'Raison sociale du fournisseur' },
      { name: 'forme_juridique', type: 'VARCHAR(20)', nullable: false, description: 'SPA, SARL, EURL' },
      { name: 'categorie', type: 'VARCHAR(50)', nullable: false, description: 'Corps de fourniture BTP' },
      { name: 'nif', type: 'VARCHAR(30)', nullable: false, description: 'Numéro d’Identification Fiscale' },
      { name: 'rc', type: 'VARCHAR(50)', nullable: false, description: 'Registre du Commerce' },
      { name: 'nis', type: 'VARCHAR(30)', nullable: false, description: 'Numéro Statistique NIS' },
      { name: 'wilaya', type: 'VARCHAR(100)', nullable: false, description: 'Wilaya d’implantation' },
      { name: 'telephone', type: 'VARCHAR(30)', nullable: false, description: 'Contact téléphonique' },
      { name: 'delai_livraison_moyen_jours', type: 'INT', nullable: false, description: 'Délai moyen constaté en jours' },
      { name: 'actif', type: 'BOOLEAN', nullable: false, description: 'Statut actif' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, description: 'Date d’enregistrement' }
    ],
    indexes: ['idx_fournisseur_nif (nif)', 'idx_fournisseur_categorie (categorie)']
  },

  {
    tableName: 'appro_demandes_achat',
    module: 'APPROVISIONNEMENTS',
    description: 'Expressions de besoins chantiers initiées par le conducteur de travaux et validées par la comptabilité',
    category: 'METIER_OPERATIONNEL',
    columns: [
      { name: 'id', type: 'UUID', isPrimaryKey: true, nullable: false, description: 'ID demande achat (DA)' },
      { name: 'chantier_id', type: 'UUID', isForeignKey: true, referencesTable: 'chantiers', referencesColumn: 'id', nullable: false, description: 'Chantier destinataire' },
      { name: 'numero_da', type: 'VARCHAR(50)', nullable: false, description: 'N° de DA (ex: DA-2026-CHT01-0042)' },
      { name: 'demandeur_id', type: 'UUID', isForeignKey: true, referencesTable: 'utilisateurs', referencesColumn: 'id', nullable: false, description: 'Conducteur de travaux initiateur' },
      { name: 'designation_produit', type: 'VARCHAR(255)', nullable: false, description: 'Désignation exacte du matériau' },
      { name: 'quantite_demandee', type: 'NUMERIC(12,2)', nullable: false, description: 'Volume ou quantité sollicitée' },
      { name: 'unite_mesure', type: 'VARCHAR(20)', nullable: false, description: 'Unité (Tonne, Sac, m³, m², ML)' },
      { name: 'niveau_urgence', type: 'VARCHAR(30)', nullable: false, description: 'NORMAL, URGENT, CRITIQUE_ARRET_CHANTIER' },
      { name: 'justification', type: 'TEXT', nullable: false, description: 'Motif technique et lot de destination' },
      { name: 'statut', type: 'VARCHAR(40)', nullable: false, description: 'BROUILLON, EN_ATTENTE_COMPTABILITE, VALIDEE, COMMANDEE...' },
      { name: 'historique_validations', type: 'JSONB', nullable: false, description: 'Journal complet des étapes de validation' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, description: 'Horodatage création' }
    ],
    indexes: ['idx_da_chantier (chantier_id)', 'idx_da_statut (statut)', 'idx_da_numero (numero_da)']
  },

  {
    tableName: 'appro_bons_commande',
    module: 'APPROVISIONNEMENTS',
    description: 'Bons de commande émis par les Approvisionnements avec livraison directe au magasin du chantier',
    category: 'METIER_OPERATIONNEL',
    columns: [
      { name: 'id', type: 'UUID', isPrimaryKey: true, nullable: false, description: 'ID bon de commande' },
      { name: 'numero_bc', type: 'VARCHAR(50)', nullable: false, description: 'N° officiel BC (ex: BC-2026-0019)' },
      { name: 'demande_achat_id', type: 'UUID', isForeignKey: true, referencesTable: 'appro_demandes_achat', referencesColumn: 'id', nullable: false, description: 'DA rattachée' },
      { name: 'fournisseur_id', type: 'UUID', isForeignKey: true, referencesTable: 'fournisseurs', referencesColumn: 'id', nullable: false, description: 'Fournisseur adjudicataire' },
      { name: 'chantier_destinataire_id', type: 'UUID', isForeignKey: true, referencesTable: 'chantiers', referencesColumn: 'id', nullable: false, description: 'Magasin chantier de livraison directe' },
      { name: 'date_commande', type: 'DATE', nullable: false, description: 'Date d’émission' },
      { name: 'date_livraison_prevue', type: 'DATE', nullable: false, description: 'Échéance convenue' },
      { name: 'montant_total_ht_dzd', type: 'NUMERIC(18,2)', nullable: false, description: 'Total Hors Taxes en DZD' },
      { name: 'montant_tva_dzd', type: 'NUMERIC(18,2)', nullable: false, description: 'Montant TVA (19%)' },
      { name: 'montant_total_ttc_dzd', type: 'NUMERIC(18,2)', nullable: false, description: 'Total TTC en DZD' },
      { name: 'statut', type: 'VARCHAR(30)', nullable: false, description: 'EMIS, EN_LIVRAISON, LIVRE_TOTAL...' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, description: 'Horodatage' }
    ],
    indexes: ['idx_bc_numero (numero_bc)', 'idx_bc_fournisseur (fournisseur_id)', 'idx_bc_chantier (chantier_destinataire_id)']
  },

  {
    tableName: 'appro_receptions_chantiers',
    module: 'APPROVISIONNEMENTS',
    description: 'Bons de réception et contrôles qualitatifs établis par le magasinier sur le chantier',
    category: 'METIER_OPERATIONNEL',
    columns: [
      { name: 'id', type: 'UUID', isPrimaryKey: true, nullable: false, description: 'ID réception magasin chantier' },
      { name: 'bon_commande_id', type: 'UUID', isForeignKey: true, referencesTable: 'appro_bons_commande', referencesColumn: 'id', nullable: false, description: 'BC de référence' },
      { name: 'numero_bl_fournisseur', type: 'VARCHAR(50)', nullable: false, description: 'N° Bon de livraison transporteur' },
      { name: 'numero_br_interne', type: 'VARCHAR(50)', nullable: false, description: 'N° interne Bon de Réception' },
      { name: 'chantier_id', type: 'UUID', isForeignKey: true, referencesTable: 'chantiers', referencesColumn: 'id', nullable: false, description: 'Chantier réceptionnaire' },
      { name: 'magasinier_id', type: 'UUID', isForeignKey: true, referencesTable: 'utilisateurs', referencesColumn: 'id', nullable: false, description: 'Magasinier contrôleur' },
      { name: 'quantite_recue', type: 'NUMERIC(12,2)', nullable: false, description: 'Quantité livrée' },
      { name: 'quantite_conforme', type: 'NUMERIC(12,2)', nullable: false, description: 'Quantité acceptée en stock magasin' },
      { name: 'conformite_qualite', type: 'VARCHAR(30)', nullable: false, description: 'CONFORME, NON_CONFORME, RESERVES' },
      { name: 'numero_plaque_camion', type: 'VARCHAR(30)', nullable: true, description: 'Immatriculation camion de livraison' },
      { name: 'visa_magasinier', type: 'BOOLEAN', nullable: false, description: 'Attestation de réception' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, description: 'Date de réception' }
    ],
    indexes: ['idx_br_bc (bon_commande_id)', 'idx_br_chantier (chantier_id)']
  },

  {
    tableName: 'appro_factures_fournisseurs',
    module: 'APPROVISIONNEMENTS',
    description: 'Factures fournisseurs rapprochées (Rapprochement 3 voies : DA, BC, BR) transmises pour règlement',
    category: 'METIER_OPERATIONNEL',
    columns: [
      { name: 'id', type: 'UUID', isPrimaryKey: true, nullable: false, description: 'ID facture' },
      { name: 'numero_facture', type: 'VARCHAR(50)', nullable: false, description: 'N° facture fournisseur' },
      { name: 'bon_commande_id', type: 'UUID', isForeignKey: true, referencesTable: 'appro_bons_commande', referencesColumn: 'id', nullable: false, description: 'BC adossé' },
      { name: 'fournisseur_id', type: 'UUID', isForeignKey: true, referencesTable: 'fournisseurs', referencesColumn: 'id', nullable: false, description: 'Fournisseur créancier' },
      { name: 'chantier_id', type: 'UUID', isForeignKey: true, referencesTable: 'chantiers', referencesColumn: 'id', nullable: false, description: 'Chantier imputé' },
      { name: 'montant_ht_dzd', type: 'NUMERIC(18,2)', nullable: false, description: 'Montant HT en DZD' },
      { name: 'montant_tva_dzd', type: 'NUMERIC(18,2)', nullable: false, description: 'TVA 19%' },
      { name: 'montant_ttc_dzd', type: 'NUMERIC(18,2)', nullable: false, description: 'Montant TTC exigible' },
      { name: 'statut_comptable', type: 'VARCHAR(30)', nullable: false, description: 'EN_ATTENTE_CONTROLE, BON_A_PAYER, PAYEE' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, description: 'Date d’enregistrement' }
    ],
    indexes: ['idx_fac_bc (bon_commande_id)', 'idx_fac_fournisseur (fournisseur_id)']
  }
];

/**
 * Générateur de script DDL SQL PostgreSQL
 */
export function generatePostgreSqlDDL(): string {
  let sql = `-- =====================================================================\n`;
  sql += `-- SCRIPT DDL DE LA BASE DE DONNÉES RELATIONNELLE CENTRALISÉE\n`;
  sql += `-- PROMOTEUR IMMOBILIER EN ALGÉRIE - ARCHITECTURE MULTI-CHANTIERS\n`;
  sql += `-- SGBD Cible : PostgreSQL / Cloud SQL\n`;
  sql += `-- =====================================================================\n\n`;
  sql += `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n\n`;

  for (const table of DATABASE_SCHEMA_TABLES) {
    sql += `-- Table: ${table.tableName.toUpperCase()} (${table.description})\n`;
    sql += `CREATE TABLE IF NOT EXISTS ${table.tableName} (\n`;

    const colLines: string[] = [];
    const pkCols: string[] = [];
    const fkConstraints: string[] = [];

    for (const col of table.columns) {
      let line = `    ${col.name.padEnd(28)} ${col.type}`;
      if (!col.nullable) {
        line += ` NOT NULL`;
      }
      if (col.isPrimaryKey) {
        pkCols.push(col.name);
      }
      if (col.isForeignKey && col.referencesTable && col.referencesColumn) {
        fkConstraints.push(
          `    CONSTRAINT fk_${table.tableName}_${col.name} FOREIGN KEY (${col.name}) REFERENCES ${col.referencesTable}(${col.referencesColumn}) ON DELETE RESTRICT`
        );
      }
      colLines.push(line);
    }

    if (pkCols.length > 0) {
      colLines.push(`    CONSTRAINT pk_${table.tableName} PRIMARY KEY (${pkCols.join(', ')})`);
    }

    colLines.push(...fkConstraints);

    sql += colLines.join(',\n');
    sql += `\n);\n\n`;

    // Indexes
    for (const idx of table.indexes) {
      const match = idx.match(/^(idx_[a-zA-Z0-9_]+)\s*\((.+)\)$/);
      if (match) {
        const idxName = match[1];
        const cols = match[2];
        sql += `CREATE INDEX IF NOT EXISTS ${idxName} ON ${table.tableName} (${cols});\n`;
      }
    }
    sql += `\n`;
  }

  return sql;
}
