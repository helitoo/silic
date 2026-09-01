import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Entity, Connection } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns the name of an Entity based on its first record of type "shortText",
 * falling back to the entity ID if none exists.
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
        return firstVal !== undefined ? String(firstVal) : entity.id || ""
      }
      return String(firstShortText.value)
    }
  }
  return entity.id || ""
}

/**
 * Returns the name of a Connection based on its first record of type "shortText",
 * falling back to the connection ID if none exists.
 */
export function getConnectionName(connection?: Connection | null): string {
  if (!connection) return ""
  if (Array.isArray(connection.records)) {
    const firstShortText = connection.records.find(
      (r) =>
        r &&
        r.type === "shortText" &&
        r.value !== undefined &&
        r.value !== null &&
        String(r.value).trim() !== ""
    )
    if (firstShortText) {
      if (Array.isArray(firstShortText.value)) {
        return firstShortText.value.length > 0
          ? String(firstShortText.value[0] ?? "")
          : connection.id || ""
      }
      return String(firstShortText.value)
    }
  }
  return connection.id || ""
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


