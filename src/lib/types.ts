// Storage system

export type Type =
  | "longText"
  | "shortText"
  | "number"
  | "date"
  | "time"
  | "dateTime"
  | "boolean"
  | "image"
  | "file"
  | "color"
  | "url"
  | "video"
  | "audio"

export type AttachmentMeta = {
  id: string
  mimeType: string
  size: number
  caption?: string
}

export type SilicManifest = {
  version: number
  fileName?: string
  exportedAt: string
  attachments: AttachmentMeta[]
}

export type Record = {
  id: string
  type: Type
  isArray: boolean
  name: string
  value?:
    | number
    | number[]
    | string
    | string[]
    | boolean
    | boolean[]
    | Date
    | Date[]
}

export type TemplateRecord = {
  type: Type
  isArray: boolean
  name: string
}

export type Entity = {
  id: string
  records: Record[]
  template?: string // Template ID
}

export type Template = {
  id: string
  name: string
  records: TemplateRecord[]
}

export type Connection = {
  id: string
  from: string[] // Entity ID
  to: string[] // Entity ID
  isDirectional: boolean
  template?: string // Template ID
  records: Record[]
}
