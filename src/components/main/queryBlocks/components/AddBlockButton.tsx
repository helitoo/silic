import { Plus } from "lucide-react"
import { useLang } from "@/contexts/LangContext"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "@/components/ui/select"

export type BlockType =
  | "NEUTRAL"
  | "NOT"
  | "MULTI"
  | "TRANVERSAL"
  | "LITERAL"
  | "ARRAY"
  | "ENTITYSELECTOR"
  | "CONNECTIONSELECTOR"

export interface AddBlockButtonProps {
  onSelect: (type: BlockType) => void
  className?: string
  size?: "sm" | "default"
  variant?: "dashed" | "solid" | "compact"
}

export function AddBlockButton({
  onSelect,
  className,
  size = "default",
}: AddBlockButtonProps) {
  const { t } = useLang()

  return (
    <div className={cn("inline-flex items-center", className)}>
      <Select
        value=""
        onValueChange={(val) => {
          if (val) {
            onSelect(val as BlockType)
          }
        }}
      >
        <SelectTrigger
          size={size}
          className="flex h-7 min-w-[34px] cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border/70 bg-muted/60 px-2.5 font-medium text-foreground shadow-2xs transition-all duration-150 hover:bg-muted"
          aria-label={t("query.addBlock")}
          title={t("query.addBlock")}
        >
          <Plus className="size-3.5 stroke-[2.5] text-primary" />
          <span className="text-[11px] font-semibold tracking-wide">
            {t("query.addBlock")}
          </span>
        </SelectTrigger>
        <SelectContent align="start" className="min-w-[220px]">
          <SelectGroup>
            <SelectLabel className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              {t("query.expressions")}
            </SelectLabel>
            <SelectItem value="MULTI">
              <div className="flex flex-col">
                <span className="font-semibold text-[#4C97FF] dark:text-[#3B82F6]">
                  {t("query.multi")}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {t("query.multiDesc")}
                </span>
              </div>
            </SelectItem>
            <SelectItem value="NOT">
              <div className="flex flex-col">
                <span className="font-semibold text-[#FF6680] dark:text-[#F43F5E]">
                  {t("query.not")}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {t("query.notDesc")}
                </span>
              </div>
            </SelectItem>
            <SelectItem value="NEUTRAL">
              <div className="flex flex-col">
                <span className="font-semibold text-[#7952D8] dark:text-[#8B5CF6]">
                  {t("query.neutral")}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {t("query.neutralDesc")}
                </span>
              </div>
            </SelectItem>
            <SelectItem value="TRANVERSAL">
              <div className="flex flex-col">
                <span className="font-semibold text-[#0EA5E9] dark:text-[#06B6D4]">
                  {t("query.traversal")}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {t("query.traversalDesc")}
                </span>
              </div>
            </SelectItem>
          </SelectGroup>

          <SelectGroup>
            <SelectLabel className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              {t("query.primaryOperands")}
            </SelectLabel>
            <SelectItem value="LITERAL">
              <div className="flex flex-col">
                <span className="font-semibold text-[#FFAB19] dark:text-[#F59E0B]">
                  {t("query.literal")}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {t("query.literalDesc")}
                </span>
              </div>
            </SelectItem>
            <SelectItem value="ARRAY">
              <div className="flex flex-col">
                <span className="font-semibold text-[#FF8C1A] dark:text-[#F97316]">
                  {t("query.array")}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {t("query.arrayDesc")}
                </span>
              </div>
            </SelectItem>
            <SelectItem value="ENTITYSELECTOR">
              <div className="flex flex-col">
                <span className="font-semibold text-[#59C059] dark:text-[#10B981]">
                  {t("query.entitySelector")}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {t("query.entitySelectorDesc")}
                </span>
              </div>
            </SelectItem>
            <SelectItem value="CONNECTIONSELECTOR">
              <div className="flex flex-col">
                <span className="font-semibold text-[#0EA5E9] dark:text-[#06B6D4]">
                  {t("query.connectionSelector")}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {t("query.connectionSelectorDesc")}
                </span>
              </div>
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

export default AddBlockButton
