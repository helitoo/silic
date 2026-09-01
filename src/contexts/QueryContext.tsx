import * as React from "react"
import type { Entity, Connection } from "@/lib/types"
import type { EntityQuery, PathQuery } from "@/lib/query-types"
import { QueryExecutionRouter, type PathQueryResult } from "@/lib/query"
import { useEntity } from "./EntityContext"
import { useConnection } from "./ConnectionContext"

export interface QueryContextType {
  // Entity query state & execution
  entityQuery?: EntityQuery
  setEntityQuery: React.Dispatch<React.SetStateAction<EntityQuery | undefined>>
  currentEntities: Entity[]
  isEntityFiltered: boolean
  executeEntityQuery: (query?: EntityQuery) => Entity[]
  resetEntities: () => void
  isEntityQueryOpen: boolean
  setIsEntityQueryOpen: React.Dispatch<React.SetStateAction<boolean>>
  openEntityQuery: () => void
  closeEntityQuery: () => void

  // Path query state & execution
  pathQuery?: PathQuery
  setPathQuery: React.Dispatch<React.SetStateAction<PathQuery | undefined>>
  currentPath: PathQueryResult
  currentConnections: Connection[]
  isPathFiltered: boolean
  executePathQuery: (query?: PathQuery) => PathQueryResult
  resetPath: () => void
  isPathQueryOpen: boolean
  setIsPathQueryOpen: React.Dispatch<React.SetStateAction<boolean>>
  openPathQuery: () => void
  closePathQuery: () => void

  // General reset
  resetAll: () => void
}

export const QueryContext = React.createContext<QueryContextType | null>(null)

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const { entities } = useEntity()
  const { connections } = useConnection()

  const [entityQuery, setEntityQuery] = React.useState<EntityQuery | undefined>(
    undefined
  )
  const [filteredEntities, setFilteredEntities] = React.useState<
    Entity[] | undefined
  >(undefined)
  const [isEntityFiltered, setIsEntityFiltered] = React.useState<boolean>(false)
  const [isEntityQueryOpen, setIsEntityQueryOpen] =
    React.useState<boolean>(false)

  const [pathQuery, setPathQuery] = React.useState<PathQuery | undefined>(
    undefined
  )
  const [currentPath, setCurrentPath] = React.useState<PathQueryResult>({
    found: false,
    entities: [],
    connections: [],
  })
  const [isPathFiltered, setIsPathFiltered] = React.useState<boolean>(false)
  const [isPathQueryOpen, setIsPathQueryOpen] = React.useState<boolean>(false)

  // When filtered, currentEntities returns the query result; otherwise original entities
  const currentEntities = React.useMemo(() => {
    if (isEntityFiltered && filteredEntities !== undefined) {
      return filteredEntities
    }
    return entities
  }, [isEntityFiltered, filteredEntities, entities])

  // When path query found path, currentConnections returns path connections; otherwise original connections
  const currentConnections = React.useMemo(() => {
    if (
      isPathFiltered &&
      currentPath.found &&
      currentPath.connections.length > 0
    ) {
      return currentPath.connections
    }
    return connections
  }, [isPathFiltered, currentPath, connections])

  const executeEntityQuery = React.useCallback(
    (queryToRun?: EntityQuery): Entity[] => {
      const targetQuery = queryToRun || entityQuery
      if (!targetQuery) {
        setFilteredEntities(undefined)
        setIsEntityFiltered(false)
        return entities
      }
      setEntityQuery(targetQuery)
      const results = QueryExecutionRouter.executeEntityQuery(
        targetQuery,
        entities,
        connections
      )
      setFilteredEntities(results)
      setIsEntityFiltered(true)
      return results
    },
    [entityQuery, entities, connections]
  )

  const resetEntities = React.useCallback(() => {
    setEntityQuery(undefined)
    setFilteredEntities(undefined)
    setIsEntityFiltered(false)
  }, [])

  const executePathQuery = React.useCallback(
    (queryToRun?: PathQuery): PathQueryResult => {
      const targetQuery = queryToRun || pathQuery
      if (!targetQuery) {
        const empty: PathQueryResult = {
          found: false,
          entities: [],
          connections: [],
        }
        setCurrentPath(empty)
        setIsPathFiltered(false)
        return empty
      }
      setPathQuery(targetQuery)
      const result = QueryExecutionRouter.executePathQuery(
        targetQuery,
        entities,
        connections
      )
      setCurrentPath(result)
      setIsPathFiltered(result.found)
      return result
    },
    [pathQuery, entities, connections]
  )

  const resetPath = React.useCallback(() => {
    setPathQuery(undefined)
    setCurrentPath({ found: false, entities: [], connections: [] })
    setIsPathFiltered(false)
  }, [])

  const openEntityQuery = React.useCallback(() => setIsEntityQueryOpen(true), [])
  const closeEntityQuery = React.useCallback(() => setIsEntityQueryOpen(false), [])

  const openPathQuery = React.useCallback(() => setIsPathQueryOpen(true), [])
  const closePathQuery = React.useCallback(() => setIsPathQueryOpen(false), [])

  const resetAll = React.useCallback(() => {
    resetEntities()
    resetPath()
  }, [resetEntities, resetPath])

  const value = React.useMemo<QueryContextType>(
    () => ({
      entityQuery,
      setEntityQuery,
      currentEntities,
      isEntityFiltered,
      executeEntityQuery,
      resetEntities,
      isEntityQueryOpen,
      setIsEntityQueryOpen,
      openEntityQuery,
      closeEntityQuery,
      pathQuery,
      setPathQuery,
      currentPath,
      currentConnections,
      isPathFiltered,
      executePathQuery,
      resetPath,
      isPathQueryOpen,
      setIsPathQueryOpen,
      openPathQuery,
      closePathQuery,
      resetAll,
    }),
    [
      entityQuery,
      currentEntities,
      isEntityFiltered,
      executeEntityQuery,
      resetEntities,
      isEntityQueryOpen,
      openEntityQuery,
      closeEntityQuery,
      pathQuery,
      currentPath,
      currentConnections,
      isPathFiltered,
      executePathQuery,
      resetPath,
      isPathQueryOpen,
      openPathQuery,
      closePathQuery,
      resetAll,
    ]
  )

  return <QueryContext.Provider value={value}>{children}</QueryContext.Provider>
}

export function useQuery(): QueryContextType {
  const context = React.useContext(QueryContext)
  if (!context) {
    throw new Error("useQuery must be used within a QueryProvider")
  }
  return context
}

export const useQueryContext = useQuery
