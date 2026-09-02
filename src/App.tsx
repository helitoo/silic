import { TemplateProvider } from "@/contexts/TemplateContext"
import { ConnectionProvider } from "@/contexts/ConnectionContext"
import { EntityProvider } from "@/contexts/EntityContext"
import { QueryProvider } from "@/contexts/QueryContext"
import { AnalysisProvider } from "@/contexts/AnalysisContext"
import { LangProvider } from "@/contexts/LangContext"
import { RouterProvider } from "@/contexts/RouterContext"
import { GoogleDrivePickerProvider } from "@/contexts/GoogleDrivePickerContext"
import { ProjectStorageProvider } from "@/contexts/ProjectStorageContext"
import { LongTextEditorProvider } from "@/components/ui/longTextEditor"
import AppContent from "@/components/main/AppContent"

export function App() {
  return (
    <LangProvider>
      <RouterProvider>
        <TemplateProvider>
          <ConnectionProvider>
            <EntityProvider>
              <ProjectStorageProvider>
                <GoogleDrivePickerProvider>
                  <QueryProvider>
                    <AnalysisProvider>
                      <LongTextEditorProvider>
                        <AppContent />
                      </LongTextEditorProvider>
                    </AnalysisProvider>
                  </QueryProvider>
                </GoogleDrivePickerProvider>
              </ProjectStorageProvider>
            </EntityProvider>
          </ConnectionProvider>
        </TemplateProvider>
      </RouterProvider>
    </LangProvider>
  )
}

export default App
