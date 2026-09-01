import type {
  Connection,
  ConnectionSelector,
  Entity,
  EntityRepository,
  GraphTraversalEngineInterface,
  PathQueryResult,
} from "../types"

function matchesConnectionSelector(
  conn: Connection,
  selector?: ConnectionSelector | ConnectionSelector[]
): boolean {
  if (!selector) return true
  const selectors = Array.isArray(selector) ? selector : [selector]
  if (selectors.length === 0) return true

  return selectors.some((sel) => {
    // 1. Template check
    if (
      sel.template &&
      sel.template.length > 0 &&
      !sel.template.includes("__ALL__")
    ) {
      if (!conn.template || !sel.template.includes(conn.template)) {
        return false
      }
    }
    // 2. Record name check
    if (sel.record && sel.record !== "__ALL__") {
      return conn.records?.some((r) => r.name === sel.record)
    }
    return true
  })
}

export class GraphTraversalEngine implements GraphTraversalEngineInterface {
  private repository: EntityRepository

  constructor(repository: EntityRepository) {
    this.repository = repository
  }

  /**
   * Get all outbound neighbors from entityId based on multi-entity connections:
   * 1. If entityId is in conn.from -> connects to all entities in conn.to
   * 2. If isDirectional === false and entityId is in conn.to -> connects to all entities in conn.from
   * 3. Filtered by ConnectionSelector
   */
  public getOutboundNeighbors(
    entityId: string,
    allowedSelectors?: ConnectionSelector[] | ConnectionSelector
  ): Array<{ to: string; connection: Connection }> {
    const results: Array<{ to: string; connection: Connection }> = []
    const seen = new Set<string>()

    const allConnections = this.repository.getConnections()

    for (const conn of allConnections) {
      if (!matchesConnectionSelector(conn, allowedSelectors)) {
        continue
      }

      // Forward direction: entityId in conn.from
      if (Array.isArray(conn.from) && conn.from.includes(entityId)) {
        if (Array.isArray(conn.to)) {
          for (const targetId of conn.to) {
            if (targetId && targetId !== entityId) {
              const key = `${targetId}:::${conn.id}`
              if (!seen.has(key)) {
                seen.add(key)
                results.push({ to: targetId, connection: conn })
              }
            }
          }
        }
      }

      // Reverse direction for undirected: entityId in conn.to
      if (
        conn.isDirectional === false &&
        Array.isArray(conn.to) &&
        conn.to.includes(entityId)
      ) {
        if (Array.isArray(conn.from)) {
          for (const sourceId of conn.from) {
            if (sourceId && sourceId !== entityId) {
              const key = `${sourceId}:::${conn.id}`
              if (!seen.has(key)) {
                seen.add(key)
                results.push({ to: sourceId, connection: conn })
              }
            }
          }
        }
      }
    }

    return results
  }

  /**
   * Get all inbound sources pointing to entityId based on multi-entity connections:
   * 1. If entityId is in conn.to -> sources are in conn.from
   * 2. If isDirectional === false and entityId is in conn.from -> sources are in conn.to
   * 3. Filtered by ConnectionSelector
   */
  public getInboundNeighbors(
    entityId: string,
    allowedSelectors?: ConnectionSelector[] | ConnectionSelector
  ): Array<{ from: string; connection: Connection }> {
    const results: Array<{ from: string; connection: Connection }> = []
    const seen = new Set<string>()

    const allConnections = this.repository.getConnections()

    for (const conn of allConnections) {
      if (!matchesConnectionSelector(conn, allowedSelectors)) {
        continue
      }

      // Direct inbound: entityId in conn.to
      if (Array.isArray(conn.to) && conn.to.includes(entityId)) {
        if (Array.isArray(conn.from)) {
          for (const sourceId of conn.from) {
            if (sourceId && sourceId !== entityId) {
              const key = `${sourceId}:::${conn.id}`
              if (!seen.has(key)) {
                seen.add(key)
                results.push({ from: sourceId, connection: conn })
              }
            }
          }
        }
      }

      // Reverse direction for undirected: entityId in conn.from
      if (
        conn.isDirectional === false &&
        Array.isArray(conn.from) &&
        conn.from.includes(entityId)
      ) {
        if (Array.isArray(conn.to)) {
          for (const targetId of conn.to) {
            if (targetId && targetId !== entityId) {
              const key = `${targetId}:::${conn.id}`
              if (!seen.has(key)) {
                seen.add(key)
                results.push({ from: targetId, connection: conn })
              }
            }
          }
        }
      }
    }

    return results
  }

