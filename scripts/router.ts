/**
 * Liho - File-based Router v2
 * Supporte: nested layouts, error pages, loading states, route groups, middleware API
 */

import { readdirSync, statSync, existsSync, writeFileSync, mkdirSync, readFileSync } from 'fs'
import { join, relative, basename } from 'path'
import { log } from './colors.js'

/**
 * Analyse les exports d'un fichier TypeScript
 * Retourne la liste des exports nommés trouvés
 */
function analyzeExports(filePath: string): string[] {
  if (!existsSync(filePath)) return []

  const content = readFileSync(filePath, 'utf-8')
  const exports: string[] = []

  // Patterns pour détecter les exports
  // export async function GET
  // export function GET
  // export const GET
  // export { GET }

  const patterns = [
    /export\s+(?:async\s+)?function\s+(\w+)/g,
    /export\s+const\s+(\w+)/g,
    /export\s+default\s/g,
  ]

  // Fonctions et constantes exportées
  let match
  while ((match = patterns[0].exec(content)) !== null) {
    exports.push(match[1])
  }
  while ((match = patterns[1].exec(content)) !== null) {
    exports.push(match[1])
  }

  // Export default
  if (patterns[2].test(content)) {
    exports.push('default')
  }

  return exports
}

const ROUTES_DIR = 'src/routes'
const GENERATED_DIR = 'src/_generated'

// Types pour l'arbre de routes
interface RouteNode {
  segment: string           // Segment URL (vide pour root, ignoré pour groups)
  urlPath: string           // Chemin URL complet
  dirPath: string           // Chemin du dossier
  isGroup: boolean          // (group) → pas de segment URL
  page?: string             // Chemin vers page.tsx
  layout?: string           // Chemin vers layout.tsx
  error?: string            // Chemin vers error.tsx
  loading?: string          // Chemin vers loading.tsx
  children: RouteNode[]     // Routes enfantes
}

interface ApiRoute {
  path: string
  filePath: string
  methods: string[]         // Méthodes réellement exportées (GET, POST, etc.)
}

interface MiddlewareRoute {
  path: string              // Pattern (ex: /api/*, /api/protected/*)
  filePath: string
  exports: string[]         // Exports réels (default, onRequest, etc.)
}

/**
 * Convertit un segment de fichier en segment URL
 * [id] → :id
 * [...slug] → *
 * (group) → '' (ignoré)
 */
function segmentToUrlSegment(segment: string): string {
  // Route group - pas de segment URL
  if (segment.startsWith('(') && segment.endsWith(')')) {
    return ''
  }
  return segment
    .replace(/\[\.\.\.(\w+)\]/g, '*')      // [...slug] → *
    .replace(/\[(\w+)\]/g, ':$1')          // [id] → :id
}

/**
 * Vérifie si un dossier est un route group
 */
function isRouteGroup(name: string): boolean {
  return name.startsWith('(') && name.endsWith(')')
}

/**
 * Construit l'arbre de routes à partir du système de fichiers
 */
function buildRouteTree(dir: string, baseDir: string = dir, parentUrl: string = ''): RouteNode {
  const dirName = basename(dir)
  const isGroup = isRouteGroup(dirName)
  const segment = dir === baseDir ? '' : segmentToUrlSegment(dirName)

  // Construire le chemin URL
  let urlPath = parentUrl
  if (segment && !isGroup) {
    urlPath = parentUrl === '/' ? `/${segment}` : `${parentUrl}/${segment}`
  }
  if (urlPath === '') urlPath = '/'

  const node: RouteNode = {
    segment,
    urlPath,
    dirPath: relative(baseDir, dir) || '.',
    isGroup,
    children: []
  }

  if (!existsSync(dir)) {
    return node
  }

  const entries = readdirSync(dir)

  for (const entry of entries) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      // Ignorer les dossiers api/ pour les pages (traités séparément)
      if (entry === 'api') continue

      // Récursion dans les sous-dossiers
      const childNode = buildRouteTree(fullPath, baseDir, urlPath)
      node.children.push(childNode)
    } else if (stat.isFile()) {
      const relativePath = relative(baseDir, fullPath).replace(/\\/g, '/')

      // Détecter les fichiers spéciaux
      switch (entry) {
        case 'page.tsx':
          node.page = relativePath
          break
        case 'layout.tsx':
          node.layout = relativePath
          break
        case 'error.tsx':
          node.error = relativePath
          break
        case 'loading.tsx':
          node.loading = relativePath
          break
      }
    }
  }

  return node
}

