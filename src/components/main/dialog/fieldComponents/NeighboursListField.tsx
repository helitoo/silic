import { useLang } from "@/contexts/LangContext"
import { FieldSet, FieldLegend, FieldGroup } from "@/components/ui/field"
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
}

export function NeighboursListField({ connections }: NeighboursListFieldProps) {
  const { t } = useLang()

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
        {connections.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            {t("connectionsPage.noConnections")}
          </p>
        ) : (
          connections.map((connItem, index) => (
            <div
              key={index}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-border/70 bg-card/60 p-2.5 shadow-2xs"
            >
              {/* Connection selector / label */}
              <div className="w-[160px] shrink-0">
                <ConnectionNameSelect
                  value={connItem.connectionId}
                  disabled={true}
                  className="h-8 w-full"
                />
              </div>

              {/* Partner Entity Select */}
              <div className="min-w-[140px] flex-1">
                <EntitySelect
                  value={connItem.partnerId}
                  disabled={true}
                  placeholder={t("entityDialog.targetEntity")}
                  className="h-8 w-full"
                  onChange={() => {}}
                />
              </div>

              {/* Direction Tag */}
              <span className="rounded-md bg-muted/60 px-2 py-1 text-[10px] font-medium text-muted-foreground">
                {connItem.isDirectional
                  ? connItem.isOutbound
                    ? "→ Outbound"
                    : "← Inbound"
                  : "↔ Undirected"}
              </span>
            </div>
          ))
        )}
      </FieldGroup>
    </FieldSet>
  )
}

export default NeighboursListField
