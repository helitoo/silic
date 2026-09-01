import * as React from "react"
import {
  ExternalLink,
  GitCommit,
  Layers,
  ArrowRight,
  ArrowLeft,
  ArrowLeftRight,
  File,
  Image as ImageIcon,
} from "lucide-react"
import type { Entity, Type, Connection } from "@/lib/types"
import { getTypeIcon } from "@/lib/template-utils"
import { getEntityName, getConnectionName } from "@/lib/utils"
import { useConnection } from "@/contexts/ConnectionContext"
import { useEntity } from "@/contexts/EntityContext"
import { useProjectStorage } from "@/contexts/ProjectStorageContext"
import { useLang } from "@/contexts/LangContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyButton } from "@/components/ui/copy-button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { MediaImage } from "@/components/ui/media-image"
import { ImageModal } from "@/components/ui/image-modal"

export interface ShortSectionsProps {
  entity: Entity
  onSelectEntity?: (entity: Entity) => void
}

interface GalleryItem {
  id: string
  src: string
  title: string
}

export function ShortSections({ entity, onSelectEntity }: ShortSectionsProps) {
  const { connections } = useConnection()
  const { entities } = useEntity()
  const { attachments } = useProjectStorage()
  const { t } = useLang()

  const getImageCaption = React.useCallback(
    (src: string, fallback?: string) => {
      const matched = attachments.find((a) => a.id === src)
      if (matched?.caption && matched.caption.trim() !== "") {
        return matched.caption
      }
      return matched?.id || fallback || src
    },
    [attachments]
  )

  const [modalState, setModalState] = React.useState<{
    open: boolean
    images: Array<{ src: string; title?: string }>
    initialIndex: number
  }>({
    open: false,
    images: [],
    initialIndex: 0,
  })

  // 1. Separate Image records
  const imageRecords = React.useMemo(
    () => (entity.records || []).filter((r) => r.type === "image"),
    [entity.records]
  )

  // First image record
  const firstImageRecord = imageRecords[0]
  const firstImageValues = React.useMemo(() => {
    if (
      !firstImageRecord ||
      firstImageRecord.value === undefined ||
      firstImageRecord.value === null
    ) {
      return []
    }
    if (Array.isArray(firstImageRecord.value)) {
      return firstImageRecord.value
        .map((v) => String(v ?? "").trim())
        .filter(Boolean)
    }
    const valStr = String(firstImageRecord.value).trim()
    return valStr ? [valStr] : []
  }, [firstImageRecord])

  // Other image records for masonry gallery
  const otherImageRecords = React.useMemo(
    () => imageRecords.slice(1),
    [imageRecords]
  )

  const galleryItems = React.useMemo<GalleryItem[]>(() => {
    const list: GalleryItem[] = []
    for (let rIdx = 0; rIdx < otherImageRecords.length; rIdx++) {
      const rec = otherImageRecords[rIdx]
      if (rec.value === undefined || rec.value === null) continue

      if (Array.isArray(rec.value)) {
        rec.value.forEach((v, vIdx) => {
          const s = String(v ?? "").trim()
          if (s) {
            list.push({
              id: `${rec.id || rIdx}-${vIdx}`,
              src: s,
              title: getImageCaption(s, `${rec.name} #${vIdx + 1}`),
            })
          }
        })
      } else {
        const s = String(rec.value).trim()
        if (s) {
          list.push({
            id: `${rec.id || rIdx}`,
            src: s,
            title: getImageCaption(s, rec.name),
          })
        }
      }
    }
    return list
  }, [otherImageRecords, getImageCaption])

  // 2. Filter other short records (excluding longText, video, audio, image)
  const shortRecords = (entity.records || []).filter(
    (r) => !["longText", "video", "audio", "image"].includes(r.type)
  )

  // 3. Find connections involving this entity
  const relevantConns = React.useMemo(() => {
    const list: Array<{
      id: string
      partnerId: string
      connectionId: string
      connectionObj: Connection
      isDirectional: boolean
      isOutbound: boolean
    }> = []

    for (const conn of connections) {
      if (conn.from.includes(entity.id)) {
        for (const target of conn.to) {
          list.push({
            id: `${conn.id}-${target}`,
            partnerId: target,
            connectionId: conn.id,
            connectionObj: conn,
            isDirectional: conn.isDirectional,
            isOutbound: true,
          })
        }
      } else if (conn.to.includes(entity.id)) {
        for (const source of conn.from) {
          list.push({
            id: `${conn.id}-${source}`,
            partnerId: source,
            connectionId: conn.id,
            connectionObj: conn,
            isDirectional: conn.isDirectional,
            isOutbound: false,
          })
        }
      }
    }
    return list
  }, [connections, entity.id])

  const renderFieldValue = (type: Type, val: unknown, isArray: boolean) => {
    if (val === undefined || val === null || val === "") {
      return <span className="text-xs text-muted-foreground italic">—</span>
    }

    if (isArray && Array.isArray(val)) {
      if (val.length === 0) {
        return <span className="text-xs text-muted-foreground italic">—</span>
      }
      return (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {val.map((item, idx) => {
            const itemStr = String(item)
            return (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/50 px-2 py-0.5 font-mono text-xs text-foreground"
              >
                {type === "color" && (
                  <span
                    className="size-3 shrink-0 rounded-xs border border-border/80 shadow-2xs"
                    style={{ backgroundColor: itemStr }}
                  />
                )}
                {type === "file" && (
                  <File className="size-3 shrink-0 text-muted-foreground" />
                )}
                {type === "url" ? (
                  <a
                    href={
                      itemStr.startsWith("http://") ||
                      itemStr.startsWith("https://")
                        ? itemStr
                        : `https://${itemStr}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <span className="max-w-[200px] truncate">{itemStr}</span>
                    <ExternalLink className="size-3 shrink-0" />
                  </a>
                ) : (
                  itemStr
                )}
              </span>
            )
          })}
        </div>
      )
    }

    if (type === "color") {
      const colorVal = String(val)
      return (
        <div className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-muted/40 px-2 py-1">
          <span
            className="size-4 shrink-0 rounded-xs border border-border/80 shadow-2xs"
            style={{ backgroundColor: colorVal }}
          />
          <span className="font-mono text-xs font-medium text-foreground">
            {colorVal}
          </span>
        </div>
      )
    }

    if (type === "file") {
      const fileStr = String(val)
      return (
        <div className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2 py-1 font-mono text-xs text-foreground">
          <File className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="break-all">{fileStr}</span>
        </div>
      )
    }

    if (type === "url") {
      const urlStr = String(val)
      const href =
        urlStr.startsWith("http://") || urlStr.startsWith("https://")
          ? urlStr
          : `https://${urlStr}`
      return (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 font-mono text-xs break-all text-primary hover:underline"
        >
          <span>{urlStr}</span>
          <ExternalLink className="size-3 shrink-0" />
        </a>
      )
    }

    if (type === "boolean") {
      const isTrue =
        typeof val === "boolean" ? val : String(val).toLowerCase() === "true"
      return (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            isTrue
              ? "border border-emerald-500/20 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : "border border-border/50 bg-muted text-muted-foreground"
          }`}
        >
          {isTrue ? "True" : "False"}
        </span>
      )
    }

    if (type === "date" || type === "dateTime" || type === "time") {
      const d =
        val instanceof Date ? val : new Date(val as string | number)
      const formatted = !isNaN(d.getTime())
        ? type === "date"
          ? d.toLocaleDateString()
          : type === "time"
            ? d.toLocaleTimeString()
            : d.toLocaleString()
        : String(val)

      return (
        <span className="rounded border border-border/40 bg-muted/40 px-2 py-0.5 font-mono text-xs text-foreground">
          {formatted}
        </span>
      )
    }

    return (
      <span className="font-mono text-xs break-words text-foreground">
        {String(val)}
      </span>
    )
  }

  return (
    <div className="space-y-4">
      {/* 1. First Image Carousel (Top of ShortSections) */}
      {firstImageRecord && firstImageValues.length > 0 && (
        <Card className="overflow-hidden shadow-2xs">
          <CardHeader className="border-b border-border/50 bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="size-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">
                  {firstImageRecord.name}
                </span>
              </div>
              {firstImageValues.length > 1 && (
                <span className="font-mono text-[11px] text-muted-foreground">
                  {firstImageValues.length} images
                </span>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-2 sm:p-3">
            <Carousel opts={{ loop: true }} className="w-full">
              <CarouselContent>
                {firstImageValues.map((imgSrc, idx) => (
                  <CarouselItem key={idx}>
                    <div
                      className="group relative aspect-video w-full cursor-pointer overflow-hidden rounded-lg border border-border/40 bg-muted/40"
                      onClick={() =>
                        setModalState({
                          open: true,
                          images: firstImageValues.map((src, i) => ({
                            src,
                            title: getImageCaption(
                              src,
                              `${firstImageRecord.name} #${i + 1}`
                            ),
                          })),
                          initialIndex: idx,
                        })
                      }
                      title={getImageCaption(
                        imgSrc,
                        `${firstImageRecord.name} #${idx + 1}`
                      )}
                    >
                      {/* Background blurred layer to fill extra space */}
                      <div
                        className="absolute inset-0 overflow-hidden"
                        aria-hidden="true"
                      >
                        <MediaImage
                          src={imgSrc}
                          alt={getImageCaption(
                            imgSrc,
                            `${firstImageRecord.name} ${idx + 1}`
                          )}
                          className="size-full scale-110 object-cover opacity-60 blur-md dark:opacity-50"
                        />
                      </div>
                      {/* Foreground uncropped image */}
                      <MediaImage
                        src={imgSrc}
                        alt={getImageCaption(
                          imgSrc,
                          `${firstImageRecord.name} ${idx + 1}`
                        )}
                        className="relative z-10 size-full object-contain transition-transform duration-300 group-hover:scale-102"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {firstImageValues.length > 1 && (
                <>
                  <CarouselPrevious className="left-2 bg-background/85 backdrop-blur-xs" />
                  <CarouselNext className="right-2 bg-background/85 backdrop-blur-xs" />
                </>
              )}
            </Carousel>
          </CardContent>
        </Card>
      )}

      {/* 2. Other Records Card */}
      <Card className="shadow-2xs">
        <CardHeader className="border-b border-border/50 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-md bg-muted text-foreground">
                <Layers className="size-3.5" />
              </div>
              <CardTitle className="text-sm font-semibold text-foreground">
                {t("entityDetailPage.otherRecords")}
              </CardTitle>
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {shortRecords.length}
            </span>
          </div>
        </CardHeader>

        <CardContent>
          {shortRecords.length === 0 ? (
            <p className="py-2 text-center text-xs text-muted-foreground italic">
              {t("entityDetailPage.noOtherRecords")}
            </p>
          ) : (
            <div className="divide-y divide-border/40">
              {shortRecords.map((rec, rIdx) => (
                <div
                  key={rec.id || `short-${rIdx}`}
                  className="flex flex-col gap-1 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <span className="shrink-0">{getTypeIcon(rec.type)}</span>
                      <span className="truncate">{rec.name}</span>
                    </div>

                    {rec.value !== undefined && rec.value !== null && (
                      <CopyButton
                        content={
                          Array.isArray(rec.value)
                            ? rec.value.join(", ")
                            : String(rec.value)
                        }
                      />
                    )}
                  </div>

                  <div>
                    {renderFieldValue(
                      rec.type,
                      rec.value,
                      Boolean(rec.isArray)
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Connected Relationships Card */}
      <Card className="shadow-2xs">
        <CardHeader className="border-b border-border/50 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-md bg-muted text-foreground">
                <GitCommit className="size-3.5" />
              </div>
              <CardTitle className="text-sm font-semibold text-foreground">
                {t("entityDetailPage.connections")}
              </CardTitle>
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {relevantConns.length}
            </span>
          </div>
        </CardHeader>

        <CardContent>
          {relevantConns.length === 0 ? (
            <p className="py-2 text-center text-xs text-muted-foreground italic">
              {t("entityDetailPage.noConnections")}
            </p>
          ) : (
            <div className="space-y-2.5">
              {relevantConns.map((connItem, idx) => {
                const partner = entities.find(
                  (e) => e.id === connItem.partnerId
                )
                const partnerName = getEntityName(partner) || connItem.partnerId
                const connName =
                  getConnectionName(connItem.connectionObj) ||
                  connItem.connectionId

                return (
                  <div
                    key={idx}
                    className="flex flex-col gap-2 rounded-lg border border-border/60 bg-card/60 p-2.5 transition-all hover:border-border"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-mono text-xs font-semibold text-foreground">
                        {connName}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-muted/70 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {connItem.isDirectional ? (
                          connItem.isOutbound ? (
                            <>
                              <ArrowRight className="size-3" />
                              <span>Outbound</span>
                            </>
                          ) : (
                            <>
                              <ArrowLeft className="size-3" />
                              <span>Inbound</span>
                            </>
                          )
                        ) : (
                          <>
                            <ArrowLeftRight className="size-3" />
                            <span>Undirected</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-border/30 pt-2 text-xs">
                      <span className="text-[11px] text-muted-foreground">
                        Target:
                      </span>
                      {partner ? (
                        <button
                          type="button"
                          onClick={() => onSelectEntity?.(partner)}
                          className="max-w-[200px] cursor-pointer truncate text-right font-medium text-primary hover:underline"
                          title={partner.id}
                        >
                          {partnerName}
                        </button>
                      ) : (
                        <span className="truncate font-mono text-muted-foreground">
                          {connItem.partnerId}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Subsequent Images Gallery in Masonry Layout (Bottom of ShortSections) */}
      {galleryItems.length > 0 && (
        <Card className="shadow-2xs">
          <CardHeader className="border-b border-border/50 bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-md bg-muted text-foreground">
                  <ImageIcon className="size-3.5" />
                </div>
                <CardTitle className="text-sm font-semibold text-foreground">
                  Gallery ({galleryItems.length})
                </CardTitle>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {galleryItems.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() =>
                    setModalState({
                      open: true,
                      images: galleryItems.map((g) => ({
                        src: g.src,
                        title: g.title,
                      })),
                      initialIndex: idx,
                    })
                  }
                  className="group cursor-pointer overflow-hidden rounded-lg border border-border/60 bg-card/60 p-1 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50"
                  title={item.title}
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded-md bg-muted/40">
                    {/* Background blurred layer to fill extra space */}
                    <div
                      className="absolute inset-0 overflow-hidden"
                      aria-hidden="true"
                    >
                      <MediaImage
                        src={item.src}
                        alt={item.title}
                        className="size-full scale-110 object-cover opacity-60 blur-md dark:opacity-50"
                      />
                    </div>
                    {/* Foreground uncropped image */}
                    <MediaImage
                      src={item.src}
                      alt={item.title}
                      className="relative z-10 size-full object-contain transition-transform duration-300 group-hover:scale-102"
                    />
                  </div>
                  <p className="mt-1 truncate text-center font-mono text-[10px] text-muted-foreground">
                    {item.title}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 5. Image Modal Popup */}
      <ImageModal
        open={modalState.open}
        onOpenChange={(open) => setModalState((prev) => ({ ...prev, open }))}
        images={modalState.images}
        initialIndex={modalState.initialIndex}
      />
    </div>
  )
}

export default ShortSections

