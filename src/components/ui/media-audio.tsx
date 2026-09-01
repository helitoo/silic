import * as React from "react"
import { Headphones, VolumeX } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { useMediaUrl } from "@/contexts/ProjectStorageContext"

export interface MediaAudioProps
  extends React.AudioHTMLAttributes<HTMLAudioElement> {
  src: string
  title?: string
  skeletonClassName?: string
  fallbackClassName?: string
}

export function MediaAudio({
  src,
  title,
  className,
  skeletonClassName,
  fallbackClassName,
  controls = true,
  ...props
}: MediaAudioProps) {
  const { url, isLoading } = useMediaUrl(src)
  const [isReady, setIsReady] = React.useState(false)
  const [hasError, setHasError] = React.useState(false)

  React.useEffect(() => {
    setIsReady(false)
    setHasError(false)
  }, [src, url])

  if (isLoading || (!isReady && !hasError)) {
    return (
      <div className="flex w-full flex-col gap-2 rounded-lg border border-border/50 bg-card/60 p-3 shadow-2xs">
        {title && (
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Headphones className="size-3.5" />
            <span className="truncate">{title}</span>
          </div>
        )}
        {!isReady && !hasError && (
          <Skeleton
            className={cn("h-11 w-full rounded-md", skeletonClassName)}
          />
        )}
        {url && !hasError && (
          <audio
            src={url}
            controls={controls}
            onCanPlay={() => setIsReady(true)}
            onLoadedData={() => setIsReady(true)}
            onError={() => setHasError(true)}
            className={cn("w-full", isReady ? "block" : "hidden", className)}
            {...props}
          />
        )}
      </div>
    )
  }

  if (hasError || !url) {
    return (
      <div
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg border border-dashed border-border/60 bg-muted/30 p-3 text-muted-foreground",
          fallbackClassName
        )}
      >
        <VolumeX className="size-4 shrink-0" />
        <span className="text-xs font-medium truncate">
          {title || src || "No audio available"}
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-2 rounded-lg border border-border/60 bg-card/60 p-3 shadow-2xs transition-all hover:border-border",
        className
      )}
    >
      {title && (
        <div className="flex items-center gap-2 text-xs font-medium text-foreground">
          <Headphones className="size-3.5 text-primary" />
          <span className="truncate">{title}</span>
        </div>
      )}
      <audio
        src={url}
        controls={controls}
        className="w-full"
        {...props}
      />
    </div>
  )
}

export default MediaAudio
