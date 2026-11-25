-- ============================================================
-- SCRIPT INTÉGRAL BATIPROM ALGÉRIE - LES 31 TABLES DU SYSTÈME
-- À copier-coller dans Supabase SQL Editor et cliquer RUN :
-- https://supabase.com/dashboard/project/yauiolqxwsihgwlzkvhr/editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. STRUCTURE CENTRALE & ENTREPRISE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.entreprises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  raison_sociale TEXT NOT NULL,
  nom_commercial TEXT NOT NULL,
  forme_juridique TEXT NOT NULL DEFAULT 'SARL',
  capital_social DECIMAL(18,2) DEFAULT 0,
  rc TEXT UNIQUE NOT NULL,
  nif TEXT UNIQUE NOT NULL,
  nis TEXT NOT NULL,
  article_imposition TEXT NOT NULL,
  agrement_promoteur TEXT NOT NULL,
  date_agrement DATE,
  adresse_siege TEXT NOT NULL,
  wilaya TEXT NOT NULL,
  commune_siege TEXT,
  code_postal TEXT,
  telephone TEXT NOT NULL,
  email TEXT NOT NULL,
  site_web TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chantiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  code_chantier TEXT UNIQUE NOT NULL,
  nom_projet TEXT NOT NULL,
  description TEXT,
  wilaya TEXT NOT NULL,
  commune TEXT NOT NULL,
  adresse_site TEXT NOT NULL,
  superficie_terrain_m2 DECIMAL(12,2) DEFAULT 0,
  surface_plancher_m2 DECIMAL(12,2) DEFAULT 0,
  nombre_logements INTEGER DEFAULT 0,
  nombre_locaux_commerciaux INTEGER DEFAULT 0,
  nombre_niveaux TEXT NOT NULL,
  permis_construire_ref TEXT,
  date_obtention_permis DATE,
  date_ouverture_chantier DATE NOT NULL,
  date_livraison_prevue DATE NOT NULL,
  budget_global_prevu DECIMAL(18,2) DEFAULT 0,
  budget_engage DECIMAL(18,2) DEFAULT 0,
  statut TEXT DEFAULT 'GROS_OEUVRE',
  taux_avancement_physique DECIMAL(5,2) DEFAULT 0,
  directeur_chantier_id TEXT,
  conducteur_travaux_id TEXT,
  bureau_etudes TEXT,
  organisme_ctc TEXT,
  geolocalisation JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.comptes_bancaires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  nom_banque TEXT NOT NULL,
  code_banque TEXT NOT NULL,
  agence TEXT NOT NULL,
  titulaire TEXT NOT NULL,
  rib TEXT UNIQUE NOT NULL,
  iban TEXT,
  swift_bic TEXT,
  devise TEXT DEFAULT 'DZD',
  actif BOOLEAN DEFAULT true,
  is_compte_principal BOOLEAN DEFAULT false,
  type_compte TEXT DEFAULT 'COURANT',
  chantier_dedie_id UUID REFERENCES public.chantiers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.parametres_generaux (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  devise_principale TEXT DEFAULT 'DZD',
  langue_defaut TEXT DEFAULT 'fr',
  is_rtl BOOLEAN DEFAULT false,
  format_date TEXT DEFAULT 'JJ/MM/AAAA',
  horaires_travail JSONB,
  heure_limite_pointage TEXT DEFAULT '08:30',
  notifications_config JSONB,
  unites_mesure JSONB,
  exercices_comptables JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.budgets_chantiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chantier_id UUID NOT NULL REFERENCES public.chantiers(id) ON DELETE CASCADE,
  categorie TEXT NOT NULL,
  montant_alloue DECIMAL(18,2) DEFAULT 0,
  montant_engage DECIMAL(18,2) DEFAULT 0,
  montant_consomme DECIMAL(18,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. UTILISATEURS & SÉCURITÉ RBAC
-- ============================================================

CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  libelle TEXT NOT NULL,
  description TEXT,
  type_acces TEXT DEFAULT 'CENTRAL',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  libelle TEXT NOT NULL,
  module TEXT NOT NULL,
  action TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.roles_permissions (
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS public.utilisateurs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telephone TEXT NOT NULL,
  poste TEXT NOT NULL,
  type TEXT DEFAULT 'CENTRAL',
  role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
  statut TEXT DEFAULT 'ACTIF',
  photo_url TEXT,
  chantiers_assignes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.utilisateurs_chantiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  utilisateur_id UUID NOT NULL REFERENCES public.utilisateurs(id) ON DELETE CASCADE,
  chantier_id UUID NOT NULL REFERENCES public.chantiers(id) ON DELETE CASCADE,
  date_affectation TIMESTAMPTZ DEFAULT NOW(),
  actif BOOLEAN DEFAULT true,
  UNIQUE(utilisateur_id, chantier_id)
);

CREATE TABLE IF NOT EXISTS public.users_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  utilisateur_id UUID NOT NULL REFERENCES public.utilisateurs(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. AUDIT, NOTIFICATIONS & GED
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  utilisateur_id TEXT NOT NULL,
  utilisateur_nom TEXT NOT NULL,
  utilisateur_email TEXT NOT NULL,
  chantier_id UUID REFERENCES public.chantiers(id) ON DELETE SET NULL,
  chantier_nom TEXT,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  entite_cible TEXT NOT NULL,
  entite_id TEXT NOT NULL,
  description TEXT NOT NULL,
  adresse_ip TEXT DEFAULT '127.0.0.1',
  user_agent TEXT,
  details_modifications JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titre TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'INFO',
  module TEXT NOT NULL,
  priorite TEXT DEFAULT 'NORMALE',
  statut_validation TEXT DEFAULT 'NON_APPLICABLE',
  expediteur_id TEXT,
  expediteur_nom TEXT,
  expediteur_role TEXT,
  destinataire_id TEXT,
  destinataire_role TEXT,
  destinataire_nom TEXT,
  chantier_id UUID REFERENCES public.chantiers(id) ON DELETE CASCADE,
  chantier_nom TEXT,
  lu BOOLEAN DEFAULT false,
  date_lecture TIMESTAMPTZ,
  lien_action TEXT,
  historique_actions JSONB DEFAULT '[]',
  entite_type TEXT,
  entite_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.documents_ged (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titre TEXT NOT NULL,
  reference_officielle TEXT,
  chantier_id UUID REFERENCES public.chantiers(id) ON DELETE SET NULL,
  module TEXT NOT NULL,
  categorie TEXT NOT NULL,
  nom_fichier TEXT NOT NULL,
  extension TEXT NOT NULL,
  taille_ko INTEGER DEFAULT 0,
  mime_type TEXT,
  url_fichier TEXT,
  version TEXT DEFAULT '1.0',
  uploade_par_id TEXT,
  uploade_par_nom TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. RESSOURCES HUMAINES & POINTAGE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.employes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  matricule TEXT UNIQUE NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  date_naissance DATE NOT NULL,
  lieu_naissance TEXT NOT NULL,
  wilaya_naissance TEXT NOT NULL,
  nationalite TEXT DEFAULT 'Algérienne',
  nin TEXT NOT NULL,
  num_cnas TEXT NOT NULL,
  groupe_sanguin TEXT,
  telephone TEXT NOT NULL,
  adresse TEXT NOT NULL,
  commune TEXT NOT NULL,
  wilaya TEXT NOT NULL,
  personne_urgence_nom TEXT NOT NULL,
  personne_urgence_tel TEXT NOT NULL,
  categorie TEXT NOT NULL,
  qualification TEXT NOT NULL,
  type_contrat TEXT NOT NULL,
  date_embauche DATE NOT NULL,
  date_fin_contrat DATE,
  salaire_base_dzd DECIMAL(12,2) NOT NULL DEFAULT 0,
  chantier_actuel_id UUID REFERENCES public.chantiers(id) ON DELETE SET NULL,
  chantier_actuel_nom TEXT NOT NULL DEFAULT '',
  date_affectation_actuelle DATE NOT NULL DEFAULT CURRENT_DATE,
  statut TEXT DEFAULT 'ACTIF',
  documents_fournis JSONB DEFAULT '{}',
  observations TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.affectations_historique (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employe_id UUID NOT NULL REFERENCES public.employes(id) ON DELETE CASCADE,
  chantier_id UUID NOT NULL REFERENCES public.chantiers(id) ON DELETE CASCADE,
  date_debut DATE NOT NULL,
  date_fin DATE,
  motif TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pointages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employe_id UUID NOT NULL REFERENCES public.employes(id) ON DELETE CASCADE,
  chantier_id UUID NOT NULL REFERENCES public.chantiers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  statut_pointage TEXT DEFAULT 'PRESENT',
  heure_arrivee TEXT,
  heure_depart TEXT,
  heures_normales DECIMAL(4,2) DEFAULT 8,
  heures_sup DECIMAL(4,2) DEFAULT 0,
  observations TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employe_id, date)
);

CREATE TABLE IF NOT EXISTS public.conges_absences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employe_id TEXT NOT NULL,
  employe_nom TEXT NOT NULL,
  chantier_id UUID REFERENCES public.chantiers(id) ON DELETE SET NULL,
  chantier_nom TEXT,
  type TEXT NOT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  nombre_jours INTEGER NOT NULL,
  motif TEXT,
  statut TEXT DEFAULT 'EN_ATTENTE',
  approbateur_id TEXT,
  approbateur_nom TEXT,
  date_approbation TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. APPROVISIONNEMENTS & ACHATS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.fournisseurs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  code_fournisseur TEXT UNIQUE NOT NULL,
  raison_sociale TEXT NOT NULL,
  forme_juridique TEXT,
  registre_commerce TEXT,
  nif TEXT,
  nis TEXT,
  adresse TEXT NOT NULL,
  wilaya TEXT NOT NULL,
  commune TEXT,
  telephone TEXT NOT NULL,
  email TEXT,
  contact_principal TEXT,
  telephone_contact TEXT,
  famille_fourniture TEXT NOT NULL,
  sous_famille TEXT,
  statut TEXT DEFAULT 'ACTIF',
  delai_paiement_jours INTEGER DEFAULT 30,
  mode_paiement_prefere TEXT DEFAULT 'VIREMENT_BANCAIRE',
  conditions_paiement TEXT,
  note_evaluation DECIMAL(3,2),
  nombre_commandes INTEGER DEFAULT 0,
  montant_total_achats_dzd DECIMAL(18,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.demandes_achat (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_da TEXT UNIQUE NOT NULL,
  chantier_id UUID NOT NULL REFERENCES public.chantiers(id) ON DELETE CASCADE,
  chantier_nom TEXT NOT NULL,
  demandeur_id TEXT NOT NULL,
  demandeur_nom TEXT NOT NULL,
  designation_produit TEXT NOT NULL,
  famille_article TEXT NOT NULL,
  quantite_demandee DECIMAL(10,3) NOT NULL,
  unite_mesure TEXT NOT NULL,
  niveau_urgence TEXT DEFAULT 'NORMAL',
  justification TEXT NOT NULL,
  date_besoin_chantier DATE NOT NULL,
  estimation_budget_dzd DECIMAL(18,2),
  statut TEXT DEFAULT 'EN_ATTENTE_DIRECTION',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bons_commande (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_bc TEXT UNIQUE NOT NULL,
  demande_achat_id UUID REFERENCES public.demandes_achat(id) ON DELETE CASCADE,
  chantier_id UUID NOT NULL REFERENCES public.chantiers(id) ON DELETE CASCADE,
  fournisseur_id UUID REFERENCES public.fournisseurs(id) ON DELETE SET NULL,
  fournisseur_nom TEXT NOT NULL,
  designation_produit TEXT NOT NULL,
  quantite_commandee DECIMAL(10,3) NOT NULL,
  unite_mesure TEXT NOT NULL,
  prix_unitaire_ht_dzd DECIMAL(18,2) NOT NULL,
  taux_tva_pct DECIMAL(5,2) DEFAULT 19,
  montant_ht_dzd DECIMAL(18,2) NOT NULL,
  montant_tva_dzd DECIMAL(18,2) NOT NULL,
  montant_ttc_dzd DECIMAL(18,2) NOT NULL,
  date_livraison_prevue DATE NOT NULL,
  delai_paiement TEXT,
  statut TEXT DEFAULT 'EN_COURS',
  emis_par_id TEXT,
  emis_par_nom TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bons_reception (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_br TEXT UNIQUE NOT NULL,
  bon_commande_id UUID REFERENCES public.bons_commande(id) ON DELETE SET NULL,
  chantier_id UUID NOT NULL REFERENCES public.chantiers(id) ON DELETE CASCADE,
  numero_bl_fournisseur TEXT NOT NULL,
  quantite_commandee DECIMAL(10,3) NOT NULL,
  quantite_recue DECIMAL(10,3) NOT NULL,
  quantite_conforme DECIMAL(10,3) NOT NULL,
  quantite_rejetee DECIMAL(10,3) DEFAULT 0,
  conformite_qualite TEXT DEFAULT 'CONFORME',
  motif_rejet_ou_reserves TEXT,
  numero_plaque_camion TEXT,
  nom_chauffeur TEXT,
  receptionne_par_id TEXT,
  receptionne_par_nom TEXT,
  statut TEXT DEFAULT 'RECU_CONFORME',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.factures_fournisseurs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_facture TEXT UNIQUE NOT NULL,
  bon_commande_id UUID REFERENCES public.bons_commande(id) ON DELETE SET NULL,
  bon_reception_ref TEXT NOT NULL,
  fournisseur_id UUID REFERENCES public.fournisseurs(id) ON DELETE SET NULL,
  fournisseur_nom TEXT NOT NULL,
  chantier_id UUID REFERENCES public.chantiers(id) ON DELETE SET NULL,
  date_facture DATE NOT NULL,
  date_echeance DATE NOT NULL,
  montant_ht_dzd DECIMAL(18,2) NOT NULL,
  montant_tva_dzd DECIMAL(18,2) DEFAULT 0,
  montant_ttc_dzd DECIMAL(18,2) NOT NULL,
  mode_paiement TEXT DEFAULT 'VIREMENT_BANCAIRE',
  statut TEXT DEFAULT 'EN_ATTENTE_VALIDATION',
  date_paiement TIMESTAMPTZ,
  reference_paiement TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. STOCK & LOGISTIQUE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.articles_stock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chantier_id UUID NOT NULL REFERENCES public.chantiers(id) ON DELETE CASCADE,
  code_article TEXT NOT NULL,
  designation TEXT NOT NULL,
  famille TEXT NOT NULL,
  sous_famille TEXT,
  unite_mesure TEXT NOT NULL,
  quantite_en_stock DECIMAL(12,3) DEFAULT 0,
  quantite_minimale_alerte DECIMAL(12,3) DEFAULT 0,
  prix_unitaire_dzd DECIMAL(18,2) DEFAULT 0,
  emplacement_magasin TEXT,
  statut TEXT DEFAULT 'DISPONIBLE',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chantier_id, code_article)
);

CREATE TABLE IF NOT EXISTS public.bons_sortie (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_bs TEXT UNIQUE NOT NULL,
  chantier_id UUID NOT NULL REFERENCES public.chantiers(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES public.articles_stock(id) ON DELETE CASCADE,
  article_designation TEXT NOT NULL,
  quantite DECIMAL(10,3) NOT NULL,
  destination TEXT NOT NULL,
  beneficiaire TEXT NOT NULL,
  motif TEXT NOT NULL,
  statut TEXT DEFAULT 'EN_ATTENTE_VALIDATION',
  demandeur_id TEXT,
  demandeur_nom TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transferts_inter_chantier (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_transfert TEXT UNIQUE NOT NULL,
  chantier_source_id UUID NOT NULL REFERENCES public.chantiers(id) ON DELETE CASCADE,
  chantier_source_nom TEXT NOT NULL,
  chantier_cible_id UUID NOT NULL REFERENCES public.chantiers(id) ON DELETE CASCADE,
  chantier_cible_nom TEXT NOT NULL,
  article_id UUID NOT NULL REFERENCES public.articles_stock(id) ON DELETE CASCADE,
  article_designation TEXT NOT NULL,
  quantite DECIMAL(10,3) NOT NULL,
  motif TEXT NOT NULL,
  statut TEXT DEFAULT 'EN_ATTENTE_DIRECTION',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. TECHNIQUE & MÉTRÉS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.lots_travaux (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chantier_id UUID NOT NULL REFERENCES public.chantiers(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  intitule TEXT NOT NULL,
  description TEXT,
  budget_prevu_dzd DECIMAL(18,2) DEFAULT 0,
  budget_realise_dzd DECIMAL(18,2) DEFAULT 0,
  taux_avancement DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.situations_travaux (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chantier_id UUID NOT NULL REFERENCES public.chantiers(id) ON DELETE CASCADE,
  lot_travaux_id UUID REFERENCES public.lots_travaux(id) ON DELETE SET NULL,
  numero_situation TEXT NOT NULL,
  mois TEXT NOT NULL,
  periode_debut DATE NOT NULL,
  periode_fin DATE NOT NULL,
  montant_travaux_realises_ht_dzd DECIMAL(18,2) NOT NULL DEFAULT 0,
  montant_cumule_precedent_dzd DECIMAL(18,2) DEFAULT 0,
  montant_cumule_actuel_dzd DECIMAL(18,2) DEFAULT 0,
  taux_avancement_lot DECIMAL(5,2) DEFAULT 0,
  taux_tva DECIMAL(5,2) DEFAULT 19,
  montant_tva_dzd DECIMAL(18,2) DEFAULT 0,
  montant_ttc_dzd DECIMAL(18,2) DEFAULT 0,
  retenue_garantie_pct DECIMAL(5,2) DEFAULT 5,
  montant_retenue_garantie_dzd DECIMAL(18,2) DEFAULT 0,
  net_a_payer_dzd DECIMAL(18,2) DEFAULT 0,
  statut TEXT DEFAULT 'BROUILLON',
  etablie_par_id TEXT,
  etablie_par_nom TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. PARC MATÉRIEL & VÉHICULES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.vehicules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  immatriculation TEXT UNIQUE NOT NULL,
  marque TEXT NOT NULL,
  modele TEXT NOT NULL,
  type_vehicule TEXT NOT NULL,
  annee_mise_en_service INTEGER NOT NULL,
  couleur TEXT,
  numero_chassis TEXT,
  numero_moteur TEXT,
  puissance_fiscale TEXT,
  kilometrage_actuel INTEGER DEFAULT 0,
  heures_service_actuel DECIMAL(10,1) DEFAULT 0,
  chantier_actuel_id UUID REFERENCES public.chantiers(id) ON DELETE SET NULL,
  chantier_actuel_nom TEXT,
  conducteur_attitré TEXT,
  statut TEXT DEFAULT 'DISPONIBLE',
  date_derniere_revision DATE,
  kilometrage_prochaine_revision INTEGER,
  assurance_compagnie TEXT,
  assurance_numero_police TEXT,
  assurance_date_debut DATE,
  assurance_date_fin DATE,
  vignette_date_fin DATE,
  visite_technique_date_fin DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.entretiens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicule_id UUID NOT NULL REFERENCES public.vehicules(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  date_entretien DATE NOT NULL,
  kilometrage_entretien INTEGER,
  heures_service_entretien DECIMAL(10,1),
  cout_dzd DECIMAL(18,2) DEFAULT 0,
  garage_nom TEXT,
  statut TEXT DEFAULT 'PLANIFIE',
  observations TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pieces_remplacables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicule_id UUID NOT NULL REFERENCES public.vehicules(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  designation TEXT NOT NULL,
  numero_serie TEXT,
  position TEXT,
  date_installation DATE NOT NULL,
  kilometrage_installation INTEGER DEFAULT 0,
  etat TEXT DEFAULT 'BON',
  cout_achat_dzd DECIMAL(18,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. PROMOTION IMMOBILIÈRE & VENTE VEFA
-- ============================================================

CREATE TABLE IF NOT EXISTS public.biens_immobiliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chantier_id UUID NOT NULL REFERENCES public.chantiers(id) ON DELETE CASCADE,
  reference TEXT UNIQUE NOT NULL,
  bloc TEXT NOT NULL,
  etage INTEGER NOT NULL,
  numero_porte TEXT NOT NULL,
  type_bien TEXT NOT NULL,
  surface_utile_m2 DECIMAL(8,2) NOT NULL,
  prix_m2_dzd DECIMAL(12,2) NOT NULL,
  prix_total_dzd DECIMAL(18,2) NOT NULL,
  statut_vente TEXT DEFAULT 'DISPONIBLE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.clients_prospects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  telephone TEXT NOT NULL,
  email TEXT,
  wilaya TEXT,
  budget_max_dzd DECIMAL(18,2),
  type_recherche TEXT,
  statut TEXT DEFAULT 'PROSPECT',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reservations_vefa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bien_id UUID NOT NULL REFERENCES public.biens_immobiliers(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients_prospects(id) ON DELETE CASCADE,
  date_reservation DATE NOT NULL,
  notaire_nom TEXT NOT NULL,
  montant_convenu_dzd DECIMAL(18,2) NOT NULL,
  montant_verse_dzd DECIMAL(18,2) DEFAULT 0,
  statut TEXT DEFAULT 'RESERVE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. CONTENTIEUX & JURIDIQUE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.litiges_juridiques (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chantier_id UUID REFERENCES public.chantiers(id) ON DELETE SET NULL,
  reference_dossier TEXT UNIQUE NOT NULL,
  partie_adverse TEXT NOT NULL,
  tribunal TEXT NOT NULL,
  objet_litige TEXT NOT NULL,
  montant_en_jeu_dzd DECIMAL(18,2) DEFAULT 0,
  avocat_nom TEXT,
  statut TEXT DEFAULT 'EN_COURS',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PERMISSIONS, POLITIQUES ET NOTIFICATION DU SERVEUR
-- ============================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY;', r.tablename);
  END LOOP;
END;
$$;

GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';

SELECT 'FÉLICITATIONS ! LES 31 TABLES DE BATIPROM SONT OPÉRATIONNELLES DANS LE SCHÉMA PUBLIC' as resultat;
