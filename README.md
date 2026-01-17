# Liho

Un starter React minimaliste avec file-based routing, inspiré de SvelteKit mais sans la complexité de Next.js.

## Fonctionnalités

- **File-based routing** - Les fichiers dans `src/routes/` deviennent automatiquement des routes
- **API intégrée** - Routes API avec Hono, ultra-léger (~14kb)
- **Hot reload** - Rechargement instantané en développement
- **TypeScript** - Typage statique inclus
- **Tailwind CSS** - Styling utilitaire prêt à l'emploi
- **Un seul process** - Frontend et API sur le même serveur

## Démarrage rapide

### Nouveau projet

```bash
# Créer un nouveau projet Liho
npx create-liho mon-app

# Aller dans le dossier
cd mon-app

# Installer les dépendances
npm install

# Lancer en développement
npm run dev

# Ouvrir http://localhost:4010
```

### Projet existant

```bash
# Installation des dépendances
npm install

# Lancer en développement
npm run dev
```

## Structure du projet

```
liho/
├── src/
│   ├── routes/                 # Tes pages et API
│   │   ├── page.tsx            # Page d'accueil (/)
│   │   ├── layout.tsx          # Layout racine
│   │   ├── error.tsx           # Error boundary
│   │   ├── loading.tsx         # Loading state
│   │   └── api/
│   │       ├── hello.ts        # Route API /api/hello
│   │       └── middleware.ts   # Middleware API global
│   │
│   ├── components/             # Tes composants réutilisables
│   ├── lib/                    # Tes utilitaires
│   ├── _generated/             # Auto-généré (ne pas toucher)
│   ├── index.html
│   ├── main.tsx
│   └── index.css
│
├── public/                     # Assets statiques (favicon, images)
├── server.ts                   # Serveur de production
├── liho.config.ts              # Configuration du projet
└── package.json
```

## Guide de démarrage

### 1. Créer ta première page

1. Crée un dossier `dashboard/` dans `src/routes/`
2. Crée un fichier `page.tsx` dedans :

```tsx
// src/routes/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Mon Dashboard</h1>
      <p>Bienvenue !</p>
    </div>
  )
}
```

C'est tout ! Le nom du dossier devient l'URL : `/dashboard`.

### 2. Créer une page avec paramètre dynamique

Pour une route comme `/products/123`, crée cette structure :

```
src/routes/
└── products/
    └── [id]/           ← Les crochets indiquent un paramètre dynamique
        └── page.tsx
```

```tsx
// src/routes/products/[id]/page.tsx
import { useParams } from 'react-router-dom'

export default function ProductPage() {
  const { id } = useParams()

  return (
    <div className="p-8">
      <h1>Produit #{id}</h1>
    </div>
  )
}
```

Le paramètre `id` dans l'URL (`/products/42`) est récupéré via `useParams()`.

### 3. Créer une route API

Les routes API vont dans `src/routes/api/`. Tu peux organiser avec des sous-dossiers :

```
src/routes/api/
├── hello.ts            → GET /api/hello
├── products.ts         → GET/POST /api/products
└── products/
    └── [id].ts         → GET/PUT/DELETE /api/products/:id
```

**Exemple simple** - crée `src/routes/api/products.ts` :

```typescript
// src/routes/api/products.ts
import type { Context } from 'hono'

// GET /api/products
export async function GET(c: Context) {
  return c.json([
    { id: 1, name: 'Produit A' },
    { id: 2, name: 'Produit B' }
  ])
}

// POST /api/products
export async function POST(c: Context) {
  const body = await c.req.json()
  return c.json({ success: true, data: body }, 201)
}
```

**Avec paramètre** - crée `src/routes/api/products/[id].ts` :

```typescript
// src/routes/api/products/[id].ts
import type { Context } from 'hono'

// GET /api/products/42
export async function GET(c: Context) {
  const id = c.req.param('id')
  return c.json({ id, name: 'Produit trouvé' })
}

// DELETE /api/products/42
export async function DELETE(c: Context) {
  const id = c.req.param('id')
  return c.json({ deleted: id })
}
```

### 4. Appeler l'API depuis une page

```tsx
// src/routes/products/page.tsx
import { useState, useEffect } from 'react'

export default function ProductsPage() {
  const [products, setProducts] = useState([])

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(setProducts)
  }, [])

  return (
    <ul>
      {products.map(p => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  )
}
```

### 5. Navigation entre pages

```tsx
import { Link } from 'react-router-dom'

export default function Navigation() {
  return (
    <nav>
      <Link to="/">Accueil</Link>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/products">Produits</Link>
    </nav>
  )
}
```

## Commandes

