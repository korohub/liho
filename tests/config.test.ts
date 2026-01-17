/**
 * Tests pour la configuration de Liho
 */

import { describe, it, expect } from 'vitest'
import { defineConfig, getDefaultConfig, ConfigValidationError } from '../scripts/config'

describe('Configuration - Valeurs par défaut', () => {
  it('devrait retourner les valeurs par défaut correctes', () => {
    const config = getDefaultConfig()

    expect(config.server.port).toBe(4010)
    expect(config.server.host).toBe('localhost')
    expect(config.logging.level).toBe('verbose')
    expect(config.logging.apiRequests).toBe(true)
    expect(config.logging.accessLog.console).toBe(false)
    expect(config.logging.accessLog.file).toBeNull()
    expect(config.logging.accessLog.devFilter).toBe(true)
    expect(config.build.outDir).toBe('dist')
    expect(config.build.minify).toBe(true)
  })
})

describe('Configuration - Validation', () => {
  describe('Port', () => {
    it('devrait accepter un port valide', () => {
      expect(() => defineConfig({ server: { port: 3000 } })).not.toThrow()
      expect(() => defineConfig({ server: { port: 8080 } })).not.toThrow()
      expect(() => defineConfig({ server: { port: 1 } })).not.toThrow()
      expect(() => defineConfig({ server: { port: 65535 } })).not.toThrow()
    })

    it('devrait rejeter un port invalide', () => {
      expect(() => defineConfig({ server: { port: 0 } })).toThrow(ConfigValidationError)
      expect(() => defineConfig({ server: { port: -1 } })).toThrow(ConfigValidationError)
      expect(() => defineConfig({ server: { port: 65536 } })).toThrow(ConfigValidationError)
      expect(() => defineConfig({ server: { port: 3.14 } })).toThrow(ConfigValidationError)
    })
  })

  describe('Host', () => {
    it('devrait accepter un host valide', () => {
      expect(() => defineConfig({ server: { host: 'localhost' } })).not.toThrow()
      expect(() => defineConfig({ server: { host: '0.0.0.0' } })).not.toThrow()
      expect(() => defineConfig({ server: { host: '192.168.1.1' } })).not.toThrow()
    })

    it('devrait rejeter un host vide', () => {
      expect(() => defineConfig({ server: { host: '' } })).toThrow(ConfigValidationError)
      expect(() => defineConfig({ server: { host: '   ' } })).toThrow(ConfigValidationError)
    })
  })

  describe('Niveau de log', () => {
    it('devrait accepter les niveaux valides', () => {
      expect(() => defineConfig({ logging: { level: 'none' } })).not.toThrow()
      expect(() => defineConfig({ logging: { level: 'minimal' } })).not.toThrow()
      expect(() => defineConfig({ logging: { level: 'verbose' } })).not.toThrow()
    })

    it('devrait rejeter les niveaux invalides', () => {
      // @ts-expect-error - Test d'un niveau invalide
      expect(() => defineConfig({ logging: { level: 'debug' } })).toThrow(ConfigValidationError)
      // @ts-expect-error - Test d'un niveau invalide
      expect(() => defineConfig({ logging: { level: 'info' } })).toThrow(ConfigValidationError)
    })
  })

  describe('Dossier de sortie', () => {
    it('devrait accepter un dossier valide', () => {
      expect(() => defineConfig({ build: { outDir: 'dist' } })).not.toThrow()
      expect(() => defineConfig({ build: { outDir: 'build' } })).not.toThrow()
      expect(() => defineConfig({ build: { outDir: './output' } })).not.toThrow()
    })

    it('devrait rejeter un dossier vide', () => {
      expect(() => defineConfig({ build: { outDir: '' } })).toThrow(ConfigValidationError)
    })

    it('devrait rejeter les dossiers protégés', () => {
      expect(() => defineConfig({ build: { outDir: 'src' } })).toThrow(ConfigValidationError)
      expect(() => defineConfig({ build: { outDir: 'node_modules' } })).toThrow(ConfigValidationError)
    })
  })

  describe('Chemin fichier de log', () => {
    it('devrait accepter un chemin valide', () => {
      expect(() => defineConfig({
        logging: { accessLog: { file: './logs/access.log' } }
      })).not.toThrow()
    })

    it('devrait rejeter un chemin vide', () => {
      expect(() => defineConfig({
        logging: { accessLog: { file: '' } }
      })).toThrow(ConfigValidationError)
    })
  })
})

describe('Configuration - defineConfig', () => {
  it('devrait retourner la config passée en paramètre', () => {
    const input = { server: { port: 5000 } }
    const result = defineConfig(input)
    expect(result).toEqual(input)
  })

  it('devrait accepter une config vide', () => {
    const result = defineConfig({})
    expect(result).toEqual({})
  })

  it('devrait accepter une config partielle', () => {
    const input = {
      server: { port: 8080 },
      logging: { level: 'minimal' as const }
    }
    const result = defineConfig(input)
    expect(result.server?.port).toBe(8080)
    expect(result.logging?.level).toBe('minimal')
  })
})
