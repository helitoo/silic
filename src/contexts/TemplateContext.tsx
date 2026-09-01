import * as React from "react"
import type { Template } from "@/lib/types"

export interface TemplateContextType {
  templates: Template[]
  setTemplates: React.Dispatch<React.SetStateAction<Template[]>>
  put: (data: Template) => void
  delete: (id: string) => void
}

export const TemplateContext = React.createContext<TemplateContextType | null>(
  null
)

export function TemplateProvider({ children }: { children: React.ReactNode }) {
  const [templates, setTemplates] = React.useState<Template[]>([])

  const put = React.useCallback((data: Template) => {
    setTemplates((prev) => {
      const existsIndex = prev.findIndex((item) => item.id === data.id)
      if (existsIndex >= 0) {
        const next = [...prev]
        next[existsIndex] = data
        return next
      }
      return [...prev, data]
    })
  }, [])

  const deleteTemplate = React.useCallback((id: string) => {
    setTemplates((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const value = React.useMemo(
    () => ({
      templates,
      setTemplates,
      put,
      delete: deleteTemplate,
    }),
    [templates, setTemplates, put, deleteTemplate]
  )

  return (
    <TemplateContext.Provider value={value}>
      {children}
    </TemplateContext.Provider>
  )
}

export function useTemplate(): TemplateContextType {
  const context = React.useContext(TemplateContext)
  if (!context) {
    throw new Error("useTemplate must be used within a TemplateProvider")
  }
  return context
}

export const useTemplates = useTemplate
