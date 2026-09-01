import type {
  Connection,
  Entity,
  EntityQuery,
  EntityRepository,
  PathQuery,
  PathQueryResult,
  QueryCache,
} from "../types"
import { InMemoryEntityRepository } from "../repository/EntityRepository"
import { GraphTraversalEngine } from "../traversal/GraphTraversalEngine"
import { EntityQueryExecutor } from "./EntityQueryExecutor"
import { PathQueryExecutor } from "./PathQueryExecutor"

export class QueryExecutionRouter {
  public static executeEntityQuery(
    query: EntityQuery,
    entitiesOrRepo: Entity[] | EntityRepository,
    connections: Connection[] = [],
    cache?: QueryCache
  ): Entity[] {
    const repository =
      Array.isArray(entitiesOrRepo)
        ? new InMemoryEntityRepository(entitiesOrRepo, connections)
        : entitiesOrRepo
    const traversal = new GraphTraversalEngine(repository)

    return EntityQueryExecutor.execute(query, repository, traversal, cache)
  }

  public static executePathQuery(
    query: PathQuery,
    entitiesOrRepo: Entity[] | EntityRepository,
    connections: Connection[] = []
  ): PathQueryResult {
    const repository =
      Array.isArray(entitiesOrRepo)
        ? new InMemoryEntityRepository(entitiesOrRepo, connections)
        : entitiesOrRepo
    const traversal = new GraphTraversalEngine(repository)

    return PathQueryExecutor.execute(query, traversal)
  }
}
