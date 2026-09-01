import type { Expression, PrimaryOperand } from "@/lib/query-types"
import { QueryBlock } from "../components/QueryBlock"
import { AddBlockButton, type BlockType } from "../components/AddBlockButton"
import {
  QueryNodeRenderer,
  createDefaultNode,
  type QueryNode,
} from "../components/QueryNodeRenderer"
import { MultiBlock } from "./MultiBlock"
import { NotBlock } from "./NotBlock"
import { TranversalBlock } from "./TranversalBlock"

export interface NeutralBlockProps {
  subject?: Expression | PrimaryOperand | null
  onChange: (subject: Expression | PrimaryOperand | null) => void
  onDelete?: () => void
  className?: string
}

export function NeutralBlock({
  subject,
  onChange,
  onDelete,
  className,
}: NeutralBlockProps) {
  const handleAddSubject = (type: BlockType) => {
    onChange(createDefaultNode(type))
  }

  return (
    <QueryBlock color="indigo" onDelete={onDelete} className={className}>
      <div className="flex w-full flex-col items-stretch gap-2 pl-2">
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
    </QueryBlock>
  )
}

export default NeutralBlock
