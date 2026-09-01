import * as React from "react"
import { Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export type QueryBlockColor =
  | "blue"
  | "indigo"
  | "amber"
  | "orange"
  | "purple"
  | "emerald"
  | "rose"
  | "cyan"
  | string

export interface QueryBlockProps {
  color?: QueryBlockColor
  className?: string
  children: React.ReactNode
  onDelete?: () => void
}

const colorVariants: Record<string, string> = {
  blue: "border-l-4 border-l-[#4C97FF] dark:border-l-[#3B82F6]",
  indigo: "border-l-4 border-l-[#7952D8] dark:border-l-[#8B5CF6]",
  amber: "border-l-4 border-l-[#FFAB19] dark:border-l-[#F59E0B]",
  orange: "border-l-4 border-l-[#FF8C1A] dark:border-l-[#F97316]",
  purple: "border-l-4 border-l-[#9966FF] dark:border-l-[#A855F7]",
  emerald: "border-l-4 border-l-[#59C059] dark:border-l-[#10B981]",
  rose: "border-l-4 border-l-[#FF6680] dark:border-l-[#F43F5E]",
  cyan: "border-l-4 border-l-[#0EA5E9] dark:border-l-[#06B6D4]",
}

export function QueryBlock({
  color = "blue",
  className,
  children,
  onDelete,
}: QueryBlockProps) {
  const borderClass = colorVariants[color] || colorVariants.blue

  return (
    <div
      className={cn(
        "group relative flex flex-col w-full rounded-r-xl rounded-l-none bg-card text-card-foreground border-0 p-2.5 shadow-xs hover:shadow-sm transition-all duration-150 select-none",
        borderClass,
        className
      )}
    >
      {onDelete && (
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="size-5 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            title="Delete block"
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      )}

      <div className="flex flex-col items-start gap-2 w-full text-foreground font-normal">
        {children}
      </div>
    </div>
  )
}

export default QueryBlock
