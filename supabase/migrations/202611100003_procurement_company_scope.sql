-- Cloisonnement des fournisseurs et politiques RLS des achats.
-- Le schéma de départ doit être vide (ou les fournisseurs existants doivent
-- être rattachés manuellement à une entreprise avant de rendre la colonne NOT NULL).
ALTER TABLE public.fournisseurs
  ADD COLUMN IF NOT EXISTS entreprise_id text;

-- Si des données existent déjà, renseignez leur entreprise_id avant ce NOT NULL.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.fournisseurs WHERE entreprise_id IS NULL) THEN
    RAISE EXCEPTION 'Des fournisseurs ne sont pas rattachés à une entreprise. Renseignez fournisseurs.entreprise_id avant de poursuivre.';
  END IF;
END $$;

ALTER TABLE public.fournisseurs
  ALTER COLUMN entreprise_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fournisseurs_entreprise_id_fkey'
  ) THEN
    ALTER TABLE public.fournisseurs
      ADD CONSTRAINT fournisseurs_entreprise_id_fkey
      FOREIGN KEY (entreprise_id) REFERENCES public.entreprises(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS fournisseurs_entreprise_id_idx
  ON public.fournisseurs(entreprise_id);

ALTER TABLE public.fournisseurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appro_demandes_achat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appro_bons_commande ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appro_receptions_chantiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appro_factures_fournisseurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comptabilite_budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fournisseurs_company_scope ON public.fournisseurs;
CREATE POLICY fournisseurs_company_scope ON public.fournisseurs
  FOR ALL TO authenticated
  USING (entreprise_id = public.current_company_id())
  WITH CHECK (entreprise_id = public.current_company_id());

DROP POLICY IF EXISTS demandes_achat_chantier_scope ON public.appro_demandes_achat;
CREATE POLICY demandes_achat_chantier_scope ON public.appro_demandes_achat
  FOR ALL TO authenticated
  USING (public.can_access_chantier(chantier_id))
  WITH CHECK (public.can_access_chantier(chantier_id));

DROP POLICY IF EXISTS bons_commande_chantier_scope ON public.appro_bons_commande;
CREATE POLICY bons_commande_chantier_scope ON public.appro_bons_commande
  FOR ALL TO authenticated
  USING (public.can_access_chantier(chantier_id))
  WITH CHECK (public.can_access_chantier(chantier_id));

DROP POLICY IF EXISTS receptions_chantier_scope ON public.appro_receptions_chantiers;
CREATE POLICY receptions_chantier_scope ON public.appro_receptions_chantiers
  FOR ALL TO authenticated
  USING (public.can_access_chantier(chantier_id))
  WITH CHECK (public.can_access_chantier(chantier_id));

DROP POLICY IF EXISTS factures_company_scope ON public.appro_factures_fournisseurs;
CREATE POLICY factures_company_scope ON public.appro_factures_fournisseurs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.fournisseurs f
      WHERE f.id = fournisseur_id
        AND f.entreprise_id = public.current_company_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.fournisseurs f
      WHERE f.id = fournisseur_id
        AND f.entreprise_id = public.current_company_id()
    )
  );

DROP POLICY IF EXISTS budgets_chantier_scope ON public.comptabilite_budgets;
CREATE POLICY budgets_chantier_scope ON public.comptabilite_budgets
  FOR ALL TO authenticated
  USING (public.can_access_chantier(chantier_id))
  WITH CHECK (public.can_access_chantier(chantier_id));
