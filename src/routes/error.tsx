import { useRouteError, Link } from 'react-router-dom'

export default function RootError() {
  const error = useRouteError() as Error

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600 dark:text-red-500 mb-4">Oops!</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">Une erreur est survenue.</p>
        {error?.message && (
          <pre className="bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-4 rounded mb-4 text-sm">
            {error.message}
          </pre>
        )}
        <Link to="/" className="text-blue-600 dark:text-blue-400 hover:underline">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  )
}
