# BatiProm Algérie — Next.js & PostgreSQL ERP

Système ERP de gouvernance et gestion multi-chantiers pour promoteurs immobiliers en Algérie, migré vers **Next.js 15 (App Router)**, **React 19**, **Tailwind CSS v4** et **PostgreSQL (Prisma ORM)**.

---

## 🏗️ Architecture Technique

- **Frontend & SSR :** Next.js 15 (App Router, Server & Client Components) + React 19
- **Style :** Tailwind CSS v4
- **Composants d'icônes :** Lucide React
- **Base de données :** PostgreSQL
- **ORM & Typage DB :** Prisma ORM v6
- **API Backend :** Next.js Route Handlers (`app/api/*`) remplaçant le serveur Express

---

## 📁 Structure du Projet

```text
promotedz-next/
├── app/
│   ├── api/
│   │   ├── chantiers/route.ts
│   │   ├── materiel/parc/route.ts
│   │   └── rh/employes/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/          # Composants réutilisables (Header, Sidebar, Search, etc.)
├── context/             # AppContext & State de l'application
├── data/                # Schémas et données initiales BTP Algérie
├── lib/
│   └── prisma.ts        # Singleton Prisma Client pour Next.js
├── prisma/
│   ├── schema.prisma    # Modélisation PostgreSQL (34 modèles métier Prisma)
│   └── seed.ts          # Script d'importation des données démo dans PostgreSQL
├── services/            # Services métier (RBAC, Audit, Sécurité, Matériel)
├── types/               # Typage TypeScript BTP complet
├── views/               # Vues métiers (Chantiers, RH, Appro, Matériel, VEFA...)
└── .env                 # Variables d'environnement & connexion PostgreSQL
```

---

## 🚀 Installation et démarrage

### 1. Préparer l'environnement Supabase
Copier `.env.example` vers `.env.local`, puis renseigner les valeurs du projet Supabase et les chaînes PostgreSQL dans le fichier local. Ne jamais committer `.env.local`, un mot de passe ou une clé privée.

### 2. Installer et générer Prisma
```bash
npm install
npx prisma generate
```

### 3. Créer le schéma sur un projet Supabase neuf
```bash
npx prisma db push
```
Exécuter ensuite, dans l'ordre, les migrations SQL `supabase/migrations/202611100001_*.sql` à `202611100007_*.sql`, puis suivre [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) pour le premier administrateur et le catalogue RBAC.

### 4. Données de démonstration (facultatif, développement uniquement)
```bash
npm run prisma:seed
```
Ne pas exécuter ce seed sur une base de production : les données de démonstration ne sont pas nécessaires au fonctionnement normal de l'application.

### 5. Lancer l'application
```bash
npm run dev
```
L'application sera accessible sur [http://localhost:3000](http://localhost:3000).

### 6. Compiler pour la production
```bash
npm run build
npm run start
```


---

## Supabase Auth & données réelles

La branche `feature/supabase-auth-foundation` prépare la connexion à Supabase :

- Authentification e-mail / mot de passe avec Supabase Auth et cookies SSR.
- Liaison du profil métier `utilisateurs.auth_user_id` avec l'UUID Supabase Auth.
- API de profil `GET /api/auth/me`.
- API d'administration des profils `/api/admin/users` et de la matrice RBAC `/api/admin/rbac`.
- Chargement des données de l'entreprise, des chantiers et des employés depuis PostgreSQL.
- Les API chantiers, employés et parc matériel ne retournent plus les données de démonstration en cas de base vide ou d'erreur.
- Les données de démonstration ne sont plus initialisées dans le contexte client ; le seed reste facultatif.

### Configuration
Consultez [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) et copiez `.env.example` vers `.env.local`.

Après avoir ajouté les variables, exécutez :
```bash
npm install
npx prisma generate
npx prisma db push
```

Puis exécutez les scripts SQL dans `supabase/migrations/` dans l'ordre indiqué.

### Premier administrateur
Créez le compte dans **Supabase → Authentication → Users**, puis exécutez `supabase/bootstrap-first-admin.sql` après avoir remplacé ses champs `REPLACE_*` par les informations de l'entreprise et l'UUID Auth. Exécutez ensuite `supabase/bootstrap-system-rbac.sql` pour initialiser les modèles de rôles et le catalogue des permissions. Les invitations ultérieures sont envoyées depuis l'administration via Supabase Auth.

### Limites de cette première tranche
Les 31 modèles métier initiaux sont conservés ; les trois modèles de caisse portent le total à 34. Les migrations RLS 001 à 008 activent des politiques sur les 34 tables. Prisma utilise une connexion PostgreSQL indépendante de la session Supabase : les politiques RLS ne remplacent donc pas les contrôles d'accès explicites dans chaque API Prisma. Ne déployez pas en production avant d'avoir terminé ces contrôles et exécuté `supabase/tests/rls_tenant_isolation.sql` sur un projet de test, puis les tests d'intégration API Prisma multi-entreprises / multi-chantiers.


### Extension des modules connectés à PostgreSQL

La branche de préparation ajoute aussi les API sécurisées suivantes :
- Approvisionnements : fournisseurs, demandes d'achat, bons de commande, réceptions et factures.
- RH : dossiers employés, pointages et congés/absences.
- Parc : matériels, entretiens et pièces remplaçables.
- Comptabilité : budgets de chantier.
- Notifications et journal d'audit persisté.
- Bootstrap de la première entreprise et du premier administrateur, puis catalogue système des rôles et permissions.

Pour les étapes d'installation et les scripts SQL, suivre exclusivement [SUPABASE_SETUP.md](./SUPABASE_SETUP.md). Le schéma reste à synchroniser avec `npx prisma db push`, puis les migrations RLS `001` à `007` sont à exécuter dans l'ordre. Les modèles de rôles globaux sont en lecture seule ; les copies personnalisées et leurs affectations de permissions sont isolées par entreprise. Le workflow GitHub Actions vérifie la génération Prisma et la compilation Next.js ; aucune connexion à une base de production n'est requise pendant ce contrôle.

Les modèles système RBAC globaux restent en lecture seule ; les copies personnalisées par entreprise, leur matrice de permissions persistante et leur réinitialisation sont disponibles dans Administration. La migration 008 ajoute des contraintes inter-entreprises sur les rôles, les affectations et les responsables de chantier, et la désactivation utilisateur suspend aussi l'identité Supabase Auth. Les API CRUD des modules encore non connectés et les tests d'intégration multi-entreprises / multi-chantiers restent à réaliser avant la mise en production.


### Vérification RLS

Après les migrations 001 à 008, exécuter `supabase/tests/rls_tenant_isolation.sql` dans le SQL Editor d’un projet de test. Le script vérifie l’isolation de deux entreprises et de chantiers distincts, puis annule ses données avec ROLLBACK. Il ne remplace pas les tests d’intégration des Route Handlers Prisma, car la connexion Prisma directe contourne RLS.
