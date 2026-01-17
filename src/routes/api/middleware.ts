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

// Security headers - configuration complète pour Lighthouse
export const securityMiddleware = secureHeaders({
  // Protection contre le clickjacking
  xFrameOptions: 'DENY',

  // Isolation cross-origin (COOP)
  crossOriginOpenerPolicy: 'same-origin',

  // Isolation des ressources (COEP) - 'credentialless' pour compatibilité
  crossOriginEmbedderPolicy: 'credentialless',

  // Protection MIME type sniffing
  xContentTypeOptions: 'nosniff',

  // Referrer Policy
  referrerPolicy: 'strict-origin-when-cross-origin',

  // XSS Protection (legacy, mais toujours utile)
  xXssProtection: '1; mode=block',

  // Content Security Policy
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline nécessaire pour Vite en dev
    styleSrc: ["'self'", "'unsafe-inline'"],  // Tailwind inline styles
    imgSrc: ["'self'", 'data:', 'blob:'],
    fontSrc: ["'self'"],
    connectSrc: ["'self'"],
    frameSrc: ["'none'"],
    frameAncestors: ["'none'"], // Renforce X-Frame-Options
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
  },
})

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
