-- 1. TABLE EMPLOYES
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
-- 2. TABLE DEMANDES_ACHAT
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
-- 3. TABLE BONS_COMMANDE
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
-- 4. TABLE ARTICLES_STOCK
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
-- 5. TABLE VEHICULES
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
-- 6. TABLE CONGES_ABSENCES
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
-- 7. TABLE LOTS_TRAVAUX
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
-- 8. TABLE SITUATIONS_TRAVAUX
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
-- 9. TABLE BONS_RECEPTION
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
-- 10. TABLE FACTURES_FOURNISSEURS
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
-- 11. TABLE BONS_SORTIE
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
-- 12. TABLE TRANSFERTS_INTER_CHANTIER
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
-- 13. TABLE ENTRETIENS
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
-- 14. DÉSACTIVER RLS
ALTER TABLE IF EXISTS employes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS demandes_achat DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bons_commande DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS articles_stock DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vehicules DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS conges_absences DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lots_travaux DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS situations_travaux DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bons_reception DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS factures_fournisseurs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bons_sortie DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transferts_inter_chantier DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS entretiens DISABLE ROW LEVEL SECURITY;
SELECT 'Toutes les tables BatiProm sont créées avec succès !' as resultat;