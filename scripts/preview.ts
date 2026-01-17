/**
 * Liho - Preview Server
 * Lance le serveur de production en local pour tester le build
 */

import { existsSync } from 'fs'
import { spawn } from 'child_process'
import { loadConfig } from './config.js'
import { log } from './colors.js'

async function startPreview() {
  const config = await loadConfig()

  // Vérifier que le build existe
  if (!existsSync('dist/server.js')) {
    console.log('')
    log.error('No build found. Run `npm run build` first.')
    console.log('')
    process.exit(1)
  }

  if (!existsSync('dist/client/index.html')) {
    console.log('')
    log.error('Client build missing. Run `npm run build` first.')
    console.log('')
    process.exit(1)
  }

  const port = config.server.port

  console.log('')
  log.info('Starting preview server...')
  console.log('')

  // Lancer le serveur de production
  const server = spawn('node', ['dist/server.js'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(port)
    }
  })

  server.on('error', (err) => {
    log.error(`Failed to start server: ${err.message}`)
    process.exit(1)
  })

  server.on('close', (code) => {
    if (code !== 0) {
      process.exit(code || 1)
    }
  })
}

startPreview().catch((err) => {
  console.error(err)
  process.exit(1)
})
