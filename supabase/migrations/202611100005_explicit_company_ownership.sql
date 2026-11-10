-- Ajout de clés entreprise explicites aux tables qui peuvent exister sans chantier.
-- La base cible doit être vide pour ces nouveaux champs obligatoires, sinon renseigner
-- manuellement entreprise_id avant de poser NOT NULL.

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'materiel_engins',
    'documents_ged',
    'audit_logs',
    'juridique_dossiers',
    'commercial_clients'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS entreprise_id text', table_name);
    EXECUTE format(
      'DO $inner$ BEGIN IF EXISTS (SELECT 1 FROM public.%I WHERE entreprise_id IS NULL) THEN RAISE EXCEPTION ''La table %I contient des lignes sans entreprise_id. Renseignez-les avant la migration.''; END IF; END $inner$',
      table_name, table_name
    );
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN entreprise_id SET NOT NULL', table_name);
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = table_name || '_entreprise_id_fkey'
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (entreprise_id) REFERENCES public.entreprises(id) ON DELETE CASCADE',
        table_name, table_name || '_entreprise_id_fkey'
      );
    END IF;
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (entreprise_id)', table_name || '_entreprise_id_idx', table_name);
  END LOOP;
END $$;

-- RLS multi-entreprise explicite pour les lignes non rattachées à un chantier.
ALTER TABLE public.materiel_engins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS materiel_engins_select_scope ON public.materiel_engins;
DROP POLICY IF EXISTS materiel_engins_insert_central ON public.materiel_engins;
DROP POLICY IF EXISTS materiel_engins_update_central ON public.materiel_engins;
CREATE POLICY materiel_engins_select_scope ON public.materiel_engins
  FOR SELECT TO authenticated
  USING (
    entreprise_id = public.current_company_id()
    AND (
      (chantier_actuel_id IS NOT NULL AND public.can_access_chantier(chantier_actuel_id))
      OR (chantier_actuel_id IS NULL AND public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_MATERIEL']))
    )
  );
CREATE POLICY materiel_engins_insert_central ON public.materiel_engins
  FOR INSERT TO authenticated
  WITH CHECK (
    entreprise_id = public.current_company_id()
    AND public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_MATERIEL'])
    AND (chantier_actuel_id IS NULL OR public.can_access_chantier(chantier_actuel_id))
  );
CREATE POLICY materiel_engins_update_central ON public.materiel_engins
  FOR UPDATE TO authenticated
  USING (
    entreprise_id = public.current_company_id()
    AND public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_MATERIEL'])
  )
  WITH CHECK (
    entreprise_id = public.current_company_id()
    AND public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_MATERIEL'])
    AND (chantier_actuel_id IS NULL OR public.can_access_chantier(chantier_actuel_id))
  );

ALTER TABLE public.documents_ged ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS documents_ged_select_scope ON public.documents_ged;
DROP POLICY IF EXISTS documents_ged_insert_scope ON public.documents_ged;
DROP POLICY IF EXISTS documents_ged_update_author ON public.documents_ged;
CREATE POLICY documents_ged_select_scope ON public.documents_ged
  FOR SELECT TO authenticated
  USING (
    entreprise_id = public.current_company_id()
    AND (
      (chantier_id IS NOT NULL AND public.can_access_chantier(chantier_id))
      OR (chantier_id IS NULL AND auteur_id = public.current_app_user_id())
    )
  );
CREATE POLICY documents_ged_insert_scope ON public.documents_ged
  FOR INSERT TO authenticated
  WITH CHECK (
    entreprise_id = public.current_company_id()
    AND auteur_id = public.current_app_user_id()
    AND (chantier_id IS NULL OR public.can_access_chantier(chantier_id))
  );
CREATE POLICY documents_ged_update_author ON public.documents_ged
  FOR UPDATE TO authenticated
  USING (
    entreprise_id = public.current_company_id()
    AND (
      auteur_id = public.current_app_user_id()
      OR (public.is_company_admin() AND chantier_id IS NOT NULL AND public.can_access_chantier(chantier_id))
    )
  )
  WITH CHECK (
    entreprise_id = public.current_company_id()
    AND (
      auteur_id = public.current_app_user_id()
      OR (public.is_company_admin() AND chantier_id IS NOT NULL AND public.can_access_chantier(chantier_id))
    )
  );

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_logs_select_admin ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_insert_self ON public.audit_logs;
CREATE POLICY audit_logs_select_admin ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    entreprise_id = public.current_company_id()
    AND public.is_company_admin()
    AND (chantier_id IS NULL OR public.can_access_chantier(chantier_id))
  );
