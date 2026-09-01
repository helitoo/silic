import * as React from "react"
import {
  AlignLeft,
  Type as TypeIcon,
  Hash,
  Calendar,
  Clock,
  CalendarClock,
  ToggleLeft,
  Image as ImageIcon,
  File as FileIcon,
  Palette,
  Link as LinkIcon,
  Video as VideoIcon,
  Headphones as AudioIcon,
} from "lucide-react"

import type { Connection, Type } from "@/lib/types"
import { getConnectionName } from "./utils"

export interface TypeOption {
  value: Type
  label: string
  icon: React.ReactNode
}

export const typeOptions: TypeOption[] = [
  {
    value: "shortText",
    label: "Text",
    icon: <TypeIcon className="size-3.5 text-muted-foreground" />,
  },
  {
    value: "longText",
    label: "Essay",
    icon: <AlignLeft className="size-3.5 text-muted-foreground" />,
  },
  {
    value: "number",
    label: "Number",
    icon: <Hash className="size-3.5 text-muted-foreground" />,
  },
  {
    value: "date",
    label: "Date",
    icon: <Calendar className="size-3.5 text-muted-foreground" />,
  },
  {
    value: "time",
    label: "Time",
    icon: <Clock className="size-3.5 text-muted-foreground" />,
  },
  {
    value: "dateTime",
    label: "Date Time",
    icon: <CalendarClock className="size-3.5 text-muted-foreground" />,
  },
  {
    value: "boolean",
    label: "Boolean",
    icon: <ToggleLeft className="size-3.5 text-muted-foreground" />,
  },
  {
    value: "url",
    label: "URL",
    icon: <LinkIcon className="size-3.5 text-muted-foreground" />,
  },
  {
    value: "image",
    label: "Image",
    icon: <ImageIcon className="size-3.5 text-muted-foreground" />,
  },
  {
    value: "video",
    label: "Video",
    icon: <VideoIcon className="size-3.5 text-muted-foreground" />,
  },
  {
    value: "audio",
    label: "Audio",
    icon: <AudioIcon className="size-3.5 text-muted-foreground" />,
  },
  {
    value: "file",
    label: "File",
    icon: <FileIcon className="size-3.5 text-muted-foreground" />,
  },
  {
    value: "color",
    label: "Color",
    icon: <Palette className="size-3.5 text-muted-foreground" />,
  },
]

export function getTypeIcon(type: Type) {
  const option = typeOptions.find((opt) => opt.value === type)
  return option ? option.icon : <TypeIcon className="size-3.5 text-muted-foreground" />
}

export function getTypeLabel(type: Type, t?: (key: string) => string) {
  if (t) {
    return t(`types.${type}`)
  }
  const option = typeOptions.find((opt) => opt.value === type)
  return option ? option.label : type
}

export function getTypeOptions(t?: (key: string) => string): TypeOption[] {
  return typeOptions.map((opt) => ({
    ...opt,
    label: t ? t(`types.${opt.value}`) : opt.label,
  }))
}

export function getConnectionDisplayName(conn?: Connection | null): string {
  return getConnectionName(conn)
}

const FILE_TYPES = new Set<Type>(["image", "video", "audio", "file"])

export function isFileType(type?: Type): boolean {
  return Boolean(type && FILE_TYPES.has(type))
}

/**
 * Cast a single atomic value from oldType to newType
 */
export function castSingleValue(val: any, oldType: Type, newType: Type): any {
  if (val === undefined || val === null || val === "") return ""

  const isOldFile = isFileType(oldType)
  const isNewFile = isFileType(newType)

  // 1. Crossing file / non-file boundary -> drop value completely
  if (isOldFile !== isNewFile) {
    return ""
  }

  // 2. Both are files -> keep file UUID
  if (isOldFile && isNewFile) {
    return String(val)
  }

  // 3. Same type
  if (oldType === newType) {
    return val
  }

  const strVal = String(val).trim()
  if (strVal === "") return ""

  switch (newType) {
    case "shortText": {
      if (oldType === "longText") {
        return strVal.replace(/<[^>]*>/g, "").trim()
      }
      return strVal
    }
    case "longText": {
      if (
        oldType === "shortText" ||
        oldType === "number" ||
        oldType === "url"
      ) {
        if (!strVal.startsWith("<p>")) {
          return `<p>${strVal}</p>`
        }
      }
      return strVal
    }
    case "number": {
      const num = Number(strVal)
      if (isNaN(num)) return ""
      return num
    }
    case "boolean": {
      const lower = strVal.toLowerCase()
      if (["true", "1", "yes", "y"].includes(lower)) return true
      if (["false", "0", "no", "n"].includes(lower)) return false
      return ""
    }
    case "url": {
      if (
        strVal.startsWith("http://") ||
        strVal.startsWith("https://") ||
        strVal.startsWith("/")
      ) {
        return strVal
      }
      if (strVal.includes(".") && !strVal.includes(" ")) {
        return `https://${strVal}`
      }
      return strVal
    }
    case "color": {
      const isValidHex = /^#([0-9A-F]{3}){1,2}$/i.test(strVal)
      return isValidHex ? strVal : ""
    }
    case "date": {
      const d = new Date(strVal)
      if (isNaN(d.getTime())) return ""
      return d.toISOString().slice(0, 10)
    }
    case "dateTime": {
      const d = new Date(strVal)
      if (isNaN(d.getTime())) return ""
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      return local.toISOString().slice(0, 16)
    }
    case "time": {
      if (/^\d{2}:\d{2}(:\d{2})?$/.test(strVal)) {
        return strVal.slice(0, 5)
      }
      const d = new Date(strVal)
      if (!isNaN(d.getTime())) {
        return d.toTimeString().slice(0, 5)
      }
      return ""
    }
    default:
      return strVal
  }
}

