-- RLS complémentaire sur les tables métier du schéma BatiProm.
-- À exécuter après les migrations 001 à 003.
-- Prisma utilise une connexion directe distincte : ces règles protègent les accès
-- Supabase/PostgREST, les API Prisma doivent conserver leurs contrôles applicatifs.

-- Référentiels globaux : lecture uniquement depuis les sessions authentifiées.
DROP POLICY IF EXISTS role_permissions_admin_write ON public.role_permissions;
DROP POLICY IF EXISTS roles_authenticated_read ON public.roles;
CREATE POLICY roles_authenticated_read ON public.roles
  FOR SELECT TO authenticated USING (public.current_app_user_id() IS NOT NULL);

DROP POLICY IF EXISTS permissions_authenticated_read ON public.permissions;
CREATE POLICY permissions_authenticated_read ON public.permissions
  FOR SELECT TO authenticated USING (public.current_app_user_id() IS NOT NULL);

DROP POLICY IF EXISTS role_permissions_authenticated_read ON public.role_permissions;
CREATE POLICY role_permissions_authenticated_read ON public.role_permissions
  FOR SELECT TO authenticated USING (public.current_app_user_id() IS NOT NULL);

-- Corrige le périmètre d'écriture des affectations : l'administrateur ne peut
-- écrire que des affectations attachées à un chantier de sa propre entreprise.
DROP POLICY IF EXISTS utilisateur_chantiers_write_admin ON public.utilisateur_chantiers;
CREATE POLICY utilisateur_chantiers_write_admin ON public.utilisateur_chantiers
  FOR ALL TO authenticated
  USING (
    public.is_company_admin()
    AND EXISTS (
      SELECT 1 FROM public.chantiers c
      WHERE c.id = utilisateur_chantiers.chantier_id
        AND c.entreprise_id = public.current_company_id()
    )
  )
  WITH CHECK (
    public.is_company_admin()
    AND EXISTS (
      SELECT 1 FROM public.chantiers c
      WHERE c.id = utilisateur_chantiers.chantier_id
        AND c.entreprise_id = public.current_company_id()
    )
  );

ALTER TABLE public.comptes_bancaires ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS comptes_bancaires_company_scope ON public.comptes_bancaires;
CREATE POLICY comptes_bancaires_company_scope ON public.comptes_bancaires
  FOR ALL TO authenticated
  USING (
    entreprise_id = public.current_company_id()
    AND (chantier_dedie_id IS NULL OR public.can_access_chantier(chantier_dedie_id))
  )
  WITH CHECK (
    entreprise_id = public.current_company_id()
    AND (chantier_dedie_id IS NULL OR public.can_access_chantier(chantier_dedie_id))
  );

ALTER TABLE public.parametres_generaux ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS parametres_company_scope ON public.parametres_generaux;
CREATE POLICY parametres_company_scope ON public.parametres_generaux
  FOR ALL TO authenticated
  USING (entreprise_id = public.current_company_id() AND public.is_company_admin())
  WITH CHECK (entreprise_id = public.current_company_id() AND public.is_company_admin());

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_sessions_own_scope ON public.user_sessions;
CREATE POLICY user_sessions_own_scope ON public.user_sessions
  FOR ALL TO authenticated
  USING (utilisateur_id = public.current_app_user_id())
  WITH CHECK (utilisateur_id = public.current_app_user_id());

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notifications_recipient_scope ON public.notifications;
CREATE POLICY notifications_recipient_scope ON public.notifications
  FOR ALL TO authenticated
  USING (destinataire_id = public.current_app_user_id())
  WITH CHECK (destinataire_id = public.current_app_user_id());

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_logs_chantier_scope ON public.audit_logs;
CREATE POLICY audit_logs_chantier_scope ON public.audit_logs
  FOR ALL TO authenticated
  USING (
    (chantier_id IS NOT NULL AND public.can_access_chantier(chantier_id))
    OR (chantier_id IS NULL AND public.is_company_admin())
  )
  WITH CHECK (
    (chantier_id IS NOT NULL AND public.can_access_chantier(chantier_id))
    OR (chantier_id IS NULL AND public.is_company_admin())
  );

ALTER TABLE public.documents_ged ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS documents_ged_scope ON public.documents_ged;
CREATE POLICY documents_ged_scope ON public.documents_ged
  FOR ALL TO authenticated
  USING (
    (chantier_id IS NOT NULL AND public.can_access_chantier(chantier_id))
    OR (chantier_id IS NULL AND (auteur_id = public.current_app_user_id() OR public.is_company_admin()))
  )
  WITH CHECK (
    (chantier_id IS NOT NULL AND public.can_access_chantier(chantier_id))
    OR (chantier_id IS NULL AND (auteur_id = public.current_app_user_id() OR public.is_company_admin()))
  );

