import { openDB, type DBSchema, type IDBPDatabase } from "idb"
import type { AttachmentMeta, Connection, Entity, Template } from "./types"

export interface StoredAttachment {
  id: string
  mimeType: string
  size: number
  blob: Blob
  caption?: string
}

export interface StoredAppState {
  key: string // e.g. "current-project"
  fileName: string
  entities: Entity[]
  connections: Connection[]
  templates: Template[]
  attachments: AttachmentMeta[]
  updatedAt: string
}

interface SilicDB extends DBSchema {
  attachments: {
    key: string
    value: StoredAttachment
  }
  "app-state": {
    key: string
    value: StoredAppState
  }
}

const DB_NAME = "silic-db"
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<SilicDB>> | null = null

export function getDb(): Promise<IDBPDatabase<SilicDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SilicDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("attachments")) {
          db.createObjectStore("attachments", { keyPath: "id" })
        }
        if (!db.objectStoreNames.contains("app-state")) {
          db.createObjectStore("app-state", { keyPath: "key" })
        }
      },
    })
  }
  return dbPromise
}

// ---------------- Attachment operations ----------------

export async function saveAttachment(record: StoredAttachment): Promise<void> {
  const db = await getDb()
  await db.put("attachments", record)
}

export async function getAttachment(
  id: string
): Promise<StoredAttachment | undefined> {
  const db = await getDb()
  return db.get("attachments", id)
}

export async function getAllAttachments(): Promise<StoredAttachment[]> {
  const db = await getDb()
  return db.getAll("attachments")
}

export async function deleteAttachment(id: string): Promise<void> {
  const db = await getDb()
  await db.delete("attachments", id)
}

export async function clearAllAttachments(): Promise<void> {
  const db = await getDb()
  await db.clear("attachments")
}

// ---------------- App State operations ----------------

export async function saveAppState(
  state: Omit<StoredAppState, "key">
): Promise<void> {
  const db = await getDb()
  await db.put("app-state", {
    key: "current-project",
    ...state,
  })
}

export async function getAppState(): Promise<StoredAppState | undefined> {
  const db = await getDb()
  return db.get("app-state", "current-project")
}

export async function clearAppState(): Promise<void> {
  const db = await getDb()
  await db.delete("app-state", "current-project")
}
