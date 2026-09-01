import * as React from "react"
import { Play, RotateCcw, Route, X } from "lucide-react"
import { useQuery } from "@/contexts/QueryContext"
import { useLang } from "@/contexts/LangContext"
import type { PathQuery } from "@/lib/query-types"
import { toast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { PathBlock } from "./pathBlocks/PathBlock"

const defaultPathQuery: PathQuery = {
  from: "entity-alice",
  to: "entity-mega",
  via: [{ record: "role" }],
}

export function PathQuerySheet() {
  const {
    pathQuery,
    setPathQuery,
    executePathQuery,
    isPathQueryOpen,
    setIsPathQueryOpen,
  } = useQuery()
  const { t } = useLang()

  // Local query state
  const [currentQuery, setCurrentQuery] = React.useState<PathQuery>(
    pathQuery || defaultPathQuery
  )

  // Sync with context when dialog opens
  React.useEffect(() => {
    if (isPathQueryOpen && pathQuery) {
      setCurrentQuery(pathQuery)
    }
  }, [isPathQueryOpen, pathQuery])

  const handleExecute = () => {
    if (!currentQuery.from || !currentQuery.to) {
      toast.add({
        type: "error",
        title: "Missing entity selection",
        description: "Please select both starting and destination entities.",
      })
      return
    }

    setPathQuery(currentQuery)
    const result = executePathQuery(currentQuery)

    // console.log("=== EXECUTING PATH QUERY ===")
    // console.log("Path Query:", currentQuery)
    // console.log("Path Result:", result)
    // console.log("============================")

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
    setCurrentQuery(defaultPathQuery)
  }

  return (
    <Dialog open={isPathQueryOpen} onOpenChange={setIsPathQueryOpen}>
      <DialogContent
        showCloseButton={false}
        className="fixed top-1/2 left-1/2 z-50 flex h-[100dvh] max-h-full w-[100vw] max-w-full -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-none border border-border bg-card p-0 shadow-2xl md:h-[88vh] md:max-h-[92vh] md:w-[92vw] md:max-w-6xl md:rounded-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 flex-row items-center justify-between gap-3 px-4 py-3 sm:px-6">
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
              onClick={handleReset}
              className="h-8 gap-1 px-2.5 text-xs"
              title={t("query.resetQuery")}
            >
              <RotateCcw className="size-3.5" />
              <span className="hidden sm:inline">{t("query.resetQuery")}</span>
            </Button>

            {/* Execute Button */}
            <Button
              type="button"
              size="sm"
              onClick={handleExecute}
              className="h-8 gap-1.5 rounded-lg bg-[#59C059] px-3.5 text-xs font-bold text-white shadow-xs hover:bg-[#389438]"
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

        {/* Workspace Area */}
        <div className="relative flex-1 overflow-auto bg-[#F6F8FA] p-4 select-none sm:p-6 dark:bg-[#16181D]">
          {/* Subtle Grid Dot Pattern Background */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] opacity-50 dark:bg-[radial-gradient(#2d3748_1px,transparent_1px)]" />

          <div className="relative z-10 flex w-full max-w-3xl flex-col items-stretch">
            <PathBlock
              query={currentQuery}
              onChange={(newQuery) => setCurrentQuery(newQuery)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PathQuerySheet
