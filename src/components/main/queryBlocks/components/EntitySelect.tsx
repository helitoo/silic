import { useEntity } from "@/contexts/EntityContext"
import { useLang } from "@/contexts/LangContext"
import { cn, getEntityName } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface EntitySelectProps {
  value?: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
  disabled?: boolean
}

export function EntitySelect({
  value,
  onChange,
  className,
  placeholder,
  disabled = false,
}: EntitySelectProps) {
  const { entities } = useEntity()
  const { t } = useLang()

  const currentEntity = value ? entities.find((e) => e.id === value) : null
  const currentTitle = currentEntity
    ? getEntityName(currentEntity)
    : value || ""

  return (
    <Select
      value={value || ""}
      disabled={disabled}
      onValueChange={(val) => {
        if (val) onChange(val)
      }}
    >
      <SelectTrigger
        size="sm"
        disabled={disabled}
        className={cn(
          "h-7 w-auto min-w-max cursor-pointer justify-between gap-1.5 rounded-md border border-border/70 bg-muted/40 px-2.5 text-xs font-medium text-foreground shadow-2xs hover:bg-muted/70",
          disabled && "cursor-not-allowed opacity-60",
          className
        )}
        aria-label={t("query.selectEntity")}
      >
        <SelectValue placeholder={placeholder || t("query.selectEntity")}>
          {value ? (
            <span className="font-semibold text-foreground whitespace-nowrap">
              {currentTitle}
            </span>
          ) : (
            <span className="whitespace-nowrap text-muted-foreground">
              {placeholder || t("query.selectEntity")}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="start" className="w-auto min-w-[180px]">
        <SelectGroup>
          {entities.map((entity) => {
            const title = getEntityName(entity)
            return (
              <SelectItem key={entity.id} value={entity.id}>
                <span className="text-xs font-medium text-foreground whitespace-nowrap">
                  {title}
                </span>
              </SelectItem>
            )
          })}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export default EntitySelect
