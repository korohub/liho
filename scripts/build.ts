/**
 * Liho - Build Script
 * Build le projet pour la production
 */

import { buildRoutes } from './router.js'
import { build } from 'vite'
import { build as esbuild } from 'esbuild'
import { loadConfig } from './config.js'
import { log } from './colors.js'
import { readFileSync, writeFileSync, existsSync, cpSync, mkdirSync } from 'fs'

async function buildProject() {
  // Charger la configuration
  const config = await loadConfig()

  // Lire le package.json source pour les versions
  const sourcePkg = JSON.parse(readFileSync('package.json', 'utf-8'))

  console.log('')
  log.info('Building for production...')
  console.log('')

  // 1. Générer les routes
  buildRoutes()

  // 2. Build du frontend avec Vite
  log.info('Building frontend...')
  await build({
    root: 'src',
    build: {
      outDir: `../${config.build.outDir}/client`,
      emptyOutDir: true,
      minify: config.build.minify ? 'esbuild' : false,
      rollupOptions: {
        onwarn(warning, warn) {
          // Ignorer les warnings "use client" de React Router
          if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && warning.message.includes('use client')) {
            return
          }
          warn(warning)
        }
      }
    }
  })

  // 3. Copier le dossier public/ vers dist/client/
  const publicDir = 'public'
  const clientDir = `${config.build.outDir}/client`
  if (existsSync(publicDir)) {
    log.info('Copying public assets...')
    cpSync(publicDir, clientDir, { recursive: true })
  }

  // 4. Build du serveur avec esbuild
  log.info('Building server...')
  await esbuild({
    entryPoints: ['server.ts'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'esm',
    outfile: `${config.build.outDir}/server.js`,
    minify: config.build.minify,
    external: ['@hono/node-server'],
    define: {
      '__DEFAULT_PORT__': String(config.server.port),
      '__ACCESS_LOG_CONSOLE__': String(config.logging.accessLog.console),
      '__ACCESS_LOG_FILE__': config.logging.accessLog.file ? `"${config.logging.accessLog.file}"` : 'null'
    },
    banner: {
      js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);"
    }
  })

  // 5. Générer le package.json pour le déploiement
  log.info('Generating package.json...')

  // Dépendances bundlées par Vite/esbuild (ne pas inclure dans dist/package.json)
  const bundledDeps = new Set([
    'hono',
    'react',
    'react-dom',
    'react-router-dom'
  ])

  // Copier les dépendances de production non-bundlées
  const distDeps: Record<string, string> = {}
  for (const [name, version] of Object.entries(sourcePkg.dependencies || {})) {
    if (!bundledDeps.has(name)) {
      distDeps[name] = version as string
    }
  }

  const distPkg = {
    name: sourcePkg.name || 'liho-app',
    version: sourcePkg.version || '1.0.0',
    type: 'module',
    scripts: {
      start: 'node server.js'
    },
    dependencies: distDeps
  }
  writeFileSync(`${config.build.outDir}/package.json`, JSON.stringify(distPkg, null, 2))

  console.log('')
  log.success('Build complete!')
  log.info(`Output: ${config.build.outDir}/`)
  log.info('Run `npm run preview` to test the build locally')
  console.log('')
}

buildProject().catch(console.error)
