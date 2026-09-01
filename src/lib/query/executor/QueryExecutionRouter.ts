import type {
  Connection,
  Entity,
  Template,
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
    cache?: QueryCache,
    templates: Template[] = []
  ): Entity[] {
    const repository =
      Array.isArray(entitiesOrRepo)
        ? new InMemoryEntityRepository(entitiesOrRepo, connections, templates)
        : entitiesOrRepo
    const traversal = new GraphTraversalEngine(repository)

    return EntityQueryExecutor.execute(query, repository, traversal, cache)
  }

  public static executePathQuery(
    query: PathQuery,
    entitiesOrRepo: Entity[] | EntityRepository,
    connections: Connection[] = [],
    templates: Template[] = []
  ): PathQueryResult {
    const repository =
      Array.isArray(entitiesOrRepo)
        ? new InMemoryEntityRepository(entitiesOrRepo, connections, templates)
        : entitiesOrRepo
    const traversal = new GraphTraversalEngine(repository)

    return PathQueryExecutor.execute(query, traversal)
  }
}
