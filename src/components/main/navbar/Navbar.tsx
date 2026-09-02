import * as React from "react"
import { ArrowDownToLine, ArrowRight } from "lucide-react"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Kbd } from "@/components/ui/kbd"
import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLang } from "@/contexts/LangContext"
import { LangButton } from "@/components/ui/lang-button"
import { ThemeButton } from "@/components/ui/theme-button"
import { useRouter } from "@/contexts/RouterContext"
import { useGoogleDrivePicker } from "@/contexts/GoogleDrivePickerContext"
import { useProjectStorage } from "@/contexts/ProjectStorageContext"
import { useQuery } from "@/contexts/QueryContext"
import { useAnalysis } from "@/contexts/AnalysisContext"
import { uploadSingleFile } from "@/lib/localFiles/uploadFile"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { usePWAInstall } from "@/hooks/usePWAInstall"
import { toast } from "@/components/ui/toast"
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
  getNavItems,
  renderIcon,
  renderLabel,
  type NavItemActions,
} from "./navItems"

export default function Navbar() {
  const { t } = useLang()
  const { pathname, route, navigate } = useRouter()
  const { handleOpenPicker } = useGoogleDrivePicker()
  const {
    fileName,
    setFileName,
    exportProjectSilic,
    importProjectSilic,
    newProject,
    clearProject,
  } = useProjectStorage()
  const { openEntityQuery, openPathQuery } = useQuery()
  const { openAnalysis } = useAnalysis()
  const { install, isInstallable, isInstalled } = usePWAInstall()

  const [isClearAlertOpen, setIsClearAlertOpen] = React.useState(false)
  const [isNewAlertOpen, setIsNewAlertOpen] = React.useState(false)

  const isLanding =
    pathname === "/" ||
    route.type === "landing" ||
    route.type === "guide" ||
    route.type === "docs-query" ||
    route.type === "docs-storage" ||
    route.type === "terms-of-service" ||
    route.type === "policy-of-privacy"

  const handleInstallClick = React.useCallback(async () => {
    if (isInstalled) {
      toast.add({
        title: t("landing.installed"),
        description: t("landing.appInstalledToast"),
      })
      return
    }

    if (isInstallable) {
      const outcome = await install()
      if (outcome === "accepted") {
        toast.add({
          title: t("landing.installed"),
          description: t("landing.appInstalledToast"),
        })
      }
    } else {
      toast.add({
        title: t("landing.download"),
        description: t("landing.installGuideToast"),
      })
    }
  }, [isInstalled, isInstallable, install, t])

  const handleUploadSilic = React.useCallback(async () => {
    const file = await uploadSingleFile({ accept: ".silic" })
    if (file) {
      await importProjectSilic(file)
    }
  }, [importProjectSilic])

  const handleDownloadSilic = React.useCallback(async () => {
    await exportProjectSilic(fileName)
  }, [exportProjectSilic, fileName])

  // Global keydown shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey

      if (isMod && (e.key.toLowerCase() === "o" || e.code === "KeyO")) {
        e.preventDefault()
        e.stopPropagation()
        // handleOpenPicker()
      } else if (isMod && (e.key.toLowerCase() === "u" || e.code === "KeyU")) {
        e.preventDefault()
        e.stopPropagation()
        handleUploadSilic()
      } else if (isMod && (e.key.toLowerCase() === "d" || e.code === "KeyD")) {
        e.preventDefault()
        e.stopPropagation()
        handleDownloadSilic()
      } else if (isMod && (e.key.toLowerCase() === "n" || e.code === "KeyN")) {
        e.preventDefault()
        e.stopPropagation()
        setIsNewAlertOpen(true)
      } else if (isMod && (e.key.toLowerCase() === "q" || e.code === "KeyQ")) {
        e.preventDefault()
        e.stopPropagation()
        if (e.shiftKey) {
          openPathQuery()
        } else {
          openEntityQuery()
        }
      } else if (
        isMod &&
        e.shiftKey &&
        (e.key.toLowerCase() === "k" || e.code === "KeyK")
      ) {
        e.preventDefault()
        e.stopPropagation()
        openAnalysis()
      }
    }
    window.addEventListener("keydown", handleKeyDown, { capture: true })
    return () =>
      window.removeEventListener("keydown", handleKeyDown, { capture: true })
  }, [
    handleUploadSilic,
    handleDownloadSilic,
    openEntityQuery,
    openPathQuery,
    openAnalysis,
  ])

  // Nav item actions
  const actions: NavItemActions = React.useMemo(
    () => ({
      onOpenDrive: handleOpenPicker,
      onUploadDevice: handleUploadSilic,
      onDownload: handleDownloadSilic,
      onNewProject: () => setIsNewAlertOpen(true),
      onClear: () => setIsClearAlertOpen(true),
      onOpenEntityQuery: openEntityQuery,
      onOpenPathQuery: openPathQuery,
      onOpenAnalysis: openAnalysis,
    }),
    [
      handleOpenPicker,
      handleUploadSilic,
      handleDownloadSilic,
      openEntityQuery,
      openPathQuery,
      openAnalysis,
    ]
  )

  const items = React.useMemo(() => getNavItems(t, actions), [t, actions])

  if (isLanding) {
    const guideGroup =
      items.find((g) => g.label === t("navbar.guide") || g.label === "Guide") ||
      items[items.length - 1]

    return (
      <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 shadow-xs backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:gap-4 sm:px-6">
          {/* Left: SidebarTrigger (mobile) + Brand Logo */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <SidebarTrigger className="size-8 shrink-0 rounded-md sm:hidden" />
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex shrink-0 cursor-pointer items-center gap-2 rounded-md transition-opacity hover:opacity-85 focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
              title="Silic"
            >
              <img
                src="/logo.png"
                alt="Silic logo"
                className="h-8 w-auto shrink-0 object-contain sm:h-10"
                draggable={false}
              />
            </button>
          </div>

          {/* Right: NavigationMenu (hidden on small screens) + Download & Start buttons (always visible) */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <NavigationMenu className="hidden max-w-none sm:flex">
              <NavigationMenuList className="gap-1">
                {guideGroup && (
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="h-8 rounded px-2.5 text-xs font-normal text-muted-foreground hover:bg-muted/70 hover:text-foreground sm:text-sm">
                      <span>{renderLabel(guideGroup.label)}</span>
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="flex min-w-[200px] flex-col gap-0.5 p-1">
                        {guideGroup.subItems?.map((subItem, subIndex) => (
                          <li key={subIndex}>
                            <NavigationMenuLink
                              className="flex w-full items-center justify-between gap-4"
                              render={
                                <a
                                  href={subItem.href || "#"}
                                  onClick={(e) => {
                                    if (subItem.onClick) {
                                      e.preventDefault()
                                      subItem.onClick(e)
                                    }
                                  }}
                                  target={subItem.target}
                                >
                                  <span className="flex items-center gap-2">
                                    {renderIcon(subItem.icon)}
                                    {renderLabel(subItem.label)}
                                  </span>
                                </a>
                              }
                            />
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                )}

                <ThemeButton triggerClassName="h-8 px-2.5 text-xs sm:text-sm" />
                <LangButton triggerClassName="h-8 px-2.5 text-xs sm:text-sm" />
              </NavigationMenuList>
            </NavigationMenu>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleInstallClick}
              className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium sm:h-9 sm:px-3.5 sm:text-sm"
              title="Download & Install PWA"
            >
              <ArrowDownToLine className="size-3.5 text-primary sm:size-4" />
              <span>{t("landing.download")}</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => navigate("/d")}
              className="h-8 gap-1.5 rounded-lg px-3 text-xs font-medium shadow-xs transition-transform active:scale-95 sm:h-9 sm:px-4 sm:text-sm"
              title="Go to Silic App"
            >
              <span>{t("landing.start")}</span>
              <ArrowRight className="size-3.5 sm:size-4" />
            </Button>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/95 shadow-xs backdrop-blur-md">
      {/* 1. Mobile Layout (< sm): No Logo, SidebarTrigger at far left, 2 rows */}
      <div className="flex flex-col gap-1.5 px-2.5 py-1.5 sm:hidden">
        {/* Row 1: Sidebar Trigger + File Name Input + LangButton */}
        <div className="flex w-full items-center gap-1.5">
          <SidebarTrigger className="size-7.5 shrink-0 rounded-md" />
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="Project file name"
            className="h-7.5 min-w-0 flex-1 truncate rounded border border-transparent px-2 text-sm font-semibold tracking-tight text-foreground transition-all hover:border-border/80 focus:border-primary focus:bg-background focus:ring-1 focus:ring-primary/20 focus:outline-none"
            title="Rename document"
            spellCheck={false}
          />
        </div>

        {/* Row 2: Tabs List (horizontal scrollable) */}
        <div className="w-full">
          <TabsList className="h-7.5 w-full justify-start p-0.5">
            <TabsTrigger
              value="diagram"
              className="h-6 min-w-max flex-1 px-2 text-xs"
            >
              {t("navbar.diagram")}
            </TabsTrigger>
            <TabsTrigger
              value="connections"
              className="h-6 min-w-max flex-1 px-2 text-xs"
            >
              {t("navbar.connections")}
            </TabsTrigger>
            <TabsTrigger
              value="entities"
              className="h-6 min-w-max flex-1 px-2 text-xs"
            >
              {t("navbar.entities")}
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="h-6 min-w-max flex-1 px-2 text-xs"
            >
              {t("navbar.templates")}
            </TabsTrigger>
          </TabsList>
        </div>
      </div>

      {/* 2. Desktop / Tablet Layout (>= sm): Standard Google Docs 2-row layout */}
      <div className="hidden w-full items-center justify-between gap-4 px-3 py-1.5 sm:flex sm:px-4 sm:py-2">
        {/* Left Section: Logo + 2-Row Google Docs style header */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {/* 1. Leftmost: Logo spanning 2 rows */}
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex shrink-0 cursor-pointer items-center rounded-md transition-opacity hover:opacity-85 focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
            title="Silic Home"
          >
            <img
              src="/logo.png"
              alt="Silic logo"
              className="h-10 w-auto shrink-0 object-contain sm:h-11"
              draggable={false}
            />
          </button>

          {/* 2. Middle: 2 Rows Layout (All Left-Aligned) */}
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
            {/* Row 1: Document Name & Extension */}
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Project file name"
              className="h-7 w-36 max-w-[280px] truncate rounded border border-transparent px-2 text-sm font-semibold tracking-tight text-foreground transition-all hover:border-border/80 focus:border-primary focus:bg-background focus:ring-1 focus:ring-primary/20 focus:outline-none sm:w-56 sm:text-base"
              title="Rename document"
              spellCheck={false}
            />

            {/* Row 2: Menu Options Bar (Google Docs style) */}
            <div className="flex items-center">
              <NavigationMenu
                className="max-w-none justify-start"
                align="start"
              >
                <NavigationMenuList className="justify-start gap-0.5 sm:gap-1">
                  {items.map((item, index) => {
                    const hasSubItems =
                      item.subItems && item.subItems.length > 0
                    const itemShortcut = item.kdb ?? item.kbd

                    if (hasSubItems) {
                      return (
                        <NavigationMenuItem key={index}>
                          <NavigationMenuTrigger className="h-6 rounded px-2 text-xs font-normal text-muted-foreground hover:bg-muted/70 hover:text-foreground">
                            <span>{renderLabel(item.label)}</span>
                          </NavigationMenuTrigger>
                          <NavigationMenuContent>
                            <ul className="flex min-w-[200px] flex-col gap-0.5 p-1">
                              {item.subItems?.map((subItem, subIndex) => {
                                const subItemShortcut =
                                  subItem.kdb ?? subItem.kbd
                                return (
                                  <li key={subIndex}>
                                    <NavigationMenuLink
                                      className="flex w-full items-center justify-between gap-4"
                                      render={
                                        <a
                                          href={subItem.href || "#"}
                                          onClick={(e) => {
                                            if (subItem.onClick) {
                                              e.preventDefault()
                                              subItem.onClick(e)
                                            }
                                          }}
                                          target={subItem.target}
                                        >
                                          <span className="flex items-center gap-2">
                                            {renderIcon(subItem.icon)}
                                            {renderLabel(subItem.label)}
                                          </span>
                                          {subItemShortcut && (
                                            <Kbd>{subItemShortcut}</Kbd>
                                          )}
                                        </a>
                                      }
                                    />
                                  </li>
                                )
                              })}
                            </ul>
                          </NavigationMenuContent>
                        </NavigationMenuItem>
                      )
                    }

                    return (
                      <NavigationMenuItem key={index}>
                        <NavigationMenuLink
                          className="flex items-center justify-between gap-4"
                          render={
                            <a
                              href={item.href || "#"}
                              onClick={(e) => {
                                if (item.onClick) {
                                  e.preventDefault()
                                  item.onClick(e)
                                }
                              }}
                              target={item.target}
                            >
                              <span className="flex items-center gap-2">
                                {renderIcon(item.icon)}
                                {renderLabel(item.label)}
                              </span>
                              {itemShortcut && <Kbd>{itemShortcut}</Kbd>}
                            </a>
                          }
                        />
                      </NavigationMenuItem>
                    )
                  })}

                  {/* Theme Switcher */}
                  <ThemeButton triggerClassName="px-2" />

                  {/* Language Switcher */}
                  <LangButton triggerClassName="px-2" />
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>
        </div>

        {/* 3. Far Right: Navigation Tabs */}
        <div className="shrink-0">
          <TabsList className="h-7.5">
            <TabsTrigger value="diagram" className="h-6 px-2.5 text-xs">
              {t("navbar.diagram")}
            </TabsTrigger>
            <TabsTrigger value="connections" className="h-6 px-2.5 text-xs">
              {t("navbar.connections")}
            </TabsTrigger>
            <TabsTrigger value="entities" className="h-6 px-2.5 text-xs">
              {t("navbar.entities")}
            </TabsTrigger>
            <TabsTrigger value="templates" className="h-6 px-2.5 text-xs">
              {t("navbar.templates")}
            </TabsTrigger>
          </TabsList>
        </div>
      </div>

      {/* New Project Confirmation Alert Dialog */}
      <AlertDialog open={isNewAlertOpen} onOpenChange={setIsNewAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("common.newConfirmTitle") || "Tạo dự án mới?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("common.newConfirmDescription") ||
                "Hành động này sẽ làm mới toàn bộ không gian làm việc. Bạn có chắc chắn muốn tạo một dự án mới?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel") || "Hủy"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await newProject()
                setIsNewAlertOpen(false)
              }}
            >
              {t("navbar.new") || "Tạo mới"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear Project Confirmation Alert Dialog */}
      <AlertDialog open={isClearAlertOpen} onOpenChange={setIsClearAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("common.clearConfirmTitle") || "Dọn sạch toàn bộ dữ liệu?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("common.clearConfirmDescription") ||
                "Hành động này sẽ xóa vĩnh viễn toàn bộ thực thể, quan hệ, mẫu và tệp đính kèm trong IndexedDB. Bạn không thể hoàn tác thao tác này."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel") || "Hủy"}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={async () => {
                await clearProject()
                setIsClearAlertOpen(false)
              }}
            >
              {t("navbar.clear") || "Dọn sạch"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  )
}
