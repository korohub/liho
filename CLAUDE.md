# CLAUDE.md

Ce fichier fournit des instructions à Claude Code (claude.ai/code) pour travailler avec ce projet.

## Vue d'ensemble

**Liho** est un starter minimaliste combinant React + Hono + Vite avec un système de file-based routing inspiré de SvelteKit. Il permet de créer des applications web modernes sans la complexité de Next.js.

### Stack technique

- **React 18** - Interface utilisateur
- **React Router 7** - Routing côté client (SPA)
- **Hono** - API backend ultra-léger (~14kb)
- **Vite** - Build et hot reload
- **Tailwind CSS** - Styling utilitaire
- **TypeScript** - Typage statique

## Architecture

```
liho/
├── src/
│   ├── routes/                    # File-based routing
│   │   ├── page.tsx               # Page d'accueil (/)
│   │   ├── layout.tsx             # Layout global (optionnel)
│   │   ├── about/
│   │   │   └── page.tsx           # /about
│   │   ├── users/
│   │   │   ├── page.tsx           # /users
│   │   │   └── [id]/
│   │   │       └── page.tsx       # /users/:id (dynamique)
│   │   └── api/
│   │       ├── hello.ts           # GET/POST /api/hello
│   │       └── users/
│   │           ├── index.ts       # GET/POST /api/users
│   │           └── [id].ts        # GET/PUT/DELETE /api/users/:id
│   │
│   ├── components/                # Composants réutilisables
│   ├── lib/                       # Utilitaires et helpers
│   ├── _generated/                # Auto-généré (NE PAS MODIFIER)
│   │   ├── routes.tsx             # Configuration React Router
│   │   └── api.ts                 # Routes Hono
│   │
│   ├── index.html                 # Point d'entrée HTML
│   ├── main.tsx                   # Point d'entrée React
│   └── index.css                  # Styles globaux (Tailwind)
│
├── public/                        # Assets statiques (favicon, images)
│   └── favicon.svg
│
├── scripts/
│   ├── router.ts                  # Scanner et générateur de routes
│   ├── config.ts                  # Système de configuration
│   ├── dev.ts                     # Serveur de développement
│   ├── build.ts                   # Script de build production
│   └── preview.ts                 # Preview du build
│
├── server.ts                      # Serveur de production Hono
├── liho.config.ts             # Configuration du projet
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

## Commandes

```bash
# Installation des dépendances
npm install

# Développement avec hot reload (http://localhost:3000)
npm run dev

# Build pour la production
npm run build

# Lancer en production
npm start

# Changer le port
PORT=8080 npm run dev
```

## Système de routing

### Conventions de fichiers

| Fichier | URL générée | Description |
|---------|-------------|-------------|
| `routes/page.tsx` | `/` | Page d'accueil |
| `routes/about/page.tsx` | `/about` | Page statique |
| `routes/users/page.tsx` | `/users` | Liste |
| `routes/users/[id]/page.tsx` | `/users/:id` | Page dynamique |
| `routes/api/hello.ts` | `/api/hello` | Route API |
| `routes/api/users/index.ts` | `/api/users` | API collection |
| `routes/api/users/[id].ts` | `/api/users/:id` | API item |

### Créer une nouvelle page

1. Créer un fichier `page.tsx` dans `src/routes/` :

```tsx
// src/routes/dashboard/page.tsx → accessible sur /dashboard
export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
    </div>
  )
}
```

2. La route est automatiquement détectée et ajoutée.

### Créer une page avec paramètre dynamique

1. Créer un dossier avec `[param]` :

```tsx
// src/routes/posts/[slug]/page.tsx → /posts/:slug
import { useParams } from 'react-router-dom'

export default function PostPage() {
  const { slug } = useParams<{ slug: string }>()

  return (
    <div>
      <h1>Article : {slug}</h1>
    </div>
  )
}
```

### Créer une route API

1. Créer un fichier `.ts` dans `src/routes/api/` :

```typescript
// src/routes/api/products.ts → /api/products
import type { Context } from 'hono'

// GET /api/products
export async function GET(c: Context) {
  const products = await fetchProducts()
  return c.json(products)
}

// POST /api/products
export async function POST(c: Context) {
  const body = await c.req.json()
  const product = await createProduct(body)
  return c.json(product, 201)
}
```

### Route API avec paramètre

```typescript
// src/routes/api/products/[id].ts → /api/products/:id
import type { Context } from 'hono'

export async function GET(c: Context) {
  const id = c.req.param('id')
  const product = await getProduct(id)

  if (!product) {
    return c.json({ error: 'Not found' }, 404)
  }

  return c.json(product)
}

export async function PUT(c: Context) {
  const id = c.req.param('id')
  const body = await c.req.json()
  const product = await updateProduct(id, body)
  return c.json(product)
}

export async function DELETE(c: Context) {
  const id = c.req.param('id')
  await deleteProduct(id)
  return c.json({ deleted: true })
}
```

## Patterns courants

### Fetch de données dans une page

```tsx
// src/routes/users/page.tsx
import { useState, useEffect } from 'react'

interface User {
  id: number
  name: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data)
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Chargement...</div>

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

### Navigation entre pages

```tsx
import { Link, useNavigate } from 'react-router-dom'

export default function Navigation() {
  const navigate = useNavigate()

  function handleClick() {
    // Navigation programmatique
    navigate('/dashboard')
  }

  return (
    <nav>
      {/* Navigation déclarative */}
      <Link to="/">Accueil</Link>
      <Link to="/about">À propos</Link>

      <button onClick={handleClick}>Dashboard</button>
    </nav>
  )
}
```

### Composant partagé

```tsx
// src/components/Button.tsx
interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary'
}

export function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  const styles = {
    primary: 'bg-blue-600 hover:bg-blue-700',
    secondary: 'bg-gray-600 hover:bg-gray-700'
  }

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded text-white ${styles[variant]}`}
    >
      {children}
    </button>
  )
}
```

### Accès aux variables d'environnement

```typescript
// Dans les routes API (côté serveur)
const apiKey = process.env.API_KEY

// Dans les pages React (côté client)
// Utiliser le préfixe VITE_ pour exposer au client
const publicKey = import.meta.env.VITE_PUBLIC_KEY
```

## Fichiers générés

Le dossier `src/_generated/` contient les fichiers auto-générés :

- **routes.tsx** - Configuration React Router basée sur `src/routes/**/page.tsx`
- **api.ts** - Routes Hono basées sur `src/routes/api/**/*.ts`

**Ne jamais modifier ces fichiers manuellement.** Ils sont régénérés automatiquement.

## Ajout de dépendances

```bash
# Dépendance de production
npm install axios

# Dépendance de développement
npm install -D @types/lodash
```

## Structure recommandée pour un nouveau projet

```
src/
├── routes/
│   ├── page.tsx              # Landing page
│   ├── login/page.tsx        # Authentification
│   ├── dashboard/
│   │   ├── page.tsx          # Dashboard principal
│   │   └── settings/page.tsx # Paramètres
│   └── api/
│       ├── auth/
│       │   ├── login.ts
│       │   └── logout.ts
│       └── data/
│           └── index.ts
├── components/
│   ├── ui/                   # Composants UI génériques
│   ├── forms/                # Composants de formulaire
│   └── layout/               # Header, Footer, Sidebar
├── lib/
│   ├── api.ts                # Client API
│   ├── auth.ts               # Utilitaires auth
│   └── utils.ts              # Helpers divers
└── types/
    └── index.ts              # Types partagés
```
