import EntitiesDialog from "@/components/main/dialog/EntitiesDialog"
import ConnectionPage from "@/components/main/page/ConnectionPage"
import DiagramPage from "@/components/main/page/DiagramPage"
import EntityDetailPage from "@/components/main/page/EntityDetailPage"
import EntityPage from "@/components/main/page/EntityPage"
import LandingPage from "@/components/main/page/LandingPage"
import NotFoundPage from "@/components/main/page/NotFoundPage"
import TemplatesPage from "@/components/main/page/TemplatesPage"
import GuidePage from "@/components/main/page/guide/GuidePage"
import MarkdownPage from "@/components/main/page/guide/MarkdownPage"
import EntityQuerySheet from "@/components/main/queryBlocks/EntityQuerySheet"
import PathQuerySheet from "@/components/main/queryBlocks/PathQuerySheet"
import AnalysisPage from "@/components/main/page/AnalysisPage"
import { Tabs } from "@/components/ui/tabs"
import { Toaster } from "@/components/ui/toast"
import { SidebarProvider } from "@/components/ui/sidebar"
import { useEntity } from "@/contexts/EntityContext"
import { useGoogleDrivePicker } from "@/contexts/GoogleDrivePickerContext"
import { useProjectStorage } from "@/contexts/ProjectStorageContext"
import { useQuery } from "@/contexts/QueryContext"
import { useAnalysis } from "@/contexts/AnalysisContext"
import { useRouter, type TabType } from "@/contexts/RouterContext"
import { uploadSingleFile } from "@/lib/localFiles/uploadFile"
import { useState, useMemo, useCallback } from "react"
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
import { useLang } from "@/contexts/LangContext"
import AppMobileSidebar from "@/components/main/navbar/AppSidebar"
import Navbar from "@/components/main/navbar"
import type { NavItemActions } from "@/components/main/navbar/navItems"

export default function AppContent() {
  const { t } = useLang()
  const { route, tab, navigateTab, navigate, goBack } = useRouter()
  const { entities } = useEntity()
  const { handleOpenPicker } = useGoogleDrivePicker()
  const {
    fileName,
    exportProjectSilic,
    importProjectSilic,
    newProject,
    clearProject,
  } = useProjectStorage()
  const { openEntityQuery, openPathQuery } = useQuery()
  const { openAnalysis } = useAnalysis()

  const [editingEntity, setEditingEntity] = useState<any>(null)
  const [isEntityDialogOpen, setIsEntityDialogOpen] = useState(false)
  const [isClearAlertOpen, setIsClearAlertOpen] = useState(false)

  const handleUploadSilic = useCallback(async () => {
    const file = await uploadSingleFile({ accept: ".silic" })
    if (file) {
      await importProjectSilic(file)
    }
  }, [importProjectSilic])

  const handleDownloadSilic = useCallback(async () => {
    await exportProjectSilic(fileName)
  }, [exportProjectSilic, fileName])

  const actions: NavItemActions = useMemo(
    () => ({
      onOpenDrive: handleOpenPicker,
      onUploadDevice: handleUploadSilic,
      onDownload: handleDownloadSilic,
      onNewProject: newProject,
      onClear: () => setIsClearAlertOpen(true),
      onOpenEntityQuery: openEntityQuery,
      onOpenPathQuery: openPathQuery,
      onOpenAnalysis: openAnalysis,
    }),
    [
      handleOpenPicker,
      handleUploadSilic,
      handleDownloadSilic,
      newProject,
      openEntityQuery,
      openPathQuery,
      openAnalysis,
    ]
  )

  // Entity Detail validation
  let activeEntityDetail = null
  if (route.type === "entity-detail") {
    activeEntityDetail = entities.find((e) => e.id === route.id)
  }

  // Determine if current route is invalid (404)
  const isNotFound =
    route.type === "not-found" ||
    (route.type === "entity-detail" && !activeEntityDetail)

  return (
    <SidebarProvider
      defaultOpen={false}
      className="flex min-h-screen w-full flex-col bg-background text-foreground"
    >
      <AppMobileSidebar actions={actions} />

      <Tabs
        value={tab}
        onValueChange={(val) => navigateTab(val as TabType)}
        className="flex min-h-screen w-full flex-col bg-background text-foreground"
      >
        <Navbar />

        {route.type === "landing" ? (
          <LandingPage />
        ) : route.type === "guide" ? (
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-8 sm:py-10">
            <GuidePage />
          </main>
        ) : route.type === "docs-query" ? (
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-8 sm:py-10">
            <MarkdownPage doc="silic-query" />
          </main>
        ) : route.type === "docs-storage" ? (
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-8 sm:py-10">
            <MarkdownPage doc="silic-storage" />
          </main>
        ) : route.type === "terms-of-service" ? (
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-8 sm:py-10">
            <MarkdownPage doc="terms-of-service" />
          </main>
        ) : route.type === "policy-of-privacy" ? (
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-8 sm:py-10">
            <MarkdownPage doc="policy-of-privacy" />
          </main>
        ) : isNotFound ? (
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
            <NotFoundPage />
          </main>
        ) : route.type === "entity-detail" && activeEntityDetail ? (
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-4 pb-12 sm:px-8 sm:pb-16 md:px-12 md:pb-24 lg:px-16 xl:px-24">
            <EntityDetailPage
              entity={activeEntityDetail}
              onBack={() => goBack("/d?tab=entities")}
              onEdit={() => {
                setEditingEntity(activeEntityDetail)
                setIsEntityDialogOpen(true)
              }}
              onSelectEntity={(ent) => navigate(`/d/entity/${ent.id}/detail`)}
            />
          </main>
        ) : (
          <main className="mx-auto w-full max-w-7xl flex-1">
            <DiagramPage />
            <EntityPage />
            <ConnectionPage />
            <TemplatesPage />
          </main>
        )}

        {route.type !== "landing" && (
          <>
            <EntityQuerySheet />
            <PathQuerySheet />
            <AnalysisPage />
          </>
        )}
        <Toaster />

        {/* Entity Edit Dialog for Detail Page */}
        <EntitiesDialog
          open={isEntityDialogOpen}
          onOpenChange={setIsEntityDialogOpen}
          defaultValue={editingEntity}
        />

        {/* Clear Project Confirmation Alert Dialog for Mobile Sidebar */}
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
              <AlertDialogCancel>
                {t("common.cancel") || "Hủy"}
              </AlertDialogCancel>
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
      </Tabs>
    </SidebarProvider>
  )
}
