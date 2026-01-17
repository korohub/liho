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

```bash
# Installation
npm install

# Lancer en développement
npm run dev

# Ouvrir http://localhost:4010
```

## Structure du projet

```
liho/
├── src/
│   ├── routes/                 # Tes pages et API
│   │   ├── page.tsx            # Page d'accueil (/)
│   │   ├── about/
│   │   │   └── page.tsx        # Page /about
│   │   └── api/
│   │       └── hello.ts        # Route API /api/hello
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
├── liho.config.ts          # Configuration du projet
└── package.json
```

## Guide de démarrage

### 1. Nettoyer les exemples

Supprime les pages d'exemple :
- `src/routes/about/` (dossier complet)
- `src/routes/users/` (dossier complet)

Garde uniquement :
- `src/routes/page.tsx` (ta page d'accueil)
- `src/routes/api/hello.ts` (exemple d'API, à modifier ou supprimer)

### 2. Créer ta première page

Crée un fichier `page.tsx` dans un nouveau dossier :

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

C'est tout ! La route `/dashboard` est automatiquement créée.

### 3. Créer une page avec paramètre dynamique

Pour une route comme `/products/123`, utilise `[param]` dans le nom du dossier :

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

### 4. Créer une route API

Crée un fichier `.ts` dans `src/routes/api/` :

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
  // Sauvegarder en base...
  return c.json({ success: true, data: body }, 201)
}
```

### 5. Appeler l'API depuis une page

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

### 6. Navigation entre pages

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

| Fichier | Résultat |
|---------|----------|
| `routes/page.tsx` | Route `/` |
| `routes/about/page.tsx` | Route `/about` |
| `routes/blog/[slug]/page.tsx` | Route `/blog/:slug` |
| `routes/api/users.ts` | API `/api/users` |
| `routes/api/users/[id].ts` | API `/api/users/:id` |

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

### Comment protéger une route ?

Crée un composant de protection :

```tsx
// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  return children
}
```

### Les routes ne se mettent pas à jour ?

Les routes sont régénérées automatiquement en mode dev. Si le problème persiste :

1. Arrête le serveur (Ctrl+C)
2. Supprime `src/_generated/`
3. Relance `npm run dev`

## Licence

MIT
