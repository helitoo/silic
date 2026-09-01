import { ArrowRight, CirclePlus, Trash2 } from "lucide-react"
import { useLang } from "@/contexts/LangContext"
import type { ConnectionSelector, PathQuery } from "@/lib/query-types"
import { Button } from "@/components/ui/button"
import { QueryBlock } from "../components/QueryBlock"
import { EntitySelect } from "../components/EntitySelect"
import { ConnectionSelectorControl } from "../components/ConnectionSelectorControl"

export interface PathBlockProps {
  query?: PathQuery
  onChange: (query: PathQuery) => void
  onDelete?: () => void
  className?: string
}

export function PathBlock({
  query = { from: "", to: "", via: [] },
  onChange,
  onDelete,
  className,
}: PathBlockProps) {

  const { t } = useLang()

  const handleFromChange = (fromId: string) => {
    onChange({ ...query, from: fromId })
  }

  const handleToChange = (toId: string) => {
    onChange({ ...query, to: toId })
  }

  const handleViaChange = (index: number, selector: ConnectionSelector) => {
    const nextVia = [...(query.via || [])]
    nextVia[index] = selector
    onChange({ ...query, via: nextVia })
  }

  const handleAddVia = () => {
    const nextVia: ConnectionSelector[] = [
      ...(query.via || []),
      { record: "role" },
    ]
    onChange({ ...query, via: nextVia })
  }

  const handleRemoveVia = (index: number) => {
    const nextVia = (query.via || []).filter((_, i) => i !== index)
    onChange({ ...query, via: nextVia })
  }

  return (
    <QueryBlock color="purple" onDelete={onDelete} className={className}>
      <div className="flex w-full min-w-[280px] flex-col gap-3">
        {/* From -> To row */}
        <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/40 p-2.5">
          <div className="flex flex-1 flex-col gap-1">
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              {t("query.fromEntity")}
            </span>
            <EntitySelect
              value={query.from}
              onChange={handleFromChange}
              placeholder={t("query.fromEntity")}
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-center px-1 pt-4 text-muted-foreground">
            <ArrowRight className="size-4 stroke-[2]" />
          </div>

          <div className="flex flex-1 flex-col gap-1">
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              {t("query.toEntity")}
            </span>
            <EntitySelect
              value={query.to}
              onChange={handleToChange}
              placeholder={t("query.toEntity")}
              className="w-full"
            />
          </div>
        </div>

        {/* Via Connections List */}
        <div className="flex flex-col gap-1.5 border-t border-border/60 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              {t("query.viaConnections")}
            </span>
            {(!query.via || query.via.length === 0) && (
              <span className="text-[10px] text-muted-foreground italic">
                {t("query.noVia")}
              </span>
            )}
          </div>

          {query.via && query.via.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {query.via.map((connSelector, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <ConnectionSelectorControl
                    value={connSelector}
                    onChange={(sel) => handleViaChange(idx, sel)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="size-6 shrink-0 rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleRemoveVia(idx)}
                    title="Remove via connection"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add Via Connection Button */}
          <div className="flex justify-start pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="flex h-6 items-center gap-1 rounded-md px-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
              onClick={handleAddVia}
            >
              <CirclePlus className="size-3.5 stroke-[2]" />
              <span>{t("query.addVia")}</span>
            </Button>
          </div>
        </div>
      </div>
    </QueryBlock>
  )
}

export default PathBlock
