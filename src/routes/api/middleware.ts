import { secureHeaders } from 'hono/secure-headers'
import { cors } from 'hono/cors'
import type { Context, Next } from 'hono'

/**
 * Middleware API - Configuration globale
 *
 * Le logging des requêtes est géré automatiquement par Liho
 * (configurable via liho.config.ts → logging.apiRequests)
 *
 * Ce middleware s'applique à toutes les routes /api/*
 * Exportez `default` ou `onRequest` pour qu'il soit détecté.
 */

// CORS - autorise les requêtes cross-origin
export const corsMiddleware = cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
})

// Security headers - ajoute des headers de sécurité
export const securityMiddleware = secureHeaders()

/**
 * Middleware par défaut combinant CORS et Security Headers
 * Détecté automatiquement par le routeur Liho
 */
export default async function middleware(c: Context, next: Next) {
  // Appliquer CORS
  const corsResponse = await corsMiddleware(c, async () => {})
  if (corsResponse) return corsResponse

  // Appliquer Security Headers
  await securityMiddleware(c, next)
}
