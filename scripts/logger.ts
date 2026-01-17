/**
 * Liho - Access Logger
 * Format Apache Combined + temps de réponse
 */

import { appendFile, mkdir } from 'fs/promises'
import { dirname } from 'path'

export interface AccessLogConfig {
  console: boolean
  file: string | null
}

/**
 * Formate une date au format Apache
 * Ex: 17/Jan/2026:18:30:45 +0100
 */
function formatApacheDate(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const day = String(date.getDate()).padStart(2, '0')
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  // Timezone offset
  const tzOffset = -date.getTimezoneOffset()
  const tzSign = tzOffset >= 0 ? '+' : '-'
  const tzHours = String(Math.floor(Math.abs(tzOffset) / 60)).padStart(2, '0')
  const tzMinutes = String(Math.abs(tzOffset) % 60).padStart(2, '0')

  return `${day}/${month}/${year}:${hours}:${minutes}:${seconds} ${tzSign}${tzHours}${tzMinutes}`
}

/**
 * Génère une ligne de log au format Apache Combined + temps de réponse
 * Format: IP - - [DATE] "METHOD PATH HTTP/1.1" STATUS SIZE "REFERER" "USER-AGENT" DURATIONms
 */
export function formatAccessLog(
  ip: string,
  method: string,
  path: string,
  status: number,
  size: number,
  referer: string | null,
  userAgent: string | null,
  durationMs: number
): string {
  const date = formatApacheDate(new Date())
  const ref = referer || '-'
  const ua = userAgent || '-'

  return `${ip} - - [${date}] "${method} ${path} HTTP/1.1" ${status} ${size} "${ref}" "${ua}" ${durationMs}ms`
}

/**
 * Écrit une ligne de log selon la configuration (non-bloquant)
 */
export function writeAccessLog(config: AccessLogConfig, logLine: string): void {
  if (config.console) {
    console.log(logLine)
  }

  if (config.file) {
    const filePath = config.file
    // Écriture asynchrone pour ne pas bloquer l'event loop
    mkdir(dirname(filePath), { recursive: true })
      .then(() => appendFile(filePath, logLine + '\n'))
      .catch(() => { /* ignore silently */ })
  }
}

/**
 * Vérifie si le logging est activé
 */
export function isAccessLogEnabled(config: AccessLogConfig): boolean {
  return config.console || config.file !== null
}
