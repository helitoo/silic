import * as React from "react"
import rawUseDrivePicker from "react-google-drive-picker"

// Handle CJS / ESM interop where Vite may wrap the default export in .default
const useDrivePicker = (
  typeof rawUseDrivePicker === "function"
    ? rawUseDrivePicker
    : typeof (rawUseDrivePicker as any)?.default === "function"
      ? (rawUseDrivePicker as any).default
      : typeof (rawUseDrivePicker as any)?.default?.default === "function"
        ? (rawUseDrivePicker as any).default.default
        : rawUseDrivePicker
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
}

export const GoogleDrivePickerContext =
  React.createContext<GoogleDrivePickerContextType | null>(null)

export function GoogleDrivePickerProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [openPicker] = useDrivePicker()

  const handleOpenPicker = React.useCallback(
    (
      viewId: ViewIdOptions = "DOCS",
      showUploadView = true,
      showUploadFolders = true,
      supportDrives = true,
      multiselect = true
    ) => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
      const developerKey = import.meta.env.VITE_GOOGLE_API_KEY

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
        openPicker({
          clientId,
          developerKey,
          viewId,
          // token: token, // pass oauth token in case you already have one
          showUploadView,
          showUploadFolders,
          supportDrives,
          multiselect,
          setOrigin: window.location.origin,
          // customViews: customViewsArray, // custom view
          callbackFunction: (data) => {
            cleanup()
            if (data.action === "cancel") {
              // console.log("User clicked cancel/close button")
            }
            // console.log(data)
          },
        })
      } catch (err) {
        cleanup()
        console.error("Failed to open Google Drive Picker:", err)
      }
    },
    [openPicker]
  )

  return (
    <GoogleDrivePickerContext.Provider value={{ handleOpenPicker }}>
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
