import { useConnection } from "@/contexts/ConnectionContext"
import { useLang } from "@/contexts/LangContext"
import { cn, getConnectionName } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface ConnectionNameSelectProps {
  value?: string
  onChange?: (value: string) => void
  className?: string
  placeholder?: string
  disabled?: boolean
}

export function ConnectionNameSelect({
  value,
  onChange,
  className,
  placeholder,
  disabled = false,
}: ConnectionNameSelectProps) {
  const { connections } = useConnection()
  const { t } = useLang()

  const currentConnection = value
    ? connections.find((c) => c.id === value)
    : null
  const currentDisplayName = currentConnection
    ? getConnectionName(currentConnection)
    : value || ""

  return (
    <Select
      value={value || ""}
      disabled={disabled}
      onValueChange={(val) => {
        if (val && onChange) onChange(val)
      }}
    >
      <SelectTrigger
        size="sm"
        disabled={disabled}
        className={cn(
          "h-7 w-auto min-w-max cursor-pointer justify-between gap-1.5 rounded-md border border-border/70 bg-muted/40 px-2.5 text-xs font-medium text-foreground shadow-2xs hover:bg-muted/70",
          disabled && "cursor-not-allowed opacity-60",
          className
        )}
        aria-label={t("query.selectConnection")}
      >
        <SelectValue placeholder={placeholder || t("query.selectConnection")}>
          <span className="font-mono whitespace-nowrap">
            {currentDisplayName || placeholder || t("query.selectConnection")}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="start" className="w-auto min-w-[180px]">
        <SelectGroup>
          {connections.map((conn) => {
            const displayName = getConnectionName(conn)
            return (
              <SelectItem key={conn.id} value={conn.id}>
                <div className="flex flex-col py-0.5 text-left whitespace-nowrap">
                  <span className="text-xs font-semibold text-foreground">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    ({conn.id})
                  </span>
                </div>
              </SelectItem>
            )
          })}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export default ConnectionNameSelect