ALTER TABLE public.rh_employes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rh_employes_chantier_scope ON public.rh_employes;
CREATE POLICY rh_employes_chantier_scope ON public.rh_employes
  FOR ALL TO authenticated
  USING (chantier_actuel_id IS NOT NULL AND public.can_access_chantier(chantier_actuel_id))
  WITH CHECK (chantier_actuel_id IS NOT NULL AND public.can_access_chantier(chantier_actuel_id));

ALTER TABLE public.rh_affectations_historique ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rh_affectations_chantier_scope ON public.rh_affectations_historique;
CREATE POLICY rh_affectations_chantier_scope ON public.rh_affectations_historique
  FOR ALL TO authenticated
  USING (public.can_access_chantier(chantier_id))
  WITH CHECK (public.can_access_chantier(chantier_id));

ALTER TABLE public.rh_pointages_journaliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rh_pointages_chantier_scope ON public.rh_pointages_journaliers;
CREATE POLICY rh_pointages_chantier_scope ON public.rh_pointages_journaliers
  FOR ALL TO authenticated
  USING (public.can_access_chantier(chantier_id))
  WITH CHECK (public.can_access_chantier(chantier_id));

ALTER TABLE public.rh_conges_absences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rh_conges_employe_scope ON public.rh_conges_absences;
CREATE POLICY rh_conges_employe_scope ON public.rh_conges_absences
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rh_employes e
      WHERE e.id = rh_conges_absences.employe_id
        AND e.chantier_actuel_id IS NOT NULL
        AND public.can_access_chantier(e.chantier_actuel_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rh_employes e
      WHERE e.id = rh_conges_absences.employe_id
        AND e.chantier_actuel_id IS NOT NULL
        AND public.can_access_chantier(e.chantier_actuel_id)
    )
  );

ALTER TABLE public.technique_lots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS technique_lots_chantier_scope ON public.technique_lots;
CREATE POLICY technique_lots_chantier_scope ON public.technique_lots
  FOR ALL TO authenticated
  USING (public.can_access_chantier(chantier_id))
  WITH CHECK (public.can_access_chantier(chantier_id));

ALTER TABLE public.materiel_engins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS materiel_engins_chantier_scope ON public.materiel_engins;
CREATE POLICY materiel_engins_chantier_scope ON public.materiel_engins
  FOR ALL TO authenticated
  USING (
    (chantier_actuel_id IS NOT NULL AND public.can_access_chantier(chantier_actuel_id))
    OR (chantier_actuel_id IS NULL AND public.is_company_admin())
  )
  WITH CHECK (
    (chantier_actuel_id IS NOT NULL AND public.can_access_chantier(chantier_actuel_id))
    OR (chantier_actuel_id IS NULL AND public.is_company_admin())
  );

ALTER TABLE public.materiel_entretiens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS materiel_entretiens_parent_scope ON public.materiel_entretiens;
CREATE POLICY materiel_entretiens_parent_scope ON public.materiel_entretiens
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.materiel_engins m
      WHERE m.id = materiel_id
        AND ((m.chantier_actuel_id IS NOT NULL AND public.can_access_chantier(m.chantier_actuel_id))
          OR (m.chantier_actuel_id IS NULL AND public.is_company_admin())))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.materiel_engins m
      WHERE m.id = materiel_id
        AND ((m.chantier_actuel_id IS NOT NULL AND public.can_access_chantier(m.chantier_actuel_id))
          OR (m.chantier_actuel_id IS NULL AND public.is_company_admin())))
  );

ALTER TABLE public.materiel_pieces_remplacables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS materiel_pieces_parent_scope ON public.materiel_pieces_remplacables;
CREATE POLICY materiel_pieces_parent_scope ON public.materiel_pieces_remplacables
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.materiel_engins m
      WHERE m.id = materiel_id
        AND ((m.chantier_actuel_id IS NOT NULL AND public.can_access_chantier(m.chantier_actuel_id))
          OR (m.chantier_actuel_id IS NULL AND public.is_company_admin())))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.materiel_engins m
      WHERE m.id = materiel_id
        AND ((m.chantier_actuel_id IS NOT NULL AND public.can_access_chantier(m.chantier_actuel_id))
          OR (m.chantier_actuel_id IS NULL AND public.is_company_admin())))
  );

ALTER TABLE public.commercial_programmes_lots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS commercial_lots_chantier_scope ON public.commercial_programmes_lots;
CREATE POLICY commercial_lots_chantier_scope ON public.commercial_programmes_lots
  FOR ALL TO authenticated
  USING (public.can_access_chantier(chantier_id))
  WITH CHECK (public.can_access_chantier(chantier_id));

