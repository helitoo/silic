import type { Editor } from "@tiptap/react"
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  List,
  ListOrdered,
  Quote,
  SquareCode,
  Minus,
  Undo2,
  Redo2,
  RemoveFormatting,
  type LucideIcon,
} from "lucide-react"

export interface MenubarItem {
  id: string
  label: string
  icon?: LucideIcon
  action: (editor: Editor) => void
  isActive?: (editor: Editor) => boolean
  canExecute?: (editor: Editor) => boolean
  shortcut?: string
}

export interface MenubarGroup {
  id: string
  items: MenubarItem[]
}

export const getMenubarGroups = (t?: (key: string) => string): MenubarGroup[] => {
  const tr = (key: string, fallback: string) => (t ? t(key) : fallback)

  return [
    {
      id: "history",
      items: [
        {
          id: "undo",
          label: tr("editor.undo", "Undo"),
          icon: Undo2,
          action: (editor) => editor.chain().focus().undo().run(),
          canExecute: (editor) => editor.can().undo(),
          shortcut: "Ctrl+Z",
        },
        {
          id: "redo",
          label: tr("editor.redo", "Redo"),
          icon: Redo2,
          action: (editor) => editor.chain().focus().redo().run(),
          canExecute: (editor) => editor.can().redo(),
          shortcut: "Ctrl+Y",
        },
      ],
    },
    {
      id: "headings",
      items: [
        {
          id: "paragraph",
          label: tr("editor.paragraph", "Paragraph"),
          icon: Pilcrow,
          action: (editor) => editor.chain().focus().setParagraph().run(),
          isActive: (editor) => editor.isActive("paragraph"),
        },
        {
          id: "h1",
          label: tr("editor.h1", "Heading 1"),
          icon: Heading1,
          action: (editor) =>
            editor.chain().focus().toggleHeading({ level: 1 }).run(),
          isActive: (editor) => editor.isActive("heading", { level: 1 }),
        },
        {
          id: "h2",
          label: tr("editor.h2", "Heading 2"),
          icon: Heading2,
          action: (editor) =>
            editor.chain().focus().toggleHeading({ level: 2 }).run(),
          isActive: (editor) => editor.isActive("heading", { level: 2 }),
        },
        {
          id: "h3",
          label: tr("editor.h3", "Heading 3"),
          icon: Heading3,
          action: (editor) =>
            editor.chain().focus().toggleHeading({ level: 3 }).run(),
          isActive: (editor) => editor.isActive("heading", { level: 3 }),
        },
      ],
    },
    {
      id: "formatting",
      items: [
        {
          id: "bold",
          label: tr("editor.bold", "Bold"),
          icon: Bold,
          action: (editor) => editor.chain().focus().toggleBold().run(),
          isActive: (editor) => editor.isActive("bold"),
          shortcut: "Ctrl+B",
        },
        {
          id: "italic",
          label: tr("editor.italic", "Italic"),
          icon: Italic,
          action: (editor) => editor.chain().focus().toggleItalic().run(),
          isActive: (editor) => editor.isActive("italic"),
          shortcut: "Ctrl+I",
        },
        {
          id: "strike",
          label: tr("editor.strike", "Strikethrough"),
          icon: Strikethrough,
          action: (editor) => editor.chain().focus().toggleStrike().run(),
          isActive: (editor) => editor.isActive("strike"),
          shortcut: "Ctrl+Shift+X",
        },
        {
          id: "code",
          label: tr("editor.inlineCode", "Inline Code"),
          icon: Code,
          action: (editor) => editor.chain().focus().toggleCode().run(),
          isActive: (editor) => editor.isActive("code"),
          shortcut: "Ctrl+E",
        },
      ],
    },
    {
      id: "lists-and-blocks",
      items: [
        {
          id: "bulletList",
          label: tr("editor.bulletList", "Bullet List"),
          icon: List,
          action: (editor) => editor.chain().focus().toggleBulletList().run(),
          isActive: (editor) => editor.isActive("bulletList"),
        },
        {
          id: "orderedList",
          label: tr("editor.orderedList", "Numbered List"),
          icon: ListOrdered,
          action: (editor) => editor.chain().focus().toggleOrderedList().run(),
          isActive: (editor) => editor.isActive("orderedList"),
        },
        {
          id: "blockquote",
          label: tr("editor.blockquote", "Quote"),
          icon: Quote,
          action: (editor) => editor.chain().focus().toggleBlockquote().run(),
          isActive: (editor) => editor.isActive("blockquote"),
        },
        {
          id: "codeBlock",
          label: tr("editor.codeBlock", "Code Block"),
          icon: SquareCode,
          action: (editor) => editor.chain().focus().toggleCodeBlock().run(),
          isActive: (editor) => editor.isActive("codeBlock"),
        },
        {
          id: "horizontalRule",
          label: tr("editor.horizontalRule", "Divider"),
          icon: Minus,
          action: (editor) => editor.chain().focus().setHorizontalRule().run(),
        },
      ],
    },
    {
      id: "cleanup",
      items: [
        {
          id: "clearFormatting",
          label: tr("editor.clearFormatting", "Clear Formatting"),
          icon: RemoveFormatting,
          action: (editor) =>
            editor.chain().focus().clearNodes().unsetAllMarks().run(),
        },
      ],
    },
  ]
}
