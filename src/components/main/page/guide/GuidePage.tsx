import * as React from "react"
import {
  Sparkles,
  Type as TypeIcon,
  Image as ImageIcon,
  Palette,
  Database,
  Compass,
  ShieldCheck,
  FolderSync,
  HelpCircle,
  Sliders,
} from "lucide-react"
import { useRouter } from "@/contexts/RouterContext"
import { useLang } from "@/contexts/LangContext"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getTypeIcon } from "@/lib/template-utils"
import type { Type } from "@/lib/types"

export function GuidePage() {
  const { navigate } = useRouter()
  const { t } = useLang()

  const typeKeys: Type[] = [
    "shortText",
    "longText",
    "number",
    "date",
    "image",
    "video",
    "audio",
    "file",
    "color",
    "url",
    "time",
    "dateTime",
  ]

  const sampleTypes = React.useMemo(
    () =>
      typeKeys.map((type) => ({
        type,
        label: t(`guidePage.types.${type}.label`),
        desc: t(`guidePage.types.${type}.desc`),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t]
  )

  return (
    <div className="w-full animate-in space-y-8 pb-16 duration-300 fade-in-50">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-linear-to-br from-primary/10 via-background to-muted/40 p-6 shadow-xs sm:p-10">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Compass className="size-3.5" />
            <span>{t("guidePage.badge")}</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            {t("guidePage.title")}
          </h1>

          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("guidePage.description")}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              onClick={() => navigate("/d?tab=entities")}
              className="cursor-pointer gap-2 shadow-xs"
            >
              <Sparkles className="size-4" />
              <span>{t("guidePage.startBtn")}</span>
            </Button>
          </div>
        </div>

        {/* Decorative background grid & blur */}
        <div className="pointer-events-none absolute -top-16 -right-16 size-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 size-48 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40 dark:bg-[radial-gradient(#334155_1px,transparent_1px)]" />
      </div>

      {/* 2. THỰC THỂ LÀ GÌ? */}
      <div className="relative space-y-4 overflow-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-2xs sm:p-8">
        <div className="pointer-events-none absolute -top-12 -right-12 size-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 size-36 rounded-full bg-blue-500/10 blur-2xl" />

        <div className="relative z-10 flex items-center gap-2 text-base font-black text-primary sm:text-lg">
          <HelpCircle className="size-5" />
          <h2>{t("guidePage.whatIsEntityTitle")}</h2>
        </div>

        <div className="relative z-10 grid grid-cols-1 gap-4 pt-1 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-4">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
              1
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {t("guidePage.flexibleNoteTitle")}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t("guidePage.flexibleNoteDesc_prefix")}
                <strong className="rounded bg-primary/10 px-1.5 py-0.5 font-semibold text-primary">
                  {t("guidePage.information")}
                </strong>
                {t("guidePage.flexibleNoteDesc_suffix")}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-4">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
              2
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {t("guidePage.variousDataTypesTitle")}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t("guidePage.variousDataTypesDesc_prefix")}
                <strong className="rounded bg-primary/10 px-1.5 py-0.5 font-semibold text-primary">
                  {t("guidePage.dataType")}
                </strong>
                {t("guidePage.variousDataTypesDesc_suffix")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. LÀM SAO ĐỂ TẠO 1 THỰC THỂ? */}
      <div className="relative space-y-6 overflow-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-2xs sm:p-8">
        <div className="pointer-events-none absolute -top-12 -left-12 size-48 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-12 -bottom-12 size-40 rounded-full bg-primary/10 blur-2xl" />

        <div className="relative z-10 flex items-center gap-2 text-base font-black text-primary sm:text-lg">
          <Sparkles className="size-5" />
          <h2>{t("guidePage.howToCreateTitle")}</h2>
        </div>

        <div className="relative z-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Step 1: Template */}
          <Card className="flex flex-col border-border/80 shadow-2xs transition-colors hover:border-primary/50">
            <CardHeader className="space-y-2 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10 text-sm font-bold text-blue-600 dark:text-blue-400">
                  01
                </div>
                <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {t("guidePage.step1Badge")}
                </span>
              </div>
              <CardTitle className="text-base font-semibold">
                {t("guidePage.step1Title")}
              </CardTitle>
              <CardDescription className="text-xs">
                {t("guidePage.step1Desc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-3 text-xs leading-relaxed text-muted-foreground">
              <p>{t("guidePage.step1Body")}</p>
            </CardContent>
          </Card>

          {/* Step 2: Entity */}
          <Card className="flex flex-col border-border/80 shadow-2xs transition-colors hover:border-primary/50">
            <CardHeader className="space-y-2 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  02
                </div>
                <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  {t("guidePage.step2Badge")}
                </span>
              </div>
              <CardTitle className="text-base font-semibold">
                {t("guidePage.step2Title")}
              </CardTitle>
              <CardDescription className="text-xs">
                {t("guidePage.step2Desc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-3 text-xs leading-relaxed text-muted-foreground">
              <p>{t("guidePage.step2Body")}</p>
            </CardContent>
          </Card>

          {/* Step 3: Relationship */}
          <Card className="flex flex-col border-border/80 shadow-2xs transition-colors hover:border-primary/50">
            <CardHeader className="space-y-2 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex size-9 items-center justify-center rounded-lg bg-purple-500/10 text-sm font-bold text-purple-600 dark:text-purple-400">
                  03
                </div>
                <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-[11px] font-medium text-purple-600 dark:text-purple-400">
                  {t("guidePage.step3Badge")}
                </span>
              </div>
              <CardTitle className="text-base font-semibold">
                {t("guidePage.step3Title")}
              </CardTitle>
              <CardDescription className="text-xs">
                {t("guidePage.step3Desc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-3 text-xs leading-relaxed text-muted-foreground">
              <p>
                {t("guidePage.step3Body_prefix")}
                <strong className="rounded bg-primary/10 px-1.5 py-0.5 font-semibold text-primary">
                  {t("guidePage.relationships")}
                </strong>
                {t("guidePage.step3Body_suffix")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 4. HỆ THỐNG 12+ KIỂU DỮ LIỆU */}
      <div className="relative space-y-4 overflow-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-2xs sm:p-8">
        <div className="pointer-events-none absolute -top-12 -right-12 size-52 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 size-40 rounded-full bg-indigo-500/10 blur-2xl" />

        <div className="relative z-10 flex items-center gap-2 text-base font-black text-primary sm:text-lg">
          <TypeIcon className="size-5" />
          <h2>{t("guidePage.dataTypesTitle")}</h2>
        </div>

        <div className="relative z-10 grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {sampleTypes.map((item) => (
            <div
              key={item.type}
              className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-muted/20 p-2.5 transition-colors hover:border-border"
            >
              <div className="mt-0.5 shrink-0 text-muted-foreground">
                {getTypeIcon(item.type)}
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="truncate text-xs font-semibold text-foreground">
                  {item.label}
                </p>
                <p className="line-clamp-2 text-[11px] text-muted-foreground">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. QUY TẮC "ĐẦU TIÊN LÀ QUAN TRỌNG NHẤT" */}
      <div className="relative space-y-6 overflow-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-2xs sm:p-8">
        <div className="pointer-events-none absolute -top-12 -left-12 size-48 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-12 -bottom-12 size-40 rounded-full bg-primary/10 blur-2xl" />

        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2 text-base font-black text-primary sm:text-lg">
            <Sliders className="size-5" />
            <h2>{t("guidePage.ruleTitle")}</h2>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
            {t("guidePage.ruleSubtitle")}
          </p>
        </div>

        {/* 3 Core Rules */}
        <div className="relative z-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2 rounded-xl border border-border/60 bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <TypeIcon className="size-4" />
              <span>{t("guidePage.entityNameTitle")}</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("guidePage.entityNameDesc_prefix")}
              <strong className="rounded bg-primary/10 px-1 py-0.5 font-semibold text-foreground">
                {t("guidePage.shortTextType")}
              </strong>
              .
            </p>
          </div>

          <div className="space-y-2 rounded-xl border border-border/60 bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-purple-500">
              <Palette className="size-4" />
              <span>{t("guidePage.entityColorTitle")}</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("guidePage.entityColorDesc_prefix")}
              <strong className="rounded bg-purple-500/10 px-1 py-0.5 font-semibold text-foreground">
                {t("guidePage.colorType")}
              </strong>
              .
            </p>
          </div>

          <div className="space-y-2 rounded-xl border border-border/60 bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-500">
              <ImageIcon className="size-4" />
              <span>{t("guidePage.entityImageTitle")}</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("guidePage.entityImageDesc_prefix")}
              <strong className="rounded bg-blue-500/10 px-1 py-0.5 font-semibold text-foreground">
                {t("guidePage.imageType")}
              </strong>
              .
            </p>
          </div>
        </div>
      </div>

      {/* 6. LƯU FILE Ở ĐÂU? */}
      <div className="relative space-y-6 overflow-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-2xs sm:p-8">
        <div className="pointer-events-none absolute -top-12 -right-12 size-48 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 size-36 rounded-full bg-teal-500/10 blur-2xl" />

        <div className="relative z-10 flex items-center gap-2 text-base font-black text-primary sm:text-lg">
          <Database className="size-5" />
          <h2>{t("guidePage.storageTitle")}</h2>
        </div>

        <div className="relative z-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="border-border/80 shadow-2xs">
            <CardHeader className="space-y-2 pb-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="size-5" />
              </div>
              <CardTitle className="text-base font-semibold">
                {t("guidePage.localStorageTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs leading-relaxed text-muted-foreground">
              <p>
                {t("guidePage.localStorageDesc1_prefix")}
                <strong className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
                  {t("guidePage.yourDevice")}
                </strong>
                {t("guidePage.localStorageDesc1_suffix")}
              </p>
              <p>{t("guidePage.localStorageDesc2")}</p>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-2xs">
            <CardHeader className="space-y-2 pb-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <FolderSync className="size-5" />
              </div>
              <CardTitle className="text-base font-semibold">
                {t("guidePage.shareFileTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs leading-relaxed text-muted-foreground">
              <p>
                {t("guidePage.shareFileDesc1_prefix")}
                <code className="rounded bg-primary/10 px-1.5 py-0.5 font-semibold text-primary">
                  .silic
                </code>
                .
              </p>
              <p>{t("guidePage.shareFileDesc2")}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default GuidePage
