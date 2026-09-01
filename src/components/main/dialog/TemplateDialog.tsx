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

import type { Template, Type } from "@/lib/types"
import { templateSchema } from "@/lib/schemas"
import { getTypeIcon, getTypeLabel, getTypeOptions } from "@/lib/template-utils"
import { useTemplate } from "@/contexts/TemplateContext"
import { useLang } from "@/contexts/LangContext"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { CopyButton } from "@/components/ui/copy-button"
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
        name: r.name || "",
        type: r.type || "shortText",
        isArray: Boolean(r.isArray),
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
          ? draft.records
          : [
              {
                name: "",
                type: "shortText",
                isArray: false,
              },
            ],
    }
  }
  return {
    id: crypto.randomUUID(),
    name: "",
    records: [
      {
        name: "",
        type: "shortText",
        isArray: false,
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
        "group relative flex items-center gap-2 rounded-lg border border-border/70 bg-card/60 p-2.5 shadow-2xs transition-all hover:border-border",
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

  // Reset form whenever dialog opens or defaultValue changes
  React.useEffect(() => {
    if (open) {
      form.reset(getDefaultFormValues(defaultValue))
    }
  }, [open, defaultValue, form])

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
            name: "",
            type: "shortText",
            isArray: false,
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
    if (onDelete) {
      onDelete(defaultValue.id)
    } else {
      deleteTemplate(defaultValue.id)
    }

    toast.add({
      type: "success",
      title: t("templateDialog.deletedSuccess"),
    })

    setShowDeleteAlert(false)
    onOpenChange(false)
  }

  const handleFormSubmit = (data: Template) => {
    const payload: Template = {
      id: data.id,
      name: data.name.trim(),
      records: (data.records || []).map((r) => ({
        name: r.name.trim(),
        type: r.type,
        isArray: Boolean(r.isArray),
      })),
    }

    if (onSave) {
      onSave(payload)
    } else {
      put(payload)
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

    onOpenChange(false)
  }

  const handleAddRecord = () => {
    append({
      name: "",
      type: "shortText",
      isArray: false,
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
              <Controller
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
              />

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
                    const { source, target } = event.operation
                    if (!source || !target || source.id === target.id) return

                    const sourceIndex = fields.findIndex(
                      (f) => f.id === source.id
                    )
                    const targetIndex = fields.findIndex(
                      (f) => f.id === target.id
                    )
                    if (
                      sourceIndex !== -1 &&
                      targetIndex !== -1 &&
                      sourceIndex !== targetIndex
                    ) {
                      move(sourceIndex, targetIndex)
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
                        onRemove={() => remove(index)}
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
              <Button type="submit">
                {defaultValue
                  ? t("templateDialog.save")
                  : t("templateDialog.create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Item Alert Dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("templateDialog.confirmDeleteTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("templateDialog.confirmDeleteDesc")}
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
    </>
  )
}

export default TemplateDialog
