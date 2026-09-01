import { RotateCcw } from "lucide-react"
import { useLang } from "@/contexts/LangContext"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface QueryStatusBannerProps {
  currentCount: number
  totalCount: number
  itemLabel?: string
  isFiltered?: boolean
  onReset: () => void
  className?: string
}

export function QueryStatusBanner({
  currentCount,
  totalCount,
  itemLabel,
  isFiltered = false,
  onReset,
  className,
}: QueryStatusBannerProps) {
  const { t } = useLang()

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 text-xs",
        className
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="font-medium text-foreground">
          {itemLabel
            ? t("common.showingCount", {
                current: currentCount,
                total: totalCount,
                name: itemLabel,
              })
            : t("common.showingCountSimple", {
                current: currentCount,
                total: totalCount,
              })}
        </span>
        {isFiltered && (
          <span className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
            {t("common.filtered")}
          </span>
        )}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={!isFiltered}
        onClick={onReset}
        className={cn(
          "h-6 gap-1 rounded-md px-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
          !isFiltered &&
            "cursor-default opacity-40 hover:bg-transparent hover:text-muted-foreground"
        )}
        title={t("common.resetData")}
      >
        <RotateCcw className="size-3" />
        <span>{t("common.resetData")}</span>
      </Button>
    </div>
  )
}

export default QueryStatusBanner
