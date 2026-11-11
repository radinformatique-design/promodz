# Configuration Supabase — BatiProm

## 1. Créer le projet Supabase
1. Créer un projet PostgreSQL dans Supabase.
2. Récupérer l'URL du projet et la clé publishable (ou anon) dans **Project Settings → API**.
3. Configurer les variables locales à partir de `.env.example`. Ne jamais exposer une clé `service_role`.

## 1 bis. URLs d'authentification
Dans **Authentication → URL Configuration** de Supabase :
- définir le Site URL sur l'URL de l'application ;
- ajouter `http://localhost:3000/auth/callback` et `http://localhost:3000/auth/reset-password` aux Redirect URLs en développement ;
- ajouter les deux chemins équivalents sur le domaine HTTPS de production.

Renseigner `NEXT_PUBLIC_APP_URL` avec l'URL de l'environnement courant. Les invitations et les liens de récupération utilisent ces URL.

## 2. Installer et créer les tables
```bash
npm install
npx prisma generate
npx prisma db push
```

Les 31 modèles métier initiaux sont conservés. Les trois modèles de caisse de fonds de roulement ajoutés à l'évolution précédente portent le total du schéma à 34 modèles. La migration RBAC 007 ajoute uniquement une colonne de rattachement sur le modèle `Role` : aucun modèle métier existant n'est supprimé ni remplacé. Pour les environnements durables, convertir ensuite les changements de schéma en migrations versionnées avec `npx prisma migrate dev --name init` puis déployer avec `npx prisma migrate deploy`.

## 3. Activer les politiques RLS
Après `npx prisma db push`, exécuter dans le SQL Editor Supabase les scripts de `supabase/migrations/` dans l'ordre numérique : `001` à `007`.

- `001` : Auth, profils, entreprise et affectations.
- `002` : accès central aux chantiers de l'entreprise.
- `003` : rattachement des fournisseurs à l'entreprise.
- `004` : politiques métier pour achats, RH, matériel, comptabilité, commercial, juridique, notifications, documents et audit.
- `005` : clés entreprise explicites pour les données qui peuvent ne pas être rattachées à un chantier.
- `006` : politiques RLS des caisses chantier, mouvements, demandes de réapprovisionnement et droits dédiés.
- `007` : rôles personnalisés par entreprise, affectations de permissions limitées à ces rôles et validation du rôle lié à chaque profil utilisateur.

Les migrations `003` et `005` s'arrêtent volontairement si elles trouvent des lignes sans entreprise. La base cible étant neuve, ce contrôle doit réussir après `prisma db push`. Sur une base déjà alimentée, il faut d'abord attribuer les bons `entreprise_id` aux lignes concernées.

Les politiques couvrent les tables métier présentes dans les migrations, y compris les trois nouvelles tables de caisse (le schéma Prisma comporte maintenant 34 modèles). Cela ne remplace pas les contrôles des Route Handlers Prisma : une connexion Prisma directe ne reprend pas automatiquement le JWT Supabase et contourne donc le RLS de la session. Avant la production, tester les deux voies (Supabase/PostgREST et API Prisma) avec au moins deux entreprises et plusieurs rôles/chantiers.

## 4. Créer le premier administrateur
1. Dans **Authentication → Users**, créer le compte administrateur avec son adresse e-mail.
2. Ouvrir `supabase/bootstrap-first-admin.sql`, remplacer les champs `REPLACE_*` par les informations réelles de l'entreprise et l'UUID Auth du compte.
3. Exécuter le script une seule fois dans le SQL Editor Supabase. Il vérifie l'existence de l'UUID Auth et la correspondance de l'e-mail, puis crée l'entreprise, le rôle administrateur, le profil et les paramètres DZD.
4. Exécuter ensuite `supabase/bootstrap-system-rbac.sql` pour créer les 10 rôles métier complémentaires, les 110 permissions et leur matrice initiale. Le rôle administrateur est présent et dispose de toutes les permissions.
5. Ne pas lancer `npm run prisma:seed` en production : ce seed facultatif insère des données de démonstration.


