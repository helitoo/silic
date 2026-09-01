import * as React from "react"
import { useLang } from "@/contexts/LangContext"
import { Input } from "@/components/ui/input"
import { QueryBlock } from "../components/QueryBlock"

export interface LiteralBlockProps {
  value?: number | string | boolean | Date
  onChange: (val: number | string | boolean | Date) => void
  onDelete?: () => void
  className?: string
}

export function LiteralBlock({
  value = "",
  onChange,
  onDelete,
  className,
}: LiteralBlockProps) {
  const { t } = useLang()

  const stringValue =
    value instanceof Date
      ? value.toISOString()
      : value !== undefined && value !== null
        ? String(value)
        : ""

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (raw.trim() !== "" && !isNaN(Number(raw))) {
      onChange(Number(raw))
    } else if (raw === "true" || raw === "false") {
      onChange(raw === "true")
    } else {
      onChange(raw)
    }
  }

  return (
    <QueryBlock color="amber" onDelete={onDelete} className={className}>
      <Input
        value={stringValue}
        onChange={handleChange}
        placeholder={t("query.literalPlaceholder")}
        className="h-7 w-40 rounded-md border border-border/70 bg-muted/40 px-2.5 text-xs text-foreground shadow-2xs"
      />
    </QueryBlock>
  )
}

export default LiteralBlock
