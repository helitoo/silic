import type { EntitySelector, QueryContext } from "../types"

export class EntitySelectorResolver {
  /**
   * Resolves an EntitySelector against a QueryContext
   */
  public static resolve(
    selector: EntitySelector,
    context: QueryContext
  ): unknown {
    const currentEntity = context.currentEntity
    if (!currentEntity) return undefined

    // Filter by template if selector.template is specified
    if (selector.template && selector.template.length > 0) {
      if (!currentEntity.template || !selector.template.includes(currentEntity.template)) {
        return undefined
      }
    }

    const rec = context.repository.getRecord(
      currentEntity.id,
      selector.record
    )
    return rec ? rec.value : undefined
  }
}
