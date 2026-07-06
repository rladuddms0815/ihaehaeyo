import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

export type Route =
  | '/'
  | '/onboarding'
  | '/dashboard'
  | '/scan'
  | '/explanation'
  | '/voice'
  | '/family'
  | '/chat'
  | '/settings'
  | '/documents'
  | '/help'
  | '/scam-check'

interface RouterContextType {
  route: Route
  params: Record<string, unknown>
  navigate: (path: Route, params?: Record<string, unknown>) => void
  goBack: () => void
  replaceParams: (params: Record<string, unknown>) => void
}

const RouterContext = createContext<RouterContextType | null>(null)

// Global state store for navigation data
const navigationState = new Map<string, unknown>()

export function useRouterContext() {
  const context = useContext(RouterContext)
  if (!context) {
    throw new Error('useRouterContext must be used within RouterProvider')
  }
  return context
}

export function useRouter() {
  const { navigate, goBack, params, route } = useRouterContext()
  return { navigate, goBack, params, route }
}

export function useLocation<T = Record<string, unknown>>() {
  const { route } = useRouterContext()
  const [state, setState] = useState<T | null>(null)

  useEffect(() => {
    // Retrieve state from navigation store
    const storedState = navigationState.get(route)
    setState(storedState as T | null)
  }, [route])

  return { state }
}

export function useNavigate() {
  const { navigate } = useRouterContext()
  return navigate
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>(() => {
    // Initialize from hash on first render
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.slice(1) || '/'
      return hash as Route
    }
    return '/'
  })
  const [params, setParams] = useState<Record<string, unknown>>({})
  const [history, setHistory] = useState<Route[]>([])

  useEffect(() => {
    // Handle initial hash and hash changes
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || '/'
      setRoute(hash as Route)
    }

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange)

    // Set initial route
    handleHashChange()

    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const navigate = useCallback((path: Route, newParams?: Record<string, unknown>) => {
    // Store params in navigation state before navigating
    if (newParams) {
      navigationState.set(path, newParams)
      setParams(newParams)
    } else {
      setParams({})
    }

    setRoute(path)
    setHistory(prev => [...prev, path])
    window.location.hash = path
  }, [])

  const goBack = useCallback(() => {
    if (history.length > 0) {
      const newHistory = history.slice(0, -1)
      setHistory(newHistory)
      const prevRoute = newHistory[newHistory.length - 1] || '/'
      setRoute(prevRoute)
      window.location.hash = prevRoute
    } else {
      setRoute('/')
      window.location.hash = '/'
    }
  }, [history])

  const replaceParams = useCallback((newParams: Record<string, unknown>) => {
    setParams(newParams)
    navigationState.set(route, newParams)
  }, [route])

  return (
    <RouterContext.Provider value={{ route, params, navigate, goBack, replaceParams }}>
      {children}
    </RouterContext.Provider>
  )
}

export { RouterProvider as BrowserRouter }
