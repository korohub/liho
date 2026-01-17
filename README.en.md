# Liho

A minimalist React starter with file-based routing, inspired by SvelteKit but without the complexity of Next.js.

## Features

- **File-based routing** - Files in `src/routes/` automatically become routes
- **Integrated API** - API routes with Hono, ultra-lightweight (~14kb)
- **Hot reload** - Instant reload during development
- **TypeScript** - Static typing included
- **Tailwind CSS** - Utility-first styling ready to use
- **Single process** - Frontend and API on the same server

## Quick Start

### New project

```bash
# Create a new Liho project
npx create-liho my-app

# Navigate to the folder
cd my-app

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:4010
```

### Existing project

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Project Structure

```
liho/
├── src/
│   ├── routes/                 # Your pages and API
│   │   ├── page.tsx            # Home page (/)
│   │   ├── layout.tsx          # Root layout
│   │   ├── error.tsx           # Error boundary
│   │   ├── loading.tsx         # Loading state
│   │   └── api/
│   │       ├── hello.ts        # API route /api/hello
│   │       └── middleware.ts   # Global API middleware
│   │
│   ├── components/             # Your reusable components
│   ├── lib/                    # Your utilities
│   ├── _generated/             # Auto-generated (do not touch)
│   ├── index.html
│   ├── main.tsx
│   └── index.css
│
├── public/                     # Static assets (favicon, images)
├── server.ts                   # Production server
├── liho.config.ts              # Project configuration
└── package.json
```

## Getting Started Guide

### 1. Create your first page

1. Create a `dashboard/` folder in `src/routes/`
2. Create a `page.tsx` file inside:

```tsx
// src/routes/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">My Dashboard</h1>
      <p>Welcome!</p>
    </div>
  )
}
```

That's it! The folder name becomes the URL: `/dashboard`.

### 2. Create a page with dynamic parameter

For a route like `/products/123`, create this structure:

```
src/routes/
└── products/
    └── [id]/           ← Brackets indicate a dynamic parameter
        └── page.tsx
```

```tsx
// src/routes/products/[id]/page.tsx
import { useParams } from 'react-router-dom'

export default function ProductPage() {
  const { id } = useParams()

  return (
    <div className="p-8">
      <h1>Product #{id}</h1>
    </div>
  )
}
```

The `id` parameter from the URL (`/products/42`) is retrieved via `useParams()`.

### 3. Create an API route

API routes go in `src/routes/api/`. You can organize with subfolders:

```
src/routes/api/
├── hello.ts            → GET /api/hello
├── products.ts         → GET/POST /api/products
└── products/
    └── [id].ts         → GET/PUT/DELETE /api/products/:id
```

**Simple example** - create `src/routes/api/products.ts`:

```typescript
// src/routes/api/products.ts
import type { Context } from 'hono'

// GET /api/products
export async function GET(c: Context) {
  return c.json([
    { id: 1, name: 'Product A' },
    { id: 2, name: 'Product B' }
  ])
}

// POST /api/products
export async function POST(c: Context) {
  const body = await c.req.json()
  return c.json({ success: true, data: body }, 201)
}
```

**With parameter** - create `src/routes/api/products/[id].ts`:

```typescript
// src/routes/api/products/[id].ts
import type { Context } from 'hono'

// GET /api/products/42
export async function GET(c: Context) {
  const id = c.req.param('id')
  return c.json({ id, name: 'Product found' })
}

// DELETE /api/products/42
export async function DELETE(c: Context) {
  const id = c.req.param('id')
  return c.json({ deleted: id })
}
```

### 4. Call the API from a page

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

### 5. Navigation between pages

```tsx
import { Link } from 'react-router-dom'

export default function Navigation() {
  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/products">Products</Link>
    </nav>
  )
}
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run preview` | Test the build locally |
| `npm start` | Start the production server |
| `npm test` | Run tests |
| `npm run test:watch` | Tests in watch mode |
| `npm run test:coverage` | Tests with code coverage |

### Configuration

The `liho.config.ts` file allows you to configure the project:

```typescript
import { defineConfig } from './scripts/config'

export default defineConfig({
  server: {
    port: 4010,        // Default port
    host: 'localhost'
  },
  logging: {
    level: 'verbose',  // 'none' | 'minimal' | 'verbose'
    apiRequests: true, // Log API requests
    accessLog: {
      console: false,  // Apache Combined log to console
      file: null,      // File path (e.g., './logs/access.log')
      devFilter: true  // Filter Vite noise in dev
    }
  },
  build: {
    outDir: 'dist',
    minify: true
  }
})
```

### Change the port

Via config or environment variable:

```bash
PORT=8080 npm run dev
```

### Access Logs

To enable Apache Combined format logs (with response time):

```typescript
logging: {
  accessLog: {
    console: true,                 // Display in console
    file: './logs/access.log'      // Write to a file
  }
}
```

