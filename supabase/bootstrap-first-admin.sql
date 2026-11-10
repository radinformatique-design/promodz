-- Création du premier administrateur BatiProm (base Supabase vide).
-- 1) Créez d'abord l'utilisateur dans Supabase > Authentication > Users.
-- 2) Remplacez toutes les valeurs REPLACE_* ci-dessous.
-- 3) Exécutez ce script une seule fois dans Supabase SQL Editor.
-- Le script vérifie que l'UUID existe réellement dans auth.users et que l'e-mail correspond.

DO $$
DECLARE
  v_auth_uid uuid := 'REPLACE_WITH_SUPABASE_AUTH_USER_UUID';
  v_email text := 'REPLACE_WITH_ADMIN_EMAIL';
  v_nom text := 'REPLACE_ADMIN_LAST_NAME';
  v_prenom text := 'REPLACE_ADMIN_FIRST_NAME';
  v_telephone text := 'REPLACE_PHONE';
  v_poste text := 'Administrateur général';
  v_raison_sociale text := 'REPLACE_COMPANY_LEGAL_NAME';
  v_nom_commercial text := 'REPLACE_COMPANY_TRADE_NAME';
  v_rc text := 'REPLACE_RC';
  v_nif text := 'REPLACE_NIF';
  v_nis text := 'REPLACE_NIS';
  v_article_imposition text := 'REPLACE_ARTICLE_IMPOSITION';
  v_agrement text := 'REPLACE_PROMOTER_APPROVAL';
  v_adresse text := 'REPLACE_HEAD_OFFICE_ADDRESS';
  v_wilaya text := 'REPLACE_WILAYA';
  v_entreprise_id text := gen_random_uuid()::text;
  v_role_id text;
  v_auth_email text;
BEGIN
  SELECT lower(email) INTO v_auth_email
  FROM auth.users
  WHERE id = v_auth_uid;

  IF v_auth_email IS NULL THEN
    RAISE EXCEPTION 'UUID introuvable dans auth.users. Créez le compte dans Supabase Auth avant ce script.';
  END IF;
  IF v_auth_email <> lower(v_email) THEN
    RAISE EXCEPTION 'L''adresse e-mail ne correspond pas au compte Supabase Auth.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.utilisateurs WHERE auth_user_id = v_auth_uid::text) THEN
    RAISE EXCEPTION 'Un profil BatiProm est déjà associé à cet UUID Auth.';
  END IF;

  INSERT INTO public.entreprises (
    id, raison_sociale, nom_commercial, forme_juridique, capital_social,
    rc, nif, nis, article_imposition, agrement_promoteur,
    adresse_siege, wilaya, telephone, email, created_at, updated_at
  ) VALUES (
    v_entreprise_id, v_raison_sociale, v_nom_commercial, 'SARL', 0,
    v_rc, v_nif, v_nis, v_article_imposition, v_agrement,
    v_adresse, v_wilaya, v_telephone, v_email, now(), now()
  );

  INSERT INTO public.roles (id, code, libelle, description, type_acces, created_at)
  VALUES (gen_random_uuid()::text, 'ADMINISTRATEUR', 'Administrateur', 'Administrateur principal de l''entreprise', 'CENTRAL', now())
  ON CONFLICT (code) DO NOTHING;

  SELECT id INTO v_role_id FROM public.roles WHERE code = 'ADMINISTRATEUR';
  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'Impossible de créer ou retrouver le rôle ADMINISTRATEUR.';
  END IF;

  INSERT INTO public.utilisateurs (
    id, entreprise_id, nom, prenom, email, auth_user_id,
    telephone, poste, type, role_id, statut, created_at
  ) VALUES (
    gen_random_uuid()::text, v_entreprise_id, v_nom, v_prenom,
    lower(v_email), v_auth_uid::text, v_telephone, v_poste,
    'CENTRAL', v_role_id, 'ACTIF', now()
  );

  INSERT INTO public.parametres_generaux (
    id, entreprise_id, devise_principale, langue_defaut, is_rtl,
    format_date, heure_limite_pointage, updated_at
  ) VALUES (
    gen_random_uuid()::text, v_entreprise_id, 'DZD', 'fr', false,
    'DD/MM/YYYY', '08:30', now()
  );
END $$;
