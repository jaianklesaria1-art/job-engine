import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { footerNavLinks, navGroups } from "@/components/app-shared";
import { LatestChange } from "@/components/latest-change";
import { NavGroup } from "@/components/nav-group";
import { useData } from "@/lib/data";
import { freshnessOf } from "@/lib/format";

export function AppSidebar({ onShortcuts }: { onShortcuts: () => void }) {
  const { jobs, batches, contacts } = useData();
  const { pathname } = useLocation();
  const { setOpenMobile } = useSidebar();
  // Close the phone menu after picking a page
  useEffect(() => setOpenMobile(false), [pathname, setOpenMobile]);
  const newToday = jobs.filter((j) => j.status === "found" && freshnessOf(j) === "hot").length;
  const toApprove = batches.filter((b) => b.status === "pending").length;
  const toSend = contacts.filter(
    (c) =>
      (c.linkedin_note && c.linkedin_status === "not_sent") ||
      (c.email && (c.email_status === "verified" || c.email_status === "accept_all") && !c.last_contacted_at),
  ).length;
  const badges = { Jobs: newToday, Outreach: toApprove, Contacts: toSend };

  return (
    <Sidebar
      className={cn(
        "*:data-[slot=sidebar-inner]:bg-background",
        "*:data-[slot=sidebar-inner]:dark:bg-[radial-gradient(60%_18%_at_10%_0%,--theme(--color-foreground/.08),transparent)]",
        "**:data-[slot=sidebar-menu-button]:[&>span]:text-foreground/75",
      )}
      collapsible="icon"
      variant="sidebar"
    >
      <SidebarHeader className="h-14 justify-center border-b px-2">
        <SidebarMenuButton render={<Link to="/" />}>
          <span className="flex size-5 items-center justify-center rounded-sm bg-foreground font-mono text-[10px] text-background">
            JE
          </span>
          <span className="font-heading text-lg text-foreground!">Job Engine</span>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <NavGroup badges={badges} key={group.label} {...group} />
        ))}
      </SidebarContent>
      <SidebarFooter className="gap-0 p-0">
        <LatestChange />
        <SidebarMenu className="border-t p-2">
          {footerNavLinks.map((item) => (
            <SidebarMenuItem data-hint={item.path === "#shortcuts" ? "keyboard" : undefined} key={item.title}>
              {item.path === "#shortcuts" ? (
                <SidebarMenuButton className="text-muted-foreground" onClick={onShortcuts} size="sm">
                  {item.icon}
                  <span>{item.title}</span>
                  <kbd className="ml-auto font-mono text-[10px]">?</kbd>
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton
                  className="text-muted-foreground"
                  isActive={pathname === item.path}
                  render={<Link to={item.path ?? "/"} />}
                  size="sm"
                >
                  {item.icon}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
