/* eslint-disable react-refresh/only-export-components */
import * as React from "react"
import {
  HardDrive,
  FolderOpen,
  FolderPlus,
  Folder,
  ArrowLeft,
} from "lucide-react"
import useDrivePicker, {
  type ViewIdOptions,
  type PickerCallback,
} from "@/hooks/useDrivePicker"
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
  createDriveFolder,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
  view.setIncludeFolders(true) // Hierarchical folder tree with breadcrumbs
  view.setSelectFolderEnabled(true) // Allows selecting current folder or My Drive (root)
  view.setParent("root") // Starts navigation at My Drive
  view.setMimeTypes("application/vnd.google-apps.folder")
  view.setMode(google.picker.DocsViewMode.LIST)
  return view
}

interface SaveLocationDialogState {
  isOpen: boolean
  isSaveAs: boolean
  pendingShareAfterSave: boolean
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
    fileName,
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

  // Save location choice dialog state
  const [saveLocationDialog, setSaveLocationDialog] =
    React.useState<SaveLocationDialogState | null>(null)
  const [isNewFolderStep, setIsNewFolderStep] = React.useState(false)
  const [newFolderName, setNewFolderName] = React.useState("")
  const [parentFolder, setParentFolder] = React.useState<{
    id: string
    name: string
    resourceKey?: string
  } | null>(null)

  // Sync token from Picker auth if returned
  React.useEffect(() => {
    if (authRes?.access_token) {
      setCachedGoogleAccessToken(authRes.access_token, authRes.expires_in)
    }
  }, [authRes])

