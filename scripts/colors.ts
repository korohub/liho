/**
 * Liho - Terminal Colors
 * Utilitaires pour afficher des messages colorés dans le terminal
 */

// Codes ANSI pour les couleurs
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',

  // Couleurs de texte
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Couleurs vives
  brightBlack: '\x1b[90m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',

  // Backgrounds
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
}

// Helpers
export const c = {
  // Texte coloré
  red: (text: string) => `${colors.red}${text}${colors.reset}`,
  green: (text: string) => `${colors.green}${text}${colors.reset}`,
  yellow: (text: string) => `${colors.yellow}${text}${colors.reset}`,
  blue: (text: string) => `${colors.blue}${text}${colors.reset}`,
  magenta: (text: string) => `${colors.magenta}${text}${colors.reset}`,
  cyan: (text: string) => `${colors.cyan}${text}${colors.reset}`,
  white: (text: string) => `${colors.white}${text}${colors.reset}`,
  gray: (text: string) => `${colors.brightBlack}${text}${colors.reset}`,

  // Styles
  bold: (text: string) => `${colors.bold}${text}${colors.reset}`,
  dim: (text: string) => `${colors.dim}${text}${colors.reset}`,

  // Combinés
  success: (text: string) => `${colors.green}✓${colors.reset} ${text}`,
  error: (text: string) => `${colors.red}✗${colors.reset} ${text}`,
  warning: (text: string) => `${colors.yellow}⚠${colors.reset} ${text}`,
  info: (text: string) => `${colors.cyan}ℹ${colors.reset} ${text}`,

  // URL mise en valeur
  url: (text: string) => `${colors.bold}${colors.cyan}${text}${colors.reset}`,

  // Badge Liho
  badge: () => `${colors.bgMagenta}${colors.white}${colors.bold} Liho ${colors.reset}`,
}

// Logger formaté
export const log = {
  info: (message: string) => console.log(`${c.badge()} ${message}`),
  success: (message: string) => console.log(`${c.badge()} ${c.success(message)}`),
  warning: (message: string) => console.log(`${c.badge()} ${c.warning(message)}`),
  error: (message: string) => console.log(`${c.badge()} ${c.error(message)}`),

  // Pour les routes
  route: (type: 'page' | 'api' | 'middleware', count: number) => {
    const icon = type === 'page' ? '📄' : type === 'api' ? '🔌' : '🔧'
    const label = type === 'page' ? 'pages' : type === 'api' ? 'API routes' : 'middleware(s)'
    console.log(`${c.badge()} ${icon} Found ${c.bold(c.cyan(String(count)))} ${label}`)
  },

  // Pour le serveur
  server: (port: number) => {
    console.log('')
    console.log(`${c.badge()} ${c.success('Server ready!')}`)
    console.log('')
    console.log(`   ${c.dim('Local:')}   ${c.url(`http://localhost:${port}`)}`)
    console.log('')
  },

  // Pour les changements de fichiers
  change: (filename: string) => {
    console.log(`${c.badge()} ${c.yellow('⟳')} File changed: ${c.dim(filename)}`)
  },

  // Pour les requêtes API
  api: (method: string, path: string, status: number, duration: number) => {
    const methodColors: Record<string, string> = {
      GET: colors.green,
      POST: colors.blue,
      PUT: colors.yellow,
      PATCH: colors.yellow,
      DELETE: colors.red,
    }
    const methodColor = methodColors[method] || colors.white
    const statusColor = status >= 500 ? colors.red : status >= 400 ? colors.yellow : colors.green

    const methodStr = `${methodColor}${method.padEnd(6)}${colors.reset}`
    const statusStr = `${statusColor}${status}${colors.reset}`
    const durationStr = `${colors.dim}${duration}ms${colors.reset}`

    console.log(`${c.badge()} ${methodStr} ${path} ${statusStr} ${durationStr}`)
  },
}
