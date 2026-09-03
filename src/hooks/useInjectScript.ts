import { useSyncExternalStore } from "react"

type InjectorType = "init" | "loading" | "loaded" | "error"

interface InjectorState {
  listeners: Set<() => void>
  injectorMap: Record<string, InjectorType>
  scriptMap: Record<string, HTMLScriptElement>
}

const injectorState: InjectorState = {
  listeners: new Set(),
  injectorMap: {},
  scriptMap: {},
}

function notify() {
  injectorState.listeners.forEach((listener) => listener())
}

/**
 * Injects a script tag into the document if not already loaded,
 * with listener notifications and error handling.
 */
export function injectScript(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      resolve(false)
      return
    }

    if (injectorState.injectorMap[url] === "loaded") {
      resolve(true)
      return
    }

    if (injectorState.injectorMap[url] === "error") {
      resolve(false)
      return
    }

    const existing = document.querySelector(
      `script[src="${url}"]`
    ) as HTMLScriptElement | null

    if (existing && existing.dataset.loaded === "true") {
      injectorState.injectorMap[url] = "loaded"
      notify()
      resolve(true)
      return
    }

    if (!injectorState.scriptMap[url] && !existing) {
      const script = document.createElement("script")
      script.src = url
      script.async = true
      script.defer = true
      injectorState.scriptMap[url] = script

      const onScriptEvent = (isError: boolean) => {
        if (isError) {
          injectorState.injectorMap[url] = "error"
          script.remove()
        } else {
          injectorState.injectorMap[url] = "loaded"
          script.dataset.loaded = "true"
        }
        delete injectorState.scriptMap[url]
        notify()
        resolve(!isError)
      }

      script.addEventListener("load", () => onScriptEvent(false))
      script.addEventListener("error", () => onScriptEvent(true))
      injectorState.injectorMap[url] = "loading"
      notify()
      document.body.appendChild(script)
    } else if (existing && !injectorState.scriptMap[url]) {
      existing.addEventListener("load", () => {
        injectorState.injectorMap[url] = "loaded"
        existing.dataset.loaded = "true"
        notify()
        resolve(true)
      })
      existing.addEventListener("error", () => {
        injectorState.injectorMap[url] = "error"
        notify()
        resolve(false)
      })
    }
  })
}

function subscribe(callback: () => void) {
  injectorState.listeners.add(callback)
  return () => {
    injectorState.listeners.delete(callback)
  }
}

/**
 * Hook to inject and track loading state of an external JavaScript script using useSyncExternalStore.
 */
export default function useInjectScript(url: string): [boolean, boolean] {
  const status = useSyncExternalStore(
    subscribe,
    () => injectorState.injectorMap[url] || "init",
    () => "init"
  )

  if (status === "init" && typeof window !== "undefined") {
    injectScript(url)
  }

  const loaded = status === "loaded"
  const error = status === "error"

  return [loaded, error]
}
