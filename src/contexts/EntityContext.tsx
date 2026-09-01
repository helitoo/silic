import * as React from "react"
import type { Entity } from "@/lib/types"
import type { EntityQuery, PathQuery } from "@/lib/query-types"
import { QueryExecutionRouter, type PathQueryResult } from "@/lib/query"
import { getEntityName } from "@/lib/utils"
import { useConnection } from "./ConnectionContext"

export interface EntityContextType {
  entities: Entity[]
  setEntities: React.Dispatch<React.SetStateAction<Entity[]>>
  put: (data: Entity) => void
  delete: (id: string) => void
  entityQuery?: EntityQuery
  setEntityQuery: React.Dispatch<React.SetStateAction<EntityQuery | undefined>>
  executeEntityQuery: (query?: EntityQuery) => Entity[]
  pathQuery?: PathQuery
  setPathQuery: React.Dispatch<React.SetStateAction<PathQuery | undefined>>
  executePathQuery: (query?: PathQuery) => PathQueryResult
  allRecordNames: string[]
  getEntityDisplayInfo: (entityOrId?: Entity | string) => {
    id: string
    title: string
  }
}

export const EntityContext = React.createContext<EntityContextType | null>(null)

export function EntityProvider({ children }: { children: React.ReactNode }) {
  const { connections } = useConnection()
  const [entities, setEntities] = React.useState<Entity[]>([])
  const [entityQuery, setEntityQuery] = React.useState<EntityQuery | undefined>(
    undefined
  )
  const [pathQuery, setPathQuery] = React.useState<PathQuery | undefined>(
    undefined
  )

  const put = React.useCallback((data: Entity) => {
    setEntities((prev) => {
      const existsIndex = prev.findIndex((item) => item.id === data.id)
      if (existsIndex >= 0) {
        const next = [...prev]
        next[existsIndex] = data
        return next
      }
      return [...prev, data]
    })
  }, [])

  const deleteEntity = React.useCallback((id: string) => {
    setEntities((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const executeEntityQuery = React.useCallback(
    (queryToRun?: EntityQuery): Entity[] => {
      const targetQuery = queryToRun || entityQuery
      if (!targetQuery) return []
      return QueryExecutionRouter.executeEntityQuery(
        targetQuery,
        entities,
        connections
      )
    },
    [entities, entityQuery, connections]
  )

  const executePathQuery = React.useCallback(
    (queryToRun?: PathQuery): PathQueryResult => {
      const targetQuery = queryToRun || pathQuery
      if (!targetQuery) {
        return {
          found: false,
          entities: [],
          connections: [],
        }
      }
      return QueryExecutionRouter.executePathQuery(
        targetQuery,
        entities,
        connections
      )
    },
    [entities, pathQuery, connections]
  )

  const allRecordNames = React.useMemo(() => {
    const set = new Set<string>()
    for (const ent of entities) {
      if (Array.isArray(ent.records)) {
        for (const rec of ent.records) {
          if (rec && rec.name) set.add(rec.name)
        }
      }
    }
    return Array.from(set)
  }, [entities])

  const getEntityDisplayInfo = React.useCallback(
    (entityOrId?: Entity | string) => {
      if (!entityOrId) return { id: "", title: "" }
      const ent =
        typeof entityOrId === "string"
          ? entities.find((e) => e.id === entityOrId)
          : entityOrId
      if (!ent) {
        return {
          id: typeof entityOrId === "string" ? entityOrId : "",
          title: typeof entityOrId === "string" ? entityOrId : "",
        }
      }
      return { id: ent.id, title: getEntityName(ent) }
    },
    [entities]
  )

  const value = React.useMemo<EntityContextType>(
    () => ({
      entities,
      setEntities,
      put,
      delete: deleteEntity,
      entityQuery,
      setEntityQuery,
      executeEntityQuery,
      pathQuery,
      setPathQuery,
      executePathQuery,
      allRecordNames,
      getEntityDisplayInfo,
    }),
    [
      entities,
      setEntities,
      put,
      deleteEntity,
      entityQuery,
      executeEntityQuery,
      pathQuery,
      executePathQuery,
      allRecordNames,
      getEntityDisplayInfo,
    ]
  )

  return (
    <EntityContext.Provider value={value}>{children}</EntityContext.Provider>
  )
}

export function useEntity(): EntityContextType {
  const context = React.useContext(EntityContext)
  if (!context) {
    throw new Error("useEntity must be used within an EntityProvider")
  }
  return context
}

export const useEntities = useEntity
