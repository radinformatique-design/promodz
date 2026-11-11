-- 008: invariants multi-entreprises, RBAC tenant-aware et affectations chantier.
-- À exécuter après 001 à 007. Compatible avec une base Supabase neuve.
-- Les écritures applicatives passent par les Route Handlers Prisma ; les déclencheurs
-- ci-dessous protègent aussi l'intégrité lorsque Prisma contourne les politiques RLS.

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
    WHERE u.id = public.current_app_user_id()
      AND u.entreprise_id = public.current_company_id()
      AND u.statut = 'ACTIF'
      AND r.code = 'ADMINISTRATEUR'
      AND r.entreprise_id = u.entreprise_id
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_has_any_role(role_codes text[])
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
    WHERE u.id = public.current_app_user_id()
      AND u.entreprise_id = public.current_company_id()
      AND u.statut = 'ACTIF'
      AND r.code = ANY(role_codes)
      AND (r.entreprise_id IS NULL OR r.entreprise_id = u.entreprise_id)
  );
$$;

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
    WHERE u.id = public.current_app_user_id()
      AND u.entreprise_id = public.current_company_id()
      AND u.statut = 'ACTIF'
      AND r.code IN ('ADMINISTRATEUR', 'RESPONSABLE_COMPTABILITE')
      AND (r.entreprise_id IS NULL OR r.entreprise_id = u.entreprise_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.has_app_permission(target_module text, target_action text)
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
    JOIN public.role_permissions rp ON rp.role_id = r.id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE u.id = public.current_app_user_id()
      AND u.entreprise_id = public.current_company_id()
      AND u.statut = 'ACTIF'
      AND (r.entreprise_id IS NULL OR r.entreprise_id = u.entreprise_id)
      AND p.module = target_module
      AND p.action = target_action
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
    JOIN public.utilisateurs u ON u.entreprise_id = c.entreprise_id
    JOIN public.roles r ON r.id = u.role_id
    WHERE c.id = target_chantier_id
      AND u.id = public.current_app_user_id()
      AND u.statut = 'ACTIF'
      AND (r.entreprise_id IS NULL OR r.entreprise_id = u.entreprise_id)
      AND (
        u.type = 'CENTRAL'
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

-- Un profil ne peut utiliser qu'un rôle global non-administrateur ou un rôle
-- personnalisé appartenant à sa propre entreprise.
CREATE OR REPLACE FUNCTION public.enforce_utilisateur_role_company()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  role_company_id text;
  role_code text;
BEGIN
  SELECT r.entreprise_id, r.code
    INTO role_company_id, role_code
  FROM public.roles r
  WHERE r.id = NEW.role_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rôle utilisateur introuvable.' USING ERRCODE = '23514';
  END IF;

  IF role_company_id IS NOT NULL AND role_company_id <> NEW.entreprise_id THEN
    RAISE EXCEPTION 'Le rôle appartient à une autre entreprise.' USING ERRCODE = '23514';
  END IF;

  IF role_code = 'ADMINISTRATEUR' AND role_company_id IS DISTINCT FROM NEW.entreprise_id THEN
    RAISE EXCEPTION 'Le rôle administrateur doit être une copie propre à l’entreprise.' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS utilisateurs_role_company_guard ON public.utilisateurs;
CREATE TRIGGER utilisateurs_role_company_guard
BEFORE INSERT OR UPDATE OF entreprise_id, role_id
ON public.utilisateurs
FOR EACH ROW
EXECUTE FUNCTION public.enforce_utilisateur_role_company();

-- Une affectation relie obligatoirement un utilisateur CHANTIER et un chantier
-- de la même entreprise. Cette règle reste active même pour les connexions Prisma
-- qui contournent RLS.
CREATE OR REPLACE FUNCTION public.enforce_utilisateur_chantier_company()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_company_id text;
  user_type text;
  chantier_company_id text;
BEGIN
  SELECT u.entreprise_id, u.type
    INTO user_company_id, user_type
  FROM public.utilisateurs u
  WHERE u.id = NEW.utilisateur_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Utilisateur affecté introuvable.' USING ERRCODE = '23514';
  END IF;

  SELECT c.entreprise_id
    INTO chantier_company_id
  FROM public.chantiers c
  WHERE c.id = NEW.chantier_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Chantier affecté introuvable.' USING ERRCODE = '23514';
  END IF;

  IF user_type <> 'CHANTIER' OR user_company_id <> chantier_company_id THEN
    RAISE EXCEPTION 'Affectation refusée : utilisateur chantier et chantier doivent appartenir à la même entreprise.' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS utilisateur_chantiers_company_guard ON public.utilisateur_chantiers;
CREATE TRIGGER utilisateur_chantiers_company_guard
BEFORE INSERT OR UPDATE OF utilisateur_id, chantier_id
ON public.utilisateur_chantiers
FOR EACH ROW
EXECUTE FUNCTION public.enforce_utilisateur_chantier_company();

-- Les responsables et conducteurs désignés sur la fiche chantier doivent
-- également appartenir à l'entreprise propriétaire du chantier.
CREATE OR REPLACE FUNCTION public.enforce_chantier_staff_company()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.directeur_chantier_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.utilisateurs u
    WHERE u.id = NEW.directeur_chantier_id
      AND u.entreprise_id = NEW.entreprise_id
  ) THEN
    RAISE EXCEPTION 'Le directeur de chantier doit appartenir à la même entreprise.' USING ERRCODE = '23514';
  END IF;

  IF NEW.conducteur_travaux_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.utilisateurs u
    WHERE u.id = NEW.conducteur_travaux_id
      AND u.entreprise_id = NEW.entreprise_id
  ) THEN
    RAISE EXCEPTION 'Le conducteur de travaux doit appartenir à la même entreprise.' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS chantiers_staff_company_guard ON public.chantiers;
