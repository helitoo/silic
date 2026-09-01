import * as React from "react"
import {
  useForm,
  useFieldArray,
  Controller,
  type Control,
} from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CirclePlus, GripVertical, Trash2 } from "lucide-react"

import { DragDropProvider } from "@dnd-kit/react"
import { useSortable } from "@dnd-kit/react/sortable"
import { move as dndMove } from "@dnd-kit/helpers"

import type { Template, Type } from "@/lib/types"
import { templateSchema } from "@/lib/schemas"
import {
  getTypeIcon,
  getTypeLabel,
  getTypeOptions,
  syncEntityWithTemplate,
} from "@/lib/template-utils"
import { useTemplate } from "@/contexts/TemplateContext"
import { useEntity } from "@/contexts/EntityContext"
import { useConnection } from "@/contexts/ConnectionContext"
import { useProjectStorage } from "@/contexts/ProjectStorageContext"
import { useLang } from "@/contexts/LangContext"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface TemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValue?: Template | null
  onSave?: (template: Template) => void
  onDelete?: (id: string) => void
}

const DRAFT_KEY = "silic_draft_template"

function saveTemplateDraft(draft: Template) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch {
    // ignore
  }
}

function loadTemplateDraft(): Template | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (raw) return JSON.parse(raw) as Template
  } catch {
    // ignore
  }
  return null
}

function clearTemplateDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {
    // ignore
  }
}

function getDefaultFormValues(defaultValue?: Template | null): Template {
  if (defaultValue) {
    return {
      id: defaultValue.id,
      name: defaultValue.name || "",
      records: (defaultValue.records || []).map((r) => ({
        id: r.id || crypto.randomUUID(),
        name: r.name || "",
        type: r.type || "shortText",
        isArray: Boolean(r.isArray),
        originalName: r.name || "",
      })),
    }
  }
  const draft = loadTemplateDraft()
  if (draft) {
    return {
      id: draft.id || crypto.randomUUID(),
      name: draft.name || "",
      records:
        draft.records && draft.records.length > 0
          ? draft.records.map((r) => ({
              id: r.id || crypto.randomUUID(),
              name: r.name || "",
              type: r.type || "shortText",
              isArray: Boolean(r.isArray),
              originalName: r.originalName || r.name || "",
            }))
          : [
              {
                id: crypto.randomUUID(),
                name: "",
                type: "shortText",
                isArray: false,
                originalName: "",
              },
            ],
    }
  }
  return {
    id: crypto.randomUUID(),
    name: "",
    records: [
      {
        id: crypto.randomUUID(),
        name: "",
        type: "shortText",
        isArray: false,
        originalName: "",
      },
    ],
  }
}

interface RecordRowProps {
  id: string
  index: number
  control: Control<Template>
  onRemove: () => void
}