ALTER TABLE public.commercial_reservations_vefa ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS commercial_reservations_scope ON public.commercial_reservations_vefa;
CREATE POLICY commercial_reservations_scope ON public.commercial_reservations_vefa
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.commercial_programmes_lots b
      WHERE b.id = bien_id AND public.can_access_chantier(b.chantier_id))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.commercial_programmes_lots b
      WHERE b.id = bien_id AND public.can_access_chantier(b.chantier_id))
  );

ALTER TABLE public.commercial_clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS commercial_clients_reservation_scope ON public.commercial_clients;
CREATE POLICY commercial_clients_reservation_scope ON public.commercial_clients
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.commercial_reservations_vefa r
      JOIN public.commercial_programmes_lots b ON b.id = r.bien_id
      WHERE r.client_id = commercial_clients.id
        AND public.can_access_chantier(b.chantier_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.commercial_reservations_vefa r
      JOIN public.commercial_programmes_lots b ON b.id = r.bien_id
      WHERE r.client_id = commercial_clients.id
        AND public.can_access_chantier(b.chantier_id)
    )
  );

ALTER TABLE public.juridique_dossiers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS juridique_dossiers_scope ON public.juridique_dossiers;
CREATE POLICY juridique_dossiers_scope ON public.juridique_dossiers
  FOR ALL TO authenticated
  USING (
    (chantier_id IS NOT NULL AND public.can_access_chantier(chantier_id))
    OR (chantier_id IS NULL AND public.is_company_admin())
  )
  WITH CHECK (
    (chantier_id IS NOT NULL AND public.can_access_chantier(chantier_id))
    OR (chantier_id IS NULL AND public.is_company_admin())
  );

ALTER TABLE public.comptabilite_budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS budgets_chantier_scope ON public.comptabilite_budgets;
CREATE POLICY budgets_chantier_scope ON public.comptabilite_budgets
  FOR ALL TO authenticated
  USING (public.can_access_chantier(chantier_id))
  WITH CHECK (public.can_access_chantier(chantier_id));


-- Fonctions de contrôle de rôles pour les politiques métier fines.
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
    WHERE u.auth_user_id = auth.uid()::text
      AND u.statut = 'ACTIF'
      AND r.code = ANY(role_codes)
  );
$$;

-- Fournisseurs : consultation société, écriture par approvisionnement / admin.
DROP POLICY IF EXISTS fournisseurs_company_scope ON public.fournisseurs;
CREATE POLICY fournisseurs_select_company ON public.fournisseurs
  FOR SELECT TO authenticated
  USING (entreprise_id = public.current_company_id());
CREATE POLICY fournisseurs_insert_central ON public.fournisseurs
  FOR INSERT TO authenticated
  WITH CHECK (
    entreprise_id = public.current_company_id()
    AND public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_APPROVISIONNEMENTS'])
  );
CREATE POLICY fournisseurs_update_central ON public.fournisseurs
  FOR UPDATE TO authenticated
  USING (
    entreprise_id = public.current_company_id()
    AND public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_APPROVISIONNEMENTS'])
  )
  WITH CHECK (
    entreprise_id = public.current_company_id()
    AND public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_APPROVISIONNEMENTS'])
  );
CREATE POLICY fournisseurs_delete_central ON public.fournisseurs
  FOR DELETE TO authenticated
  USING (
    entreprise_id = public.current_company_id()
    AND public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_APPROVISIONNEMENTS'])
  );

-- Demandes d'achat : le chantier crée sa demande, le siège approvisionnements la traite.
DROP POLICY IF EXISTS demandes_achat_chantier_scope ON public.appro_demandes_achat;
CREATE POLICY demandes_achat_select_scope ON public.appro_demandes_achat
  FOR SELECT TO authenticated USING (public.can_access_chantier(chantier_id));
CREATE POLICY demandes_achat_insert_scope ON public.appro_demandes_achat
  FOR INSERT TO authenticated
  WITH CHECK (
    public.can_access_chantier(chantier_id)
    AND demandeur_id = public.current_app_user_id()
  );
CREATE POLICY demandes_achat_update_central ON public.appro_demandes_achat
  FOR UPDATE TO authenticated
  USING (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_APPROVISIONNEMENTS'])
    AND public.can_access_chantier(chantier_id)
  )
  WITH CHECK (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_APPROVISIONNEMENTS'])
    AND public.can_access_chantier(chantier_id)
  );

-- Bons de commande : émission et modification exclusivement au siège approvisionnements.
DROP POLICY IF EXISTS bons_commande_chantier_scope ON public.appro_bons_commande;
CREATE POLICY bons_commande_select_scope ON public.appro_bons_commande
  FOR SELECT TO authenticated USING (public.can_access_chantier(chantier_id));
CREATE POLICY bons_commande_insert_central ON public.appro_bons_commande
  FOR INSERT TO authenticated
  WITH CHECK (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_APPROVISIONNEMENTS'])
    AND public.can_access_chantier(chantier_id)
  );
