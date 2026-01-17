/**
 * Liho - Middleware Utilities
 * Utilitaires complémentaires aux middlewares Hono
 *
 * Note: Utiliser les middlewares Hono natifs quand disponibles :
 * - hono/logger, hono/cors, hono/csrf, hono/jwt,
 * - hono/secure-headers, hono/timeout, etc.
 */

import { Context, Next } from 'hono'
import { HTTPException } from 'hono/http-exception'

/**
 * Combine plusieurs middlewares en un seul (chaînage simplifié)
 *
 * @example
 * ```ts
 * import { combine } from '../../lib/middleware'
 * import { requireAuth } from '../../lib/auth'
 * import { rateLimiter } from 'hono/rate-limiter'
 *
 * const protectedRoute = combine(
 *   rateLimiter({ limit: 100, window: 60 }),
 *   requireAuth()
 * )
 *
 * export async function GET(c: Context) {
 *   await protectedRoute(c, async () => {})
 *   // ...
 * }
 * ```
 */
export function combine(...middlewares: Array<(c: Context, next: Next) => Promise<void>>) {
  return async (c: Context, next: Next) => {
    let index = 0

    const runNext = async (): Promise<void> => {
      if (index < middlewares.length) {
        const middleware = middlewares[index++]
        await middleware(c, runNext)
      } else {
        await next()
      }
    }

    await runNext()
  }
}

/**
 * Middleware conditionnel - exécute un middleware seulement si la condition est vraie
 *
 * @example
 * ```ts
 * import { when } from '../../lib/middleware'
 * import { requireAuth } from '../../lib/auth'
 *
 * // Auth seulement en production
 * const authIfProd = when(
 *   () => process.env.NODE_ENV === 'production',
 *   requireAuth()
 * )
 * ```
 */
export function when(
  condition: (c: Context) => boolean | Promise<boolean>,
  middleware: (c: Context, next: Next) => Promise<void>
) {
  return async (c: Context, next: Next) => {
    const shouldRun = await condition(c)
    if (shouldRun) {
      await middleware(c, next)
    } else {
      await next()
    }
  }
}

/**
 * Guard - vérifie une condition, sinon renvoie une erreur
 *
 * @example
 * ```ts
 * import { guard } from '../../lib/middleware'
 *
 * // Vérifier une API key
 * const checkApiKey = guard(
 *   (c) => c.req.header('X-API-Key') === process.env.API_KEY,
 *   401,
 *   'Invalid API key'
 * )
 *
 * export async function GET(c: Context) {
 *   await checkApiKey(c, async () => {})
 *   // ...
 * }
 * ```
 */
export function guard(
  condition: (c: Context) => boolean | Promise<boolean>,
  status: number = 403,
  message: string = 'Forbidden'
) {
  return async (c: Context, next: Next) => {
    const allowed = await condition(c)
    if (!allowed) {
      throw new HTTPException(status, { message })
    }
    await next()
  }
}

/**
 * Validation du body JSON avec un schéma personnalisé
 *
 * @example
 * ```ts
 * import { validateBody } from '../../lib/middleware'
 *
 * const validateUser = validateBody((body) => {
 *   if (!body.email) return 'Email is required'
 *   if (!body.password) return 'Password is required'
 *   return null // valide
 * })
 *
 * export async function POST(c: Context) {
 *   await validateUser(c, async () => {})
 *   const body = await c.req.json()
 *   // body est validé
 * }
 * ```
 */
export function validateBody(validator: (body: unknown) => string | null | Promise<string | null>) {
  return async (c: Context, next: Next) => {
    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      throw new HTTPException(400, { message: 'Invalid JSON body' })
    }

    const error = await validator(body)
    if (error) {
      throw new HTTPException(400, { message: error })
    }

    await next()
  }
}

/**
 * Cache simple en mémoire pour les réponses API
 *
 * @example
 * ```ts
 * import { cache } from '../../lib/middleware'
 *
 * // Cache pendant 60 secondes
 * export async function GET(c: Context) {
 *   return cache(60, async () => {
 *     const data = await fetchExpensiveData()
 *     return c.json(data)
 *   })(c)
 * }
 * ```
 */
const cacheStore = new Map<string, { data: Response; expires: number }>()

export function cache(ttlSeconds: number, handler: (c: Context) => Promise<Response>) {
  return async (c: Context): Promise<Response> => {
    const key = `${c.req.method}:${c.req.url}`
    const now = Date.now()

    const cached = cacheStore.get(key)
    if (cached && cached.expires > now) {
      return cached.data.clone()
    }

    const response = await handler(c)
    cacheStore.set(key, {
      data: response.clone(),
      expires: now + ttlSeconds * 1000
    })

    return response
  }
}

/**
 * Nettoie le cache (utile pour les tests ou invalidation manuelle)
 */
export function clearCache(pattern?: string) {
  if (pattern) {
    for (const key of cacheStore.keys()) {
      if (key.includes(pattern)) {
        cacheStore.delete(key)
      }
    }
  } else {
    cacheStore.clear()
  }
}