  // Execute view-only file share on Google Drive
  const executeShareFlow = React.useCallback(
    async (fileId: string, token: string) => {
      showLoading(
        t("googleDrive.configuringPermissions") ||
          "Đang thiết lập quyền chia sẻ..."
      )
      setIsDriveLoading(true)

      try {
        await shareViewOnly(fileId, token)

        const shareLink = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`
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
        console.error("Failed to share Google Drive™ file:", err)
        toast.add({
          type: "error",
          title:
            t("googleDrive.shareError") ||
            "Không thể chia sẻ tệp Google Drive™",
          description: errorMsg,
        })
      } finally {
        setIsDriveLoading(false)
        hideLoading()
      }
    },
    [hideLoading, showLoading, t]
  )

  // Open Save Location Dialog
  const openSaveLocationDialog = React.useCallback(
    (isSaveAs = false, pendingShareAfterSave = false) => {
      setIsNewFolderStep(false)
      setNewFolderName(fileName || "Silic Projects")
      setParentFolder(null)
      setSaveLocationDialog({
        isOpen: true,
        isSaveAs,
        pendingShareAfterSave,
      })
    },
    [fileName]
  )

  // Close Save Location Dialog
  const closeSaveLocationDialog = React.useCallback(() => {
    setSaveLocationDialog(null)
    setIsNewFolderStep(false)
    setParentFolder(null)
  }, [])

  // Core helper to save file to a specific destination folder
  const performSaveToLocation = React.useCallback(
    async (options: {
      parentFolderId?: string
      folderResourceKey?: string
      isSaveAs?: boolean
      pendingShare?: boolean
      customSuccessTitle?: string
    }) => {
      const {
        parentFolderId = "root",
        folderResourceKey,
        isSaveAs = false,
        pendingShare = false,
        customSuccessTitle,
      } = options

      showLoading(t("googleDrive.saving") || "Đang lưu vào Google Drive™...")
      setIsDriveLoading(true)

      try {
        const token = authRes?.access_token || (await getGoogleAccessToken())
        const { buffer, fileName: projectName } = await generateSilicZipBuffer()
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
          title:
            customSuccessTitle ||
            (isSaveAs
              ? t("googleDrive.saveAsSuccess") ||
                "Đã tạo và lưu tệp mới trên Google Drive™"
              : t("googleDrive.saveSuccess") || "Đã lưu vào Google Drive™"),
          description: `${projectName}.silic`,
        })

        // If user initiated share flow prior to saving, continue share immediately
        if (pendingShare && res.id) {
          await executeShareFlow(res.id, token)
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        console.error("Failed to save to Google Drive™:", err)
        toast.add({
          type: "error",
          title: t("googleDrive.saveError") || "Lưu vào Google Drive™ thất bại",
          description: errorMsg,
        })
      } finally {
        setIsDriveLoading(false)
        hideLoading()
      }
    },
    [
      authRes,
      executeShareFlow,
      generateSilicZipBuffer,
      hideLoading,
      setDriveFileId,
      showLoading,
      t,
    ]
  )

  // Open Google Drive Picker to select an existing folder
  const openPickerForExistingFolder = React.useCallback(
    (isSaveAs: boolean, pendingShare: boolean) => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
      const developerKey = import.meta.env.VITE_GOOGLE_API_KEY

      if (!clientId || !developerKey) {
        toast.add({
          type: "error",
          title: "Google Drive™ Error",
          description:
            "Missing VITE_GOOGLE_CLIENT_ID or VITE_GOOGLE_API_KEY in environment variables",
        })
        return
      }

      const customFolderView = buildFolderView()
      const customViews = [customFolderView].filter(Boolean) as unknown[]

      const cleanup = () => {
        setIsDriveLoading(false)
        hideLoading()
      }

      try {
        openPicker({
          title: "Select a folder",
          clientId,
          developerKey,
          token: authRes?.access_token || undefined,
          viewId: "FOLDERS",
          showUploadView: false,
          showUploadFolders: true,
          supportDrives: true,
          multiselect: false,
          customViews:
            customViews.length > 0 ? (customViews as unknown[]) : undefined,
          disableDefaultView: true,
          setSelectFolderEnabled: true,
          setIncludeFolders: true,
          setOrigin: window.location.origin,
          customScopes: ["https://www.googleapis.com/auth/drive.file"],
          callbackFunction: async (data: PickerCallback) => {
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

              await performSaveToLocation({
                parentFolderId,
                folderResourceKey,
                isSaveAs,
                pendingShare,
              })
            }
          },
        })
      } catch (err: unknown) {
        cleanup()
        const errorMsg = err instanceof Error ? err.message : String(err)
        console.error("Failed to open Folder Picker for Existing Folder:", err)
        toast.add({
          type: "error",
          title: "Google Drive™ Picker Error",
          description: errorMsg,
        })
      }
    },
    [authRes, hideLoading, openPicker, performSaveToLocation]
  )

  // Open Google Drive Picker to select parent location when creating a new folder
  const openPickerForParentFolder = React.useCallback(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    const developerKey = import.meta.env.VITE_GOOGLE_API_KEY

    if (!clientId || !developerKey) {
      toast.add({
        type: "error",
        title: "Google Drive™ Error",
        description:
          "Missing VITE_GOOGLE_CLIENT_ID or VITE_GOOGLE_API_KEY in environment variables",
      })
      return
    }

    const customFolderView = buildFolderView()
    const customViews = [customFolderView].filter(Boolean) as unknown[]

    try {
      openPicker({
        title: "Select a folder",
        clientId,
        developerKey,
        token: authRes?.access_token || undefined,
        viewId: "FOLDERS",
        showUploadView: false,
        showUploadFolders: true,
        supportDrives: true,
        multiselect: false,
        customViews:
          customViews.length > 0 ? (customViews as unknown[]) : undefined,
        disableDefaultView: true,
        setSelectFolderEnabled: true,
        setIncludeFolders: true,
        setOrigin: window.location.origin,
        customScopes: ["https://www.googleapis.com/auth/drive.file"],
        callbackFunction: async (data: PickerCallback) => {
          if (data.action === "picked" && data.docs && data.docs.length > 0) {
            const doc = data.docs[0]
            setParentFolder({
              id: doc.id || "root",
              name: doc.name || "My Drive",
              resourceKey: doc.resourceKey || undefined,
            })
          }
        },
      })
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      console.error("Failed to open Parent Folder Picker:", err)
      toast.add({
        type: "error",
        title: "Google Drive™ Picker Error",
        description: errorMsg,
      })
    }
  }, [authRes, openPicker])

  // Handle creating a new folder and saving file inside it
  const handleCreateFolderAndSave = React.useCallback(async () => {
    const folderNameToCreate =
      newFolderName.trim() || fileName || "Silic Projects"
    const isSaveAs = saveLocationDialog?.isSaveAs ?? false
    const pendingShare = saveLocationDialog?.pendingShareAfterSave ?? false

    closeSaveLocationDialog()

    showLoading(
      t("googleDrive.creatingFolder") ||
        "Đang tạo thư mục trên Google Drive™..."
    )
    setIsDriveLoading(true)

    try {
      const token = authRes?.access_token || (await getGoogleAccessToken())
      const createdFolder = await createDriveFolder(
        folderNameToCreate,
        token,
        parentFolder?.id || "root",
        parentFolder?.resourceKey
      )

      await performSaveToLocation({
        parentFolderId: createdFolder.id,
        isSaveAs,
        pendingShare,
        customSuccessTitle: isSaveAs
          ? t("googleDrive.saveAsSuccess") ||
            "Đã tạo và lưu tệp mới trên Google Drive™"
          : t("googleDrive.saveSuccess") || "Đã lưu vào Google Drive™",
      })
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      console.error("Failed to create folder on Google Drive™:", err)
      toast.add({
        type: "error",
        title:
          t("googleDrive.createFolderError") ||
          "Không thể tạo thư mục trên Google Drive™",
        description: errorMsg,
      })
    } finally {
      setIsDriveLoading(false)
      hideLoading()
    }
  }, [
    authRes,
    closeSaveLocationDialog,
    fileName,
    hideLoading,
    newFolderName,
    parentFolder,
    performSaveToLocation,
    saveLocationDialog,
    showLoading,
    t,
  ])

  // Handle opening file with Google Drive™ Picker
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
          title: "Google Drive™ Error",
          description:
            "Missing VITE_GOOGLE_CLIENT_ID or VITE_GOOGLE_API_KEY in environment variables",
        })
        return
      }

      const isDefaultDocsView = viewId === "DOCS" && !showUploadFolders
      const customOpenDocsView = isDefaultDocsView ? buildOpenDocsView() : null

      const isDefaultFolderView = viewId === "FOLDERS" && showUploadFolders
      const customFolderView = isDefaultFolderView ? buildFolderView() : null

      const customViews = [customOpenDocsView, customFolderView].filter(
        Boolean
      ) as unknown[]

      const cleanup = () => {
        setIsDriveLoading(false)
        hideLoading()
      }

      try {
        openPicker({
          title:
            showUploadFolders || viewId === "FOLDERS"
              ? "Select a folder"
              : undefined,
          clientId,
          developerKey,
          token: authRes?.access_token || undefined,
          viewId,
          showUploadView,
          showUploadFolders,
          supportDrives,
          multiselect,
          customViews:
            customViews.length > 0 ? (customViews as unknown[]) : undefined,
          disableDefaultView: customViews.length > 0,
          setSelectFolderEnabled: showUploadFolders,
          setIncludeFolders: true,
          setOrigin: window.location.origin,
          customScopes: ["https://www.googleapis.com/auth/drive.file"],
          callbackFunction: async (data: PickerCallback) => {
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
                t("googleDrive.opening") || "Đang tải tệp từ Google Drive™..."
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
                      "Tệp đã bị chuyển vào thùng rác trên Google Drive™",
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
                    "Đã mở file từ Google Drive™",
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
                      "Không tìm thấy tệp trên Google Drive™",
                    description:
                      t("googleDrive.notFoundErrorDesc") ||
                      "Tệp có thể đã bị xóa vĩnh viễn.",
                  })
                } else {
                  toast.add({
                    type: "error",
                    title:
                      t("googleDrive.openError") ||
                      "Không thể mở file từ Google Drive™",
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
        console.error("Failed to open Google Drive™ Picker:", err)
        toast.add({
          type: "error",
          title: "Google Drive™ Picker Error",
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

  // Save to Google Drive™ (handles direct save vs 3-option modal)
  const handleSaveToDrive = React.useCallback(
    async (isSaveAs = false) => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
      const developerKey = import.meta.env.VITE_GOOGLE_API_KEY

      if (!clientId || !developerKey) {
        toast.add({
          type: "error",
          title: "Google Drive™ Error",
          description:
            "Missing VITE_GOOGLE_CLIENT_ID or VITE_GOOGLE_API_KEY in environment variables",
        })
        return
      }

      // Direct save when file is already linked to Google Drive and not Save As
      if (!isSaveAs && driveFileId) {
        showLoading(t("googleDrive.saving") || "Đang lưu vào Google Drive™...")
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
                  "Tệp trên Google Drive™ hiện đang ở trong thùng rác. Vui lòng chọn vị trí lưu mới.",
              })
              openSaveLocationDialog(true, false)
              return
            }
          } catch {
            // If metadata check fails with 404, file was permanently deleted
            setDriveFileId(null)
            openSaveLocationDialog(true, false)
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
            title: t("googleDrive.saveSuccess") || "Đã lưu vào Google Drive™",
            description: `${projectName}.silic`,
          })
        } catch (err: unknown) {
          const errorMsg = err instanceof Error ? err.message : String(err)
          console.error("Failed to save to Google Drive™:", err)
          toast.add({
            type: "error",
            title:
              t("googleDrive.saveError") || "Lưu vào Google Drive™ thất bại",
            description: errorMsg,
          })
        } finally {
          setIsDriveLoading(false)
          hideLoading()
        }
        return
      }

      // First-time save or Save As: open dialog for 3 options
      openSaveLocationDialog(isSaveAs, false)
    },
    [
      driveFileId,
      generateSilicZipBuffer,
      hideLoading,
      openSaveLocationDialog,
      setDriveFileId,
      showLoading,
      t,
    ]
  )

  // Share file on Google Drive™ (view-only link copied to clipboard)
  const handleShareDrive = React.useCallback(async () => {
    // If not saved yet, prompt Save Location flow first then share automatically
    if (!driveFileId) {
      openSaveLocationDialog(false, true)
      return
    }

    showLoading(t("googleDrive.sharing") || "Đang chuẩn bị chia sẻ...")
    setIsDriveLoading(true)

    try {
      const token = await getGoogleAccessToken()
      await executeShareFlow(driveFileId, token)
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      console.error("Failed to share Google Drive™ file:", err)
      toast.add({
        type: "error",
        title:
          t("googleDrive.shareError") || "Không thể chia sẻ tệp Google Drive™",
        description: errorMsg,
      })
    } finally {
      setIsDriveLoading(false)
      hideLoading()
    }
  }, [
    driveFileId,
    executeShareFlow,
    hideLoading,
    openSaveLocationDialog,
    showLoading,
    t,
  ])

  // Execute drive action (open or create from URL state parameter)
  const executeDriveAction = React.useCallback(
    async (driveState: DriveStateAction, isUserGesture = false) => {
      if (driveState.action === "open") {
        showLoading(
          t("googleDrive.opening") || "Đang tải tệp từ Google Drive™..."
        )
      } else {
        showLoading(
          t("googleDrive.creating") || "Đang tạo tệp trên Google Drive™..."
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
                "Tệp đã bị chuyển vào thùng rác trên Google Drive™",
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
              title: t("googleDrive.corruptError") || "Tệp .silic không hợp lệ",
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
            title:
              t("googleDrive.openSuccess") || "Đã mở file từ Google Drive™",
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
              "Đã tạo tệp mới trên Google Drive™",
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
              t("googleDrive.forbiddenError") || "Không có quyền truy cập tệp",
            description:
              t("googleDrive.forbiddenErrorDesc") ||
              "Tài khoản Google hiện tại không có quyền truy cập tệp này.",
          })
        } else if (err instanceof DriveApiError && err.status === 404) {
          toast.add({
            type: "error",
            title:
              t("googleDrive.notFoundError") ||
              "Không tìm thấy tệp trên Google Drive™",
            description:
              t("googleDrive.notFoundErrorDesc") ||
              "Tệp có thể đã bị xóa vĩnh viễn hoặc liên kết không hợp lệ.",
          })
        } else if (err instanceof DriveApiError && err.status === 401) {
          toast.add({
            type: "error",
            title:
              t("googleDrive.authCancelled") ||
              "Đã hủy đăng nhập Google Drive™",
            description: errorMsg,
          })
        } else {
          toast.add({
            type: "error",
            title:
              driveState.action === "create"
                ? t("googleDrive.createError") ||
                  "Không thể tạo tệp trên Google Drive™"
                : t("googleDrive.openError") ||
                  "Không thể mở file từ Google Drive™",
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

  // Handle Google Drive™ "Open with Silic" or "Create with Silic" URL state param on mount
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

    const timer = setTimeout(() => {
      executeDriveAction(driveState, false)
    }, 0)
    return () => clearTimeout(timer)
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

      {/* Google Drive Save Location Options Dialog */}
      <Dialog
        open={!!saveLocationDialog?.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeSaveLocationDialog()
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isNewFolderStep
                ? t("googleDrive.saveNewFolderOption") || "Tạo folder mới"
                : t("googleDrive.saveLocationTitle") ||
                  "Chọn vị trí lưu trên Google Drive™"}
            </DialogTitle>
          </DialogHeader>

          {!isNewFolderStep ? (
            <div className="flex flex-col gap-2.5 py-2">
              {/* Option 1: Lưu tại folder gốc */}
              <button
                type="button"
                className="group flex cursor-pointer items-center gap-3 rounded-lg border border-border/60 bg-card p-3 text-left transition-all hover:border-primary/60 hover:bg-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={async () => {
                  const isSaveAs = saveLocationDialog?.isSaveAs ?? false
                  const pendingShare =
                    saveLocationDialog?.pendingShareAfterSave ?? false
                  closeSaveLocationDialog()
                  await performSaveToLocation({
                    parentFolderId: "root",
                    isSaveAs,
                    pendingShare,
                  })
                }}
              >
                <div className="mt-0.5 rounded-md bg-primary/10 p-2 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <HardDrive className="h-4 w-4" />
                </div>
                <div className="text-xs font-medium text-foreground">
                  {t("googleDrive.saveRootOption") || "Lưu tại folder gốc"}
                </div>
              </button>

              {/* Option 2: Chọn folder đã có */}
              <button
                type="button"
                className="group flex cursor-pointer items-center gap-3 rounded-lg border border-border/60 bg-card p-3 text-left transition-all hover:border-primary/60 hover:bg-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={() => {
                  const isSaveAs = saveLocationDialog?.isSaveAs ?? false
                  const pendingShare =
                    saveLocationDialog?.pendingShareAfterSave ?? false
                  closeSaveLocationDialog()
                  openPickerForExistingFolder(isSaveAs, pendingShare)
                }}
              >
                <div className="mt-0.5 rounded-md bg-primary/10 p-2 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <FolderOpen className="h-4 w-4" />
                </div>
                <div className="text-xs font-medium text-foreground">
                  {t("googleDrive.saveExistingOption") || "Chọn folder đã có"}
                </div>
              </button>

              {/* Option 3: Tạo folder mới */}
              <button
                type="button"
                className="group flex cursor-pointer items-center gap-3 rounded-lg border border-border/60 bg-card p-3 text-left transition-all hover:border-primary/60 hover:bg-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={() => {
                  setIsNewFolderStep(true)
                }}
              >
                <div className="mt-0.5 rounded-md bg-primary/10 p-2 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <FolderPlus className="h-4 w-4" />
                </div>
                <div className="text-xs font-medium text-foreground">
                  {t("googleDrive.saveNewFolderOption") || "Tạo folder mới"}
                </div>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 py-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="drive-new-folder-name" className="text-xs">
                  {t("googleDrive.newFolderNameLabel") || "Tên thư mục mới"}
                </Label>
                <Input
                  id="drive-new-folder-name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder={
                    t("googleDrive.newFolderNamePlaceholder") ||
                    "Nhập tên thư mục..."
                  }
                  autoFocus
                  className="h-8 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">
                  {t("googleDrive.parentFolderLabel") || "Vị trí tạo thư mục"}
                </Label>
                <div className="flex items-center justify-between rounded-md border border-border/60 bg-muted/30 px-2.5 py-1.5 text-xs">
                  <div className="flex items-center gap-2 truncate text-foreground">
                    <Folder className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate font-medium">
                      {parentFolder
                        ? parentFolder.name
                        : t("googleDrive.parentFolderRoot") ||
                          "Thư mục gốc (My Drive)"}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[11px]"
                    onClick={openPickerForParentFolder}
                  >
                    {t("googleDrive.chooseParentFolderBtn") ||
                      "Chọn vị trí cha..."}
                  </Button>
                </div>
              </div>

              <DialogFooter className="mt-2 flex items-center justify-between gap-2 sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsNewFolderStep(false)}
                  className="h-8 text-xs"
                >
                  <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                  {t("googleDrive.backBtn") || "Quay lại"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCreateFolderAndSave}
                  className="h-8 text-xs"
                >
                  {t("googleDrive.createAndSaveBtn") || "Tạo & Lưu vào đây"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
              {t("googleDrive.authRequiredTitle") || "Yêu cầu đăng nhập Google"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("googleDrive.authRequiredDesc") ||
                "Vui lòng đăng nhập tài khoản Google Drive™ để tiếp tục thao tác với tệp tin."}
              {pendingDriveAction?.userId && (
                <span className="mt-2 block text-xs text-muted-foreground">
                  {t("googleDrive.authRequiredHint", {
                    userId: pendingDriveAction.userId,
                  }) || `Tài khoản Google Drive™: ${pendingDriveAction.userId}`}
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
                    "Đã hủy đăng nhập Google Drive™",
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
