import * as React from "react"
import {
  ArrowRight,
  Code2,
  HelpCircle,
  Play,
  RotateCcw,
  Route,
  Trash2,
  X,
} from "lucide-react"
import { useQuery } from "@/contexts/QueryContext"
import { useLang } from "@/contexts/LangContext"
import { SilicParser } from "@/lib/query"
import type { PathQuery } from "@/lib/query-types"
import { toast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { EntitySelect } from "./components/EntitySelect"

export function PathQuerySheet() {
  const {
    pathQuery,
    setPathQuery,
    executePathQuery,
    isPathQueryOpen,
    setIsPathQueryOpen,
  } = useQuery()
  const { t } = useLang()

  const [fromEntityId, setFromEntityId] = React.useState<string>(
    pathQuery?.from || ""
  )
  const [toEntityId, setToEntityId] = React.useState<string>(
    pathQuery?.to || ""
  )
  const [queryCode, setQueryCode] = React.useState<string>(
    pathQuery?.code || ""
  )
  const [showHelp, setShowHelp] = React.useState<boolean>(false)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Sync with context when dialog opens
  React.useEffect(() => {
    if (isPathQueryOpen) {
      setFromEntityId(pathQuery?.from || "")
      setToEntityId(pathQuery?.to || "")
      setQueryCode(pathQuery?.code || "")
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    }
  }, [isPathQueryOpen, pathQuery])

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
    if (!fromEntityId || !toEntityId) {
      toast.add({
        type: "error",
        title: t("query.missingEntitySelection"),
        description: t("query.missingEntitySelectionDesc"),
      })
      return
    }

    const trimmed = queryCode.trim()
    let pathAst = undefined

    if (trimmed) {
      try {
        pathAst = SilicParser.parsePath(trimmed)
      } catch (err: any) {
        toast.add({
          type: "error",
          title: t("query.syntaxError"),
          description: err.message || t("query.couldNotParseQuery"),
        })
        return
      }
    }

    const newQuery: PathQuery = {
      from: fromEntityId,
      to: toEntityId,
      code: queryCode,
      where: pathAst,
    }

    setPathQuery(newQuery)
    const result = executePathQuery(newQuery)
    setIsPathQueryOpen(false)

    if (result.found) {
      toast.add({
        type: "success",
        title: t("query.executedPathQuery"),
        description: t("query.pathFound", { count: result.connections.length }),
      })
    } else {
      toast.add({
        type: "warning",
        title: t("query.executedPathQuery"),
        description: t("query.pathNotFound"),
      })
    }
  }

  const handleReset = () => {
    setFromEntityId("")
    setToEntityId("")
    setQueryCode("")
    setPathQuery(undefined)
    toast.add({
      type: "info",
      title: t("query.queryReset"),
      description: t("query.filterCleared"),
    })
  }

  const handleClear = () => {
    setQueryCode("")
  }

  const lineCount = Math.max(1, queryCode.split("\n").length)
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1)
  const hasContent = Boolean(fromEntityId || toEntityId || queryCode)

  return (
    <Dialog open={isPathQueryOpen} onOpenChange={setIsPathQueryOpen}>
      <DialogContent
        showCloseButton={false}
        className="fixed top-1/2 left-1/2 z-50 flex h-[100dvh] max-h-full w-[100vw] max-w-full -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-none border border-border bg-card p-0 shadow-2xl md:h-[85vh] md:max-h-[90vh] md:w-[90vw] md:max-w-5xl md:rounded-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 flex-row items-center justify-between gap-3 border-b border-border/60 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-8.5 shrink-0 items-center justify-center rounded-full bg-[#9966FF] text-white shadow-xs">
              <Route className="size-4.5" />
            </div>
            <DialogTitle className="truncate text-sm font-bold text-foreground sm:text-base">
              {t("query.pathQueryTitle")}
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

            {hasContent && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-8 gap-1 px-2.5 text-xs text-destructive hover:bg-destructive/10"
                title={t("query.clearQuery")}
              >
                <Trash2 className="size-3.5" />
                <span className="hidden sm:inline">
                  {t("query.clearQuery")}
                </span>
              </Button>
            )}

            {/* Execute Button */}
            <Button
              type="button"
              size="sm"
              onClick={handleExecute}
              className="h-8 gap-1.5 rounded-lg bg-[#59C059] px-3.5 text-xs font-bold text-white shadow-xs hover:bg-[#389438]"
              title="Execute path search (Ctrl+Enter)"
            >
              <Play className="size-3.5 fill-current" />
              <span>{t("query.execute")}</span>
            </Button>

            {/* Close Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsPathQueryOpen(false)}
              className="ml-1 size-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Close dialog"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* From -> To Entity Selection Bar */}
        <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border/60 bg-muted/20 px-4 py-2.5 sm:px-6">
          <div className="flex flex-1 min-w-[200px] items-center gap-2">
            <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase whitespace-nowrap">
              {t("query.fromEntity")}:
            </span>
            <EntitySelect
              value={fromEntityId}
              onChange={setFromEntityId}
              placeholder={t("query.fromEntity")}
              className="flex-1"
            />
          </div>

          <div className="flex shrink-0 items-center justify-center text-muted-foreground">
            <ArrowRight className="size-4 stroke-[2]" />
          </div>

          <div className="flex flex-1 min-w-[200px] items-center gap-2">
            <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase whitespace-nowrap">
              {t("query.toEntity")}:
            </span>
            <EntitySelect
              value={toEntityId}
              onChange={setToEntityId}
              placeholder={t("query.toEntity")}
              className="flex-1"
            />
          </div>
        </div>

        {/* Syntax Reference Collapsible */}
        {showHelp && (
          <div className="shrink-0 border-b border-border/60 bg-muted/40 p-4 text-xs">
            <div className="mb-2 font-bold text-foreground">
              📖 SILIC Path Query Syntax Reference:
            </div>
            <div className="grid grid-cols-1 gap-2 text-muted-foreground sm:grid-cols-2 md:grid-cols-4 font-mono text-[11px]">
              <div className="rounded border border-border/50 bg-background/60 p-2">
                <div className="font-semibold text-primary">PATH STRUCTURE</div>
                <div>(connCondition) &lt;-- (entityCondition)</div>
                <div>(TEMPLATE = "Friend") &lt;-- (*.tuổi &gt; 10)</div>
              </div>
              <div className="rounded border border-border/50 bg-background/60 p-2">
                <div className="font-semibold text-primary">SEQUENCE &amp; OR</div>
                <div>A &lt;&lt; B (A before B)</div>
                <div>A || B (At least A or B)</div>
                <div>A AND B (Both required)</div>
              </div>
              <div className="rounded border border-border/50 bg-background/60 p-2">
                <div className="font-semibold text-primary">QUANTIFIERS</div>
                <div>AVOID A (0 TIMES A)</div>
                <div>2 TIMES A (Exact count)</div>
                <div>ALL TIMES A (ONLY A)</div>
              </div>
              <div className="rounded border border-border/50 bg-background/60 p-2">
                <div className="font-semibold text-primary">EXAMPLE</div>
                <div>((TEMPLATE = "Bạn bè") AND (AVOID TEMPLATE = "Người thân")) &lt;-- (*.Tuổi &gt; 10)</div>
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
              placeholder={`-- Optional SILIC Path Constraints (leave empty for unconstrained shortest path)\n-- Example 1: Relationship & Entity condition\n((TEMPLATE = "Bạn bè") AND (AVOID TEMPLATE = "Người thân")) <-- (*.Tuổi > 10)\n\n-- Example 2: Sequence constraint (A must appear before B along path)\n(TEMPLATE = "Bạn bè") << (TEMPLATE = "Đồng nghiệp")\n\n-- Example 3: Frequency / Exclusivity\nALL TIMES (TEMPLATE = "Bạn bè")`}
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
              <span>Language: SILIC Path</span>
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

export default PathQuerySheet

