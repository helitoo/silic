import * as React from "react"
import DOMPurify from "dompurify"
import { Pencil } from "lucide-react"
import { useLongTextEditor } from "@/components/ui/longTextEditor"
import { useLang } from "@/contexts/LangContext"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface LongTextInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  isSmall?: boolean
  disabled?: boolean
  className?: string
}

export function LongTextInput({
  value,
  onChange,
  placeholder,
  isSmall = false,
  disabled = false,
  className,
}: LongTextInputProps) {
  const { t } = useLang()
  const { openEditor } = useLongTextEditor()

  const cleanHtml = React.useMemo(() => {
    return DOMPurify.sanitize(value || "")
  }, [value])

  const isEmpty = React.useMemo(() => {
    if (!value) return true
    // Strip tags to check if there is actual content
    const textOnly = value.replace(/<[^>]*>/g, "").trim()
    return textOnly.length === 0 && !value.includes("<img") && !value.includes("<hr")
  }, [value])

  const handleOpenEditor = () => {
    if (disabled) return
    openEditor({
      initialContent: value || "",
      title: placeholder || t("editor.editTitle"),
      onSave: (newHtml) => {
        onChange(newHtml)
      },
    })
  }

  return (
    <div
      className={cn(
        "flex w-full items-stretch gap-1.5",
        isSmall ? "min-h-[42px]" : "min-h-[56px]",
        className
      )}
    >
      {/* Sanitized HTML Content Display */}
      <div
        className={cn(
          "flex-1 overflow-hidden rounded-md border border-input bg-card/60 px-3 py-2 text-xs transition-colors",
          "focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/50",
          isSmall ? "max-h-24 overflow-y-auto" : "max-h-40 overflow-y-auto"
        )}
      >
        {isEmpty ? (
          <p className="text-xs text-muted-foreground italic select-none">
            {placeholder || t("entityDialog.fieldValuePlaceholder")}
          </p>
        ) : (
          <div
            className="rich-text-content prose-xs dark:prose-invert pointer-events-auto select-text break-words"
            dangerouslySetInnerHTML={{ __html: cleanHtml }}
          />
        )}
      </div>

      {/* Edit Button */}
      <Button
        type="button"
        variant="outline"
        size={isSmall ? "icon-xs" : "sm"}
        disabled={disabled}
        onClick={handleOpenEditor}
        className={cn(
          "shrink-0 gap-1.5 self-start font-medium",
          isSmall ? "size-8 rounded-md" : "h-9 px-2.5 text-xs"
        )}
        title={t("entityDialog.editMode")}
      >
        <Pencil className="size-3.5 text-muted-foreground group-hover:text-foreground" />
        {!isSmall && <span>{t("entityDialog.editMode")}</span>}
      </Button>
    </div>
  )
}

export default LongTextInput
