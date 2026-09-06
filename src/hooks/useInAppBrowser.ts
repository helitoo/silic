import { useState, useEffect, useCallback } from "react"
import {
  detectInAppBrowser,
  openInExternalBrowser,
  copyToClipboardSafe,
  type InAppBrowserInfo,
} from "@/lib/inAppBrowser"
import { toast } from "@/components/ui/toast"
import { useLang } from "@/contexts/LangContext"

const SESSION_STORAGE_KEY = "silic_inapp_dismissed"

export function useInAppBrowser() {
  const { t } = useLang()
  const [info, setInfo] = useState<InAppBrowserInfo>(() =>
    detectInAppBrowser()
  )
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [isBannerVisible, setIsBannerVisible] = useState<boolean>(false)

  useEffect(() => {
    const detected = detectInAppBrowser()
    setInfo(detected)

    if (detected.isInApp) {
      try {
        const isDismissed = sessionStorage.getItem(SESSION_STORAGE_KEY) === "true"
        if (!isDismissed) {
          setIsOpen(true)
          setIsBannerVisible(true)
        } else {
          setIsBannerVisible(true)
        }
      } catch {
        setIsOpen(true)
        setIsBannerVisible(true)
      }
    }
  }, [])

  const openPrompt = useCallback(() => {
    setIsOpen(true)
    setIsBannerVisible(true)
  }, [])

  const closePrompt = useCallback(() => {
    setIsOpen(false)
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, "true")
    } catch {
      // ignore
    }
  }, [])

  const dismissBanner = useCallback(() => {
    setIsBannerVisible(false)
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, "true")
    } catch {
      // ignore
    }
  }, [])

  const handleOpenExternal = useCallback(() => {
    const success = openInExternalBrowser()
    if (!success) {
      toast.add({
        title: t("inAppBrowser.openExternalError") || "Không thể tự động mở",
        description:
          t("inAppBrowser.openExternalErrorDesc") ||
          "Vui lòng nhấn nút Sao chép liên kết và dán vào trình duyệt Chrome / Safari.",
      })
    }
  }, [t])

  const handleCopyLink = useCallback(async () => {
    const success = await copyToClipboardSafe(window.location.href)
    if (success) {
      toast.add({
        title: t("inAppBrowser.copiedLink") || "Đã sao chép liên kết!",
        description:
          t("inAppBrowser.copiedLinkDesc") ||
          "Hãy mở Chrome, Cốc Cốc hoặc Safari và dán liên kết để tiếp tục.",
      })
    } else {
      toast.add({
        title: t("common.copyFailed") || "Sao chép thất bại",
        description:
          t("common.copyFailedDesc") ||
          "Vui lòng tự sao chép đường link trên thanh địa chỉ.",
      })
    }
    return success
  }, [t])

  return {
    info,
    isOpen,
    setIsOpen,
    isBannerVisible,
    openPrompt,
    closePrompt,
    dismissBanner,
    handleOpenExternal,
    handleCopyLink,
  }
}

export default useInAppBrowser
