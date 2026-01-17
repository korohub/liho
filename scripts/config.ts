/**
 * Liho - Configuration
 * Types et utilitaires pour la configuration du framework
 */

import { existsSync } from 'fs'
import { pathToFileURL } from 'url'
import { resolve } from 'path'

// Types de configuration
export interface LihoConfig {
  /** Configuration du serveur de développement */
  server?: {
    /** Port (défaut: 4010) */
    port?: number
    /** Host (défaut: 'localhost') */
    host?: string
  }

  /** Configuration des logs */
  logging?: {
    /** Niveau de log: 'none' | 'minimal' | 'verbose' (défaut: 'verbose') */
    level?: 'none' | 'minimal' | 'verbose'
    /** Logger les requêtes API avec temps de réponse (défaut: true en dev) */
    apiRequests?: boolean
    /** Access log style Apache Combined avec temps de réponse */
    accessLog?: {
      /** Activer les logs en console (défaut: false) */
      console?: boolean
      /** Chemin du fichier de log (désactivé si non spécifié) */
      file?: string
      /** Filtrer les requêtes Vite en dev (défaut: true) */
      devFilter?: boolean
    }
  }

  /** Configuration du build */
  build?: {
    /** Dossier de sortie (défaut: 'dist') */
    outDir?: string
    /** Minifier le code (défaut: true) */
    minify?: boolean
  }
}

/** Configuration résolue avec toutes les valeurs par défaut appliquées */
export interface ResolvedConfig {
  server: {
    port: number
    host: string
  }
  logging: {
    level: 'none' | 'minimal' | 'verbose'
    apiRequests: boolean
    accessLog: {
      console: boolean
      file: string | null
      devFilter: boolean
    }
  }
  build: {
    outDir: string
    minify: boolean
  }
}

// Configuration par défaut
const defaultConfig: ResolvedConfig = {
  server: {
    port: 4010,
    host: 'localhost'
  },
  logging: {
    level: 'verbose',
    apiRequests: true,
    accessLog: {
      console: false,
      file: null,
      devFilter: true
    }
  },
  build: {
    outDir: 'dist',
    minify: true
  }
}

/**
 * Erreur de validation de la configuration
 */
export class ConfigValidationError extends Error {
  constructor(message: string) {
    super(`[Liho Config] ${message}`)
    this.name = 'ConfigValidationError'
  }
}

/**
 * Valide la configuration utilisateur
 * Lance une erreur si la configuration est invalide
 */
function validateConfig(config: LihoConfig): void {
  // Validation du port
  if (config.server?.port !== undefined) {
    const port = config.server.port
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new ConfigValidationError(
        `Port invalide: ${port}. Le port doit être un entier entre 1 et 65535.`
      )
    }
  }

  // Validation du host
  if (config.server?.host !== undefined) {
    const host = config.server.host
    if (typeof host !== 'string' || host.trim() === '') {
      throw new ConfigValidationError(
        `Host invalide: ${host}. Le host doit être une chaîne non vide.`
      )
    }
  }

  // Validation du niveau de log
  if (config.logging?.level !== undefined) {
    const validLevels = ['none', 'minimal', 'verbose']
    if (!validLevels.includes(config.logging.level)) {
      throw new ConfigValidationError(
        `Niveau de log invalide: ${config.logging.level}. Valeurs acceptées: ${validLevels.join(', ')}`
      )
    }
  }

  // Validation du chemin de fichier de log
  if (config.logging?.accessLog?.file !== undefined) {
    const file = config.logging.accessLog.file
    if (typeof file !== 'string' || file.trim() === '') {
      throw new ConfigValidationError(
        `Chemin de fichier de log invalide: ${file}. Doit être une chaîne non vide ou undefined.`
      )
    }
  }

  // Validation du dossier de sortie
  if (config.build?.outDir !== undefined) {
    const outDir = config.build.outDir
    if (typeof outDir !== 'string' || outDir.trim() === '') {
      throw new ConfigValidationError(
        `Dossier de sortie invalide: ${outDir}. Doit être une chaîne non vide.`
      )
    }
    // Vérifier que le chemin ne pointe pas vers des dossiers sensibles
    const forbidden = ['/', '/home', '/root', '/etc', '/var', '/usr', 'node_modules', 'src']
    if (forbidden.includes(outDir.toLowerCase())) {
      throw new ConfigValidationError(
        `Dossier de sortie interdit: ${outDir}. Ce chemin est protégé.`
      )
    }
  }
}

/**
 * Helper pour définir la configuration avec autocomplétion TypeScript
 *
 * @example
 * ```ts
 * // liho.config.ts
 * import { defineConfig } from './scripts/config'
 *
 * export default defineConfig({
 *   server: { port: 3000 },
 *   logging: { level: 'minimal' }
 * })
 * ```
 */
export function defineConfig(config: LihoConfig): LihoConfig {
  // Valider au moment de la définition pour des erreurs précoces
  validateConfig(config)
  return config
}

/**
 * Charge la configuration depuis liho.config.ts
 * Fusionne avec les valeurs par défaut et valide
 */
export async function loadConfig(): Promise<ResolvedConfig> {
  const configPath = resolve('liho.config.ts')

  if (!existsSync(configPath)) {
    return defaultConfig
  }

  try {
    // Import dynamique du fichier de config
    const configModule = await import(pathToFileURL(configPath).href)
    const userConfig: LihoConfig = configModule.default || {}

    // Valider la configuration utilisateur
    validateConfig(userConfig)

    // Fusion profonde avec les valeurs par défaut
    return {
      server: { ...defaultConfig.server, ...userConfig.server },
      logging: {
        ...defaultConfig.logging,
        ...userConfig.logging,
        accessLog: {
          console: userConfig.logging?.accessLog?.console ?? defaultConfig.logging.accessLog.console,
          file: userConfig.logging?.accessLog?.file ?? defaultConfig.logging.accessLog.file,
          devFilter: userConfig.logging?.accessLog?.devFilter ?? defaultConfig.logging.accessLog.devFilter
        }
      },
      build: { ...defaultConfig.build, ...userConfig.build }
    }
  } catch (error) {
    // Propager les erreurs de validation
    if (error instanceof ConfigValidationError) {
      throw error
    }
    console.warn('[Liho] Error loading config, using defaults:', error)
    return defaultConfig
  }
}

/**
 * Retourne la configuration par défaut
 */
export function getDefaultConfig(): ResolvedConfig {
  return { ...defaultConfig }
}
