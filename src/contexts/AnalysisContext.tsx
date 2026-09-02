import * as React from "react"

export interface AnalysisContextType {
  isAnalysisOpen: boolean
  setIsAnalysisOpen: React.Dispatch<React.SetStateAction<boolean>>
  openAnalysis: () => void
  closeAnalysis: () => void
}

export const AnalysisContext = React.createContext<AnalysisContextType | null>(
  null
)

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const [isAnalysisOpen, setIsAnalysisOpen] = React.useState<boolean>(false)

  const openAnalysis = React.useCallback(() => setIsAnalysisOpen(true), [])
  const closeAnalysis = React.useCallback(() => setIsAnalysisOpen(false), [])

  const value = React.useMemo(
    () => ({
      isAnalysisOpen,
      setIsAnalysisOpen,
      openAnalysis,
      closeAnalysis,
    }),
    [isAnalysisOpen, openAnalysis, closeAnalysis]
  )

  return (
    <AnalysisContext.Provider value={value}>
      {children}
    </AnalysisContext.Provider>
  )
}

export function useAnalysis(): AnalysisContextType {
  const context = React.useContext(AnalysisContext)
  if (!context) {
    throw new Error("useAnalysis must be used within an AnalysisProvider")
  }
  return context
}

export const useAnalysisContext = useAnalysis

export default AnalysisContext
