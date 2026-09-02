import * as React from "react"
import rawUseDrivePicker from "react-google-drive-picker"
import { useProjectStorage } from "./ProjectStorageContext"
import { useLang } from "./LangContext"
import { useRouter } from "./RouterContext"
import { toast } from "@/components/ui/toast"
import { copyToClipboard } from "@/lib/utils"
import {
  getGoogleAccessToken,
  setCachedGoogleAccessToken,
  downloadDriveFile,
  getDriveFileMetadata,
  saveToDrive,
  shareViewOnly,
  handleDriveState,
  createEmptySilicBuffer,
} from "@/lib/googleDrive"

// Handle CJS / ESM interop where Vite may wrap the default export in .default
const useDrivePicker = (
  typeof rawUseDrivePicker === "function"
    ? rawUseDrivePicker
    : ((rawUseDrivePicker as unknown as { default?: typeof rawUseDrivePicker })
        ?.default ?? rawUseDrivePicker)
) as typeof rawUseDrivePicker

export type ViewIdOptions = NonNullable<
  Parameters<ReturnType<typeof rawUseDrivePicker>[0]>[0]["viewId"]
>

export interface GoogleDrivePickerContextType {
  handleOpenPicker: (
    viewId?: ViewIdOptions,
    showUploadView?: boolean,
    showUploadFolders?: boolean,
    supportDrives?: boolean,
    multiselect?: boolean
  ) => void
  handleSaveToDrive: (isSaveAs?: boolean) => Promise<void>
  handleShareDrive: () => Promise<void>
  driveFileId: string | null
  setDriveFileId: (id: string | null) => void
  isDriveLoading: boolean
}

interface GooglePickerGlobal {
  google?: {
    picker?: {
      DocsView: new (viewId: unknown) => {
        setIncludeFolders: (enable: boolean) => unknown
        setSelectFolderEnabled: (enable: boolean) => unknown
        setParent: (parentId: string) => unknown
        setMimeTypes: (mimeTypes: string) => unknown
        setMode: (mode: unknown) => unknown
      }
      ViewId: {
        DOCS: unknown
        FOLDERS: unknown
      }
      DocsViewMode: {
        LIST: unknown
        GRID: unknown
      }
    }
  }
}

// Build hierarchical DocsView for opening files starting from My Drive
function buildOpenDocsView() {
  const win = (typeof window !== "undefined"
    ? window
    : undefined) as unknown as GooglePickerGlobal | undefined
  const google = win?.google
  if (!google?.picker) return null

  const view = new google.picker.DocsView(google.picker.ViewId.DOCS)
  view.setIncludeFolders(true)
  view.setParent("root")
  view.setMode(google.picker.DocsViewMode.LIST)
  return view
}

// Build hierarchical FoldersView for saving files starting from My Drive with folder selection
function buildFolderView() {
  const win = (typeof window !== "undefined"
    ? window
    : undefined) as unknown as GooglePickerGlobal | undefined
  const google = win?.google
  if (!google?.picker) return null

  const view = new google.picker.DocsView(google.picker.ViewId.FOLDERS)
  view.setIncludeFolders(true)      // Hierarchical folder tree with breadcrumbs
  view.setSelectFolderEnabled(true) // Allows selecting current folder or My Drive (root)
  view.setParent("root")            // Starts navigation at My Drive
  view.setMimeTypes("application/vnd.google-apps.folder")
  view.setMode(google.picker.DocsViewMode.LIST)
  return view
}

export const GoogleDrivePickerContext =
  React.createContext<GoogleDrivePickerContextType | null>(null)

