import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Entity, Connection, Template, Type } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns the name of an Entity based on its first record of type "shortText",
 * falling back to "(?)" if none exists.
 */
export function getEntityName(entity?: Entity | null): string {
  if (!entity) return ""
  if (Array.isArray(entity.records)) {
    const firstShortText = entity.records.find(
      (r) =>
        r &&
        r.type === "shortText" &&
        r.value !== undefined &&
        r.value !== null &&
        (Array.isArray(r.value)
          ? r.value.some((v) => typeof v === "string" && v.trim() !== "")
          : String(r.value).trim() !== "")
    )
    if (firstShortText) {
      if (Array.isArray(firstShortText.value)) {
        const firstVal = firstShortText.value.find(
          (v) => String(v ?? "").trim() !== ""
        )
        return firstVal !== undefined && String(firstVal).trim() !== ""
          ? String(firstVal)
          : "(?)"
      }
      const valStr = String(firstShortText.value).trim()
      return valStr !== "" ? valStr : "(?)"
    }
  }
  return "(?)"
}

/**
 * Returns the name of a Connection based on its template name (if templates provided),
 * falling back to its first record of type "shortText", or "(?)".
 */
export function getConnectionName(
  connection?: Connection | null,
  templates?: Template[]
): string {
  if (!connection) return ""
  if (connection.template && Array.isArray(templates)) {
    const tpl = templates.find((t) => t.id === connection.template)
    if (tpl && tpl.name && tpl.name.trim() !== "") {
      return tpl.name
    }
  }
  if (Array.isArray(connection.records)) {
    const firstShortText = connection.records.find(
      (r) =>
        r &&
        r.type === "shortText" &&
        r.value !== undefined &&
        r.value !== null &&
        (Array.isArray(r.value)
          ? r.value.some((v) => typeof v === "string" && v.trim() !== "")
          : String(r.value).trim() !== "")
    )
    if (firstShortText) {
      if (Array.isArray(firstShortText.value)) {
        const firstVal = firstShortText.value.find(
          (v) => String(v ?? "").trim() !== ""
        )
        return firstVal !== undefined && String(firstVal).trim() !== ""
          ? String(firstVal)
          : "(?)"
      }
      const valStr = String(firstShortText.value).trim()
      return valStr !== "" ? valStr : "(?)"
    }
  }
  return "(?)"
}

/**
 * Returns the colors from the first record of type "color" on an Entity.
 * If the record is an array / list, returns all color values in the list.
 */
export function getEntityColor(entity?: Entity | null): string[] {
  if (!entity || !Array.isArray(entity.records)) return []
  const colorRecord = entity.records.find(
    (r) =>
      r &&
      r.type === "color" &&
      r.value !== undefined &&
      r.value !== null &&
      (Array.isArray(r.value)
        ? r.value.some((v) => typeof v === "string" && v.trim() !== "")
        : typeof r.value === "string" && r.value.trim() !== "")
  )
  if (!colorRecord) return []
  if (Array.isArray(colorRecord.value)) {
    return colorRecord.value
      .map((v) => String(v ?? "").trim())
      .filter(Boolean)
  }
  const val = String(colorRecord.value).trim()
  return val ? [val] : []
}

/**
 * Returns the first image URL or attachment ID from the first record of type "image" on an Entity.
 * If the record is a list, returns only the first image.
 */
export function getEntityImage(entity?: Entity | null): string | null {
  if (!entity || !Array.isArray(entity.records)) return null
  const imageRecord = entity.records.find(
    (r) =>
      r &&
      r.type === "image" &&
      r.value !== undefined &&
      r.value !== null
  )
  if (!imageRecord) return null
  if (Array.isArray(imageRecord.value)) {
    for (const v of imageRecord.value) {
      const str = String(v ?? "").trim()
      if (str) return str
    }
    return null
  }
  const val = String(imageRecord.value).trim()
  return val || null
}

/**
 * Checks if a record has a non-empty name and a non-empty value.
 */
