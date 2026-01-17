import { defineConfig } from './scripts/config'

export default defineConfig({
  // Serveur de développement
  server: {
    port: 4010,
    host: 'localhost'
  },

  // Logs
  logging: {
    // 'none' | 'minimal' | 'verbose'
    level: 'verbose',
    // Logger les requêtes API avec temps de réponse
    apiRequests: true
  },

  // Build production
  build: {
    outDir: 'dist',
    minify: true
  }
})
