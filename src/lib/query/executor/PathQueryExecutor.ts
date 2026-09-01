import type {
  GraphTraversalEngineInterface,
  PathQuery,
  PathQueryResult,
} from "../types"

export class PathQueryExecutor {
  public static execute(
    query: PathQuery,
    traversal: GraphTraversalEngineInterface
  ): PathQueryResult {
    if (!query || !query.from || !query.to) {
      return {
        found: false,
        entities: [],
        connections: [],
      }
    }

    return traversal.shortestPath(
      query.from,
      query.to,
      query.via,
      query.where
    )
  }
}
