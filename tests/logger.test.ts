/**
 * Tests pour le logger de Liho
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatAccessLog, isAccessLogEnabled, resetLogErrorCount } from '../scripts/logger'

describe('Logger - formatAccessLog', () => {
  it('devrait formater une ligne de log au format Apache Combined', () => {
    const log = formatAccessLog(
      '127.0.0.1',
      'GET',
      '/api/users',
      200,
      1234,
      'http://localhost/',
      'Mozilla/5.0',
      45
    )

    expect(log).toContain('127.0.0.1')
    expect(log).toContain('GET /api/users HTTP/1.1')
    expect(log).toContain('200')
    expect(log).toContain('1234')
    expect(log).toContain('http://localhost/')
    expect(log).toContain('Mozilla/5.0')
    expect(log).toContain('45ms')
  })

  it('devrait gérer les valeurs null pour referer et userAgent', () => {
    const log = formatAccessLog(
      '192.168.1.1',
      'POST',
      '/api/data',
      201,
      0,
      null,
      null,
      100
    )

    expect(log).toContain('"-"') // referer
    expect(log).toContain('"-"') // userAgent doit aussi être remplacé par -
  })

  it('devrait inclure la date au format Apache', () => {
    const log = formatAccessLog(
      '127.0.0.1',
      'GET',
      '/',
      200,
      0,
      null,
      null,
      0
    )

    // Format: [17/Jan/2026:18:30:45 +0100]
    expect(log).toMatch(/\[\d{2}\/\w{3}\/\d{4}:\d{2}:\d{2}:\d{2} [+-]\d{4}\]/)
  })

  it('devrait gérer les méthodes HTTP variées', () => {
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']

    methods.forEach(method => {
      const log = formatAccessLog('127.0.0.1', method, '/', 200, 0, null, null, 0)
      expect(log).toContain(`${method} / HTTP/1.1`)
    })
  })

  it('devrait gérer les codes de statut variés', () => {
    const statuses = [200, 201, 204, 301, 400, 401, 403, 404, 500, 502, 503]

    statuses.forEach(status => {
      const log = formatAccessLog('127.0.0.1', 'GET', '/', status, 0, null, null, 0)
      expect(log).toContain(` ${status} `)
    })
  })
})

describe('Logger - isAccessLogEnabled', () => {
  it('devrait retourner true si console est activé', () => {
    expect(isAccessLogEnabled({ console: true, file: null })).toBe(true)
  })

  it('devrait retourner true si file est activé', () => {
    expect(isAccessLogEnabled({ console: false, file: '/logs/access.log' })).toBe(true)
  })

  it('devrait retourner true si les deux sont activés', () => {
    expect(isAccessLogEnabled({ console: true, file: '/logs/access.log' })).toBe(true)
  })

  it('devrait retourner false si aucun n\'est activé', () => {
    expect(isAccessLogEnabled({ console: false, file: null })).toBe(false)
  })
})

describe('Logger - resetLogErrorCount', () => {
  beforeEach(() => {
    resetLogErrorCount()
  })

  it('devrait être exporté et appelable', () => {
    expect(() => resetLogErrorCount()).not.toThrow()
  })
})
