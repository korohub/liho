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
      file: null
    }
  },
  build: {
    outDir: 'dist',
    minify: true
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
  return config
}

/**
 * Charge la configuration depuis liho.config.ts
 * Fusionne avec les valeurs par défaut
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

    // Fusion profonde avec les valeurs par défaut
    return {
      server: { ...defaultConfig.server, ...userConfig.server },
      logging: {
        ...defaultConfig.logging,
        ...userConfig.logging,
        accessLog: {
          console: userConfig.logging?.accessLog?.console ?? defaultConfig.logging.accessLog.console,
          file: userConfig.logging?.accessLog?.file ?? defaultConfig.logging.accessLog.file
        }
      },
      build: { ...defaultConfig.build, ...userConfig.build }
    }
  } catch (error) {
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
