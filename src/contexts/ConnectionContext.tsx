import * as React from "react"
import type { Connection } from "@/lib/types"
import { getConnectionName } from "@/lib/utils"

export interface ConnectionContextType {
  connections: Connection[]
  setConnections: React.Dispatch<React.SetStateAction<Connection[]>>
  put: (data: Connection) => void
  delete: (id: string) => void
  allConnectionRecordNames: string[]
  getConnectionDisplayName: (connOrId?: Connection | string) => string
}

export const ConnectionContext =
  React.createContext<ConnectionContextType | null>(null)

export function ConnectionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [connections, setConnections] = React.useState<Connection[]>([])

  const put = React.useCallback((data: Connection) => {
    setConnections((prev) => {
      const existsIndex = prev.findIndex((item) => item.id === data.id)
      if (existsIndex >= 0) {
        const next = [...prev]
        next[existsIndex] = data
        return next
      }
      return [...prev, data]
    })
  }, [])

  const deleteConnection = React.useCallback((id: string) => {
    setConnections((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const allConnectionRecordNames = React.useMemo(() => {
    const set = new Set<string>()
    for (const conn of connections) {
      if (Array.isArray(conn.records)) {
        for (const rec of conn.records) {
          if (rec && rec.name) set.add(rec.name)
        }
      }
    }
    return Array.from(set)
  }, [connections])

  const getConnectionDisplayName = React.useCallback(
    (connOrId?: Connection | string) => {
      if (!connOrId) return ""
      const conn =
        typeof connOrId === "string"
          ? connections.find((c) => c.id === connOrId)
          : connOrId

      if (!conn) {
        return typeof connOrId === "string" ? connOrId : ""
      }

      return getConnectionName(conn)
    },
    [connections]
  )

  const value = React.useMemo<ConnectionContextType>(
    () => ({
      connections,
      setConnections,
      put,
      delete: deleteConnection,
      allConnectionRecordNames,
      getConnectionDisplayName,
    }),
    [
      connections,
      setConnections,
      put,
      deleteConnection,
      allConnectionRecordNames,
      getConnectionDisplayName,
    ]
  )

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  )
}

export function useConnection(): ConnectionContextType {
  const context = React.useContext(ConnectionContext)
  if (!context) {
    throw new Error("useConnection must be used within a ConnectionProvider")
  }
  return context
}

export const useConnections = useConnection
