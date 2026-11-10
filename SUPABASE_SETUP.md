# Configuration Supabase — BatiProm

## 1. Créer le projet Supabase
1. Créer un projet PostgreSQL dans Supabase.
2. Récupérer l'URL du projet et la clé publishable (ou anon) dans **Project Settings → API**.
3. Configurer les variables locales à partir de `.env.example`. Ne jamais exposer une clé `service_role`.

## 2. Installer et créer les tables
```bash
npm install
npx prisma generate
npx prisma db push
```

Le schéma Prisma reste la source de vérité pour les 31 modèles métier existants. Pour les environnements durables, convertir ensuite les changements de schéma en migrations versionnées avec `npx prisma migrate dev --name init` puis déployer avec `npx prisma migrate deploy`.

## 3. Activer les politiques RLS
Après `npx prisma db push`, exécuter dans le SQL Editor Supabase les scripts de `supabase/migrations/` dans l'ordre numérique : `001`, `002`, `003`, `004`, puis `005`.

- `001` : Auth, profils, entreprise et affectations.
- `002` : accès central aux chantiers de l'entreprise.
- `003` : rattachement des fournisseurs à l'entreprise.
- `004` : politiques métier pour achats, RH, matériel, comptabilité, commercial, juridique, notifications, documents et audit.
- `005` : clés entreprise explicites pour les données qui peuvent ne pas être rattachées à un chantier.

Les migrations `003` et `005` s'arrêtent volontairement si elles trouvent des lignes sans entreprise. La base cible étant neuve, ce contrôle doit réussir après `prisma db push`. Sur une base déjà alimentée, il faut d'abord attribuer les bons `entreprise_id` aux lignes concernées.

Les politiques couvrent les 31 tables actuelles du schéma. Cela ne remplace pas les contrôles des Route Handlers Prisma : une connexion Prisma directe ne reprend pas automatiquement le JWT Supabase et contourne donc le RLS de la session. Avant la production, tester les deux voies (Supabase/PostgREST et API Prisma) avec au moins deux entreprises et plusieurs rôles/chantiers.

## 4. Créer le premier administrateur
1. Dans **Authentication → Users**, créer le compte administrateur avec son adresse e-mail.
2. Ouvrir `supabase/bootstrap-first-admin.sql`, remplacer les champs `REPLACE_*` par les informations réelles de l'entreprise et l'UUID Auth du compte.
3. Exécuter le script une seule fois dans le SQL Editor Supabase. Il vérifie l'existence de l'UUID Auth et la correspondance de l'e-mail, puis crée l'entreprise, le rôle administrateur, le profil et les paramètres DZD.
4. Exécuter ensuite `supabase/bootstrap-system-rbac.sql` pour créer les 10 rôles métier complémentaires, les 98 permissions et leur matrice initiale. Le rôle administrateur est présent et dispose de toutes les permissions.
5. Ne pas lancer `npm run prisma:seed` en production : ce seed facultatif insère des données de démonstration.


## 5. Connexion Prisma
- `DATABASE_URL` : chaîne de connexion pooler Supabase pour l'application.
- `DIRECT_URL` : chaîne directe réservée aux opérations de migration.
- Les mots de passe de connexion sont stockés uniquement dans les variables d'environnement locales / du fournisseur d'hébergement.

## État de cette étape
Le SDK Supabase SSR, les clients navigateur/serveur, le lien de profil `auth_user_id`, le flux de récupération de mot de passe, les scripts de bootstrap et les politiques RLS des 31 tables sont ajoutés. Plusieurs API métier sont connectées à Prisma avec contrôles de rôle et de périmètre ; les autres écrans et opérations doivent encore être migrés et testés. Prisma utilise une connexion PostgreSQL distincte et ne bénéficie pas automatiquement des politiques RLS de la session Supabase.


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

Les routes contrôlent l'identité Supabase et filtrent les enregistrements Prisma par entreprise et/ou chantier. Elles doivent encore faire l'objet de tests d'intégration sur une base de test avant mise en production. Le suivi des paiements de factures reste un statut simple ; aucun échéancier ni historique détaillé de règlements n'est encore modélisé.


### Rôles centraux autorisés par module
- Approvisionnements : `RESPONSABLE_APPROVISIONNEMENTS` ou `ADMINISTRATEUR`.
- Comptabilité / budgets / factures : `RESPONSABLE_COMPTABILITE` ou `ADMINISTRATEUR`.
- Parc matériel : `RESPONSABLE_MATERIEL` ou `ADMINISTRATEUR`.
- RH : `RESPONSABLE_RH` ou `ADMINISTRATEUR`; les pointages et demandes de congé peuvent être saisis par le conducteur de travaux de son chantier.
- Commercial : `RESPONSABLE_COMMERCIAL` ou `ADMINISTRATEUR`.
- Juridique : `RESPONSABLE_JURIDIQUE` ou `ADMINISTRATEUR`.

Les rôles et permissions sont des modèles système globaux. Les administrateurs d'entreprise ne peuvent pas encore modifier le catalogue partagé. Les droits sont appliqués dans les API couvertes et les politiques RLS correspondantes ; la migration du catalogue RBAC vers des rôles personnalisés par entreprise reste une étape distincte.
