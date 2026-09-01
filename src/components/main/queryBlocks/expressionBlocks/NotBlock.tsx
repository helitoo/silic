import { useLang } from "@/contexts/LangContext"
import type { Expression, PrimaryOperand } from "@/lib/query-types"
import { Button } from "@/components/ui/button"
import { QueryBlock } from "../components/QueryBlock"
import { AddBlockButton, type BlockType } from "../components/AddBlockButton"
import {
  QueryNodeRenderer,
  createDefaultNode,
  type QueryNode,
} from "../components/QueryNodeRenderer"
import { MultiBlock } from "./MultiBlock"
import { NeutralBlock } from "./NeutralBlock"
import { TranversalBlock } from "./TranversalBlock"

export interface NotBlockProps {
  subject?: Expression | PrimaryOperand | null
  onChange: (subject: Expression | PrimaryOperand | null) => void
  onDelete?: () => void
  className?: string
}

export function NotBlock({
  subject,
  onChange,
  onDelete,
  className,
}: NotBlockProps) {
  const { t } = useLang()

  const handleAddSubject = (type: BlockType) => {
    onChange(createDefaultNode(type))
  }

  return (
    <QueryBlock color="rose" onDelete={onDelete} className={className}>
      <div className="flex w-full flex-col items-start gap-2">
        {/* Disabled NOT operator button with default styling */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            disabled
            size="sm"
            className="h-7 cursor-not-allowed rounded-md bg-muted/60 px-3 text-xs font-bold tracking-wider text-foreground uppercase shadow-2xs disabled:opacity-100"
          >
            {t("query.not")}
          </Button>
        </div>

        {/* Vertical nested slot */}
        <div className="flex w-full flex-col items-stretch gap-2 pl-3">
          {subject ? (
            <div className="flex w-full flex-col items-stretch">
              <QueryNodeRenderer
                node={subject}
                onChange={(newNode: QueryNode) =>
                  onChange(newNode as Expression | PrimaryOperand)
                }
                onDelete={() => onChange(null)}
                MultiBlockComponent={MultiBlock}
                NeutralBlockComponent={NeutralBlock}
                NotBlockComponent={NotBlock}
                TranversalBlockComponent={TranversalBlock}
              />
            </div>
          ) : (
            <AddBlockButton onSelect={handleAddSubject} />
          )}
        </div>
      </div>
    </QueryBlock>
  )
}

export default NotBlock
