-- Autoriser les profils centraux actifs de l'entreprise à consulter les chantiers.
-- Les contrôles RBAC applicatifs restent obligatoires pour les actions métier.
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
    WHERE c.id = target_chantier_id
      AND u.auth_user_id = auth.uid()::text
      AND u.statut = 'ACTIF'
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
