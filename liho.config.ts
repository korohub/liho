import { defineConfig } from './scripts/config'

export default defineConfig({
  // ─── SERVEUR ───────────────────────────────────────────────
  server: {
    port: 4010,           // Port dev et prod (override: PORT=8080)
    host: 'localhost'     // Host du serveur
  },

  // ─── LOGS ──────────────────────────────────────────────────
  logging: {
    level: 'verbose',     // 'none' | 'minimal' | 'verbose'
    apiRequests: true,    // Log coloré des requêtes API en dev

    // Access log format Apache Combined + temps de réponse
    // Ex: 127.0.0.1 - - [17/Jan/2026:18:30:45 +0100] "GET /api/users HTTP/1.1" 200 1234 "-" "Mozilla/5.0..." 45ms
    accessLog: {
      console: false,     // Afficher en console
      file: undefined     // Chemin fichier (ex: './logs/access.log')
      // Note: l'écriture disque ajoute une I/O par requête
      // Fort trafic: préférer console + redirection système (node server.js >> access.log)
      // Penser à configurer logrotate si file est activé
    }
  },

  // ─── BUILD ─────────────────────────────────────────────────
  build: {
    outDir: 'dist',       // Dossier de sortie
    minify: true          // Minifier le code
  }
})