/**
 * Cast a record value accounting for isArray transitions and item casting
 */
export function castRecordValue(
  value: any,
  oldType: Type,
  newType: Type,
  wasArray: boolean,
  isArray: boolean
): any {
  let items: any[] = []
  if (wasArray) {
    items = Array.isArray(value)
      ? value
      : value !== undefined && value !== ""
      ? [value]
      : []
  } else {
    items = Array.isArray(value)
      ? value
      : value !== undefined && value !== ""
      ? [value]
      : []
  }

  const castedItems = items
    .map((item) => castSingleValue(item, oldType, newType))
    .filter((item) => item !== "" && item !== undefined && item !== null)

  if (isArray) {
    return castedItems
  } else {
    // Transitioning from list to non-list: keep first valid element
    return castedItems.length > 0 ? castedItems[0] : ""
  }
}

import type { Record as EntityRecord, Template } from "@/lib/types"

export interface SyncTemplateResult {
  records: EntityRecord[]
  deletedFileIds: string[]
}

/**
 * Align entity records with a newly updated template
 */
export function syncEntityWithTemplate(
  entityRecords: EntityRecord[] = [],
  template: Template,
  oldTemplate?: Template | null,
  deleteMissingRecords = false,
  renameMap?: Map<string, string>
): SyncTemplateResult {
  const deletedFileIds: string[] = []
  const existingMap = new Map<string, EntityRecord>()

  for (const r of entityRecords) {
    if (r.name) {
      const effectiveName = renameMap?.get(r.name) || r.name
      existingMap.set(effectiveName, {
        ...r,
        name: effectiveName,
      })
    }
  }

  // 1. Template records in exact order
  const alignedRecords: EntityRecord[] = []

  for (const tr of template.records) {
    const existing = existingMap.get(tr.name)
    if (existing) {
      const wasArray = Boolean(existing.isArray)
      const isArray = Boolean(tr.isArray)
      const oldType = existing.type || tr.type
      const newType = tr.type

      // If file type is converted to non-file type, gather old file IDs to delete
      if (isFileType(oldType) && !isFileType(newType)) {
        if (Array.isArray(existing.value)) {
          existing.value.forEach((v: any) => {
            if (v && typeof v === "string" && v.trim())
              deletedFileIds.push(v.trim())
          })
        } else if (
          existing.value &&
          typeof existing.value === "string" &&
          existing.value.trim()
        ) {
          deletedFileIds.push(existing.value.trim())
        }
      }

      const castedVal = castRecordValue(
        existing.value,
        oldType,
        newType,
        wasArray,
        isArray
      )

      alignedRecords.push({
        id: existing.id || crypto.randomUUID(),
        name: tr.name,
        type: newType,
        isArray,
        value: castedVal,
      })
    } else {
      // New record added to template
      alignedRecords.push({
        id: crypto.randomUUID(),
        name: tr.name,
        type: tr.type,
        isArray: Boolean(tr.isArray),
        value: tr.isArray ? [] : "",
      })
    }
  }

  // 2. Extra custom records belonging only to this entity
  const templateRecordNames = new Set(template.records.map((r) => r.name))
  const oldTemplateRecordNames = new Set(
    (oldTemplate?.records || []).map((r) => renameMap?.get(r.name) || r.name)
  )

  for (const rec of entityRecords) {
    const effectiveName = renameMap?.get(rec.name) || rec.name
    if (!effectiveName) continue
    if (templateRecordNames.has(effectiveName)) continue

    const wasInOldTemplate = oldTemplateRecordNames.has(effectiveName)

    if (wasInOldTemplate && deleteMissingRecords) {
      if (isFileType(rec.type)) {
        if (Array.isArray(rec.value)) {
          rec.value.forEach((v: any) => {
            if (v && typeof v === "string" && v.trim())
              deletedFileIds.push(v.trim())
          })
        } else if (
          rec.value &&
          typeof rec.value === "string" &&
          rec.value.trim()
        ) {
          deletedFileIds.push(rec.value.trim())
        }
      }
      // Drop this record
      continue
    }

    // Keep custom record at the bottom
    alignedRecords.push({
      ...rec,
      name: effectiveName,
    })
  }

  return {
    records: alignedRecords,
    deletedFileIds,
  }
}


