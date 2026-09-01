import * as React from "react"
import { CirclePlus, X } from "lucide-react"
import { useLang } from "@/contexts/LangContext"
import type { Expression, Operator, PrimaryOperand } from "@/lib/query-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { QueryBlock } from "../components/QueryBlock"
import { AddBlockButton, type BlockType } from "../components/AddBlockButton"
import {
  QueryNodeRenderer,
  createDefaultNode,
  type QueryNode,
} from "../components/QueryNodeRenderer"
import { OperatorSelect } from "../components/OperatorSelect"
import { MultiBlock } from "./MultiBlock"
import { NeutralBlock } from "./NeutralBlock"
import { NotBlock } from "./NotBlock"

export interface TranversalBlockProps {
  operators?: Operator[]
  hop?: number
  subjectType?: "SELF" | "NEIGHBORS"
  subjects?: (Expression | PrimaryOperand)[]
  onChange: (
    operators: Operator[],
    hop?: number,
    subjectType?: "SELF" | "NEIGHBORS",
    subjects?: (Expression | PrimaryOperand)[]
  ) => void
  onDelete?: () => void
  className?: string
}

export function TranversalBlock({
  operators = [],
  hop,
  subjectType = "NEIGHBORS",
  subjects = [],
  onChange,
  onDelete,
  className,
}: TranversalBlockProps) {
  const { t } = useLang()

  const handleHopChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (raw === "") {
      onChange(operators, undefined, subjectType, subjects)
    } else {
      const val = parseInt(raw, 10)
      onChange(operators, isNaN(val) ? undefined : val, subjectType, subjects)
    }
  }

  const handleClearHop = () => {
    onChange(operators, undefined, subjectType, subjects)
  }

  const handleAddHop = () => {
    onChange(operators, 2, subjectType, subjects)
  }

  const handleSubjectTypeChange = (val: string | null) => {
    if (val === "SELF" || val === "NEIGHBORS") {
      onChange(operators, hop, val, subjects)
    }
  }

  const handleOperatorChange = (opIndex: number, newOp: Operator) => {
    const nextOps = [...operators]
    while (nextOps.length < Math.max(0, subjects.length - 1)) {
      nextOps.push("AND")
    }
    nextOps[opIndex] = newOp
    onChange(nextOps, hop, subjectType, subjects)
  }

  const handleAddSubject = (type: BlockType) => {
    const newNode = createDefaultNode(type) as Expression | PrimaryOperand
    const nextSubjects = [...subjects, newNode]
    const nextOps = [...operators]
    if (nextSubjects.length > 1) {
      nextOps.push("AND")
    }
    onChange(nextOps, hop, subjectType, nextSubjects)
  }

  const handleUpdateSubject = (index: number, updated: QueryNode) => {
    const next = [...subjects]
    next[index] = updated as Expression | PrimaryOperand
    onChange(operators, hop, subjectType, next)
  }

  const handleRemoveSubject = (index: number) => {
    const nextSubjects = subjects.filter((_, i) => i !== index)
    const nextOps = [...operators]
    if (index === 0) {
      nextOps.splice(0, 1)
    } else {
      nextOps.splice(index - 1, 1)
    }
    onChange(nextOps, hop, subjectType, nextSubjects)
  }

  return (
    <QueryBlock color="cyan" onDelete={onDelete} className={className}>
      <div className="flex w-full flex-col items-start gap-2.5">
        {/* Header Controls: subjectType, hop */}
        <div className="flex flex-wrap items-center gap-2">
          {/* SubjectType selector */}
          <Select value={subjectType} onValueChange={handleSubjectTypeChange}>
            <SelectTrigger
              size="sm"
              className="h-7 w-auto min-w-max cursor-pointer justify-between gap-1.5 rounded-md border border-border/80 bg-muted/50 px-2.5 text-xs font-medium text-foreground shadow-2xs hover:bg-muted/80"
              aria-label="Traversal Mode"
            >
              <SelectValue>
                <span className="text-xs font-semibold whitespace-nowrap">
                  {subjectType === "NEIGHBORS"
                    ? t("query.neighbors")
                    : t("query.self")}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="start" className="w-auto min-w-max">
              <SelectGroup>
                <SelectItem value="NEIGHBORS">
                  <div className="flex flex-col py-0.5 text-left">
                    <span className="text-xs font-semibold">
                      {t("query.neighbors")}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {t("query.neighborsDesc")}
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="SELF">
                  <div className="flex flex-col py-0.5 text-left">
                    <span className="text-xs font-semibold">
                      {t("query.self")}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {t("query.selfDesc")}
                    </span>
                  </div>
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* Hop input (Optional) */}
          {hop !== undefined ? (
            <div className="flex items-center gap-1 rounded-md border border-border/70 bg-muted/30 px-1.5 py-0.5">
              <span className="text-[10px] text-muted-foreground">
                {t("query.hop")}:
              </span>
              <Input
                type="number"
                min={1}
                value={hop}
                onChange={handleHopChange}
                placeholder={t("query.hopPlaceholder")}
                className="h-6 w-14 border-0 bg-transparent p-0 text-center text-xs text-foreground shadow-none"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="size-4 rounded-sm p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                onClick={handleClearHop}
                title="Remove hop limit"
              >
                <X className="size-3" />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1 border-dashed border-border px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleAddHop}
              title="Add hop limit"
            >
              <CirclePlus className="size-3 stroke-[2]" />
              <span>+ {t("query.hop")}</span>
            </Button>
          )}
        </div>

        {/* Vertical nested column for subjects with interactive OperatorSelect between blocks */}
        <div className="flex w-full flex-col items-stretch gap-2 pl-3">
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

export default TranversalBlock
