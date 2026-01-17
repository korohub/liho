/**
 * Liho - Production Server
 * Sert les fichiers statiques et les routes API
 */

import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'
import { appendFile, mkdir } from 'fs/promises'

// Config access log injectée au build
declare const __ACCESS_LOG_CONSOLE__: boolean
declare const __ACCESS_LOG_FILE__: string | null

// Formatage Apache Combined + response time
function formatApacheDate(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const day = String(date.getDate()).padStart(2, '0')
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  const tzOffset = -date.getTimezoneOffset()
  const tzSign = tzOffset >= 0 ? '+' : '-'
  const tzHours = String(Math.floor(Math.abs(tzOffset) / 60)).padStart(2, '0')
  const tzMinutes = String(Math.abs(tzOffset) % 60).padStart(2, '0')
  return `${day}/${month}/${year}:${hours}:${minutes}:${seconds} ${tzSign}${tzHours}${tzMinutes}`
}

// Compteur d'erreurs pour éviter le spam de logs
let logErrorCount = 0
const MAX_LOG_ERRORS = 5

function writeAccessLog(ip: string, method: string, path: string, status: number, size: number, referer: string | null, userAgent: string | null, durationMs: number): void {
  const date = formatApacheDate(new Date())
  const logLine = `${ip} - - [${date}] "${method} ${path} HTTP/1.1" ${status} ${size} "${referer || '-'}" "${userAgent || '-'}" ${durationMs}ms`

  if (__ACCESS_LOG_CONSOLE__) {
    console.log(logLine)
  }

  if (__ACCESS_LOG_FILE__) {
    // Écriture asynchrone pour ne pas bloquer l'event loop
    mkdir(dirname(__ACCESS_LOG_FILE__), { recursive: true })
      .then(() => appendFile(__ACCESS_LOG_FILE__, logLine + '\n'))
      .catch((err: Error) => {
        // Limiter le nombre d'erreurs affichées pour éviter le spam
        if (logErrorCount < MAX_LOG_ERRORS) {
          logErrorCount++
          console.warn(`[Liho] Erreur d'écriture de log (${logErrorCount}/${MAX_LOG_ERRORS}):`, err.message)
          if (logErrorCount === MAX_LOG_ERRORS) {
            console.warn('[Liho] Les erreurs de log suivantes seront ignorées.')
          }
        }
      })
  }
}

// Import de l'app API générée
import { app as apiApp } from './src/_generated/api'

// Répertoire du serveur (pour chemins relatifs portables)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const clientDir = join(__dirname, 'client')

const app = new Hono()

// Security headers pour toutes les requêtes (pages HTML, assets, API)
// Résout les alertes Lighthouse: COOP, X-Frame-Options, CSP
app.use('*', secureHeaders({
  // Protection contre le clickjacking
  xFrameOptions: 'DENY',

  // Isolation cross-origin (COOP) - requis par Lighthouse
  crossOriginOpenerPolicy: 'same-origin',

  // Isolation des ressources (COEP) - 'credentialless' pour compatibilité
  crossOriginEmbedderPolicy: 'credentialless',

  // Protection MIME type sniffing
  xContentTypeOptions: 'nosniff',

  // Referrer Policy
  referrerPolicy: 'strict-origin-when-cross-origin',

  // XSS Protection (legacy)
  xXssProtection: '1; mode=block',

  // Content Security Policy
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],  // Script inline pour dark mode dans index.html
    styleSrc: ["'self'", "'unsafe-inline'"],   // Tailwind inline styles
    imgSrc: ["'self'", 'data:', 'blob:'],
    fontSrc: ["'self'"],
    connectSrc: ["'self'"],
    frameSrc: ["'none'"],
    frameAncestors: ["'none'"], // Renforce X-Frame-Options
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
  },
}))

// Middleware access log
const accessLogEnabled = __ACCESS_LOG_CONSOLE__ || __ACCESS_LOG_FILE__ !== null
if (accessLogEnabled) {
  app.use('*', async (c, next) => {
    const start = Date.now()
    await next()
    const duration = Date.now() - start

    const ip = (c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1').split(',')[0].trim()
    const method = c.req.method
    const path = c.req.path
    const status = c.res.status
    const size = parseInt(c.res.headers.get('content-length') || '0')
    const referer = c.req.header('referer') || null
    const userAgent = c.req.header('user-agent') || null

    writeAccessLog(ip, method, path, status, size, referer, userAgent, duration)
  })
}

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
