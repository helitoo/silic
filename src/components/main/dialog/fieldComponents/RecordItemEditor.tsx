import * as React from "react"
import { CirclePlus, GripVertical, Trash2, X } from "lucide-react"
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

export function RecordItemEditor({
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

  const [draggedIdx, setDraggedIdx] = React.useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = React.useState<number | null>(null)

  const isArrayRecord = Boolean(record.isArray)
  const arrayValues: string[] = isArrayRecord
    ? Array.isArray(record.value)
      ? record.value
      : [String(record.value ?? "")]
    : []

  const handleDragStart = (e: React.DragEvent, itemIdx: number) => {
    setDraggedIdx(itemIdx)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", String(itemIdx))
  }

  const handleDragOver = (e: React.DragEvent, itemIdx: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    if (dragOverIdx !== itemIdx) {
      setDragOverIdx(itemIdx)
    }
  }

  const handleDragLeave = () => {
    setDragOverIdx(null)
  }

  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault()
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null)
      setDragOverIdx(null)
      return
    }

    const nextArr = [...arrayValues]
    const [moved] = nextArr.splice(draggedIdx, 1)
    nextArr.splice(targetIdx, 0, moved)

    onUpdate(index, { value: nextArr })
    setDraggedIdx(null)
    setDragOverIdx(null)
  }

  const handleDragEnd = () => {
    setDraggedIdx(null)
    setDragOverIdx(null)
  }

  return (
    <div className="group flex flex-col gap-2 rounded-lg border border-border/70 bg-card/60 p-2.5 shadow-2xs transition-all hover:border-border">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Record Name: Full width on mobile (< sm), flex-1 on desktop (>= sm) */}
        <div className="w-full min-w-0 sm:flex-1">
          <Input
            value={record.name}
            onChange={(e) => onUpdate(index, { name: e.target.value })}
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
            <div className="flex flex-col gap-1.5">
              {arrayValues.map((itemVal, itemIdx) => (
                <div
                  key={itemIdx}
                  draggable
                  onDragStart={(e) => handleDragStart(e, itemIdx)}
                  onDragOver={(e) => handleDragOver(e, itemIdx)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, itemIdx)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "group/item flex items-center gap-1.5 rounded-md border border-border/70 bg-background/80 p-1 shadow-2xs transition-all",
                    draggedIdx === itemIdx &&
                      "opacity-40 border-dashed border-primary",
                    dragOverIdx === itemIdx &&
                      draggedIdx !== itemIdx &&
                      "border-primary ring-2 ring-primary/25"
                  )}
                >
                  <div
                    className="flex size-6 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
                    title="Drag to reorder"
                  >
                    <GripVertical className="size-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <RecordValueInput
                      type={record.type}
                      value={itemVal}
                      onChange={(newVal) =>
                        onUpdateArrayItem(index, itemIdx, newVal)
                      }
                      placeholder={`${t(
                        "entityDialog.fieldValuePlaceholder"
                      )} #${itemIdx + 1}`}
                      isSmall
                      inList
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="size-6 shrink-0 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onRemoveArrayItem(index, itemIdx)}
                    title={t("common.removeFile") || "Remove item"}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
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
}

export default RecordItemEditor
