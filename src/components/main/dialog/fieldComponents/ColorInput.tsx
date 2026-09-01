import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface ColorInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  isSmall?: boolean
  disabled?: boolean
  className?: string
}

export function ColorInput({
  value,
  onChange,
  placeholder = "#3b82f6",
  isSmall = false,
  disabled = false,
  className,
}: ColorInputProps) {
  const isValidHex = /^#([0-9A-F]{3}){1,2}$/i.test(value)
  const colorHex = isValidHex ? value : "#000000"

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        isSmall ? "flex-1" : "w-full",
        className
      )}
    >
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full border border-input bg-input/20 shadow-2xs transition-all hover:ring-2 hover:ring-ring/50",
          isSmall ? "size-7" : "size-8",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <input
          type="color"
          value={colorHex}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="absolute -inset-2 size-[calc(100%+16px)] cursor-pointer rounded-full border-0 bg-transparent p-0"
          title="Pick color"
        />
      </div>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          isSmall ? "h-7 flex-1" : "h-8 flex-1",
          "font-mono text-xs"
        )}
      />
    </div>
  )
}

export default ColorInput
