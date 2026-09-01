import * as React from "react"
import { ImageOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { useMediaUrl } from "@/contexts/ProjectStorageContext"

export interface MediaImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  skeletonClassName?: string
  fallbackClassName?: string
}

export function MediaImage({
  src,
  alt = "Image",
  className,
  skeletonClassName,
  fallbackClassName,
  onClick,
  ...props
}: MediaImageProps) {
  const { url, isLoading } = useMediaUrl(src)
  const [isLoaded, setIsLoaded] = React.useState(false)
  const [hasError, setHasError] = React.useState(false)

  // Reset states when src changes
  React.useEffect(() => {
    setIsLoaded(false)
    setHasError(false)
  }, [src, url])

  if (isLoading || (!isLoaded && !hasError)) {
    return (
      <div className="relative w-full">
        {!isLoaded && !hasError && (
          <Skeleton
            className={cn("aspect-video w-full rounded-lg", skeletonClassName)}
          />
        )}
        {url && !hasError && (
          <img
            src={url}
            alt={alt}
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            onClick={onClick}
            className={cn(
              "aspect-video w-full rounded-lg object-cover transition-opacity duration-300",
              isLoaded ? "opacity-100" : "absolute inset-0 opacity-0",
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
        <ImageOff className="size-6 stroke-[1.5]" />
        <span className="text-[11px] font-medium truncate max-w-[200px]">
          {src || "No image"}
        </span>
      </div>
    )
  }

  return (
    <img
      src={url}
      alt={alt}
      onClick={onClick}
      className={cn(
        "aspect-video w-full rounded-lg object-cover transition-opacity duration-300",
        className
      )}
      {...props}
    />
  )
}

export default MediaImage
