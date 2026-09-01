import { useLang } from "@/contexts/LangContext"
import type { AggreeateFunction } from "@/lib/query-types"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface FunctionSelectProps {
  value?: AggreeateFunction
  onChange: (value?: AggreeateFunction) => void
  className?: string
  placeholder?: string
}

const AGGREGATE_FUNCTIONS: AggreeateFunction[] = [
  "COUNT",
  "SUM",
  "MEAN",
  "MEDIAN",
  "MIN",
  "MAX",
]

export function FunctionSelect({
  value,
  onChange,
  className,
  placeholder,
}: FunctionSelectProps) {
  const { t } = useLang()

  const getFunctionLabel = (fn: AggreeateFunction) => {
    switch (fn) {
      case "COUNT":
        return t("query.fnCount")
      case "SUM":
        return t("query.fnSum")
      case "MEAN":
        return t("query.fnMean")
      case "MEDIAN":
        return t("query.fnMedian")
      case "MIN":
        return t("query.fnMin")
      case "MAX":
        return t("query.fnMax")
      default:
        return fn
    }
  }

  const defaultPlaceholder = placeholder || t("query.function")

  return (
    <Select
      value={value || "__NONE__"}
      onValueChange={(val) => {
        if (!val || val === "__NONE__") {
          onChange(undefined)
        } else {
          onChange(val as AggreeateFunction)
        }
      }}
    >
      <SelectTrigger
        size="sm"
        className={cn(
          "h-7 w-auto min-w-max cursor-pointer justify-between gap-1.5 rounded-md border border-border/70 bg-muted/40 px-2 text-xs font-medium text-foreground shadow-2xs hover:bg-muted/70",
          className
        )}
        aria-label={defaultPlaceholder}
      >
        <SelectValue placeholder={defaultPlaceholder}>
          <span className="whitespace-nowrap">
            {value ? getFunctionLabel(value) : defaultPlaceholder}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="start" className="w-auto min-w-max">
        <SelectGroup>
          <SelectItem value="__NONE__">
            <span className="whitespace-nowrap text-muted-foreground italic">
              {t("query.noneFunction")}
            </span>
          </SelectItem>
          {AGGREGATE_FUNCTIONS.map((fn) => (
            <SelectItem key={fn} value={fn}>
              <span className="text-xs font-medium whitespace-nowrap">
                {getFunctionLabel(fn)}
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export default FunctionSelect