/**
 * Scanne les routes API
 */
function scanApiRoutes(apiDir: string): { apis: ApiRoute[], middlewares: MiddlewareRoute[] } {
  const apis: ApiRoute[] = []
  const middlewares: MiddlewareRoute[] = []

  if (!existsSync(apiDir)) {
    return { apis, middlewares }
  }

  function scan(dir: string, urlPrefix: string) {
    const entries = readdirSync(dir)

    for (const entry of entries) {
      const fullPath = join(dir, entry)
      const stat = statSync(fullPath)

      if (stat.isDirectory()) {
        const segment = segmentToUrlSegment(entry)
        scan(fullPath, `${urlPrefix}/${segment}`)
      } else if (stat.isFile() && entry.endsWith('.ts')) {
        const relativePath = relative(ROUTES_DIR, fullPath).replace(/\\/g, '/')
        const fileExports = analyzeExports(fullPath)

        // Middleware spécial
        if (entry === 'middleware.ts') {
          const middlewareExports = fileExports.filter(e =>
            e === 'default' || e === 'onRequest'
          )
          if (middlewareExports.length > 0) {
            middlewares.push({
              path: `${urlPrefix}/*`,
              filePath: relativePath,
              exports: middlewareExports
            })
          }
          continue
        }

        const isIndex = entry === 'index.ts'
        let urlPath = urlPrefix

        if (!isIndex) {
          const fileName = entry.replace('.ts', '')
          const segment = segmentToUrlSegment(fileName)
          urlPath = `${urlPrefix}/${segment}`
        }

        // Nettoyer le path
        urlPath = urlPath.replace(/\/+/g, '/')
        if (urlPath.endsWith('/')) urlPath = urlPath.slice(0, -1)
        if (!urlPath) urlPath = '/api'

        // Filtrer uniquement les méthodes HTTP exportées
        const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
        const exportedMethods = fileExports.filter(e => httpMethods.includes(e))

        if (exportedMethods.length > 0) {
          apis.push({
            path: urlPath,
            filePath: relativePath,
            methods: exportedMethods
          })
        }
      }
    }
  }

  scan(apiDir, '/api')
  return { apis, middlewares }
}

/**
 * Collecte tous les imports nécessaires depuis l'arbre de routes
 */
interface ImportInfo {
  name: string
  path: string
}

function collectImports(node: RouteNode, imports: Map<string, ImportInfo>, counter: { value: number }) {
  if (node.page) {
    const name = `Page${counter.value++}`
    imports.set(node.page, { name, path: `../routes/${node.page.replace('.tsx', '')}` })
  }
  if (node.layout) {
    const name = `Layout${counter.value++}`
    imports.set(node.layout, { name, path: `../routes/${node.layout.replace('.tsx', '')}` })
  }
  if (node.error) {
    const name = `Error${counter.value++}`
    imports.set(node.error, { name, path: `../routes/${node.error.replace('.tsx', '')}` })
  }
  if (node.loading) {
    const name = `Loading${counter.value++}`
    imports.set(node.loading, { name, path: `../routes/${node.loading.replace('.tsx', '')}` })
  }

  for (const child of node.children) {
    collectImports(child, imports, counter)
  }
}

interface RouteOutput {
  config: string
  hoisted: string[]  // Routes à remonter au parent (quand pas de layout)
}

/**
 * Génère la configuration de route React Router pour un nœud
 */
