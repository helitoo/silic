import * as React from "react"
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

export const UrlInput = React.memo(function UrlInput({
  value,
  onChange,
  placeholder = "https://...",
  isSmall = false,
  disabled = false,
  className,
}: UrlInputProps) {
  const [localVal, setLocalVal] = React.useState(value ?? "")

  React.useEffect(() => {
    setLocalVal(value ?? "")
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value
    setLocalVal(next)
    onChange(next)
  }

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
        value={localVal}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(isSmall ? "h-7 flex-1" : "h-8 w-full", "pr-7 text-xs")}
      />
      {localVal && String(localVal).trim() !== "" && (
        <a
          href={
            String(localVal).startsWith("http")
              ? String(localVal)
              : `https://${String(localVal)}`
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
})

export default UrlInput