CREATE POLICY audit_logs_insert_self ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    entreprise_id = public.current_company_id()
    AND utilisateur_id = public.current_app_user_id()
    AND (chantier_id IS NULL AND public.is_company_admin()
      OR chantier_id IS NOT NULL AND public.can_access_chantier(chantier_id))
  );

ALTER TABLE public.juridique_dossiers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS juridique_dossiers_select_scope ON public.juridique_dossiers;
DROP POLICY IF EXISTS juridique_dossiers_write_central ON public.juridique_dossiers;
CREATE POLICY juridique_dossiers_select_scope ON public.juridique_dossiers
  FOR SELECT TO authenticated
  USING (
    entreprise_id = public.current_company_id()
    AND public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_JURIDIQUE'])
    AND (chantier_id IS NULL OR public.can_access_chantier(chantier_id))
  );
CREATE POLICY juridique_dossiers_write_central ON public.juridique_dossiers
  FOR ALL TO authenticated
  USING (
    entreprise_id = public.current_company_id()
    AND public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_JURIDIQUE'])
    AND (chantier_id IS NULL OR public.can_access_chantier(chantier_id))
  )
  WITH CHECK (
    entreprise_id = public.current_company_id()
    AND public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_JURIDIQUE'])
    AND (chantier_id IS NULL OR public.can_access_chantier(chantier_id))
  );

ALTER TABLE public.commercial_clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS commercial_clients_select_central ON public.commercial_clients;
DROP POLICY IF EXISTS commercial_clients_write_central ON public.commercial_clients;
CREATE POLICY commercial_clients_select_central ON public.commercial_clients
  FOR SELECT TO authenticated
  USING (
    entreprise_id = public.current_company_id()
    AND public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_COMMERCIAL'])
  );
CREATE POLICY commercial_clients_write_central ON public.commercial_clients
  FOR ALL TO authenticated
  USING (
    entreprise_id = public.current_company_id()
    AND public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_COMMERCIAL'])
  )
  WITH CHECK (
    entreprise_id = public.current_company_id()
    AND public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_COMMERCIAL'])
  );

-- Les tables enfants du parc doivent hériter de la société du matériel parent.
DROP POLICY IF EXISTS materiel_entretiens_select_parent ON public.materiel_entretiens;
DROP POLICY IF EXISTS materiel_entretiens_write_central ON public.materiel_entretiens;
CREATE POLICY materiel_entretiens_select_parent ON public.materiel_entretiens
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.materiel_engins m
    WHERE m.id = materiel_id AND m.entreprise_id = public.current_company_id()));
CREATE POLICY materiel_entretiens_write_central ON public.materiel_entretiens
  FOR ALL TO authenticated
  USING (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_MATERIEL'])
    AND EXISTS (SELECT 1 FROM public.materiel_engins m
      WHERE m.id = materiel_id AND m.entreprise_id = public.current_company_id())
  )
  WITH CHECK (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_MATERIEL'])
    AND EXISTS (SELECT 1 FROM public.materiel_engins m
      WHERE m.id = materiel_id AND m.entreprise_id = public.current_company_id())
  );

DROP POLICY IF EXISTS materiel_pieces_select_parent ON public.materiel_pieces_remplacables;
DROP POLICY IF EXISTS materiel_pieces_write_central ON public.materiel_pieces_remplacables;
CREATE POLICY materiel_pieces_select_parent ON public.materiel_pieces_remplacables
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.materiel_engins m
    WHERE m.id = materiel_id AND m.entreprise_id = public.current_company_id()));
CREATE POLICY materiel_pieces_write_central ON public.materiel_pieces_remplacables
  FOR ALL TO authenticated
  USING (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_MATERIEL'])
    AND EXISTS (SELECT 1 FROM public.materiel_engins m
      WHERE m.id = materiel_id AND m.entreprise_id = public.current_company_id())
  )
  WITH CHECK (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_MATERIEL'])
    AND EXISTS (SELECT 1 FROM public.materiel_engins m
      WHERE m.id = materiel_id AND m.entreprise_id = public.current_company_id())
  );