CREATE POLICY bons_commande_update_central ON public.appro_bons_commande
  FOR UPDATE TO authenticated
  USING (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_APPROVISIONNEMENTS'])
    AND public.can_access_chantier(chantier_id)
  )
  WITH CHECK (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_APPROVISIONNEMENTS'])
    AND public.can_access_chantier(chantier_id)
  );

-- Réceptions : lecture du chantier et saisie magasinier / conducteur / siège.
DROP POLICY IF EXISTS receptions_chantier_scope ON public.appro_receptions_chantiers;
CREATE POLICY receptions_select_scope ON public.appro_receptions_chantiers
  FOR SELECT TO authenticated USING (public.can_access_chantier(chantier_id));
CREATE POLICY receptions_insert_scope ON public.appro_receptions_chantiers
  FOR INSERT TO authenticated
  WITH CHECK (
    public.can_access_chantier(chantier_id)
    AND public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_APPROVISIONNEMENTS','CONDUCTEUR_TRAVAUX','MAGASINIER'])
  );
CREATE POLICY receptions_update_central ON public.appro_receptions_chantiers
  FOR UPDATE TO authenticated
  USING (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_APPROVISIONNEMENTS'])
    AND public.can_access_chantier(chantier_id)
  )
  WITH CHECK (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_APPROVISIONNEMENTS'])
    AND public.can_access_chantier(chantier_id)
  );

-- Factures fournisseurs et budgets : périmètre comptable central.
DROP POLICY IF EXISTS factures_company_scope ON public.appro_factures_fournisseurs;
CREATE POLICY factures_select_company ON public.appro_factures_fournisseurs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.fournisseurs f
    WHERE f.id = fournisseur_id AND f.entreprise_id = public.current_company_id()
  ));
CREATE POLICY factures_insert_compta ON public.appro_factures_fournisseurs
  FOR INSERT TO authenticated
  WITH CHECK (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_COMPTABILITE'])
    AND EXISTS (SELECT 1 FROM public.fournisseurs f
      WHERE f.id = fournisseur_id AND f.entreprise_id = public.current_company_id())
  );
CREATE POLICY factures_update_compta ON public.appro_factures_fournisseurs
  FOR UPDATE TO authenticated
  USING (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_COMPTABILITE'])
    AND EXISTS (SELECT 1 FROM public.fournisseurs f
      WHERE f.id = fournisseur_id AND f.entreprise_id = public.current_company_id())
  )
  WITH CHECK (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_COMPTABILITE'])
    AND EXISTS (SELECT 1 FROM public.fournisseurs f
      WHERE f.id = fournisseur_id AND f.entreprise_id = public.current_company_id())
  );

DROP POLICY IF EXISTS budgets_chantier_scope ON public.comptabilite_budgets;
CREATE POLICY budgets_select_scope ON public.comptabilite_budgets
  FOR SELECT TO authenticated
  USING (
    public.can_access_chantier(chantier_id)
    AND public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_COMPTABILITE'])
  );
CREATE POLICY budgets_insert_compta ON public.comptabilite_budgets
  FOR INSERT TO authenticated
  WITH CHECK (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_COMPTABILITE'])
    AND public.can_access_chantier(chantier_id)
  );
CREATE POLICY budgets_update_compta ON public.comptabilite_budgets
  FOR UPDATE TO authenticated
  USING (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_COMPTABILITE'])
    AND public.can_access_chantier(chantier_id)
  )
  WITH CHECK (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_COMPTABILITE'])
    AND public.can_access_chantier(chantier_id)
  );

-- RH : le siège RH gère les dossiers ; le conducteur consulte et saisit les opérations de terrain.
DROP POLICY IF EXISTS rh_employes_chantier_scope ON public.rh_employes;
CREATE POLICY rh_employes_select_scope ON public.rh_employes
  FOR SELECT TO authenticated
  USING (
    (public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_RH']))
    OR (
      public.current_user_has_any_role(ARRAY['CONDUCTEUR_TRAVAUX','METREUR_VERIFICATEUR','MAGASINIER'])
      AND chantier_actuel_id IS NOT NULL
      AND public.can_access_chantier(chantier_actuel_id)
    )
  );
CREATE POLICY rh_employes_insert_hr ON public.rh_employes
  FOR INSERT TO authenticated
  WITH CHECK (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_RH'])
    AND chantier_actuel_id IS NOT NULL
    AND public.can_access_chantier(chantier_actuel_id)
  );
CREATE POLICY rh_employes_update_hr ON public.rh_employes
  FOR UPDATE TO authenticated
  USING (public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_RH']))
  WITH CHECK (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_RH'])
    AND chantier_actuel_id IS NOT NULL
    AND public.can_access_chantier(chantier_actuel_id)
  );

DROP POLICY IF EXISTS rh_pointages_chantier_scope ON public.rh_pointages_journaliers;
CREATE POLICY rh_pointages_select_scope ON public.rh_pointages_journaliers
  FOR SELECT TO authenticated
  USING (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_RH'])
    OR (
      public.current_user_has_any_role(ARRAY['CONDUCTEUR_TRAVAUX'])
      AND public.can_access_chantier(chantier_id)
    )
  );
CREATE POLICY rh_pointages_insert_scope ON public.rh_pointages_journaliers
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_RH'])
      OR public.current_user_has_any_role(ARRAY['CONDUCTEUR_TRAVAUX'])
    )
    AND public.can_access_chantier(chantier_id)
  );
