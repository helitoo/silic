import * as React from "react"
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

export const TextInput = React.memo(function TextInput({
  value,
  onChange,
  placeholder,
  isSmall = false,
  disabled = false,
  className,
  type = "text",
}: TextInputProps) {
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
    <Input
      type={type}
      value={localVal}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        isSmall ? "h-7 flex-1" : "h-8 w-full",
        "text-xs",
        className
      )}
    />
  )
})

export default TextInput

