import type { PrimaryOperand, QueryContext } from "../types"
import { AggregateEngine } from "../aggregate/AggregateEngine"
import { EntitySelectorResolver } from "../selector/EntitySelectorResolver"

export class OperandResolver {
  public static isOperand(obj: unknown): obj is PrimaryOperand {
    return Boolean(
      obj &&
        typeof obj === "object" &&
        "value" in obj &&
        typeof (obj as any).value === "object" &&
        (obj as any).value !== null &&
        "type" in (obj as any).value
    )
  }

  public static resolve(
    operand: PrimaryOperand,
    context: QueryContext
  ): unknown {
    if (!operand || !operand.value) return undefined

    const opVal = operand.value

    switch (opVal.type) {
      case "LITERAL":
        return opVal.value

      case "ARRAY": {
        const arr = opVal.value
        if (opVal.function) {
          return AggregateEngine.aggregate(opVal.function, arr)
        }
        return arr
      }

      case "ENTITYSELECTOR": {
        const resolved = EntitySelectorResolver.resolve(opVal.value, context)
        if (opVal.function) {
          const toAgg = Array.isArray(resolved) ? resolved : [resolved]
          return AggregateEngine.aggregate(opVal.function, toAgg as any)
        }
        return resolved
      }

      case "CONNECTIONSELECTOR": {
        const conn = context.currentConnection
        if (!conn) return undefined
        const sel = opVal.value
        if (
          sel.template &&
          sel.template.length > 0 &&
          !sel.template.includes("__ALL__")
        ) {
          if (!conn.template || !sel.template.includes(conn.template)) {
            return undefined
          }
        }
        const rec = conn.records?.find((r) => r.name === sel.record)
        const resolved = rec ? rec.value : undefined
        if (opVal.function) {
          const toAgg = Array.isArray(resolved)
            ? resolved
            : resolved !== undefined
            ? [resolved]
            : []
          return AggregateEngine.aggregate(opVal.function, toAgg as any)
        }
        return resolved
      }

      default:
        return (opVal as any).value
    }
  }
}
