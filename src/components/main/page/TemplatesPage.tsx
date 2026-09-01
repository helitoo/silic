import * as React from "react"
import { Plus, Layers, Ellipsis } from "lucide-react"

import type { Template } from "@/lib/types"
import { getTypeIcon } from "@/lib/template-utils"
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
import TemplateDialog from "@/components/main/dialog/TemplateDialog"
import NotHasAnyItem from "@/components/main/page/NotHasAnyItem"

interface RecordsPreviewProps {
  records: Template["records"]
}

function RecordsPreview({ records }: RecordsPreviewProps) {
  const { t } = useLang()
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const isDragging = React.useRef(false)
  const startX = React.useRef(0)
  const startScrollLeft = React.useRef(0)
  const hasDragged = React.useRef(false)

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return
    isDragging.current = true
    hasDragged.current = false
    startX.current = e.clientX
    startScrollLeft.current = scrollRef.current.scrollLeft
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current || !scrollRef.current) return
    const dx = e.clientX - startX.current
    if (Math.abs(dx) > 4) {
      hasDragged.current = true
    }
    scrollRef.current.scrollLeft = startScrollLeft.current - dx
  }

  const handleMouseUp = () => {
    isDragging.current = false
  }

  const handleMouseLeave = () => {
    isDragging.current = false
  }

  const handleClick = (e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.stopPropagation()
    }
  }

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return
    if (
      e.deltaY !== 0 &&
      scrollRef.current.scrollWidth > scrollRef.current.clientWidth
    ) {
      scrollRef.current.scrollLeft += e.deltaY
    }
  }

  if (records.length === 0) {
    return (
      <span className="text-xs text-muted-foreground italic">
        {t("templates.noRecords")}
      </span>
    )
  }

  return (
    <div
      ref={scrollRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onWheel={handleWheel}
      className="no-scrollbar flex w-full items-center gap-1.5 overflow-x-auto py-0.5 select-none"
    >
      {records.map((record, rIdx) => (
        <span
          key={rIdx}
          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border/80 bg-background/80 px-2 py-0.5 text-[11px] font-normal text-muted-foreground shadow-2xs"
        >
          {getTypeIcon(record.type)}
          {record.isArray ? (
            <Ellipsis className="size-3.5 text-muted-foreground" />
          ) : (
            <></>
          )}

          <span className="font-medium text-foreground">{record.name}</span>
        </span>
      ))}
    </div>
  )
}

export default function TemplatesPage() {
  const { templates } = useTemplate()
  const { t } = useLang()
  const [selectedTemplate, setSelectedTemplate] =
    React.useState<Template | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const handleRowClick = (template: Template) => {
    setSelectedTemplate(template)
    setDialogOpen(true)
  }

  const handleCreateNew = () => {
    setSelectedTemplate(null)
    setDialogOpen(true)
  }

  if (templates.length === 0) {
    return (
      <TabsContent
        value="templates"
        className="w-full space-y-4 px-4 pt-4 pb-12 focus-visible:outline-none sm:px-8 sm:pb-16 md:px-12 md:pb-24 lg:px-16 xl:px-24"
      >
        <NotHasAnyItem
          icon={Layers}
          label={t("templates.noTemplates")}
          description={t("templates.createFirstTemplate")}
          buttonLabel={t("templates.newTemplate")}
          buttonOnclick={handleCreateNew}
        />
        <TemplateDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          defaultValue={selectedTemplate}
        />
      </TabsContent>
    )
  }

  return (
    <TabsContent
      value="templates"
      className="w-full space-y-4 px-4 pt-4 pb-12 focus-visible:outline-none sm:px-8 sm:pb-16 md:px-12 md:pb-24 lg:px-16 xl:px-24"
    >
      {/* Header section */}
      <div className="flex items-center justify-end">
        <Button
          onClick={handleCreateNew}
          size="sm"
          className="gap-1.5 shadow-xs"
        >
          <Plus className="size-3.5" />
          <span>{t("templates.newTemplate")}</span>
        </Button>
      </div>

      {/* Table section */}
      <div className="overflow-hidden rounded-lg border border-border bg-card/50 shadow-2xs">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[200px] sm:w-[240px] font-semibold">
                {t("templates.templateName")}
              </TableHead>
              <TableHead className="font-semibold">
                {t("templates.records")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow
                key={template.id}
                onClick={() => handleRowClick(template)}
                className="group cursor-pointer transition-colors hover:bg-muted/60"
              >
                {/* Template Name */}
                <TableCell className="py-3 font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    <div className="size-2 shrink-0 rounded-full bg-primary/70 transition-colors group-hover:bg-primary" />
                    <span className="truncate">{template.name}</span>
                  </div>
                </TableCell>

                {/* Records Preview */}
                <TableCell className="max-w-0 py-3">
                  <RecordsPreview records={template.records} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Template Dialog for creating/editing */}
      <TemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultValue={selectedTemplate}
      />
    </TabsContent>
  )
}