  /**
   * Traverses graph outbound from an entity based on a segment.
   */
  public traverseOutbound(
    entityId: string,
    segment: { connection?: ConnectionSelector; hop?: number }
  ): string[] {
    const steps =
      segment.hop !== undefined ? Math.max(0, segment.hop - 1) : 1

    if (steps === 0) {
      return [entityId]
    }

    let currentLevel = [entityId]

    for (let step = 0; step < steps; step++) {
      const nextLevel: string[] = []
      const visitedInStep = new Set<string>()

      for (const currId of currentLevel) {
        const neighbors = this.getOutboundNeighbors(currId, segment.connection)
        for (const nb of neighbors) {
          if (!visitedInStep.has(nb.to)) {
            visitedInStep.add(nb.to)
            nextLevel.push(nb.to)
          }
        }
      }

      currentLevel = nextLevel
      if (currentLevel.length === 0) break
    }

    return currentLevel
  }

  /**
   * Traverses graph inbound (backwards) to find entities that lead to entityId.
   */
  public traverseInbound(
    entityId: string,
    segment: { connection?: ConnectionSelector; hop?: number }
  ): string[] {
    const steps =
      segment.hop !== undefined ? Math.max(0, segment.hop - 1) : 1

    if (steps === 0) {
      return [entityId]
    }

    let currentLevel = [entityId]

    for (let step = 0; step < steps; step++) {
      const nextLevel: string[] = []
      const visitedInStep = new Set<string>()

      for (const currId of currentLevel) {
        const sources = this.getInboundNeighbors(currId, segment.connection)
        for (const src of sources) {
          if (!visitedInStep.has(src.from)) {
            visitedInStep.add(src.from)
            nextLevel.push(src.from)
          }
        }
      }

      currentLevel = nextLevel
      if (currentLevel.length === 0) break
    }

    return currentLevel
  }

  /**
   * Alias for outbound traverse
   */
  public traverse(
    entityId: string,
    segment: { connection?: ConnectionSelector; hop?: number }
  ): string[] {
    return this.traverseOutbound(entityId, segment)
  }

  /**
   * Traverses multiple segments sequentially.
   */
  public traverseMulti(
    entityId: string,
    segments: Array<{ connection?: ConnectionSelector; hop?: number }>
  ): string[] {
    if (!segments || segments.length === 0) {
      return [entityId]
    }

    let currentEntities = [entityId]

    for (const seg of segments) {
      const nextEntities: string[] = []
      const seen = new Set<string>()

      for (const entId of currentEntities) {
        const targets = this.traverseOutbound(entId, seg)
        for (const targetId of targets) {
          if (!seen.has(targetId)) {
            seen.add(targetId)
            nextEntities.push(targetId)
          }
        }
      }

      currentEntities = nextEntities
      if (currentEntities.length === 0) break
    }

    return currentEntities
  }

  /**
   * Breadth-First Search to find the shortest path between `from` and `to`.
   */
  public shortestPath(
    from: string,
    to: string,
    allowedConnections?: ConnectionSelector[]
  ): PathQueryResult {
    if (from === to) {
      const startEntity = this.repository.getById(from)
      return {
        found: true,
        entities: startEntity ? [startEntity] : [],
        connections: [],
      }
    }

    const queue: string[] = [from]
    const visited = new Set<string>([from])
    const parentMap = new Map<
      string,
      { parent: string; connection: Connection }
    >()

    let found = false

    while (queue.length > 0) {
      const curr = queue.shift()!

      const neighbors = this.getOutboundNeighbors(curr, allowedConnections)
      for (const { to: nextId, connection: conn } of neighbors) {
        if (!visited.has(nextId)) {
          visited.add(nextId)
          parentMap.set(nextId, { parent: curr, connection: conn })
          queue.push(nextId)

          if (nextId === to) {
            found = true
            break
          }
        }
      }

      if (found) break
    }

    if (!found) {
      return {
        found: false,
        entities: [],
        connections: [],
      }
    }

    // Reconstruct path
    const entityIdPath: string[] = [to]
    const connectionPath: Connection[] = []

    let curr = to
    while (curr !== from) {
      const edge = parentMap.get(curr)
      if (!edge) break
      connectionPath.unshift(edge.connection)
      curr = edge.parent
      entityIdPath.unshift(curr)
    }

    const entities: Entity[] = entityIdPath
      .map((id) => this.repository.getById(id))
      .filter((ent): ent is Entity => ent !== undefined)

    return {
      found: true,
      entities,
      connections: connectionPath,
    }
  }
}
