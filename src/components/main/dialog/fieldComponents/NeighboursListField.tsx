import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  CirclePlus,
  Trash2,
} from "lucide-react"
import { useLang } from "@/contexts/LangContext"
import { FieldSet, FieldLegend, FieldGroup } from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { ConnectionNameSelect } from "@/components/main/queryBlocks/components/ConnectionNameSelect"
import { EntitySelect } from "@/components/main/queryBlocks/components/EntitySelect"

export interface EntityConnectionItem {
  id: string
  partnerId: string
  connectionId: string
  isDirectional: boolean
  isOutbound: boolean
}

export interface NeighboursListFieldProps {
  connections: EntityConnectionItem[]
  currentEntityId?: string
  onAdd: () => void
  onUpdate: (index: number, partial: Partial<EntityConnectionItem>) => void
  onRemove: (index: number) => void
}

export function NeighboursListField({
  connections,
  onAdd,
  onUpdate,
  onRemove,
}: NeighboursListFieldProps) {
  const { t } = useLang()

  const handleToggleDirection = (index: number, cur: EntityConnectionItem) => {
    if (cur.isDirectional && cur.isOutbound) {
      onUpdate(index, { isDirectional: true, isOutbound: false })
    } else if (cur.isDirectional && !cur.isOutbound) {
      onUpdate(index, { isDirectional: false, isOutbound: true })
    } else {
      onUpdate(index, { isDirectional: true, isOutbound: true })
    }
  }

  return (
    <FieldSet className="gap-3 pt-2">
      <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
        <FieldLegend variant="label" className="mb-0 text-xs font-semibold">
          {t("entityDialog.neighbours")}
        </FieldLegend>
        <span className="text-xs text-muted-foreground">
          {t(
            connections.length === 1
              ? "entitiesPage.connectionsCount_one"
              : "entitiesPage.connectionsCount_other",
            { count: connections.length }
          )}
        </span>
      </div>

      <FieldGroup className="gap-2.5">
        {connections.map((connItem, index) => (
          <div
            key={connItem.id || index}
            className="flex flex-col items-stretch gap-2 rounded-lg border border-border/70 bg-card/60 p-2.5 shadow-2xs transition-all hover:border-border sm:flex-row sm:items-center"
          >
            {/* Connection selector */}
            <div className="w-full shrink-0 sm:w-[170px]">
              <ConnectionNameSelect
                value={connItem.connectionId}
                onChange={(val) => onUpdate(index, { connectionId: val })}
                className="h-8 w-full"
              />
            </div>

            {/* Partner Entity Select */}
            <div className="w-full sm:min-w-[140px] sm:flex-1">
              <EntitySelect
                value={connItem.partnerId}
                onChange={(val) => onUpdate(index, { partnerId: val })}
                placeholder={t("entityDialog.targetEntity")}
                className="h-8 w-full"
              />
            </div>

            {/* Controls: Direction Toggle + Delete Button */}
            <div className="flex items-center justify-between gap-2 sm:justify-start">
              {/* Direction Toggle Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 px-2 text-xs"
                onClick={() => handleToggleDirection(index, connItem)}
                title={t("entityDialog.toggleDirection")}
              >
                {connItem.isDirectional ? (
                  connItem.isOutbound ? (
                    <span className="flex items-center gap-1 font-medium text-primary">
                      <ArrowLeft className="size-3.5" />
                      <span>{t("entityDialog.outbound")}</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 font-medium text-primary">
                      <ArrowRight className="size-3.5" />
                      <span>{t("entityDialog.inbound")}</span>
                    </span>
                  )
                ) : (
                  <span className="flex items-center gap-1 font-medium text-muted-foreground">
                    <ArrowLeftRight className="size-3.5" />
                    <span>{t("entityDialog.undirected")}</span>
                  </span>
                )}
              </Button>

              {/* Delete Button */}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="size-7 shrink-0 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onRemove(index)}
                title={t("entityDialog.deleteNeighbour")}
                aria-label={t("entityDialog.deleteNeighbour")}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}

        {/* Add Relationship Button */}
        <div className="flex justify-center pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 rounded-full text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-600 dark:text-emerald-400"
            onClick={onAdd}
          >
            <CirclePlus className="size-4" />
            <span className="text-xs font-semibold">
              {t("entityDialog.addNeighbour")}
            </span>
          </Button>
        </div>
      </FieldGroup>
    </FieldSet>
  )
}

export default NeighboursListField
