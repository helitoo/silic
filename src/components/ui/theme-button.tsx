import * as React from "react"
import { Check, Sun, Moon, Laptop } from "lucide-react"
import { useTheme, type Theme } from "@/contexts/ThemeContext"
import { useLang } from "@/contexts/LangContext"
import { cn } from "@/lib/utils"
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"

export interface ThemeButtonProps {
  className?: string
  triggerClassName?: string
}

export function ThemeButton({ className, triggerClassName }: ThemeButtonProps) {
  const { theme, setTheme } = useTheme()
  const { t } = useLang()

  const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] =
    React.useMemo(
      () => [
        {
          value: "light",
          label: t("theme.light") || "Sáng",
          icon: <Sun className="size-3.5" />,
        },
        {
          value: "dark",
          label: t("theme.dark") || "Tối",
          icon: <Moon className="size-3.5" />,
        },
        {
          value: "system",
          label: t("theme.system") || "Hệ thống",
          icon: <Laptop className="size-3.5" />,
        },
      ],
      [t]
    )

  const currentOption =
    themeOptions.find((option) => option.value === theme) || themeOptions[2]

  return (
    <NavigationMenuItem className={className}>
      <NavigationMenuTrigger
        className={cn(
          "h-6 rounded px-1.5 text-xs font-normal text-muted-foreground hover:bg-muted/70 hover:text-foreground",
          triggerClassName
        )}
      >
        {currentOption.label}
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="flex min-w-[140px] flex-col gap-0.5 p-1">
          {themeOptions.map((option) => {
            const isSelected = option.value === theme
            return (
              <li key={option.value}>
                <NavigationMenuLink
                  className="flex w-full cursor-pointer items-center justify-between gap-3"
                  render={
                    <button
                      type="button"
                      onClick={() => setTheme(option.value)}
                    >
                      <span className="flex items-center gap-2 text-xs">
                        {option.icon}
                        <span>{option.label}</span>
                      </span>
                      {isSelected && (
                        <Check className="size-3.5 shrink-0 text-primary" />
                      )}
                    </button>
                  }
                />
              </li>
            )
          })}
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  )
}

export default ThemeButton
