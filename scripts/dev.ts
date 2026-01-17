/**
 * Liho - Dev Server
 * Lance le serveur de développement avec hot reload complet
 */

import { createServer } from 'http'
import { watch } from 'fs'
import { buildRoutes } from './router.js'
import { log } from './colors.js'
import { loadConfig } from './config.js'
import { formatAccessLog, writeAccessLog, isAccessLogEnabled } from './logger.js'
import type { ViteDevServer } from 'vite'
import type { ResolvedConfig } from './config.js'

let config: ResolvedConfig

async function startDevServer() {
  // Charger la configuration
  config = await loadConfig()
  const PORT = config.server.port

  console.log('')
  log.info('Starting development server...')
  console.log('')

  // Build initial des routes
  buildRoutes()

  const { createServer: createViteServer } = await import('vite')

  const vite: ViteDevServer = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
    root: 'src'
  })

  // Watch des changements dans src/routes avec hot reload
  watch('src/routes', { recursive: true }, (event, filename) => {
    if (filename?.endsWith('.tsx') || filename?.endsWith('.ts')) {
      log.change(filename)
      buildRoutes()

      // Invalider le module API dans le cache Vite SSR
      const apiModule = vite.moduleGraph.getModuleById('\0/_generated/api.ts')
      if (apiModule) {
        vite.moduleGraph.invalidateModule(apiModule)
      }

      // Envoyer un signal de full reload au navigateur via Vite HMR
      vite.ws.send({
        type: 'full-reload',
        path: '*'
      })

      log.success('Hot reload triggered')
    }
  })

  // Watch des changements dans src/components et src/lib
  watch('src/components', { recursive: true }, (_event, filename) => {
    if (filename?.endsWith('.tsx') || filename?.endsWith('.ts')) {
      log.change(`components/${filename}`)
    }
  })

  watch('src/lib', { recursive: true }, (_event, filename) => {
    if (filename?.endsWith('.tsx') || filename?.endsWith('.ts')) {
      log.change(`lib/${filename}`)
    }
  })

  const accessLogEnabled = isAccessLogEnabled(config.logging.accessLog)

  // Filtre pour ignorer les requêtes internes Vite en dev
  const shouldLogRequest = (url: string): boolean => {
    if (!config.logging.accessLog.devFilter) return true
    // Ignorer les requêtes Vite internes
    if (url.startsWith('/@')) return false           // /@vite/, /@fs/
    if (url.includes('/node_modules/')) return false // dépendances
    if (url.includes('/_generated/')) return false   // fichiers générés
    if (url.includes('.well-known/')) return false   // metadata navigateur
    if (url.endsWith('.tsx') || url.endsWith('.ts')) return false  // sources
    if (url.endsWith('.css') && url !== '/index.css') return false // css modules
    return true
  }

  const server = createServer(async (req, res) => {
    const url = req.url || '/'
    const startTime = Date.now()
    const ip = (req.socket.remoteAddress || '127.0.0.1').replace('::ffff:', '')
    const referer = req.headers.referer || null
    const userAgent = req.headers['user-agent'] || null

    // Routes API → Hono (avec hot reload via Vite SSR)
    if (url.startsWith('/api')) {
      const headers: Record<string, string> = {}
      for (const [key, value] of Object.entries(req.headers)) {
        if (typeof value === 'string') headers[key] = value
      }

      // Collecter le body pour les requêtes POST/PUT/PATCH
      let body: string | undefined
      if (['POST', 'PUT', 'PATCH'].includes(req.method || '')) {
        const chunks: Buffer[] = []
        for await (const chunk of req) {
          chunks.push(chunk)
        }
        body = Buffer.concat(chunks).toString()
      }

      const request = new Request(`http://localhost:${PORT}${url}`, {
        method: req.method,
        headers,
        body: body || undefined
      })

      try {
        // Utiliser Vite SSR pour le hot reload des modules API
        const apiModule = await vite.ssrLoadModule('/_generated/api.ts')
        const app = apiModule.app

        const response = await app.fetch(request)
        res.statusCode = response.status
        response.headers.forEach((value: string, key: string) => {
          res.setHeader(key, value)
        })
        const responseBody = await response.text()
        res.end(responseBody)

        const duration = Date.now() - startTime

        // Log coloré pour le dev
        if (config.logging.apiRequests) {
          log.api(req.method || 'GET', url, response.status, duration)
        }

        // Access log format Apache
        if (accessLogEnabled) {
          const logLine = formatAccessLog(ip, req.method || 'GET', url, response.status, responseBody.length, referer, userAgent, duration)
          writeAccessLog(config.logging.accessLog, logLine)
        }
      } catch (error) {
        const duration = Date.now() - startTime

        // Log coloré pour le dev
        if (config.logging.apiRequests) {
          log.api(req.method || 'GET', url, 500, duration)
        }

        // Access log format Apache
        if (accessLogEnabled) {
          const logLine = formatAccessLog(ip, req.method || 'GET', url, 500, 0, referer, userAgent, duration)
          writeAccessLog(config.logging.accessLog, logLine)
        }
        console.error('[API Error]', error)
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'Internal Server Error' }))
      }
      return
    }

    // Tout le reste → Vite
    // Logger quand la réponse est terminée (Vite gère tout directement)
    if (accessLogEnabled && shouldLogRequest(url)) {
      res.on('finish', () => {
        const duration = Date.now() - startTime
        const size = parseInt(res.getHeader('content-length') as string) || 0
        const logLine = formatAccessLog(ip, req.method || 'GET', url, res.statusCode, size, referer, userAgent, duration)
        writeAccessLog(config.logging.accessLog, logLine)
      })
    }

    vite.middlewares(req, res, async () => {
      const fs = await import('fs/promises')
      const path = await import('path')

      try {
        let html = await fs.readFile(
          path.resolve('src/index.html'),
          'utf-8'
        )
        html = await vite.transformIndexHtml(url, html)

        res.statusCode = 200
        res.setHeader('Content-Type', 'text/html')
        res.end(html)
      } catch (e) {
        res.statusCode = 500
        res.end('Error loading page')
      }
    })
  })

  server.listen(PORT, () => {
    log.server(PORT)
  })
}

startDevServer().catch(console.error)
