-- BatiProm: association Supabase Auth / profil métier et premières politiques RLS.
-- À exécuter après la création du schéma Prisma (npx prisma db push).
-- Les rôles et permissions sont des référentiels communs; les données métier
-- restent isolées par entreprise et, pour les comptes chantier, par affectation.

ALTER TABLE public.utilisateurs
  ADD COLUMN IF NOT EXISTS auth_user_id text;

CREATE UNIQUE INDEX IF NOT EXISTS utilisateurs_auth_user_id_key
  ON public.utilisateurs(auth_user_id)
  WHERE auth_user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id
  FROM public.utilisateurs u
  WHERE u.auth_user_id = auth.uid()::text
    AND u.statut = 'ACTIF'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.entreprise_id
  FROM public.utilisateurs u
  WHERE u.auth_user_id = auth.uid()::text
    AND u.statut = 'ACTIF'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_app_user_type()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.type
  FROM public.utilisateurs u
  WHERE u.auth_user_id = auth.uid()::text
    AND u.statut = 'ACTIF'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_company_admin()
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
      AND r.code = 'ADMINISTRATEUR'
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_chantier(target_chantier_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chantiers c
    JOIN public.utilisateurs u
      ON u.entreprise_id = c.entreprise_id
    WHERE c.id = target_chantier_id
      AND u.auth_user_id = auth.uid()::text
      AND u.statut = 'ACTIF'
      AND (
        (u.type = 'CENTRAL' AND public.is_company_admin())
        OR EXISTS (
          SELECT 1
          FROM public.utilisateur_chantiers uc
          WHERE uc.utilisateur_id = u.id
            AND uc.chantier_id = c.id
            AND uc.est_actif = true
            AND (uc.date_fin IS NULL OR uc.date_fin >= CURRENT_DATE)
        )
      )
  );
$$;

ALTER TABLE public.entreprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utilisateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chantiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utilisateur_chantiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS entreprises_select_own ON public.entreprises;
CREATE POLICY entreprises_select_own ON public.entreprises
  FOR SELECT TO authenticated
  USING (id = public.current_company_id());

DROP POLICY IF EXISTS utilisateurs_select_company ON public.utilisateurs;
CREATE POLICY utilisateurs_select_company ON public.utilisateurs
  FOR SELECT TO authenticated
  USING (
    entreprise_id = public.current_company_id()
    AND (
      auth_user_id = auth.uid()::text
      OR public.is_company_admin()
      OR (
        type = 'CHANTIER'
        AND EXISTS (
          SELECT 1 FROM public.utilisateur_chantiers mine
          JOIN public.utilisateur_chantiers theirs
            ON theirs.chantier_id = mine.chantier_id
          WHERE mine.utilisateur_id = public.current_app_user_id()
            AND mine.est_actif = true
            AND theirs.utilisateur_id = utilisateurs.id
            AND theirs.est_actif = true
        )
      )
    )
  );

DROP POLICY IF EXISTS utilisateurs_insert_admin ON public.utilisateurs;
CREATE POLICY utilisateurs_insert_admin ON public.utilisateurs
  FOR INSERT TO authenticated
  WITH CHECK (entreprise_id = public.current_company_id() AND public.is_company_admin());

DROP POLICY IF EXISTS utilisateurs_update_admin ON public.utilisateurs;
CREATE POLICY utilisateurs_update_admin ON public.utilisateurs
  FOR UPDATE TO authenticated
  USING (entreprise_id = public.current_company_id() AND public.is_company_admin())
  WITH CHECK (entreprise_id = public.current_company_id() AND public.is_company_admin());

DROP POLICY IF EXISTS chantiers_select_scope ON public.chantiers;
CREATE POLICY chantiers_select_scope ON public.chantiers
  FOR SELECT TO authenticated
  USING (entreprise_id = public.current_company_id() AND public.can_access_chantier(id));

DROP POLICY IF EXISTS chantiers_write_admin ON public.chantiers;
CREATE POLICY chantiers_write_admin ON public.chantiers
  FOR ALL TO authenticated
  USING (entreprise_id = public.current_company_id() AND public.is_company_admin())
  WITH CHECK (entreprise_id = public.current_company_id() AND public.is_company_admin());

DROP POLICY IF EXISTS utilisateur_chantiers_select_scope ON public.utilisateur_chantiers;
CREATE POLICY utilisateur_chantiers_select_scope ON public.utilisateur_chantiers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chantiers c
      WHERE c.id = utilisateur_chantiers.chantier_id
        AND c.entreprise_id = public.current_company_id()
    )
    AND (
      public.is_company_admin()
      OR utilisateur_id = public.current_app_user_id()
      OR public.can_access_chantier(chantier_id)
    )
  );

DROP POLICY IF EXISTS utilisateur_chantiers_write_admin ON public.utilisateur_chantiers;
CREATE POLICY utilisateur_chantiers_write_admin ON public.utilisateur_chantiers
  FOR ALL TO authenticated
  USING (public.is_company_admin())
  WITH CHECK (public.is_company_admin());

-- Les rôles et permissions sont des référentiels sans donnée personnelle.
DROP POLICY IF EXISTS roles_authenticated_read ON public.roles;
CREATE POLICY roles_authenticated_read ON public.roles
  FOR SELECT TO authenticated USING (public.current_app_user_id() IS NOT NULL);

DROP POLICY IF EXISTS permissions_authenticated_read ON public.permissions;
CREATE POLICY permissions_authenticated_read ON public.permissions
  FOR SELECT TO authenticated USING (public.current_app_user_id() IS NOT NULL);

DROP POLICY IF EXISTS role_permissions_authenticated_read ON public.role_permissions;
CREATE POLICY role_permissions_authenticated_read ON public.role_permissions
  FOR SELECT TO authenticated USING (public.current_app_user_id() IS NOT NULL);

-- Les écritures RBAC sont réservées à l'administrateur de l'entreprise.
DROP POLICY IF EXISTS role_permissions_admin_write ON public.role_permissions;
CREATE POLICY role_permissions_admin_write ON public.role_permissions
  FOR ALL TO authenticated
  USING (public.is_company_admin())
  WITH CHECK (public.is_company_admin());
