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

## 3. Activer les premières politiques RLS
Après création des tables, exécuter le SQL de `supabase/migrations/202611100001_auth_profiles_and_rls.sql` dans le SQL Editor Supabase.

> Attention : cette première migration sécurise les tables d'identité, d'entreprise, de chantiers et d'affectations. Elle ne constitue pas encore la matrice RLS exhaustive des 31 tables. Avant la mise en production, appliquer des politiques équivalentes à chaque table métier et vérifier les accès depuis des comptes de test de deux entreprises et de plusieurs chantiers.

## 4. Créer le premier administrateur
1. Dans **Authentication → Users**, créer le compte administrateur avec son adresse e-mail.
2. Créer l'entreprise, le rôle administrateur et le profil métier dans les tables `entreprises`, `roles` et `utilisateurs`.
3. Renseigner `utilisateurs.auth_user_id` avec l'UUID du compte créé dans Supabase Auth.
4. Créer les permissions et les lignes `role_permissions` nécessaires.
5. Ne pas créer d'utilisateur de démonstration automatiquement en production.

## 5. Connexion Prisma
- `DATABASE_URL` : chaîne de connexion pooler Supabase pour l'application.
- `DIRECT_URL` : chaîne directe réservée aux opérations de migration.
- Les mots de passe de connexion sont stockés uniquement dans les variables d'environnement locales / du fournisseur d'hébergement.

## État de cette étape
Le SDK Supabase SSR, les clients navigateur/serveur, le lien de profil `auth_user_id`, le fichier d'environnement exemple et une première base RLS sont ajoutés. Les services UI et tous les Route Handlers doivent encore être migrés vers des opérations serveur authentifiées ; Prisma utilise une connexion PostgreSQL distincte et ne bénéficie pas automatiquement des politiques RLS de la session Supabase.
