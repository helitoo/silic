import { Plus, Sparkles } from "lucide-react"
import type { Entity } from "@/lib/types"
import { getTypeIcon } from "@/lib/template-utils"
import {
  getEntityName,
  getEntityColor,
  getEntityImage,
  hasRecordValue,
} from "@/lib/utils"

import { useTemplate } from "@/contexts/TemplateContext"
import { useLang } from "@/contexts/LangContext"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { MediaImage } from "@/components/ui/media-image"

export interface CardViewProps {
  entities: Entity[]
  onSelectEntity: (entity: Entity) => void
  onNewEntity?: () => void
  isLoading?: boolean
}

export function CardView({
  entities,
  onSelectEntity,
  onNewEntity,
  isLoading,
}: CardViewProps) {
  const { templates } = useTemplate()
  const { t } = useLang()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, idx) => (
          <Card key={idx} className="overflow-hidden">
            <Skeleton className="aspect-video w-full rounded-none" />
            <CardHeader className="gap-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-5/6" />
              <Skeleton className="h-3.5 w-4/6" />
            </CardContent>
          </Card>
        ))}
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
    <div className="columns-1 gap-4 [column-fill:_balance] sm:columns-2 md:columns-3 lg:columns-4">
      {entities.map((entity) => {
        const title = getEntityName(entity)
        const imageSrc = getEntityImage(entity)
        const colors = getEntityColor(entity)

        const templateObj = entity.template
          ? templates.find((tpl) => tpl.id === entity.template)
          : null

        const validRecords = (entity.records || []).filter(hasRecordValue)
        const hasTopMedia = Boolean(imageSrc || colors.length > 0)

        return (
          <div key={entity.id} className="mb-4 break-inside-avoid">
            <Card
              onClick={() => onSelectEntity(entity)}
              className={`group cursor-pointer overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md ${
                hasTopMedia ? "pt-0" : ""
              }`}
            >
              {/* Top Image or Color Gradient Banner */}
              {imageSrc ? (
                <div className="relative aspect-video w-full overflow-hidden bg-muted/40">
                  {/* Background blurred layer to fill extra space */}
                  <div
                    className="absolute inset-0 overflow-hidden"
                    aria-hidden="true"
                  >
                    <MediaImage
                      src={imageSrc}
                      alt={title}
                      className="size-full scale-110 object-cover opacity-60 blur-md dark:opacity-50"
                    />
                  </div>
                  {/* Foreground uncropped image */}
                  <MediaImage
                    src={imageSrc}
                    alt={title}
                    className="relative z-10 size-full object-contain transition-transform duration-300 group-hover:scale-102"
                  />
                </div>
              ) : colors.length > 0 ? (
                <div
                  className="aspect-video w-full opacity-85 transition-transform duration-300 group-hover:scale-102 dark:opacity-80"
                  style={{
                    background:
                      colors.length === 1
                        ? colors[0]
                        : `linear-gradient(135deg, ${colors.join(", ")})`,
                  }}
                />
              ) : null}

              {/* Card Header */}
              <CardHeader className="pb-1">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="truncate font-semibold text-foreground">
                    {title}
                  </CardTitle>
                </div>
                <CardDescription className="flex justify-between truncate text-[10px]">
                  {templateObj && <>{templateObj.name}</>}
                </CardDescription>
              </CardHeader>

              {/* Card Content - Single line records (only with values) */}
              {validRecords.length > 0 && (
                <CardContent className="space-y-1.5 pt-1">
                  {validRecords.slice(0, 5).map((rec, rIdx) => {
                    let displayVal = ""
                    if (rec.value instanceof Date) {
                      displayVal = rec.value.toLocaleDateString()
                    } else if (Array.isArray(rec.value)) {
                      displayVal = `${rec.value
                        .filter(
                          (v) =>
                            v !== undefined &&
                            v !== null &&
                            String(v).trim() !== ""
                        )
                        .join(", ")}`
                    } else if (rec.value !== undefined && rec.value !== null) {
                      if (rec.type === "longText") displayVal = "..."
                      else displayVal = String(rec.value)
                    }

                    return (
                      <div
                        key={rec.id || rIdx}
                        className="flex items-center gap-1.5 text-xs"
                      >
                        <span className="shrink-0">
                          {getTypeIcon(rec.type)}
                        </span>
                        <span className="shrink-0 font-medium text-muted-foreground">
                          {rec.name}:
                        </span>
                        <span
                          className="inline-flex min-w-0 flex-1 items-center gap-1.5 truncate text-foreground"
                          title={displayVal}
                        >
                          {rec.type === "color" && displayVal && (
                            <span
                              className="size-2.5 shrink-0 rounded-xs border border-border/70"
                              style={{ backgroundColor: displayVal }}
                            />
                          )}
                          <span className="truncate">{displayVal}</span>
                        </span>
                      </div>
                    )
                  })}

                  {validRecords.length > 5 && (
                    <p className="text-[10px] text-muted-foreground">
                      +{validRecords.length - 5} {t("entitiesPage.allRecords")}
                      ...
                    </p>
                  )}
                </CardContent>
              )}
            </Card>
          </div>
        )
      })}
    </div>
  )
}

export default CardView
