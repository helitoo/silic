import * as React from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface NotHasAnyItemProps {
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode
  label: React.ReactNode
  description?: React.ReactNode
  buttonLabel?: React.ReactNode
  buttonOnclick?: () => void
  className?: string
}

function renderIcon(icon?: NotHasAnyItemProps["icon"]) {
  if (!icon) return null
  if (React.isValidElement(icon)) return icon
  if (typeof icon === "function" || typeof icon === "object") {
    const IconComponent = icon as React.ComponentType<{ className?: string }>
    return <IconComponent className="size-6 stroke-[1.5]" />
  }
  return null
}

export function NotHasAnyItem({
  icon,
  label,
  description,
  buttonLabel,
  buttonOnclick,
  className,
}: NotHasAnyItemProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl p-12 text-center",
        className
      )}
    >
      {icon && (
        <div className="flex size-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
          {renderIcon(icon)}
        </div>
      )}

      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>

      {buttonLabel && buttonOnclick && (
        <Button
          onClick={buttonOnclick}
          size="sm"
          className="mt-2 gap-1.5 rounded-lg shadow-xs"
        >
          <Plus className="size-4" />
          <span>{buttonLabel}</span>
        </Button>
      )}
    </div>
  )
}

export default NotHasAnyItem
