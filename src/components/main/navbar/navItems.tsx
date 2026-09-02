import * as React from "react"
import {
  BarChart3,
  CircleQuestionMark,
  Compass,
  CopyPlus,
  Download,
  FileCode2,
  FolderOpen,
  HardDrive,
  Plus,
  ReceiptText,
  Route,
  Save,
  Share2,
  ShieldLock,
  Trash2,
  Upload,
  UsersRound,
} from "lucide-react"

export interface NavItemActions {
  onOpenDrive?: () => void
  onSaveDrive?: () => void
  onSaveAsDrive?: () => void
  onShareDrive?: () => void
  onNewProject?: () => void
  onUploadDevice?: () => void
  onDownload?: () => void
  onClear?: () => void
  onOpenEntityQuery?: () => void
  onOpenPathQuery?: () => void
  onOpenAnalysis?: () => void
}

export interface NavItem {
  id?: string
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode
  label?: React.ReactNode | React.ComponentType
  kbd?: string
  kdb?: string
  href?: string
  target?: string
  onClick?: (e?: React.MouseEvent) => void
  subItems?: NavItem[]
}

export function getNavItems(
  t: (key: string) => string,
  actions?: NavItemActions
): NavItem[] {
  return [
    {
      id: "file",
      label: t("navbar.file"),
      subItems: [
        {
          id: "new",
          icon: Plus,
          label: t("navbar.new"),
          kbd: "⌘ N",
          kdb: "⌘ N",
          onClick: actions?.onNewProject,
        },
        {
          id: "openDrive",
          icon: FolderOpen,
          label: t("navbar.openDrive") || "Mở từ Drive",
          kbd: "⌘ ⇧ O",
          kdb: "⌘ ⇧ O",
          onClick: actions?.onOpenDrive,
        },
        {
          id: "saveDrive",
          icon: Save,
          label: t("navbar.saveDrive") || "Lưu vào Drive",
          kbd: "⌘ S",
          kdb: "⌘ S",
          onClick: actions?.onSaveDrive,
        },
        {
          id: "saveAsDrive",
          icon: CopyPlus,
          label: t("navbar.saveAsDrive") || "Lưu mới vào Drive",
          kbd: "⌘ ⇧ S",
          kdb: "⌘ ⇧ S",
          onClick: actions?.onSaveAsDrive,
        },
        {
          id: "shareDrive",
          icon: Share2,
          label: t("navbar.share") || "Chia sẻ",
          onClick: actions?.onShareDrive,
        },
        {
          id: "uploadDevice",
          icon: Upload,
          label: t("navbar.uploadDevice"),
          kbd: "⌘ U",
          kdb: "⌘ U",
          onClick: actions?.onUploadDevice,
        },
        {
          id: "download",
          icon: Download,
          label: t("navbar.download"),
          kbd: "⌘ D",
          kdb: "⌘ D",
          onClick: actions?.onDownload,
        },
        {
          id: "clear",
          icon: Trash2,
          label: t("navbar.clear") || "Clear",
          onClick: actions?.onClear,
        },
      ],
    },
    {
      id: "advanced",
      label: t("navbar.advanced") || "Nâng cao",
      subItems: [
        {
          id: "searchEntity",
          icon: UsersRound,
          label: t("navbar.searchEntity") || "Entity",
          kbd: "⌘ Q",
          kdb: "⌘ Q",
          onClick: actions?.onOpenEntityQuery,
        },
        {
          id: "searchPath",
          icon: Route,
          label: t("navbar.searchPath") || "Path",
          kbd: "⌘ ⇧ Q",
          kdb: "⌘ ⇧ Q",
          onClick: actions?.onOpenPathQuery,
        },
        {
          id: "analysis",
          icon: BarChart3,
          label: t("navbar.analysis") || "Phân tích",
          kbd: "⌘ ⇧ K",
          kdb: "⌘ ⇧ K",
          onClick: actions?.onOpenAnalysis,
        },
      ],
    },
    {
      id: "guide",
      label: t("navbar.guide") || "Guide",
      subItems: [
        {
          id: "guide",
          icon: Compass,
          label: t("navbar.guide") || "Guide",
          href: "/guide",
        },
        {
          id: "docsQuery",
          icon: FileCode2,
          label: t("navbar.docsQuery") || "Query Architecture",
          href: "/docs-query",
        },
        {
          id: "docsStorage",
          icon: HardDrive,
          label: t("navbar.docsStorage") || "Storage Architecture",
          href: "/docs-storage",
        },
        {
          id: "privacyPolicy",
          icon: ShieldLock,
          label: t("navbar.privacyPolicy") || "Privacy Policy",
          href: "/policy-of-privacy",
        },
        {
          id: "termsOfService",
          icon: ReceiptText,
          label: t("navbar.termsOfService") || "Terms of Service",
          href: "/terms-of-service",
        },
        {
          id: "help",
          icon: CircleQuestionMark,
          label: t("navbar.help"),
          href: "https://github.com/helitoo",
          target: "_blank",
        },
      ],
    },
  ]
}

export function renderIcon(icon?: NavItem["icon"]) {
  if (!icon) return null
  if (React.isValidElement(icon)) return icon
  if (typeof icon === "function" || typeof icon === "object") {
    const IconComponent = icon as React.ComponentType<{ className?: string }>
    return <IconComponent className="size-4 shrink-0" />
  }
  return null
}

export function renderLabel(label?: NavItem["label"]) {
  if (!label) return null
  if (typeof label === "function") {
    const LabelComponent = label as React.ComponentType
    return <LabelComponent />
  }
  return label
}
