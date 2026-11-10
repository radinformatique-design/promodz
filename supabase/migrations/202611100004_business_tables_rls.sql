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
