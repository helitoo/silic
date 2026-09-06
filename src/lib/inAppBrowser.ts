export interface InAppBrowserInfo {
  isInApp: boolean
  appName: string
  appKey: string
  isAndroid: boolean
  isIOS: boolean
  isMobile: boolean
  canDirectOpen: boolean
  rawUserAgent: string
}

export function detectInAppBrowser(customUserAgent?: string): InAppBrowserInfo {
  if (typeof window === "undefined" && !customUserAgent) {
    return {
      isInApp: false,
      appName: "",
      appKey: "",
      isAndroid: false,
      isIOS: false,
      isMobile: false,
      canDirectOpen: false,
      rawUserAgent: "",
    }
  }

  const ua = (
    customUserAgent ||
    (typeof navigator !== "undefined" ? navigator.userAgent : "")
  ).toLowerCase()

  const isAndroid = /android/i.test(ua)
  const isIOS = /iphone|ipad|ipod/i.test(ua)
  const isMobile = isAndroid || isIOS || /mobile/i.test(ua)

  let appName = ""
  let appKey = ""
  let isInApp = false

  if (/zalo|zalopc|zalotheme/i.test(ua)) {
    isInApp = true
    appName = "Zalo"
    appKey = "zalo"
  } else if (
    /tiktok|musical_ly|bytedance|snssdk|trill|ttwebview/i.test(ua)
  ) {
    isInApp = true
    appName = "TikTok"
    appKey = "tiktok"
  } else if (/messenger|fbmessenger|fb_iab\/messenger/i.test(ua)) {
    isInApp = true
    appName = "Messenger"
    appKey = "messenger"
  } else if (/instagram/i.test(ua)) {
    isInApp = true
    appName = "Instagram"
    appKey = "instagram"
  } else if (/fban|fbav|fb_iab|fb4a|fbios/i.test(ua)) {
    isInApp = true
    appName = "Facebook"
    appKey = "facebook"
  } else if (/telegram/i.test(ua)) {
    isInApp = true
    appName = "Telegram"
    appKey = "telegram"
  } else if (/micromessenger/i.test(ua)) {
    isInApp = true
    appName = "WeChat"
    appKey = "wechat"
  } else if (/line\//i.test(ua) || /\sline\s/i.test(ua)) {
    isInApp = true
    appName = "Line"
    appKey = "line"
  } else if (/twitter/i.test(ua)) {
    isInApp = true
    appName = "X (Twitter)"
    appKey = "twitter"
  } else if (/snapchat/i.test(ua)) {
    isInApp = true
    appName = "Snapchat"
    appKey = "snapchat"
  } else if (/barcelona/i.test(ua)) {
    isInApp = true
    appName = "Threads"
    appKey = "threads"
  } else if (/linkedinapp|linkedin/i.test(ua)) {
    isInApp = true
    appName = "LinkedIn"
    appKey = "linkedin"
  } else if (/discord/i.test(ua)) {
    isInApp = true
    appName = "Discord"
    appKey = "discord"
  } else if (/slack/i.test(ua)) {
    isInApp = true
    appName = "Slack"
    appKey = "slack"
  } else if (/kakaotalk/i.test(ua)) {
    isInApp = true
    appName = "KakaoTalk"
    appKey = "kakaotalk"
  } else if (
    isAndroid &&
    (/;\s*wv\b/i.test(ua) ||
      (/version\/[0-9.]+/i.test(ua) && /chrome\/[0-9.]+/i.test(ua)))
  ) {
    // Generic Android WebView
    isInApp = true
    appName = "In-App Browser"
    appKey = "webview"
  } else if (isIOS && !/safari/i.test(ua) && /mobile/i.test(ua)) {
    // Generic iOS UIWebView / WKWebView
    isInApp = true
    appName = "In-App Browser"
    appKey = "webview"
  }

  // Certain apps can be triggered to launch external browser
  const canDirectOpen = isAndroid || isIOS

  return {
    isInApp,
    appName,
    appKey,
    isAndroid,
    isIOS,
    isMobile,
    canDirectOpen,
    rawUserAgent: ua,
  }
}

/**
 * Attempt to open the current page or a specific target URL in the device's native browser
 */
export function openInExternalBrowser(targetUrl?: string): boolean {
  if (typeof window === "undefined") return false

  const url = targetUrl || window.location.href
  const info = detectInAppBrowser()

  try {
    if (info.isAndroid) {
      // Android Intent scheme to open in Google Chrome or default browser
      const cleanUrl = url.replace(/^https?:\/\//i, "")
      const intentUrl = `intent://${cleanUrl}#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.android.chrome;end`
      
      // Fallback intent without specific package
      const fallbackIntentUrl = `intent://${cleanUrl}#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end`

      // Try Chrome intent first, fallback to generic
      try {
        window.location.href = intentUrl
        setTimeout(() => {
          window.location.href = fallbackIntentUrl
        }, 800)
        return true
      } catch {
        window.location.href = fallbackIntentUrl
        return true
      }
    } else if (info.isIOS) {
      // iOS Google Chrome custom scheme
      const cleanUrl = url.replace(/^https?:\/\//i, "")
      const chromeUrl = `googlechromes://${cleanUrl}`
      
      // Try opening Chrome URL scheme or normal link target=_blank
      const link = document.createElement("a")
      link.href = chromeUrl
      link.target = "_blank"
      link.rel = "noopener noreferrer"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      return true
    } else {
      // General window open
      window.open(url, "_blank", "noopener,noreferrer")
      return true
    }
  } catch (err) {
    console.error("Failed to open external browser:", err)
    return false
  }
}

/**
 * Safe clipboard copy utility with fallback for in-app webviews that block navigator.clipboard
 */
export async function copyToClipboardSafe(text: string): Promise<boolean> {
  if (typeof window === "undefined") return false

  if (
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function"
  ) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Fallback below
    }
  }

  try {
    const textArea = document.createElement("textarea")
    textArea.value = text
    textArea.style.position = "fixed"
    textArea.style.top = "-9999px"
    textArea.style.left = "-9999px"
    textArea.setAttribute("readonly", "")
    document.body.appendChild(textArea)
    textArea.select()
    textArea.setSelectionRange(0, 99999)
    const successful = document.execCommand("copy")
    document.body.removeChild(textArea)
    return successful
  } catch (err) {
    console.error("Failed to copy using fallback:", err)
    return false
  }
}
