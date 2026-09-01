import type {
  Entity,
  EntityQuery,
  EntityRepository,
  GraphTraversalEngineInterface,
  QueryCache,
  QueryContext,
} from "../types"
import { ExpressionEvaluator } from "../expression/ExpressionEvaluator"

export class EntityQueryExecutor {
  public static execute(
    query: EntityQuery,
    repository: EntityRepository,
    traversal: GraphTraversalEngineInterface,
    cache?: QueryCache
  ): Entity[] {
    const baseContext: Omit<QueryContext, "currentEntity"> = {
      repository,
      traversal,
      cache: cache || {
        entityCache: new Map(),
        selectorCache: new Map(),
        traversalCache: new Map(),
      },
    }

    // Step 1: Candidate entities
    const allEntities = repository.getAll()

    // Step 2: Evaluate WHERE clause
    const matchingEntities: Entity[] = []

    for (const entity of allEntities) {
      const context: QueryContext = {
        ...baseContext,
        currentEntity: entity,
      }

      if (!query.where) {
        matchingEntities.push(entity)
        continue
      }

      const isMatch = ExpressionEvaluator.evaluate(query.where, context)
      if (Boolean(isMatch)) {
        matchingEntities.push(entity)
      }
    }

    return matchingEntities
  }
}
