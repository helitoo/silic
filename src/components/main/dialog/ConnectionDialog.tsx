import * as React from "react"
import { CirclePlus, Sparkles, ArrowRight, MoveHorizontal } from "lucide-react"

import type {
  Connection,
  Record as ConnectionRecord,
  Type,
  Template,
} from "@/lib/types"
import { useConnection } from "@/contexts/ConnectionContext"
import { useTemplate } from "@/contexts/TemplateContext"
import { useProjectStorage } from "@/contexts/ProjectStorageContext"
import { useLang } from "@/contexts/LangContext"
import { toast } from "@/components/ui/toast"
import { duplicateRecordFiles, deleteRecordFiles } from "@/lib/utils"
import { castRecordValue } from "@/lib/template-utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field"
import { TemplateSelect } from "../queryBlocks/components/TemplateSelect"
import {
  EntityListField,
  RecordItemEditor,
  type RecordFormState,
} from "./fieldComponents"

export interface ConnectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValue?: Connection | null
  onSave?: (connection: Connection) => void
  onDelete?: (id: string) => void
}

function normalizeRecordValue(r: {
  type: Type
  isArray: boolean
  value?: any
}): string | string[] {
  const formatItem = (v: any) => {
    if (v === undefined || v === null) return ""
    if (v instanceof Date) {
      if (isNaN(v.getTime())) return ""
      if (r.type === "date") return v.toISOString().slice(0, 10)
      if (r.type === "dateTime") {
        const local = new Date(v.getTime() - v.getTimezoneOffset() * 60000)
        return local.toISOString().slice(0, 16)
      }
      if (r.type === "time") return v.toTimeString().slice(0, 5)
    }
    return String(v)
  }

  if (r.isArray) {
    if (Array.isArray(r.value)) {
      return r.value.map(formatItem)
    }
    if (
      r.value !== undefined &&
      r.value !== null &&
      String(r.value).trim() !== ""
    ) {
      return [formatItem(r.value)]
    }
    return [""]
  }
  return formatItem(r.value)
}

function parseSingleValue(type: Type, val: any) {
  if (val === undefined || val === null || val === "") return ""
  if (type === "number") {
    const num = Number(val)
    return isNaN(num) ? String(val) : num
  }
  if (type === "boolean") {
    if (typeof val === "string") {
      return val.toLowerCase() === "true"
    }
    return Boolean(val)
  }
  if (type === "date" || type === "dateTime") {
    const d = new Date(val)
    return isNaN(d.getTime()) ? String(val) : d
  }
  return String(val)
}

function parseArrayValue(type: Type, arr: string[]) {
  if (type === "number") {
    return arr.map((item) => {
      const num = Number(item)
      return isNaN(num) ? 0 : num
    })
  }
  if (type === "boolean") {
    return arr.map((item) =>
      typeof item === "string" ? item.toLowerCase() === "true" : Boolean(item)
    )
  }
  if (type === "date" || type === "dateTime") {
    return arr.map((item) => {
      const d = new Date(item)
      return isNaN(d.getTime()) ? new Date() : d
    })
  }
  return arr.map((item) => String(item))
}

