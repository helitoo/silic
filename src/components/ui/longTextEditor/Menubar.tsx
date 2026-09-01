import * as React from "react"
import type { Editor } from "@tiptap/react"
import { useLang } from "@/contexts/LangContext"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { getMenubarGroups, type MenubarItem } from "./menubarStates"

export interface MenubarProps {
  editor: Editor | null
  className?: string
}

export function Menubar({ editor, className }: MenubarProps) {
  const { t } = useLang()

  if (!editor) {
    return null
  }

  const groups = getMenubarGroups(t)

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1 border-b border-border/60 bg-muted/40 p-1.5 backdrop-blur-xs",
        className
      )}
      role="toolbar"
      aria-label="Editor formatting toolbar"
    >
      {groups.map((group, groupIndex) => (
        <React.Fragment key={group.id}>
          {groupIndex > 0 && (
            <Separator orientation="vertical" className="mx-1 h-5 bg-border/60" />
          )}
          <div className="flex items-center gap-0.5">
            {group.items.map((item: MenubarItem) => {
              const Icon = item.icon
              const active = item.isActive ? item.isActive(editor) : false
              const canRun = item.canExecute ? item.canExecute(editor) : true
              const tooltip = item.shortcut
                ? `${item.label} (${item.shortcut})`
                : item.label

              return (
                <Button
                  key={item.id}
                  type="button"
                  variant={active ? "secondary" : "ghost"}
                  size="icon-xs"
                  disabled={!canRun}
                  onClick={() => item.action(editor)}
                  title={tooltip}
                  aria-label={item.label}
                  aria-pressed={active}
                  className={cn(
                    "size-7 shrink-0 rounded-md transition-all",
                    active
                      ? "bg-primary/15 text-primary shadow-2xs font-semibold hover:bg-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    !canRun && "opacity-35 cursor-not-allowed"
                  )}
                >
                  {Icon ? (
                    <Icon className="size-3.5" />
                  ) : (
                    <span className="text-xs font-medium">{item.label}</span>
                  )}
                </Button>
              )
            })}
          </div>
        </React.Fragment>
      ))}
    </div>
  )
}

export default Menubar
