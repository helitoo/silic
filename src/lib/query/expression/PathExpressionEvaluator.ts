import type {
  Connection,
  Entity,
  EntityRepository,
  Expression,
  GraphTraversalEngineInterface,
  PathConstraintQuantifier,
  PathExpression,
  PrimaryOperand,
  QueryContext,
} from "../types"
import { ExpressionEvaluator } from "./ExpressionEvaluator"

export interface CandidatePath {
  entities: Entity[]
  connections: Connection[]
}

export class PathExpressionEvaluator {
  /**
   * Main entry point to evaluate a PathExpression AST against a candidate path.
   */
  public static evaluate(
    pathExpr: PathExpression,
    candidate: CandidatePath,
    repository: EntityRepository,
    traversal: GraphTraversalEngineInterface,
    defaultTargetType?: "CONNECTION" | "ENTITY"
  ): boolean {
    switch (pathExpr.type) {
      case "PATH_ARROW": {
        const connOk = pathExpr.connectionExpr
          ? this.evaluate(
              pathExpr.connectionExpr,
              candidate,
              repository,
              traversal,
              "CONNECTION"
            )
          : true

        const entityOk = pathExpr.entityExpr
          ? this.evaluate(
              pathExpr.entityExpr,
              candidate,
              repository,
              traversal,
              "ENTITY"
            )
          : true

        return connOk && entityOk
      }

      case "PATH_SEQUENCE": {
        // A << B: Item A must appear before Item B in the path sequence
        const indicesA = this.getMatchingIndices(
          pathExpr.left,
          candidate,
          repository,
          traversal,
          defaultTargetType
        )
        const indicesB = this.getMatchingIndices(
          pathExpr.right,
          candidate,
          repository,
          traversal,
          defaultTargetType
        )

        // Check if there is any i in indicesA and j in indicesB with i < j
        for (const i of indicesA) {
          for (const j of indicesB) {
            if (i < j) return true
          }
        }
        return false
      }

      case "PATH_OR": {
        return (
          this.evaluate(
            pathExpr.left,
            candidate,
            repository,
            traversal,
            defaultTargetType
          ) ||
          this.evaluate(
            pathExpr.right,
            candidate,
            repository,
            traversal,
            defaultTargetType
          )
        )
      }

      case "PATH_AND": {
        return (
          this.evaluate(
            pathExpr.left,
            candidate,
            repository,
            traversal,
            defaultTargetType
          ) &&
          this.evaluate(
            pathExpr.right,
            candidate,
            repository,
            traversal,
            defaultTargetType
          )
        )
      }

      case "PATH_CONSTRAINT": {
        const resolvedTarget =
          pathExpr.targetType === "ANY"
            ? defaultTargetType
            : pathExpr.targetType || defaultTargetType

        return this.evaluateConstraint(
          pathExpr.expression,
          pathExpr.quantifier || "AT_LEAST_ONE",
          candidate,
          repository,
          traversal,
          resolvedTarget
        )
      }

      default:
        return true
    }
  }

  /**
   * Helper to check if an expression is trivial literal true or unconstrained
   */
  private static isAlwaysTrue(
    expr?: Expression | PrimaryOperand
  ): boolean {
    if (!expr) return true
    if ("type" in expr && expr.type === "NEUTRAL" && expr.subject) {
      const sub = expr.subject
      if (
        "value" in sub &&
        typeof sub.value === "object" &&
        sub.value &&
        "type" in sub.value
      ) {
        if (sub.value.type === "LITERAL" && sub.value.value === true) {
          return true
        }
      }
    }
    return false
  }

  /**
   * Evaluates a single constraint with a quantifier against candidate path items.
   */
  private static evaluateConstraint(
    expr: Expression | PrimaryOperand,
    quantifier: PathConstraintQuantifier,
    candidate: CandidatePath,
    repository: EntityRepository,
    traversal: GraphTraversalEngineInterface,
    targetType?: "CONNECTION" | "ENTITY"
  ): boolean {
    if (this.isAlwaysTrue(expr)) {
      if (quantifier === "AT_LEAST_ONE" || quantifier === "ALL_TIMES") {
        return true
      }
    }

    const target = targetType || this.inferTargetType(expr)

    if (target === "CONNECTION") {
      const items = candidate.connections
      const count = items.filter((conn) =>
        this.matchConnection(expr, conn, repository, traversal)
      ).length

      return this.checkQuantifier(quantifier, count, items.length)
    } else {
      // Default: ENTITY
      const items = candidate.entities
      const count = items.filter((ent) =>
        this.matchEntity(expr, ent, repository, traversal)
      ).length

      return this.checkQuantifier(quantifier, count, items.length)
    }
  }

