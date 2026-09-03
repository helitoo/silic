import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import emailjs from "@emailjs/browser"
import {
  Mail,
  Send,
  Loader2,
  HelpCircle,
  Sparkles,
  BookOpen,
  MessageSquare,
  Heading1,
  AtSign,
  ExternalLink,
  ShieldQuestion,
  Share2,
  Globe,
  User,
  AlertCircle,
} from "lucide-react"

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className || "size-4"}
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}

import { useLang } from "@/contexts/LangContext"
import { useRouter } from "@/contexts/RouterContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

const DAILY_EMAIL_LIMIT = 2
const EMAIL_SENT_KEY = "silic_help_email_quota"

interface DailyEmailQuota {
  date: string
  count: number
}

function getTodayDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function getDailyEmailCount(): number {
  try {
    const raw = localStorage.getItem(EMAIL_SENT_KEY)
    if (!raw) return 0
    const data: DailyEmailQuota = JSON.parse(raw)
    const today = getTodayDateString()
    if (data.date === today && typeof data.count === "number") {
      return data.count
    }
    return 0
  } catch (e) {
    console.error("Failed to parse email quota from localStorage:", e)
    return 0
  }
}

function incrementDailyEmailCount(): number {
  try {
    const today = getTodayDateString()
    const currentCount = getDailyEmailCount()
    const newCount = currentCount + 1
    const data: DailyEmailQuota = {
      date: today,
      count: newCount,
    }
    localStorage.setItem(EMAIL_SENT_KEY, JSON.stringify(data))
    return newCount
  } catch (e) {
    console.error("Failed to update email quota in localStorage:", e)
    return 0
  }
}

const helpSchema = z.object({
  title: z.string().trim().min(1, { message: "titleRequired" }),
  email: z
    .string()
    .trim()
    .min(1, { message: "emailRequired" })
    .email({ message: "emailInvalid" }),
  message: z.string().trim().min(10, { message: "messageMinLength" }),
})

type HelpFormData = z.infer<typeof helpSchema>

