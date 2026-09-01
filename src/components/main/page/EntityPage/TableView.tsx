import * as React from "react"
import { GitCommit, Plus, Sparkles } from "lucide-react"
import type { Entity } from "@/lib/types"
import { useLang } from "@/contexts/LangContext"
import { useConnection } from "@/contexts/ConnectionContext"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface TableViewProps {
  entities: Entity[]
  onSelectEntity: (entity: Entity) => void
  onNewEntity?: () => void
  isLoading?: boolean
}

export function TableView({
  entities,
  onSelectEntity,
  onNewEntity,
  isLoading,
}: TableViewProps) {
  const { t } = useLang()
  const { connections } = useConnection()

  // Compute common record names present in every entity
  const commonRecordNames = React.useMemo(() => {
    if (entities.length === 0) return []

    // Get unique record names of the first entity
    const firstEntityRecords = entities[0].records || []
    const initialNames = Array.from(
      new Set(firstEntityRecords.map((r) => r.name).filter(Boolean))
    )

    // Filter to record names present across ALL entities
    return initialNames.filter((name) =>
      entities.every((ent) => ent.records?.some((r) => r.name === name))
    )
  }, [entities])

  const showIdAndNeighbours = commonRecordNames.length < 3

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-lg border border-border bg-card/50 shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[180px] font-semibold">ID</TableHead>
              <TableHead className="font-semibold">Field 1</TableHead>
              <TableHead className="font-semibold">Field 2</TableHead>
              <TableHead className="w-[120px] text-right font-semibold">
                {t("entityDialog.neighbours")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 6 }).map((_, idx) => (
              <TableRow key={idx}>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="ml-auto h-4 w-12" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (entities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/70 p-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
          <Sparkles className="size-6 stroke-[1.5]" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">
            {t("entitiesPage.noEntities")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("entitiesPage.createFirstEntity")}
          </p>
        </div>
        {onNewEntity && (
          <Button
            onClick={onNewEntity}
            size="sm"
            className="mt-2 gap-1.5 rounded-lg"
          >
            <Plus className="size-4" />
            <span>{t("entitiesPage.newEntity")}</span>
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card/50 shadow-2xs">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            {/* Show ID column only if common records < 3 */}
            {showIdAndNeighbours && (
              <TableHead className="w-[180px] font-semibold text-foreground">
                ID
              </TableHead>
            )}

            {/* Common Record Columns */}
            {commonRecordNames.map((colName) => (
              <TableHead
                key={colName}
                className="font-semibold text-foreground"
              >
                {colName}
              </TableHead>
            ))}

            {/* Show Neighbours column only if common records < 3 */}
            {showIdAndNeighbours && (
              <TableHead className="w-[140px] text-right font-semibold text-foreground">
                {t("entityDialog.neighbours")}
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {entities.map((entity) => {
            const neighboursCount = connections.filter(
              (c) => c.from.includes(entity.id) || c.to.includes(entity.id)
            ).length

            return (
              <TableRow
                key={entity.id}
                onClick={() => onSelectEntity(entity)}
                className="group cursor-pointer transition-colors hover:bg-muted/60"
              >
                {/* ID Cell */}
                {showIdAndNeighbours && (
                  <TableCell className="py-3 font-mono text-xs font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <div className="size-2 shrink-0 rounded-full bg-primary/70 transition-colors group-hover:bg-primary" />
                      <span className="truncate">{entity.id}</span>
                    </div>
                  </TableCell>
                )}

                {/* Common Record Values */}
                {commonRecordNames.map((colName) => {
                  const rec = entity.records?.find((r) => r.name === colName)
                  let displayVal = "—"
                  if (rec) {
                    if (rec.value instanceof Date) {
                      displayVal = rec.value.toLocaleDateString()
                    } else if (Array.isArray(rec.value)) {
                      displayVal = `[${rec.value.join(", ")}]`
                    } else if (rec.value !== undefined && rec.value !== null) {
                      displayVal = String(rec.value)
                    }
                  }

                  return (
                    <TableCell
                      key={colName}
                      className="max-w-[240px] truncate py-3 font-mono text-xs text-foreground"
                      title={displayVal}
                    >
                      {displayVal}
                    </TableCell>
                  )
                })}

                {/* Neighbours Count */}
                {showIdAndNeighbours && (
                  <TableCell className="py-3 text-right">
                    <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
                      <GitCommit className="size-3.5 stroke-[2]" />
                      <span>{neighboursCount}</span>
                    </span>
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

export default TableView
