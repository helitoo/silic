import * as React from "react"
import {
  ArrowDownUp,
  Filter,
  LayoutDashboard,
  Plus,
  Table as TableIcon,
  X,
} from "lucide-react"
import { useTemplate } from "@/contexts/TemplateContext"
import { useEntity } from "@/contexts/EntityContext"
import { useLang } from "@/contexts/LangContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RecordSelect } from "@/components/main/queryBlocks/components/RecordSelect"

export interface EntityPageHeaderProps {
  viewMode: "grid" | "table"
  onViewModeChange: (mode: "grid" | "table") => void
  filterRecord: string
  onFilterRecordChange: (record: string) => void
  filterValue: string
  onFilterValueChange: (value: string) => void
  sortRecord: string
  onSortRecordChange: (record: string) => void
  sortDirection: "asc" | "desc"
  onSortDirectionChange: (direction: "asc" | "desc") => void
  onNewEntity: () => void
}

export function EntityPageHeader({
  viewMode,
  onViewModeChange,
  filterRecord,
  onFilterRecordChange,
  filterValue,
  onFilterValueChange,
  sortRecord,
  onSortRecordChange,
  sortDirection,
  onSortDirectionChange,
  onNewEntity,
}: EntityPageHeaderProps) {
  const { templates } = useTemplate()
  const { allRecordNames } = useEntity()
  const { t } = useLang()

  const [isFilterDialogOpen, setIsFilterDialogOpen] = React.useState(false)
  const [isSortDialogOpen, setIsSortDialogOpen] = React.useState(false)

  // Local state for filter dialog
  const [tempFilterRecord, setTempFilterRecord] = React.useState(filterRecord)
  const [tempFilterValue, setTempFilterValue] = React.useState(filterValue)

  // Local state for sort dialog
  const [tempSortRecord, setTempSortRecord] = React.useState(sortRecord || "none")
  const [tempSortDirection, setTempSortDirection] = React.useState<
    "asc" | "desc"
  >(sortDirection)

  const hasActiveFilter = Boolean(filterValue.trim())
  const hasActiveSort = Boolean(sortRecord && sortRecord !== "none")

  const availableSortRecords = React.useMemo(() => {
    const set = new Set<string>()
    for (const tpl of templates) {
      if (Array.isArray(tpl.records)) {
        for (const r of tpl.records) {
          if (r.name) set.add(r.name)
        }
      }
    }
    for (const rName of allRecordNames) {
      set.add(rName)
    }
    return Array.from(set)
  }, [templates, allRecordNames])

  const handleOpenFilterDialog = () => {
    setTempFilterRecord(filterRecord)
    setTempFilterValue(filterValue)
    setIsFilterDialogOpen(true)
  }

  const handleApplyFilter = () => {
    onFilterRecordChange(tempFilterRecord)
    onFilterValueChange(tempFilterValue)
    setIsFilterDialogOpen(false)
  }

  const handleResetFilter = () => {
    setTempFilterRecord("__ALL__")
    setTempFilterValue("")
    onFilterRecordChange("__ALL__")
    onFilterValueChange("")
    setIsFilterDialogOpen(false)
  }

  const handleOpenSortDialog = () => {
    setTempSortRecord(sortRecord || "none")
    setTempSortDirection(sortDirection)
    setIsSortDialogOpen(true)
  }

  const handleApplySort = () => {
    onSortRecordChange(tempSortRecord)
    onSortDirectionChange(tempSortDirection)
    setIsSortDialogOpen(false)
  }

  const handleResetSort = () => {
    setTempSortRecord("none")
    setTempSortDirection("asc")
    onSortRecordChange("none")
    onSortDirectionChange("asc")
    setIsSortDialogOpen(false)
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {/* Action Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Sort Button (with active indicator badge) */}
        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={handleOpenSortDialog}
            title={t("entitiesPage.sort")}
            aria-label={t("entitiesPage.sort")}
          >
            <ArrowDownUp className="size-4" />
          </Button>
          {hasActiveSort && (
            <span className="absolute top-0.5 right-0.5 size-2 rounded-full bg-primary ring-2 ring-background" />
          )}
        </div>

        {/* Filter Button (with active indicator badge) */}
        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={handleOpenFilterDialog}
            title={t("entitiesPage.filter")}
            aria-label={t("entitiesPage.filter")}
          >
            <Filter className="size-4" />
          </Button>
          {hasActiveFilter && (
            <span className="absolute top-0.5 right-0.5 size-2 rounded-full bg-primary ring-2 ring-background" />
          )}
        </div>

        {/* Sub-tabs: Grid view / Table view (Icon-only) */}
        <Tabs
          value={viewMode}
          onValueChange={(val) =>
            val && onViewModeChange(val as "grid" | "table")
          }
        >
          <TabsList className="h-8 bg-muted/50 p-1">
            <TabsTrigger
              value="grid"
              className="size-6 p-0 data-[state=active]:bg-background data-[state=active]:shadow-xs"
              title={t("entitiesPage.gridView")}
              aria-label={t("entitiesPage.gridView")}
            >
              <LayoutDashboard className="size-3.5" />
            </TabsTrigger>
            <TabsTrigger
              value="table"
              className="size-6 p-0 data-[state=active]:bg-background data-[state=active]:shadow-xs"
              title={t("entitiesPage.tableView")}
              aria-label={t("entitiesPage.tableView")}
            >
              <TableIcon className="size-3.5" />
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Create Entity Button */}
        <Button onClick={onNewEntity} size="sm" className="gap-1.5 shadow-xs">
          <Plus className="size-3.5" />
          <span>{t("entitiesPage.newEntity")}</span>
        </Button>
      </div>

      {/* Filter Dialog */}
      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {t("entitiesPage.filter")}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t("query.entityQueryDesc")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            {/* Record Field Selection using RecordSelect */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground">
                {t("entitiesPage.filterField")}
              </label>
              <RecordSelect
                includeAll
                value={tempFilterRecord}
                onChange={setTempFilterRecord}
                className="h-8 w-full justify-between"
              />
            </div>

            {/* Filter Value Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground">
                {t("entityDialog.fieldValue")}
              </label>
              <div className="relative flex items-center">
                <Input
                  value={tempFilterValue}
                  onChange={(e) => setTempFilterValue(e.target.value)}
                  placeholder={t("entitiesPage.filterValuePlaceholder")}
                  className="h-8 pr-8 text-xs"
                  autoFocus
                />
                {tempFilterValue && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="absolute right-1.5 size-5 rounded-full text-muted-foreground hover:text-foreground"
                    onClick={() => setTempFilterValue("")}
                  >
                    <X className="size-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-row items-center justify-between gap-2 border-t border-border/50 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetFilter}
            >
              {t("entitiesPage.resetFilter")}
            </Button>
            <Button type="button" size="sm" onClick={handleApplyFilter}>
              {t("entitiesPage.apply")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sort Dialog */}
      <Dialog open={isSortDialogOpen} onOpenChange={setIsSortDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {t("entitiesPage.sort")}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t("entitiesPage.sortField")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            {/* Sort Field Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground">
                {t("entitiesPage.sortField")}
              </label>
              <Select
                value={tempSortRecord || "none"}
                onValueChange={(val) => {
                  if (val) setTempSortRecord(val)
                }}
              >
                <SelectTrigger className="h-8 w-full text-xs">
                  <SelectValue>
                    <span>
                      {tempSortRecord === "none"
                        ? t("entitiesPage.noSort")
                        : tempSortRecord === "id"
                          ? "ID"
                          : tempSortRecord === "template"
                            ? t("entitiesPage.template")
                            : tempSortRecord}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectGroup>
                    <SelectItem value="none">
                      <span className="text-xs font-semibold">
                        {t("entitiesPage.noSort")}
                      </span>
                    </SelectItem>
                    <SelectItem value="id">
                      <span className="text-xs font-medium">ID</span>
                    </SelectItem>
                    <SelectItem value="template">
                      <span className="text-xs font-medium">
                        {t("entitiesPage.template")}
                      </span>
                    </SelectItem>
                    {availableSortRecords.map((name) => (
                      <SelectItem key={name} value={name}>
                        <span className="text-xs font-medium">{name}</span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Direction */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground">
                {t("entitiesPage.sort")}
              </label>
              <Select
                value={tempSortDirection}
                disabled={tempSortRecord === "none"}
                onValueChange={(val) => {
                  if (val) setTempSortDirection(val as "asc" | "desc")
                }}
              >
                <SelectTrigger className="h-8 w-full text-xs">
                  <SelectValue>
                    <span>
                      {tempSortDirection === "asc"
                        ? t("entitiesPage.ascending")
                        : t("entitiesPage.descending")}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectGroup>
                    <SelectItem value="asc">
                      <span>{t("entitiesPage.ascending")}</span>
                    </SelectItem>
                    <SelectItem value="desc">
                      <span>{t("entitiesPage.descending")}</span>
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex flex-row items-center justify-between gap-2 border-t border-border/50 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetSort}
            >
              {t("entitiesPage.resetSort")}
            </Button>
            <Button type="button" size="sm" onClick={handleApplySort}>
              {t("entitiesPage.apply")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default EntityPageHeader
