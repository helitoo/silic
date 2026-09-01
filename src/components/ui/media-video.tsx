import * as React from "react"
import { VideoOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { useMediaUrl } from "@/contexts/ProjectStorageContext"

export interface MediaVideoProps
  extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string
  skeletonClassName?: string
  fallbackClassName?: string
}

export function MediaVideo({
  src,
  className,
  skeletonClassName,
  fallbackClassName,
  controls = true,
  ...props
}: MediaVideoProps) {
  const { url, isLoading } = useMediaUrl(src)
  const [isReady, setIsReady] = React.useState(false)
  const [hasError, setHasError] = React.useState(false)

  React.useEffect(() => {
    setIsReady(false)
    setHasError(false)
  }, [src, url])

  if (isLoading || (!isReady && !hasError)) {
    return (
      <div className="relative w-full">
        {!isReady && !hasError && (
          <Skeleton
            className={cn("aspect-video w-full rounded-lg", skeletonClassName)}
          />
        )}
        {url && !hasError && (
          <video
            src={url}
            controls={controls}
            onCanPlay={() => setIsReady(true)}
            onLoadedData={() => setIsReady(true)}
            onError={() => setHasError(true)}
            className={cn(
              "aspect-video w-full rounded-lg bg-black object-contain",
              isReady ? "opacity-100" : "absolute inset-0 opacity-0",
              className
            )}
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
          "flex aspect-video w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/60 bg-muted/30 text-muted-foreground",
          fallbackClassName
        )}
      >
        <VideoOff className="size-6 stroke-[1.5]" />
        <span className="text-[11px] font-medium truncate max-w-[200px]">
          {src || "No video"}
        </span>
      </div>
    )
  }

  return (
    <video
      src={url}
      controls={controls}
      className={cn(
        "aspect-video w-full rounded-lg bg-black object-contain shadow-xs",
        className
      )}
      {...props}
    />
  )
}

export default MediaVideo
