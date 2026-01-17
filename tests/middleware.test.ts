/**
 * Tests pour les utilitaires middleware de Liho
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  combine,
  when,
  guard,
  validateBody,
  cache,
  clearCache,
  getCacheStats,
  stopCacheCleanup
} from '../src/lib/middleware'
import { HTTPException } from 'hono/http-exception'

// Mock du contexte Hono
function createMockContext(options: {
  method?: string
  url?: string
  body?: unknown
  headers?: Record<string, string>
} = {}) {
  const { method = 'GET', url = 'http://localhost/test', body, headers = {} } = options

  return {
    req: {
      method,
      url,
      json: vi.fn().mockResolvedValue(body),
      header: (name: string) => headers[name.toLowerCase()]
    },
    json: vi.fn((data, status = 200) => new Response(JSON.stringify(data), { status })),
    set: vi.fn()
  } as any
}

describe('Middleware - combine', () => {
  it('devrait chaîner plusieurs middlewares', async () => {
    const order: number[] = []

    const mw1 = async (_c: any, next: any) => { order.push(1); await next() }
    const mw2 = async (_c: any, next: any) => { order.push(2); await next() }
    const mw3 = async (_c: any, next: any) => { order.push(3); await next() }

    const combined = combine(mw1, mw2, mw3)
    const ctx = createMockContext()

    await combined(ctx, async () => { order.push(4) })

    expect(order).toEqual([1, 2, 3, 4])
  })

  it('devrait fonctionner avec un seul middleware', async () => {
    let called = false
    const mw = async (_c: any, next: any) => { called = true; await next() }

    const combined = combine(mw)
    const ctx = createMockContext()

    await combined(ctx, async () => {})

    expect(called).toBe(true)
  })

  it('devrait fonctionner sans middleware', async () => {
    let nextCalled = false
    const combined = combine()
    const ctx = createMockContext()

    await combined(ctx, async () => { nextCalled = true })

    expect(nextCalled).toBe(true)
  })
})

describe('Middleware - when', () => {
  it('devrait exécuter le middleware si la condition est vraie', async () => {
    let executed = false
    const mw = async (_c: any, next: any) => { executed = true; await next() }

    const conditional = when(() => true, mw)
    const ctx = createMockContext()

    await conditional(ctx, async () => {})

    expect(executed).toBe(true)
  })

  it('devrait ignorer le middleware si la condition est fausse', async () => {
    let executed = false
    const mw = async (_c: any, next: any) => { executed = true; await next() }

    const conditional = when(() => false, mw)
    const ctx = createMockContext()

    await conditional(ctx, async () => {})

    expect(executed).toBe(false)
  })

  it('devrait supporter les conditions asynchrones', async () => {
    let executed = false
    const mw = async (_c: any, next: any) => { executed = true; await next() }

    const conditional = when(async () => true, mw)
    const ctx = createMockContext()

    await conditional(ctx, async () => {})

    expect(executed).toBe(true)
  })
})

describe('Middleware - guard', () => {
  it('devrait laisser passer si la condition est vraie', async () => {
    let passed = false
    const guardMw = guard(() => true, 403, 'Forbidden')
    const ctx = createMockContext()

    await guardMw(ctx, async () => { passed = true })

    expect(passed).toBe(true)
  })

  it('devrait bloquer avec HTTPException si la condition est fausse', async () => {
    const guardMw = guard(() => false, 401, 'Unauthorized')
    const ctx = createMockContext()

    await expect(guardMw(ctx, async () => {})).rejects.toThrow(HTTPException)
  })

  it('devrait utiliser le status et message personnalisés', async () => {
    const guardMw = guard(() => false, 418, "I'm a teapot")
    const ctx = createMockContext()

    try {
      await guardMw(ctx, async () => {})
    } catch (e) {
      expect(e).toBeInstanceOf(HTTPException)
      expect((e as HTTPException).status).toBe(418)
    }
  })
})

describe('Middleware - validateBody', () => {
  it('devrait passer si la validation réussit', async () => {
    let passed = false
    const validator = (body: any) => body.name ? null : 'Name required'
    const validateMw = validateBody(validator)
    const ctx = createMockContext({ body: { name: 'John' } })

    await validateMw(ctx, async () => { passed = true })

    expect(passed).toBe(true)
  })

  it('devrait bloquer si la validation échoue', async () => {
    const validator = (body: any) => body.email ? null : 'Email required'
    const validateMw = validateBody(validator)
    const ctx = createMockContext({ body: { name: 'John' } })

    await expect(validateMw(ctx, async () => {})).rejects.toThrow(HTTPException)
  })

  it('devrait bloquer si le body n\'est pas du JSON valide', async () => {
    const validator = () => null
    const validateMw = validateBody(validator)
    const ctx = createMockContext()
    ctx.req.json = vi.fn().mockRejectedValue(new Error('Invalid JSON'))

    await expect(validateMw(ctx, async () => {})).rejects.toThrow(HTTPException)
  })
})

describe('Middleware - cache', () => {
  beforeEach(() => {
    clearCache()
  })

  afterEach(() => {
    clearCache()
    stopCacheCleanup()
  })

  it('devrait mettre en cache la réponse', async () => {
    let callCount = 0
    const handler = async (c: any) => {
      callCount++
      return c.json({ count: callCount })
    }

    const cachedHandler = cache(60, handler)
    const ctx = createMockContext({ url: 'http://localhost/api/test' })

    await cachedHandler(ctx)
    await cachedHandler(ctx)

    expect(callCount).toBe(1)
  })

  it('devrait retourner une copie (clone) du cache', async () => {
    const handler = async (c: any) => c.json({ data: 'test' })

    const cachedHandler = cache(60, handler)
    const ctx = createMockContext({ url: 'http://localhost/api/clone' })

    const res1 = await cachedHandler(ctx)
    const res2 = await cachedHandler(ctx)

    expect(res1).not.toBe(res2) // Pas la même référence
  })

  it('clearCache devrait vider le cache', async () => {
    let callCount = 0
    const handler = async (c: any) => {
      callCount++
      return c.json({ count: callCount })
    }

    const cachedHandler = cache(60, handler)
    const ctx = createMockContext({ url: 'http://localhost/api/clear' })

    await cachedHandler(ctx)
    clearCache()
    await cachedHandler(ctx)

    expect(callCount).toBe(2)
  })

  it('clearCache avec pattern devrait supprimer seulement les entrées correspondantes', async () => {
    const handler = async (c: any) => c.json({ ok: true })

    const cached1 = cache(60, handler)
    const cached2 = cache(60, handler)

    const ctx1 = createMockContext({ url: 'http://localhost/api/users' })
    const ctx2 = createMockContext({ url: 'http://localhost/api/posts' })

    await cached1(ctx1)
    await cached2(ctx2)

    const statsBefore = getCacheStats()
    expect(statsBefore.total).toBe(2)

    clearCache('users')

    const statsAfter = getCacheStats()
    expect(statsAfter.total).toBe(1)
  })

  it('getCacheStats devrait retourner les statistiques', async () => {
    const handler = async (c: any) => c.json({ ok: true })
    const cachedHandler = cache(60, handler)

    const ctx = createMockContext({ url: 'http://localhost/api/stats' })
    await cachedHandler(ctx)

    const stats = getCacheStats()
    expect(stats.total).toBeGreaterThanOrEqual(1)
    expect(stats.active).toBeGreaterThanOrEqual(1)
    expect(stats.maxSize).toBe(1000)
  })
})
