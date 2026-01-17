import { secureHeaders } from 'hono/secure-headers'
import { cors } from 'hono/cors'

/**
 * Middleware API - Exemple de configuration
 *
 * Le logging des requêtes est géré automatiquement par Liho
 * (configurable via reactkit.config.ts → logging.apiRequests)
 *
 * Exportez des middlewares individuels ou combinez-les selon vos besoins.
 */

// CORS - autorise les requêtes cross-origin
export const corsMiddleware = cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
})

// Security headers - ajoute des headers de sécurité
export const securityMiddleware = secureHeaders()
