import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom'

/**
 * Extrait un message d'erreur lisible depuis useRouteError()
 * Gère les différents types de retour possibles :
 * - Response (erreur HTTP)
 * - Error (exception JS)
 * - Autres types (fallback)
 */
function getErrorInfo(error: unknown): { status?: number; message: string } {
  // Erreur HTTP (404, 500, etc.) retournée par React Router
  if (isRouteErrorResponse(error)) {
    return {
      status: error.status,
      message: error.statusText || `Erreur ${error.status}`
    }
  }

  // Exception JavaScript standard
  if (error instanceof Error) {
    return { message: error.message }
  }

  // String brute
  if (typeof error === 'string') {
    return { message: error }
  }

  // Fallback pour les types inconnus
  return { message: 'Une erreur inconnue est survenue' }
}

export default function RootError() {
  const error = useRouteError()
  const { status, message } = getErrorInfo(error)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600 dark:text-red-500 mb-4">
          {status ? `Erreur ${status}` : 'Oops!'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">Une erreur est survenue.</p>
        <pre className="bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-4 rounded mb-4 text-sm max-w-md mx-auto">
          {message}
        </pre>
        <Link to="/" className="text-blue-600 dark:text-blue-400 hover:underline">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  )
}
