-- Test de non-régression RLS BatiProm.
-- À exécuter dans un projet Supabase DE TEST après les migrations 001 à 008.
-- Le script crée deux entreprises, deux chantiers dans la première et un chantier
-- dans la seconde, puis annule toutes les données de test à la fin.
-- Aucun mot de passe ni secret Auth n'est requis : auth.uid() est simulé par les claims SQL.

BEGIN;

INSERT INTO public.entreprises (
  id, raison_sociale, nom_commercial, rc, nif, nis,
  article_imposition, agrement_promoteur, adresse_siege, wilaya,
  telephone, email, created_at, updated_at
) VALUES
  ('90000000-0000-0000-0000-000000000001', 'RLS Test Company A', 'RLS A',
   'RLS-RC-A-9001', 'RLS-NIF-A-9001', 'RLS-NIS-A-9001',
   'RLS-AI-A', 'RLS-AGR-A', 'Adresse A', 'Alger', '0550000001',
   'rls-a@example.invalid', now(), now()),
  ('90000000-0000-0000-0000-000000000002', 'RLS Test Company B', 'RLS B',
   'RLS-RC-B-9002', 'RLS-NIF-B-9002', 'RLS-NIS-B-9002',
   'RLS-AI-B', 'RLS-AGR-B', 'Adresse B', 'Oran', '0550000002',
   'rls-b@example.invalid', now(), now());

INSERT INTO public.roles (id, entreprise_id, code, libelle, type_acces, created_at) VALUES
  ('90000000-0000-0000-0000-000000000011', '90000000-0000-0000-0000-000000000001', 'ADMINISTRATEUR', 'Admin A', 'CENTRAL', now()),
  ('90000000-0000-0000-0000-000000000012', '90000000-0000-0000-0000-000000000001', 'CONDUCTEUR_TRAVAUX', 'Conducteur A', 'CHANTIER', now()),
  ('90000000-0000-0000-0000-000000000013', '90000000-0000-0000-0000-000000000002', 'ADMINISTRATEUR', 'Admin B', 'CENTRAL', now());

INSERT INTO public.permissions (id, module, action, description)
VALUES ('90000000-0000-0000-0000-000000000021', 'CHANTIERS', 'CONSULTER', 'RLS test permission')
ON CONFLICT (module, action) DO NOTHING;

INSERT INTO public.role_permissions (id, role_id, permission_id)
SELECT '90000000-0000-0000-0000-000000000022',
       '90000000-0000-0000-0000-000000000012',
       p.id
FROM public.permissions p
WHERE p.module = 'CHANTIERS' AND p.action = 'CONSULTER'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO public.utilisateurs (
  id, entreprise_id, nom, prenom, email, auth_user_id,
  telephone, poste, type, role_id, statut, created_at
) VALUES
  ('90000000-0000-0000-0000-000000000031', '90000000-0000-0000-0000-000000000001',
   'Admin', 'A', 'rls-admin-a@example.invalid', '90000000-0000-0000-0000-000000000041',
   '0550000031', 'Administrateur', 'CENTRAL', '90000000-0000-0000-0000-000000000011', 'ACTIF', now()),
  ('90000000-0000-0000-0000-000000000032', '90000000-0000-0000-0000-000000000001',
   'Conducteur', 'A', 'rls-conducteur-a@example.invalid', '90000000-0000-0000-0000-000000000042',
   '0550000032', 'Conducteur de travaux', 'CHANTIER', '90000000-0000-0000-0000-000000000012', 'ACTIF', now()),
  ('90000000-0000-0000-0000-000000000033', '90000000-0000-0000-0000-000000000002',
   'Admin', 'B', 'rls-admin-b@example.invalid', '90000000-0000-0000-0000-000000000043',
   '0550000033', 'Administrateur', 'CENTRAL', '90000000-0000-0000-0000-000000000013', 'ACTIF', now());

INSERT INTO public.chantiers (
  id, entreprise_id, code_chantier, nom_projet, wilaya, commune,
  adresse_site, nombre_niveaux, date_ouverture_chantier,
  date_livraison_prevue, created_at, updated_at
) VALUES
  ('90000000-0000-0000-0000-000000000051', '90000000-0000-0000-0000-000000000001',
   'RLS-A-1', 'Chantier A1', 'Alger', 'Alger Centre', 'Adresse A1', 'R+5',
   DATE '2026-01-01', DATE '2027-12-31', now(), now()),
  ('90000000-0000-0000-0000-000000000052', '90000000-0000-0000-0000-000000000001',
   'RLS-A-2', 'Chantier A2', 'Alger', 'Bab Ezzouar', 'Adresse A2', 'R+8',
   DATE '2026-02-01', DATE '2028-12-31', now(), now()),
  ('90000000-0000-0000-0000-000000000053', '90000000-0000-0000-0000-000000000002',
   'RLS-B-1', 'Chantier B1', 'Oran', 'Oran', 'Adresse B1', 'R+4',
   DATE '2026-03-01', DATE '2028-06-30', now(), now());

