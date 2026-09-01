import * as React from "react"
import { Sparkles } from "lucide-react"
import { useEntity } from "@/contexts/EntityContext"
import { useQuery } from "@/contexts/QueryContext"
import { useLang } from "@/contexts/LangContext"
import { TabsContent } from "@/components/ui/tabs"
import { EntityPageHeader } from "./Header"
import { CardView } from "./CardView"
import { TableView } from "./TableView"
import { EntitiesDialog } from "@/components/main/dialog/EntitiesDialog"
import QueryStatusBanner from "@/components/main/QueryStatusBanner"
import NotHasAnyItem from "@/components/main/page/NotHasAnyItem"
import { useRouter } from "@/contexts/RouterContext"

export function EntityPage() {
  const { entities } = useEntity()
  const { currentEntities, isEntityFiltered, resetEntities } = useQuery()
  const { t } = useLang()
  const { navigate } = useRouter()

  const [viewMode, setViewMode] = React.useState<"grid" | "table">("grid")
  const [filterRecord, setFilterRecord] = React.useState<string>("__ALL__")
  const [filterValue, setFilterValue] = React.useState<string>("")
  const [sortRecord, setSortRecord] = React.useState<string>("none")
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">(
    "asc"
  )

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [dialogEntity, setDialogEntity] = React.useState<any>(null)

  const handleNewEntity = () => {
    setDialogEntity(null)
    setIsDialogOpen(true)
  }

  const handleSelectEntity = (entity: any) => {
    navigate(`/d/entity/${entity.id}/detail`)
  }

  // Filter and Sort Entities based on currentEntities from query context
  const processedEntities = React.useMemo(() => {
    let result = [...currentEntities]

    // 1. Filter
    const query = filterValue.trim().toLowerCase()
    if (query) {
      result = result.filter((ent) => {
        if (filterRecord === "__ALL__") {
          if (ent.id.toLowerCase().includes(query)) return true
          if (ent.template && ent.template.toLowerCase().includes(query))
            return true
          return (ent.records || []).some((r) => {
            if (r.value !== undefined && r.value !== null) {
              return String(r.value).toLowerCase().includes(query)
            }
            return false
          })
        } else {
          // If entity does not have this record, skip it
          const rec = ent.records?.find((r) => r.name === filterRecord)
          if (!rec || rec.value === undefined || rec.value === null)
            return false
          return String(rec.value).toLowerCase().includes(query)
        }
      })
    }

    // 2. Sort (only when sortRecord is specified and not 'none')
    if (sortRecord && sortRecord !== "none") {
      result.sort((a, b) => {
        let valA: any = ""
        let valB: any = ""

        if (sortRecord === "id") {
          valA = a.id
          valB = b.id
        } else if (sortRecord === "template") {
          valA = a.template || ""
          valB = b.template || ""
        } else {
          const recA = a.records?.find((r) => r.name === sortRecord)
          const recB = b.records?.find((r) => r.name === sortRecord)
          valA =
            recA?.value !== undefined && recA?.value !== null ? recA.value : ""
          valB =
            recB?.value !== undefined && recB?.value !== null ? recB.value : ""
        }

        // Numerical comparison if both numbers
        if (typeof valA === "number" && typeof valB === "number") {
          return sortDirection === "asc" ? valA - valB : valB - valA
        }

        // String comparison
        const strA = String(valA).toLowerCase()
        const strB = String(valB).toLowerCase()
        const comp = strA.localeCompare(strB)
        return sortDirection === "asc" ? comp : -comp
      })
    }

    return result
  }, [currentEntities, filterRecord, filterValue, sortRecord, sortDirection])

  const handleResetAll = () => {
    resetEntities()
    setFilterRecord("__ALL__")
    setFilterValue("")
    setSortRecord("none")
    setSortDirection("asc")
  }

  const isAnyFiltered =
    isEntityFiltered ||
    Boolean(filterValue.trim()) ||
    sortRecord !== "none" ||
    processedEntities.length !== entities.length

  if (entities.length === 0) {
    return (
      <TabsContent
        value="entities"
        className="w-full space-y-4 px-4 pt-4 pb-12 focus-visible:outline-none sm:px-8 sm:pb-16 md:px-12 md:pb-24 lg:px-16 xl:px-24"
      >
        <NotHasAnyItem
          icon={Sparkles}
          label={t("entitiesPage.noEntities")}
          description={t("entitiesPage.createFirstEntity")}
          buttonLabel={t("entitiesPage.newEntity")}
          buttonOnclick={handleNewEntity}
        />
        <EntitiesDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          defaultValue={dialogEntity}
        />
      </TabsContent>
    )
  }

  return (
    <TabsContent
      value="entities"
      className="w-full space-y-4 px-4 pt-4 pb-12 focus-visible:outline-none sm:px-8 sm:pb-16 md:px-12 md:pb-24 lg:px-16 xl:px-24"
    >
      {/* Top Header Bar: Status Message on Left, Header Controls on Right */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <QueryStatusBanner
          currentCount={processedEntities.length}
          totalCount={entities.length}
          itemLabel={t("diagramPage.entitiesCount")}
          isFiltered={isAnyFiltered}
          onReset={handleResetAll}
        />

        {/* Header controls: Filter, Sort, Sub-tabs (Grid/Table), Create Entity */}
        <EntityPageHeader
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          filterRecord={filterRecord}
          onFilterRecordChange={setFilterRecord}
          filterValue={filterValue}
          onFilterValueChange={setFilterValue}
          sortRecord={sortRecord}
          onSortRecordChange={setSortRecord}
          sortDirection={sortDirection}
          onSortDirectionChange={setSortDirection}
          onNewEntity={handleNewEntity}
        />
      </div>

      {/* Main Content View: Grid or Table */}
      {viewMode === "grid" ? (
        <CardView
          entities={processedEntities}
          onSelectEntity={handleSelectEntity}
          onNewEntity={handleNewEntity}
        />
      ) : (
        <TableView
          entities={processedEntities}
          onSelectEntity={handleSelectEntity}
          onNewEntity={handleNewEntity}
        />
      )}

      {/* Entities Dialog for Creation & Editing */}
      <EntitiesDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        defaultValue={dialogEntity}
      />
    </TabsContent>
  )
}

export default EntityPage