CREATE POLICY rh_pointages_update_scope ON public.rh_pointages_journaliers
  FOR UPDATE TO authenticated
  USING (
    (
      public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_RH'])
      OR public.current_user_has_any_role(ARRAY['CONDUCTEUR_TRAVAUX'])
    )
    AND public.can_access_chantier(chantier_id)
  )
  WITH CHECK (
    (
      public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_RH'])
      OR public.current_user_has_any_role(ARRAY['CONDUCTEUR_TRAVAUX'])
    )
    AND public.can_access_chantier(chantier_id)
  );

DROP POLICY IF EXISTS rh_conges_employe_scope ON public.rh_conges_absences;
CREATE POLICY rh_conges_select_scope ON public.rh_conges_absences
  FOR SELECT TO authenticated
  USING (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_RH'])
    OR (
      public.current_user_has_any_role(ARRAY['CONDUCTEUR_TRAVAUX'])
      AND EXISTS (SELECT 1 FROM public.rh_employes e
        WHERE e.id = employe_id AND public.can_access_chantier(e.chantier_actuel_id))
    )
  );
CREATE POLICY rh_conges_insert_scope ON public.rh_conges_absences
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_RH'])
      OR public.current_user_has_any_role(ARRAY['CONDUCTEUR_TRAVAUX'])
    )
    AND EXISTS (SELECT 1 FROM public.rh_employes e
      WHERE e.id = employe_id AND public.can_access_chantier(e.chantier_actuel_id))
  );
