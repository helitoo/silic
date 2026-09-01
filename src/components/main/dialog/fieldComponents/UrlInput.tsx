import { ExternalLink } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface UrlInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  isSmall?: boolean
  disabled?: boolean
  className?: string
}

export function UrlInput({
  value,
  onChange,
  placeholder = "https://...",
  isSmall = false,
  disabled = false,
  className,
}: UrlInputProps) {
  return (
    <div
      className={cn(
        "relative flex items-center",
        isSmall ? "flex-1" : "w-full",
        className
      )}
    >
      <Input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          isSmall ? "h-7 flex-1" : "h-8 w-full",
          "pr-7 font-mono text-xs"
        )}
      />
      {value && String(value).trim() !== "" && (
        <a
          href={
            String(value).startsWith("http")
              ? String(value)
              : `https://${String(value)}`
          }
          target="_blank"
          rel="noreferrer"
          className={cn(
            "absolute text-muted-foreground hover:text-primary",
            isSmall ? "right-1.5" : "right-2"
          )}
          title="Open link"
        >
          <ExternalLink className="size-3.5" />
        </a>
      )}
    </div>
  )
}

export default UrlInput