INSERT INTO public.utilisateur_chantiers (id, utilisateur_id, chantier_id, date_debut, est_actif)
VALUES (
  '90000000-0000-0000-0000-000000000061',
  '90000000-0000-0000-0000-000000000032',
  '90000000-0000-0000-0000-000000000051',
  now(), true
);

-- Un conducteur ne voit que le chantier qui lui est affecté, même dans sa société.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000042', true);

DO $$
DECLARE
  visible_chantiers integer;
  visible_company_b_users integer;
  visible_company_b_roles integer;
  visible_assignments integer;
BEGIN
  SELECT count(*) INTO visible_chantiers
  FROM public.chantiers
  WHERE id IN (
    '90000000-0000-0000-0000-000000000051',
    '90000000-0000-0000-0000-000000000052',
    '90000000-0000-0000-0000-000000000053'
  );
  IF visible_chantiers <> 1 THEN
    RAISE EXCEPTION 'RLS_TEST_FAILED: le conducteur doit voir exactement son chantier (1), résultat=%', visible_chantiers;
  END IF;

  SELECT count(*) INTO visible_company_b_users
  FROM public.utilisateurs
  WHERE entreprise_id = '90000000-0000-0000-0000-000000000002';
  IF visible_company_b_users <> 0 THEN
    RAISE EXCEPTION 'RLS_TEST_FAILED: fuite de profils entre entreprises.';
  END IF;

  SELECT count(*) INTO visible_company_b_roles
  FROM public.roles
  WHERE entreprise_id = '90000000-0000-0000-0000-000000000002';
  IF visible_company_b_roles <> 0 THEN
    RAISE EXCEPTION 'RLS_TEST_FAILED: fuite de rôles entre entreprises.';
  END IF;

  SELECT count(*) INTO visible_assignments
  FROM public.utilisateur_chantiers
  WHERE utilisateur_id = '90000000-0000-0000-0000-000000000032';
  IF visible_assignments <> 1 THEN
    RAISE EXCEPTION 'RLS_TEST_FAILED: affectations visibles inattendues.';
  END IF;
END;
$$;

RESET ROLE;

-- Un administrateur A ne peut pas rattacher un utilisateur B à un chantier A.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000041', true);

DO $$
BEGIN
  BEGIN
    INSERT INTO public.utilisateur_chantiers (id, utilisateur_id, chantier_id, date_debut, est_actif)
    VALUES (
      '90000000-0000-0000-0000-000000000071',
      '90000000-0000-0000-0000-000000000033',
      '90000000-0000-0000-0000-000000000052',
      now(), true
    );
    RAISE EXCEPTION 'RLS_TEST_FAILED: une affectation inter-entreprises a été acceptée.';
  EXCEPTION
    WHEN insufficient_privilege OR check_violation THEN
      NULL;
  END;
END;
$$;

RESET ROLE;

-- Les déclencheurs doivent aussi bloquer les incohérences via une connexion
-- serveur qui contourne RLS (cas des écritures Prisma).
DO $$
BEGIN
  BEGIN
    INSERT INTO public.utilisateur_chantiers (id, utilisateur_id, chantier_id, date_debut, est_actif)
    VALUES (
      '90000000-0000-0000-0000-000000000072',
      '90000000-0000-0000-0000-000000000033',
      '90000000-0000-0000-0000-000000000052',
      now(), true
    );
    RAISE EXCEPTION 'RLS_TEST_FAILED: le déclencheur a accepté une affectation inter-entreprises.';
  EXCEPTION
    WHEN check_violation THEN
      NULL;
  END;

  BEGIN
    UPDATE public.utilisateurs
    SET role_id = '90000000-0000-0000-0000-000000000013'
    WHERE id = '90000000-0000-0000-0000-000000000032';
    RAISE EXCEPTION 'RLS_TEST_FAILED: le déclencheur a accepté un rôle d’une autre entreprise.';
  EXCEPTION
    WHEN check_violation THEN
      NULL;
  END;

  BEGIN
    UPDATE public.chantiers
    SET conducteur_travaux_id = '90000000-0000-0000-0000-000000000033'
    WHERE id = '90000000-0000-0000-0000-000000000051';
    RAISE EXCEPTION 'RLS_TEST_FAILED: le déclencheur a accepté un conducteur d’une autre entreprise.';
  EXCEPTION
    WHEN check_violation THEN
      NULL;
  END;
END;
$$;

ROLLBACK;

-- Si aucune exception RLS_TEST_FAILED n'a été levée, les contrôles attendus ont réussi.
