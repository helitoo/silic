import { useLang } from "@/contexts/LangContext"
import type { Operator } from "@/lib/query-types"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const OPERATOR_DISPLAY_MAP: Record<Operator, string> = {
  "=": "=",
  "!=": "≠",
  ">": ">",
  ">=": "≥",
  "<": "<",
  "<=": "≤",
  "~": "≈",
  IN: "∈",
  "+": "+",
  "-": "–",
  "*": "×",
  "/": "÷",
  AND: "AND",
  OR: "OR",
}

export function getOperatorDisplaySymbol(
  op: Operator,
  t: (key: string, options?: any) => string
): string {
  if (op === "AND") return t("query.displayAnd") || "AND"
  if (op === "OR") return t("query.displayOr") || "OR"
  if (op === "IN") return t("query.displayIn") || "∈"
  return OPERATOR_DISPLAY_MAP[op] || op
}

export interface OperatorSelectProps {
  value?: Operator
  onChange: (value: Operator) => void
  variant?: "badge" | "default"
  disabled?: boolean
  className?: string
  ariaLabel?: string
}

export function OperatorSelect({
  value = "AND",
  onChange,
  variant = "badge",
  disabled = false,
  className,
  ariaLabel,
}: OperatorSelectProps) {
  const { t } = useLang()

  const handleValueChange = (val: string | null) => {
    if (val) {
      onChange(val as Operator)
    }
  }

  const displaySymbol = getOperatorDisplaySymbol(value, t)

  if (variant === "badge") {
    return (
      <Select
        value={value}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger
          size="sm"
          className={cn(
            "h-6 min-w-6 cursor-pointer items-center justify-center gap-1 rounded-full border border-border/80 bg-card px-2 text-[11px] font-bold text-foreground shadow-xs transition-all hover:border-primary/40 hover:bg-accent focus:ring-1 focus:ring-ring active:scale-95",
            className
          )}
          aria-label={
            ariaLabel || t("query.selectOperator") || "Select operator"
          }
        >
          <SelectValue>
            <span className="leading-none">{displaySymbol}</span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="start" className="min-w-[180px]">
          <SelectGroup>
            <SelectLabel className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              {t("query.logicGroup")}
            </SelectLabel>
            <SelectItem value="AND">
              <span className="text-xs">{t("query.opAnd")}</span>
            </SelectItem>
            <SelectItem value="OR">
              <span className="text-xs">{t("query.opOr")}</span>
            </SelectItem>
          </SelectGroup>

          <SelectGroup>
            <SelectLabel className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              {t("query.comparisonGroup")}
            </SelectLabel>
            <SelectItem value="=">
              <span className="text-xs">{t("query.opEquals")}</span>
            </SelectItem>
            <SelectItem value="!=">
              <span className="text-xs">{t("query.opNotEquals")}</span>
            </SelectItem>
            <SelectItem value=">">
              <span className="text-xs">{t("query.opGreater")}</span>
            </SelectItem>
            <SelectItem value=">=">
              <span className="text-xs">{t("query.opGreaterEqual")}</span>
            </SelectItem>
            <SelectItem value="<">
              <span className="text-xs">{t("query.opLess")}</span>
            </SelectItem>
            <SelectItem value="<=">
              <span className="text-xs">{t("query.opLessEqual")}</span>
            </SelectItem>
            <SelectItem value="~">
              <span className="text-xs">{t("query.opFuzzy")}</span>
            </SelectItem>
            <SelectItem value="IN">
              <span className="text-xs">{t("query.opIn")}</span>
            </SelectItem>
          </SelectGroup>

          <SelectGroup>
            <SelectLabel className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              {t("query.arithmeticGroup")}
            </SelectLabel>
            <SelectItem value="+">
              <span className="text-xs">{t("query.opAdd")}</span>
            </SelectItem>
            <SelectItem value="-">
              <span className="text-xs">{t("query.opSubtract")}</span>
            </SelectItem>
            <SelectItem value="*">
              <span className="text-xs">{t("query.opMultiply")}</span>
            </SelectItem>
            <SelectItem value="/">
              <span className="text-xs">{t("query.opDivide")}</span>
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    )
  }

  // Default variant
  return (
    <Select value={value} onValueChange={handleValueChange} disabled={disabled}>
      <SelectTrigger
        size="sm"
        className={cn(
          "h-7 min-w-[56px] cursor-pointer justify-between rounded-md border border-border/80 bg-muted/50 px-2.5 font-bold text-foreground shadow-2xs hover:bg-muted/80",
          className
        )}
        aria-label={ariaLabel || t("query.selectOperator") || "Select operator"}
      >
        <SelectValue>
          <span className="text-xs">{displaySymbol}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="start" className="min-w-[180px]">
        <SelectGroup>
          <SelectLabel className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            {t("query.logicGroup")}
          </SelectLabel>
          <SelectItem value="AND">
            <span className="text-xs">{t("query.opAnd")}</span>
          </SelectItem>
          <SelectItem value="OR">
            <span className="text-xs">{t("query.opOr")}</span>
          </SelectItem>
        </SelectGroup>

        <SelectGroup>
          <SelectLabel className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            {t("query.comparisonGroup")}
          </SelectLabel>
          <SelectItem value="=">
            <span className="text-xs">{t("query.opEquals")}</span>
          </SelectItem>
          <SelectItem value="!=">
            <span className="text-xs">{t("query.opNotEquals")}</span>
          </SelectItem>
          <SelectItem value=">">
            <span className="text-xs">{t("query.opGreater")}</span>
          </SelectItem>
          <SelectItem value=">=">
            <span className="text-xs">{t("query.opGreaterEqual")}</span>
          </SelectItem>
          <SelectItem value="<">
            <span className="text-xs">{t("query.opLess")}</span>
          </SelectItem>
          <SelectItem value="<=">
            <span className="text-xs">{t("query.opLessEqual")}</span>
          </SelectItem>
          <SelectItem value="~">
            <span className="text-xs">{t("query.opFuzzy")}</span>
          </SelectItem>
          <SelectItem value="IN">
            <span className="text-xs">{t("query.opIn")}</span>
          </SelectItem>
        </SelectGroup>

        <SelectGroup>
          <SelectLabel className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            {t("query.arithmeticGroup")}
          </SelectLabel>
          <SelectItem value="+">
            <span className="text-xs">{t("query.opAdd")}</span>
          </SelectItem>
          <SelectItem value="-">
            <span className="text-xs">{t("query.opSubtract")}</span>
          </SelectItem>
          <SelectItem value="*">
            <span className="text-xs">{t("query.opMultiply")}</span>
          </SelectItem>
          <SelectItem value="/">
            <span className="text-xs">{t("query.opDivide")}</span>
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export default OperatorSelect
