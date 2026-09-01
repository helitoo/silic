import { Check } from "lucide-react"
import { useLang, type Lang } from "@/contexts/LangContext"
import { cn } from "@/lib/utils"
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"

const langOptions: { value: Lang; label: string }[] = [
  { value: "en", label: "English" },
  { value: "vi", label: "Tiếng Việt" },
]

export interface LangButtonProps {
  className?: string
  triggerClassName?: string
}

export function LangButton({ className, triggerClassName }: LangButtonProps) {
  const { lang, setLang } = useLang()

  const currentOption =
    langOptions.find((option) => option.value === lang) || langOptions[0]

  return (
    <NavigationMenuItem className={className}>
      <NavigationMenuTrigger
        className={cn(
          "h-6 rounded px-1.5 text-xs font-normal text-muted-foreground hover:bg-muted/70 hover:text-foreground",
          triggerClassName
        )}
      >
        <span>{currentOption.label}</span>
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="flex min-w-[150px] flex-col gap-0.5 p-1">
          {langOptions.map((option) => {
            const isSelected = option.value === lang
            return (
              <li key={option.value}>
                <NavigationMenuLink
                  className="flex w-full cursor-pointer items-center justify-between gap-4"
                  render={
                    <button type="button" onClick={() => setLang(option.value)}>
                      <span className="flex items-center gap-2">
                        {option.label}
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

export default LangButton
