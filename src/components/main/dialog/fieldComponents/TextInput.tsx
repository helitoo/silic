import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface TextInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  isSmall?: boolean
  disabled?: boolean
  className?: string
  type?: string
}

export function TextInput({
  value,
  onChange,
  placeholder,
  isSmall = false,
  disabled = false,
  className,
  type = "text",
}: TextInputProps) {
  return (
    <Input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        isSmall ? "h-7 flex-1" : "h-8 w-full",
        "font-mono text-xs",
        className
      )}
    />
  )
}

export default TextInput