export function GoogleDrivePickerProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { t } = useLang()
  const { navigate } = useRouter()
  const {
    driveFileId,
    setDriveFileId,
    importProjectSilic,
    generateSilicZipBuffer,
    newProject,
    showLoading,
    hideLoading,
  } = useProjectStorage()

  const [openPicker, authRes] = useDrivePicker()
  const [isDriveLoading, setIsDriveLoading] = React.useState(false)

  // Sync token from Picker auth if returned
  React.useEffect(() => {
    if (authRes?.access_token) {
      setCachedGoogleAccessToken(authRes.access_token, authRes.expires_in)
    }
  }, [authRes])

  // Handle opening file with Google Drive Picker
  const handleOpenPicker = React.useCallback(
    (
      viewId: ViewIdOptions = "DOCS",
      showUploadView = false,
      showUploadFolders = false,
      supportDrives = true,
      multiselect = false
    ) => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
      const developerKey = import.meta.env.VITE_GOOGLE_API_KEY

      if (!clientId || !developerKey) {
        toast.add({
          type: "error",
          title: "Google Drive API Error",
          description: "Missing Google API credentials in configuration.",
        })
        return
      }

      // Lưu vị trí cuộn trang hiện tại để ngăn trình duyệt tự động scroll xuống đáy khi picker chèn iframe
      const scrollX = window.scrollX || window.pageXOffset || 0
      const scrollY = window.scrollY || window.pageYOffset || 0

      let isActive = true
      const lockScroll = () => {
        if (!isActive) return
        if (window.scrollY !== scrollY || window.scrollX !== scrollX) {
          window.scrollTo({ left: scrollX, top: scrollY, behavior: "instant" })
        }
      }

      window.addEventListener("scroll", lockScroll, { passive: true })

      requestAnimationFrame(lockScroll)
      const t1 = setTimeout(lockScroll, 50)
      const t2 = setTimeout(lockScroll, 150)
      const t3 = setTimeout(lockScroll, 300)
      const t4 = setTimeout(lockScroll, 600)
      const t5 = setTimeout(lockScroll, 1200)

      const timer = setTimeout(() => {
        isActive = false
        window.removeEventListener("scroll", lockScroll)
      }, 3000)

      const cleanup = () => {
        isActive = false
        clearTimeout(timer)
        clearTimeout(t1)
        clearTimeout(t2)
        clearTimeout(t3)
        clearTimeout(t4)
        clearTimeout(t5)
        window.removeEventListener("scroll", lockScroll)
        window.scrollTo({ left: scrollX, top: scrollY, behavior: "instant" })
      }

      try {
        const openView = buildOpenDocsView()
        const customViews = openView ? [openView] : undefined

        openPicker({
          clientId,
          developerKey,
          token: authRes?.access_token || undefined,
          viewId,
          showUploadView,
          showUploadFolders,
          disableDefaultView: Boolean(customViews),
          customViews,
          supportDrives,
          multiselect,
          setOrigin: window.location.origin,
          customScopes: ["https://www.googleapis.com/auth/drive.file"],
          callbackFunction: async (data) => {
            cleanup()
            if (data.action === "cancel") {
              return
            }

            if (data.action === "picked" && data.docs && data.docs.length > 0) {
              const doc = data.docs[0]
              const fileId = doc.id
              const docName = doc.name || "project.silic"

              showLoading(
                t("googleDrive.opening") || "Đang tải tệp từ Google Drive..."
              )
              setIsDriveLoading(true)

              try {
                const token =
                  authRes?.access_token || (await getGoogleAccessToken())

                // Check if target file is in trash
                const meta = await getDriveFileMetadata(fileId, token)
                if (meta.trashed) {
                  setDriveFileId(null)
                  toast.add({
                    type: "error",
                    title:
                      t("googleDrive.trashedError") ||
                      "Tệp đã bị chuyển vào thùng rác trên Google Drive",
                    description: meta.name || docName,
                  })
                  return
                }

                const arrayBuffer = await downloadDriveFile(fileId, token)
                const file = new File([arrayBuffer], docName, {
                  type: "application/octet-stream",
                })

                await importProjectSilic(file, fileId)
                navigate("/d")

                toast.add({
                  type: "success",
                  title:
                    t("googleDrive.openSuccess") ||
                    "Đã mở file từ Google Drive",
                  description: docName,
                })
              } catch (err: unknown) {
                const errorMsg =
                  err instanceof Error ? err.message : String(err)
                console.error("Failed to download or import Drive file:", err)
                toast.add({
                  type: "error",
                  title:
                    t("googleDrive.openError") ||
                    "Không thể mở file từ Google Drive",
                  description: errorMsg,
                })
              } finally {
                setIsDriveLoading(false)
                hideLoading()
              }
            }
          },
        })
      } catch (err: unknown) {
        cleanup()
        const errorMsg = err instanceof Error ? err.message : String(err)
        console.error("Failed to open Google Drive Picker:", err)
        toast.add({
          type: "error",
          title: "Google Drive Picker Error",
          description: errorMsg,
        })
      }
    },
    [
      authRes,
      hideLoading,
      importProjectSilic,
      navigate,
      openPicker,
      setDriveFileId,
      showLoading,
      t,
    ]
  )

  // Save to Google Drive (Direct update if driveFileId exists & !isSaveAs; otherwise open Picker to choose location)
  const handleSaveToDrive = React.useCallback(
    async (isSaveAs = false) => {
      // 1. Direct Save: If document has driveFileId and user is not doing "Save As", verify not trashed and directly PATCH existing file
      if (!isSaveAs && driveFileId) {
        showLoading(t("googleDrive.saving") || "Đang lưu vào Google Drive...")
        setIsDriveLoading(true)

        let isTargetValid = false
        try {
          const token = await getGoogleAccessToken()
          const meta = await getDriveFileMetadata(driveFileId, token)

          if (meta.trashed) {
            setDriveFileId(null)
            toast.add({
              type: "warning",
              title:
                t("googleDrive.fileTrashedTitle") || "Tệp trên Drive đã bị xóa",
              description:
                t("googleDrive.fileTrashedSaveDesc") ||
                "Tệp trên Google Drive hiện đang ở trong thùng rác. Vui lòng chọn vị trí lưu mới.",
            })
          } else {
            isTargetValid = true
            const { buffer, fileName: finalFileName } =
              await generateSilicZipBuffer()
            const blob = new Blob([buffer], {
              type: "application/octet-stream",
            })

            const result = await saveToDrive(
              blob,
              finalFileName,
              token,
              driveFileId
            )

            toast.add({
              type: "success",
              title: t("googleDrive.saveSuccess") || "Đã lưu vào Google Drive",
              description: result.name || `${finalFileName}.silic`,
            })
            return
          }
        } catch (err: unknown) {
          setDriveFileId(null)
          console.warn("Direct update failed, falling back to picker:", err)
        } finally {
          setIsDriveLoading(false)
          hideLoading()
        }

        if (isTargetValid) return
      }

      // 2. Save As or First-Time Save: Open Google Drive Picker to select destination folder/location
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
      const developerKey = import.meta.env.VITE_GOOGLE_API_KEY

      if (!clientId || !developerKey) {
        toast.add({
          type: "error",
          title: "Google Drive API Error",
          description: "Missing Google API credentials in configuration.",
        })
        return
      }

      const scrollX = window.scrollX || window.pageXOffset || 0
      const scrollY = window.scrollY || window.pageYOffset || 0

      let isActive = true
      const lockScroll = () => {
        if (!isActive) return
        if (window.scrollY !== scrollY || window.scrollX !== scrollX) {
          window.scrollTo({ left: scrollX, top: scrollY, behavior: "instant" })
        }
      }

      window.addEventListener("scroll", lockScroll, { passive: true })

      requestAnimationFrame(lockScroll)
      const t1 = setTimeout(lockScroll, 50)
      const t2 = setTimeout(lockScroll, 150)
      const t3 = setTimeout(lockScroll, 300)
      const t4 = setTimeout(lockScroll, 600)
      const t5 = setTimeout(lockScroll, 1200)

      const timer = setTimeout(() => {
        isActive = false
        window.removeEventListener("scroll", lockScroll)
      }, 3000)

      const cleanup = () => {
        isActive = false
        clearTimeout(timer)
        clearTimeout(t1)
        clearTimeout(t2)
        clearTimeout(t3)
        clearTimeout(t4)
        clearTimeout(t5)
        window.removeEventListener("scroll", lockScroll)
        window.scrollTo({ left: scrollX, top: scrollY, behavior: "instant" })
      }

      try {
        const folderView = buildFolderView()
        const customViews = folderView ? [folderView] : undefined

        openPicker({
          clientId,
          developerKey,
          token: authRes?.access_token || undefined,
          viewId: "FOLDERS",
          showUploadView: false,
          showUploadFolders: false,
          disableDefaultView: Boolean(customViews),
          customViews,
          supportDrives: true,
          multiselect: false,
          setOrigin: window.location.origin,
          customScopes: ["https://www.googleapis.com/auth/drive.file"],
          callbackFunction: async (data) => {
            cleanup()
            if (data.action === "cancel") {
              return
            }

            if (data.action === "picked" && data.docs && data.docs.length > 0) {
              const pickedDoc = data.docs[0]
              const isFolder =
                pickedDoc.mimeType === "application/vnd.google-apps.folder" ||
                pickedDoc.type === "folder" ||
                (pickedDoc as unknown as { isFolder?: boolean }).isFolder === true
              const parentFolderId = isFolder ? pickedDoc.id : undefined
              const overwriteFileId =
                !isFolder && pickedDoc.id ? pickedDoc.id : undefined

              showLoading(
                t("googleDrive.saving") || "Đang lưu vào Google Drive..."
              )
              setIsDriveLoading(true)

              try {
                const token =
                  authRes?.access_token || (await getGoogleAccessToken())
                const { buffer, fileName: finalFileName } =
                  await generateSilicZipBuffer()
                const blob = new Blob([buffer], {
                  type: "application/octet-stream",
                })

                const result = await saveToDrive(
                  blob,
                  finalFileName,
                  token,
                  overwriteFileId,
                  parentFolderId
                )

                setDriveFileId(result.id)

                toast.add({
                  type: "success",
                  title: isSaveAs
                    ? t("googleDrive.saveAsSuccess") ||
                      "Đã tạo và lưu tệp mới trên Google Drive"
                    : t("googleDrive.saveSuccess") || "Đã lưu vào Google Drive",
                  description: result.name || `${finalFileName}.silic`,
                })
              } catch (err: unknown) {
                const errorMsg =
                  err instanceof Error ? err.message : String(err)
                console.error("Google Drive save error:", err)
                toast.add({
                  type: "error",
                  title:
                    t("googleDrive.saveError") ||
                    "Lưu vào Google Drive thất bại",
                  description: errorMsg,
                })
              } finally {
                setIsDriveLoading(false)
                hideLoading()
              }
            }
          },
        })
      } catch (err: unknown) {
        cleanup()
        const errorMsg = err instanceof Error ? err.message : String(err)
        console.error("Failed to open Google Drive Picker for save:", err)
        toast.add({
          type: "error",
          title: "Google Drive Picker Error",
          description: errorMsg,
        })
      }
    },
    [
      authRes,
      driveFileId,
      generateSilicZipBuffer,
      hideLoading,
      openPicker,
      setDriveFileId,
      showLoading,
      t,
    ]
  )

  // Share file on Google Drive (view-only link copied to clipboard)
  const handleShareDrive = React.useCallback(async () => {
    setIsDriveLoading(true)

    try {
      showLoading(t("googleDrive.sharing") || "Đang chuẩn bị chia sẻ...")
      const token = await getGoogleAccessToken()

      let activeFileId = driveFileId

      // Check if existing file is trashed or invalid
      if (activeFileId) {
        try {
          const meta = await getDriveFileMetadata(activeFileId, token)
          if (meta.trashed) {
            activeFileId = null
            setDriveFileId(null)
          }
        } catch {
          activeFileId = null
          setDriveFileId(null)
        }
      }

      // If document has not been saved to Drive yet (or was in trash), automatically upload fresh copy first
      if (!activeFileId) {
        showLoading(
          t("googleDrive.savingBeforeShare") ||
            "Đang lưu lên Drive trước khi chia sẻ..."
        )
        const { buffer, fileName: finalFileName } =
          await generateSilicZipBuffer()
        const blob = new Blob([buffer], { type: "application/octet-stream" })
        const res = await saveToDrive(blob, finalFileName, token)
        setDriveFileId(res.id)
        activeFileId = res.id
      }

      showLoading(
        t("googleDrive.configuringPermissions") ||
          "Đang thiết lập quyền chia sẻ..."
      )
      await shareViewOnly(activeFileId, token)

      const shareUrl = `https://drive.google.com/file/d/${activeFileId}/view?usp=sharing`
      const copied = await copyToClipboard(shareUrl)

      if (copied) {
        toast.add({
          type: "success",
          title:
            t("googleDrive.shareSuccess") || "Đã sao chép liên kết chia sẻ",
          description:
            t("googleDrive.shareSuccessDesc") ||
            "Bất kỳ ai có liên kết đều có thể xem tệp này (Chỉ xem).",
        })
      } else {
        toast.add({
          type: "success",
          title: t("googleDrive.shareCreated") || "Đã tạo liên kết chia sẻ",
          description: shareUrl,
        })
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      console.error("Google Drive share error:", err)
      toast.add({
        type: "error",
        title:
          t("googleDrive.shareError") || "Không thể chia sẻ tệp Google Drive",
        description: errorMsg,
      })
    } finally {
      setIsDriveLoading(false)
      hideLoading()
    }
  }, [
    driveFileId,
    generateSilicZipBuffer,
    hideLoading,
    setDriveFileId,
    showLoading,
    t,
  ])

  // Handle Google Drive "Open with Silic" or "Create with Silic" URL state param on mount
  React.useEffect(() => {
    const driveState = handleDriveState()
    if (!driveState) return

    // Clean URL state param to prevent re-opening on reload and ensure we are on /d
    try {
      const url = new URL(window.location.href)
      url.searchParams.delete("state")
      const targetPath =
        url.pathname === "/" || url.pathname === "" ? "/d" : url.pathname
      const newSearch = url.searchParams.toString()
        ? `?${url.searchParams.toString()}`
        : ""
      window.history.replaceState({}, document.title, targetPath + newSearch)
    } catch {
      // ignore
    }

    if (driveState.action === "open") {
      loadDriveFile(driveState.fileId)
    } else if (driveState.action === "create") {
      createDriveFile(driveState.folderId)
    }

    async function loadDriveFile(targetFileId: string) {
      showLoading(t("googleDrive.opening") || "Đang tải tệp từ Google Drive...")
      setIsDriveLoading(true)

      try {
        const token = await getGoogleAccessToken()

        // Check if target file is in trash
        const meta = await getDriveFileMetadata(targetFileId, token)
        if (meta.trashed) {
          setDriveFileId(null)
          toast.add({
            type: "error",
            title:
              t("googleDrive.trashedError") ||
              "Tệp đã bị chuyển vào thùng rác trên Google Drive",
            description: meta.name || "drive-project.silic",
          })
          return
        }

        const buffer = await downloadDriveFile(targetFileId, token)
        const file = new File([buffer], meta.name || "drive-project.silic", {
          type: "application/octet-stream",
        })

        await importProjectSilic(file, targetFileId)
        navigate("/d")

        toast.add({
          type: "success",
          title: t("googleDrive.openSuccess") || "Đã mở file từ Google Drive",
          description: meta.name || "drive-project.silic",
        })
      } catch (err: unknown) {
        setDriveFileId(null)
        const errorMsg = err instanceof Error ? err.message : String(err)
        console.error("Failed to load file from Drive open state:", err)
        toast.add({
          type: "error",
          title:
            t("googleDrive.openError") || "Không thể mở file từ Google Drive",
          description: errorMsg,
        })
      } finally {
        setIsDriveLoading(false)
        hideLoading()
      }
    }

    async function createDriveFile(folderId: string) {
      showLoading(
        t("googleDrive.creating") || "Đang tạo tệp trên Google Drive..."
      )
      setIsDriveLoading(true)

      try {
        const token = await getGoogleAccessToken()

        // Reset workspace to blank canvas
        await newProject()

        const defaultName = "Untitled.silic"
        const emptyBuffer = createEmptySilicBuffer("Untitled")
        const blob = new Blob([emptyBuffer], {
          type: "application/octet-stream",
        })

        const res = await saveToDrive(
          blob,
          defaultName,
          token,
          undefined,
          folderId
        )

        if (res.id) {
          setDriveFileId(res.id)
        }
        navigate("/d")

        toast.add({
          type: "success",
          title:
            t("googleDrive.createSuccess") ||
            "Đã tạo tệp mới trên Google Drive",
          description: res.name || defaultName,
        })
      } catch (err: unknown) {
        setDriveFileId(null)
        const errorMsg = err instanceof Error ? err.message : String(err)
        console.error("Failed to create file on Drive:", err)
        toast.add({
          type: "error",
          title:
            t("googleDrive.createError") ||
            "Không thể tạo tệp trên Google Drive",
          description: errorMsg,
        })
      } finally {
        setIsDriveLoading(false)
        hideLoading()
      }
    }
  }, [
    hideLoading,
    importProjectSilic,
    navigate,
    newProject,
    setDriveFileId,
    showLoading,
    t,
  ])

  const contextValue = React.useMemo<GoogleDrivePickerContextType>(
    () => ({
      handleOpenPicker,
      handleSaveToDrive,
      handleShareDrive,
      driveFileId,
      setDriveFileId,
      isDriveLoading,
    }),
    [
      handleOpenPicker,
      handleSaveToDrive,
      handleShareDrive,
      driveFileId,
      setDriveFileId,
      isDriveLoading,
    ]
  )

  return (
    <GoogleDrivePickerContext.Provider value={contextValue}>
      {children}
    </GoogleDrivePickerContext.Provider>
  )
}

export function useGoogleDrivePicker(): GoogleDrivePickerContextType {
  const context = React.useContext(GoogleDrivePickerContext)
  if (!context) {
    throw new Error(
      "useGoogleDrivePicker must be used within a GoogleDrivePickerProvider"
    )
  }
  return context
}

export default useGoogleDrivePicker
