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
  DriveApiError,
  type DriveStateAction,
} from "@/lib/googleDrive"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
  const [pendingDriveAction, setPendingDriveAction] =
    React.useState<DriveStateAction | null>(null)

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
          title: "Google Drive Error",
          description:
            "Missing VITE_GOOGLE_CLIENT_ID or VITE_GOOGLE_API_KEY in environment variables",
        })
        return
      }

      const isDefaultDocsView = viewId === "DOCS" && !showUploadFolders
      const customOpenDocsView = isDefaultDocsView ? buildOpenDocsView() : null

      const isDefaultFolderView = viewId === "FOLDERS" && showUploadFolders
      const customFolderView = isDefaultFolderView ? buildFolderView() : null

      const customViews = [
        customOpenDocsView,
        customFolderView,
      ].filter(Boolean) as unknown[]

      const cleanup = () => {
        setIsDriveLoading(false)
        hideLoading()
      }

      try {
        openPicker({
          clientId,
          developerKey,
          token: authRes?.access_token || undefined,
          viewId,
          showUploadView,
          showUploadFolders,
          supportDrives,
          multiselect,
          customViews: customViews.length > 0 ? (customViews as any) : undefined,
          setSelectFolderEnabled: showUploadFolders,
          setIncludeFolders: true,
          setOrigin: window.location.origin,
          customScopes: ["https://www.googleapis.com/auth/drive.file"],
          callbackFunction: async (data: any) => {
            if (data.action === "cancel") {
              cleanup()
              return
            }

            if (data.action === "loaded") {
              return
            }

            if (data.action === "picked" && data.docs && data.docs.length > 0) {
              const doc = data.docs[0]
              const fileId = doc.id
              const docName = doc.name || "project.silic"
              const resourceKey = doc.resourceKey || undefined

              showLoading(
                t("googleDrive.opening") || "Đang tải tệp từ Google Drive..."
              )
              setIsDriveLoading(true)

              try {
                const token =
                  authRes?.access_token || (await getGoogleAccessToken())

                // Check if target file is in trash
                const meta = await getDriveFileMetadata(
                  fileId,
                  token,
                  resourceKey
                )
                if (meta.trashed || meta.explicitlyTrashed) {
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

                const arrayBuffer = await downloadDriveFile(
                  fileId,
                  token,
                  resourceKey
                )
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
                if (err instanceof DriveApiError && err.status === 403) {
                  toast.add({
                    type: "error",
                    title:
                      t("googleDrive.forbiddenError") ||
                      "Không có quyền truy cập tệp",
                    description:
                      t("googleDrive.forbiddenErrorDesc") ||
                      "Tài khoản Google hiện tại không có quyền truy cập tệp này.",
                  })
                } else if (err instanceof DriveApiError && err.status === 404) {
                  toast.add({
                    type: "error",
                    title:
                      t("googleDrive.notFoundError") ||
                      "Không tìm thấy tệp trên Google Drive",
                    description:
                      t("googleDrive.notFoundErrorDesc") ||
                      "Tệp có thể đã bị xóa vĩnh viễn.",
                  })
                } else {
                  toast.add({
                    type: "error",
                    title:
                      t("googleDrive.openError") ||
                      "Không thể mở file từ Google Drive",
                    description: errorMsg,
                  })
                }
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

  // Save to Google Drive
  const handleSaveToDrive = React.useCallback(
    async (isSaveAs = false) => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
      const developerKey = import.meta.env.VITE_GOOGLE_API_KEY

      if (!clientId || !developerKey) {
        toast.add({
          type: "error",
          title: "Google Drive Error",
          description:
            "Missing VITE_GOOGLE_CLIENT_ID or VITE_GOOGLE_API_KEY in environment variables",
        })
        return
      }

      if (!isSaveAs && driveFileId) {
        showLoading(t("googleDrive.saving") || "Đang lưu vào Google Drive...")
        setIsDriveLoading(true)

        try {
          const token = await getGoogleAccessToken()

          // Check if file is currently trashed on Drive
          try {
            const meta = await getDriveFileMetadata(driveFileId, token)
            if (meta.trashed || meta.explicitlyTrashed) {
              setDriveFileId(null)
              toast.add({
                type: "error",
                title:
                  t("googleDrive.fileTrashedTitle") ||
                  "Tệp trên Drive đã bị xóa",
                description:
                  t("googleDrive.fileTrashedSaveDesc") ||
                  "Tệp trên Google Drive hiện đang ở trong thùng rác. Vui lòng chọn vị trí lưu mới.",
              })
              handleSaveToDrive(true)
              return
            }
          } catch {
            // If metadata check fails with 404, file was permanently deleted
            setDriveFileId(null)
            handleSaveToDrive(true)
            return
          }

          const { buffer, fileName: projectName } =
            await generateSilicZipBuffer()
          const blob = new Blob([buffer], {
            type: "application/octet-stream",
          })

          await saveToDrive(blob, projectName, token, driveFileId)

          toast.add({
            type: "success",
            title: t("googleDrive.saveSuccess") || "Đã lưu vào Google Drive",
            description: `${projectName}.silic`,
          })
        } catch (err: unknown) {
          const errorMsg = err instanceof Error ? err.message : String(err)
          console.error("Failed to save to Google Drive:", err)
          toast.add({
            type: "error",
            title:
              t("googleDrive.saveError") || "Lưu vào Google Drive thất bại",
            description: errorMsg,
          })
        } finally {
          setIsDriveLoading(false)
          hideLoading()
        }
        return
      }

      // "Save As" flow or initial save
      const customFolderView = buildFolderView()
      const customViews = [customFolderView].filter(Boolean) as unknown[]

      const cleanup = () => {
        setIsDriveLoading(false)
        hideLoading()
      }

      try {
        openPicker({
          clientId,
          developerKey,
          token: authRes?.access_token || undefined,
          viewId: "FOLDERS",
          showUploadView: false,
          showUploadFolders: true,
          supportDrives: true,
          multiselect: false,
          customViews: customViews.length > 0 ? (customViews as any) : undefined,
          setSelectFolderEnabled: true,
          setIncludeFolders: true,
          setOrigin: window.location.origin,
          customScopes: ["https://www.googleapis.com/auth/drive.file"],
          callbackFunction: async (data: any) => {
            if (data.action === "cancel") {
              cleanup()
              return
            }

            if (data.action === "loaded") {
              return
            }

            if (data.action === "picked" && data.docs && data.docs.length > 0) {
              const selectedFolder = data.docs[0]
              const parentFolderId = selectedFolder.id || "root"
              const folderResourceKey = selectedFolder.resourceKey || undefined

              showLoading(
                t("googleDrive.saving") || "Đang lưu vào Google Drive..."
              )
              setIsDriveLoading(true)

              try {
                const token =
                  authRes?.access_token || (await getGoogleAccessToken())
                const { buffer, fileName: projectName } =
                  await generateSilicZipBuffer()
                const blob = new Blob([buffer], {
                  type: "application/octet-stream",
                })

                const res = await saveToDrive(
                  blob,
                  projectName,
                  token,
                  undefined,
                  parentFolderId,
                  folderResourceKey
                )

                if (res.id) {
                  setDriveFileId(res.id)
                }

                toast.add({
                  type: "success",
                  title: isSaveAs
                    ? t("googleDrive.saveAsSuccess") ||
                      "Đã tạo và lưu tệp mới trên Google Drive"
                    : t("googleDrive.saveSuccess") ||
                      "Đã lưu vào Google Drive",
                  description: `${projectName}.silic`,
                })
              } catch (err: unknown) {
                const errorMsg =
                  err instanceof Error ? err.message : String(err)
                console.error("Failed to save as to Google Drive:", err)
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
        console.error("Failed to open Folder Picker for Save As:", err)
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
    showLoading(t("googleDrive.sharing") || "Đang chuẩn bị chia sẻ...")
    setIsDriveLoading(true)

    try {
      const token = await getGoogleAccessToken()
      let currentFileId = driveFileId

      if (!currentFileId) {
        showLoading(
          t("googleDrive.savingBeforeShare") ||
            "Đang lưu lên Google Drive trước khi chia sẻ..."
        )
        const { buffer, fileName: projectName } = await generateSilicZipBuffer()
        const blob = new Blob([buffer], {
          type: "application/octet-stream",
        })

        const res = await saveToDrive(blob, projectName, token)
        if (res.id) {
          currentFileId = res.id
          setDriveFileId(res.id)
        } else {
          throw new Error("Failed to create file on Google Drive for sharing")
        }
      }

      showLoading(
        t("googleDrive.configuringPermissions") ||
          "Đang thiết lập quyền chia sẻ..."
      )

      await shareViewOnly(currentFileId, token)

      const shareLink = `https://drive.google.com/file/d/${currentFileId}/view?usp=sharing`
      const copied = await copyToClipboard(shareLink)

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
          type: "info",
          title: t("googleDrive.shareCreated") || "Đã tạo liên kết chia sẻ",
          description: shareLink,
        })
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      console.error("Failed to share Google Drive file:", err)
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

  // Execute drive action (open or create)
  const executeDriveAction = React.useCallback(
    async (driveState: DriveStateAction, isUserGesture = false) => {
      if (driveState.action === "open") {
        showLoading(t("googleDrive.opening") || "Đang tải tệp từ Google Drive...")
      } else {
        showLoading(
          t("googleDrive.creating") || "Đang tạo tệp trên Google Drive..."
        )
      }
      setIsDriveLoading(true)

      try {
        // First try silent auth or use user gesture
        let token: string
        try {
          token = await getGoogleAccessToken({
            prompt: isUserGesture ? "consent" : "",
            hint: driveState.userId,
          })
        } catch (authErr) {
          if (!isUserGesture) {
            // Silent auth failed -> avoid blocking popup, prompt user to click
            setIsDriveLoading(false)
            hideLoading()
            setPendingDriveAction(driveState)
            return
          }
          throw authErr
        }

        if (driveState.action === "open") {
          // Check if target file is in trash
          const meta = await getDriveFileMetadata(
            driveState.fileId,
            token,
            driveState.resourceKey
          )
          if (meta.trashed || meta.explicitlyTrashed) {
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

          const buffer = await downloadDriveFile(
            driveState.fileId,
            token,
            driveState.resourceKey
          )
          const file = new File([buffer], meta.name || "drive-project.silic", {
            type: "application/octet-stream",
          })

          try {
            await importProjectSilic(file, driveState.fileId)
          } catch (importErr: unknown) {
            const importMsg =
              importErr instanceof Error ? importErr.message : String(importErr)
            toast.add({
              type: "error",
              title:
                t("googleDrive.corruptError") || "Tệp .silic không hợp lệ",
              description:
                importMsg ||
                t("googleDrive.corruptErrorDesc") ||
                "Không thể đọc cấu trúc tệp .silic.",
            })
            return
          }

          navigate("/d")

          toast.add({
            type: "success",
            title: t("googleDrive.openSuccess") || "Đã mở file từ Google Drive",
            description: meta.name || "drive-project.silic",
          })
        } else if (driveState.action === "create") {
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
            driveState.folderId,
            driveState.folderResourceKey
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
        }
      } catch (err: unknown) {
        setDriveFileId(null)
        const errorMsg = err instanceof Error ? err.message : String(err)
        console.error("Failed to execute Drive action:", err)

        if (err instanceof DriveApiError && err.status === 403) {
          toast.add({
            type: "error",
            title:
              t("googleDrive.forbiddenError") ||
              "Không có quyền truy cập tệp",
            description:
              t("googleDrive.forbiddenErrorDesc") ||
              "Tài khoản Google hiện tại không có quyền truy cập tệp này.",
          })
        } else if (err instanceof DriveApiError && err.status === 404) {
          toast.add({
            type: "error",
            title:
              t("googleDrive.notFoundError") ||
              "Không tìm thấy tệp trên Google Drive",
            description:
              t("googleDrive.notFoundErrorDesc") ||
              "Tệp có thể đã bị xóa vĩnh viễn hoặc liên kết không hợp lệ.",
          })
        } else if (err instanceof DriveApiError && err.status === 401) {
          toast.add({
            type: "error",
            title:
              t("googleDrive.authCancelled") || "Đã hủy đăng nhập Google Drive",
            description: errorMsg,
          })
        } else {
          toast.add({
            type: "error",
            title:
              driveState.action === "create"
                ? t("googleDrive.createError") ||
                  "Không thể tạo tệp trên Google Drive"
                : t("googleDrive.openError") ||
                  "Không thể mở file từ Google Drive",
            description: errorMsg,
          })
        }
      } finally {
        setIsDriveLoading(false)
        hideLoading()
      }
    },
    [
      hideLoading,
      importProjectSilic,
      navigate,
      newProject,
      setDriveFileId,
      showLoading,
      t,
    ]
  )

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

    executeDriveAction(driveState, false)
  }, [executeDriveAction])

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

      {/* Google Sign-in Prompt Dialog when silent auth requires user activation */}
      <AlertDialog
        open={!!pendingDriveAction}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDriveAction(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("googleDrive.authRequiredTitle") ||
                "Yêu cầu đăng nhập Google"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("googleDrive.authRequiredDesc") ||
                "Vui lòng đăng nhập tài khoản Google Drive để tiếp tục thao tác với tệp tin."}
              {pendingDriveAction?.userId && (
                <span className="mt-2 block text-xs text-muted-foreground">
                  {t("googleDrive.authRequiredHint", {
                    userId: pendingDriveAction.userId,
                  }) || `Tài khoản Google Drive: ${pendingDriveAction.userId}`}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setPendingDriveAction(null)
                toast.add({
                  type: "info",
                  title:
                    t("googleDrive.authCancelled") ||
                    "Đã hủy đăng nhập Google Drive",
                })
              }}
            >
              {t("common.cancel") || "Hủy"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                const actionToRun = pendingDriveAction
                setPendingDriveAction(null)
                if (actionToRun) {
                  await executeDriveAction(actionToRun, true)
                }
              }}
            >
              {t("googleDrive.signInButton") || "Đăng nhập Google"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
