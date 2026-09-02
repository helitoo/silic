import * as React from "react"
import {
  ArrowDownToLine,
  ArrowRight,
  Compass,
  FileCode2,
  GitBranch,
  HardDrive,
  Layers,
  Network,
  ReceiptText,
  Search,
  ShieldCheck,
  ShieldLock,
  Smartphone,
} from "lucide-react"
import { useLang } from "@/contexts/LangContext"
import { useRouter } from "@/contexts/RouterContext"
import { usePWAInstall } from "@/hooks/usePWAInstall"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { LongTextSections } from "@/components/main/page/EntityDetailPage/LongTextSections"
import { ShortSections } from "@/components/main/page/EntityDetailPage/ShortSections"
import type { Entity } from "@/lib/types"

export function LandingPage() {
  const { t } = useLang()
  const { navigate } = useRouter()
  const { install, isInstallable, isInstalled } = usePWAInstall()

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

  // Sample Silic entity data for live preview showcase
  const sampleSilicEntity: Entity = React.useMemo(
    () => ({
      id: "silic-app",
      records: [
        {
          id: "rec-name",
          type: "shortText",
          name: "Tên ứng dụng",
          isArray: false,
          value: "Silic",
        },
        {
          id: "rec-color",
          type: "color",
          name: "Bảng màu",
          isArray: true,
          value: ["#0068a8", "#e1eef5"],
        },
        {
          id: "rec-desc",
          type: "longText",
          name: "Giới thiệu & Tổng quan",
          isArray: false,
          value:
            "<h2>Silic - Local-First Knowledge Graph</h2><p>Silic là ứng dụng ghi chú dựa trên <strong>đồ thị tri thức đa thuộc tính</strong>, hoạt động hoàn toàn cục bộ ngay trong trình duyệt của bạn theo mô hình <strong>Local-First & Offline-First</strong>.</p><h3>Điểm nổi bật:</h3><ul><li><strong>13+ kiểu dữ liệu linh hoạt:</strong> Hỗ trợ văn bản, văn bản dài, số, ngày giờ, hình ảnh, âm thanh, video, tệp tin và màu sắc.</li><li><strong>Quan hệ siêu liên kết (Hyper-Relations):</strong> Kết nối nhiều thực thể nguồn tới nhiều thực thể đích với hướng quan hệ rõ ràng.</li><li><strong>Bộ máy truy vấn BFS:</strong> Tìm kiếm đường đi ngắn nhất giữa các thực thể và đánh giá biểu thức logic đa biến.</li><li><strong>Bảo mật 100%:</strong> Toàn bộ dữ liệu được lưu an toàn trong IndexedDB của bạn, không gửi về bất kỳ máy chủ nào.</li></ul>",
        },
        {
          id: "rec-version",
          type: "shortText",
          name: "Phiên bản",
          isArray: false,
          value: "v0.1.0",
        },
        {
          id: "rec-type",
          type: "shortText",
          name: "Phân loại",
          isArray: false,
          value: "Đồ thị tri thức đa thuộc tính",
        },
        {
          id: "rec-license",
          type: "shortText",
          name: "Giấy phép",
          isArray: false,
          value: "Apache 2.0",
        },
        {
          id: "rec-storage",
          type: "boolean",
          name: "Lưu trữ cục bộ (IndexedDB)",
          isArray: false,
          value: true,
        },
        {
          id: "rec-offline",
          type: "boolean",
          name: "Ngoại tuyến (PWA)",
          isArray: false,
          value: true,
        },
        {
          id: "rec-url",
          type: "url",
          name: "Mã nguồn",
          isArray: false,
          value: "https://github.com/helitoo/silic",
        },
        {
          id: "rec-date",
          type: "date",
          name: "Ngày phát hành",
          isArray: false,
          value: "2026-09-01",
        },
      ],
    }),
    []
  )

  const featureCards = [
    {
      icon: Network,
      iconColor: "text-sky-500 bg-sky-500/10 border-sky-500/20",
      title: t("landing.graphTitle"),
      desc: t("landing.graphDesc"),
      tag: "Interactive 2D",
      href: "/d?tab=diagram",
    },
    {
      icon: Layers,
      iconColor: "text-purple-500 bg-purple-500/10 border-purple-500/20",
      title: t("landing.entitiesTitle"),
      desc: t("landing.entitiesDesc"),
      tag: "13+ Types",
      href: "/guide",
    },
    {
      icon: GitBranch,
      iconColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      title: t("landing.connectionsTitle"),
      desc: t("landing.connectionsDesc"),
      tag: "Hyper-Relations",
      href: "/d?tab=connections",
    },
    {
      icon: Search,
      iconColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      title: t("landing.queryTitle"),
      desc: t("landing.queryDesc"),
      tag: "Graph Engine",
      href: "/docs-query",
    },
    {
      icon: ShieldCheck,
      iconColor: "text-rose-500 bg-rose-500/10 border-rose-500/20",
      title: t("landing.localFirstTitle"),
      desc: t("landing.localFirstDesc"),
      tag: "100% Privacy",
      href: "/docs-storage",
    },
    {
      icon: Smartphone,
      iconColor: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
      title: t("landing.pwaTitle"),
      desc: t("landing.pwaDesc"),
      tag: "PWA Offline",
      href: "/guide",
    },
  ]

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Background Ambient Glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[560px] w-[800px] -translate-x-1/2 rounded-full bg-linear-to-b from-primary/20 via-sky-500/10 to-transparent opacity-70 blur-3xl dark:opacity-40" />
      <div className="pointer-events-none absolute top-[700px] -left-40 -z-10 h-[450px] w-[500px] rounded-full bg-purple-500/15 opacity-50 blur-3xl dark:opacity-30" />
      <div className="pointer-events-none absolute top-[900px] -right-40 -z-10 h-[450px] w-[500px] rounded-full bg-emerald-500/15 opacity-50 blur-3xl dark:opacity-30" />

      {/* 1. Hero Section */}
      <section className="relative mx-auto max-w-7xl px-4 pt-10 pb-16 sm:px-6 sm:pt-16 sm:pb-20 lg:px-8">
        <div className="flex flex-col items-center text-center">
          {/* Main Headline */}
          <h1 className="mt-5 max-w-4xl text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl sm:leading-[1.18] lg:text-6xl">
            <span className="block">{t("landing.heroTitle1")}</span>
            <span className="mt-2 block bg-linear-to-r from-primary via-sky-500 to-purple-600 bg-clip-text text-transparent">
              {t("landing.heroTitle2")}
            </span>
          </h1>

          {/* Action CTAs */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Button
              size="lg"
              onClick={() => navigate("/d")}
              className="h-11 cursor-pointer gap-2 rounded-xl px-6 text-sm font-semibold shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98] sm:h-12 sm:px-7 sm:text-base"
            >
              <span>{t("landing.startExploring")}</span>
              <ArrowRight className="size-4" />
            </Button>

            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate("/guide")}
              className="h-11 cursor-pointer gap-2 rounded-xl border border-border/80 px-5 text-sm font-medium shadow-xs transition-all hover:bg-muted sm:h-12 sm:px-6 sm:text-base"
            >
              <Compass className="size-4 text-primary" />
              <span>{t("landing.viewGuide") || "User Guide"}</span>
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={handleInstallClick}
              className="h-11 cursor-pointer gap-2 rounded-xl border-border/80 bg-background/80 px-5 text-sm font-medium shadow-xs backdrop-blur-md hover:bg-accent/60 sm:h-12 sm:px-6 sm:text-base"
            >
              <ArrowDownToLine className="size-4 text-primary" />
              <span>{t("landing.installApp")}</span>
            </Button>
          </div>

          {/* Quick Value Metrics */}
          <div className="mt-9 grid grid-cols-2 gap-4 border-t border-border/50 pt-6 sm:grid-cols-4 sm:gap-8">
            <button
              type="button"
              onClick={() => navigate("/guide")}
              className="group flex cursor-pointer flex-col items-center transition-transform hover:scale-105"
            >
              <span className="text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-2xl lg:text-3xl">
                13+
              </span>
              <span className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                {t("landing.quickStatsEntities")}
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate("/d?tab=connections")}
              className="group flex cursor-pointer flex-col items-center transition-transform hover:scale-105"
            >
              <span className="text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-2xl lg:text-3xl">
                N:M
              </span>
              <span className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                {t("landing.quickStatsRelations")}
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate("/docs-storage")}
              className="group flex cursor-pointer flex-col items-center transition-transform hover:scale-105"
            >
              <span className="text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-2xl lg:text-3xl">
                100%
              </span>
              <span className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                {t("landing.quickStatsPrivacy")}
              </span>
            </button>

            <button
              type="button"
              onClick={handleInstallClick}
              className="group flex cursor-pointer flex-col items-center transition-transform hover:scale-105"
            >
              <span className="text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-2xl lg:text-3xl">
                ⚡ 0ms
              </span>
              <span className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                {t("landing.quickStatsOffline")}
              </span>
            </button>
          </div>
        </div>

        {/* Hero Interactive Entity Detail Showcase */}
        <div className="relative mx-auto mt-10 max-w-5xl rounded-2xl border border-border/80 bg-card/70 p-4 shadow-2xl backdrop-blur-xl sm:p-7">
          <div className="mb-5 flex items-center justify-between border-b border-border/50 pb-3">
            <div className="flex items-center gap-2">
              <div className="size-2.5 rounded-full bg-rose-500/80" />
              <div className="size-2.5 rounded-full bg-amber-500/80" />
              <div className="size-2.5 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs font-medium text-muted-foreground">
                silic://entity-preview-runtime
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                Live Entity Detail View
              </span>
            </div>
          </div>

          {/* Main Content Layout: Left 3/5 LongTextSections, Right 2/5 ShortSections */}
          <div className="grid grid-cols-1 gap-6 text-left md:grid-cols-5">
            {/* Long Text Column (3/5 on >= md, second on < md) */}
            <div className="order-2 space-y-4 md:order-1 md:col-span-3">
              <LongTextSections entity={sampleSilicEntity} />
            </div>

            {/* Short Text & Metadata Column (2/5 on >= md, first on < md) */}
            <div className="order-1 space-y-4 md:order-2 md:col-span-2">
              <ShortSections
                entity={sampleSilicEntity}
                onSelectEntity={() => navigate("/d?tab=entities")}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Bento Feature Grid */}
      <section className="relative border-t border-border/50 bg-muted/20 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              {t("landing.featuresTitle")}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              {t("landing.featuresSubtitle")}
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((feat, idx) => {
              const IconComp = feat.icon
              return (
                <div
                  key={idx}
                  onClick={() => navigate(feat.href)}
                  className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-card/80 p-6 shadow-xs backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div
                        className={`flex size-11 items-center justify-center rounded-xl border ${feat.iconColor}`}
                      >
                        <IconComp className="size-5.5" />
                      </div>
                      <span className="rounded-full border border-border/80 bg-muted/60 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {feat.tag}
                      </span>
                    </div>
                    <h3 className="mt-5 text-lg font-bold text-foreground">
                      {feat.title}
                    </h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                      {feat.desc}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-primary transition-transform group-hover:translate-x-1">
                    <span>{t("landing.learnMore") || "Learn more"}</span>
                    <ArrowRight className="size-3.5" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 3. Multi-Column Footer */}
      <footer className="border-t border-border/50 bg-background py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
            {/* Brand Column */}
            <div className="col-span-2 space-y-4 md:col-span-1">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="flex cursor-pointer items-center gap-2"
              >
                <img
                  src="/logo.png"
                  alt="Silic logo"
                  className="h-9 w-auto object-contain"
                  draggable={false}
                />
              </button>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Silic - Ứng dụng ghi chú dựa trên đồ thị tri thức đa thuộc tính.
              </p>
              <p className="text-xs text-muted-foreground/80">
                © {new Date().getFullYear()} Silic.
              </p>
            </div>

            {/* Column 1: Application */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold tracking-wider text-foreground uppercase">
                {t("landing.navigationTitle") || "Application"}
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    type="button"
                    onClick={() => navigate("/d?tab=diagram")}
                    className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t("navbar.diagram")}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate("/d?tab=entities")}
                    className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t("navbar.entities")}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate("/d?tab=connections")}
                    className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t("navbar.connections")}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate("/d?tab=templates")}
                    className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t("navbar.templates")}
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 2: Documentation & Guides */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold tracking-wider text-foreground uppercase">
                {t("landing.resourcesTitle") || "Documentation"}
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    type="button"
                    onClick={() => navigate("/guide")}
                    className="flex cursor-pointer items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Compass className="size-3.5 text-primary" />
                    <span>{t("navbar.guide") || "User Guide"}</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate("/docs-query")}
                    className="flex cursor-pointer items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <FileCode2 className="size-3.5 text-primary" />
                    <span>{t("navbar.docsQuery") || "Query Architecture"}</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate("/docs-storage")}
                    className="flex cursor-pointer items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <HardDrive className="size-3.5 text-primary" />
                    <span>
                      {t("navbar.docsStorage") || "Storage Architecture"}
                    </span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Legal & Privacy */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold tracking-wider text-foreground uppercase">
                {t("landing.legalTitle") || "Legal & Privacy"}
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    type="button"
                    onClick={() => navigate("/policy-of-privacy")}
                    className="flex cursor-pointer items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ShieldLock className="size-3.5 text-primary" />
                    <span>{t("navbar.privacyPolicy") || "Privacy Policy"}</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate("/terms-of-service")}
                    className="flex cursor-pointer items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ReceiptText className="size-3.5 text-primary" />
                    <span>
                      {t("navbar.termsOfService") || "Terms of Service"}
                    </span>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
