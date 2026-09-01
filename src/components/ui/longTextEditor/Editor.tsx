import * as React from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { FileText, Trash2, Check, X } from "lucide-react"
import { useLang } from "@/contexts/LangContext"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Menubar } from "./Menubar"

export interface LongTextEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialContent?: string
  title?: string
  description?: string
  onSave?: (content: string) => void
}

export function LongTextEditorDialog({
  open,
  onOpenChange,
  initialContent = "",
  title,
  description,
  onSave,
}: LongTextEditorDialogProps) {
  const { t } = useLang()

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "tiptap rich-text-content min-h-[300px] sm:min-h-[460px] w-full px-5 py-4 text-sm focus:outline-none",
      },
    },
  })

  // Synchronize content when dialog opens
  React.useEffect(() => {
    if (open && editor) {
      editor.commands.setContent(initialContent || "")
    }
  }, [open, initialContent, editor])

  const handleSave = () => {
    if (!editor) return
    const isEditorEmpty = editor.isEmpty
    const html = isEditorEmpty ? "" : editor.getHTML()
    if (onSave) {
      onSave(html)
    }
    onOpenChange(false)
  }

  const handleClear = () => {
    if (editor) {
      editor.commands.clearContent()
      editor.commands.focus()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-full max-h-full w-full max-w-none flex-col gap-0 overflow-hidden rounded-none p-0 sm:h-[88vh] sm:max-h-[90vh] sm:max-w-4xl sm:rounded-xl">
        {/* Dialog Header */}
        <DialogHeader className="border-b border-border/50 bg-muted/20 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <FileText className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold sm:text-base">
                {title || t("editor.title")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {description || t("editor.description")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Editor Toolbar & Content */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-card">
          <Menubar editor={editor} className="shrink-0" />
          <div className="relative min-h-0 flex-1 overflow-y-auto bg-background/50">
            <EditorContent
              editor={editor}
              className="h-full w-full"
            />
          </div>
        </div>

        {/* Dialog Footer */}
        <DialogFooter className="flex flex-row items-center justify-between border-t border-border/50 bg-muted/20 px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-destructive"
              title={t("editor.clearContent")}
            >
              <Trash2 className="size-3.5" />
              <span>{t("editor.clear")}</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 gap-1 px-3 text-xs"
            >
              <X className="size-3.5" />
              <span>{t("editor.cancel")}</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              className="h-8 gap-1.5 px-3 text-xs font-semibold"
            >
              <Check className="size-3.5" />
              <span>{t("editor.save")}</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// -------------------------------------------------------------
// Singleton Editor Context & Provider (1 Editor on entire app)
// -------------------------------------------------------------

export interface OpenEditorOptions {
  initialContent?: string
  title?: string
  description?: string
  onSave: (content: string) => void
}

export interface LongTextEditorContextType {
  openEditor: (options: OpenEditorOptions) => void
  closeEditor: () => void
}

const LongTextEditorContext = React.createContext<
  LongTextEditorContextType | undefined
>(undefined)

export function LongTextEditorProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [editorState, setEditorState] = React.useState<{
    initialContent: string
    title?: string
    description?: string
    onSave?: (content: string) => void
  }>({
    initialContent: "",
  })

  const openEditor = React.useCallback((options: OpenEditorOptions) => {
    setEditorState({
      initialContent: options.initialContent || "",
      title: options.title,
      description: options.description,
      onSave: options.onSave,
    })
    setIsOpen(true)
  }, [])

  const closeEditor = React.useCallback(() => {
    setIsOpen(false)
  }, [])

  const handleSave = React.useCallback(
    (html: string) => {
      if (editorState.onSave) {
        editorState.onSave(html)
      }
    },
    [editorState]
  )

  const value = React.useMemo(
    () => ({ openEditor, closeEditor }),
    [openEditor, closeEditor]
  )

  return (
    <LongTextEditorContext.Provider value={value}>
      {children}
      <LongTextEditorDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        initialContent={editorState.initialContent}
        title={editorState.title}
        description={editorState.description}
        onSave={handleSave}
      />
    </LongTextEditorContext.Provider>
  )
}

export function useLongTextEditor() {
  const context = React.useContext(LongTextEditorContext)
  if (!context) {
    throw new Error(
      "useLongTextEditor must be used within a LongTextEditorProvider"
    )
  }
  return context
}

export default LongTextEditorDialog