| Commande | Description |
|----------|-------------|
| `npm run dev` | Lance le serveur de développement |
| `npm run build` | Build pour la production |
| `npm run preview` | Teste le build localement |
| `npm start` | Lance le serveur de production |
| `npm test` | Lance les tests |
| `npm run test:watch` | Tests en mode watch |
| `npm run test:coverage` | Tests avec couverture de code |

### Configuration

Le fichier `liho.config.ts` permet de configurer le projet :

```typescript
import { defineConfig } from './scripts/config'

export default defineConfig({
  server: {
    port: 4010,        // Port par défaut
    host: 'localhost'
  },
  logging: {
    level: 'verbose',  // 'none' | 'minimal' | 'verbose'
    apiRequests: true, // Log des requêtes API
    accessLog: {
      console: false,  // Log Apache Combined en console
      file: null,      // Chemin fichier (ex: './logs/access.log')
      devFilter: true  // Filtrer le bruit Vite en dev
    }
  },
  build: {
    outDir: 'dist',
    minify: true
  }
})
```

### Changer le port

Via la config ou variable d'environnement :

```bash
PORT=8080 npm run dev
```

### Access Logs

Pour activer les logs au format Apache Combined (avec temps de réponse) :

```typescript
logging: {
  accessLog: {
    console: true,                 // Afficher en console
    file: './logs/access.log'      // Écrire dans un fichier
  }
}
```

Format de sortie :
```
127.0.0.1 - - [17/Jan/2026:18:30:45 +0100] "GET /api/users HTTP/1.1" 200 1234 "-" "Mozilla/5.0..." 45ms
```

**Note** : L'écriture sur disque ajoute une opération I/O par requête. Sur des applications à très fort trafic, préférez logger uniquement en console et rediriger vers un fichier au niveau système (`node server.js >> access.log`).

**Important** : En production avec logs fichier, configurez `logrotate` pour éviter que les fichiers ne grossissent indéfiniment :

```bash
# /etc/logrotate.d/liho
/app/logs/access.log {
    daily
    rotate 14
    compress
    missingok
    notifempty
}
```

## Conventions de nommage

### Pages

| Fichier | URL | Description |
|---------|-----|-------------|
| `routes/page.tsx` | `/` | Page d'accueil |
| `routes/about/page.tsx` | `/about` | Page statique |
| `routes/blog/[slug]/page.tsx` | `/blog/:slug` | Page dynamique |
| `routes/[...404]/page.tsx` | `/*` | Page catch-all (404) |
| `routes/(auth)/login/page.tsx` | `/login` | Route group (pas de segment URL) |

### Layouts et fichiers spéciaux

| Fichier | Description |
|---------|-------------|
| `layout.tsx` | Layout englobant avec `<Outlet />` |
| `error.tsx` | Error boundary pour la route et ses enfants |
| `loading.tsx` | Composant Suspense fallback |

### API

| Fichier | URL | Description |
|---------|-----|-------------|
| `routes/api/users.ts` | `/api/users` | Route API |
| `routes/api/users/index.ts` | `/api/users` | Route API (collection) |
| `routes/api/users/[id].ts` | `/api/users/:id` | Route API dynamique |
| `routes/api/middleware.ts` | `/api/*` | Middleware global API |

## Layouts imbriqués (Nested Layouts)

Les layouts permettent de partager une structure commune entre plusieurs pages.

### Fonctionnement

1. Chaque `layout.tsx` enveloppe toutes les pages de son dossier et sous-dossiers
2. Les layouts s'empilent : parent → enfant → page
3. Chaque layout doit inclure `<Outlet />` pour afficher son contenu

### Exemple de structure

```
src/routes/
├── layout.tsx          # Layout racine (header/footer)
├── page.tsx            # Page d'accueil
├── dashboard/
│   ├── layout.tsx      # Layout dashboard (sidebar)
│   ├── page.tsx        # /dashboard
│   └── settings/
│       └── page.tsx    # /dashboard/settings
```

### Layout racine

```tsx
// src/routes/layout.tsx
import { Outlet } from 'react-router-dom'

export default function RootLayout() {
  return (
    <div className="min-h-screen">
      <header className="bg-blue-600 text-white p-4">
        <h1>Mon App</h1>
      </header>
      <main>
        <Outlet />  {/* Le contenu des pages s'affiche ici */}
      </main>
      <footer className="bg-gray-100 p-4">
        © 2026
      </footer>
    </div>
  )
}
```

### Layout imbriqué

```tsx
// src/routes/dashboard/layout.tsx
import { Outlet, Link } from 'react-router-dom'

export default function DashboardLayout() {
  return (
    <div className="flex">
      <aside className="w-64 bg-gray-800 text-white p-4">
        <nav>
          <Link to="/dashboard">Overview</Link>
          <Link to="/dashboard/settings">Settings</Link>
        </nav>
      </aside>
      <div className="flex-1 p-8">
        <Outlet />  {/* Les pages dashboard s'affichent ici */}
      </div>
    </div>
  )
}
```