CREATE TRIGGER chantiers_staff_company_guard
BEFORE INSERT OR UPDATE OF entreprise_id, directeur_chantier_id, conducteur_travaux_id
ON public.chantiers
FOR EACH ROW
EXECUTE FUNCTION public.enforce_chantier_staff_company();

-- Lecture d'un chantier : entreprise + affectation + permission effective.
DROP POLICY IF EXISTS chantiers_select_scope ON public.chantiers;
CREATE POLICY chantiers_select_scope ON public.chantiers
  FOR SELECT TO authenticated
  USING (
    entreprise_id = public.current_company_id()
    AND public.can_access_chantier(id)
    AND (public.is_company_admin() OR public.has_app_permission('CHANTIERS', 'CONSULTER'))
  );

-- Une affectation visible doit avoir ses deux extrémités dans l'entreprise courante.
DROP POLICY IF EXISTS utilisateur_chantiers_select_scope ON public.utilisateur_chantiers;
CREATE POLICY utilisateur_chantiers_select_scope ON public.utilisateur_chantiers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.utilisateurs u
      JOIN public.chantiers c ON c.id = utilisateur_chantiers.chantier_id
      WHERE u.id = utilisateur_chantiers.utilisateur_id
        AND u.entreprise_id = public.current_company_id()
        AND c.entreprise_id = public.current_company_id()
        AND u.entreprise_id = c.entreprise_id
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
  USING (
    public.is_company_admin()
    AND EXISTS (
      SELECT 1
      FROM public.utilisateurs u
      JOIN public.chantiers c ON c.id = utilisateur_chantiers.chantier_id
      WHERE u.id = utilisateur_chantiers.utilisateur_id
        AND u.entreprise_id = public.current_company_id()
        AND c.entreprise_id = public.current_company_id()
        AND u.entreprise_id = c.entreprise_id
        AND u.type = 'CHANTIER'
    )
  )
  WITH CHECK (
    public.is_company_admin()
    AND EXISTS (
      SELECT 1
      FROM public.utilisateurs u
      JOIN public.chantiers c ON c.id = utilisateur_chantiers.chantier_id
      WHERE u.id = utilisateur_chantiers.utilisateur_id
        AND u.entreprise_id = public.current_company_id()
        AND c.entreprise_id = public.current_company_id()
        AND u.entreprise_id = c.entreprise_id
        AND u.type = 'CHANTIER'
    )
  );

-- Empêche l'attribution directe d'un modèle global ADMINISTRATEUR et conserve
-- la validation de l'entreprise pour tous les autres rôles.
DROP POLICY IF EXISTS utilisateurs_insert_admin ON public.utilisateurs;
CREATE POLICY utilisateurs_insert_admin ON public.utilisateurs
  FOR INSERT TO authenticated
  WITH CHECK (
    entreprise_id = public.current_company_id()
    AND public.is_company_admin()
    AND EXISTS (
      SELECT 1 FROM public.roles r
      WHERE r.id = utilisateurs.role_id
        AND (
          r.entreprise_id = public.current_company_id()
          OR (r.entreprise_id IS NULL AND r.code <> 'ADMINISTRATEUR')
        )
    )
  );

DROP POLICY IF EXISTS utilisateurs_update_admin ON public.utilisateurs;
CREATE POLICY utilisateurs_update_admin ON public.utilisateurs
  FOR UPDATE TO authenticated
  USING (
    entreprise_id = public.current_company_id()
    AND public.is_company_admin()
  )
  WITH CHECK (
    entreprise_id = public.current_company_id()
    AND public.is_company_admin()
    AND EXISTS (
      SELECT 1 FROM public.roles r
      WHERE r.id = utilisateurs.role_id
        AND (
          r.entreprise_id = public.current_company_id()
          OR (r.entreprise_id IS NULL AND r.code <> 'ADMINISTRATEUR')
        )
    )
  );

-- Les comptes Auth et leur e-mail sont gérés côté serveur via Supabase Auth.
-- Les sessions authenticated ne peuvent ni créer un profil sans invitation,
-- ni modifier auth_user_id, e-mail, entreprise_id ou identifiants.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.utilisateurs FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.utilisateurs TO authenticated;
GRANT UPDATE (nom, prenom, telephone, poste, type, role_id, statut, photo_url)
  ON TABLE public.utilisateurs TO authenticated;

-- Les fonctions SECURITY DEFINER ne sont pas appelables anonymement.
REVOKE ALL ON FUNCTION public.current_app_user_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_company_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_app_user_type() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_company_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_user_has_any_role(text[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_company_accountant() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_app_permission(text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_access_chantier(text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.current_app_user_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_company_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_app_user_type() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_company_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_has_any_role(text[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_company_accountant() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_app_permission(text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_access_chantier(text) TO authenticated, service_role;

COMMENT ON FUNCTION public.enforce_utilisateur_chantier_company() IS
  'Empêche les affectations utilisateur/chantier entre entreprises et interdit les affectations de profils centraux.';
