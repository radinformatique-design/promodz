-- ============================================================
-- BatiProm Algérie - Script SQL de création des tables
-- À exécuter dans : https://supabase.com/dashboard/project/yauiolqxwsihgwlzkvhr/editor
-- ============================================================

-- Activer l'extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. TABLE ENTREPRISES
-- ==========================================
CREATE TABLE IF NOT EXISTS entreprises (
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

-- ==========================================
-- 2. TABLE CHANTIERS
-- ==========================================
CREATE TABLE IF NOT EXISTS chantiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
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

-- ==========================================
-- 3. TABLE COMPTES_BANCAIRES
-- ==========================================
CREATE TABLE IF NOT EXISTS comptes_bancaires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
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
  chantier_dedie_id UUID REFERENCES chantiers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. TABLE PARAMETRES_GENERAUX
-- ==========================================
CREATE TABLE IF NOT EXISTS parametres_generaux (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
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

-- ==========================================
-- 5. TABLE EMPLOYES
-- ==========================================
CREATE TABLE IF NOT EXISTS employes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
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
  chantier_actuel_id UUID REFERENCES chantiers(id) ON DELETE SET NULL,
  chantier_actuel_nom TEXT NOT NULL DEFAULT '',
  date_affectation_actuelle DATE NOT NULL DEFAULT CURRENT_DATE,
  statut TEXT DEFAULT 'ACTIF',
  documents_fournis JSONB DEFAULT '{}',
  observations TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 6. TABLE FOURNISSEURS
-- ==========================================
CREATE TABLE IF NOT EXISTS fournisseurs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
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

-- ==========================================
-- 7. TABLE DEMANDES_ACHAT
-- ==========================================
CREATE TABLE IF NOT EXISTS demandes_achat (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_da TEXT UNIQUE NOT NULL,
  chantier_id UUID NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
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

-- ==========================================
-- 8. TABLE BONS_COMMANDE
-- ==========================================
CREATE TABLE IF NOT EXISTS bons_commande (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_bc TEXT UNIQUE NOT NULL,
  demande_achat_id UUID REFERENCES demandes_achat(id) ON DELETE CASCADE,
  chantier_id UUID NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
  fournisseur_id UUID REFERENCES fournisseurs(id) ON DELETE SET NULL,
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

-- ==========================================
-- 9. TABLE ARTICLES_STOCK
-- ==========================================
CREATE TABLE IF NOT EXISTS articles_stock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chantier_id UUID NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
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

-- ==========================================
-- 10. TABLE VEHICULES
-- ==========================================
CREATE TABLE IF NOT EXISTS vehicules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
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
  chantier_actuel_id UUID REFERENCES chantiers(id) ON DELETE SET NULL,
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

-- ==========================================
-- 11. TABLE NOTIFICATIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS notifications (
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
  chantier_id UUID REFERENCES chantiers(id) ON DELETE CASCADE,
  chantier_nom TEXT,
  lu BOOLEAN DEFAULT false,
  date_lecture TIMESTAMPTZ,
  lien_action TEXT,
  historique_actions JSONB DEFAULT '[]',
  entite_type TEXT,
  entite_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 12. TABLE CONGES_ABSENCES
-- ==========================================
CREATE TABLE IF NOT EXISTS conges_absences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employe_id TEXT NOT NULL,
  employe_nom TEXT NOT NULL,
  chantier_id UUID REFERENCES chantiers(id) ON DELETE SET NULL,
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

-- ==========================================
-- 13. TABLE LOTS_TRAVAUX
-- ==========================================
CREATE TABLE IF NOT EXISTS lots_travaux (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chantier_id UUID NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  intitule TEXT NOT NULL,
  description TEXT,
  budget_prevu_dzd DECIMAL(18,2) DEFAULT 0,
  budget_realise_dzd DECIMAL(18,2) DEFAULT 0,
  taux_avancement DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 14. TABLE SITUATIONS_TRAVAUX
-- ==========================================
CREATE TABLE IF NOT EXISTS situations_travaux (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chantier_id UUID NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
  lot_travaux_id UUID REFERENCES lots_travaux(id) ON DELETE SET NULL,
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

-- ==========================================
-- 15. TABLE AUDIT_LOGS
-- ==========================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  utilisateur_id TEXT NOT NULL,
  utilisateur_nom TEXT NOT NULL,
  utilisateur_email TEXT NOT NULL,
  chantier_id UUID REFERENCES chantiers(id) ON DELETE SET NULL,
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

-- ==========================================
-- 16. TABLE BONS_RECEPTION (Livraisons)
-- ==========================================
CREATE TABLE IF NOT EXISTS bons_reception (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_br TEXT UNIQUE NOT NULL,
  bon_commande_id UUID REFERENCES bons_commande(id) ON DELETE SET NULL,
  chantier_id UUID NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
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

-- ==========================================
-- 17. TABLE FACTURES_FOURNISSEURS
-- ==========================================
CREATE TABLE IF NOT EXISTS factures_fournisseurs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_facture TEXT UNIQUE NOT NULL,
  bon_commande_id UUID REFERENCES bons_commande(id) ON DELETE SET NULL,
  bon_reception_ref TEXT NOT NULL,
  fournisseur_id UUID REFERENCES fournisseurs(id) ON DELETE SET NULL,
  fournisseur_nom TEXT NOT NULL,
  chantier_id UUID REFERENCES chantiers(id) ON DELETE SET NULL,
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

-- ==========================================
-- 18. TABLE BONS_SORTIE_STOCK
-- ==========================================
CREATE TABLE IF NOT EXISTS bons_sortie (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_bs TEXT UNIQUE NOT NULL,
  chantier_id UUID NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles_stock(id) ON DELETE CASCADE,
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

-- ==========================================
-- 19. TABLE TRANSFERTS_INTER_CHANTIER
-- ==========================================
CREATE TABLE IF NOT EXISTS transferts_inter_chantier (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_transfert TEXT UNIQUE NOT NULL,
  chantier_source_id UUID NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
  chantier_source_nom TEXT NOT NULL,
  chantier_cible_id UUID NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
  chantier_cible_nom TEXT NOT NULL,
  article_id UUID NOT NULL REFERENCES articles_stock(id) ON DELETE CASCADE,
  article_designation TEXT NOT NULL,
  quantite DECIMAL(10,3) NOT NULL,
  motif TEXT NOT NULL,
  statut TEXT DEFAULT 'EN_ATTENTE_DIRECTION',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 20. TABLE ENTRETIENS_VEHICULES
-- ==========================================
CREATE TABLE IF NOT EXISTS entretiens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicule_id UUID NOT NULL REFERENCES vehicules(id) ON DELETE CASCADE,
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

-- ==========================================
-- TRIGGER: auto-update updated_at
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur toutes les tables avec updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['entreprises', 'chantiers', 'comptes_bancaires', 'employes', 'demandes_achat', 'bons_commande', 'vehicules', 'situations_travaux'] LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trigger_update_%s ON %s;
      CREATE TRIGGER trigger_update_%s
      BEFORE UPDATE ON %s
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    ', t, t, t, t);
  END LOOP;
END;
$$;

-- ==========================================
-- DESACTIVER Row Level Security (pour les API routes serveur)
-- ==========================================
-- Les tables sont accessibles via service_role key côté serveur
ALTER TABLE entreprises DISABLE ROW LEVEL SECURITY;
ALTER TABLE chantiers DISABLE ROW LEVEL SECURITY;
ALTER TABLE comptes_bancaires DISABLE ROW LEVEL SECURITY;
ALTER TABLE parametres_generaux DISABLE ROW LEVEL SECURITY;
ALTER TABLE employes DISABLE ROW LEVEL SECURITY;
ALTER TABLE fournisseurs DISABLE ROW LEVEL SECURITY;
ALTER TABLE demandes_achat DISABLE ROW LEVEL SECURITY;
ALTER TABLE bons_commande DISABLE ROW LEVEL SECURITY;
ALTER TABLE articles_stock DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicules DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE conges_absences DISABLE ROW LEVEL SECURITY;
ALTER TABLE lots_travaux DISABLE ROW LEVEL SECURITY;
ALTER TABLE situations_travaux DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE bons_reception DISABLE ROW LEVEL SECURITY;
ALTER TABLE factures_fournisseurs DISABLE ROW LEVEL SECURITY;
ALTER TABLE bons_sortie DISABLE ROW LEVEL SECURITY;
ALTER TABLE transferts_inter_chantier DISABLE ROW LEVEL SECURITY;
ALTER TABLE entretiens DISABLE ROW LEVEL SECURITY;

SELECT 'Script exécuté avec succès - Tables BatiProm créées!' as resultat;
