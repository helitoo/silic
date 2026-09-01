import type {
  Entity,
  Record as StorageRecord,
  Connection,
  Template,
  Type,
} from "@/lib/types"
import type {
  EntityQuery,
  PathQuery,
  PathExpression,
  PathConstraintQuantifier,
  PathItemType,
  RecordSelector,
  EntitySelector,
  ConnectionSelector,
  TemplateSelector,
  DateFunction,
  Expression,
  PrimaryOperand,
  AggreeateFunction,
  Operator,
} from "@/lib/query-types"

export type {
  Entity,
  StorageRecord,
  Connection,
  Template,
  Type,
  EntityQuery,
  PathQuery,
  PathExpression,
  PathConstraintQuantifier,
  PathItemType,
  RecordSelector,
  EntitySelector,
  ConnectionSelector,
  TemplateSelector,
  DateFunction,
  Expression,
  PrimaryOperand,
  AggreeateFunction,
  Operator,
}

// Alias for standard spelling
export type AggregateFunction = AggreeateFunction

// Backward compatibility alias for Operand
export type Operand = PrimaryOperand

export interface PathQueryResult {
  found: boolean
  entities: Entity[]
  connections: Connection[]
}

export interface EntityRepository {
  getById(id: string): Entity | undefined
  getAll(): Entity[]
  getRecord(entityId: string, name: string): StorageRecord | undefined
  getByTemplate?(templateId: string): Entity[]
  getConnections(): Connection[]
  getConnectionById?(id: string): Connection | undefined
  getTemplates?(): Template[]
  getTemplateById?(id: string): Template | undefined
  getTemplateByName?(name: string): Template | undefined
  getTemplateName?(id?: string): string | undefined
}

export interface QueryCache {
  entityCache?: Map<string, Entity>
  selectorCache?: Map<string, unknown>
  traversalCache?: Map<string, string[]>
}

export interface QueryContext {
  currentEntity: Entity
  currentConnection?: Connection
  repository: EntityRepository
  traversal: GraphTraversalEngineInterface
  cache?: QueryCache
}

export interface GraphTraversalEngineInterface {
  getOutboundNeighbors(
    entityId: string,
    allowedSelectors?: ConnectionSelector[] | ConnectionSelector
  ): Array<{ to: string; connection: Connection }>
  getInboundNeighbors(
    entityId: string,
    allowedSelectors?: ConnectionSelector[] | ConnectionSelector
  ): Array<{ from: string; connection: Connection }>
  traverse(
    entityId: string,
    segment: { connection?: ConnectionSelector; hop?: number }
  ): string[]
  traverseOutbound(
    entityId: string,
    segment: { connection?: ConnectionSelector; hop?: number }
  ): string[]
  traverseInbound(
    entityId: string,
    segment: { connection?: ConnectionSelector; hop?: number }
  ): string[]
  traverseMulti(
    entityId: string,
    segments: Array<{ connection?: ConnectionSelector; hop?: number }>
  ): string[]
  shortestPath(
    from: string,
    to: string,
    allowedConnections?: ConnectionSelector[],
    where?: PathExpression
  ): PathQueryResult
}
