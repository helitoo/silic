import * as React from "react"
import {
  CircleQuestionMark,
  Compass,
  Download,
  FileCode2,
  HardDrive,
  Plus,
  ReceiptText,
  Route,
  ShieldLock,
  Trash2,
  Upload,
  UsersRound,
} from "lucide-react"

export interface NavItemActions {
  onOpenDrive?: () => void
  onNewProject?: () => void
  onUploadDevice?: () => void
  onDownload?: () => void
  onClear?: () => void
  onOpenEntityQuery?: () => void
  onOpenPathQuery?: () => void
}

export interface NavItem {
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
      label: t("navbar.file"),
      subItems: [
        {
          icon: Plus,
          label: t("navbar.new"),
          kdb: "⌘ N",
          onClick: actions?.onNewProject,
        },
        {
          icon: Upload,
          label: t("navbar.uploadDevice"),
          kdb: "⌘ U",
          onClick: actions?.onUploadDevice,
        },
        {
          icon: Download,
          label: t("navbar.download"),
          kdb: "⌘ D",
          onClick: actions?.onDownload,
        },
        {
          icon: Trash2,
          label: t("navbar.clear") || "Clear",
          onClick: actions?.onClear,
        },
      ],
    },
    {
      label: t("navbar.search") || "Search",
      subItems: [
        {
          icon: UsersRound,
          label: t("navbar.searchEntity") || "Entity",
          kdb: "⌘ Q",
          onClick: actions?.onOpenEntityQuery,
        },
        {
          icon: Route,
          label: t("navbar.searchPath") || "Path",
          kdb: "⌘ ⇧ Q",
          onClick: actions?.onOpenPathQuery,
        },
      ],
    },
    {
      label: t("navbar.guide") || "Guide",
      subItems: [
        {
          icon: Compass,
          label: t("navbar.guide") || "Guide",
          href: "/guide",
        },
        {
          icon: FileCode2,
          label: t("navbar.docsQuery") || "Query Architecture",
          href: "/docs-query",
        },
        {
          icon: HardDrive,
          label: t("navbar.docsStorage") || "Storage Architecture",
          href: "/docs-storage",
        },
        {
          icon: ShieldLock,
          label: t("navbar.privacyPolicy") || "Privacy Policy",
          href: "/policy-of-privacy",
        },
        {
          icon: ReceiptText,
          label: t("navbar.termsOfService") || "Terms of Service",
          href: "/terms-of-service",
        },
        {
          icon: CircleQuestionMark,
          label: t("navbar.help"),
          href: "https://www.facebook.com/bminh.tb",
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
