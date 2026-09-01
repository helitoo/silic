import * as React from "react"
import {
  Code2,
  HelpCircle,
  Play,
  RotateCcw,
  Terminal,
  Trash2,
  X,
} from "lucide-react"
import { useQuery } from "@/contexts/QueryContext"
import { useLang } from "@/contexts/LangContext"
import { SilicParser } from "@/lib/query"
import { toast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"

export function EntityQuerySheet() {
  const {
    setEntityQuery,
    executeEntityQuery,
    resetEntities,
    isEntityQueryOpen,
    setIsEntityQueryOpen,
  } = useQuery()
  const { t } = useLang()

  const [queryCode, setQueryCode] = React.useState<string>("")
  const [showHelp, setShowHelp] = React.useState<boolean>(false)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Auto-focus textarea when opened
  React.useEffect(() => {
    if (isEntityQueryOpen) {
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    }
  }, [isEntityQueryOpen])

  // Handle Tab key for 4 spaces indentation & Ctrl+Enter to execute
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault()
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const val = textarea.value
      const newVal = val.substring(0, start) + "    " + val.substring(end)
      setQueryCode(newVal)
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4
      })
      return
    }

    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault()
      handleExecute()
    }
  }

  const handleExecute = () => {
    const trimmed = queryCode.trim()
    if (!trimmed) {
      toast.add({
        type: "error",
        title: t("query.noQuerySpecified"),
        description: t("query.noQuerySpecifiedDesc"),
      })
      return
    }

    try {
      const ast = SilicParser.parse(trimmed)
      setEntityQuery(ast)
      const results = executeEntityQuery(ast)

      // Close dialog upon execution so user can see filtered results
      setIsEntityQueryOpen(false)

      toast.add({
        type: "success",
        title: t("query.executedEntityQuery"),
        description: t("query.foundEntitiesCount", { count: results.length }),
      })
    } catch (err: any) {
      toast.add({
        type: "error",
        title: t("query.syntaxError"),
        description: err.message || t("query.couldNotParseQuery"),
      })
    }
  }

  const handleReset = () => {
    setQueryCode("")
    setEntityQuery(undefined)
    resetEntities()
    toast.add({
      type: "info",
      title: t("query.queryReset"),
      description: t("query.filterCleared"),
    })
  }

  const handleClear = () => {
    setQueryCode("")
  }

  // Calculate line numbers for the editor
  const lineCount = Math.max(1, queryCode.split("\n").length)
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1)

  return (
    <Dialog open={isEntityQueryOpen} onOpenChange={setIsEntityQueryOpen}>
      <DialogContent
        showCloseButton={false}
        className="fixed top-1/2 left-1/2 z-50 flex h-[100dvh] max-h-full w-[100vw] max-w-full -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-none border border-border bg-card p-0 shadow-2xl md:h-[85vh] md:max-h-[90vh] md:w-[90vw] md:max-w-5xl md:rounded-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 flex-row items-center justify-between gap-3 border-b border-border/60 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-8.5 shrink-0 items-center justify-center rounded-full bg-[#4C97FF] text-white shadow-xs">
              <Terminal className="size-4.5" />
            </div>
            <DialogTitle className="truncate text-sm font-bold text-foreground sm:text-base">
              {t("query.entityQueryTitle")}
            </DialogTitle>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowHelp(!showHelp)}
              className="h-8 gap-1 px-2.5 text-xs text-muted-foreground hover:text-foreground"
              title="Syntax reference"
            >
              <HelpCircle className="size-3.5" />
              <span className="hidden sm:inline">Syntax Guide</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-8 gap-1 px-2.5 text-xs"
              title={t("query.resetQuery")}
            >
              <RotateCcw className="size-3.5" />
              <span className="hidden sm:inline">{t("query.resetQuery")}</span>
            </Button>

            {queryCode && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-8 gap-1 px-2.5 text-xs text-destructive hover:bg-destructive/10"
                title={t("query.clearQuery")}
              >
                <Trash2 className="size-3.5" />
                <span className="hidden sm:inline">{t("query.clearQuery")}</span>
              </Button>
            )}

            {/* Execute Button */}
            <Button
              type="button"
              size="sm"
              onClick={handleExecute}
              className="h-8 gap-1.5 rounded-lg bg-[#59C059] px-3.5 text-xs font-bold text-white shadow-xs hover:bg-[#389438]"
              title="Execute query (Ctrl+Enter)"
            >
              <Play className="size-3.5 fill-current" />
              <span>{t("query.execute")}</span>
            </Button>

            {/* Close Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsEntityQueryOpen(false)}
              className="ml-1 size-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Close dialog"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Syntax Reference Collapsible */}
        {showHelp && (
          <div className="shrink-0 border-b border-border/60 bg-muted/40 p-4 text-xs">
            <div className="mb-2 font-bold text-foreground">
              📖 SILIC Syntax Reference:
            </div>
            <div className="grid grid-cols-1 gap-2 text-muted-foreground sm:grid-cols-2 md:grid-cols-4 font-mono text-[11px]">
              <div className="rounded border border-border/50 bg-background/60 p-2">
                <div className="font-semibold text-primary">RECORD SELECTORS</div>
                <div>.recordName</div>
                <div>."record name"</div>
                <div>"template"."record"</div>
                <div>["t1", "t2"]."record"</div>
              </div>
              <div className="rounded border border-border/50 bg-background/60 p-2">
                <div className="font-semibold text-primary">TRAVERSAL</div>
                <div>SELF &lt;-- (...)</div>
                <div>SELF &lt;--2-- (...)</div>
                <div>NEIGHBORS &lt;-- (...)</div>
                <div>SELF (."role" = "...") &lt;-- (...)</div>
              </div>
              <div className="rounded border border-border/50 bg-background/60 p-2">
                <div className="font-semibold text-primary">DATE FUNCTIONS</div>
                <div>YEAR(."date") = 2026</div>
                <div>MONTH(."date") = 9</div>
                <div>DAY(."date") = 1</div>
              </div>
              <div className="rounded border border-border/50 bg-background/60 p-2">
                <div className="font-semibold text-primary">TEMPLATES &amp; OPS</div>
                <div>"templateName". = TRUE</div>
                <div>=, !=, &gt;, &lt;, &gt;=, &lt;=, ~</div>
                <div>+, -, *, /, IN, ! (NOT)</div>
                <div>AND, OR, TRUE, FALSE</div>
              </div>
            </div>
          </div>
        )}

        {/* Textarea Code Editor Area */}
        <div className="relative flex flex-1 overflow-hidden bg-[#1E1E2E] text-[#CDD6F4] select-text">
          {/* Line Numbers */}
          <div className="flex shrink-0 flex-col items-end border-r border-white/10 bg-[#181825] py-4 pr-3 pl-4 font-mono text-xs text-white/30 select-none">
            {lineNumbers.map((num) => (
              <div key={num} className="leading-6">
                {num}
              </div>
            ))}
          </div>

          {/* Textarea */}
          <div className="relative flex-1 p-0">
            <textarea
              ref={textareaRef}
              value={queryCode}
              onChange={(e) => setQueryCode(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`-- Enter SILIC query here (e.g.)\n(."tên" = "Hoa") AND (."tuổi tác" > 10)\n\n-- Or graph traversal:\n(SELF <-- ."tên" = "Hoa") AND (NEIGHBORS <-- ."tuổi tác" > 10)\n\n-- Template-specific:\n"Person"."tên" = "Hoa"\n\n-- Literal evaluation (e.g. "a" = "a" returns true for all items):\n"a" = "a"`}
              spellCheck={false}
              className="h-full w-full resize-none border-none bg-transparent p-4 font-mono text-xs leading-6 text-[#CDD6F4] placeholder:text-white/20 focus:outline-none sm:text-sm"
            />
          </div>
        </div>

        {/* Status / Footer */}
        <div className="flex shrink-0 flex-row items-center justify-between border-t border-border/60 bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Code2 className="size-3.5 text-primary" />
              <span>Language: SILIC</span>
            </span>
            <span>Tab = 4 spaces</span>
            <span className="hidden sm:inline">Ctrl+Enter to Execute</span>
          </div>
          <div>
            <span>{lineCount} lines</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default EntityQuerySheet