CREATE POLICY rh_conges_update_hr ON public.rh_conges_absences
  FOR UPDATE TO authenticated
  USING (public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_RH']))
  WITH CHECK (public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_RH']));

-- Parc matériel : visibilité du chantier, écriture centralisée.
DROP POLICY IF EXISTS materiel_engins_chantier_scope ON public.materiel_engins;
CREATE POLICY materiel_engins_select_scope ON public.materiel_engins
  FOR SELECT TO authenticated
  USING (
    (chantier_actuel_id IS NOT NULL AND public.can_access_chantier(chantier_actuel_id))
    OR (chantier_actuel_id IS NULL AND public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_MATERIEL']))
  );
CREATE POLICY materiel_engins_insert_central ON public.materiel_engins
  FOR INSERT TO authenticated
  WITH CHECK (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_MATERIEL'])
    AND (chantier_actuel_id IS NULL OR public.can_access_chantier(chantier_actuel_id))
  );
CREATE POLICY materiel_engins_update_central ON public.materiel_engins
  FOR UPDATE TO authenticated
  USING (public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_MATERIEL']))
  WITH CHECK (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_MATERIEL'])
    AND (chantier_actuel_id IS NULL OR public.can_access_chantier(chantier_actuel_id))
  );

-- Notifications : lecture par destinataire et modification limitée au statut lu.
DROP POLICY IF EXISTS notifications_recipient_scope ON public.notifications;
CREATE POLICY notifications_select_recipient ON public.notifications
  FOR SELECT TO authenticated
  USING (destinataire_id = public.current_app_user_id());
CREATE POLICY notifications_update_recipient ON public.notifications
  FOR UPDATE TO authenticated
  USING (destinataire_id = public.current_app_user_id())
  WITH CHECK (destinataire_id = public.current_app_user_id());
REVOKE UPDATE ON public.notifications FROM authenticated;
GRANT UPDATE (est_lue, date_lecture) ON public.notifications TO authenticated;

-- Sessions : le propriétaire peut consulter et révoquer, pas réécrire un jeton.
DROP POLICY IF EXISTS user_sessions_own_scope ON public.user_sessions;
CREATE POLICY user_sessions_select_own ON public.user_sessions
  FOR SELECT TO authenticated USING (utilisateur_id = public.current_app_user_id());
CREATE POLICY user_sessions_delete_own ON public.user_sessions
  FOR DELETE TO authenticated USING (utilisateur_id = public.current_app_user_id());

-- Audit : journal non modifiable depuis le client ; insertion uniquement sous sa propre identité.
DROP POLICY IF EXISTS audit_logs_chantier_scope ON public.audit_logs;
CREATE POLICY audit_logs_select_admin ON public.audit_logs
  FOR SELECT TO authenticated USING (public.is_company_admin());
CREATE POLICY audit_logs_insert_self ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    utilisateur_id = public.current_app_user_id()
    AND (chantier_id IS NULL AND public.is_company_admin()
      OR chantier_id IS NOT NULL AND public.can_access_chantier(chantier_id))
  );

-- Données commerciales et dossiers juridiques : rôles centraux dédiés uniquement.
DROP POLICY IF EXISTS commercial_lots_chantier_scope ON public.commercial_programmes_lots;
CREATE POLICY commercial_lots_select_scope ON public.commercial_programmes_lots
  FOR SELECT TO authenticated
  USING (public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_COMMERCIAL']));
CREATE POLICY commercial_lots_write_central ON public.commercial_programmes_lots
  FOR ALL TO authenticated
  USING (public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_COMMERCIAL']))
  WITH CHECK (public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_COMMERCIAL']));

DROP POLICY IF EXISTS commercial_reservations_scope ON public.commercial_reservations_vefa;
CREATE POLICY commercial_reservations_select_central ON public.commercial_reservations_vefa
  FOR SELECT TO authenticated
  USING (public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_COMMERCIAL']));
CREATE POLICY commercial_reservations_write_central ON public.commercial_reservations_vefa
  FOR ALL TO authenticated
  USING (public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_COMMERCIAL']))
  WITH CHECK (public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_COMMERCIAL']));

DROP POLICY IF EXISTS commercial_clients_reservation_scope ON public.commercial_clients;
CREATE POLICY commercial_clients_select_central ON public.commercial_clients
  FOR SELECT TO authenticated
  USING (public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_COMMERCIAL']));
CREATE POLICY commercial_clients_write_central ON public.commercial_clients
  FOR ALL TO authenticated
  USING (public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_COMMERCIAL']))
  WITH CHECK (public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_COMMERCIAL']));

DROP POLICY IF EXISTS juridique_dossiers_scope ON public.juridique_dossiers;
CREATE POLICY juridique_dossiers_select_scope ON public.juridique_dossiers
  FOR SELECT TO authenticated
  USING (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_JURIDIQUE'])
    AND (chantier_id IS NULL OR public.can_access_chantier(chantier_id))
  );
CREATE POLICY juridique_dossiers_write_central ON public.juridique_dossiers
  FOR ALL TO authenticated
  USING (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_JURIDIQUE'])
    AND (chantier_id IS NULL OR public.can_access_chantier(chantier_id))
  )
  WITH CHECK (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_JURIDIQUE'])
    AND (chantier_id IS NULL OR public.can_access_chantier(chantier_id))
  );

-- Les comptes bancaires sont réservés à la comptabilité et à l'administration.
DROP POLICY IF EXISTS comptes_bancaires_company_scope ON public.comptes_bancaires;
CREATE POLICY comptes_bancaires_select_scope ON public.comptes_bancaires
  FOR SELECT TO authenticated
  USING (
    entreprise_id = public.current_company_id()
    AND (
      public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_COMPTABILITE'])
      OR (chantier_dedie_id IS NOT NULL AND public.can_access_chantier(chantier_dedie_id))
    )
  );
CREATE POLICY comptes_bancaires_write_central ON public.comptes_bancaires
  FOR ALL TO authenticated
  USING (
    entreprise_id = public.current_company_id()
    AND public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_COMPTABILITE'])
  )
  WITH CHECK (
    entreprise_id = public.current_company_id()
    AND public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_COMPTABILITE'])
    AND (chantier_dedie_id IS NULL OR public.can_access_chantier(chantier_dedie_id))
  );

-- Paramètres : lecture par les comptes actifs de l'entreprise, modification par admin.
DROP POLICY IF EXISTS parametres_company_scope ON public.parametres_generaux;
CREATE POLICY parametres_select_company ON public.parametres_generaux
  FOR SELECT TO authenticated USING (entreprise_id = public.current_company_id());
CREATE POLICY parametres_update_admin ON public.parametres_generaux
  FOR UPDATE TO authenticated
  USING (entreprise_id = public.current_company_id() AND public.is_company_admin())
  WITH CHECK (entreprise_id = public.current_company_id() AND public.is_company_admin());

-- Protection supplémentaire contre les affectations inter-entreprises.
DROP POLICY IF EXISTS utilisateur_chantiers_write_admin ON public.utilisateur_chantiers;
CREATE POLICY utilisateur_chantiers_write_admin ON public.utilisateur_chantiers
  FOR ALL TO authenticated
  USING (
    public.is_company_admin()
    AND EXISTS (SELECT 1 FROM public.chantiers c
      WHERE c.id = utilisateur_chantiers.chantier_id AND c.entreprise_id = public.current_company_id())
    AND EXISTS (SELECT 1 FROM public.utilisateurs u
      WHERE u.id = utilisateur_chantiers.utilisateur_id AND u.entreprise_id = public.current_company_id())
  )
  WITH CHECK (
    public.is_company_admin()
    AND EXISTS (SELECT 1 FROM public.chantiers c
      WHERE c.id = utilisateur_chantiers.chantier_id AND c.entreprise_id = public.current_company_id())
    AND EXISTS (SELECT 1 FROM public.utilisateurs u
      WHERE u.id = utilisateur_chantiers.utilisateur_id AND u.entreprise_id = public.current_company_id())
  );


-- Réduction des portées sur les modèles sans entreprise_id direct : toujours
-- remonter au chantier de l'entreprise courante avant d'autoriser une ligne.

DROP POLICY IF EXISTS commercial_lots_select_scope ON public.commercial_programmes_lots;
DROP POLICY IF EXISTS commercial_lots_write_central ON public.commercial_programmes_lots;
CREATE POLICY commercial_lots_select_scope ON public.commercial_programmes_lots
  FOR SELECT TO authenticated
  USING (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_COMMERCIAL'])
    AND public.can_access_chantier(chantier_id)
  );
CREATE POLICY commercial_lots_write_central ON public.commercial_programmes_lots
  FOR ALL TO authenticated
  USING (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_COMMERCIAL'])
    AND public.can_access_chantier(chantier_id)
  )
  WITH CHECK (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_COMMERCIAL'])
    AND public.can_access_chantier(chantier_id)
  );

DROP POLICY IF EXISTS commercial_reservations_select_central ON public.commercial_reservations_vefa;
DROP POLICY IF EXISTS commercial_reservations_write_central ON public.commercial_reservations_vefa;
CREATE POLICY commercial_reservations_select_central ON public.commercial_reservations_vefa
  FOR SELECT TO authenticated
  USING (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_COMMERCIAL'])
    AND EXISTS (SELECT 1 FROM public.commercial_programmes_lots b
      WHERE b.id = bien_id AND public.can_access_chantier(b.chantier_id))
  );
CREATE POLICY commercial_reservations_write_central ON public.commercial_reservations_vefa
  FOR ALL TO authenticated
  USING (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_COMMERCIAL'])
    AND EXISTS (SELECT 1 FROM public.commercial_programmes_lots b
      WHERE b.id = bien_id AND public.can_access_chantier(b.chantier_id))
  )
  WITH CHECK (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_COMMERCIAL'])
    AND EXISTS (SELECT 1 FROM public.commercial_programmes_lots b
      WHERE b.id = bien_id AND public.can_access_chantier(b.chantier_id))
  );

DROP POLICY IF EXISTS commercial_clients_select_central ON public.commercial_clients;
DROP POLICY IF EXISTS commercial_clients_write_central ON public.commercial_clients;
CREATE POLICY commercial_clients_select_central ON public.commercial_clients
  FOR SELECT TO authenticated
  USING (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_COMMERCIAL'])
    AND EXISTS (
      SELECT 1 FROM public.commercial_reservations_vefa r
      JOIN public.commercial_programmes_lots b ON b.id = r.bien_id
      WHERE r.client_id = commercial_clients.id
        AND public.can_access_chantier(b.chantier_id)
    )
  );
CREATE POLICY commercial_clients_write_central ON public.commercial_clients
  FOR ALL TO authenticated
  USING (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_COMMERCIAL'])
    AND EXISTS (
      SELECT 1 FROM public.commercial_reservations_vefa r
      JOIN public.commercial_programmes_lots b ON b.id = r.bien_id
      WHERE r.client_id = commercial_clients.id
        AND public.can_access_chantier(b.chantier_id)
    )
  )
  WITH CHECK (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_COMMERCIAL'])
    AND EXISTS (
      SELECT 1 FROM public.commercial_reservations_vefa r
      JOIN public.commercial_programmes_lots b ON b.id = r.bien_id
      WHERE r.client_id = commercial_clients.id
        AND public.can_access_chantier(b.chantier_id)
    )
  );

DROP POLICY IF EXISTS juridique_dossiers_select_scope ON public.juridique_dossiers;
DROP POLICY IF EXISTS juridique_dossiers_write_central ON public.juridique_dossiers;
CREATE POLICY juridique_dossiers_select_scope ON public.juridique_dossiers
  FOR SELECT TO authenticated
  USING (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_JURIDIQUE'])
    AND chantier_id IS NOT NULL
    AND public.can_access_chantier(chantier_id)
  );
CREATE POLICY juridique_dossiers_write_central ON public.juridique_dossiers
  FOR ALL TO authenticated
  USING (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_JURIDIQUE'])
    AND chantier_id IS NOT NULL
    AND public.can_access_chantier(chantier_id)
  )
  WITH CHECK (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_JURIDIQUE'])
    AND chantier_id IS NOT NULL
    AND public.can_access_chantier(chantier_id)
  );

-- Les journaux globaux sont filtrés par l'entreprise du propriétaire, y compris
-- lorsque le journal n'est rattaché à aucun chantier.
DROP POLICY IF EXISTS audit_logs_select_admin ON public.audit_logs;
CREATE POLICY audit_logs_select_admin ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    public.is_company_admin()
    AND (
      (chantier_id IS NOT NULL AND public.can_access_chantier(chantier_id))
      OR (chantier_id IS NULL AND EXISTS (
        SELECT 1 FROM public.utilisateurs u
        WHERE u.id = audit_logs.utilisateur_id
          AND u.entreprise_id = public.current_company_id()
      ))
    )
  );

-- Les documents sans chantier sont privés à leur auteur ; les documents chantier
-- restent visibles dans le périmètre du chantier.
DROP POLICY IF EXISTS documents_ged_scope ON public.documents_ged;
CREATE POLICY documents_ged_select_scope ON public.documents_ged
  FOR SELECT TO authenticated
  USING (
    (chantier_id IS NOT NULL AND public.can_access_chantier(chantier_id))
    OR (chantier_id IS NULL AND auteur_id = public.current_app_user_id())
  );
CREATE POLICY documents_ged_insert_scope ON public.documents_ged
  FOR INSERT TO authenticated
  WITH CHECK (
    auteur_id = public.current_app_user_id()
    AND (chantier_id IS NULL OR public.can_access_chantier(chantier_id))
  );
CREATE POLICY documents_ged_update_author ON public.documents_ged
  FOR UPDATE TO authenticated
  USING (
    auteur_id = public.current_app_user_id()
    OR (public.is_company_admin() AND chantier_id IS NOT NULL AND public.can_access_chantier(chantier_id))
  )
  WITH CHECK (
    auteur_id = public.current_app_user_id()
    OR (public.is_company_admin() AND chantier_id IS NOT NULL AND public.can_access_chantier(chantier_id))
  );

-- Les historiques d'affectation RH sont visibles par RH/admin et le conducteur
-- concerné dans son chantier, sans exposition aux autres rôles de terrain.
DROP POLICY IF EXISTS rh_affectations_chantier_scope ON public.rh_affectations_historique;
CREATE POLICY rh_affectations_select_scope ON public.rh_affectations_historique
  FOR SELECT TO authenticated
  USING (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_RH'])
    OR (public.current_user_has_any_role(ARRAY['CONDUCTEUR_TRAVAUX']) AND public.can_access_chantier(chantier_id))
  );
CREATE POLICY rh_affectations_write_hr ON public.rh_affectations_historique
  FOR ALL TO authenticated
  USING (public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_RH']))
  WITH CHECK (public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_RH']));

-- Les opérations d'entretien et les pièces du parc ne peuvent être modifiées
-- que par le responsable matériel / administrateur.
DROP POLICY IF EXISTS materiel_entretiens_parent_scope ON public.materiel_entretiens;
CREATE POLICY materiel_entretiens_select_parent ON public.materiel_entretiens
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.materiel_engins m
    WHERE m.id = materiel_id
      AND ((m.chantier_actuel_id IS NOT NULL AND public.can_access_chantier(m.chantier_actuel_id))
        OR (m.chantier_actuel_id IS NULL AND public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_MATERIEL'])))));
CREATE POLICY materiel_entretiens_write_central ON public.materiel_entretiens
  FOR ALL TO authenticated
  USING (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_MATERIEL'])
    AND EXISTS (SELECT 1 FROM public.materiel_engins m WHERE m.id = materiel_id)
  )
  WITH CHECK (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_MATERIEL'])
    AND EXISTS (SELECT 1 FROM public.materiel_engins m WHERE m.id = materiel_id)
  );

DROP POLICY IF EXISTS materiel_pieces_parent_scope ON public.materiel_pieces_remplacables;
CREATE POLICY materiel_pieces_select_parent ON public.materiel_pieces_remplacables
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.materiel_engins m
    WHERE m.id = materiel_id
      AND ((m.chantier_actuel_id IS NOT NULL AND public.can_access_chantier(m.chantier_actuel_id))
        OR (m.chantier_actuel_id IS NULL AND public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_MATERIEL'])))));
CREATE POLICY materiel_pieces_write_central ON public.materiel_pieces_remplacables
  FOR ALL TO authenticated
  USING (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_MATERIEL'])
    AND EXISTS (SELECT 1 FROM public.materiel_engins m WHERE m.id = materiel_id)
  )
  WITH CHECK (
    public.current_user_has_any_role(ARRAY['ADMINISTRATEUR','RESPONSABLE_MATERIEL'])
    AND EXISTS (SELECT 1 FROM public.materiel_engins m WHERE m.id = materiel_id)
  );
