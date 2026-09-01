import * as React from "react"
import {
  AlignLeft,
  Type as TypeIcon,
  Hash,
  Calendar,
  Clock,
  CalendarClock,
  ToggleLeft,
  Image as ImageIcon,
  File as FileIcon,
  Palette,
  Link as LinkIcon,
  Video as VideoIcon,
  Headphones as AudioIcon,
} from "lucide-react"

import type { Connection, Type } from "@/lib/types"
import { getConnectionName } from "./utils"

export interface TypeOption {
  value: Type
  label: string
  icon: React.ReactNode
}

export const typeOptions: TypeOption[] = [
  {
    value: "shortText",
    label: "Text",
    icon: <TypeIcon className="size-3.5 text-muted-foreground" />,
  },
  {
    value: "longText",
    label: "Essay",
    icon: <AlignLeft className="size-3.5 text-muted-foreground" />,
  },
  {
    value: "number",
    label: "Number",
    icon: <Hash className="size-3.5 text-muted-foreground" />,
  },
  {
    value: "date",
    label: "Date",
    icon: <Calendar className="size-3.5 text-muted-foreground" />,
  },
  {
    value: "time",
    label: "Time",
    icon: <Clock className="size-3.5 text-muted-foreground" />,
  },
  {
    value: "dateTime",
    label: "Date Time",
    icon: <CalendarClock className="size-3.5 text-muted-foreground" />,
  },
  {
    value: "boolean",
    label: "Boolean",
    icon: <ToggleLeft className="size-3.5 text-muted-foreground" />,
  },
  {
    value: "url",
    label: "URL",
    icon: <LinkIcon className="size-3.5 text-muted-foreground" />,
  },
  {
    value: "image",
    label: "Image",
    icon: <ImageIcon className="size-3.5 text-muted-foreground" />,
  },
  {
    value: "video",
    label: "Video",
    icon: <VideoIcon className="size-3.5 text-muted-foreground" />,
  },
  {
    value: "audio",
    label: "Audio",
    icon: <AudioIcon className="size-3.5 text-muted-foreground" />,
  },
  {
    value: "file",
    label: "File",
    icon: <FileIcon className="size-3.5 text-muted-foreground" />,
  },
  {
    value: "color",
    label: "Color",
    icon: <Palette className="size-3.5 text-muted-foreground" />,
  },
]

export function getTypeIcon(type: Type) {
  const option = typeOptions.find((opt) => opt.value === type)
  return option ? option.icon : <TypeIcon className="size-3.5 text-muted-foreground" />
}

export function getTypeLabel(type: Type, t?: (key: string) => string) {
  if (t) {
    return t(`types.${type}`)
  }
  const option = typeOptions.find((opt) => opt.value === type)
  return option ? option.label : type
}

export function getTypeOptions(t?: (key: string) => string): TypeOption[] {
  return typeOptions.map((opt) => ({
    ...opt,
    label: t ? t(`types.${opt.value}`) : opt.label,
  }))
}

export function getConnectionDisplayName(conn?: Connection | null): string {
  return getConnectionName(conn)
}

