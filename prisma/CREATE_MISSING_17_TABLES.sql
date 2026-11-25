-- ==============================================================================
-- BatiProm Algérie - TABLES COMPLÉMENTAIRES (16 TABLES RESTANTES)
-- À exécuter dans Supabase SQL Editor pour que TOUTES les 31+ tables existent
-- ==============================================================================

-- 1. DEMANDES DE DÉROGATION DE POINTAGE
CREATE TABLE IF NOT EXISTS public.demandes_derogation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pointage_id TEXT,
    chantier_id UUID REFERENCES public.chantiers(id) ON DELETE CASCADE,
    chantier_nom TEXT,
    date_pointage DATE NOT NULL,
    employe_id UUID REFERENCES public.employes(id) ON DELETE CASCADE,
    employe_nom TEXT,
    employe_matricule TEXT,
    demandeur_id TEXT,
    demandeur_nom TEXT,
    demandeur_role TEXT,
    statut_actuel TEXT,
    statut_demande TEXT,
    heure_arrivee_demandee TEXT,
    motif_demande TEXT,
    statut_demande_approbation TEXT DEFAULT 'EN_ATTENTE',
    traite_par_id TEXT,
    traite_par_nom TEXT,
    date_traitement TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. COMPARAISONS D'OFFRES FOURNISSEURS
CREATE TABLE IF NOT EXISTS public.comparaisons_offres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    demande_achat_id UUID REFERENCES public.demandes_achat(id) ON DELETE CASCADE,
    fournisseur_id UUID REFERENCES public.fournisseurs(id) ON DELETE CASCADE,
    fournisseur_nom TEXT,
    prix_unitaire_ht_dzd NUMERIC(15,2) NOT NULL,
    tva_pct NUMERIC(5,2) DEFAULT 19,
    delai_livraison_jours INTEGER,
    frais_transport_dzd NUMERIC(15,2) DEFAULT 0,
    modalite_paiement TEXT,
    retenu BOOLEAN DEFAULT false,
    observations TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. MOUVEMENTS DE STOCK
CREATE TABLE IF NOT EXISTS public.mouvements_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chantier_id UUID REFERENCES public.chantiers(id) ON DELETE CASCADE,
    chantier_nom TEXT,
    article_id UUID REFERENCES public.articles_stock(id) ON DELETE CASCADE,
    article_designation TEXT,
    type_mouvement TEXT NOT NULL,
    quantite NUMERIC(15,2) NOT NULL,
    unite_mesure TEXT,
    reference_piece TEXT,
    beneficiaire_ou_provenance TEXT,
    date_mouvement DATE NOT NULL,
    auteur_id TEXT,
    auteur_nom TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. INVENTAIRES MAGASIN
CREATE TABLE IF NOT EXISTS public.inventaires_magasin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_inventaire TEXT UNIQUE NOT NULL,
    chantier_id UUID REFERENCES public.chantiers(id) ON DELETE CASCADE,
    chantier_nom TEXT,
    date_inventaire DATE NOT NULL,
    magasinier_id TEXT,
    magasinier_nom TEXT,
    lignes JSONB DEFAULT '[]',
    statut TEXT DEFAULT 'VALIDE_ET_CLOTURE',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. STRUCTURE DU CHANTIER (Bâtiments, Blocs, Étages, Ouvrages)