function RecordRow({ id, index, control, onRemove }: RecordRowProps) {
  const { t } = useLang()
  const { ref, handleRef, isDragging, isDropTarget } = useSortable({
    id,
    index,
  })

  const currentTypeOptions = React.useMemo(() => getTypeOptions(t), [t])

  return (
    <div
      ref={ref}
      className={cn(
        "group relative flex items-center gap-2 rounded-lg border border-border/70 bg-card/60 p-2.5 shadow-2xs transition-colors hover:border-border",
        isDragging && "border-dashed border-primary/60 bg-muted/40 opacity-40",
        isDropTarget && !isDragging && "border-primary ring-2 ring-primary/20"
      )}
    >
      {/* Drag Handle Ghost Button on the side */}
      <div className="flex shrink-0 items-center justify-center">
        <Button
          ref={handleRef}
          type="button"
          variant="ghost"
          size="icon-xs"
          className="size-7 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
          title={t("templateDialog.dragToReorder")}
          aria-label={t("templateDialog.dragToReorder")}
        >
          <GripVertical className="size-3.5" />
        </Button>
      </div>

      {/* Main Container: input text and select in one column on mobile, row on desktop */}
      <div className="flex min-w-0 flex-1 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        {/* Record Name */}
        <div className="w-full min-w-0 sm:flex-1">
          <Controller
            name={`records.${index}.name`}
            control={control}
            render={({ field: nameField, fieldState }) => (
              <div className="w-full">
                <Input
                  {...nameField}
                  id={`records.${index}.name`}
                  placeholder={t("templateDialog.fieldNamePlaceholder")}
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                  className="h-8 w-full text-xs font-medium"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </div>
            )}
          />
        </div>

        {/* Controls: Type Select + isArray + Delete */}
        <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
          {/* Record Type Select */}
          <div className="flex-1 sm:w-[130px] sm:flex-initial">
            <Controller
              name={`records.${index}.type`}
              control={control}
              render={({ field: typeField, fieldState }) => (
                <div className="w-full">
                  <Select
                    value={typeField.value}
                    onValueChange={(val) => typeField.onChange(val as Type)}
                  >
                    <SelectTrigger
                      id={`records.${index}.type`}
                      aria-invalid={fieldState.invalid}
                      className="h-8 w-full justify-between text-xs"
                    >
                      <SelectValue placeholder={t("templateDialog.selectType")}>
                        <span className="flex items-center gap-1.5 truncate">
                          {getTypeIcon(typeField.value)}
                          <span>{getTypeLabel(typeField.value, t)}</span>
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent align="start">
                      <SelectGroup>
                        {currentTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <span className="flex items-center gap-2">
                              {option.icon}
                              <span>{option.label}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </div>
              )}
            />
          </div>

          {/* isArray Checkbox */}
          <div className="flex h-8 shrink-0 items-center gap-1.5 px-1">
            <Controller
              name={`records.${index}.isArray`}
              control={control}
              render={({ field: arrayField }) => (
                <>
                  <Checkbox
                    id={`records.${index}.isArray`}
                    checked={arrayField.value}
                    onCheckedChange={arrayField.onChange}
                  />
                  <FieldLabel
                    htmlFor={`records.${index}.isArray`}
                    className="cursor-pointer text-[11px] font-normal text-muted-foreground select-none hover:text-foreground"
                  >
                    {t("templateDialog.array")}
                  </FieldLabel>
                </>
              )}
            />
          </div>

          {/* Delete Record Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="size-7 shrink-0 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={onRemove}
            title={t("templateDialog.deleteRecord")}
            aria-label={t("templateDialog.deleteRecord")}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export function TemplateDialog({
  open,
  onOpenChange,
  defaultValue,
  onSave,
  onDelete,
}: TemplateDialogProps) {
  const { put, delete: deleteTemplate } = useTemplate()
  const { entities, put: putEntity } = useEntity()
  const { connections, put: putConnection } = useConnection()
  const { removeAttachment } = useProjectStorage()
  const { t } = useLang()

  const form = useForm<Template>({
    resolver: zodResolver(templateSchema),
    defaultValues: getDefaultFormValues(defaultValue),
  })

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "records",
  })

  const [showDeleteAlert, setShowDeleteAlert] = React.useState(false)

  interface ChangedTypeInfo {
    name: string
    oldType: Type
    newType: Type
    wasArray: boolean
    isArray: boolean
  }

  const [impactConfirmState, setImpactConfirmState] = React.useState<{
    open: boolean
    payload: Template | null
    matchedEntitiesCount: number
    matchedConnectionsCount: number
    deletedRecords: Array<{ name: string; type: Type; isArray: boolean }>
    changedTypes: ChangedTypeInfo[]
    isOrderChanged: boolean
    deleteFromEntities: boolean
    renameMap: Map<string, string>
  }>({
    open: false,
    payload: null,
    matchedEntitiesCount: 0,
    matchedConnectionsCount: 0,
    deletedRecords: [],
    changedTypes: [],
    isOrderChanged: false,
    deleteFromEntities: false,
    renameMap: new Map(),
  })

  // Reset form whenever dialog opens or defaultValue changes
  React.useEffect(() => {
    if (open) {
      form.reset(getDefaultFormValues(defaultValue))
    }
  }, [open, defaultValue, form])

  const handleDeleteRecordClick = (index: number) => {
    remove(index)
  }

  // Auto-save draft when creating new template
  React.useEffect(() => {
    if (!open || defaultValue) return

    const subscription = form.watch((value) => {
      saveTemplateDraft(value as Template)
    })

    return () => subscription.unsubscribe()
  }, [open, defaultValue, form])

  const handleReset = () => {
    if (!defaultValue) {
      clearTemplateDraft()
      form.reset({
        id: crypto.randomUUID(),
        name: "",
        records: [
          {
            id: crypto.randomUUID(),
            name: "",
            type: "shortText",
            isArray: false,
            originalName: "",
          },
        ],
      })
    } else {
      form.reset(getDefaultFormValues(defaultValue))
    }
  }

  const handleDeleteClick = () => {
    setShowDeleteAlert(true)
  }

  const confirmDelete = () => {
    if (!defaultValue?.id) return
    const templateId = defaultValue.id

    // Detach template from linked entities while keeping records intact
    const matchedEnts = entities.filter((e) => e.template === templateId)
    for (const ent of matchedEnts) {
      putEntity({
        ...ent,
        template: undefined,
      })
    }

    // Detach template from linked connections while keeping records intact
    const matchedConns = connections.filter((c) => c.template === templateId)
    for (const conn of matchedConns) {
      putConnection({
        ...conn,
        template: undefined,
      })
    }

    if (onDelete) {
      onDelete(templateId)
    } else {
      deleteTemplate(templateId)
    }

    toast.add({
      type: "success",
      title: t("templateDialog.deletedSuccess"),
    })

    setShowDeleteAlert(false)
    onOpenChange(false)
  }

  const executeSaveTemplate = (
    payload: Template,
    deleteMissingRecords: boolean,
    renameMap: Map<string, string> = new Map()
  ) => {
    if (onSave) {
      onSave(payload)
    } else {
      put(payload)
    }

    // Synchronize linked entities and connections
    if (defaultValue?.id) {
      const matchedEnts = entities.filter((e) => e.template === payload.id)
      const matchedConns = connections.filter((c) => c.template === payload.id)

      for (const ent of matchedEnts) {
        const result = syncEntityWithTemplate(
          ent.records,
          payload,
          defaultValue,
          deleteMissingRecords,
          renameMap
        )
        for (const fileId of result.deletedFileIds) {
          removeAttachment(fileId).catch(() => {})
        }
        putEntity({
          ...ent,
          records: result.records,
        })
      }

      for (const conn of matchedConns) {
        const result = syncEntityWithTemplate(
          conn.records,
          payload,
          defaultValue,
          deleteMissingRecords,
          renameMap
        )
        for (const fileId of result.deletedFileIds) {
          removeAttachment(fileId).catch(() => {})
        }
        putConnection({
          ...conn,
          records: result.records,
        })
      }
    }

    if (!defaultValue) {
      clearTemplateDraft()
    }

    toast.add({
      type: "success",
      title: defaultValue
        ? t("templateDialog.updatedSuccess")
        : t("templateDialog.createdSuccess"),
    })

    setImpactConfirmState((prev) => ({ ...prev, open: false }))
    onOpenChange(false)
  }

  const handleFormSubmit = (data: Template) => {
    const validRecords = (data.records || [])
      .map((r) => ({
        id: r.id || crypto.randomUUID(),
        name: r.name ? r.name.trim() : "",
        type: r.type,
        isArray: Boolean(r.isArray),
        originalName: r.originalName ? r.originalName.trim() : undefined,
      }))
      .filter((r) => r.name.length > 0)

    const payload: Template = {
      id: data.id,
      name: data.name.trim(),
      records: validRecords,
    }

    if (defaultValue?.id) {
      const matchedEnts = entities.filter((e) => e.template === payload.id)
      const matchedConns = connections.filter((c) => c.template === payload.id)
      const totalMatched = matchedEnts.length + matchedConns.length

      if (totalMatched > 0) {
        const oldRecords = defaultValue.records || []
        const newRecords = payload.records

        // 1. Build rename map (originalName -> newName)
        const renameMap = new Map<string, string>()
        for (const r of newRecords) {
          if (r.originalName && r.originalName !== r.name) {
            renameMap.set(r.originalName, r.name)
          }
        }
        const renamedOldNames = new Set(renameMap.keys())

        // 2. Check genuinely deleted records (excluding renamed ones)
        const deleted = oldRecords.filter((oldR) => {
          if (renamedOldNames.has(oldR.name)) return false
          const stillPresent = newRecords.some(
            (newR) =>
              newR.name === oldR.name || newR.originalName === oldR.name
          )
          return !stillPresent
        })

        // 3. Check type & isArray changes
        const changedTypes: ChangedTypeInfo[] = []
        for (const newR of newRecords) {
          const matchedOld = oldRecords.find(
            (o) => o.name === (newR.originalName || newR.name)
          )
          if (matchedOld) {
            if (
              matchedOld.type !== newR.type ||
              Boolean(matchedOld.isArray) !== Boolean(newR.isArray)
            ) {
              changedTypes.push({
                name: newR.name,
                oldType: matchedOld.type,
                newType: newR.type,
                wasArray: Boolean(matchedOld.isArray),
                isArray: Boolean(newR.isArray),
              })
            }
          }
        }

        // 4. Check order changes
        let isOrderChanged = false
        const mappedOldNames = oldRecords
          .map((r) => renameMap.get(r.name) || r.name)
          .filter((n) => newRecords.some((nr) => nr.name === n))
        const currentNewNames = newRecords
          .map((r) => r.name)
          .filter((n) =>
            oldRecords.some((or) => (renameMap.get(or.name) || or.name) === n)
          )

        if (mappedOldNames.join(",") !== currentNewNames.join(",")) {
          isOrderChanged = true
        }

        // If there are deleted records or changed types or order changes, open unified impact dialog
        // Renaming alone does NOT trigger alert!
        if (deleted.length > 0 || changedTypes.length > 0 || isOrderChanged) {
          setImpactConfirmState({
            open: true,
            payload,
            matchedEntitiesCount: matchedEnts.length,
            matchedConnectionsCount: matchedConns.length,
            deletedRecords: deleted,
            changedTypes,
            isOrderChanged,
            deleteFromEntities: false,
            renameMap,
          })
          return
        }

        // Only renamed or no destructive changes -> save immediately with renameMap!
        executeSaveTemplate(payload, false, renameMap)
        return
      }
    }

    executeSaveTemplate(payload, false)
  }

  const handleDuplicate = () => {
    const data = form.getValues()
    const validRecords = (data.records || [])
      .map((r) => ({
        name: r.name ? r.name.trim() : "",
        type: r.type,
        isArray: Boolean(r.isArray),
      }))
      .filter((r) => r.name.length > 0)

    const payload: Template = {
      id: crypto.randomUUID(),
      name: data.name ? `${data.name.trim()} (Copy)` : "Untitled (Copy)",
      records: validRecords,
    }

    if (onSave) {
      onSave(payload)
    } else {
      put(payload)
    }

    toast.add({
      type: "success",
      title: t("templateDialog.duplicatedSuccess"),
    })

    onOpenChange(false)
  }

  const handleAddRecord = () => {
    append({
      id: crypto.randomUUID(),
      name: "",
      type: "shortText",
      isArray: false,
      originalName: "",
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-full max-h-full w-full max-w-none flex-col gap-0 overflow-hidden rounded-none p-0 sm:h-auto sm:max-h-[88vh] sm:max-w-lg sm:rounded-xl">
          <DialogHeader>
            <DialogTitle>
              {defaultValue
                ? t("templateDialog.editTitle")
                : t("templateDialog.createTitle")}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {/* ID Field (ALWAYS disabled in both modes) */}
              {/* <Controller
                name="id"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="template-id">
                      {t("templateDialog.id")}{" "}
                      <span className="ml-0.5 font-bold text-destructive">
                        *
                      </span>
                    </FieldLabel>
                    <div className="flex items-center gap-1.5">
                      <Input
                        {...field}
                        id="template-id"
                        disabled
                        readOnly
                        className="flex-1 cursor-not-allowed bg-muted/40 select-all"
                      />
                      <CopyButton content={field.value} />
                    </div>
                  </Field>
                )}
              /> */}

              {/* Template Name Field */}
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="template-name">
                      {t("templateDialog.templateName")}{" "}
                      <span className="ml-0.5 font-bold text-destructive">
                        *
                      </span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id="template-name"
                      placeholder={t("templateDialog.templateNamePlaceholder")}
                      aria-invalid={fieldState.invalid}
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Records Section */}
              <FieldSet className="gap-3 pt-2">
                <div className="flex items-center justify-between">
                  <FieldLegend variant="label" className="mb-0 font-medium">
                    {t("templateDialog.records")}
                  </FieldLegend>
                  <span className="text-xs text-muted-foreground">
                    {t(
                      fields.length === 1
                        ? "templateDialog.recordsCount_one"
                        : "templateDialog.recordsCount_other",
                      { count: fields.length }
                    )}
                  </span>
                </div>

                <DragDropProvider
                  onDragEnd={(event) => {
                    if (event.canceled) return

                    const itemsWithIds = fields.map((f) => ({ id: f.id }))
                    const reordered = dndMove(itemsWithIds, event)
                    if (reordered !== itemsWithIds) {
                      const sourceId = event.operation.source?.id
                      if (sourceId) {
                        const fromIndex = itemsWithIds.findIndex(
                          (item) => item.id === sourceId
                        )
                        const toIndex = reordered.findIndex(
                          (item) => item.id === sourceId
                        )
                        if (
                          fromIndex !== -1 &&
                          toIndex !== -1 &&
                          fromIndex !== toIndex
                        ) {
                          move(fromIndex, toIndex)
                        }
                      }
                    }
                  }}
                >
                  <FieldGroup className="gap-2.5">
                    {fields.map((fieldItem, index) => (
                      <RecordRow
                        key={fieldItem.id}
                        id={fieldItem.id}
                        index={index}
                        control={form.control}
                        onRemove={() => handleDeleteRecordClick(index)}
                      />
                    ))}

                    {/* Add Record Ghost Button with Green Text */}
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
                          {t("entityDialog.addRecord")}
                        </span>
                      </Button>
                    </div>
                  </FieldGroup>
                </DragDropProvider>
              </FieldSet>
            </div>

            {/* Dialog Footer */}
            <DialogFooter className="flex flex-row items-center justify-end gap-2 p-4 pt-3">
              <Button type="button" variant="outline" onClick={handleReset}>
                {t("templateDialog.reset")}
              </Button>
              {defaultValue && (
                <Button
                  type="button"
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive dark:border-destructive dark:hover:bg-destructive/20"
                  onClick={handleDeleteClick}
                >
                  {t("templateDialog.delete")}
                </Button>
              )}
              {defaultValue && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDuplicate}
                >
                  {t("templateDialog.duplicate")}
                </Button>
              )}
              <Button type="submit">
                {defaultValue
                  ? t("templateDialog.save")
                  : t("templateDialog.create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Entire Template Alert Dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("templateDialog.confirmDeleteTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {defaultValue &&
              entities.filter((e) => e.template === defaultValue.id).length > 0
                ? t("templateDialog.confirmDeleteLinkedDesc", {
                    count: entities.filter((e) => e.template === defaultValue.id)
                      .length,
                  })
                : t("templateDialog.confirmDeleteDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteAlert(false)}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              {t("templateDialog.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unified Template Update Impact Confirmation Dialog */}
      <AlertDialog
        open={impactConfirmState.open}
        onOpenChange={(isOpen) =>
          setImpactConfirmState((prev) => ({ ...prev, open: isOpen }))
        }
      >
        <AlertDialogContent className="max-w-md sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold">
              {t("templateDialog.confirmUpdateImpactTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-1 text-xs text-muted-foreground">
              {t("templateDialog.confirmUpdateImpactDesc", {
                count:
                  impactConfirmState.matchedEntitiesCount +
                  impactConfirmState.matchedConnectionsCount,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-3 py-2 text-xs">
            {/* 1. Deleted fields */}
            {impactConfirmState.deletedRecords.length > 0 && (
              <div className="flex flex-col gap-1.5 rounded-md border border-destructive/30 bg-destructive/5 p-2.5">
                <span className="font-semibold text-destructive">
                  {t("templateDialog.impactDeletedRecords", {
                    count: impactConfirmState.deletedRecords.length,
                  })}
                </span>
                <ul className="list-inside list-disc space-y-0.5 text-muted-foreground">
                  {impactConfirmState.deletedRecords.map((r) => (
                    <li key={r.name}>
                      <span className="font-medium text-foreground">
                        {r.name}
                      </span>{" "}
                      ({getTypeLabel(r.type, t)}
                      {r.isArray ? ` - ${t("templateDialog.array")}` : ""})
                    </li>
                  ))}
                </ul>

                {/* Checkbox: delete from all entities */}
                <div className="mt-1 flex items-start gap-2 border-t border-destructive/20 pt-2">
                  <Checkbox
                    id="impact-delete-entities"
                    checked={impactConfirmState.deleteFromEntities}
                    onCheckedChange={(c) =>
                      setImpactConfirmState((prev) => ({
                        ...prev,
                        deleteFromEntities: Boolean(c),
                      }))
                    }
                  />
                  <FieldLabel
                    htmlFor="impact-delete-entities"
                    className="cursor-pointer text-[11px] font-normal leading-tight text-foreground select-none"
                  >
                    {t("templateDialog.impactDeleteFromEntitiesOption", {
                      count:
                        impactConfirmState.matchedEntitiesCount +
                        impactConfirmState.matchedConnectionsCount,
                    })}
                  </FieldLabel>
                </div>
              </div>
            )}

            {/* 2. Changed types / list structure */}
            {impactConfirmState.changedTypes.length > 0 && (
              <div className="flex flex-col gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/5 p-2.5">
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {t("templateDialog.impactTypeChanges")}
                </span>
                <ul className="list-inside list-disc space-y-0.5 text-muted-foreground">
                  {impactConfirmState.changedTypes.map((c) => (
                    <li key={c.name}>
                      <span className="font-medium text-foreground">
                        {c.name}
                      </span>
                      : {getTypeLabel(c.oldType, t)}
                      {c.wasArray ? " []" : ""} →{" "}
                      <span className="font-semibold text-foreground">
                        {getTypeLabel(c.newType, t)}
                        {c.isArray ? " []" : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 3. Reorder impact */}
            {impactConfirmState.isOrderChanged && (
              <div className="rounded-md border border-border/70 bg-muted/40 p-2.5 text-muted-foreground">
                <p>
                  {t("templateDialog.impactOrderChanges", {
                    count:
                      impactConfirmState.matchedEntitiesCount +
                      impactConfirmState.matchedConnectionsCount,
                  })}
                </p>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() =>
                setImpactConfirmState((prev) => ({ ...prev, open: false }))
              }
            >
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (impactConfirmState.payload) {
                  executeSaveTemplate(
                    impactConfirmState.payload,
                    impactConfirmState.deleteFromEntities,
                    impactConfirmState.renameMap
                  )
                }
              }}
            >
              {t("templateDialog.applyAndSync")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default TemplateDialog
