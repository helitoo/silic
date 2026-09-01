import { CirclePlus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FieldSet, FieldLegend } from "@/components/ui/field"
import { EntitySelect } from "@/components/main/queryBlocks/components/EntitySelect"

export interface EntityListFieldProps {
  title: string
  actionLabel: string
  placeholder?: string
  list: string[]
  onAdd: () => void
  onUpdate: (index: number, newId: string) => void
  onRemove: (index: number) => void
}

export function EntityListField({
  title,
  actionLabel,
  placeholder,
  list,
  onAdd,
  onUpdate,
  onRemove,
}: EntityListFieldProps) {
  return (
    <FieldSet className="gap-2.5 pt-1">
      <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
        <FieldLegend variant="label" className="mb-0 text-xs font-semibold">
          {title} ({list.length})
        </FieldLegend>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 gap-1 px-2 text-xs font-medium text-primary hover:bg-primary/10"
          onClick={onAdd}
        >
          <CirclePlus className="size-3.5" />
          <span>{actionLabel}</span>
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        {list.map((entityId, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <EntitySelect
              value={entityId}
              onChange={(newId?: string) => onUpdate(idx, newId || "")}
              placeholder={placeholder}
              className="h-8 flex-1"
            />
            {list.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="size-7 shrink-0 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onRemove(idx)}
                title="Remove"
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </FieldSet>
  )
}

export default EntityListField
