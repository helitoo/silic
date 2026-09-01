import * as React from "react"
import type {
  Expression,
  Operator,
  PrimaryOperand,
} from "@/lib/query-types"
import type { BlockType } from "./AddBlockButton"
import { LiteralBlock } from "../primaryOperandBlocks/LiteralBlock"
import { ArrayBlock } from "../primaryOperandBlocks/ArrayBlock"
import { EntitySelectorBlock } from "../primaryOperandBlocks/EntitySelectorBlock"
import { ConnectionSelectorBlock } from "../primaryOperandBlocks/ConnectionSelectorBlock"

export type QueryNode = Expression | PrimaryOperand

export function isExpression(node: any): node is Expression {
  return (
    node &&
    typeof node === "object" &&
    (node.type === "NOT" ||
      node.type === "NEUTRAL" ||
      node.type === "MULTI" ||
      node.type === "TRANVERSAL")
  )
}

export function isPrimaryOperand(node: any): node is PrimaryOperand {
  return node && typeof node === "object" && "value" in node && typeof node.value === "object"
}

export function createDefaultNode(type: BlockType): QueryNode {
  switch (type) {
    case "NEUTRAL":
      return {
        type: "NEUTRAL",
        subject: undefined as any,
      }
    case "NOT":
      return {
        type: "NOT",
        subject: undefined as any,
      }
    case "MULTI":
      return {
        type: "MULTI",
        operators: [],
        subjects: [],
      }
    case "TRANVERSAL":
      return {
        type: "TRANVERSAL",
        operators: [],
        subjectType: "NEIGHBORS",
        subjects: [],
      }
    case "LITERAL":
      return {
        value: {
          type: "LITERAL",
          value: "",
        },
      }
    case "ARRAY":
      return {
        value: {
          type: "ARRAY",
          value: [""],
        },
      }
    case "ENTITYSELECTOR":
      return {
        value: {
          type: "ENTITYSELECTOR",
          value: { record: "username" },
        },
      }
    case "CONNECTIONSELECTOR":
      return {
        value: {
          type: "CONNECTIONSELECTOR",
          value: { record: "role" },
        },
      }
  }
}

// Lazy/Circular references are handled via dynamic imports or passing components
export interface QueryNodeRendererProps {
  node: QueryNode
  onChange: (newNode: QueryNode) => void
  onDelete?: () => void
  MultiBlockComponent?: React.ComponentType<any>
  NeutralBlockComponent?: React.ComponentType<any>
  NotBlockComponent?: React.ComponentType<any>
  TranversalBlockComponent?: React.ComponentType<any>
}

export function QueryNodeRenderer({
  node,
  onChange,
  onDelete,
  MultiBlockComponent,
  NeutralBlockComponent,
  NotBlockComponent,
  TranversalBlockComponent,
}: QueryNodeRendererProps) {
  if (isExpression(node)) {
    if (node.type === "MULTI" && MultiBlockComponent) {
      return (
        <MultiBlockComponent
          operators={node.operators}
          subjects={node.subjects}
          onChange={(operators: Operator[], subjects: (Expression | PrimaryOperand)[]) =>
            onChange({ type: "MULTI", operators, subjects })
          }
          onDelete={onDelete}
        />
      )
    }

    if (node.type === "NOT" && NotBlockComponent) {
      return (
        <NotBlockComponent
          subject={node.subject}
          onChange={(subject: Expression | PrimaryOperand) =>
            onChange({ type: "NOT", subject })
          }
          onDelete={onDelete}
        />
      )
    }

    if (node.type === "NEUTRAL" && NeutralBlockComponent) {
      return (
        <NeutralBlockComponent
          subject={node.subject}
          onChange={(subject: Expression | PrimaryOperand) =>
            onChange({ type: "NEUTRAL", subject })
          }
          onDelete={onDelete}
        />
      )
    }

    if (node.type === "TRANVERSAL" && TranversalBlockComponent) {
      return (
        <TranversalBlockComponent
          operators={node.operators}
          hop={node.hop}
          subjectType={node.subjectType}
          subjects={node.subjects}
          onChange={(
            operators: Operator[],
            hop?: number,
            subjectType?: "SELF" | "NEIGHBORS",
            subjects?: (Expression | PrimaryOperand)[]
          ) =>
            onChange({
              type: "TRANVERSAL",
              operators,
              hop,
              subjectType: subjectType || "NEIGHBORS",
              subjects: subjects || [],
            })
          }
          onDelete={onDelete}
        />
      )
    }
  }

  if (isPrimaryOperand(node)) {
    const operandValue = node.value

    if (operandValue.type === "LITERAL") {
      return (
        <LiteralBlock
          value={operandValue.value}
          onChange={(val) =>
            onChange({
              value: { type: "LITERAL", value: val },
            })
          }
          onDelete={onDelete}
        />
      )
    }

    if (operandValue.type === "ARRAY") {
      return (
        <ArrayBlock
          values={operandValue.value}
          function={operandValue.function}
          onChange={(vals, fn) =>
            onChange({
              value: {
                type: "ARRAY",
                value: vals as any,
                function: fn,
              },
            })
          }
          onDelete={onDelete}
        />
      )
    }

    if (operandValue.type === "ENTITYSELECTOR") {
      return (
        <EntitySelectorBlock
          template={operandValue.value.template}
          record={operandValue.value.record}
          function={operandValue.function}
          onChange={(selector, fn) =>
            onChange({
              value: {
                type: "ENTITYSELECTOR",
                value: {
                  ...operandValue.value,
                  template: selector.template,
                  record: selector.record,
                },
                function: fn,
              },
            })
          }
          onDelete={onDelete}
        />
      )
    }

    if (operandValue.type === "CONNECTIONSELECTOR") {
      return (
        <ConnectionSelectorBlock
          template={operandValue.value.template}
          record={operandValue.value.record}
          function={operandValue.function}
          onChange={(selector, fn) =>
            onChange({
              value: {
                type: "CONNECTIONSELECTOR",
                value: {
                  ...operandValue.value,
                  template: selector.template,
                  record: selector.record,
                },
                function: fn,
              },
            })
          }
          onDelete={onDelete}
        />
      )
    }
  }

  return null
}

export default QueryNodeRenderer
