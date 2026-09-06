import * as React from "react"
import {
  ExternalLink,
  Copy,
  Check,
  X,
  Compass,
  AlertTriangle,
  CloudOff,
  Database,
  FileDown,
  Sparkles,
  MoreHorizontal,
} from "lucide-react"
import { useInAppBrowser } from "@/hooks/useInAppBrowser"
import { useLang } from "@/contexts/LangContext"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export function InAppBrowserPrompt() {
  const { t } = useLang()
  const {
    info,
    isOpen,
    setIsOpen,
    isBannerVisible,
    openPrompt,
    closePrompt,
    dismissBanner,
    handleOpenExternal,
    handleCopyLink,
  } = useInAppBrowser()

  const [hasCopied, setHasCopied] = React.useState(false)

  const onCopy = async () => {
    const success = await handleCopyLink()
    if (success) {
      setHasCopied(true)
      setTimeout(() => setHasCopied(false), 2500)
    }
  }

  // If not an in-app browser, render nothing
  if (!info.isInApp) {
    return null
  }

  const appDisplayName = info.appName || t("inAppBrowser.genericApp")

  return (
    <>
      {/* Floating Top Banner (shown when modal is dismissed but user is still in in-app browser) */}
      {isBannerVisible && !isOpen && (
        <aside
          aria-label="In-app browser warning"
          className="relative z-40 border-b border-amber-500/25 bg-amber-500/10 px-3 py-2 backdrop-blur-md transition-all sm:px-4"
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="size-3.5" />
              </div>
              <p className="truncate text-foreground">
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  [{appDisplayName}]
                </span>{" "}
                <span className="hidden sm:inline">
                  {t("inAppBrowser.topBannerText", { app: appDisplayName })}
                </span>
                <span className="sm:hidden">
                  {t("inAppBrowser.topBannerText", { app: appDisplayName })}
                </span>
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={openPrompt}
                className="h-7 gap-1.5 border-amber-500/30 bg-background/80 px-2.5 text-xs font-semibold text-foreground shadow-xs hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400"
              >
                <Compass className="size-3.5 text-amber-500" />
                <span>{t("inAppBrowser.topBannerAction")}</span>
              </Button>

              <button
                type="button"
                onClick={dismissBanner}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title={t("inAppBrowser.topBannerClose")}
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Main Advisory Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="max-h-[92vh] w-[92vw] max-w-lg overflow-y-auto p-5 sm:p-6"
          showCloseButton={true}
        >
          <DialogHeader className="space-y-3 text-left">
            <div className="flex items-center gap-2.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 ring-1 ring-amber-500/30 dark:bg-amber-500/20 dark:text-amber-400">
                <Compass className="size-5 animate-pulse" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                  <span className="size-1.5 rounded-full bg-amber-500 animate-ping" />
                  {t("inAppBrowser.detectedBadge", { app: appDisplayName })}
                </div>
                <DialogTitle className="mt-1 text-lg font-bold sm:text-xl">
                  {t("inAppBrowser.title")}
                </DialogTitle>
              </div>
            </div>

            <DialogDescription className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {t("inAppBrowser.description", { app: appDisplayName })}{" "}
              <span className="font-medium text-foreground">
                {t("inAppBrowser.recommendation")}
              </span>
            </DialogDescription>
          </DialogHeader>

          {/* Known Limitations Box */}
          <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 sm:p-4">
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("inAppBrowser.limitationsTitle")}
            </p>
            <div className="grid grid-cols-1 gap-2 text-xs text-foreground sm:grid-cols-2">
              <div className="flex items-center gap-2 rounded-lg bg-background/80 p-2 border border-border/50">
                <CloudOff className="size-4 shrink-0 text-amber-500" />
                <span className="font-medium">
                  {t("inAppBrowser.limitationDrive")}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-background/80 p-2 border border-border/50">
                <Database className="size-4 shrink-0 text-amber-500" />
                <span className="font-medium">
                  {t("inAppBrowser.limitationStorage")}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-background/80 p-2 border border-border/50">
                <FileDown className="size-4 shrink-0 text-amber-500" />
                <span className="font-medium">
                  {t("inAppBrowser.limitationFiles")}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-background/80 p-2 border border-border/50">
                <Sparkles className="size-4 shrink-0 text-amber-500" />
                <span className="font-medium">
                  {t("inAppBrowser.limitationGraph")}
                </span>
              </div>
            </div>
          </div>

          {/* Step by Step Guide */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 sm:p-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary sm:text-sm">
              <MoreHorizontal className="size-4" />
              <span>{t("inAppBrowser.howToOpenTitle")}</span>
            </div>
            <ol className="mt-2 space-y-1.5 text-xs text-muted-foreground sm:text-sm">
              <li className="flex items-start gap-2">
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                  1
                </span>
                <span>{t("inAppBrowser.step1")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                  2
                </span>
                <span>{t("inAppBrowser.step2")}</span>
              </li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="default"
                onClick={handleOpenExternal}
                className="w-full gap-2 font-semibold shadow-sm"
              >
                <ExternalLink className="size-4" />
                <span>{t("inAppBrowser.openInBrowserBtn")}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={onCopy}
                className={cn(
                  "w-full gap-2 font-semibold transition-all",
                  hasCopied && "border-green-500 text-green-600 dark:text-green-400"
                )}
              >
                {hasCopied ? (
                  <>
                    <Check className="size-4 text-green-500" />
                    <span>{t("inAppBrowser.copiedLink")}</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-4" />
                    <span>{t("inAppBrowser.copyLinkBtn")}</span>
                  </>
                )}
              </Button>
            </div>

            <Button
              type="button"
              variant="ghost"
              onClick={closePrompt}
              className="w-full text-xs text-muted-foreground hover:text-foreground"
            >
              {t("inAppBrowser.continueAnyway")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default InAppBrowserPrompt
