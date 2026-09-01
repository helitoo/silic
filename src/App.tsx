import { TemplateProvider } from "@/contexts/TemplateContext"
import { ConnectionProvider } from "@/contexts/ConnectionContext"
import { EntityProvider } from "@/contexts/EntityContext"
import { QueryProvider } from "@/contexts/QueryContext"
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
        <GoogleDrivePickerProvider>
          <TemplateProvider>
            <ConnectionProvider>
              <EntityProvider>
                <ProjectStorageProvider>
                  <QueryProvider>
                    <LongTextEditorProvider>
                      <AppContent />
                    </LongTextEditorProvider>
                  </QueryProvider>
                </ProjectStorageProvider>
              </EntityProvider>
            </ConnectionProvider>
          </TemplateProvider>
        </GoogleDrivePickerProvider>
      </RouterProvider>
    </LangProvider>
  )
}

export default App
