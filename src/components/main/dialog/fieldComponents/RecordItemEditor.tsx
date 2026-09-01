import * as React from "react"
import { CirclePlus, GripVertical, Trash2, X } from "lucide-react"
import { DragDropProvider } from "@dnd-kit/react"
import { useSortable } from "@dnd-kit/react/sortable"
import { move as dndMove } from "@dnd-kit/helpers"

import type { Type } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  getTypeIcon,
  getTypeLabel,
  getTypeOptions,
  type TypeOption,
} from "@/lib/template-utils"
import { useLang } from "@/contexts/LangContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RecordValueInput } from "./RecordValueInput"

export interface RecordFormState {
  id?: string
  name: string
  type: Type
  isArray: boolean
  value: string | string[]
}

export interface RecordItemEditorProps {
  record: RecordFormState
  index: number
  typeOptions?: TypeOption[]
  onUpdate: (index: number, partial: Partial<RecordFormState>) => void
  onRemove: (index: number) => void
  onAddArrayItem: (index: number) => void
  onUpdateArrayItem: (
    recordIndex: number,
    itemIndex: number,
    value: string
  ) => void
  onRemoveArrayItem: (recordIndex: number, itemIndex: number) => void
}

interface ArrayItemRowProps {
  id: string
  index: number
  type: Type
  value: string
  placeholder: string
  onUpdate: (value: string) => void
  onRemove: () => void
  dragTitle: string
  removeTitle: string
}

const ArrayItemRow = React.memo(function ArrayItemRow({
  id,
  index,
  type,
  value,
  placeholder,
  onUpdate,
  onRemove,
  dragTitle,
  removeTitle,
}: ArrayItemRowProps) {
  const { ref, handleRef, isDragging, isDropTarget } = useSortable({
    id,
    index,
  })

  return (
    <div
      ref={ref}
      className={cn(
        "group/item flex items-center gap-1.5 rounded-md border border-border/70 bg-background/80 p-1 shadow-2xs transition-colors",
        isDragging && "border-dashed border-primary/60 bg-muted/40 opacity-40",
        isDropTarget && !isDragging && "border-primary ring-2 ring-primary/25"
      )}
    >
      {/* Drag Handle Button - Only dragging here initiates drag */}
      <Button
        ref={handleRef}
        type="button"
        variant="ghost"
        size="icon-xs"
        className="size-6 shrink-0 cursor-grab text-muted-foreground/60 hover:bg-muted hover:text-foreground active:cursor-grabbing"
        title={dragTitle}
        aria-label={dragTitle}
      >
        <GripVertical className="size-3.5" />
      </Button>

      {/* Value Input */}
      <div className="min-w-0 flex-1">
        <RecordValueInput
          type={type}
          value={value}
          onChange={onUpdate}
          placeholder={placeholder}
          isSmall
          inList
        />
      </div>

      {/* Remove Button */}
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="size-6 shrink-0 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        onClick={onRemove}
        title={removeTitle}
      >
        <X className="size-3" />
      </Button>
    </div>
  )
})