CREATE TABLE IF NOT EXISTS public.structure_chantier (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chantier_id UUID REFERENCES public.chantiers(id) ON DELETE CASCADE,
    parent_id TEXT,
    type TEXT NOT NULL,
    libelle TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. POSTES DE TRAVAUX (Bordereau / Métrés)
CREATE TABLE IF NOT EXISTS public.postes_travaux (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id TEXT,
    unite_id TEXT,
    unite_symbole TEXT,
    code_article TEXT,
    designation TEXT NOT NULL,
    quantite_prevue NUMERIC(15,2) NOT NULL,
    prix_unitaire_ref NUMERIC(15,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. MÉTRÉS ET VÉRIFICATIONS CONTRADICTOIRES
CREATE TABLE IF NOT EXISTS public.metres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poste_id TEXT,
    structure_id TEXT,
    quantite_executee NUMERIC(15,2) NOT NULL,
    date_mesure DATE NOT NULL,
    saisi_par_id TEXT,
    saisi_par_nom TEXT,
    statut TEXT DEFAULT 'TRANSMIS',
    localisation_detaillee TEXT,
    details_calcul TEXT,
    commentaire TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. RAPPORTS DE CHANTIER (Journalier, Hebdo, etc.)
CREATE TABLE IF NOT EXISTS public.rapports_chantier (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chantier_id UUID REFERENCES public.chantiers(id) ON DELETE CASCADE,
    date_rapport DATE NOT NULL,
    type TEXT DEFAULT 'JOURNALIER',
    effectif_total INTEGER DEFAULT 0,
    meteo TEXT,
    heures_intemperies NUMERIC(5,2) DEFAULT 0,
    materiel_sur_site TEXT,
    incidents_securite TEXT,
    corps_etat_presents JSONB DEFAULT '[]',
    activites_realisees TEXT,
    difficultes_ou_bloquants TEXT,
    visa_conducteur TEXT,
    visa_securite TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. CONTRÔLES TECHNIQUES CTC
CREATE TABLE IF NOT EXISTS public.controles_ctc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chantier_id UUID REFERENCES public.chantiers(id) ON DELETE CASCADE,
    reference_rapport_ctc TEXT NOT NULL,
    date_visite DATE NOT NULL,
    organisme_controle TEXT DEFAULT 'CTC',
    ingenieur_controleur TEXT,
    element_verifie TEXT NOT NULL,
    avis TEXT NOT NULL, -- FAVORABLE, RESERVES, SUSPENSIF
    details_reserves TEXT,
    statut_levee TEXT DEFAULT 'EN_COURS',
    date_levee DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. PLANS BUREAU D'ÉTUDES TECHNIQUES (BET)
CREATE TABLE IF NOT EXISTS public.plans_bet (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chantier_id UUID REFERENCES public.chantiers(id) ON DELETE CASCADE,
    code_plan TEXT NOT NULL,
    titre_plan TEXT NOT NULL,
    specialite TEXT NOT NULL, -- ARCHI, GENIE_CIVIL, FLUIDES, ELECTRICITE
    bet_emetteur TEXT,
    indice_revision TEXT DEFAULT 'A',
    date_diffusion DATE NOT NULL,
    statut_approbation TEXT DEFAULT 'BON_POUR_EXECUTION',
    approbateur TEXT,
    url_fichier TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. FACTURES CLIENTS (Ventes VEFA & Professionnels)
CREATE TABLE IF NOT EXISTS public.factures_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_facture TEXT UNIQUE NOT NULL,
    client_nom TEXT NOT NULL,
    client_nif TEXT,
    chantier_id UUID REFERENCES public.chantiers(id) ON DELETE CASCADE,
    chantier_nom TEXT,
    lot_vendu_id TEXT,
    date_facture DATE NOT NULL,
    date_echeance DATE,
    montant_ht_dzd NUMERIC(15,2) NOT NULL,
    montant_tva_dzd NUMERIC(15,2) DEFAULT 0,
    montant_ttc_dzd NUMERIC(15,2) NOT NULL,
    statut_paiement TEXT DEFAULT 'NON_PAYEE',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. TRANSACTIONS FINANCIÈRES (Dépenses / Recettes Trésorerie)
CREATE TABLE IF NOT EXISTS public.transactions_financieres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    type TEXT NOT NULL, -- DEPENSE, RECETTE, TRANSFERT
    categorie TEXT NOT NULL,
    libelle TEXT NOT NULL,
    montant_dzd NUMERIC(15,2) NOT NULL,
    chantier_id UUID REFERENCES public.chantiers(id) ON DELETE SET NULL,
    chantier_nom TEXT,
    compte_bancaire_id UUID REFERENCES public.comptes_bancaires(id) ON DELETE SET NULL,
    mode_paiement TEXT,
    reference_paiement TEXT,
    cree_par_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. DÉCLARATIONS FISCALES (G50, etc.)
CREATE TABLE IF NOT EXISTS public.declarations_fiscales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT DEFAULT 'G50',
    periode_mois INTEGER NOT NULL,
    periode_annee INTEGER NOT NULL,
    date_declaration DATE NOT NULL,
    montant_total_dzd NUMERIC(15,2) NOT NULL,
    details_impots JSONB DEFAULT '{}',
    statut TEXT DEFAULT 'BROUILLON',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. CLÔTURES COMPTABLES MENSUELLES
CREATE TABLE IF NOT EXISTS public.clotures_comptables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    periode_cle TEXT UNIQUE NOT NULL,
    annee INTEGER NOT NULL,
    mois INTEGER NOT NULL,
    statut TEXT DEFAULT 'CLOTUREE',
    date_cloture TIMESTAMPTZ,
    cloture_par_id TEXT,
    cloture_par_nom TEXT,
    total_debit_dzd NUMERIC(15,2) DEFAULT 0,
    total_credit_dzd NUMERIC(15,2) DEFAULT 0,
    nombre_ecritures INTEGER DEFAULT 0,
    observations TEXT,
    ecritures JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 15. CONTRATS JURIDIQUES
CREATE TABLE IF NOT EXISTS public.contrats_juridiques (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_contrat TEXT UNIQUE NOT NULL,
    titre TEXT NOT NULL,
    type TEXT NOT NULL, -- FOURNISSEUR, SOUS_TRAITANCE, CLIENT_VEFA
    partie_prenante_nom TEXT NOT NULL,
    chantier_id UUID REFERENCES public.chantiers(id) ON DELETE SET NULL,
    chantier_nom TEXT,
    date_signature DATE,
    date_effet DATE,
    date_echeance DATE,
    montant_dzd NUMERIC(15,2) DEFAULT 0,
    statut TEXT DEFAULT 'EN_VIGUEUR',
    reconduction_automatique BOOLEAN DEFAULT false,
    delai_preavis_jours INTEGER DEFAULT 30,
    responsable_juridique_nom TEXT,
    notes TEXT,
    historique_modifications JSONB DEFAULT '[]',
    pieces_jointes JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 16. DOCUMENTS FONCIERS & ADMINISTRATIFS
CREATE TABLE IF NOT EXISTS public.documents_fonciers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    titre TEXT NOT NULL,
    reference_officielle TEXT,
    wilaya TEXT,
    commune TEXT,
    chantier_id UUID REFERENCES public.chantiers(id) ON DELETE SET NULL,
    chantier_nom TEXT,
    notaire_nom TEXT,
    date_delivrance DATE,
    date_validite DATE,
    statut TEXT DEFAULT 'VALIDE',
    notes TEXT,
    pieces_jointes JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 17. DOSSIERS CONTENTIEUX & LITIGES
CREATE TABLE IF NOT EXISTS public.dossiers_litiges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_dossier TEXT UNIQUE NOT NULL,
    titre_affaire TEXT NOT NULL,
    juridiction TEXT,
    partie_adverse TEXT,
    qualite TEXT, -- DEMANDEUR, DEFENDEUR
    enjeu_financier_dzd NUMERIC(15,2) DEFAULT 0,
    avocat_conseil_nom TEXT,
    statut TEXT DEFAULT 'EN_COURS',
    date_ouverture DATE,
    prochaine_audience_date DATE,
    resume_faits TEXT,
    historique_audiences JSONB DEFAULT '[]',
    pieces_jointes JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Rendre la table demandes_achat compatible avec historique_validations si pas encore présente
ALTER TABLE public.demandes_achat ADD COLUMN IF NOT EXISTS historique_validations JSONB DEFAULT '[]';

-- Désactiver RLS sur ces tables pour accès direct backend
ALTER TABLE public.demandes_derogation DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.comparaisons_offres DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.mouvements_stock DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventaires_magasin DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.structure_chantier DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.postes_travaux DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.metres DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.rapports_chantier DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.controles_ctc DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans_bet DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.factures_clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions_financieres DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.declarations_fiscales DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clotures_comptables DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrats_juridiques DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents_fonciers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.dossiers_litiges DISABLE ROW LEVEL SECURITY;

-- Permissions complètes
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Rechargement du cache de schéma PostgREST
NOTIFY pgrst, 'reload schema';
