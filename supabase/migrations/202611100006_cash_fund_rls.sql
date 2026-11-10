-- 006: Politiques RLS de la caisse de fonds de roulement par chantier.
-- Les API Prisma conservent leurs contrôles applicatifs : Prisma direct n'hérite pas
-- automatiquement du JWT Supabase de l'utilisateur connecté.

CREATE OR REPLACE FUNCTION public.is_company_accountant()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.utilisateurs u
    JOIN public.roles r ON r.id = u.role_id
    WHERE u.auth_user_id = auth.uid()::text
      AND u.statut = 'ACTIF'
      AND u.entreprise_id = public.current_company_id()
      AND r.code IN ('ADMINISTRATEUR', 'RESPONSABLE_COMPTABILITE')
  );
$$;

ALTER TABLE public.comptabilite_caisses_chantier ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comptabilite_mouvements_caisse ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comptabilite_demandes_caisse ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS caisse_select_scope ON public.comptabilite_caisses_chantier;
CREATE POLICY caisse_select_scope ON public.comptabilite_caisses_chantier
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chantiers c
      WHERE c.id = comptabilite_caisses_chantier.chantier_id
        AND c.entreprise_id = public.current_company_id()
        AND public.can_access_chantier(c.id)
    )
  );

DROP POLICY IF EXISTS caisse_manage_central ON public.comptabilite_caisses_chantier;
CREATE POLICY caisse_manage_central ON public.comptabilite_caisses_chantier
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chantiers c
      WHERE c.id = comptabilite_caisses_chantier.chantier_id
        AND c.entreprise_id = public.current_company_id()
        AND public.is_company_accountant()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chantiers c
      WHERE c.id = comptabilite_caisses_chantier.chantier_id
        AND c.entreprise_id = public.current_company_id()
        AND public.is_company_accountant()
    )
  );

DROP POLICY IF EXISTS mouvements_caisse_select_scope ON public.comptabilite_mouvements_caisse;
CREATE POLICY mouvements_caisse_select_scope ON public.comptabilite_mouvements_caisse
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.comptabilite_caisses_chantier cc
      JOIN public.chantiers c ON c.id = cc.chantier_id
      WHERE cc.id = comptabilite_mouvements_caisse.caisse_id
        AND c.entreprise_id = public.current_company_id()
        AND public.can_access_chantier(c.id)
    )
  );

DROP POLICY IF EXISTS mouvements_caisse_insert_scope ON public.comptabilite_mouvements_caisse;
CREATE POLICY mouvements_caisse_insert_scope ON public.comptabilite_mouvements_caisse
  FOR INSERT TO authenticated
  WITH CHECK (
    auteur_id = public.current_app_user_id()
    AND EXISTS (
      SELECT 1
      FROM public.comptabilite_caisses_chantier cc
      JOIN public.chantiers c ON c.id = cc.chantier_id
      WHERE cc.id = comptabilite_mouvements_caisse.caisse_id
        AND c.entreprise_id = public.current_company_id()
        AND public.can_access_chantier(c.id)
        AND (
          comptabilite_mouvements_caisse.type = 'SORTIE'
          OR (
            comptabilite_mouvements_caisse.type = 'APPROVISIONNEMENT'
            AND public.is_company_accountant()
          )
        )
    )
  );

DROP POLICY IF EXISTS demandes_caisse_select_scope ON public.comptabilite_demandes_caisse;
CREATE POLICY demandes_caisse_select_scope ON public.comptabilite_demandes_caisse
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.comptabilite_caisses_chantier cc
      JOIN public.chantiers c ON c.id = cc.chantier_id
      WHERE cc.id = comptabilite_demandes_caisse.caisse_id
        AND c.entreprise_id = public.current_company_id()
        AND public.can_access_chantier(c.id)
    )
  );

DROP POLICY IF EXISTS demandes_caisse_insert_scope ON public.comptabilite_demandes_caisse;
CREATE POLICY demandes_caisse_insert_scope ON public.comptabilite_demandes_caisse
  FOR INSERT TO authenticated
  WITH CHECK (
    demandeur_id = public.current_app_user_id()
    AND statut = 'EN_ATTENTE'
    AND EXISTS (
      SELECT 1
      FROM public.comptabilite_caisses_chantier cc
      JOIN public.chantiers c ON c.id = cc.chantier_id
      WHERE cc.id = comptabilite_demandes_caisse.caisse_id
        AND c.entreprise_id = public.current_company_id()
        AND public.can_access_chantier(c.id)
    )
  );

DROP POLICY IF EXISTS demandes_caisse_update_central ON public.comptabilite_demandes_caisse;
CREATE POLICY demandes_caisse_update_central ON public.comptabilite_demandes_caisse
  FOR UPDATE TO authenticated
  USING (
    statut = 'EN_ATTENTE'
    AND public.is_company_accountant()
    AND EXISTS (
      SELECT 1
      FROM public.comptabilite_caisses_chantier cc
      JOIN public.chantiers c ON c.id = cc.chantier_id
      WHERE cc.id = comptabilite_demandes_caisse.caisse_id
        AND c.entreprise_id = public.current_company_id()
    )
  )
  WITH CHECK (
    public.is_company_accountant()
    AND traiteur_id = public.current_app_user_id()
  );
