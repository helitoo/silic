import type { PrimaryOperand, QueryContext, DateFunction } from "../types"
import { AggregateEngine } from "../aggregate/AggregateEngine"
import { EntitySelectorResolver } from "../selector/EntitySelectorResolver"

function applyDateFunction(fn?: DateFunction, val?: unknown): unknown {
  if (!fn || val === undefined || val === null) return val
  if (Array.isArray(val)) {
    return val.map((item) => applyDateFunction(fn, item))
  }
  const d = val instanceof Date ? val : new Date(String(val))
  if (isNaN(d.getTime())) return undefined
  switch (fn) {
    case "MONTH":
      return d.getMonth() + 1
    case "DAY":
      return d.getDate()
    case "YEAR":
      return d.getFullYear()
    case "HOUR":
      return d.getHours()
    case "MINUTE":
      return d.getMinutes()
    case "SECOND":
      return d.getSeconds()
    default:
      return val
  }
}

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
      case "LITERAL": {
        const raw = opVal.value
        return applyDateFunction((opVal as any).dateFunction, raw)
      }

      case "ARRAY": {
        const arr = opVal.value
        if (opVal.function) {
          return AggregateEngine.aggregate(opVal.function, arr)
        }
        return arr
      }

      case "RECORDSELECTOR": {
        // If currentConnection is set and has the record, or if resolving connection context
        let resolved: unknown = undefined

        if (context.currentConnection) {
          const conn = context.currentConnection
          const sel = opVal.value
          let matchTemplate = true
          if (sel.template && sel.template !== "*") {
            const allowedTemplates = Array.isArray(sel.template)
              ? sel.template
              : [sel.template]
            const isWildcard =
              allowedTemplates.length === 0 ||
              allowedTemplates.includes("*") ||
              allowedTemplates.includes("__ALL__")

            if (!isWildcard) {
              if (!conn.template) {
                matchTemplate = false
              } else {
                const connTplId = conn.template
                const connTplName = context.repository.getTemplateName
                  ? context.repository.getTemplateName(connTplId)
                  : undefined
                matchTemplate = allowedTemplates.some((tpl) => {
                  const tNorm = tpl.trim().toLowerCase()
                  return (
                    tNorm === connTplId.toLowerCase() ||
                    (connTplName && tNorm === connTplName.toLowerCase())
                  )
                })
              }
            }
          }
          if (matchTemplate) {
            const rec = conn.records?.find((r) => r.name === sel.record)
            if (rec) {
              resolved = rec.value
            }
          }
        }

        // If not resolved from connection, resolve from current entity
        if (resolved === undefined && context.currentEntity) {
          resolved = EntitySelectorResolver.resolve(opVal.value, context)
        }

        resolved = applyDateFunction((opVal as any).dateFunction, resolved)

        if ((opVal as any).function) {
          const toAgg = Array.isArray(resolved)
            ? resolved
            : resolved !== undefined
            ? [resolved]
            : []
          return AggregateEngine.aggregate((opVal as any).function, toAgg as any)
        }
        return resolved
      }

      case "ENTITYSELECTOR": {
        let resolved = EntitySelectorResolver.resolve(opVal.value, context)
        resolved = applyDateFunction((opVal as any).dateFunction, resolved)
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
          sel.template !== "*" &&
          sel.template.length > 0 &&
          !sel.template.includes("__ALL__")
        ) {
          if (!conn.template || !sel.template.includes(conn.template)) {
            return undefined
          }
        }
        const rec = conn.records?.find((r) => r.name === sel.record)
        let resolved: any = rec ? rec.value : undefined
        resolved = applyDateFunction((opVal as any).dateFunction, resolved)
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

      case "TEMPLATESELECTOR": {
        const entity = context.currentEntity
        if (!entity || !entity.template) return undefined
        const expected = opVal.value.template.trim().toLowerCase()
        const entityTplId = entity.template.toLowerCase()
        const entityTplName = context.repository.getTemplateName
          ? context.repository.getTemplateName(entity.template)?.toLowerCase()
          : undefined

        return (
          expected === entityTplId ||
          (entityTplName && expected === entityTplName)
        )
      }

      case "TEMPLATE": {
        const entity = context.currentEntity
        if (!entity || !entity.template) return ""
        const entityTplName = context.repository.getTemplateName
          ? context.repository.getTemplateName(entity.template)
          : entity.template
        return entityTplName || entity.template
      }

      default:
        return (opVal as any).value
    }
  }
}
