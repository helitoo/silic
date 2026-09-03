import * as React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  getNavItems,
  renderIcon,
  renderLabel,
  type NavItemActions,
} from "./navItems"
import { useLang } from "@/contexts/LangContext"
import { LangButton } from "@/components/ui/lang-button"
import { ThemeButton } from "@/components/ui/theme-button"
import {
  NavigationMenu,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { useRouter } from "@/contexts/RouterContext"

export function AppMobileSidebar({ actions }: { actions?: NavItemActions }) {
  const { t } = useLang()
  const { pathname, route, navigate } = useRouter()
  const { setOpenMobile } = useSidebar()

  const isLanding =
    pathname === "/" ||
    route.type === "landing" ||
    route.type === "guide" ||
    route.type === "docs-query" ||
    route.type === "docs-storage" ||
    route.type === "terms-of-service" ||
    route.type === "policy-of-privacy" ||
    route.type === "help"

  const items = React.useMemo(() => getNavItems(t, actions), [t, actions])

  const displayedItems = React.useMemo(() => {
    if (isLanding) {
      return items.filter(
        (g) =>
          g.id === "guide" ||
          g.label === t("navbar.guide") ||
          g.label === "Guide"
      )
    }
    return items
  }, [items, isLanding, t])

  const handleItemClick = (item: any) => {
    setOpenMobile(false)
    if (item.onClick) {
      item.onClick()
    } else if (item.href) {
      if (item.target === "_blank") {
        window.open(item.href, "_blank")
      } else {
        navigate(item.href)
      }
    }
  }

  return (
    <Sidebar side="left" collapsible="offcanvas" className="z-50">
      <SidebarHeader className="border-b border-sidebar-border/60 p-4">
        <button
          type="button"
          onClick={() => {
            setOpenMobile(false)
            navigate("/")
          }}
          className="flex cursor-pointer items-center gap-3 transition-opacity hover:opacity-85 focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
          title="Silic"
        >
          <img
            src="/logo.png"
            alt="Silic logo"
            className="h-8 w-auto object-contain"
            draggable={false}
          />
        </button>
      </SidebarHeader>

      <SidebarContent className="p-2">
        {displayedItems.map((group, gIdx) => (
          <SidebarGroup key={gIdx} className="py-1">
            <SidebarGroupLabel className="text-xs font-semibold tracking-wider text-muted-foreground/80 uppercase whitespace-nowrap">
              {renderLabel(group.label)}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.subItems?.map((sub, sIdx) => {
                  return (
                    <SidebarMenuItem key={sIdx}>
                      <SidebarMenuButton
                        onClick={() => handleItemClick(sub)}
                        className="h-9 justify-between rounded-lg px-2.5 text-xs font-medium whitespace-nowrap"
                      >
                        <div className="flex min-w-0 items-center gap-2.5 whitespace-nowrap">
                          {renderIcon(sub.icon)}
                          <span className="truncate whitespace-nowrap">{renderLabel(sub.label)}</span>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/60 p-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <NavigationMenu className="max-w-none">
            <NavigationMenuList className="gap-1">
              <ThemeButton triggerClassName="h-7 px-2" />
              <LangButton triggerClassName="h-7 px-2" />
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

export default AppMobileSidebar
