import * as React from "react"
import type {
  AttachmentMeta,
  Connection,
  Entity,
  SilicManifest,
  Template,
} from "@/lib/types"
import {
  saveAttachment,
  getAttachment,
  getAllAttachments,
  deleteAttachment as dbDeleteAttachment,
  clearAllAttachments,
  saveAppState,
  getAppState,
  clearAppState,
} from "@/lib/db"
import { downloadSilicFile } from "@/lib/localFiles/downloadFile"
import { toast } from "@/components/ui/toast"
import { useLang } from "./LangContext"
import { LoadingDialog } from "@/components/ui/loading-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { useEntity } from "./EntityContext"
import { useConnection } from "./ConnectionContext"
import { useTemplate } from "./TemplateContext"

export interface ProjectStorageContextType {
  fileName: string
  setFileName: (name: string) => void
  attachments: AttachmentMeta[]
  addAttachment: (
    file: File,
    customId?: string,
    caption?: string
  ) => Promise<AttachmentMeta>
  updateAttachmentCaption: (id: string, caption: string) => Promise<void>
  removeAttachment: (id: string) => Promise<void>
  duplicateFile: (
    oldId: string,
    customId?: string,
    caption?: string
  ) => Promise<AttachmentMeta | null>
  duplicateAttachment: (
    oldId: string,
    customId?: string,
    caption?: string
  ) => Promise<AttachmentMeta | null>
  cleanupOrphanedAttachments: () => Promise<number>
  exportProjectSilic: (customName?: string) => Promise<void>
  importProjectSilic: (file: File) => Promise<void>
  newProject: () => Promise<void>
  clearProject: () => Promise<void>
  saveProject?: () => Promise<void>
  showLoading: (message?: string) => void
  hideLoading: () => void
  isLoading: boolean
}

export const ProjectStorageContext =
  React.createContext<ProjectStorageContextType | null>(null)

function getReferencedAttachmentIds(
  entitiesList: Entity[],
  connectionsList: Connection[]
): Set<string> {
  const referenced = new Set<string>()

  const scanRecords = (records?: any[]) => {
    if (!Array.isArray(records)) return
    for (const r of records) {
      if (!r || r.value === undefined || r.value === null) continue
      const isMedia =
        r.type && ["image", "video", "audio", "file"].includes(r.type)
      if (!isMedia) continue

      if (r.isArray && Array.isArray(r.value)) {
        for (const item of r.value) {
          if (typeof item === "string" && item.trim() !== "") {
            referenced.add(item.trim())
          }
        }
      } else if (typeof r.value === "string" && r.value.trim() !== "") {
        referenced.add(r.value.trim())
      }
    }
  }

  entitiesList.forEach((e) => scanRecords(e.records))
  connectionsList.forEach((c) => scanRecords(c.records))

  return referenced
}

