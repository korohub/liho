/**
 * Liho - Auth Utilities
 * Utilitaires d'authentification pour les routes API
 */

import { Context, Next } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'

// Types
export interface User {
  id: string
  [key: string]: unknown
}

export interface AuthConfig {
  /** Fonction pour extraire le token de la requête */
  getToken?: (c: Context) => string | null
  /** Fonction pour vérifier le token et retourner l'utilisateur */
  verifyToken?: (token: string) => Promise<User | null>
  /** Nom du cookie de session (défaut: 'session') */
  cookieName?: string
  /** Durée du cookie en secondes (défaut: 7 jours) */
  cookieMaxAge?: number
}

// Configuration globale (à définir par l'utilisateur)
let authConfig: AuthConfig = {}

/**
 * Configure l'authentification globale
 * À appeler une fois au démarrage de l'application
 *
 * @example
 * ```ts
 * // src/routes/api/middleware.ts
 * import { configureAuth } from '../../lib/auth'
 * import { verifyJWT } from './your-jwt-lib'
 *
 * configureAuth({
 *   verifyToken: async (token) => {
 *     const payload = await verifyJWT(token)
 *     return payload ? { id: payload.sub, ...payload } : null
 *   }
 * })
 * ```
 */
export function configureAuth(config: AuthConfig) {
  authConfig = { ...authConfig, ...config }
}

/**
 * Extrait le token de la requête (header Authorization ou cookie)
 */
function extractToken(c: Context): string | null {
  // Custom extractor
  if (authConfig.getToken) {
    return authConfig.getToken(c)
  }

  // Bearer token dans Authorization header
  const authHeader = c.req.header('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  // Cookie de session
  const cookieName = authConfig.cookieName || 'session'
  const cookie = getCookie(c, cookieName)
  if (cookie) {
    return cookie
  }

  return null
}

/**
 * Middleware qui requiert une authentification
 * Bloque la requête si l'utilisateur n'est pas authentifié
 *
 * @example
 * ```ts
 * // src/routes/api/users/me.ts
 * import { requireAuth } from '../../../lib/auth'
 *
 * export async function GET(c: Context) {
 *   await requireAuth()(c, async () => {})
 *   const user = c.get('user')
 *   return c.json(user)
 * }
 * ```
 */
export function requireAuth() {
  return async (c: Context, next: Next) => {
    const token = extractToken(c)

    if (!token) {
      throw new HTTPException(401, { message: 'Authentication required' })
    }

    if (!authConfig.verifyToken) {
      throw new Error('Auth not configured. Call configureAuth() first.')
    }

    const user = await authConfig.verifyToken(token)

    if (!user) {
      throw new HTTPException(401, { message: 'Invalid or expired token' })
    }

    c.set('user', user)
    await next()
  }
}

/**
 * Middleware optionnel - charge l'utilisateur si authentifié, sinon continue
 *
 * @example
 * ```ts
 * // src/routes/api/posts.ts
 * import { optionalAuth } from '../../../lib/auth'
 *
 * export async function GET(c: Context) {
 *   await optionalAuth()(c, async () => {})
 *   const user = c.get('user') // User | undefined
 *   // Afficher plus de détails si authentifié
 * }
 * ```
 */
export function optionalAuth() {
  return async (c: Context, next: Next) => {
    const token = extractToken(c)

    if (token && authConfig.verifyToken) {
      const user = await authConfig.verifyToken(token)
      if (user) {
        c.set('user', user)
      }
    }

    await next()
  }
}

/**
 * Middleware qui requiert un rôle spécifique
 *
 * @example
 * ```ts
 * // src/routes/api/admin/users.ts
 * import { requireRole } from '../../../lib/auth'
 *
 * export async function GET(c: Context) {
 *   await requireRole('admin')(c, async () => {})
 *   // Seuls les admins arrivent ici
 * }
 * ```
 */
export function requireRole(role: string) {
  return async (c: Context, next: Next) => {
    await requireAuth()(c, async () => {})

    const user = c.get('user') as User
    if (user.role !== role) {
      throw new HTTPException(403, { message: 'Insufficient permissions' })
    }

    await next()
  }
}

/**
 * Helper pour définir le cookie de session
 *
 * @example
 * ```ts
 * // src/routes/api/auth/login.ts
 * import { setSession } from '../../../lib/auth'
 *
 * export async function POST(c: Context) {
 *   const token = await createJWT(user)
 *   setSession(c, token)
 *   return c.json({ success: true })
 * }
 * ```
 */
export function setSession(c: Context, token: string) {
  const cookieName = authConfig.cookieName || 'session'
  const maxAge = authConfig.cookieMaxAge || 60 * 60 * 24 * 7 // 7 jours

  setCookie(c, cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge,
    path: '/'
  })
}

/**
 * Helper pour supprimer le cookie de session (logout)
 *
 * @example
 * ```ts
 * // src/routes/api/auth/logout.ts
 * import { clearSession } from '../../../lib/auth'
 *
 * export async function POST(c: Context) {
 *   clearSession(c)
 *   return c.json({ success: true })
 * }
 * ```
 */
export function clearSession(c: Context) {
  const cookieName = authConfig.cookieName || 'session'
  deleteCookie(c, cookieName, { path: '/' })
}

/**
 * Helper pour récupérer l'utilisateur courant (type-safe)
 *
 * @example
 * ```ts
 * import { getUser } from '../../../lib/auth'
 *
 * export async function GET(c: Context) {
 *   const user = getUser(c) // Throws si pas authentifié
 *   return c.json(user)
 * }
 * ```
 */
export function getUser<T extends User = User>(c: Context): T {
  const user = c.get('user')
  if (!user) {
    throw new HTTPException(401, { message: 'Not authenticated' })
  }
  return user as T
}

/**
 * Helper pour récupérer l'utilisateur courant (peut être null)
 */
export function getUserOrNull<T extends User = User>(c: Context): T | null {
  return (c.get('user') as T) || null
}
