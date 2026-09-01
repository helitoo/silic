import type { AggreeateFunction, ConnectionSelector } from "@/lib/query-types"
import { QueryBlock } from "../components/QueryBlock"
import { TemplateSelect } from "../components/TemplateSelect"
import { RecordSelect } from "../components/RecordSelect"
import { FunctionSelect } from "../components/FunctionSelect"

export interface ConnectionSelectorBlockProps {
  template?: string[]
  record?: string
  function?: AggreeateFunction
  onChange: (
    selector: ConnectionSelector,
    fn?: AggreeateFunction
  ) => void
  onDelete?: () => void
  className?: string
}

export function ConnectionSelectorBlock({
  template,
  record = "role",
  function: aggFn,
  onChange,
  onDelete,
  className,
}: ConnectionSelectorBlockProps) {
  const handleTemplateChange = (tpl?: string[]) => {
    onChange({ template: tpl, record: record || "role" }, aggFn)
  }

  const handleRecordChange = (rec: string) => {
    onChange({ template, record: rec }, aggFn)
  }

  const handleFunctionChange = (fn?: AggreeateFunction) => {
    onChange({ template, record: record || "role" }, fn)
  }

  return (
    <QueryBlock color="cyan" onDelete={onDelete} className={className}>
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

export default ConnectionSelectorBlock
