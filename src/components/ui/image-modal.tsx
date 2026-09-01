import * as React from "react"
import Lightbox from "yet-another-react-lightbox"
import Zoom from "yet-another-react-lightbox/plugins/zoom"
import Captions from "yet-another-react-lightbox/plugins/captions"
import Counter from "yet-another-react-lightbox/plugins/counter"
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen"
import Download from "yet-another-react-lightbox/plugins/download"
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails"

import "yet-another-react-lightbox/styles.css"
import "yet-another-react-lightbox/plugins/captions.css"
import "yet-another-react-lightbox/plugins/counter.css"
import "yet-another-react-lightbox/plugins/thumbnails.css"

import { getAttachment } from "@/lib/db"

export interface ImageModalItem {
  src: string
  title?: string
  description?: string
}

export interface ImageModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  src?: string | null
  title?: string
  images?: Array<string | ImageModalItem>
  initialIndex?: number
  currentIndex?: number
  onIndexChange?: (index: number) => void
}

/**
 * Hook to resolve image sources (both URLs and IndexedDB attachment IDs)
 * to live object URLs for lightbox display.
 */
function useResolvedMediaMap(items: ImageModalItem[]) {
  const [resolvedMap, setResolvedMap] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    let active = true
    const createdBlobUrls: string[] = []

    async function resolveAll() {
      const map: Record<string, string> = {}

      for (const item of items) {
        if (!item.src) continue
        const trimmed = item.src.trim()
        if (
          trimmed.startsWith("http://") ||
          trimmed.startsWith("https://") ||
          trimmed.startsWith("data:") ||
          trimmed.startsWith("blob:")
        ) {
          map[trimmed] = trimmed
        } else {
          try {
            const rec = await getAttachment(trimmed)
            if (!active) return
            if (rec && rec.blob) {
              const objUrl = URL.createObjectURL(rec.blob)
              createdBlobUrls.push(objUrl)
              map[trimmed] = objUrl
            } else {
              map[trimmed] = trimmed
            }
          } catch (err) {
            console.error("Failed to load attachment for lightbox:", err)
            map[trimmed] = trimmed
          }
        }
      }

      if (active) {
        setResolvedMap(map)
      }
    }

    resolveAll()

    return () => {
      active = false
      createdBlobUrls.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [items])

  return resolvedMap
}

export function ImageModal({
  open,
  onOpenChange,
  src,
  title,
  images,
  initialIndex = 0,
  currentIndex: controlledIndex,
  onIndexChange,
}: ImageModalProps) {
  // Normalize items array
  const items = React.useMemo<ImageModalItem[]>(() => {
    if (images && images.length > 0) {
      return images.map((item) =>
        typeof item === "string" ? { src: item } : item
      )
    }
    if (src) {
      return [{ src, title }]
    }
    return []
  }, [images, src, title])

  const resolvedMap = useResolvedMediaMap(items)

  const [uncontrolledIndex, setUncontrolledIndex] = React.useState(initialIndex)
  const isControlled = controlledIndex !== undefined
  const activeIndex = isControlled ? controlledIndex : uncontrolledIndex

  // Sync index when opening
  React.useEffect(() => {
    if (open) {
      setUncontrolledIndex(initialIndex)
    }
  }, [open, initialIndex])

  // Build slides with resolved URLs and captions
  const slides = React.useMemo(() => {
    return items.map((item) => {
      const resolvedSrc = resolvedMap[item.src.trim()] || item.src
      return {
        src: resolvedSrc,
        title: item.title,
        description: item.description,
        download: {
          url: resolvedSrc,
          filename: item.title ? `${item.title}.png` : "image.png",
        },
      }
    })
  }, [items, resolvedMap])

  if (!open || slides.length === 0) return null

  return (
    <Lightbox
      open={open}
      close={() => onOpenChange(false)}
      index={activeIndex}
      slides={slides}
      plugins={[Zoom, Captions, Counter, Fullscreen, Download, Thumbnails]}
      carousel={{
        finite: false, // Infinite circular loop
        preload: 2,
        imageFit: "contain",
        padding: "16px",
      }}
      zoom={{
        scrollToZoom: true,
        maxZoomPixelRatio: 5,
        zoomInMultiplier: 1.5,
        doubleTapDelay: 300,
        doubleClickDelay: 300,
        doubleClickMaxStops: 2,
        wheelZoomDistanceFactor: 100,
        pinchZoomDistanceFactor: 100,
      }}
      thumbnails={{
        position: "bottom",
        width: 80,
        height: 50,
        border: 2,
        borderRadius: 6,
        padding: 4,
        gap: 8,
        showToggle: true,
      }}
      captions={{
        showToggle: false,
        descriptionTextAlign: "center",
      }}
      counter={{
        container: {
          style: {
            top: "16px",
            left: "16px",
          },
        },
      }}
      controller={{
        closeOnBackdropClick: true,
        closeOnEscape: true,
      }}
      styles={{
        root: {
          "--yarl__color_backdrop": "rgba(0, 0, 0, 0.85)",
          "--yarl__color_button": "rgba(255, 255, 255, 0.85)",
          "--yarl__color_button_active": "#ffffff",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        },
      }}
      on={{
        view: ({ index: newIdx }) => {
          if (!isControlled) {
            setUncontrolledIndex(newIdx)
          }
          onIndexChange?.(newIdx)
        },
      }}
    />
  )
}

export default ImageModal