export const RecordItemEditor = React.memo(function RecordItemEditor({
  record,
  index,
  typeOptions,
  onUpdate,
  onRemove,
  onAddArrayItem,
  onUpdateArrayItem,
  onRemoveArrayItem,
}: RecordItemEditorProps) {
  const { t } = useLang()
  const currentTypeOptions = React.useMemo(
    () => typeOptions || getTypeOptions(t),
    [typeOptions, t]
  )

  const [localName, setLocalName] = React.useState(record.name ?? "")

  React.useEffect(() => {
    setLocalName(record.name ?? "")
  }, [record.name])

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value
    setLocalName(next)
    onUpdate(index, { name: next })
  }

  const isArrayRecord = Boolean(record.isArray)
  const arrayValues: string[] = React.useMemo(() => {
    if (!isArrayRecord) return []
    return Array.isArray(record.value)
      ? record.value
      : [String(record.value ?? "")]
  }, [isArrayRecord, record.value])

  const [itemIds, setItemIds] = React.useState<string[]>([])

  React.useEffect(() => {
    setItemIds((prev) => {
      if (prev.length === arrayValues.length) return prev
      return arrayValues.map((_, i) => prev[i] || crypto.randomUUID())
    })
  }, [arrayValues.length])

  return (
    <div className="group flex flex-col gap-2 rounded-lg border border-border/70 bg-card/60 p-2.5 shadow-2xs transition-colors hover:border-border">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Record Name: Full width on mobile (< sm), flex-1 on desktop (>= sm) */}
        <div className="w-full min-w-0 sm:flex-1">
          <Input
            value={localName}
            onChange={handleNameChange}
            placeholder={t("entityDialog.fieldNamePlaceholder")}
            className="h-8 w-full text-xs font-medium"
            required
          />
        </div>

        {/* Record Controls: Type select, isArray checkbox, delete button */}
        <div className="flex w-full sm:w-auto items-center justify-between sm:justify-start gap-2">
          {/* Record Type Select */}
          <div className="flex-1 sm:w-[130px] sm:flex-initial">
            <Select
              value={record.type}
              onValueChange={(val) => onUpdate(index, { type: val as Type })}
            >
              <SelectTrigger className="h-8 w-full justify-between text-xs">
                <SelectValue>
                  <span className="flex items-center gap-1.5 truncate">
                    {getTypeIcon(record.type)}
                    <span>{getTypeLabel(record.type, t)}</span>
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
          </div>

          {/* isArray Checkbox */}
          <div className="flex h-8 shrink-0 items-center gap-1.5 px-1">
            <Checkbox
              id={`rec-array-${index}`}
              checked={record.isArray}
              onCheckedChange={(checked) =>
                onUpdate(index, { isArray: Boolean(checked) })
              }
            />
            <FieldLabel
              htmlFor={`rec-array-${index}`}
              className="cursor-pointer text-[11px] font-normal text-muted-foreground select-none"
            >
              {t("entityDialog.array")}
            </FieldLabel>
          </div>

          {/* Delete Record Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="size-7 shrink-0 rounded-full text-destructive hover:bg-destructive/10"
            onClick={() => onRemove(index)}
            title={t("entityDialog.deleteRecord")}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Record Value: Single or Array list */}
      <div className="w-full">
        {isArrayRecord ? (
          <div className="flex flex-col gap-1.5 rounded-md border border-border/50 bg-muted/20 p-2">
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              {t("entityDialog.array")} ({arrayValues.length})
            </span>

            <DragDropProvider
              onDragEnd={(event) => {
                if (event.canceled) return

                const itemsWithIds = arrayValues.map((val, i) => ({
                  id: itemIds[i] || `item-${i}`,
                  value: val,
                }))

                const reordered = dndMove(itemsWithIds, event)
                if (reordered !== itemsWithIds) {
                  setItemIds(reordered.map((it) => it.id))
                  onUpdate(index, { value: reordered.map((it) => it.value) })
                }
              }}
            >
              <div className="flex flex-col gap-1.5">
                {arrayValues.map((itemVal, itemIdx) => {
                  const itemId = itemIds[itemIdx] || `item-${itemIdx}`
                  return (
                    <ArrayItemRow
                      key={itemId}
                      id={itemId}
                      index={itemIdx}
                      type={record.type}
                      value={itemVal}
                      placeholder={`${t(
                        "entityDialog.fieldValuePlaceholder"
                      )} #${itemIdx + 1}`}
                      onUpdate={(newVal) =>
                        onUpdateArrayItem(index, itemIdx, newVal)
                      }
                      onRemove={() => onRemoveArrayItem(index, itemIdx)}
                      dragTitle={t("templateDialog.dragToReorder")}
                      removeTitle={t("common.removeFile") || "Remove item"}
                    />
                  )
                })}
              </div>
            </DragDropProvider>

            <div className="flex justify-start pt-0.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                onClick={() => onAddArrayItem(index)}
              >
                <CirclePlus className="size-3.5 stroke-[2]" />
                <span>{t("query.addValue")}</span>
              </Button>
            </div>
          </div>
        ) : (
          <RecordValueInput
            type={record.type}
            value={record.value !== undefined ? String(record.value) : ""}
            onChange={(newVal) => onUpdate(index, { value: newVal })}
            placeholder={t("entityDialog.fieldValuePlaceholder")}
          />
        )}
      </div>
    </div>
  )
})

export default RecordItemEditor

