import DOMPurify from "dompurify"
import { AlignLeft, FileText, Video as VideoIcon, Headphones as AudioIcon } from "lucide-react"
import type { Entity } from "@/lib/types"
import { hasRecordValue } from "@/lib/utils"
import { useLang } from "@/contexts/LangContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MediaVideo } from "@/components/ui/media-video"
import { MediaAudio } from "@/components/ui/media-audio"

export interface LongTextSectionsProps {
  entity: Entity
}

export function LongTextSections({ entity }: LongTextSectionsProps) {
  const { t } = useLang()

  // Filter records with type === "longText" | "video" | "audio" that have non-empty value
  const mediaRecords = (entity.records || []).filter(
    (r) =>
      (r.type === "longText" || r.type === "video" || r.type === "audio") &&
      hasRecordValue(r)
  )


  if (mediaRecords.length === 0) {
    return (
      <Card className="border-dashed border-border/60 bg-muted/20">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
            <FileText className="size-5" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {t("entityDetailPage.noLongText")}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {mediaRecords.map((rec, rIdx) => {
        const isArray = Boolean(rec.isArray)
        const values: string[] = isArray
          ? Array.isArray(rec.value)
            ? rec.value
                .map((v) => String(v ?? "").trim())
                .filter(Boolean)
            : rec.value !== undefined &&
                rec.value !== null &&
                String(rec.value).trim() !== ""
              ? [String(rec.value).trim()]
              : []
          : rec.value !== undefined &&
              rec.value !== null &&
              String(rec.value).trim() !== ""
            ? [String(rec.value)]
            : []


        const IconComponent =
          rec.type === "video"
            ? VideoIcon
            : rec.type === "audio"
              ? AudioIcon
              : AlignLeft

        return (
          <Card
            key={rec.id || `media-${rIdx}`}
            className="overflow-hidden shadow-2xs"
          >
            <CardHeader className="border-b border-border/50 bg-muted/30">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex size-6 items-center justify-center rounded-md bg-muted text-foreground">
                    <IconComponent className="size-3.5" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-foreground">
                    {rec.name}
                  </CardTitle>
                  {isArray && (
                    <span className="rounded-md bg-muted/70 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {values.length} {t("entityDialog.array")}
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {values.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">—</p>
              ) : rec.type === "video" ? (
                <div className="space-y-4">
                  {values.map((v, vIdx) => (
                    <MediaVideo key={vIdx} src={v} />
                  ))}
                </div>
              ) : rec.type === "audio" ? (
                <div className="space-y-3">
                  {values.map((v, vIdx) => (
                    <MediaAudio
                      key={vIdx}
                      src={v}
                      title={
                        values.length > 1
                          ? `${rec.name} #${vIdx + 1}`
                          : undefined
                      }
                    />
                  ))}
                </div>
              ) : isArray ? (
                <div className="space-y-2.5">
                  {values.map((itemVal, idx) => {
                    const cleanHtml = DOMPurify.sanitize(itemVal || "")
                    return (
                      <div
                        key={idx}
                        className="rounded-lg border border-border/40 bg-card/60 p-3 font-sans text-xs leading-relaxed text-foreground sm:text-sm"
                      >
                        {itemVal ? (
                          <div
                            className="rich-text-content select-text break-words"
                            dangerouslySetInnerHTML={{ __html: cleanHtml }}
                          />
                        ) : (
                          <span className="text-muted-foreground italic">
                            —
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="font-sans text-xs leading-relaxed text-foreground sm:text-sm">
                  {values[0] ? (
                    <div
                      className="rich-text-content select-text break-words"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(values[0]),
                      }}
                    />
                  ) : (
                    <span className="text-muted-foreground italic">—</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export default LongTextSections