export function ProjectStorageProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { t } = useLang()
  const { entities, setEntities } = useEntity()
  const { connections, setConnections } = useConnection()
  const { templates, setTemplates } = useTemplate()

  const [fileName, setFileName] = React.useState<string>("Untitled")
  const [attachments, setAttachments] = React.useState<AttachmentMeta[]>([])
  const [loadingState, setLoadingState] = React.useState<{
    isOpen: boolean
    message?: string
  }>({
    isOpen: false,
    message: undefined,
  })
  const [quotaExceededAlertOpen, setQuotaExceededAlertOpen] =
    React.useState(false)

  const [isHydrated, setIsHydrated] = React.useState(false)

  const showLoading = React.useCallback((message?: string) => {
    setLoadingState({ isOpen: true, message })
  }, [])

  const hideLoading = React.useCallback(() => {
    setLoadingState({ isOpen: false, message: undefined })
  }, [])

  // Cleanup attachments in IndexedDB that are no longer referenced in any entity or connection
  const cleanupOrphanedAttachments = React.useCallback(async (): Promise<number> => {
    try {
      const referenced = getReferencedAttachmentIds(entities, connections)
      const allStored = await getAllAttachments()
      const orphaned = allStored.filter((item) => !referenced.has(item.id))

      if (orphaned.length === 0) {
        return 0
      }

      for (const item of orphaned) {
        await dbDeleteAttachment(item.id)
      }

      const orphanedIdSet = new Set(orphaned.map((o) => o.id))
      setAttachments((prev) => prev.filter((a) => !orphanedIdSet.has(a.id)))

      toast.add({
        type: "info",
        title: t("projectStorage.orphansCleaned", { count: orphaned.length }),
      })

      return orphaned.length
    } catch (err) {
      console.error("Failed to cleanup orphaned attachments:", err)
      return 0
    }
  }, [entities, connections, t])

  // Check storage quota with navigator.storage.estimate and cleanup orphaned files if needed
  const checkStorageQuotaAndPrepare = React.useCallback(
    async (requiredBytes: number): Promise<boolean> => {
      if (
        typeof navigator !== "undefined" &&
        navigator.storage &&
        navigator.storage.estimate
      ) {
        try {
          const estimate = await navigator.storage.estimate()
          const quota = estimate.quota ?? 0
          const usage = estimate.usage ?? 0
          const available = quota > usage ? quota - usage : 0

          // Safety margin: 5MB for IndexedDB metadata/indexes
          const SAFETY_MARGIN = 5 * 1024 * 1024
          if (requiredBytes + SAFETY_MARGIN > available) {
            // Storage quota is insufficient, attempt cleaning up orphaned unreferenced files
            const cleaned = await cleanupOrphanedAttachments()
            if (cleaned > 0) {
              const newEstimate = await navigator.storage.estimate()
              const newQuota = newEstimate.quota ?? 0
              const newUsage = newEstimate.usage ?? 0
              const newAvailable = newQuota > newUsage ? newQuota - newUsage : 0

              if (requiredBytes + SAFETY_MARGIN <= newAvailable) {
                return true
              }
            }

            // Still full after cleanup
            setQuotaExceededAlertOpen(true)
            toast.add({
              type: "error",
              title: t("projectStorage.quotaExceededTitle"),
              description: t("projectStorage.quotaExceededDesc"),
            })
            return false
          }
        } catch (err) {
          console.warn("Storage quota estimation failed:", err)
        }
      }
      return true
    },
    [cleanupOrphanedAttachments, t]
  )

  // Hydrate on mount from IndexedDB app-state
  React.useEffect(() => {
    let active = true
    async function loadSavedState() {
      try {
        const state = await getAppState()
        if (active && state) {
          if (state.fileName) setFileName(state.fileName)
          if (Array.isArray(state.entities)) setEntities(state.entities)
          if (Array.isArray(state.connections))
            setConnections(state.connections)
          if (Array.isArray(state.templates)) setTemplates(state.templates)
          if (Array.isArray(state.attachments))
            setAttachments(state.attachments)
        }
      } catch (err) {
        console.error("Failed to hydrate project from IndexedDB:", err)
      } finally {
        if (active) setIsHydrated(true)
      }
    }
    loadSavedState()
    return () => {
      active = false
    }
  }, [setEntities, setConnections, setTemplates])

  // Debounced auto-save app state to IndexedDB
  React.useEffect(() => {
    if (!isHydrated) return

    const timer = setTimeout(async () => {
      try {
        await saveAppState({
          fileName,
          entities,
          connections,
          templates,
          attachments,
          updatedAt: new Date().toISOString(),
        })
      } catch (err) {
        console.error("Auto-save to IndexedDB failed:", err)
      }
    }, 600)

    return () => clearTimeout(timer)
  }, [fileName, entities, connections, templates, attachments, isHydrated])

  // Add attachment with optional custom ID and caption
  const addAttachment = React.useCallback(
    async (
      file: File,
      customId?: string,
      caption?: string
    ): Promise<AttachmentMeta> => {
      // 1. Pre-estimate storage quota and cleanup unreferenced files if needed
      const hasSpace = await checkStorageQuotaAndPrepare(file.size)
      if (!hasSpace) {
        throw new Error("Storage quota exceeded")
      }

      showLoading(t("common.processing"))
      try {
        const id = customId || crypto.randomUUID()
        const mimeType = file.type || "application/octet-stream"
        const size = file.size
        const defaultCaption =
          file.name && file.name.trim() !== "" ? file.name.trim() : id
        const finalCaption =
          caption !== undefined && caption.trim() !== ""
            ? caption.trim()
            : defaultCaption

        const meta: AttachmentMeta = {
          id,
          mimeType,
          size,
          caption: finalCaption,
        }

        try {
          await saveAttachment({
            id,
            mimeType,
            size,
            blob: file,
            caption: finalCaption,
          })
        } catch (dbErr) {
          // If save failed due to quota, attempt cleanup and retry once
          const cleaned = await cleanupOrphanedAttachments()
          if (cleaned > 0) {
            await saveAttachment({
              id,
              mimeType,
              size,
              blob: file,
              caption: finalCaption,
            })
          } else {
            setQuotaExceededAlertOpen(true)
            throw dbErr
          }
        }

        setAttachments((prev) => {
          const filtered = prev.filter((a) => a.id !== id)
          return [...filtered, meta]
        })
        return meta
      } finally {
        hideLoading()
      }
    },
    [
      checkStorageQuotaAndPrepare,
      showLoading,
      hideLoading,
      cleanupOrphanedAttachments,
      t,
    ]
  )

  // Update attachment caption
  const updateAttachmentCaption = React.useCallback(
    async (id: string, caption: string) => {
      if (!id) return

      // 1. Update in IndexedDB store
      try {
        const dbItem = await getAttachment(id)
        if (dbItem) {
          await saveAttachment({
            ...dbItem,
            caption,
          })
        }
      } catch (err) {
        console.error("Failed to update attachment caption in DB:", err)
      }

      // 2. Update in React context state
      setAttachments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, caption } : a))
      )
    },
    []
  )

  // Remove attachment
  const removeAttachment = React.useCallback(async (id: string) => {
    if (!id) return
    await dbDeleteAttachment(id)
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }, [])

  // Duplicate file/attachment
  const duplicateFile = React.useCallback(
    async (
      oldId: string,
      customId?: string,
      caption?: string
    ): Promise<AttachmentMeta | null> => {
      if (!oldId || typeof oldId !== "string" || oldId.trim() === "") {
        return null
      }
      try {
        const stored = await getAttachment(oldId.trim())
        if (!stored || !stored.blob) {
          return null
        }

        // 1. Pre-estimate storage quota
        const hasSpace = await checkStorageQuotaAndPrepare(stored.size)
        if (!hasSpace) {
          return null
        }

        const newId = customId || crypto.randomUUID()
        const mimeType = stored.mimeType || "application/octet-stream"
        const size = stored.size
        const finalCaption =
          caption !== undefined
            ? caption
            : stored.caption !== undefined
            ? stored.caption
            : newId

        const newBlob = stored.blob.slice(0, stored.blob.size, stored.blob.type)

        const meta: AttachmentMeta = {
          id: newId,
          mimeType,
          size,
          caption: finalCaption,
        }

        try {
          await saveAttachment({
            id: newId,
            mimeType,
            size,
            blob: newBlob,
            caption: finalCaption,
          })
        } catch (dbErr) {
          const cleaned = await cleanupOrphanedAttachments()
          if (cleaned > 0) {
            await saveAttachment({
              id: newId,
              mimeType,
              size,
              blob: newBlob,
              caption: finalCaption,
            })
          } else {
            setQuotaExceededAlertOpen(true)
            throw dbErr
          }
        }

        setAttachments((prev) => {
          const filtered = prev.filter((a) => a.id !== newId)
          return [...filtered, meta]
        })

        return meta
      } catch (err) {
        console.error("Failed to duplicate attachment:", err)
        return null
      }
    },
    [checkStorageQuotaAndPrepare, cleanupOrphanedAttachments]
  )

  // Export to .silic
  const exportProjectSilic = React.useCallback(
    async (customName?: string) => {
      showLoading(t("common.processing"))
      try {
        const targetFileName = (customName || fileName || "untitled").trim()
        const allStored = await getAllAttachments()

        const manifest: SilicManifest = {
          version: 1,
          fileName: targetFileName,
          exportedAt: new Date().toISOString(),
          attachments,
        }

        // Read all attachment blobs into buffers
        const attachmentBuffers: Array<{
          path: string
          buffer: ArrayBuffer
        }> = []
        const transferable: ArrayBuffer[] = []

        for (const meta of attachments) {
          const stored = allStored.find((s) => s.id === meta.id)
          if (stored && stored.blob) {
            const buf = await stored.blob.arrayBuffer()
            attachmentBuffers.push({
              path: `attachments/${meta.id}`,
              buffer: buf,
            })
            transferable.push(buf)
          }
        }

        const worker = new Worker(
          new URL("../lib/workers/zipWorker.ts", import.meta.url),
          { type: "module" }
        )

        const zipPromise = new Promise<ArrayBuffer>((resolve, reject) => {
          worker.onmessage = (e) => {
            const res = e.data
            worker.terminate()
            if (res.success && res.action === "export") {
              resolve(res.zipBuffer)
            } else {
              reject(new Error(res.error || "Export failed"))
            }
          }
          worker.onerror = (err) => {
            worker.terminate()
            reject(err)
          }

          worker.postMessage(
            {
              action: "export",
              manifestJson: JSON.stringify(manifest, null, 2),
              entitiesJson: JSON.stringify(entities, null, 2),
              connectionsJson: JSON.stringify(connections, null, 2),
              templatesJson: JSON.stringify(templates, null, 2),
              attachments: attachmentBuffers,
            },
            transferable
          )
        })

        const zipBuffer = await zipPromise
        downloadSilicFile(zipBuffer, targetFileName)

        toast.add({
          type: "success",
          title: t("common.downloadSuccess") || "Exported successfully",
          description: `${targetFileName}.silic`,
        })
      } catch (err: any) {
        console.error("Export error:", err)
        toast.add({
          type: "error",
          title: "Export failed",
          description: err?.message || String(err),
        })
      } finally {
        hideLoading()
      }
    },
    [
      attachments,
      connections,
      entities,
      fileName,
      hideLoading,
      showLoading,
      t,
      templates,
    ]
  )

  // Import from .silic
  const importProjectSilic = React.useCallback(
    async (file: File) => {
      showLoading(t("common.processing"))
      try {
        const fileBuffer = await file.arrayBuffer()

        const worker = new Worker(
          new URL("../lib/workers/zipWorker.ts", import.meta.url),
          { type: "module" }
        )

        const unzipPromise = new Promise<{
          manifestJson: string
          entitiesJson: string
          connectionsJson: string
          templatesJson: string
          attachments: Array<{ path: string; buffer: ArrayBuffer }>
        }>((resolve, reject) => {
          worker.onmessage = (e) => {
            const res = e.data
            worker.terminate()
            if (res.success && res.action === "import") {
              resolve(res)
            } else {
              reject(new Error(res.error || "Import failed"))
            }
          }
          worker.onerror = (err) => {
            worker.terminate()
            reject(err)
          }

          worker.postMessage(
            {
              action: "import",
              buffer: fileBuffer,
            },
            [fileBuffer]
          )
        })

        const result = await unzipPromise

        const manifest: SilicManifest = JSON.parse(result.manifestJson || "{}")
        const importedEntities: Entity[] = JSON.parse(
          result.entitiesJson || "[]"
        )
        const importedConnections: Connection[] = JSON.parse(
          result.connectionsJson || "[]"
        )
        const importedTemplates: Template[] = JSON.parse(
          result.templatesJson || "[]"
        )

        // Clear existing attachments in DB
        await clearAllAttachments()

        const rawAttachmentsMeta: AttachmentMeta[] = manifest.attachments || []
        const newAttachmentsMeta: AttachmentMeta[] = rawAttachmentsMeta.map(
          (m) => ({
            ...m,
            caption: m.caption || m.id,
          })
        )

        // Store attachments in IndexedDB
        for (const meta of newAttachmentsMeta) {
          const legacyMeta = meta as AttachmentMeta & {
            path?: string
            storedName?: string
          }
          const matched = result.attachments.find(
            (a) =>
              a.path === `attachments/${meta.id}` ||
              a.path.startsWith(`attachments/${meta.id}`) ||
              legacyMeta.path === a.path ||
              (legacyMeta.storedName &&
                a.path === `attachments/${legacyMeta.storedName}`)
          )
          if (matched) {
            const blob = new Blob([matched.buffer], {
              type: meta.mimeType || "application/octet-stream",
            })
            await saveAttachment({
              id: meta.id,
              mimeType: meta.mimeType,
              size: meta.size,
              blob,
              caption: meta.caption || meta.id,
            })
          }
        }

        // Set state
        const derivedName =
          manifest.fileName || file.name.replace(/\.silic$/i, "") || "untitled"
        setFileName(derivedName)
        setEntities(importedEntities)
        setConnections(importedConnections)
        setTemplates(importedTemplates)
        setAttachments(newAttachmentsMeta)

        // Persist imported project state
        await saveAppState({
          fileName: derivedName,
          entities: importedEntities,
          connections: importedConnections,
          templates: importedTemplates,
          attachments: newAttachmentsMeta,
          updatedAt: new Date().toISOString(),
        })

        toast.add({
          type: "success",
          title: t("common.uploadSuccess") || "Imported successfully",
          description: derivedName,
        })
      } catch (err: any) {
        console.error("Import error:", err)
        toast.add({
          type: "error",
          title: "Import failed",
          description: err?.message || String(err),
        })
      } finally {
        hideLoading()
      }
    },
    [hideLoading, setConnections, setEntities, setTemplates, showLoading, t]
  )

  // Clear / Purge all data in IndexedDB and reset memory state
  const clearProject = React.useCallback(async () => {
    showLoading(t("common.processing"))
    try {
      await clearAllAttachments()
      await clearAppState()
      try {
        localStorage.removeItem("silic_draft_entity")
        localStorage.removeItem("silic_draft_connection")
        localStorage.removeItem("silic_draft_template")
      } catch {
        // ignore
      }
      setFileName("Untitled")
      setEntities([])
      setConnections([])
      setTemplates([])
      setAttachments([])
      toast.add({
        type: "success",
        title: t("navbar.clear") || "Clear",
        description:
          t("common.clearSuccess") ||
          "All project data and IndexedDB cleared",
      })
    } catch (err: any) {
      console.error("Clear project error:", err)
      toast.add({
        type: "error",
        title: "Clear failed",
        description: err?.message || String(err),
      })
    } finally {
      hideLoading()
    }
  }, [hideLoading, setConnections, setEntities, setTemplates, showLoading, t])

  // New project (resets blank canvas)
  const newProject = React.useCallback(async () => {
    await clearProject()
  }, [clearProject])

  // Manual save (optional fallback)
  const saveProject = React.useCallback(async () => {
    showLoading(t("common.processing"))
    try {
      await saveAppState({
        fileName,
        entities,
        connections,
        templates,
        attachments,
        updatedAt: new Date().toISOString(),
      })
      toast.add({
        type: "success",
        title: t("navbar.save") || "Save",
        description: `${fileName} saved`,
      })
    } catch (err: any) {
      console.error("Save error:", err)
      toast.add({
        type: "error",
        title: "Save failed",
        description: err?.message || String(err),
      })
    } finally {
      hideLoading()
    }
  }, [
    attachments,
    connections,
    entities,
    fileName,
    hideLoading,
    showLoading,
    t,
    templates,
  ])

  const contextValue = React.useMemo<ProjectStorageContextType>(
    () => ({
      fileName,
      setFileName,
      attachments,
      addAttachment,
      updateAttachmentCaption,
      removeAttachment,
      duplicateFile,
      duplicateAttachment: duplicateFile,
      cleanupOrphanedAttachments,
      exportProjectSilic,
      importProjectSilic,
      newProject,
      clearProject,
      saveProject,
      showLoading,
      hideLoading,
      isLoading: loadingState.isOpen,
    }),
    [
      fileName,
      attachments,
      addAttachment,
      updateAttachmentCaption,
      removeAttachment,
      duplicateFile,
      cleanupOrphanedAttachments,
      exportProjectSilic,
      importProjectSilic,
      newProject,
      clearProject,
      saveProject,
      showLoading,
      hideLoading,
      loadingState.isOpen,
    ]
  )

  return (
    <ProjectStorageContext.Provider value={contextValue}>
      {children}
      <LoadingDialog
        open={loadingState.isOpen}
        message={loadingState.message}
      />
      <AlertDialog
        open={quotaExceededAlertOpen}
        onOpenChange={setQuotaExceededAlertOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive font-semibold">
              {t("projectStorage.quotaExceededTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("projectStorage.quotaExceededDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setQuotaExceededAlertOpen(false)}>
              {t("common.ok")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProjectStorageContext.Provider>
  )
}

export function useProjectStorage(): ProjectStorageContextType {
  const context = React.useContext(ProjectStorageContext)
  if (!context) {
    throw new Error(
      "useProjectStorage must be used within a ProjectStorageProvider"
    )
  }
  return context
}

export { useMediaUrl } from "@/lib/hooks/useMediaUrl"
