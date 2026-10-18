import { Link, useLocation } from "react-router-dom";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { SidebarNavGroup } from "@/components/app-shared";

export function NavGroup({ label, items, badges }: SidebarNavGroup & { badges?: Record<string, number> }) {
  const { pathname } = useLocation();
  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => {
          const active = item.path === "/" ? pathname === "/" : pathname.startsWith(item.path ?? "#");
          const badge = badges?.[item.title];
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton isActive={active} tooltip={item.title} render={<Link to={item.path ?? "/"} />}>
                {item.icon}
                <span>{item.title}</span>
              </SidebarMenuButton>
              {badge ? (
                <SidebarMenuBadge className="font-mono tabular-nums">{badge}</SidebarMenuBadge>
              ) : item.phase ? (
                <SidebarMenuBadge className="font-mono text-[9px] text-muted-foreground">{item.phase}</SidebarMenuBadge>
              ) : null}
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