Output format:
```
127.0.0.1 - - [17/Jan/2026:18:30:45 +0100] "GET /api/users HTTP/1.1" 200 1234 "-" "Mozilla/5.0..." 45ms
```

**Note**: Writing to disk adds an I/O operation per request. For high-traffic applications, prefer logging to console only and redirect to a file at the system level (`node server.js >> access.log`).

**Important**: In production with file logging, configure `logrotate` to prevent files from growing indefinitely:

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

## Naming Conventions

### Pages

| File | URL | Description |
|------|-----|-------------|
| `routes/page.tsx` | `/` | Home page |
| `routes/about/page.tsx` | `/about` | Static page |
| `routes/blog/[slug]/page.tsx` | `/blog/:slug` | Dynamic page |
| `routes/[...404]/page.tsx` | `/*` | Catch-all page (404) |
| `routes/(auth)/login/page.tsx` | `/login` | Route group (no URL segment) |

### Layouts and special files

| File | Description |
|------|-------------|
| `layout.tsx` | Wrapping layout with `<Outlet />` |
| `error.tsx` | Error boundary for the route and its children |
| `loading.tsx` | Suspense fallback component |

### API

| File | URL | Description |
|------|-----|-------------|
| `routes/api/users.ts` | `/api/users` | API route |
| `routes/api/users/index.ts` | `/api/users` | API route (collection) |
| `routes/api/users/[id].ts` | `/api/users/:id` | Dynamic API route |
| `routes/api/middleware.ts` | `/api/*` | Global API middleware |

## Nested Layouts

Layouts allow sharing a common structure between multiple pages.

### How it works

1. Each `layout.tsx` wraps all pages in its folder and subfolders
2. Layouts stack: parent → child → page
3. Each layout must include `<Outlet />` to display its content

### Example structure

```
src/routes/
├── layout.tsx          # Root layout (header/footer)
├── page.tsx            # Home page
├── dashboard/
│   ├── layout.tsx      # Dashboard layout (sidebar)
│   ├── page.tsx        # /dashboard
│   └── settings/
│       └── page.tsx    # /dashboard/settings
```

### Root layout

```tsx
// src/routes/layout.tsx
import { Outlet } from 'react-router-dom'

export default function RootLayout() {
  return (
    <div className="min-h-screen">
      <header className="bg-blue-600 text-white p-4">
        <h1>My App</h1>
      </header>
      <main>
        <Outlet />  {/* Page content is rendered here */}
      </main>
      <footer className="bg-gray-100 p-4">
        © 2026
      </footer>
    </div>
  )
}
```

### Nested layout

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
        <Outlet />  {/* Dashboard pages are rendered here */}
      </div>
    </div>
  )
}
```

### Route Groups

Route groups `(name)` allow organizing files **without affecting the URL**. The name in parentheses is "invisible" to the user.

**Comparison:**
```
# WITHOUT parentheses - the folder appears in the URL
src/routes/auth/login/page.tsx     → /auth/login

# WITH parentheses - the folder is invisible
src/routes/(auth)/login/page.tsx   → /login
```

**Use case 1: Group pages by theme**

```
src/routes/
├── (marketing)/              # Public pages (folder doesn't appear in URL)
│   ├── page.tsx              → /
│   ├── about/page.tsx        → /about
│   └── pricing/page.tsx      → /pricing
│
├── (dashboard)/              # Authenticated pages
│   ├── layout.tsx            # Layout with sidebar (applies only here)
│   ├── home/page.tsx         → /home
│   └── settings/page.tsx     → /settings
```

**Use case 2: Apply a layout to specific pages only**

```
src/routes/
├── (auth)/
│   ├── layout.tsx            # Centered layout with logo and gray background
│   ├── login/page.tsx        → /login     (uses auth layout)
│   └── register/page.tsx     → /register  (uses auth layout)
│
├── dashboard/page.tsx        → /dashboard (does NOT use auth layout)
```

The layout in `(auth)/layout.tsx` applies only to login and register pages, not to the rest of the application.

### Layout Inheritance

**Important:** Layouts stack (parent → child → page). If you have a `layout.tsx` at the root, all pages inherit from it, including those in route groups.

**Problem:** You want `/login` to NOT have the header/footer from the root layout.

**Recommended solution:** Don't put a `layout.tsx` at the root, but use route groups to isolate layouts:

```
src/routes/
├── page.tsx                    # Home page (/) - no layout
│
├── (auth)/                     # Authentication pages
│   ├── layout.tsx              # Auth layout: centered, gray background, logo
│   ├── login/page.tsx          → /login
│   └── register/page.tsx       → /register
│
├── (app)/                      # Main application
│   ├── layout.tsx              # App layout: header, sidebar, footer
│   ├── dashboard/page.tsx      → /dashboard
│   └── settings/page.tsx       → /settings
```

**Result:**
- `/login` → uses only the `(auth)/layout.tsx` layout
- `/dashboard` → uses only the `(app)/layout.tsx` layout
- `/` → has no layout

Each group has its own independent layout, with no inheritance between them.

### Error Boundaries

Each `error.tsx` captures errors from its route and its children:

```tsx
// src/routes/dashboard/error.tsx
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom'

