import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface DateInputProps {
  value: string
  onChange: (value: string) => void
  isSmall?: boolean
  disabled?: boolean
  className?: string
}

export function DateInput({
  value,
  onChange,
  isSmall = false,
  disabled = false,
  className,
}: DateInputProps) {
  return (
    <Input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        isSmall ? "h-7 flex-1" : "h-8 w-full",
        "font-mono text-xs",
        className
      )}
    />
  )
}

export default DateInput
