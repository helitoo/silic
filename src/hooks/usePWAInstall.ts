import { useState, useEffect, useCallback } from "react"

// Store deferred prompt globally to not lose it across re-renders or page transitions
let deferredPrompt: any = null

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault()
    deferredPrompt = e
  })
}

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<any>(() => deferredPrompt)
  const [isInstallable, setIsInstallable] = useState<boolean>(() => !!deferredPrompt)
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return (
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true
      )
    }
    return false
  })

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      deferredPrompt = e
      setInstallPrompt(e)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      setIsInstallable(false)
      setInstallPrompt(null)
      setIsInstalled(true)
      deferredPrompt = null
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    // Check if prompt was already captured
    if (deferredPrompt) {
      setIsInstallable(true)
      setInstallPrompt(deferredPrompt)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const install = useCallback(async (): Promise<"accepted" | "dismissed" | "unavailable"> => {
    if (!installPrompt) {
      return "unavailable"
    }

    // Show native browser install prompt
    installPrompt.prompt()

    // Wait for user choice
    const { outcome } = await installPrompt.userChoice
    setInstallPrompt(null)
    setIsInstallable(false)
    deferredPrompt = null
    return outcome as "accepted" | "dismissed"
  }, [installPrompt])

  return {
    installPrompt,
    isInstallable,
    isInstalled,
    install,
  }
}

export default usePWAInstall