function generateRouteConfig(
  node: RouteNode,
  imports: Map<string, ImportInfo>,
  depth: number = 0,
  pathPrefix: string = ''
): RouteOutput {
  const indent = '  '.repeat(depth + 1)
  const childIndent = '  '.repeat(depth + 2)

  // Déterminer le path de la route
  let routePath: string
  if (depth === 0) {
    routePath = '/'
  } else if (node.isGroup) {
    routePath = ''
  } else {
    routePath = pathPrefix ? `${pathPrefix}/${node.segment}` : node.segment
  }

  const hasLayout = !!node.layout
  const hasError = !!node.error
  const hasPage = !!node.page

  // Collecter les routes enfantes et les routes à remonter
  const childRoutes: string[] = []
  const hoistedRoutes: string[] = []

  // Traiter les enfants récursivement
  for (const child of node.children) {
    if (child.isGroup) {
      // Route group: remonter tous les enfants
      for (const grandChild of child.children) {
        const result = generateRouteConfig(grandChild, imports, depth + 1, '')
        if (result.config) childRoutes.push(result.config)
        hoistedRoutes.push(...result.hoisted)
      }
      // Page du group elle-même
      if (child.page) {
        const pageName = imports.get(child.page)!.name
        childRoutes.push(`${childIndent}{ index: true, element: <${pageName} /> }`)
      }
    } else if (hasLayout) {
      // Ce nœud a un layout, donc les enfants sont imbriqués normalement
      const result = generateRouteConfig(child, imports, depth + 1, '')
      if (result.config) childRoutes.push(result.config)
      // Les routes hoisted des enfants remontent ici dans children
      childRoutes.push(...result.hoisted)
    } else {
      // Ce nœud n'a PAS de layout, les enfants doivent être remontés
      // avec leur chemin préfixé par notre segment
      const prefix = node.segment || ''
      const result = generateRouteConfig(child, imports, depth, prefix)
      if (result.config) hoistedRoutes.push(result.config)
      hoistedRoutes.push(...result.hoisted)
    }
  }

  // Si pas de page, pas de layout, et pas d'error - ce nœud est transparent
  if (!hasPage && !hasLayout && !hasError) {
    return { config: '', hoisted: hoistedRoutes }
  }

  // Construire la configuration de route
  const parts: string[] = []
  parts.push(`${indent}{`)

  if (routePath) {
    parts.push(`${childIndent}path: '${routePath}',`)
  }

  // Element
  if (hasLayout) {
    const layoutName = imports.get(node.layout!)!.name
    if (node.loading) {
      const loadingName = imports.get(node.loading)!.name
      parts.push(`${childIndent}element: <Suspense fallback={<${loadingName} />}><${layoutName} /></Suspense>,`)
    } else {
      parts.push(`${childIndent}element: <${layoutName} />,`)
    }
  } else if (hasPage) {
    const pageName = imports.get(node.page!)!.name
    if (node.loading) {
      const loadingName = imports.get(node.loading)!.name
      parts.push(`${childIndent}element: <Suspense fallback={<${loadingName} />}><${pageName} /></Suspense>,`)
    } else {
      parts.push(`${childIndent}element: <${pageName} />,`)
    }
  }

  // Error boundary
  if (hasError) {
    const errorName = imports.get(node.error!)!.name
    parts.push(`${childIndent}errorElement: <${errorName} />,`)
  }

  // Children (seulement si layout)
  if (hasLayout) {
    const allChildren: string[] = []

    // Route index pour la page de ce nœud
    if (hasPage) {
      const pageName = imports.get(node.page!)!.name
      allChildren.push(`${childIndent}{ index: true, element: <${pageName} /> }`)
    }

    allChildren.push(...childRoutes)

    if (allChildren.length > 0) {
      parts.push(`${childIndent}children: [`)
      parts.push(allChildren.join(',\n'))
      parts.push(`${childIndent}]`)
    }
  }

  parts.push(`${indent}}`)

  return { config: parts.join('\n'), hoisted: hoistedRoutes }
}

/**
 * Génère le fichier des routes React
 */
function generateReactRoutes(tree: RouteNode): string {
  const imports = new Map<string, ImportInfo>()
  const counter = { value: 0 }

  // Collecter tous les imports
  collectImports(tree, imports, counter)

  // Générer les lignes d'import
  const importLines = Array.from(imports.values())
    .map(info => `import ${info.name} from '${info.path}'`)
    .join('\n')

  // Vérifier si on a besoin de Suspense
  const needsSuspense = Array.from(imports.keys()).some(k => k.includes('loading'))

  // Générer la configuration des routes
  const result = generateRouteConfig(tree, imports)
  const routeConfig = result.config

  return `// Auto-generated by Liho - DO NOT EDIT
import React${needsSuspense ? ', { Suspense }' : ''} from 'react'
import { Outlet } from 'react-router-dom'

${importLines}

export const routes = [
${routeConfig}
]
`
}