## 5. Connexion Prisma
- `DATABASE_URL` : chaîne de connexion pooler Supabase pour l'application.
- `DIRECT_URL` : chaîne directe réservée aux opérations de migration.
- Les mots de passe de connexion sont stockés uniquement dans les variables d'environnement locales / du fournisseur d'hébergement.

## État de cette étape
Le SDK Supabase SSR, les clients navigateur/serveur, le lien de profil `auth_user_id`, le flux de récupération de mot de passe, les scripts de bootstrap et les politiques RLS des 34 modèles sont ajoutés. La migration 007 permet la personnalisation RBAC sans écrire dans les modèles globaux. Plusieurs API métier sont connectées à Prisma avec contrôles de rôle et de périmètre ; les autres écrans et opérations doivent encore être migrés et testés. Prisma utilise une connexion PostgreSQL distincte et ne bénéficie pas automatiquement des politiques RLS de la session Supabase.


## API métier ajoutées sur cette branche
- `GET/POST/PATCH/DELETE /api/approvisionnements/fournisseurs` : fournisseurs limités à l'entreprise, modifiables par l'administrateur ou le responsable approvisionnements.
- `GET/POST/PATCH /api/approvisionnements/demandes` : demandes d'achat et notification des administrateurs centraux.
- `GET/POST/PATCH /api/approvisionnements/commandes` : bons de commande ; émission réservée à l'administrateur ou au responsable approvisionnements.
- `GET/POST /api/approvisionnements/receptions` : réceptions rattachées à un bon de commande et à un chantier accessible.
- `GET/POST/PATCH /api/approvisionnements/factures` : factures fournisseurs et statut de règlement.
- `GET/PUT /api/comptabilite/budgets` : budgets par chantier et exercice, modifiables par l'administrateur ou le responsable comptabilité.
- `GET/POST/PATCH/DELETE /api/rh/employes` : dossiers du personnel, écriture réservée à l'administrateur ou au responsable RH.
- `GET/POST /api/rh/pointages` et `GET/POST/PATCH /api/rh/conges` : saisie chantier et validation RH selon le rôle.
- `GET/PATCH /api/notifications` : notifications du seul utilisateur connecté.
- `GET/POST /api/audit-logs` : journal d'audit lié à l'utilisateur courant.
- `GET/POST/PUT /api/caisse` et `GET/POST/PATCH /api/caisse/demandes` : fonds de roulement, plafonds, sorties, réapprovisionnements et validations.
- `GET/POST/PATCH/DELETE /api/materiel/parc`, `GET/POST /api/materiel/entretiens`, `GET/POST/PATCH /api/materiel/pieces` : parc, entretiens et pièces remplaçables.
- `POST /api/admin/users/invite` : création du compte Auth et envoi d'une invitation par e-mail.

Les routes contrôlent l'identité Supabase et filtrent les enregistrements Prisma par entreprise et/ou chantier. Elles doivent encore faire l'objet de tests d'intégration sur une base de test avant mise en production. Le suivi des paiements de factures reste un statut simple ; aucun échéancier ni historique détaillé de règlements n'est encore modélisé.


### Rôles centraux autorisés par module
- Approvisionnements : `RESPONSABLE_APPROVISIONNEMENTS` ou `ADMINISTRATEUR`.
- Comptabilité / budgets / factures : `RESPONSABLE_COMPTABILITE` ou `ADMINISTRATEUR`.
- Parc matériel : `RESPONSABLE_MATERIEL` ou `ADMINISTRATEUR`.
- RH : `RESPONSABLE_RH` ou `ADMINISTRATEUR`; les pointages et demandes de congé peuvent être saisis par le conducteur de travaux de son chantier.
- Commercial : `RESPONSABLE_COMMERCIAL` ou `ADMINISTRATEUR`.
- Juridique : `RESPONSABLE_JURIDIQUE` ou `ADMINISTRATEUR`.

