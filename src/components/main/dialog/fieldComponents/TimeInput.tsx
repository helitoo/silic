import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface TimeInputProps {
  value: string
  onChange: (value: string) => void
  isSmall?: boolean
  disabled?: boolean
  className?: string
}

export const TimeInput = React.memo(function TimeInput({
  value,
  onChange,
  isSmall = false,
  disabled = false,
  className,
}: TimeInputProps) {
  return (
    <Input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        isSmall ? "h-7 flex-1" : "h-8 w-full",
        "text-xs",
        className
      )}
    />
  )
})

export default TimeInput