### Route Groups

Les route groups `(nom)` permettent d'organiser les fichiers **sans affecter l'URL**. Le nom entre parenthèses est "invisible" pour l'utilisateur.

**Comparaison :**
```
# SANS parenthèses - le dossier apparaît dans l'URL
src/routes/auth/login/page.tsx     → /auth/login

# AVEC parenthèses - le dossier est invisible
src/routes/(auth)/login/page.tsx   → /login
```

**Cas d'usage 1 : Grouper des pages par thème**

```
src/routes/
├── (marketing)/              # Pages publiques (le dossier n'apparaît pas dans l'URL)
│   ├── page.tsx              → /
│   ├── about/page.tsx        → /about
│   └── pricing/page.tsx      → /pricing
│
├── (dashboard)/              # Pages connectées
│   ├── layout.tsx            # Layout avec sidebar (s'applique uniquement ici)
│   ├── home/page.tsx         → /home
│   └── settings/page.tsx     → /settings
```

**Cas d'usage 2 : Appliquer un layout à certaines pages seulement**

```
src/routes/
├── (auth)/
│   ├── layout.tsx            # Layout centré avec logo et fond gris
│   ├── login/page.tsx        → /login     (utilise le layout auth)
│   └── register/page.tsx     → /register  (utilise le layout auth)
│
├── dashboard/page.tsx        → /dashboard (n'utilise PAS le layout auth)
```

Le layout dans `(auth)/layout.tsx` s'applique uniquement aux pages login et register, pas au reste de l'application.

### Héritage des layouts

**Important :** Les layouts s'empilent (parent → enfant → page). Si tu as un `layout.tsx` à la racine, toutes les pages en héritent, y compris celles dans les route groups.

**Problème :** Tu veux que `/login` n'ait PAS le header/footer du layout racine.

**Solution recommandée :** Ne pas mettre de `layout.tsx` à la racine, mais utiliser des route groups pour isoler les layouts :

```
src/routes/
├── page.tsx                    # Page d'accueil (/) - sans layout
│
├── (auth)/                     # Pages d'authentification
│   ├── layout.tsx              # Layout auth : centré, fond gris, logo
│   ├── login/page.tsx          → /login
│   └── register/page.tsx       → /register
│
├── (app)/                      # Application principale
│   ├── layout.tsx              # Layout app : header, sidebar, footer
│   ├── dashboard/page.tsx      → /dashboard
│   └── settings/page.tsx       → /settings
```

**Résultat :**
- `/login` → utilise uniquement le layout `(auth)/layout.tsx`
- `/dashboard` → utilise uniquement le layout `(app)/layout.tsx`
- `/` → n'a aucun layout

Chaque groupe a son propre layout indépendant, sans héritage entre eux.

### Error Boundaries

Chaque `error.tsx` capture les erreurs de sa route et de ses enfants :

```tsx
// src/routes/dashboard/error.tsx
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom'

export default function DashboardError() {
  const error = useRouteError()

  if (isRouteErrorResponse(error)) {
    return <div>Erreur {error.status}: {error.statusText}</div>
  }

  return (
    <div>
      <h1>Erreur Dashboard</h1>
      <p>{error instanceof Error ? error.message : 'Erreur inconnue'}</p>
      <Link to="/dashboard">Retour</Link>
    </div>
  )
}
```

## Middleware API

Le middleware API s'applique à toutes les routes `/api/*`.

### Configuration

Créez `src/routes/api/middleware.ts` avec un export `default` :

```typescript
// src/routes/api/middleware.ts
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import type { Context, Next } from 'hono'

export default async function middleware(c: Context, next: Next) {
  // CORS
  const corsMiddleware = cors({ origin: '*' })
  await corsMiddleware(c, async () => {})

  // Security headers
  const securityMiddleware = secureHeaders()
  await securityMiddleware(c, next)
}
```

### Exports reconnus

| Export | Description |
|--------|-------------|
| `default` | Middleware principal |
| `onRequest` | Alternative au default |

### Middleware par dossier

Vous pouvez créer des middlewares spécifiques à un sous-dossier :

```
src/routes/api/
├── middleware.ts           # /api/* (global)
├── public/
│   └── hello.ts            # /api/public/hello (pas de protection)
└── protected/
    ├── middleware.ts       # /api/protected/* (auth requise)
    └── users.ts            # /api/protected/users
```

## Format des routes API

Exporte des fonctions nommées selon la méthode HTTP :

```typescript
import type { Context } from 'hono'

export async function GET(c: Context) {
  return c.json({ message: 'Hello' })
}

export async function POST(c: Context) {
  const body = await c.req.json()
  return c.json(body, 201)
}

export async function PUT(c: Context) { /* ... */ }
export async function DELETE(c: Context) { /* ... */ }
export async function PATCH(c: Context) { /* ... */ }
```

