import type { AggreeateFunction } from "@/lib/query-types"
import { QueryBlock } from "../components/QueryBlock"
import { TemplateSelect } from "../components/TemplateSelect"
import { RecordSelect } from "../components/RecordSelect"
import { FunctionSelect } from "../components/FunctionSelect"

export interface EntitySelectorBlockProps {
  template?: string[]
  record?: string
  function?: AggreeateFunction
  onChange: (
    selector: { template?: string[]; record: string },
    fn?: AggreeateFunction
  ) => void
  onDelete?: () => void
  className?: string
}

export function EntitySelectorBlock({
  template,
  record = "username",
  function: aggFn,
  onChange,
  onDelete,
  className,
}: EntitySelectorBlockProps) {
  const handleTemplateChange = (tpl?: string[]) => {
    onChange({ template: tpl, record: record || "username" }, aggFn)
  }

  const handleRecordChange = (rec: string) => {
    onChange({ template, record: rec }, aggFn)
  }

  const handleFunctionChange = (fn?: AggreeateFunction) => {
    onChange({ template, record: record || "username" }, fn)
  }

  return (
    <QueryBlock color="emerald" onDelete={onDelete} className={className}>
      <div className="flex flex-wrap items-center gap-1.5 w-full">
        <FunctionSelect value={aggFn} onChange={handleFunctionChange} />
        <TemplateSelect value={template} onChange={handleTemplateChange} />
        <RecordSelect
          value={record}
          templateId={template}
          onChange={handleRecordChange}
        />
      </div>
    </QueryBlock>
  )
}

export default EntitySelectorBlock
