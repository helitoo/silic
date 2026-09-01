import { FileQuestion, Home, ArrowLeft } from "lucide-react"
import { useRouter } from "@/contexts/RouterContext"
import { useLang } from "@/contexts/LangContext"
import { Button } from "@/components/ui/button"

export function NotFoundPage() {
  const { navigate, goBack, canGoBack } = useRouter()
  const { t } = useLang()

  return (
    <div className="flex min-h-[65vh] w-full animate-in flex-col items-center justify-center px-4 py-12 text-center duration-300 fade-in-50">
      <div className="relative mb-6 flex size-24 items-center justify-center rounded-3xl border border-border/80 bg-muted/60 text-muted-foreground shadow-inner">
        <div className="absolute -inset-1 -z-10 rounded-3xl bg-linear-to-tr from-primary/20 via-sky-400/20 to-purple-500/20 blur-md" />
        <FileQuestion className="size-12 stroke-[1.5] text-primary" />
      </div>

      <div className="max-w-md space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          404
        </h1>
        <h2 className="text-lg font-semibold text-foreground">
          {t("notFound.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("notFound.description")}
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {canGoBack && (
          <Button
            type="button"
            variant="outline"
            onClick={() => goBack("/d?tab=entities")}
            className="gap-2 rounded-xl"
          >
            <ArrowLeft className="size-4" />
            <span>{t("notFound.back")}</span>
          </Button>
        )}

        <Button
          type="button"
          onClick={() => navigate("/d?tab=entities")}
          className="gap-2 rounded-xl shadow-xs"
        >
          <Home className="size-4" />
          <span>{t("notFound.backHome")}</span>
        </Button>
      </div>
    </div>
  )
}

export default NotFoundPage
