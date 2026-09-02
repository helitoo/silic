import * as React from "react"

export type TabType = "diagram" | "entities" | "connections" | "templates"

export type AppRoute =
  | { type: "landing" }
  | { type: "home"; tab: TabType }
  | { type: "entity-detail"; id: string }
  | { type: "guide" }
  | { type: "docs-query" }
  | { type: "docs-storage" }
  | { type: "terms-of-service" }
  | { type: "policy-of-privacy" }
  | { type: "help" }
  | { type: "not-found" }

export interface RouterContextType {
  pathname: string
  search: string
  searchParams: URLSearchParams
  currentUrl: string
  route: AppRoute
  tab: TabType
  historyStack: string[]
  navigate: (to: string, options?: { replace?: boolean }) => void
  navigateTab: (tab: TabType) => void
  goBack: (fallback?: string) => void
  canGoBack: boolean
}

const RouterContext = React.createContext<RouterContextType | undefined>(
  undefined
)

export function parseRoute(pathname: string, search: string): AppRoute {
  const cleanPath = pathname.replace(/\/+$/, "") || "/"
  const searchParams = new URLSearchParams(search)

  // 1. Landing page at root "/"
  if (cleanPath === "/" || cleanPath === "") {
    return { type: "landing" }
  }

  // 2. Guide & Docs pages
  if (cleanPath === "/guide") {
    return { type: "guide" }
  }
  if (cleanPath === "/docs-query") {
    return { type: "docs-query" }
  }
  if (cleanPath === "/docs-storage") {
    return { type: "docs-storage" }
  }
  if (cleanPath === "/terms-of-service") {
    return { type: "terms-of-service" }
  }
  if (cleanPath === "/policy-of-privacy") {
    return { type: "policy-of-privacy" }
  }
  if (cleanPath === "/help") {
    return { type: "help" }
  }

  // 3. Main app home at "/d"
  if (cleanPath === "/d") {
    const rawTab = searchParams.get("tab")
    const validTabs: TabType[] = ["diagram", "entities", "connections", "templates"]
    const tab = (rawTab && validTabs.includes(rawTab as TabType)
      ? rawTab
      : "entities") as TabType
    return { type: "home", tab }
  }

  // 4. /d/entity/:id/detail (also supports legacy /entity/:id/detail)
  const entityDetailMatch = cleanPath.match(/^(?:\/d)?\/entity\/([^/]+)\/detail$/)
  if (entityDetailMatch) {
    return {
      type: "entity-detail",
      id: decodeURIComponent(entityDetailMatch[1]),
    }
  }

  return { type: "not-found" }
}

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [currentUrl, setCurrentUrl] = React.useState<string>(() => {
    if (typeof window !== "undefined") {
      return window.location.pathname + window.location.search
    }
    return "/"
  })

  const [historyStack, setHistoryStack] = React.useState<string[]>([currentUrl])

  // Synchronize on browser forward / back button (popstate event)
  React.useEffect(() => {
    const handlePopState = () => {
      const newUrl = window.location.pathname + window.location.search
      setCurrentUrl(newUrl)
      setHistoryStack((prev) => {
        if (prev.length > 1 && prev[prev.length - 2] === newUrl) {
          return prev.slice(0, -1)
        }
        return [...prev, newUrl]
      })
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  // Scroll to top whenever page or route URL changes
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" })
      document.documentElement.scrollTo({ top: 0, left: 0, behavior: "instant" })
      document.body.scrollTo({ top: 0, left: 0, behavior: "instant" })
    }
  }, [currentUrl])

  const [pathname, search] = React.useMemo(() => {
    const qIndex = currentUrl.indexOf("?")
    if (qIndex === -1) {
      return [currentUrl || "/", ""]
    }
    return [currentUrl.slice(0, qIndex) || "/", currentUrl.slice(qIndex)]
  }, [currentUrl])

  const searchParams = React.useMemo(() => new URLSearchParams(search), [search])
  const route = React.useMemo(() => parseRoute(pathname, search), [pathname, search])

  const tab: TabType = React.useMemo(() => {
    if (route.type === "home") {
      return route.tab
    }
    const rawTab = searchParams.get("tab")
    const validTabs: TabType[] = ["diagram", "entities", "connections", "templates"]
    if (rawTab && validTabs.includes(rawTab as TabType)) {
      return rawTab as TabType
    }
    return "entities"
  }, [route, searchParams])

  const navigate = React.useCallback(
    (to: string, options?: { replace?: boolean }) => {
      if (typeof window === "undefined") return

      const formattedTo = to.startsWith("/") ? to : `/${to}`
      if (options?.replace) {
        window.history.replaceState(null, "", formattedTo)
        setHistoryStack((prev) => [...prev.slice(0, -1), formattedTo])
      } else {
        window.history.pushState(null, "", formattedTo)
        setHistoryStack((prev) => [...prev, formattedTo])
      }
      setCurrentUrl(formattedTo)
    },
    []
  )

  const navigateTab = React.useCallback(
    (targetTab: TabType) => {
      navigate(`/d?tab=${targetTab}`)
    },
    [navigate]
  )

  const goBack = React.useCallback(
    (fallback = "/d?tab=entities") => {
      if (typeof window !== "undefined" && window.history.length > 1 && historyStack.length > 1) {
        window.history.back()
      } else {
        navigate(fallback, { replace: true })
      }
    },
    [historyStack.length, navigate]
  )

  const canGoBack = historyStack.length > 1

  const value = React.useMemo(
    () => ({
      pathname,
      search,
      searchParams,
      currentUrl,
      route,
      tab,
      historyStack,
      navigate,
      navigateTab,
      goBack,
      canGoBack,
    }),
    [
      pathname,
      search,
      searchParams,
      currentUrl,
      route,
      tab,
      historyStack,
      navigate,
      navigateTab,
      goBack,
      canGoBack,
    ]
  )

  return (
    <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
  )
}

export function useRouter() {
  const context = React.useContext(RouterContext)
  if (!context) {
    throw new Error("useRouter must be used within a RouterProvider")
  }
  return context
}

export default RouterContext