## Variables d'environnement

Crée un fichier `.env` à la racine :

```
# Côté serveur uniquement
DATABASE_URL=postgres://...
API_SECRET=xxx

# Exposé au client (préfixe VITE_)
VITE_APP_NAME=MonApp
```

Accès :
```typescript
// Côté serveur (routes API)
process.env.DATABASE_URL

// Côté client (pages React)
import.meta.env.VITE_APP_NAME
```

## Ajouter une base de données

Exemple avec SQLite et better-sqlite3 :

```bash
npm install better-sqlite3
npm install -D @types/better-sqlite3
```

```typescript
// src/lib/db.ts
import Database from 'better-sqlite3'

export const db = new Database('app.db')

// Initialisation
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  )
`)
```

```typescript
// src/routes/api/users.ts
import { db } from '../../lib/db'
import type { Context } from 'hono'

export async function GET(c: Context) {
  const users = db.prepare('SELECT * FROM users').all()
  return c.json(users)
}
```

## Déploiement

### Build

```bash
npm run build
```

Crée un dossier `dist/` portable et autonome :

```
dist/
├── client/           # Frontend (HTML, JS, CSS, assets)
├── server.js         # Serveur Node.js bundlé
└── package.json      # Dépendances minimales
```

### Lancer en production

Le dossier `dist/` peut être copié et lancé n'importe où :

```bash
cd dist
npm install    # Installe uniquement @hono/node-server
npm start      # Lance le serveur sur le port configuré
```

Ou avec la variable d'environnement :

```bash
PORT=8080 npm start
```

### Docker

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY dist ./
RUN npm install
EXPOSE 4010
CMD ["npm", "start"]
```

## FAQ

### Comment ajouter un layout global ?

Modifie `src/main.tsx` pour wrapper tes routes :

```tsx
import Layout from './components/Layout'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {routes.map((route, i) => (
            <Route key={i} path={route.path} element={route.element} />
          ))}
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
```

### Comment protéger une route API ?

Utilise les middlewares d'authentification de Hono. Exemple avec JWT :


**1. Créer un middleware d'authentification :**

```typescript
// src/lib/auth.ts
import { jwt } from 'hono/jwt'
import type { Context, Next } from 'hono'

// Clé secrète (utiliser une variable d'environnement en production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Middleware JWT pour protéger les routes
export const requireAuth = jwt({ secret: JWT_SECRET })

// Helper pour récupérer l'utilisateur dans une route
export function getUser(c: Context) {
  return c.get('jwtPayload')
}
```

**2. Protéger des routes API :**

```typescript
// src/routes/api/protected/middleware.ts
import { requireAuth } from '../../../lib/auth'

// Toutes les routes dans /api/protected/* seront protégées
export default requireAuth
```

```typescript
// src/routes/api/protected/me.ts
import type { Context } from 'hono'
import { getUser } from '../../../lib/auth'

// GET /api/protected/me - nécessite un token JWT valide
export async function GET(c: Context) {
  const user = getUser(c)
  return c.json({ user })
}
```

**3. Structure recommandée :**

```
src/routes/api/
├── middleware.ts              # CORS + Security headers (global)
├── auth/
│   ├── login.ts               # POST /api/auth/login (public)
│   └── register.ts            # POST /api/auth/register (public)
└── protected/
    ├── middleware.ts          # requireAuth (protège tout le dossier)
    ├── me.ts                  # GET /api/protected/me
    └── settings.ts            # GET/PUT /api/protected/settings
```

**4. Générer un token (route login) :**

```typescript
// src/routes/api/auth/login.ts
import { sign } from 'hono/jwt'
import type { Context } from 'hono'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(c: Context) {
  const { email, password } = await c.req.json()

  // Vérifier les credentials (à adapter selon ta BDD)
  const user = await verifyCredentials(email, password)
  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  // Générer le token JWT
  const token = await sign(
    { sub: user.id, email: user.email, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 },
    JWT_SECRET
  )

  return c.json({ token })
}
```

**Autres middlewares Hono disponibles :**
- `hono/basic-auth` - Authentification HTTP Basic
- `hono/bearer-auth` - Token Bearer simple (sans JWT)

### Comment protéger une page React ?

Côté client, vérifie si l'utilisateur a un token valide :

```tsx
// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
```

**Note :** La vraie sécurité est côté API (middleware Hono). Le check côté React est juste pour l'UX (éviter d'afficher une page qui va échouer).

### Les routes ne se mettent pas à jour ?

Les routes sont régénérées automatiquement en mode dev. Si le problème persiste :

1. Arrête le serveur (Ctrl+C)
2. Supprime `src/_generated/`
3. Relance `npm run dev`


## Licence

MIT