  /**
   * Validates if a match count satisfies a quantifier.
   */
  private static checkQuantifier(
    quantifier: PathConstraintQuantifier,
    matchCount: number,
    totalCount: number
  ): boolean {
    if (quantifier === "AVOID") {
      return matchCount === 0
    }
    if (quantifier === "ALL_TIMES") {
      return totalCount > 0 && matchCount === totalCount
    }
    if (typeof quantifier === "object" && "times" in quantifier) {
      return matchCount === quantifier.times
    }
    // Default AT_LEAST_ONE
    return matchCount >= 1
  }

  /**
   * Retrieves all sequence indices (0..N) where a sub-expression matches along the candidate path.
   */
  private static getMatchingIndices(
    pathExpr: PathExpression,
    candidate: CandidatePath,
    repository: EntityRepository,
    traversal: GraphTraversalEngineInterface,
    defaultTargetType?: "CONNECTION" | "ENTITY"
  ): number[] {
    if (pathExpr.type === "PATH_CONSTRAINT") {
      const resolvedTarget =
        pathExpr.targetType === "ANY"
          ? defaultTargetType
          : pathExpr.targetType || defaultTargetType
      const target = resolvedTarget || this.inferTargetType(pathExpr.expression)

      if (target === "CONNECTION") {
        const indices: number[] = []
        candidate.connections.forEach((conn, idx) => {
          if (
            this.matchConnection(
              pathExpr.expression,
              conn,
              repository,
              traversal
            )
          ) {
            indices.push(idx)
          }
        })
        return indices
      } else {
        const indices: number[] = []
        candidate.entities.forEach((ent, idx) => {
          if (
            this.matchEntity(pathExpr.expression, ent, repository, traversal)
          ) {
            indices.push(idx)
          }
        })
        return indices
      }
    }

    if (pathExpr.type === "PATH_OR") {
      const left = this.getMatchingIndices(
        pathExpr.left,
        candidate,
        repository,
        traversal,
        defaultTargetType
      )
      const right = this.getMatchingIndices(
        pathExpr.right,
        candidate,
        repository,
        traversal,
        defaultTargetType
      )
      return Array.from(new Set([...left, ...right])).sort((a, b) => a - b)
    }

    return []
  }

  /**
   * Checks if an entity matches a WHERE Expression.
   */
  public static matchEntity(
    expr: Expression | PrimaryOperand,
    entity: Entity,
    repository: EntityRepository,
    traversal: GraphTraversalEngineInterface
  ): boolean {
    const context: QueryContext = {
      currentEntity: entity,
      repository,
      traversal,
    }

    try {
      const result = ExpressionEvaluator.evaluate(expr, context)
      return Boolean(result)
    } catch {
      return false
    }
  }

  /**
   * Checks if a connection matches a WHERE Expression.
   */
  public static matchConnection(
    expr: Expression | PrimaryOperand,
    connection: Connection,
    repository: EntityRepository,
    traversal: GraphTraversalEngineInterface
  ): boolean {
    // Model connection as a QueryContext entity-like structure for record & template selectors
    const connEntity: Entity = {
      id: connection.id,
      template: connection.template,
      records: connection.records || [],
    }

    const context: QueryContext = {
      currentEntity: connEntity,
      currentConnection: connection,
      repository,
      traversal,
    }

    try {
      const result = ExpressionEvaluator.evaluate(expr, context)
      return Boolean(result)
    } catch {
      return false
    }
  }

  /**
   * Heuristic to infer if an unannotated constraint targets CONNECTION or ENTITY.
   */
  private static inferTargetType(
    _expr: Expression | PrimaryOperand
  ): "CONNECTION" | "ENTITY" {
    return "ENTITY"
  }
}
