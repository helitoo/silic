import * as React from "react"
import { getAttachment } from "@/lib/db"

/**
 * Hook to resolve any image / audio / video / file source string.
 * Supports web URLs (http/https/data/blob) and local attachment IDs stored in IndexedDB.
 * Automatically handles creation and revocation of Object URLs.
 */
export function useMediaUrl(idOrUrl?: string | null): {
  url: string | null
  isLoading: boolean
  isAttachment: boolean
} {
  const isExternalOrEmpty =
    !idOrUrl ||
    typeof idOrUrl !== "string" ||
    idOrUrl.trim() === "" ||
    idOrUrl.startsWith("http://") ||
    idOrUrl.startsWith("https://") ||
    idOrUrl.startsWith("data:") ||
    idOrUrl.startsWith("blob:")

  const initialUrl = isExternalOrEmpty
    ? !idOrUrl || typeof idOrUrl !== "string" || idOrUrl.trim() === ""
      ? null
      : idOrUrl.trim()
    : null

  const [resolvedUrl, setResolvedUrl] = React.useState<string | null>(initialUrl)
  const [isLoading, setIsLoading] = React.useState(!isExternalOrEmpty)
  const [isAttachment, setIsAttachment] = React.useState(!isExternalOrEmpty)

  React.useEffect(() => {
    if (!idOrUrl || typeof idOrUrl !== "string" || idOrUrl.trim() === "") {
      setResolvedUrl(null)
      setIsLoading(false)
      setIsAttachment(false)
      return
    }

    const trimmed = idOrUrl.trim()

    if (
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed.startsWith("data:") ||
      trimmed.startsWith("blob:")
    ) {
      setResolvedUrl(trimmed)
      setIsLoading(false)
      setIsAttachment(false)
      return
    }

    let active = true
    let createdUrl: string | null = null
    setIsLoading(true)
    setIsAttachment(true)

    getAttachment(trimmed)
      .then((record) => {
        if (!active) return
        if (record && record.blob) {
          createdUrl = URL.createObjectURL(record.blob)
          setResolvedUrl(createdUrl)
        } else {
          setResolvedUrl(trimmed)
        }
      })
      .catch((err) => {
        console.error("Failed to load attachment blob:", err)
        if (active) setResolvedUrl(trimmed)
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl)
      }
    }
  }, [idOrUrl])

  return {
    url: isExternalOrEmpty ? initialUrl : resolvedUrl,
    isLoading: isExternalOrEmpty ? false : isLoading,
    isAttachment: isExternalOrEmpty ? false : isAttachment,
  }
}

export default useMediaUrl