Les rôles sans `entreprise_id` sont des modèles système globaux en lecture seule. Un administrateur peut créer une copie entreprise d'un modèle ; les utilisateurs de cette entreprise affectés au rôle basculent vers cette copie. La matrice des permissions est alors enregistrée en PostgreSQL pour cette seule entreprise. Le catalogue des permissions (module/action) reste un référentiel système global en lecture seule : l'administrateur gère les attributions de permissions par rôle, pas la définition des actions communes.


## Caisse de fonds de roulement par chantier

Le modèle ajoute une caisse par chantier avec un plafond défini par le siège. Le solde est calculé à partir des mouvements, et non saisi manuellement :
- `APPROVISIONNEMENT` augmente le solde ; réservé au siège / comptabilité.
- `SORTIE` diminue le solde ; réservée aux utilisateurs chantier disposant de la permission `CAISSE / SORTIR`.
- Le solde ne peut pas devenir négatif ni dépasser le plafond.
- Chaque sortie déclenche une notification vers les administrateurs centraux et le responsable comptabilité.
- Une demande de réapprovisionnement peut être émise depuis le chantier ; le siège peut l'approuver ou la refuser. Une approbation crée le mouvement d'approvisionnement dans la même transaction PostgreSQL.

### API caisse
- `GET /api/caisse` : caisses visibles, solde calculé, derniers mouvements et demandes.
- `PUT /api/caisse` : création ou modification du plafond par le siège habilité.
- `POST /api/caisse` : sortie ou approvisionnement, avec contrôle de solde et plafond.
- `GET/POST/PATCH /api/caisse/demandes` : consultation, demande et décision du siège.

Après mise à jour de la branche, exécuter `npx prisma db push` avant d'appliquer les nouvelles migrations SQL. Appliquer ensuite `202611100006_cash_fund_rls.sql` puis `202611100007_tenant_rbac.sql` dans cet ordre. Si `bootstrap-system-rbac.sql` a déjà été exécuté, le relancer pour ajouter les permissions CAISSE et attribuer le catalogue complet aux rôles administrateurs propres à chaque entreprise.


### Caisse de fonds de roulement
- Le siège / comptabilité crée la caisse d'un chantier et fixe son plafond.
- Le conducteur de travaux peut enregistrer une sortie si son rôle possède `CAISSE / SORTIR`.
- Le conducteur peut envoyer une demande de réapprovisionnement (`CAISSE / DEMANDER`).
- Le responsable comptabilité peut approuver/refuser (`TRAITER_DEMANDE`) et approvisionner (`APPROVISIONNER`).
- Chaque sortie et demande génère une notification vers les responsables centraux concernés. Le solde est recalculé à partir des mouvements ; les transactions de sortie verrouillent la ligne de caisse pour éviter les dépassements concurrents.

 
### Invitations de nouveaux utilisateurs
Pour utiliser le bouton **Créer un utilisateur** dans Administration, configurer `SUPABASE_AUTH_ADMIN_KEY` dans l'environnement serveur de l'application avec une clé Supabase privée autorisée à gérer Auth. Cette variable doit rester strictement côté serveur : ne jamais la préfixer par `NEXT_PUBLIC_`, ne jamais la placer dans le code client et ne jamais la committer avec une vraie valeur.

L'API `POST /api/admin/users/invite` vérifie d'abord la session et le rôle administrateur, envoie une invitation par e-mail via Supabase Auth, puis crée le profil métier et ses affectations. Le lien d'invitation passe par `/auth/callback` et dirige l'utilisateur vers la définition de son mot de passe. Si la création du profil échoue après l'invitation, l'API tente de supprimer le compte Auth créé pour éviter un compte orphelin.
