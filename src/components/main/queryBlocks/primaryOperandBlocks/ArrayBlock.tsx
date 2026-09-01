import { CirclePlus, Trash2 } from "lucide-react"
import { useLang } from "@/contexts/LangContext"
import type { AggreeateFunction } from "@/lib/query-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { QueryBlock } from "../components/QueryBlock"
import { FunctionSelect } from "../components/FunctionSelect"

export interface ArrayBlockProps {
  values?: (number | string | boolean | Date)[]
  function?: AggreeateFunction
  onChange: (
    values: (number | string | boolean | Date)[],
    fn?: AggreeateFunction
  ) => void
  onDelete?: () => void
  className?: string
}

export function ArrayBlock({
  values = [""],
  function: aggFn,
  onChange,
  onDelete,
  className,
}: ArrayBlockProps) {
  const { t } = useLang()

  const handleValueChange = (index: number, raw: string) => {
    const updated = [...values]
    if (raw.trim() !== "" && !isNaN(Number(raw))) {
      updated[index] = Number(raw)
    } else if (raw === "true" || raw === "false") {
      updated[index] = raw === "true"
    } else {
      updated[index] = raw
    }
    onChange(updated, aggFn)
  }

  const handleAddValue = () => {
    onChange([...values, ""], aggFn)
  }

  const handleRemoveValue = (index: number) => {
    const updated = values.filter((_, i) => i !== index)
    onChange(updated.length > 0 ? updated : [""], aggFn)
  }

  const handleFunctionChange = (fn?: AggreeateFunction) => {
    onChange(values, fn)
  }

  return (
    <QueryBlock color="orange" onDelete={onDelete} className={className}>
      <div className="flex w-full min-w-[180px] flex-col gap-2">
        {/* Top: Function Selector */}
        <div className="flex items-center gap-2">
          <FunctionSelect value={aggFn} onChange={handleFunctionChange} />
        </div>

        {/* Values list */}
        <div className="flex w-full flex-col gap-1.5">
          {values.map((val, idx) => {
            const strVal =
              val instanceof Date
                ? val.toISOString()
                : val !== undefined && val !== null
                  ? String(val)
                  : ""

            return (
              <div key={idx} className="flex items-center gap-1.5">
                <Input
                  value={strVal}
                  onChange={(e) => handleValueChange(idx, e.target.value)}
                  placeholder={t("query.valuePlaceholder")}
                  className="h-7 flex-1 rounded-md border border-border/70 bg-muted/40 px-2.5 text-xs text-foreground shadow-2xs"
                />
                {values.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="size-6 shrink-0 rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleRemoveValue(idx)}
                    title="Remove value"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                )}
              </div>
            )
          })}
        </div>

        {/* Add value button */}
        <div className="flex justify-start pt-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="flex h-6 items-center justify-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
            onClick={handleAddValue}
          >
            <CirclePlus className="size-3.5 stroke-[2]" />
            <span>{t("query.addValue")}</span>
          </Button>
        </div>
      </div>
    </QueryBlock>
  )
}

export default ArrayBlock
