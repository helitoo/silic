import * as React from "react"
import { useLang } from "@/contexts/LangContext"
import type { Expression, Operator, PrimaryOperand } from "@/lib/query-types"
import { QueryBlock } from "../components/QueryBlock"
import { AddBlockButton, type BlockType } from "../components/AddBlockButton"
import {
  QueryNodeRenderer,
  createDefaultNode,
  type QueryNode,
} from "../components/QueryNodeRenderer"
import {
  OperatorSelect,
  OPERATOR_DISPLAY_MAP,
} from "../components/OperatorSelect"
import { NeutralBlock } from "./NeutralBlock"
import { NotBlock } from "./NotBlock"
import { TranversalBlock } from "./TranversalBlock"

export type MultiOperator = Operator
export { OPERATOR_DISPLAY_MAP }

export interface MultiBlockProps {
  operators?: Operator[]
  subjects?: (Expression | PrimaryOperand)[]
  onChange: (
    operators: Operator[],
    subjects: (Expression | PrimaryOperand)[]
  ) => void
  onDelete?: () => void
  className?: string
}

export function MultiBlock({
  operators = [],
  subjects = [],
  onChange,
  onDelete,
  className,
}: MultiBlockProps) {
  const { t } = useLang()

  const handleOperatorChange = (opIndex: number, newOp: Operator) => {
    const nextOps = [...operators]
    while (nextOps.length < Math.max(0, subjects.length - 1)) {
      nextOps.push("AND")
    }
    nextOps[opIndex] = newOp
    onChange(nextOps, subjects)
  }

  const handleAddSubject = (type: BlockType) => {
    const newNode = createDefaultNode(type) as Expression | PrimaryOperand
    const nextSubjects = [...subjects, newNode]
    const nextOps = [...operators]
    if (nextSubjects.length > 1) {
      nextOps.push("AND")
    }
    onChange(nextOps, nextSubjects)
  }

  const handleUpdateSubject = (index: number, updated: QueryNode) => {
    const next = [...subjects]
    next[index] = updated as Expression | PrimaryOperand
    onChange(operators, next)
  }

  const handleRemoveSubject = (index: number) => {
    const nextSubjects = subjects.filter((_, i) => i !== index)
    const nextOps = [...operators]
    if (index === 0) {
      nextOps.splice(0, 1)
    } else {
      nextOps.splice(index - 1, 1)
    }
    onChange(nextOps, nextSubjects)
  }

  return (
    <QueryBlock color="blue" onDelete={onDelete} className={className}>
      <div className="flex w-full flex-col items-start gap-2">
        {/* Vertical nested column for subjects with interactive OperatorSelect between blocks */}
        <div className="flex w-full flex-col items-stretch gap-2">
          {subjects.map((sub, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && (
                <div className="relative z-20 -my-2.5 flex items-center justify-start pl-2">
                  <OperatorSelect
                    value={operators[idx - 1] || "AND"}
                    onChange={(newOp) => handleOperatorChange(idx - 1, newOp)}
                    variant="badge"
                    ariaLabel={t("query.selectOperator")}
                  />
                </div>
              )}
              <div className="flex w-full flex-col items-stretch">
                <QueryNodeRenderer
                  node={sub}
                  onChange={(updated) => handleUpdateSubject(idx, updated)}
                  onDelete={() => handleRemoveSubject(idx)}
                  MultiBlockComponent={MultiBlock}
                  NeutralBlockComponent={NeutralBlock}
                  NotBlockComponent={NotBlock}
                  TranversalBlockComponent={TranversalBlock}
                />
              </div>
            </React.Fragment>
          ))}

          {/* Add Block button */}
          <div className="pt-1">
            <AddBlockButton onSelect={handleAddSubject} />
          </div>
        </div>
      </div>
    </QueryBlock>
  )
}

export default MultiBlock
