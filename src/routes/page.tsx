export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Liho</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8 text-center max-w-md">
        Un starter léger avec React, Hono et file-based routing.
      </p>

      <a
        href="/api/hello"
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
        target="_blank"
      >
        Test API
      </a>

      <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
        <p>Modifier <code className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">src/routes/page.tsx</code> pour commencer</p>
      </div>
    </div>
  )
}
