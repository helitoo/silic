import { useLang } from "@/contexts/LangContext"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { CopyButton } from "@/components/ui/copy-button"

export interface IdFieldProps {
  id: string
  label?: string
  placeholder?: string
  className?: string
}

export function IdField({
  id,
  label,
  placeholder = "ID...",
  className,
}: IdFieldProps) {
  const { t } = useLang()

  return (
    <Field className={className}>
      <FieldLabel htmlFor="dialog-item-id" className="text-xs font-medium">
        {label || t("entityDialog.id")}{" "}
        <span className="ml-0.5 font-bold text-destructive">*</span>
      </FieldLabel>
      <div className="flex items-center gap-1.5">
        <Input
          id="dialog-item-id"
          value={id}
          disabled
          readOnly
          className="flex-1 cursor-not-allowed bg-muted/40 text-xs select-all"
          placeholder={placeholder}
          required
        />
        <CopyButton content={id} />
      </div>
    </Field>
  )
}

export default IdField
