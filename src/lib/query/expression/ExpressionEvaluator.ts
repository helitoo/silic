import type {
  Connection,
  Entity,
  Expression,
  Operator,
  PrimaryOperand,
  QueryContext,
} from "../types"
import { OperatorEngine } from "../operator/OperatorEngine"
import { OperandResolver } from "./OperandResolver"

export class ExpressionEvaluator {
  private static isMultiplicative(op: Operator): boolean {
    return op === "*" || op === "/"
  }

  /**
   * Preprocesses flat polynomial expressions by finding contiguous runs of
   * multiplicative operators (*, /) and converting them into nested MULTI sub-blocks.
   * e.g. [A] + [B] * [C] => [A] + [MULTI: (B * C)]
   */
  private static groupMultiplicativeOperations(
    subjects: (Expression | PrimaryOperand)[],
    operators: Operator[]
  ): {
    subjects: (Expression | PrimaryOperand)[]
    operators: Operator[]
  } {
    const hasMultiplicative = operators.some(this.isMultiplicative)
    const hasNonMultiplicative = operators.some((op) => !this.isMultiplicative(op))

    // Only group when there is a mix of * / with other operators and at least 3 subjects
    if (!hasMultiplicative || !hasNonMultiplicative || subjects.length < 3) {
      return { subjects, operators }
    }

    const newSubjects: (Expression | PrimaryOperand)[] = []
    const newOperators: Operator[] = []

    let i = 0
    while (i < subjects.length) {
      if (i < operators.length && this.isMultiplicative(operators[i])) {
        const start = i
        let end = i
        while (end < operators.length && this.isMultiplicative(operators[end])) {
          end++
        }

        const subSubjects = subjects.slice(start, end + 1)
        const subOperators = operators.slice(start, end)

        const subBlock: Expression = {
          type: "MULTI",
          operators: subOperators,
          subjects: subSubjects,
        }

        newSubjects.push(subBlock)
        if (end < operators.length) {
          newOperators.push(operators[end])
        }
        i = end + 1
      } else {
        newSubjects.push(subjects[i])
        if (i < operators.length) {
          newOperators.push(operators[i])
        }
        i++
      }
    }

    return { subjects: newSubjects, operators: newOperators }
  }

  private static evaluateMultiSubjects(
    subjects: (Expression | PrimaryOperand)[],
    operators: Operator[],
    context: QueryContext
  ): unknown {
    if (subjects.length === 0) return undefined
    if (subjects.length === 1) {
      return this.evaluate(subjects[0], context)
    }

    const { subjects: groupedSubjects, operators: groupedOperators } =
      this.groupMultiplicativeOperations(subjects, operators)

    let acc = this.evaluate(groupedSubjects[0], context)
    for (let i = 0; i < groupedSubjects.length - 1; i++) {
      const op = groupedOperators[i] || "AND"
      const nextVal = this.evaluate(groupedSubjects[i + 1], context)
      acc = OperatorEngine.applyBinary(op, acc, nextVal)
    }

    return acc
  }

  public static evaluate(
    expr: Expression | PrimaryOperand | unknown,
    context: QueryContext
  ): unknown {
    if (expr === null || expr === undefined) {
      return expr
    }

    // Check if it is a PrimaryOperand
    if (OperandResolver.isOperand(expr)) {
      return OperandResolver.resolve(expr, context)
    }

    // Check if it's an object with Expression type
    if (typeof expr === "object" && expr !== null && "type" in expr) {
      const expression = expr as Expression

      if (expression.type === "NOT") {
        const val = this.evaluate(expression.subject, context)
        return !val
      }

      if (expression.type === "NEUTRAL") {
        return this.evaluate(expression.subject, context)
      }

      if (expression.type === "TRANVERSAL") {
        if (!context.currentEntity) return false

        const subjectType = expression.subjectType // "SELF" | "NEIGHBORS"

        // Find connected pairs: { targetId, connection }
        let pairs: Array<{ targetId: string; connection: Connection }> = []
        if (subjectType === "NEIGHBORS") {
          const neighbors = context.traversal.getOutboundNeighbors(
            context.currentEntity.id
          )
          pairs = neighbors.map((n) => ({
            targetId: n.to,
            connection: n.connection,
          }))
        } else {
          const sources = context.traversal.getInboundNeighbors(
            context.currentEntity.id
          )
          pairs = sources.map((s) => ({
            targetId: s.from,
            connection: s.connection,
          }))
        }

        const rawSubjects = expression.subjects || []
        const rawOperators = expression.operators || []

        const matchingEntities: Entity[] = []

        for (const pair of pairs) {
          const targetEntity = context.repository.getById(pair.targetId)
          if (!targetEntity) continue

          const evalContext: QueryContext = {
            ...context,
            currentEntity: targetEntity,
            currentConnection: pair.connection,
          }

          // 1. Check connection condition if present
          if (expression.connection && expression.connection.length > 0) {
            let connMatch = true
            for (const connExpr of expression.connection) {
              const res = this.evaluate(connExpr, evalContext)
              if (!res) {
                connMatch = false
                break
              }
            }
            if (!connMatch) continue
          }

          // 2. Check target entity condition
          let isMatch = false
          if (rawSubjects.length === 0) {
            isMatch = true
          } else {
            isMatch = Boolean(
              this.evaluateMultiSubjects(rawSubjects, rawOperators, evalContext)
            )
          }

          if (isMatch) {
            matchingEntities.push(targetEntity)
          }
        }

        return matchingEntities.length > 0
      }

      if (expression.type === "MULTI") {
        return this.evaluateMultiSubjects(
          expression.subjects || [],
          expression.operators || [],
          context
        )
      }
    }

    return expr
  }
}
