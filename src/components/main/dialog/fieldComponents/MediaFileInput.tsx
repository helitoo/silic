import * as React from "react"
import {
  File as FileIcon,
  Image as ImageIcon,
  Video as VideoIcon,
  Headphones as AudioIcon,
  Upload,
  X,
  Loader2,
} from "lucide-react"
import type { Type } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useProjectStorage } from "@/contexts/ProjectStorageContext"
import { useLang } from "@/contexts/LangContext"
import { uploadSingleFile } from "@/lib/localFiles/uploadFile"
import { useMediaUrl } from "@/lib/hooks/useMediaUrl"

export interface MediaFileInputProps {
  type: Type // "image" | "video" | "audio" | "file"
  value: string
  onChange: (value: string) => void
  placeholder?: string
  isSmall?: boolean
  inList?: boolean
  disabled?: boolean
  className?: string
}

function formatFileSize(bytes?: number): string {
  if (!bytes || isNaN(bytes)) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const MediaFileInput = React.memo(function MediaFileInput({
  type,
  value,
  onChange,
  placeholder,
  isSmall = false,
  inList = false,
  disabled = false,
  className,
}: MediaFileInputProps) {
  const {
    attachments,
    addAttachment,
    updateAttachmentCaption,
    removeAttachment,
  } = useProjectStorage()
  const { t } = useLang()
  const { url, isLoading } = useMediaUrl(value)
  const [prevUrl, setPrevUrl] = React.useState(url)
  const [imgError, setImgError] = React.useState(false)

  if (prevUrl !== url) {
    setPrevUrl(url)
    setImgError(false)
  }

  const matchedAttachment = React.useMemo(() => {
    if (!value || typeof value !== "string") return null
    return attachments.find((a) => a.id === value) || null
  }, [attachments, value])

  const [localCaption, setLocalCaption] = React.useState<string>(
    matchedAttachment?.caption ?? ""
  )

  React.useEffect(() => {
    setLocalCaption(matchedAttachment?.caption ?? "")
  }, [matchedAttachment?.id, matchedAttachment?.caption])

  const handleBlurCaption = () => {
    if (disabled || !value) return
    const currentStoredCaption = matchedAttachment?.caption ?? ""
    if (localCaption !== currentStoredCaption) {
      updateAttachmentCaption(value, localCaption)
    }
  }

  const handleKeyDownCaption = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur()
    }
  }

  const accept = React.useMemo(() => {
    switch (type) {
      case "image":
        return "image/*"
      case "video":
        return "video/*"
      case "audio":
        return "audio/*"
      default:
        return "*/*"
    }
  }, [type])

  const uploadPlaceholder = React.useMemo(() => {
    if (
      placeholder &&
      placeholder.trim() !== "" &&
      !placeholder.includes("Nhập giá trị") &&
      !placeholder.includes("Enter value")
    ) {
      return placeholder
    }
    return t("common.uploadFile")
  }, [placeholder, t])

  const handleUploadFromDevice = async () => {
    if (disabled) return
    const file = await uploadSingleFile({ accept })
    if (file) {
      if (value && typeof value === "string") {
        try {
          await removeAttachment(value)
        } catch {
          // ignore
        }
      }
      const meta = await addAttachment(file)
      onChange(meta.id)
    }
  }

  const handleClear = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    if (value && typeof value === "string") {
      try {
        await removeAttachment(value)
      } catch {
        // ignore
      }
    }
    onChange("")
  }

  const hasValue = Boolean(value && value.trim() !== "")

  // 1. When NOT uploaded: Render a single upload button
  if (!hasValue) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={handleUploadFromDevice}
        disabled={disabled}
        className={cn(
          "group/upload flex w-full items-center justify-center gap-2 border-dashed border-border/80 bg-muted/20 font-normal text-muted-foreground transition-all hover:border-primary/60 hover:bg-muted/40 hover:text-foreground",
          isSmall ? "h-7 px-2 text-[11px]" : "h-8 px-2.5 text-xs",
          className
        )}
      >
        <Upload className="size-3.5 shrink-0" />
        <span className="truncate">{uploadPlaceholder}</span>
      </Button>
    )
  }

  // 2. When uploaded: Render preview thumbnail, file info, replace button and optional remove button
  const isInList = isSmall || inList

  return (
    <div
      className={cn(
        "flex w-full items-center gap-1.5 min-w-0",
        className
      )}
    >
      {/* Left side: Thumbnail Preview */}
      <div
        onClick={handleUploadFromDevice}
        className={cn(
          "relative flex shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-border bg-muted/40 shadow-2xs transition-all hover:border-primary/60 hover:shadow-xs",
          isSmall ? "size-7" : "size-8",
          disabled && "cursor-not-allowed opacity-60"
        )}
        title={matchedAttachment?.id || value}
      >
        {isLoading ? (
          <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
        ) : url && !imgError && type === "image" ? (
          <img
            src={url}
            alt="Preview"
            className="size-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : type === "image" ? (
          <div className="flex size-full items-center justify-center bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
            <ImageIcon className={isSmall ? "size-3.5" : "size-4"} />
          </div>
        ) : url && type === "video" ? (
          <div className="relative flex size-full items-center justify-center bg-black/80">
            <video src={url} className="size-full object-cover opacity-75" />
            <VideoIcon className="absolute size-3 text-white/90 drop-shadow" />
          </div>
        ) : type === "audio" ? (
          <div className="flex size-full items-center justify-center bg-violet-500/10 text-violet-500 dark:text-violet-400">
            <AudioIcon className={isSmall ? "size-3.5" : "size-4"} />
          </div>
        ) : (
          <div className="flex size-full items-center justify-center bg-blue-500/10 text-blue-500 dark:text-blue-400">
            <FileIcon className={isSmall ? "size-3.5" : "size-4"} />
          </div>
        )}
      </div>

      {/* Right side: File details card with editable caption */}
      <div
        className={cn(
          "flex flex-1 min-w-0 items-center justify-between gap-1.5 rounded-md border border-border/60 bg-muted/20 px-1.5 text-xs transition-colors hover:border-border",
          isSmall ? "h-7 text-[11px]" : "h-8"
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <Input
            value={localCaption}
            placeholder={matchedAttachment?.id || value}
            onChange={(e) => setLocalCaption(e.target.value)}
            onBlur={handleBlurCaption}
            onKeyDown={handleKeyDownCaption}
            disabled={disabled}
            className={cn(
              "h-6 flex-1 min-w-0 border-transparent bg-transparent px-1.5 text-[11px] font-medium text-foreground placeholder:text-muted-foreground/60 hover:border-border/60 focus:border-primary focus:bg-background focus:ring-1 focus:ring-primary/20 transition-all",
              isSmall && "h-5 text-[10.5px] px-1"
            )}
            title={`Caption: ${localCaption || matchedAttachment?.id || value}`}
          />
          {matchedAttachment?.size ? (
            <span className="shrink-0 text-[10px] text-muted-foreground font-sans pr-1 select-none">
              ({formatFileSize(matchedAttachment.size)})
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "rounded text-muted-foreground hover:text-foreground",
              isSmall ? "size-5" : "size-6"
            )}
            onClick={handleUploadFromDevice}
            disabled={disabled}
            title={t("common.replaceFile")}
          >
            <Upload className={isSmall ? "size-3" : "size-3.5"} />
          </Button>

          {/* Only show inner Remove button when NOT in an array list */}
          {!isInList && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
                isSmall ? "size-5" : "size-6"
              )}
              onClick={handleClear}
              disabled={disabled}
              title={t("common.removeFile")}
            >
              <X className={isSmall ? "size-3" : "size-3.5"} />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
})

export default MediaFileInput
