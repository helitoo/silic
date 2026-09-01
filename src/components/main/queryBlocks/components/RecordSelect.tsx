import * as React from "react"
import { useTemplate } from "@/contexts/TemplateContext"
import { useEntity } from "@/contexts/EntityContext"
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

export interface RecordSelectProps {
  value?: string
  templateId?: string | string[]
  onChange: (value: string) => void
  className?: string
  placeholder?: string
  includeAll?: boolean
  allLabel?: string
  disabled?: boolean
}

export function RecordSelect({
  value,
  templateId,
  onChange,
  className,
  placeholder = "...",
  includeAll = false,
  allLabel,
  disabled = false,
}: RecordSelectProps) {
  const { templates } = useTemplate()
  const { allRecordNames } = useEntity()
  const { t } = useLang()

  const availableRecords = React.useMemo(() => {
    const set = new Set<string>()

    const targetTemplateId = Array.isArray(templateId)
      ? templateId[0]
      : templateId

    if (targetTemplateId && targetTemplateId !== "__ALL__") {
      const tpl = templates.find((t) => t.id === targetTemplateId)
      if (tpl && Array.isArray(tpl.records)) {
        for (const r of tpl.records) {
          if (r.name) set.add(r.name)
        }
      }
    } else {
      for (const tpl of templates) {
        if (Array.isArray(tpl.records)) {
          for (const r of tpl.records) {
            if (r.name) set.add(r.name)
          }
        }
      }
      for (const rName of allRecordNames) {
        set.add(rName)
      }
    }

    if (set.size === 0) {
      set.add("username")
      set.add("age")
      set.add("companyName")
      set.add("scores")
      set.add("tags")
    }

    return Array.from(set)
  }, [templates, allRecordNames, templateId])

  const effectiveAllLabel = allLabel || t("entitiesPage.allRecords")
  const displayLabel =
    value === "__ALL__" ? effectiveAllLabel : value || placeholder

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
        aria-label={t("query.selectRecord")}
      >
        <SelectValue placeholder={placeholder}>
          <span className="whitespace-nowrap">{displayLabel}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="start" className="w-auto min-w-max">
        <SelectGroup>
          {includeAll && (
            <SelectItem value="__ALL__">
              <span className="text-xs font-semibold whitespace-nowrap">
                {effectiveAllLabel}
              </span>
            </SelectItem>
          )}
          {availableRecords.map((name) => (
            <SelectItem key={name} value={name}>
              <span className="text-xs font-medium whitespace-nowrap">
                {name}
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export default RecordSelect
