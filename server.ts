/**
 * Liho - Production Server
 * Sert les fichiers statiques et les routes API
 */

import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

// Import de l'app API générée
import { app as apiApp } from './src/_generated/api'

// Répertoire du serveur (pour chemins relatifs portables)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const clientDir = join(__dirname, 'client')

const app = new Hono()

// Routes API - l'app générée a déjà les préfixes /api
app.route('', apiApp)

// Fichiers statiques (SPA)
app.use('/*', serveStatic({ root: clientDir }))

// Fallback SPA - sert index.html uniquement pour les requêtes de navigation
// (pas pour les assets manquants comme .ico, .js, .css, etc.)
app.get('*', (c) => {
  const accept = c.req.header('accept') || ''
  // Seulement pour les requêtes qui acceptent du HTML (navigation)
  if (accept.includes('text/html')) {
    return c.html(readFileSync(join(clientDir, 'index.html'), 'utf-8'))
  }
  // 404 pour les assets manquants
  return c.notFound()
})

// __DEFAULT_PORT__ est injecté par esbuild au moment du build
declare const __DEFAULT_PORT__: number
const port = parseInt(process.env.PORT || String(__DEFAULT_PORT__))

console.log(`[Liho] Production server running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})