export default function DashboardError() {
  const error = useRouteError()

  if (isRouteErrorResponse(error)) {
    return <div>Error {error.status}: {error.statusText}</div>
  }

  return (
    <div>
      <h1>Dashboard Error</h1>
      <p>{error instanceof Error ? error.message : 'Unknown error'}</p>
      <Link to="/dashboard">Back</Link>
    </div>
  )
}
```

## API Middleware

API middleware applies to all `/api/*` routes.

### Configuration

Create `src/routes/api/middleware.ts` with a `default` export:

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

### Recognized exports

| Export | Description |
|--------|-------------|
| `default` | Main middleware |
| `onRequest` | Alternative to default |

### Per-folder middleware

You can create middlewares specific to a subfolder:

```
src/routes/api/
├── middleware.ts           # /api/* (global)
├── public/
│   └── hello.ts            # /api/public/hello (no protection)
└── protected/
    ├── middleware.ts       # /api/protected/* (auth required)
    └── users.ts            # /api/protected/users
```

## API Route Format

Export named functions according to the HTTP method:

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

## Environment Variables

Create a `.env` file at the root:

```
# Server-side only
DATABASE_URL=postgres://...
API_SECRET=xxx

# Exposed to client (VITE_ prefix)
VITE_APP_NAME=MyApp
```

Access:
```typescript
// Server-side (API routes)
process.env.DATABASE_URL

// Client-side (React pages)
import.meta.env.VITE_APP_NAME
```

## Adding a Database

Example with SQLite and better-sqlite3:

```bash
npm install better-sqlite3
npm install -D @types/better-sqlite3
```

```typescript
// src/lib/db.ts
import Database from 'better-sqlite3'

export const db = new Database('app.db')

// Initialization
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

## Deployment

### Build

```bash
npm run build
```

Creates a portable and self-contained `dist/` folder:

```
dist/
├── client/           # Frontend (HTML, JS, CSS, assets)
├── server.js         # Bundled Node.js server
└── package.json      # Minimal dependencies
```

### Running in production

The `dist/` folder can be copied and run anywhere:

```bash
cd dist
npm install    # Installs only @hono/node-server
npm start      # Starts the server on the configured port
```

Or with environment variable:

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

### How to add a global layout?

Modify `src/main.tsx` to wrap your routes:

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

### How to protect an API route?

Use Hono's authentication middleware. Example with JWT:


**1. Create an authentication middleware:**

```typescript
// src/lib/auth.ts
import { jwt } from 'hono/jwt'
import type { Context, Next } from 'hono'

// Secret key (use environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// JWT middleware to protect routes
export const requireAuth = jwt({ secret: JWT_SECRET })

// Helper to get user in a route
export function getUser(c: Context) {
  return c.get('jwtPayload')
}
```

**2. Protect API routes:**

```typescript
// src/routes/api/protected/middleware.ts
import { requireAuth } from '../../../lib/auth'

// All routes in /api/protected/* will be protected
export default requireAuth
```

```typescript
// src/routes/api/protected/me.ts
import type { Context } from 'hono'
import { getUser } from '../../../lib/auth'

// GET /api/protected/me - requires valid JWT token
export async function GET(c: Context) {
  const user = getUser(c)
  return c.json({ user })
}
```

**3. Recommended structure:**

```
src/routes/api/
├── middleware.ts              # CORS + Security headers (global)
├── auth/
│   ├── login.ts               # POST /api/auth/login (public)
│   └── register.ts            # POST /api/auth/register (public)
└── protected/
    ├── middleware.ts          # requireAuth (protects entire folder)
    ├── me.ts                  # GET /api/protected/me
    └── settings.ts            # GET/PUT /api/protected/settings
```

**4. Generate a token (login route):**

```typescript
// src/routes/api/auth/login.ts
import { sign } from 'hono/jwt'
import type { Context } from 'hono'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(c: Context) {
  const { email, password } = await c.req.json()

  // Verify credentials (adapt to your database)
  const user = await verifyCredentials(email, password)
  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  // Generate JWT token
  const token = await sign(
    { sub: user.id, email: user.email, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 },
    JWT_SECRET
  )

  return c.json({ token })
}
```

**Other available Hono middlewares:**
- `hono/basic-auth` - HTTP Basic authentication
- `hono/bearer-auth` - Simple Bearer token (without JWT)

### How to protect a React page?

On the client side, check if the user has a valid token:

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

**Note:** The real security is on the API side (Hono middleware). The React check is just for UX (avoiding displaying a page that will fail).

### Routes not updating?

Routes are automatically regenerated in dev mode. If the problem persists:

1. Stop the server (Ctrl+C)
2. Delete `src/_generated/`
3. Restart `npm run dev`

## License

MIT
