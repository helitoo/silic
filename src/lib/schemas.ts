import * as z from "zod"
import type { Type, TemplateRecord, Template } from "./types"

export const typeEnum = [
  "longText",
  "shortText",
  "number",
  "date",
  "time",
  "dateTime",
  "boolean",
  "url",
  "image",
  "file",
  "color",
  "video",
  "audio",
] as const satisfies readonly Type[]

export const typeSchema = z.enum(typeEnum)

export const templateRecordSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  type: typeSchema,
  isArray: z.boolean(),
}) satisfies z.ZodType<TemplateRecord>

export const templateSchema = z.object({
  id: z.string().uuid("Invalid UUID"),
  name: z.string().trim().min(1, "Template name is required"),
  records: z.array(templateRecordSchema),
}) satisfies z.ZodType<Template>

export type TypeSchema = z.infer<typeof typeSchema>
export type TemplateRecordSchema = z.infer<typeof templateRecordSchema>
export type TemplateSchema = z.infer<typeof templateSchema>
