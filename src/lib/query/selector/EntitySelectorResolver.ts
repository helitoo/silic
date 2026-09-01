import type { RecordSelector, QueryContext } from "../types"

export class EntitySelectorResolver {
  /**
   * Resolves a RecordSelector against an Entity in QueryContext
   */
  public static resolve(
    selector: RecordSelector,
    context: QueryContext
  ): unknown {
    const currentEntity = context.currentEntity
    if (!currentEntity) return undefined

    // Filter by template if selector.template is specified and not "*" / "__ALL__"
    if (selector.template && selector.template !== "*") {
      const allowedTemplates = Array.isArray(selector.template)
        ? selector.template
        : [selector.template]

      const isWildcard =
        allowedTemplates.length === 0 ||
        allowedTemplates.includes("*") ||
        allowedTemplates.includes("__ALL__")

      if (!isWildcard) {
        if (!currentEntity.template) return undefined

        const entityTemplateId = currentEntity.template
        const entityTemplateName = context.repository.getTemplateName
          ? context.repository.getTemplateName(entityTemplateId)
          : undefined

        const matches = allowedTemplates.some((tpl) => {
          const tplNorm = tpl.trim().toLowerCase()
          if (tplNorm === entityTemplateId.toLowerCase()) return true
          if (entityTemplateName && tplNorm === entityTemplateName.toLowerCase()) return true
          return false
        })

        if (!matches) {
          return undefined
        }
      }
    }

    const rec = context.repository.getRecord(
      currentEntity.id,
      selector.record
    )
    return rec ? rec.value : undefined
  }
}
