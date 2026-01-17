/**
 * Liho - Utilitaires
 *
 * Réexporte les utilitaires du framework pour un import simplifié.
 *
 * @example
 * ```ts
 * import { requireAuth, guard, combine } from '../lib'
 * ```
 */

// Auth
export {
  configureAuth,
  requireAuth,
  optionalAuth,
  requireRole,
  setSession,
  clearSession,
  getUser,
  getUserOrNull,
  type User,
  type AuthConfig
} from './auth'

// Middleware
export {
  combine,
  when,
  guard,
  validateBody,
  cache,
  clearCache
} from './middleware'

// Theme (React)
export { useTheme } from './useTheme'
