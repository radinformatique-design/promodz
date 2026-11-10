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
│   ├── schema.prisma    # Modélisation PostgreSQL (28+ tables relationnelles)
│   └── seed.ts          # Script d'importation des données démo dans PostgreSQL
├── services/            # Services métier (RBAC, Audit, Sécurité, Matériel)
├── types/               # Typage TypeScript BTP complet
├── views/               # Vues métiers (Chantiers, RH, Appro, Matériel, VEFA...)
└── .env                 # Variables d'environnement & connexion PostgreSQL
```

---

## 🚀 Démarrage Rapide

### 1. Configuration de PostgreSQL
Dans le fichier `.env`, configurez votre chaîne de connexion PostgreSQL :
```env
DATABASE_URL="postgresql://utilisateur:mot_de_passe@localhost:5432/batiprom_db?schema=public"
```

### 2. Déployer les tables sur PostgreSQL
Pour créer automatiquement les tables et relations dans votre base PostgreSQL :
```bash
npx prisma db push
```

### 3. Remplir avec les données démo (Seed)
```bash
npm run prisma:seed
```

### 4. Lancer le serveur de développement
```bash
npm run dev
```
L'application sera accessible sur [http://localhost:3000](http://localhost:3000).

### 5. Compiler pour la production
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

### Premier utilisateur
Créez le compte dans **Supabase → Authentication → Users**, puis créez le profil dans les tables `entreprises`, `roles`, `utilisateurs` et renseignez `auth_user_id` avec l'UUID Auth. Pour ajouter d'autres profils depuis l'API d'administration, le compte Auth correspondant doit déjà exister ; l'API crée ensuite le profil métier et ses affectations.

### Limites de cette première tranche
Le schéma comprend 31 modèles, mais toutes les tables métier ne disposent pas encore de politiques RLS ni de Route Handlers CRUD sécurisés. Prisma utilise une connexion PostgreSQL indépendante de la session Supabase : les politiques RLS ne remplacent donc pas les contrôles d'accès explicites dans chaque API Prisma. Ne déployez pas en production avant d'avoir terminé ces contrôles et exécuté les tests multi-entreprises / multi-chantiers.