/**
 * Génère le fichier des routes API Hono
 */
function generateApiRoutes(apis: ApiRoute[], middlewares: MiddlewareRoute[]): string {
  const imports: string[] = []
  const middlewareRegistrations: string[] = []
  const routes: string[] = []

  // Imports et registration des middlewares
  middlewares.forEach((mw, index) => {
    const moduleName = `middleware${index}`
    const importPath = `../routes/${mw.filePath.replace('.ts', '')}`

    // Importer uniquement les exports existants
    const namedImports = mw.exports.filter(e => e !== 'default').join(', ')
    const defaultImport = mw.exports.includes('default') ? `${moduleName}Default` : ''

    if (defaultImport && namedImports) {
      imports.push(`import ${defaultImport}, { ${namedImports} } from '${importPath}'`)
    } else if (defaultImport) {
      imports.push(`import ${defaultImport} from '${importPath}'`)
    } else if (namedImports) {
      imports.push(`import { ${namedImports} } from '${importPath}'`)
    }

    // Enregistrer les middlewares
    const registrations: string[] = [`// Middleware: ${mw.path}`]
    if (mw.exports.includes('default')) {
      registrations.push(`app.use('${mw.path}', ${defaultImport})`)
    }
    if (mw.exports.includes('onRequest')) {
      registrations.push(`app.use('${mw.path}', onRequest)`)
    }
    middlewareRegistrations.push(registrations.join('\n'))
  })

  // Imports et routes API
  apis.forEach((api, index) => {
    const moduleName = `api${index}`
    const importPath = `../routes/${api.filePath.replace('.ts', '')}`

    // Importer uniquement les méthodes exportées
    const namedImports = api.methods.map(m => `${m} as ${moduleName}_${m}`).join(', ')
    imports.push(`import { ${namedImports} } from '${importPath}'`)

    // Enregistrer les routes
    const routeLines: string[] = [`// ${api.path}`]
    for (const method of api.methods) {
      const honoMethod = method.toLowerCase()
      routeLines.push(`app.${honoMethod}('${api.path}', ${moduleName}_${method})`)
    }
    routes.push(routeLines.join('\n'))
  })

  return `// Auto-generated by Liho - DO NOT EDIT
import { Hono } from 'hono'

${imports.join('\n')}

export const app = new Hono()

${middlewareRegistrations.join('\n\n')}

${routes.join('\n\n')}
`
}

/**
 * Compte les pages et routes
 */
function countRoutes(node: RouteNode): number {
  let count = node.page ? 1 : 0
  for (const child of node.children) {
    count += countRoutes(child)
  }
  return count
}

/**
 * Fonction principale
 */
export function buildRoutes(): { pages: number, apis: number } {
  // Construire l'arbre de routes pour les pages
  const tree = buildRouteTree(ROUTES_DIR)
  const pageCount = countRoutes(tree)

  // Scanner les routes API
  const { apis, middlewares } = scanApiRoutes(join(ROUTES_DIR, 'api'))

  // Afficher les résultats
  log.route('page', pageCount)
  log.route('api', apis.length)
  if (middlewares.length > 0) {
    log.route('middleware', middlewares.length)
  }

  // Créer le dossier _generated s'il n'existe pas
  if (!existsSync(GENERATED_DIR)) {
    mkdirSync(GENERATED_DIR, { recursive: true })
  }

  // Générer les fichiers
  const reactRoutes = generateReactRoutes(tree)
  const apiRoutes = generateApiRoutes(apis, middlewares)

  writeFileSync(join(GENERATED_DIR, 'routes.tsx'), reactRoutes)
  writeFileSync(join(GENERATED_DIR, 'api.ts'), apiRoutes)

  log.success('Routes generated')

  return { pages: pageCount, apis: apis.length }
}

// Exécution directe
if (import.meta.url === `file://${process.argv[1]}`) {
  buildRoutes()
}