export function HelpPage() {
  const { t } = useLang()
  const { navigate } = useRouter()
  const [sentCount, setSentCount] = useState<number>(() => getDailyEmailCount())
  const isLimitReached = sentCount >= DAILY_EMAIL_LIMIT

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === EMAIL_SENT_KEY) {
        setSentCount(getDailyEmailCount())
      }
    }
    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HelpFormData>({
    resolver: zodResolver(helpSchema),
    defaultValues: {
      title: "",
      email: "",
      message: "",
    },
  })

  const manualMailtoHref =
    "mailto:bao162006@gmail.com?subject=Silic%20Support%20Inquiry"

  const onSubmit = async (data: HelpFormData) => {
    const currentCount = getDailyEmailCount()
    if (currentCount >= DAILY_EMAIL_LIMIT) {
      setSentCount(currentCount)
      toast.add({
        title: t("helpPage.rateLimitTitle"),
        description: t("helpPage.rateLimitDesc"),
        type: "error",
      })
      return
    }

    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID

    if (!publicKey || !serviceId || !templateId) {
      toast.add({
        title: t("helpPage.sendErrorTitle"),
        description: t("helpPage.missingConfig"),
        type: "error",
      })
      return
    }

    try {
      await emailjs.send(
        serviceId,
        templateId,
        {
          title: data.title,
          email: data.email,
          message: data.message,
          from_name: data.email,
          from_email: data.email,
          reply_to: data.email,
          subject: data.title,
        },
        publicKey
      )

      const newCount = incrementDailyEmailCount()
      setSentCount(newCount)

      toast.add({
        title: t("helpPage.sendSuccessTitle"),
        description: t("helpPage.sendSuccessDesc"),
        type: "success",
      })

      reset()
    } catch (err: unknown) {
      console.error("EmailJS Error:", err)
      const errObj = err as { text?: string; message?: string } | undefined
      toast.add({
        title: t("helpPage.sendErrorTitle"),
        description:
          errObj?.text || errObj?.message || t("helpPage.sendErrorDesc"),
        type: "error",
      })
    }
  }

  const getErrorMessage = (errorKey?: string) => {
    if (!errorKey) return undefined
    return t(`helpPage.${errorKey}`) || errorKey
  }

  return (
    <div className="w-full animate-in space-y-8 pb-16 duration-300 fade-in-50">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-linear-to-br from-primary/10 via-background to-muted/40 p-6 shadow-xs sm:p-10">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Mail className="size-3.5" />
            <span>{t("helpPage.badge")}</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            {t("helpPage.title")}
          </h1>

          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("helpPage.subtitle")}
          </p>
        </div>

        {/* Decorative background grid & blur */}
        <div className="pointer-events-none absolute -top-16 -right-16 size-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 size-48 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40 dark:bg-[radial-gradient(#334155_1px,transparent_1px)]" />
      </div>

      {/* 2. Main Content: Form (Left) & Quick Help Cards (Right) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Contact / Help Form */}
        <div className="lg:col-span-7">
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="space-y-1.5 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-primary">
                  <MessageSquare className="size-5" />
                  <CardTitle className="text-lg font-bold">
                    {t("helpPage.formCardTitle")}
                  </CardTitle>
                </div>
                <div
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                    isLimitReached
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : "border-border/80 bg-muted/40 text-muted-foreground"
                  )}
                >
                  <Mail className="size-3" />
                  <span>
                    {t("helpPage.dailyQuotaLabel")}:{" "}
                    <strong
                      className={
                        isLimitReached
                          ? "font-bold text-amber-600 dark:text-amber-400"
                          : "font-semibold text-foreground"
                      }
                    >
                      {sentCount}/{DAILY_EMAIL_LIMIT}
                    </strong>
                  </span>
                </div>
              </div>
              <CardDescription className="text-xs sm:text-sm">
                {t("helpPage.formCardDesc")}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Daily Limit Reached Warning Banner */}
              {isLimitReached && (
                <div className="animate-in space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-foreground duration-300 fade-in-50 sm:text-sm">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-500" />
                    <div className="space-y-1">
                      <h4 className="font-semibold text-amber-600 dark:text-amber-400">
                        {t("helpPage.limitReachedAlertTitle")}
                      </h4>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {t("helpPage.limitReachedAlertDesc")}
                      </p>
                      <a
                        href={manualMailtoHref}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
                      >
                        <Mail className="size-3.5" />
                        <span>{t("helpPage.manualMailBtn")}</span>
                        <ExternalLink className="size-3" />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-5"
                noValidate
              >
                <FieldGroup className="gap-4">
                  {/* Field 1: Title */}
                  <Field data-invalid={!!errors.title}>
                    <FieldLabel
                      htmlFor="help-title"
                      className="flex items-center gap-1.5 text-xs font-semibold"
                    >
                      <Heading1 className="size-3.5 text-muted-foreground" />
                      <span>{t("helpPage.titleLabel")}</span>
                      <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      id="help-title"
                      type="text"
                      placeholder={t("helpPage.titlePlaceholder")}
                      className="h-9 px-3 text-xs sm:text-sm"
                      disabled={isSubmitting || isLimitReached}
                      {...register("title")}
                    />
                    {errors.title && (
                      <FieldError>
                        {getErrorMessage(errors.title.message)}
                      </FieldError>
                    )}
                  </Field>

                  {/* Field 2: Email */}
                  <Field data-invalid={!!errors.email}>
                    <FieldLabel
                      htmlFor="help-email"
                      className="flex items-center gap-1.5 text-xs font-semibold"
                    >
                      <AtSign className="size-3.5 text-muted-foreground" />
                      <span>{t("helpPage.emailLabel")}</span>
                      <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      id="help-email"
                      type="email"
                      placeholder={t("helpPage.emailPlaceholder")}
                      className="h-9 px-3 text-xs sm:text-sm"
                      disabled={isSubmitting || isLimitReached}
                      {...register("email")}
                    />
                    {errors.email && (
                      <FieldError>
                        {getErrorMessage(errors.email.message)}
                      </FieldError>
                    )}
                  </Field>

                  {/* Field 3: Message */}
                  <Field data-invalid={!!errors.message}>
                    <FieldLabel
                      htmlFor="help-message"
                      className="flex items-center gap-1.5 text-xs font-semibold"
                    >
                      <MessageSquare className="size-3.5 text-muted-foreground" />
                      <span>{t("helpPage.messageLabel")}</span>
                      <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Textarea
                      id="help-message"
                      rows={5}
                      placeholder={t("helpPage.messagePlaceholder")}
                      className="min-h-28 px-3 py-2 text-xs sm:text-sm"
                      disabled={isSubmitting || isLimitReached}
                      {...register("message")}
                    />
                    {errors.message && (
                      <FieldError>
                        {getErrorMessage(errors.message.message)}
                      </FieldError>
                    )}
                  </Field>
                </FieldGroup>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting || isLimitReached}
                    className="w-full cursor-pointer gap-2 shadow-xs sm:w-auto sm:min-w-40"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>{t("helpPage.sendingBtn")}</span>
                      </>
                    ) : isLimitReached ? (
                      <>
                        <AlertCircle className="size-4" />
                        <span>{t("helpPage.limitReachedBtn")}</span>
                      </>
                    ) : (
                      <>
                        <Send className="size-4" />
                        <span>{t("helpPage.submitBtn")}</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Quick FAQs & Resources */}
        <div className="space-y-6 lg:col-span-5">
          {/* Quick FAQ Card */}
          <Card className="border-border/80 shadow-2xs">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <HelpCircle className="size-4" />
                <span>{t("helpPage.resourcesTitle")}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="space-y-1.5 rounded-lg border border-border/60 bg-muted/20 p-3">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <ShieldQuestion className="size-3.5 text-primary" />
                  <span>{t("helpPage.faq1Title")}</span>
                </div>
                <p className="leading-relaxed text-muted-foreground">
                  {t("helpPage.faq1Desc")}
                </p>
              </div>

              <div className="space-y-1.5 rounded-lg border border-border/60 bg-muted/20 p-3">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Share2 className="size-3.5 text-primary" />
                  <span>{t("helpPage.faq2Title")}</span>
                </div>
                <p className="leading-relaxed text-muted-foreground">
                  {t("helpPage.faq2Desc")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* User Guide Card */}
          <Card className="border-border/80 shadow-2xs">
            <CardHeader className="space-y-1.5 pb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
                <BookOpen className="size-4" />
                <span>{t("helpPage.guideCardTitle")}</span>
              </div>
              <CardDescription className="text-xs">
                {t("helpPage.guideCardDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/guide")}
                className="w-full cursor-pointer justify-between text-xs"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="size-3.5 text-primary" />
                  {t("helpPage.guideBtn")}
                </span>
                <ExternalLink className="size-3 text-muted-foreground" />
              </Button>
            </CardContent>
          </Card>

          {/* Developer / Maintainer Card */}
          <Card className="border-border/80 shadow-2xs">
            <CardHeader className="space-y-1.5 pb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <User className="size-4 text-primary" />
                <span>{t("helpPage.developerCardTitle")}</span>
              </div>
              <CardDescription className="text-xs">
                {t("helpPage.developerCardDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {/* Developer */}
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                <span className="text-muted-foreground">
                  {t("helpPage.developerLabel")}
                </span>
                <span className="font-semibold text-foreground">
                  {t("helpPage.developerName")}
                </span>
              </div>

              {/* Email */}
              <a
                href="mailto:bao162006@gmail.com"
                className="group flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2 transition-colors hover:border-primary/50 hover:bg-muted/40"
              >
                <span className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground">
                  <Mail className="size-3.5 text-primary" />
                  <span>{t("helpPage.contactEmailLabel")}</span>
                </span>
                <span className="font-medium text-foreground underline-offset-4 group-hover:underline">
                  bao162006@gmail.com
                </span>
              </a>

              {/* GitHub Repo */}
              <a
                href="https://github.com/helitoo/silic"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2 transition-colors hover:border-primary/50 hover:bg-muted/40"
              >
                <span className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground">
                  <GithubIcon className="size-3.5" />
                  <span>{t("helpPage.githubRepoLabel")}</span>
                </span>
                <span className="flex items-center gap-1 font-medium text-foreground underline-offset-4 group-hover:underline">
                  <span>helitoo/silic</span>
                  <ExternalLink className="size-3 text-muted-foreground" />
                </span>
              </a>

              {/* Project Website */}
              <a
                href="https://silic.kemlib.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2 transition-colors hover:border-primary/50 hover:bg-muted/40"
              >
                <span className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground">
                  <Globe className="size-3.5 text-blue-500" />
                  <span>{t("helpPage.projectWebsiteLabel")}</span>
                </span>
                <span className="flex items-center gap-1 font-medium text-foreground underline-offset-4 group-hover:underline">
                  <span>silic.kemlib.com</span>
                  <ExternalLink className="size-3 text-muted-foreground" />
                </span>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default HelpPage
