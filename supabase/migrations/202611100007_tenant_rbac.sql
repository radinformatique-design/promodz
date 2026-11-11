-- 007: Personnalisation RBAC par entreprise sans modifier le catalogue système partagé.
-- Les rôles sans entreprise sont des modèles globaux en lecture seule.
-- Chaque entreprise peut créer une copie locale d'un modèle et gérer ses affectations.
-- À exécuter après 001 à 006, une fois le schéma Prisma synchronisé.

ALTER TABLE public.roles
  ADD COLUMN IF NOT EXISTS entreprise_id text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'roles_entreprise_id_fkey'
      AND conrelid = 'public.roles'::regclass
  ) THEN
    ALTER TABLE public.roles
      ADD CONSTRAINT roles_entreprise_id_fkey
      FOREIGN KEY (entreprise_id) REFERENCES public.entreprises(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Remplace l'unicité globale par une unicité adaptée aux modèles et aux copies locales.
ALTER TABLE public.roles DROP CONSTRAINT IF EXISTS roles_code_key;
DROP INDEX IF EXISTS public.roles_code_key;
CREATE UNIQUE INDEX IF NOT EXISTS roles_global_code_key
  ON public.roles(code)
  WHERE entreprise_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS roles_company_code_key
  ON public.roles(entreprise_id, code)
  WHERE entreprise_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS roles_entreprise_id_idx
  ON public.roles(entreprise_id);

-- Compatibilité avec les bases où un premier administrateur avait été créé avec un rôle global.
-- Chaque entreprise reçoit son propre rôle ADMINISTRATEUR avant le rattachement des utilisateurs.
DO $$
DECLARE
  company_row record;
  global_admin_id text;
  company_admin_id text;
BEGIN
  SELECT id INTO global_admin_id
  FROM public.roles
  WHERE code = 'ADMINISTRATEUR' AND entreprise_id IS NULL
  LIMIT 1;

  IF global_admin_id IS NOT NULL THEN
    FOR company_row IN
      SELECT DISTINCT entreprise_id
      FROM public.utilisateurs
      WHERE role_id = global_admin_id
    LOOP
      SELECT id INTO company_admin_id
      FROM public.roles
      WHERE entreprise_id = company_row.entreprise_id
        AND code = 'ADMINISTRATEUR'
      LIMIT 1;

      IF company_admin_id IS NULL THEN
        company_admin_id := gen_random_uuid()::text;
        INSERT INTO public.roles (
          id, entreprise_id, code, libelle, description, type_acces, created_at
        )
        SELECT
          company_admin_id, company_row.entreprise_id, code, libelle,
          description, type_acces, now()
        FROM public.roles
        WHERE id = global_admin_id;
      END IF;

      INSERT INTO public.role_permissions (id, role_id, permission_id)
      SELECT gen_random_uuid()::text, company_admin_id, permission_id
      FROM public.role_permissions
      WHERE role_id = global_admin_id
      ON CONFLICT (role_id, permission_id) DO NOTHING;

      UPDATE public.utilisateurs
      SET role_id = company_admin_id
      WHERE entreprise_id = company_row.entreprise_id
        AND role_id = global_admin_id;
    END LOOP;
  END IF;
END $$;

-- Les modèles globaux restent consultables ; chaque entreprise ne voit que ses copies.
DROP POLICY IF EXISTS roles_authenticated_read ON public.roles;
DROP POLICY IF EXISTS roles_select_company ON public.roles;
CREATE POLICY roles_select_company ON public.roles
  FOR SELECT TO authenticated
  USING (
    public.current_app_user_id() IS NOT NULL
    AND (entreprise_id IS NULL OR entreprise_id = public.current_company_id())
  );

DROP POLICY IF EXISTS roles_company_admin_insert ON public.roles;
CREATE POLICY roles_company_admin_insert ON public.roles
  FOR INSERT TO authenticated
  WITH CHECK (
    entreprise_id = public.current_company_id()
    AND public.is_company_admin()
    AND code <> 'ADMINISTRATEUR'
  );

DROP POLICY IF EXISTS roles_company_admin_update ON public.roles;
CREATE POLICY roles_company_admin_update ON public.roles
  FOR UPDATE TO authenticated
  USING (
    entreprise_id = public.current_company_id()
    AND public.is_company_admin()
    AND code <> 'ADMINISTRATEUR'
  )
  WITH CHECK (
    entreprise_id = public.current_company_id()
    AND public.is_company_admin()
    AND code <> 'ADMINISTRATEUR'
  );

DROP POLICY IF EXISTS roles_company_admin_delete ON public.roles;
CREATE POLICY roles_company_admin_delete ON public.roles
  FOR DELETE TO authenticated
  USING (
    entreprise_id = public.current_company_id()
    AND public.is_company_admin()
    AND code <> 'ADMINISTRATEUR'
  );

-- Les permissions restent un catalogue système global en lecture seule.
DROP POLICY IF EXISTS permissions_authenticated_read ON public.permissions;
CREATE POLICY permissions_authenticated_read ON public.permissions
  FOR SELECT TO authenticated
  USING (public.current_app_user_id() IS NOT NULL);

-- Lecture des affectations RBAC limitée aux rôles globaux et à ceux de l'entreprise courante.
DROP POLICY IF EXISTS role_permissions_authenticated_read ON public.role_permissions;
CREATE POLICY role_permissions_select_company ON public.role_permissions
  FOR SELECT TO authenticated
  USING (
    public.current_app_user_id() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.roles r
      WHERE r.id = role_permissions.role_id
        AND (r.entreprise_id IS NULL OR r.entreprise_id = public.current_company_id())
    )
  );

-- Seules les copies locales de rôles peuvent être modifiées par l'administrateur de l'entreprise.
DROP POLICY IF EXISTS role_permissions_admin_write ON public.role_permissions;
DROP POLICY IF EXISTS role_permissions_company_admin_write ON public.role_permissions;
CREATE POLICY role_permissions_company_admin_write ON public.role_permissions
  FOR ALL TO authenticated
  USING (
    public.is_company_admin()
    AND EXISTS (
      SELECT 1 FROM public.roles r
      WHERE r.id = role_permissions.role_id
        AND r.entreprise_id = public.current_company_id()
        AND r.code <> 'ADMINISTRATEUR'
    )
  )
  WITH CHECK (
    public.is_company_admin()
    AND EXISTS (
      SELECT 1 FROM public.roles r
      WHERE r.id = role_permissions.role_id
        AND r.entreprise_id = public.current_company_id()
        AND r.code <> 'ADMINISTRATEUR'
    )
    AND EXISTS (
      SELECT 1 FROM public.permissions p
      WHERE p.id = role_permissions.permission_id
    )
  );

-- Une affectation d'utilisateur ne peut jamais pointer vers le rôle privé d'une autre entreprise.
DROP POLICY IF EXISTS utilisateurs_insert_admin ON public.utilisateurs;
CREATE POLICY utilisateurs_insert_admin ON public.utilisateurs
  FOR INSERT TO authenticated
  WITH CHECK (
    entreprise_id = public.current_company_id()
    AND public.is_company_admin()
    AND EXISTS (
      SELECT 1 FROM public.roles r
      WHERE r.id = utilisateurs.role_id
        AND (r.entreprise_id IS NULL OR r.entreprise_id = public.current_company_id())
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
        AND (r.entreprise_id IS NULL OR r.entreprise_id = public.current_company_id())
    )
  );

COMMENT ON COLUMN public.roles.entreprise_id IS
  'NULL = modèle système global ; non NULL = copie personnalisable appartenant à une entreprise.';
