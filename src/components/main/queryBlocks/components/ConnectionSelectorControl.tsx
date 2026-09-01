import type { ConnectionSelector } from "@/lib/query-types"
import { TemplateSelect } from "./TemplateSelect"
import { RecordSelect } from "./RecordSelect"
import { cn } from "@/lib/utils"

export interface ConnectionSelectorControlProps {
  value?: ConnectionSelector
  onChange: (value: ConnectionSelector) => void
  disabled?: boolean
  className?: string
}

export function ConnectionSelectorControl({
  value = { record: "role" },
  onChange,
  disabled = false,
  className,
}: ConnectionSelectorControlProps) {
  const handleTemplateChange = (tpl?: string[]) => {
    onChange({ ...value, template: tpl })
  }

  const handleRecordChange = (rec: string) => {
    onChange({ ...value, record: rec })
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <TemplateSelect
        value={value.template}
        onChange={handleTemplateChange}
        disabled={disabled}
      />
      <RecordSelect
        value={value.record}
        templateId={value.template}
        onChange={handleRecordChange}
        disabled={disabled}
      />
    </div>
  )
}

export default ConnectionSelectorControl