function alignRecordsWithTemplate(
  records: Array<{
    id?: string
    name?: string
    type?: Type
    isArray?: boolean
    value?: any
  }>,
  template?: Template
): RecordFormState[] {
  if (!template) {
    return (records || []).map((r) => ({
      id: r.id || crypto.randomUUID(),
      name: r.name || "",
      type: r.type || "shortText",
      isArray: Boolean(r.isArray),
      value: normalizeRecordValue({
        type: r.type || "shortText",
        isArray: Boolean(r.isArray),
        value: r.value,
      }),
    }))
  }

  const templateRecordNames = new Set(template.records.map((tr) => tr.name))
  const existingRecordsMap = new Map<
    string,
    {
      id?: string
      name?: string
      type?: Type
      isArray?: boolean
      value?: any
    }
  >()

  for (const rec of records || []) {
    if (rec.name) {
      existingRecordsMap.set(rec.name, rec)
    }
  }

  // 1. Template records in exact template order
  const alignedTemplateRecords: RecordFormState[] = template.records.map(
    (tr) => {
      const existing = existingRecordsMap.get(tr.name)
      if (existing) {
        const isArray = Boolean(tr.isArray)
        const oldType = existing.type || tr.type
        const newType = tr.type
        const castedVal = castRecordValue(
          existing.value,
          oldType,
          newType,
          Boolean(existing.isArray),
          isArray
        )
        const val = normalizeRecordValue({
          type: newType,
          isArray,
          value: castedVal,
        })
        return {
          id: existing.id || crypto.randomUUID(),
          name: tr.name,
          type: newType,
          isArray,
          value: val,
        }
      }
      return {
        id: crypto.randomUUID(),
        name: tr.name,
        type: tr.type,
        isArray: Boolean(tr.isArray),
        value: tr.isArray ? [""] : "",
      }
    }
  )

  // 2. Extra records not belonging to template moved to the bottom
  const extraRecords: RecordFormState[] = (records || [])
    .filter((rec) => !templateRecordNames.has(rec.name || ""))
    .map((r) => ({
      id: r.id || crypto.randomUUID(),
      name: r.name || "",
      type: r.type || "shortText",
      isArray: Boolean(r.isArray),
      value: normalizeRecordValue({
        type: r.type || "shortText",
        isArray: Boolean(r.isArray),
        value: r.value,
      }),
    }))

  return [...alignedTemplateRecords, ...extraRecords]
}

const DRAFT_KEY = "silic_draft_connection"

interface ConnectionDraft {
  id?: string
  from?: string[]
  to?: string[]
  isDirectional?: boolean
  template?: string
  records?: RecordFormState[]
}

function saveConnectionDraft(draft: ConnectionDraft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch {
    // ignore
  }
}

function loadConnectionDraft(): ConnectionDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (raw) return JSON.parse(raw) as ConnectionDraft
  } catch {
    // ignore
  }
  return null
}

function clearConnectionDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {
    // ignore
  }
}

