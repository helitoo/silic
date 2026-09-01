import * as React from "react"
import { Check, Copy } from "lucide-react"

import { cn } from "@/lib/utils"
import { Toggle } from "@/components/ui/toggle"
import { useLang } from "@/contexts/LangContext"

export interface CopyButtonProps extends React.ComponentProps<typeof Toggle> {
  content?: string
}

function CopyButton({
  content,
  className,
  variant = "outline",
  size = "default",
  children,
  onClick,
  onPressedChange,
  ...props
}: CopyButtonProps) {
  const [isCopied, setIsCopied] = React.useState(false)
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  let t: ((key: string) => string) | undefined
  try {
    const langContext = useLang()
    t = langContext.t
  } catch {
    // fallback if outside LangProvider
  }

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleCopy: React.ComponentProps<typeof Toggle>["onClick"] = async (
    event
  ) => {
    onClick?.(event)
    if (event.defaultPrevented) return

    if (content !== undefined) {
      try {
        await navigator.clipboard.writeText(content)
        setIsCopied(true)

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        timeoutRef.current = setTimeout(() => {
          setIsCopied(false)
        }, 1000)
      } catch (err) {
        console.error("Failed to copy text to clipboard:", err)
      }
    }
  }

  const copiedText = t ? t("common.copied") : "Copied"
  const copyText = t ? t("common.copyToClipboard") : "Copy to clipboard"

  return (
    <Toggle
      type="button"
      variant={variant}
      size={size}
      pressed={isCopied}
      onPressedChange={(pressed, eventDetails) => {
        onPressedChange?.(pressed, eventDetails)
      }}
      onClick={handleCopy}
      className={cn("shrink-0 cursor-pointer", className)}
      aria-label={isCopied ? copiedText : copyText}
      title={isCopied ? copiedText : copyText}
      {...props}
    >
      {isCopied ? (
        <Check className="size-3.5 text-emerald-500" />
      ) : (
        <Copy className="size-3.5" />
      )}
      {children}
    </Toggle>
  )
}

export { CopyButton, CopyButton as CoppyButton }
