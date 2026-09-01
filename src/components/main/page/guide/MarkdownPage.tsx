import * as React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { rehypeMermaid, MermaidBlock } from "react-markdown-mermaid"
import {
  FileCode2,
  HardDrive,
  Loader2,
  AlertCircle,
  ReceiptText,
  ShieldLock,
} from "lucide-react"
import { useLang } from "@/contexts/LangContext"
import { useTheme } from "@/contexts/ThemeContext"
import { Button } from "@/components/ui/button"

export interface MarkdownPageProps {
  doc:
    "silic-query" | "silic-storage" | "terms-of-service" | "policy-of-privacy"
}

export function MarkdownPage({ doc }: MarkdownPageProps) {
  const { t } = useLang()
  const { resolvedTheme } = useTheme()
  const [content, setContent] = React.useState<string>("")
  const [loading, setLoading] = React.useState<boolean>(true)
  const [error, setError] = React.useState<string | null>(null)

  const docConfig = React.useMemo(() => {
    if (doc === "silic-query") {
      return {
        path: "/docs/silic-query.md",
        title: t("navbar.docsQuery") || "Kiến trúc truy vấn",
        badge: "Query Architecture Engine",
        icon: <FileCode2 className="size-4 text-primary" />,
      }
    }
    if (doc === "silic-storage") {
      return {
        path: "/docs/silic-storage.md",
        title: t("navbar.docsStorage") || "Kiến trúc lưu trữ",
        badge: "Local-first Storage Architecture",
        icon: <HardDrive className="size-4 text-primary" />,
      }
    }
    if (doc === "terms-of-service") {
      return {
        path: "/docs/terms-of-service.md",
        title: t("navbar.termsOfService") || "Terms of Service",
        badge: "Legal & Agreement",
        icon: <ReceiptText className="size-4 text-primary" />,
      }
    }
    return {
      path: "/docs/policy-of-privacy.md",
      title: t("navbar.privacyPolicy") || "Privacy Policy",
      badge: "Local Privacy & Rights",
      icon: <ShieldLock className="size-4 text-primary" />,
    }
  }, [doc, t])

  const rehypePlugins = React.useMemo(() => {
    return [
      [
        rehypeMermaid,
        {
          mermaidConfig: {
            theme: resolvedTheme === "dark" ? "dark" : "default",
            flowchart: { useMaxWidth: true },
          },
        },
      ],
    ] as any
  }, [resolvedTheme])

  React.useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)

    fetch(docConfig.path)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load document: ${res.statusText}`)
        }
        return res.text()
      })
      .then((text) => {
        if (isMounted) {
          setContent(text)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Failed to load document content")
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [docConfig.path])

  return (
    <div className="w-full animate-in space-y-6 pb-20 duration-300 fade-in-50">
      {/* Main Document Content */}
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-xs sm:p-10">
        {/* Subtle background glow */}
        <div className="pointer-events-none absolute -top-20 -right-20 size-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 size-60 rounded-full bg-blue-500/5 blur-3xl" />

        {loading ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-xs">Đang tải tài liệu...</p>
          </div>
        ) : error ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-destructive">
            <AlertCircle className="size-8" />
            <p className="text-sm font-semibold">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="mt-2 text-xs"
            >
              Thử lại
            </Button>
          </div>
        ) : (
          <article className="markdown-body relative z-10 mx-auto max-w-none space-y-6 text-sm leading-relaxed text-foreground sm:text-base">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={rehypePlugins}
              components={{
                // @ts-expect-error MermaidBlock is provided by react-markdown-mermaid
                MermaidBlock: MermaidBlock,
                h1: ({ children }) => (
                  <h1 className="mt-2 mb-6 border-b border-border/70 pb-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="mt-8 mb-4 flex items-center gap-2 border-b border-border/50 pb-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    <span className="h-4 w-1 rounded-full bg-primary" />
                    <span>{children}</span>
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mt-6 mb-3 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                    {children}
                  </h3>
                ),
                h4: ({ children }) => (
                  <h4 className="mt-4 mb-2 text-base font-semibold text-foreground">
                    {children}
                  </h4>
                ),
                p: ({ children }) => (
                  <p className="mb-4 leading-relaxed text-foreground/90">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="my-4 list-disc space-y-1.5 pl-6 text-foreground/90">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="my-4 list-decimal space-y-1.5 pl-6 text-foreground/90">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed">{children}</li>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="my-4 rounded-r-lg border-l-4 border-primary bg-primary/5 py-2 pr-4 pl-4 text-muted-foreground italic">
                    {children}
                  </blockquote>
                ),
                code: ({ className, children, ...props }) => {
                  const isInline = !className
                  if (isInline) {
                    return (
                      <code
                        className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold text-primary"
                        {...props}
                      >
                        {children}
                      </code>
                    )
                  }
                  return (
                    <code
                      className={`block text-xs ${className || ""}`}
                      {...props}
                    >
                      {children}
                    </code>
                  )
                },
                pre: ({ children }) => (
                  <pre className="my-4 overflow-x-auto rounded-xl border border-border/80 bg-muted/40 p-4 text-xs leading-normal">
                    {children}
                  </pre>
                ),
                table: ({ children }) => (
                  <div className="my-6 overflow-x-auto rounded-xl border border-border/70 bg-card shadow-2xs">
                    <table className="w-full border-collapse text-left text-xs sm:text-sm">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="border-b border-border/80 bg-muted/50 font-semibold text-foreground">
                    {children}
                  </thead>
                ),
                tbody: ({ children }) => (
                  <tbody className="divide-y divide-border/50">
                    {children}
                  </tbody>
                ),
                tr: ({ children }) => (
                  <tr className="transition-colors hover:bg-muted/20">
                    {children}
                  </tr>
                ),
                th: ({ children }) => (
                  <th className="px-4 py-3 font-semibold text-foreground">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-4 py-3 text-muted-foreground">
                    {children}
                  </td>
                ),
                hr: () => <hr className="my-8 border-border/60" />,
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target={href?.startsWith("http") ? "_blank" : undefined}
                    rel={
                      href?.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                    className="font-medium text-primary underline decoration-primary/40 underline-offset-4 transition-colors hover:text-primary/80 hover:decoration-primary"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </article>
        )}
      </div>
    </div>
  )
}

export default MarkdownPage