export function ConnectionDialog({
  open,
  onOpenChange,
  defaultValue,
  onSave,
  onDelete,
}: ConnectionDialogProps) {
  const { put, delete: deleteConnection } = useConnection()
  const { templates } = useTemplate()
  const { removeAttachment, duplicateFile } = useProjectStorage()
  const { t } = useLang()

  const [id, setId] = React.useState<string>("")
  const [fromList, setFromList] = React.useState<string[]>([""])
  const [toList, setToList] = React.useState<string[]>([""])
  const [isDirectional, setIsDirectional] = React.useState<boolean>(true)
  const [templateId, setTemplateId] = React.useState<string | undefined>(
    undefined
  )
  const [selectedTemplateToApply, setSelectedTemplateToApply] = React.useState<
    string[] | undefined
  >(undefined)
  const [records, setRecords] = React.useState<RecordFormState[]>([])

  const [showDeleteAlert, setShowDeleteAlert] = React.useState(false)

  // Reset/Initialize form whenever dialog opens or defaultValue changes
  React.useEffect(() => {
    if (open) {
      if (defaultValue) {
        setId(defaultValue.id)
        setFromList(
          defaultValue.from && defaultValue.from.length > 0
            ? defaultValue.from
            : [""]
        )
        setToList(
          defaultValue.to && defaultValue.to.length > 0 ? defaultValue.to : [""]
        )
        setIsDirectional(defaultValue.isDirectional ?? true)
        setTemplateId(defaultValue.template)
        setSelectedTemplateToApply(
          defaultValue.template ? [defaultValue.template] : undefined
        )
        const matchedTpl = defaultValue.template
          ? templates.find((t) => t.id === defaultValue.template)
          : undefined
        setRecords(
          alignRecordsWithTemplate(defaultValue.records || [], matchedTpl)
        )
      } else {
        const draft = loadConnectionDraft()
        if (draft) {
          const cleanId =
            draft.id && !draft.id.startsWith("conn-")
              ? draft.id
              : crypto.randomUUID()
          setId(cleanId)
          setFromList(draft.from && draft.from.length > 0 ? draft.from : [""])

          setToList(draft.to && draft.to.length > 0 ? draft.to : [""])
          setIsDirectional(draft.isDirectional ?? true)
          setTemplateId(draft.template)
          setSelectedTemplateToApply(
            draft.template ? [draft.template] : undefined
          )
          setRecords(draft.records || [])
        } else {
          setId(crypto.randomUUID())
          setFromList([""])
          setToList([""])
          setIsDirectional(true)
          setTemplateId(undefined)
          setSelectedTemplateToApply(undefined)
          setRecords([])
        }
      }
    }
  }, [open, defaultValue, templates])

  // Auto-save draft when creating new connection
  React.useEffect(() => {
    if (!open || defaultValue) return

    const timer = setTimeout(() => {
      saveConnectionDraft({
        id,
        from: fromList,
        to: toList,
        isDirectional,
        template: templateId,
        records,
      })
    }, 300)

    return () => clearTimeout(timer)
  }, [
    open,
    defaultValue,
    id,
    fromList,
    toList,
    isDirectional,
    templateId,
    records,
  ])

  const handleReset = () => {
    if (defaultValue) {
      setId(defaultValue.id)
      setFromList(defaultValue.from || [])
      setToList(defaultValue.to || [])
      setIsDirectional(defaultValue.isDirectional ?? true)
      setTemplateId(defaultValue.template)
      setSelectedTemplateToApply(
        defaultValue.template ? [defaultValue.template] : undefined
      )
      const matchedTpl = defaultValue.template
        ? templates.find((t) => t.id === defaultValue.template)
        : undefined
      setRecords(
        alignRecordsWithTemplate(defaultValue.records || [], matchedTpl)
      )
    } else {
      clearConnectionDraft()
      setId(crypto.randomUUID())
      setFromList([""])
      setToList([""])
      setIsDirectional(true)
      setTemplateId(undefined)
      setSelectedTemplateToApply(undefined)
      setRecords([])
    }
  }

  const handleDeleteClick = () => {
    setShowDeleteAlert(true)
  }

  const confirmDelete = async () => {
    if (!defaultValue?.id) return
    await deleteRecordFiles(defaultValue.records, removeAttachment)
    if (onDelete) {
      onDelete(defaultValue.id)
    } else {
      deleteConnection(defaultValue.id)
    }

    toast.add({
      type: "success",
      title: t("connectionDialog.deletedSuccess"),
    })

    setShowDeleteAlert(false)
    onOpenChange(false)
  }

  // Template Alignment Handler
  const handleApplyTemplate = () => {
    const targetId = Array.isArray(selectedTemplateToApply)
      ? selectedTemplateToApply[0]
      : selectedTemplateToApply || templateId

    if (!targetId || targetId === "__ALL__" || targetId === "__NONE__") {
      setTemplateId(undefined)
      setSelectedTemplateToApply(undefined)
      toast.add({
        type: "info",
        title: t("connectionDialog.noTemplateApplied"),
      })
      return
    }

    const tpl = templates.find((tItem) => tItem.id === targetId)
    if (!tpl) {
      setTemplateId(undefined)
      setSelectedTemplateToApply(undefined)
      return
    }

    setTemplateId(tpl.id)
    setSelectedTemplateToApply([tpl.id])
    setRecords(alignRecordsWithTemplate(records, tpl))
    toast.add({
      type: "info",
      title: `${t("connectionDialog.applyTemplate")}: ${tpl.name}`,
    })
  }

  // From List handlers
  const handleAddFrom = React.useCallback(
    () => setFromList((prev) => [...prev, ""]),
    []
  )
  const handleUpdateFrom = React.useCallback(
    (index: number, newId: string) => {
      setFromList((prev) => {
        const next = [...prev]
        next[index] = newId
        return next
      })
    },
    []
  )
  const handleRemoveFrom = React.useCallback(
    (index: number) => {
      setFromList((prev) => prev.filter((_, i) => i !== index))
    },
    []
  )

  // To List handlers
  const handleAddTo = React.useCallback(
    () => setToList((prev) => [...prev, ""]),
    []
  )
  const handleUpdateTo = React.useCallback(
    (index: number, newId: string) => {
      setToList((prev) => {
        const next = [...prev]
        next[index] = newId
        return next
      })
    },
    []
  )
  const handleRemoveTo = React.useCallback(
    (index: number) => {
      setToList((prev) => prev.filter((_, i) => i !== index))
    },
    []
  )

  // Record CRUD Handlers
  const handleAddRecord = React.useCallback(() => {
    setRecords((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: "",
        type: "shortText",
        isArray: false,
        value: "",
      },
    ])
  }, [])

  const handleUpdateRecord = React.useCallback(
    (index: number, partial: Partial<RecordFormState>) => {
      setRecords((prev) => {
        const next = [...prev]
        const cur = next[index]
        if (!cur) return prev
        let val = partial.value !== undefined ? partial.value : cur.value

        if (partial.isArray !== undefined && partial.isArray !== cur.isArray) {
          if (partial.isArray) {
            val = val !== "" && val !== undefined ? [String(val)] : [""]
          } else {
            val = Array.isArray(val) ? String(val[0] || "") : String(val)
          }
        }

        next[index] = {
          ...cur,
          ...partial,
          value: val,
        }
        return next
      })
    },
    []
  )

  const handleRemoveRecord = React.useCallback(
    (index: number) => {
      setRecords((prev) => {
        const target = prev[index]
        if (
          target &&
          ["image", "video", "audio", "file"].includes(target.type)
        ) {
          if (Array.isArray(target.value)) {
            target.value.forEach((v) => {
              if (v && typeof v === "string") {
                removeAttachment(v).catch(() => {})
              }
            })
          } else if (target.value && typeof target.value === "string") {
            removeAttachment(target.value).catch(() => {})
          }
        }
        return prev.filter((_, i) => i !== index)
      })
    },
    [removeAttachment]
  )

  const handleAddArrayItem = React.useCallback((recordIndex: number) => {
    setRecords((prev) => {
      const next = [...prev]
      const cur = next[recordIndex]
      if (!cur) return prev
      const currentArr = Array.isArray(cur.value) ? [...cur.value] : []
      next[recordIndex] = {
        ...cur,
        value: [...currentArr, ""],
      }
      return next
    })
  }, [])

  const handleUpdateArrayItem = React.useCallback(
    (recordIndex: number, itemIndex: number, newVal: string) => {
      setRecords((prev) => {
        const next = [...prev]
        const cur = next[recordIndex]
        if (!cur) return prev
        const currentArr = Array.isArray(cur.value) ? [...cur.value] : [""]
        currentArr[itemIndex] = newVal
        next[recordIndex] = {
          ...cur,
          value: currentArr,
        }
        return next
      })
    },
    []
  )

  const handleRemoveArrayItem = React.useCallback(
    (recordIndex: number, itemIndex: number) => {
      setRecords((prev) => {
        const next = [...prev]
        const cur = next[recordIndex]
        if (!cur) return prev
        const currentArr = Array.isArray(cur.value) ? [...cur.value] : []
        const removingVal = currentArr[itemIndex]
        if (
          removingVal &&
          typeof removingVal === "string" &&
          ["image", "video", "audio", "file"].includes(cur.type)
        ) {
          removeAttachment(removingVal).catch(() => {})
        }
        const filtered = currentArr.filter((_, i) => i !== itemIndex)
        next[recordIndex] = {
          ...cur,
          value: filtered.length > 0 ? filtered : [""],
        }
        return next
      })
    },
    [removeAttachment]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const validFrom = fromList.map((f) => f.trim()).filter(Boolean)
    const validTo = toList.map((tItem) => tItem.trim()).filter(Boolean)

    const validRecords: ConnectionRecord[] = []

    for (const r of records) {
      if (!r.name || r.name.trim() === "") continue

      let finalValue: any = r.value
      let hasVal = false

      if (r.isArray) {
        const arr = Array.isArray(r.value) ? r.value : [r.value]
        const validItems = arr.filter(
          (item) =>
            item !== undefined && item !== null && String(item).trim() !== ""
        )
        if (validItems.length > 0) {
          finalValue = parseArrayValue(r.type, validItems)
          hasVal = true
        }
      } else {
        if (
          r.value !== undefined &&
          r.value !== null &&
          String(r.value).trim() !== ""
        ) {
          finalValue = parseSingleValue(r.type, r.value)
          hasVal = true
        }
      }

      if (hasVal) {
        validRecords.push({
          id: r.id || crypto.randomUUID(),
          name: r.name.trim(),
          type: r.type,
          isArray: Boolean(r.isArray),
          value: finalValue as ConnectionRecord["value"],
        })
      }
    }

    const currentTplId =
      templateId ||
      (selectedTemplateToApply && selectedTemplateToApply.length > 0
        ? selectedTemplateToApply[0]
        : undefined)

    const payload: Connection = {
      id: id.trim() || crypto.randomUUID(),
      from: validFrom,
      to: validTo,
      isDirectional,
      template:
        currentTplId &&
        currentTplId !== "__NONE__" &&
        currentTplId !== "__ALL__"
          ? currentTplId
          : undefined,
      records: validRecords,
    }

    if (onSave) {
      onSave(payload)
    } else {
      put(payload)
    }

    if (!defaultValue) {
      clearConnectionDraft()
    }

    toast.add({
      type: "success",
      title: defaultValue
        ? t("connectionDialog.updatedSuccess")
        : t("connectionDialog.createdSuccess"),
    })

    onOpenChange(false)
  }

  const handleDuplicate = async () => {
    const validFrom = fromList.map((f) => f.trim()).filter(Boolean)
    const validTo = toList.map((tItem) => tItem.trim()).filter(Boolean)

    const validRecords: ConnectionRecord[] = []

    for (const r of records) {
      if (!r.name || r.name.trim() === "") continue

      let finalValue: any = r.value
      let hasVal = false

      if (r.isArray) {
        const arr = Array.isArray(r.value) ? r.value : [r.value]
        const validItems = arr.filter(
          (item) =>
            item !== undefined && item !== null && String(item).trim() !== ""
        )
        if (validItems.length > 0) {
          finalValue = parseArrayValue(r.type, validItems)
          hasVal = true
        }
      } else {
        if (
          r.value !== undefined &&
          r.value !== null &&
          String(r.value).trim() !== ""
        ) {
          finalValue = parseSingleValue(r.type, r.value)
          hasVal = true
        }
      }

      if (hasVal) {
        validRecords.push({
          id: crypto.randomUUID(),
          name: r.name.trim(),
          type: r.type,
          isArray: Boolean(r.isArray),
          value: finalValue as ConnectionRecord["value"],
        })
      }
    }

    // Duplicate files of connection records
    const recordsWithDuplicatedFiles = await duplicateRecordFiles(
      validRecords,
      duplicateFile
    )

    const currentTplId =
      templateId ||
      (selectedTemplateToApply && selectedTemplateToApply.length > 0
        ? selectedTemplateToApply[0]
        : undefined)

    const payload: Connection = {
      id: crypto.randomUUID(),
      from: validFrom,
      to: validTo,
      isDirectional,
      template:
        currentTplId &&
        currentTplId !== "__NONE__" &&
        currentTplId !== "__ALL__"
          ? currentTplId
          : undefined,
      records: recordsWithDuplicatedFiles,
    }

    if (onSave) {
      onSave(payload)
    } else {
      put(payload)
    }

    toast.add({
      type: "success",
      title: t("connectionDialog.duplicatedSuccess"),
    })

    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-full max-h-full w-full max-w-none flex-col gap-0 overflow-hidden rounded-none p-0 sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-xl">
          <DialogHeader>
            <DialogTitle>
              {defaultValue
                ? t("connectionDialog.editTitle")
                : t("connectionDialog.createTitle")}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {/* Template Alignment */}
              <div className="flex items-center justify-end gap-1.5">
                <TemplateSelect
                  value={
                    selectedTemplateToApply ||
                    (templateId ? [templateId] : "__NONE__")
                  }
                  onChange={(val) => {
                    setSelectedTemplateToApply(val)
                    setTemplateId(
                      val && val.length > 0 && val[0] !== "__NONE__"
                        ? val[0]
                        : undefined
                    )
                  }}
                  noTemplateOption
                  placeholder={t("connectionDialog.template")}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 px-2.5 text-xs font-semibold"
                  onClick={handleApplyTemplate}
                  title="Align records with template"
                >
                  <Sparkles className="size-3.5 text-amber-500" />
                  <span>{t("connectionDialog.applyTemplate")}</span>
                </Button>
              </div>

              {/* ID Field */}
              {/* <IdField
                id={id}
                label={t("connectionDialog.id")}
              /> */}

              {/* Source Entities (From) */}
              <EntityListField
                title={t("connectionDialog.from")}
                actionLabel={t("connectionDialog.addFrom")}
                placeholder={t("query.fromEntity")}
                list={fromList}
                onAdd={handleAddFrom}
                onUpdate={handleUpdateFrom}
                onRemove={handleRemoveFrom}
              />

              {/* Target Entities (To) */}
              <EntityListField
                title={t("connectionDialog.to")}
                actionLabel={t("connectionDialog.addTo")}
                placeholder={t("query.toEntity")}
                list={toList}
                onAdd={handleAddTo}
                onUpdate={handleUpdateTo}
                onRemove={handleRemoveTo}
              />

              {/* Directional Toggle */}
              <div className="flex items-center justify-between rounded-lg border border-border/50 bg-card/60 px-3 py-2 shadow-2xs">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="is-directional"
                    checked={isDirectional}
                    onCheckedChange={(checked) =>
                      setIsDirectional(Boolean(checked))
                    }
                  />
                  <FieldLabel
                    htmlFor="is-directional"
                    className="cursor-pointer text-xs font-medium text-foreground select-none"
                  >
                    {t("connectionDialog.directional")}
                  </FieldLabel>
                </div>
                <span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {isDirectional ? (
                    <>
                      <ArrowRight className="size-3 text-primary" />
                      <span className="text-primary font-semibold">
                        {t("connectionsPage.isDirectional")}
                      </span>
                    </>
                  ) : (
                    <>
                      <MoveHorizontal className="size-3 text-muted-foreground" />
                      <span>{t("connectionsPage.isNonDirectional")}</span>
                    </>
                  )}
                </span>
              </div>

              {/* Records Section */}
              <FieldSet className="gap-2.5 pt-1">
                <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
                  <FieldLegend
                    variant="label"
                    className="mb-0 text-xs font-semibold"
                  >
                    {t("connectionDialog.records")}
                  </FieldLegend>
                  <span className="text-xs text-muted-foreground">
                    {t(
                      records.length === 1
                        ? "entitiesPage.recordsCount_one"
                        : "entitiesPage.recordsCount_other",
                      { count: records.length }
                    )}
                  </span>
                </div>

                <FieldGroup className="gap-2.5">
                  {records.map((rec, index) => (
                    <RecordItemEditor
                      key={rec.id || index}
                      record={rec}
                      index={index}
                      onUpdate={handleUpdateRecord}
                      onRemove={handleRemoveRecord}
                      onAddArrayItem={handleAddArrayItem}
                      onUpdateArrayItem={handleUpdateArrayItem}
                      onRemoveArrayItem={handleRemoveArrayItem}
                    />
                  ))}

                  {/* Add Record Button */}
                  <div className="flex justify-center pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 rounded-full text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-600 dark:text-emerald-400"
                      onClick={handleAddRecord}
                    >
                      <CirclePlus className="size-4" />
                      <span className="text-xs font-semibold">
                        {t("connectionDialog.addRecord")}
                      </span>
                    </Button>
                  </div>
                </FieldGroup>
              </FieldSet>
            </div>

            {/* Dialog Footer */}
            <DialogFooter className="flex flex-row items-center justify-end gap-2 p-4 pt-3">
              <Button type="button" variant="outline" onClick={handleReset}>
                {t("connectionDialog.reset")}
              </Button>
              {defaultValue && (
                <Button
                  type="button"
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive dark:border-destructive dark:hover:bg-destructive/20"
                  onClick={handleDeleteClick}
                >
                  {t("connectionDialog.delete")}
                </Button>
              )}
              {defaultValue && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDuplicate}
                >
                  <span>{t("connectionDialog.duplicate")}</span>
                </Button>
              )}
              <Button type="submit">
                {defaultValue
                  ? t("connectionDialog.save")
                  : t("connectionDialog.create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Item Alert Dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("connectionDialog.confirmDeleteTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("connectionDialog.confirmDeleteDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteAlert(false)}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              {t("connectionDialog.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default ConnectionDialog
