import * as React from "react"
import { Play, RotateCcw, Trash2, UsersRound, X } from "lucide-react"
import { useQuery } from "@/contexts/QueryContext"
import { useLang } from "@/contexts/LangContext"
import type { EntityQuery, Expression } from "@/lib/query-types"
import { toast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  QueryNodeRenderer,
  type QueryNode,
} from "./components/QueryNodeRenderer"
import { AddBlockButton, type BlockType } from "./components/AddBlockButton"
import { createDefaultNode } from "./components/QueryNodeRenderer"
import { MultiBlock } from "./expressionBlocks/MultiBlock"
import { NeutralBlock } from "./expressionBlocks/NeutralBlock"
import { NotBlock } from "./expressionBlocks/NotBlock"
import { TranversalBlock } from "./expressionBlocks/TranversalBlock"

const defaultEntityQuery: EntityQuery = {
  where: {
    type: "MULTI",
    operators: [],
    subjects: [],
  },
}

export function EntityQuerySheet() {
  const {
    entityQuery,
    setEntityQuery,
    executeEntityQuery,
    isEntityQueryOpen,
    setIsEntityQueryOpen,
  } = useQuery()
  const { t } = useLang()

  // Local query state
  const [rootNode, setRootNode] = React.useState<QueryNode | null>(
    entityQuery?.where || defaultEntityQuery.where
  )

  // Sync with context query when dialog opens
  React.useEffect(() => {
    if (isEntityQueryOpen && entityQuery?.where) {
      setRootNode(entityQuery.where)
    }
  }, [isEntityQueryOpen, entityQuery])

  const handleExecute = () => {
    if (!rootNode) {
      toast.add({
        type: "error",
        title: "No query defined",
        description: "Please add at least one query block before executing.",
      })
      return
    }

    const queryToRun: EntityQuery = {
      where: rootNode as Expression,
    }

    setEntityQuery(queryToRun)
    const results = executeEntityQuery(queryToRun)

    // console.log("=== EXECUTING ENTITY QUERY ===")
    // console.log("Query AST:", JSON.stringify(queryToRun, null, 2))
    // console.log("Matching Entities Found:", results)
    // console.log("===============================")

    toast.add({
      type: "success",
      title: t("query.executedEntityQuery"),
      description: t("query.foundEntitiesCount", { count: results.length }),
    })
  }

  const handleReset = () => {
    setRootNode(defaultEntityQuery.where)
  }

  const handleClear = () => {
    setRootNode(null)
  }

  const handleAddRootBlock = (type: BlockType) => {
    setRootNode(createDefaultNode(type))
  }

  return (
    <Dialog open={isEntityQueryOpen} onOpenChange={setIsEntityQueryOpen}>
      <DialogContent
        showCloseButton={false}
        className="fixed top-1/2 left-1/2 z-50 flex h-[100dvh] max-h-full w-[100vw] max-w-full -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-none border border-border bg-card p-0 shadow-2xl md:h-[88vh] md:max-h-[92vh] md:w-[92vw] md:max-w-6xl md:rounded-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 flex-row items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-8.5 shrink-0 items-center justify-center rounded-full bg-[#4C97FF] text-white shadow-xs">
              <UsersRound className="size-4.5" />
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
              onClick={handleReset}
              className="h-8 gap-1 px-2.5 text-xs"
              title={t("query.resetQuery")}
            >
              <RotateCcw className="size-3.5" />
              <span className="hidden sm:inline">{t("query.resetQuery")}</span>
            </Button>

            {rootNode && (
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

        {/* Workspace Area */}
        <div className="relative flex-1 overflow-auto bg-[#F6F8FA] p-4 select-none sm:p-6 dark:bg-[#16181D]">
          {/* Subtle Grid Dot Pattern Background */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] opacity-50 dark:bg-[radial-gradient(#2d3748_1px,transparent_1px)]" />

          <div className="relative z-10 flex w-full max-w-3xl flex-col items-stretch">
            {rootNode ? (
              <div className="flex w-full flex-col items-stretch gap-2">
                <QueryNodeRenderer
                  node={rootNode}
                  onChange={(newNode) => setRootNode(newNode)}
                  onDelete={() => setRootNode(null)}
                  MultiBlockComponent={MultiBlock}
                  NeutralBlockComponent={NeutralBlock}
                  NotBlockComponent={NotBlock}
                  TranversalBlockComponent={TranversalBlock}
                />
              </div>
            ) : (
              <div className="flex w-full flex-col items-center justify-center gap-3 py-20 text-center">
                <p className="text-xs font-medium text-muted-foreground">
                  {t("query.selectBlock")}
                </p>
                <AddBlockButton onSelect={handleAddRootBlock} size="default" />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default EntityQuerySheet
