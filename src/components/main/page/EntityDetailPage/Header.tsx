import { ArrowLeft, Edit3, Tag, Trash2 } from "lucide-react"
import type { Entity } from "@/lib/types"
import { getEntityName, getEntityColor } from "@/lib/utils"
import { useEntity } from "@/contexts/EntityContext"
import { useTemplate } from "@/contexts/TemplateContext"
import { useLang } from "@/contexts/LangContext"
import { toast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { CopyButton } from "@/components/ui/copy-button"

export interface EntityDetailHeaderProps {
  entity: Entity
  onBack: () => void
  onEdit: () => void
  onDelete?: () => void
}

export function EntityDetailHeader({
  entity,
  onBack,
  onEdit,
  onDelete,
}: EntityDetailHeaderProps) {
  const { delete: deleteEntity } = useEntity()
  const { templates } = useTemplate()
  const { t } = useLang()

  const name = getEntityName(entity)
  const colors = getEntityColor(entity)
  const templateObj = entity.template
    ? templates.find((tpl) => tpl.id === entity.template)
    : null

  const handleDelete = () => {
    if (onDelete) {
      onDelete()
    } else {
      deleteEntity(entity.id)
      toast.add({
        type: "success",
        title: t("entityDetailPage.deletedSuccess"),
      })
      onBack()
    }
  }

  const gradientBackground =
    colors.length > 0
      ? `linear-gradient(to right, transparent 0%, ${colors
          .map(
            (c, idx) =>
              `${c} ${Math.round(((idx + 1) / colors.length) * 100)}%`
          )
          .join(", ")})`
      : undefined

  return (
    <div className="relative flex flex-col gap-4 pb-5">
      {/* Right-aligned 1/2 viewport width gradient background from entity colors */}
      {gradientBackground && (
        <div
          className="pointer-events-none absolute -top-6 -bottom-6 right-0 w-[50vw] max-w-full opacity-30 dark:opacity-35 blur-xl transition-all duration-300"
          style={{ background: gradientBackground }}
          aria-hidden="true"
        />
      )}

      {/* Top action row: Back Button, Delete Button & Edit Button */}
      <div className="relative z-10 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          <span className="text-xs font-medium sm:text-sm">
            {t("entityDetailPage.back")}
          </span>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="gap-1.5 border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive dark:border-destructive dark:hover:bg-destructive/20"
          >
            <Trash2 className="size-3.5" />
            <span>{t("entityDetailPage.delete")}</span>
          </Button>

          <Button
            type="button"
            onClick={onEdit}
            size="sm"
            className="gap-2 shadow-xs"
          >
            <Edit3 className="size-3.5" />
            <span>{t("entityDetailPage.edit")}</span>
          </Button>
        </div>
      </div>

      {/* Main Title, Template Badge & ID Row */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {name || entity.id}
            </h1>

            {templateObj && (
              <span className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                <Tag className="size-3" />
                {templateObj.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded border border-border/40 bg-muted/60 px-1.5 py-0.5 font-mono text-[11px] select-all">
              {entity.id}
            </span>
            <CopyButton content={entity.id} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default EntityDetailHeader