export function hasRecordValue(r?: {
  name?: string
  type?: Type
  isArray?: boolean
  value?: any
} | null): boolean {
  if (!r) return false
  if (!r.name || r.name.trim() === "") return false
  if (r.value === undefined || r.value === null) return false

  if (r.isArray) {
    if (Array.isArray(r.value)) {
      return r.value.some(
        (item) =>
          item !== undefined &&
          item !== null &&
          (typeof item === "string" ? item.trim() !== "" : true)
      )
    }
    if (typeof r.value === "string") {
      return r.value.trim() !== ""
    }
    return true
  }

  if (typeof r.value === "string") {
    return r.value.trim() !== ""
  }
  if (typeof r.value === "number") {
    return !isNaN(r.value)
  }
  if (typeof r.value === "boolean") {
    return true
  }
  if (r.value instanceof Date) {
    return !isNaN(r.value.getTime())
  }
  return String(r.value).trim() !== ""
}

/**
 * Duplicates files/attachments referenced in an array of records.
 * For records of type "image" | "video" | "audio" | "file", clones the attachment in storage
 * and replaces the ID with the newly created duplicate ID.
 */
export async function duplicateRecordFiles<
  T extends { name?: string; type?: Type; isArray?: boolean; value?: any },
>(
  records: T[],
  duplicateFileFn: (oldId: string) => Promise<{ id: string } | null>
): Promise<T[]> {
  const result: T[] = []
  for (const r of records) {
    const isMedia =
      r.type && ["image", "video", "audio", "file"].includes(r.type)
    if (!isMedia || r.value === undefined || r.value === null) {
      result.push(r)
      continue
    }

    if (r.isArray && Array.isArray(r.value)) {
      const newValues = await Promise.all(
        r.value.map(async (item) => {
          if (typeof item === "string" && item.trim() !== "") {
            const dup = await duplicateFileFn(item.trim())
            return dup ? dup.id : item
          }
          return item
        })
      )
      result.push({
        ...r,
        value: newValues,
      })
    } else if (typeof r.value === "string" && r.value.trim() !== "") {
      const dup = await duplicateFileFn(r.value.trim())
      result.push({
        ...r,
        value: dup ? dup.id : r.value,
      })
    } else {
      result.push(r)
    }
  }
  return result
}

/**
 * Deletes all files/attachments referenced by an array of records from storage.
 */
export async function deleteRecordFiles(
  records?: Array<{ type?: Type; isArray?: boolean; value?: any }> | null,
  removeAttachmentFn?: (id: string) => Promise<void>
): Promise<void> {
  if (!records || !Array.isArray(records) || !removeAttachmentFn) return

  for (const r of records) {
    if (!r) continue
    const isMedia =
      r.type && ["image", "video", "audio", "file"].includes(r.type)
    if (!isMedia || r.value === undefined || r.value === null) continue

    if (r.isArray && Array.isArray(r.value)) {
      for (const val of r.value) {
        if (typeof val === "string" && val.trim() !== "") {
          try {
            await removeAttachmentFn(val.trim())
          } catch (err) {
            console.error("Failed to delete attachment file:", err)
          }
        }
      }
    } else if (typeof r.value === "string" && r.value.trim() !== "") {
      try {
        await removeAttachmentFn(r.value.trim())
      } catch (err) {
        console.error("Failed to delete attachment file:", err)
      }
    }
  }
}

/**
 * Safely copy text to clipboard with automatic fallback and window focus handling.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // 1. Try modern navigator.clipboard with window.focus()
  try {
    if (typeof window !== "undefined") {
      window.focus()
    }
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function" &&
      window.isSecureContext
    ) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch (err) {
    console.warn(
      "navigator.clipboard.writeText failed, trying execCommand fallback:",
      err
    )
  }

  // 2. Fallback: document.execCommand('copy') with off-screen textarea
  try {
    if (typeof document === "undefined") return false
    const textArea = document.createElement("textarea")
    textArea.value = text
    textArea.setAttribute("readonly", "")
    textArea.style.position = "fixed"
    textArea.style.left = "-9999px"
    textArea.style.top = "-9999px"
    textArea.style.opacity = "0"
    textArea.style.pointerEvents = "none"
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    const successful = document.execCommand("copy")
    document.body.removeChild(textArea)
    return successful
  } catch (err) {
    console.error("Fallback clipboard copy failed:", err)
    return false
  }
}
