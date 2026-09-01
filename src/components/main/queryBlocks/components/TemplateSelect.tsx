import { useTemplate } from "@/contexts/TemplateContext"
import { useLang } from "@/contexts/LangContext"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface TemplateSelectProps {
  value?: string[] | string
  onChange: (value?: string[]) => void
  className?: string
  placeholder?: string
  disabled?: boolean
  noTemplateOption?: boolean
  noneLabel?: string
}

export function TemplateSelect({
  value,
  onChange,
  className,
  placeholder,
  disabled = false,
  noTemplateOption = false,
  noneLabel,
}: TemplateSelectProps) {
  const { templates } = useTemplate()
  const { t } = useLang()

  const fallbackValue = noTemplateOption ? "__NONE__" : "__ALL__"
  const defaultLabel = noTemplateOption
    ? noneLabel || t("entityDialog.noTemplate")
    : t("query.allTemplates")

  const selectedTemplateId = Array.isArray(value)
    ? value[0] || fallbackValue
    : value || fallbackValue

  return (
    <Select
      value={selectedTemplateId}
      disabled={disabled}
      onValueChange={(val) => {
        if (!val || val === "__ALL__" || val === "__NONE__") {
          onChange(undefined)
        } else {
          onChange([val])
        }
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
        aria-label={t("query.selectTemplate")}
      >
        <SelectValue placeholder={placeholder || defaultLabel}>
          <span className="whitespace-nowrap">
            {selectedTemplateId === "__ALL__" ||
            selectedTemplateId === "__NONE__"
              ? defaultLabel
              : templates.find((tItem) => tItem.id === selectedTemplateId)
                  ?.name || "(?)"}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="start" className="w-auto min-w-max">
        <SelectGroup>
          <SelectItem value={noTemplateOption ? "__NONE__" : "__ALL__"}>
            <span className="font-semibold whitespace-nowrap">
              {defaultLabel}
            </span>
          </SelectItem>
          {templates.map((tpl) => (
            <SelectItem key={tpl.id} value={tpl.id}>
              <span className="whitespace-nowrap">{tpl.name}</span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export default TemplateSelect
