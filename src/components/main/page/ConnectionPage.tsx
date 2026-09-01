import * as React from "react"
import {
  Plus,
  Network,
  ArrowRight,
  MoveHorizontal,
  Ellipsis,
} from "lucide-react"

import type { Connection } from "@/lib/types"
import { getTypeIcon } from "@/lib/template-utils"
import { getEntityName } from "@/lib/utils"
import { useConnection } from "@/contexts/ConnectionContext"
import { useEntity } from "@/contexts/EntityContext"
import { useQuery } from "@/contexts/QueryContext"
import { useTemplate } from "@/contexts/TemplateContext"
import { useLang } from "@/contexts/LangContext"
import { TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import ConnectionDialog from "@/components/main/dialog/ConnectionDialog"
import QueryStatusBanner from "@/components/main/QueryStatusBanner"
import NotHasAnyItem from "@/components/main/page/NotHasAnyItem"

export default function ConnectionPage() {
  const { connections } = useConnection()
  const { entities } = useEntity()
  const { currentConnections, isPathFiltered, resetPath } = useQuery()
  const { templates } = useTemplate()
  const { t } = useLang()

  const [selectedConnection, setSelectedConnection] =
    React.useState<Connection | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const handleRowClick = (connection: Connection) => {
    setSelectedConnection(connection)
    setDialogOpen(true)
  }

  const handleCreateNew = () => {
    setSelectedConnection(null)
    setDialogOpen(true)
  }

  const getTemplateName = (tplId?: string) => {
    if (!tplId) return null
    const found = templates.find((tpl) => tpl.id === tplId)
    return found ? found.name : tplId
  }

  const isFiltered =
    isPathFiltered || currentConnections.length !== connections.length

  if (connections.length === 0) {
    return (
      <TabsContent
        value="connections"
        className="w-full space-y-4 px-4 pt-4 pb-12 focus-visible:outline-none sm:px-8 sm:pb-16 md:px-12 md:pb-24 lg:px-16 xl:px-24"
      >
        <NotHasAnyItem
          icon={Network}
          label={t("connectionsPage.noConnections")}
          description={t("connectionsPage.createFirstConnection")}
          buttonLabel={t("connectionsPage.newConnection")}
          buttonOnclick={handleCreateNew}
        />
        <ConnectionDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          defaultValue={selectedConnection}
        />
      </TabsContent>
    )
  }

  return (
    <TabsContent
      value="connections"
      className="w-full space-y-4 px-4 pt-4 pb-12 focus-visible:outline-none sm:px-8 sm:pb-16 md:px-12 md:pb-24 lg:px-16 xl:px-24"
    >
      {/* Header section with QueryStatusBanner on Left, New Connection on Right */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <QueryStatusBanner
          currentCount={currentConnections.length}
          totalCount={connections.length}
          itemLabel={t("diagramPage.connectionsCount")}
          isFiltered={isFiltered}
          onReset={resetPath}
        />

        <Button
          onClick={handleCreateNew}
          size="sm"
          className="gap-1.5 shadow-xs"
        >
          <Plus className="size-3.5" />
          <span>{t("connectionsPage.newConnection")}</span>
        </Button>
      </div>

      {/* Table section */}
      <div className="overflow-hidden rounded-lg border border-border bg-card/50 shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[200px] font-semibold">
                {t("connectionsPage.from")}
              </TableHead>
              <TableHead className="w-[140px] font-semibold">
                {t("connectionsPage.directional")}
              </TableHead>
              <TableHead className="w-[200px] font-semibold">
                {t("connectionsPage.to")}
              </TableHead>
              <TableHead className="w-[160px] font-semibold">
                {t("connectionsPage.template")}
              </TableHead>
              <TableHead className="font-semibold">
                {t("connectionsPage.records")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentConnections.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Network className="size-8 text-muted-foreground/50" />
                    <p className="text-xs">
                      {t("connectionsPage.noConnections")}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCreateNew}
                    >
                      {t("connectionsPage.createFirstConnection")}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              currentConnections.map((conn) => {
                const tplName = getTemplateName(conn.template)
                return (
                  <TableRow
                    key={conn.id}
                    onClick={() => handleRowClick(conn)}
                    className="group cursor-pointer transition-colors hover:bg-muted/60"
                  >
                    {/* From Entities */}
                    <TableCell className="py-3 font-medium text-foreground">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {conn.from.map((fromId) => {
                          const ent = entities.find((e) => e.id === fromId)
                          const name = ent ? getEntityName(ent) : fromId
                          return (
                            <span
                              key={fromId}
                              className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-background/80 px-2 py-0.5 text-xs font-semibold text-foreground shadow-2xs"
                            >
                              <span className="size-1.5 rounded-full bg-primary/70" />
                              <span>{name}</span>
                            </span>
                          )
                        })}
                      </div>
                    </TableCell>

                    {/* Directional */}
                    <TableCell className="py-3">
                      <span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/30 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {conn.isDirectional ? (
                          <>
                            <ArrowRight className="size-3 text-primary" />
                            <span>{t("connectionsPage.isDirectional")}</span>
                          </>
                        ) : (
                          <>
                            <MoveHorizontal className="size-3 text-muted-foreground" />
                            <span>{t("connectionsPage.isNonDirectional")}</span>
                          </>
                        )}
                      </span>
                    </TableCell>

                    {/* To Entities */}
                    <TableCell className="py-3 font-medium text-foreground">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {conn.to.map((toId) => {
                          const ent = entities.find((e) => e.id === toId)
                          const name = ent ? getEntityName(ent) : toId
                          return (
                            <span
                              key={toId}
                              className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-background/80 px-2 py-0.5 text-xs font-semibold text-foreground shadow-2xs"
                            >
                              <span className="size-1.5 rounded-full bg-primary/70" />
                              <span>{name}</span>
                            </span>
                          )
                        })}
                      </div>
                    </TableCell>

                    {/* Template */}
                    <TableCell className="py-3 text-xs text-muted-foreground">
                      {tplName ? (
                        <span className="inline-flex items-center rounded-md border border-primary/20 bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary">
                          {tplName}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </TableCell>

                    {/* Records Preview */}
                    <TableCell className="py-3">
                      <div className="flex max-w-2xl flex-wrap items-center gap-1.5">
                        {conn.records.length === 0 ? (
                          <span className="text-xs text-muted-foreground italic">
                            {t("templates.noRecords")}
                          </span>
                        ) : (
                          conn.records.map((record, rIdx) => (
                            <span
                              key={rIdx}
                              className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-background/80 px-2 py-0.5 text-[11px] font-normal text-muted-foreground shadow-2xs"
                            >
                              {getTypeIcon(record.type)}
                              {record.isArray ? (
                                <Ellipsis className="size-3.5 text-muted-foreground" />
                              ) : (
                                <></>
                              )}
                              <span className="font-medium text-foreground">
                                {record.name}
                              </span>
                              {record.value !== undefined &&
                                record.value !== null &&
                                String(record.value).trim() !== "" && (
                                  <span className="text-muted-foreground">
                                    :{" "}
                                    {Array.isArray(record.value)
                                      ? `[${record.value.join(", ")}]`
                                      : String(record.value)}
                                  </span>
                                )}
                            </span>
                          ))
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Connection Dialog for creating/editing */}
      <ConnectionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultValue={selectedConnection}
      />
    </TabsContent>
  )
}
