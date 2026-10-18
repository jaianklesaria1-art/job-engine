import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";
import { RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DecorIcon } from "@/components/decor-icon";
import { AppBreadcrumbs } from "@/components/app-breadcrumbs";
import { pageForPath } from "@/components/app-shared";
import { CustomSidebarTrigger } from "@/components/custom-sidebar-trigger";
import { NavUser } from "@/components/nav-user";
import { useData, useLastRuns } from "@/lib/data";
import { timeAgo } from "@/lib/format";

export function AppHeader() {
  const { pathname } = useLocation();
  const { settings, reload, demo } = useData();
  const lastScout = useLastRuns().get("job_scout");

  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4 md:px-6",
        "bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50",
      )}
    >
      <DecorIcon className="hidden md:block" position="bottom-left" />
      <div className="flex min-w-0 items-center gap-3">
        <CustomSidebarTrigger />
        <Separator className="mr-2 h-4 data-[orientation=vertical]:self-center" orientation="vertical" />
        <AppBreadcrumbs page={pageForPath(pathname)} />
      </div>
      <div className="flex shrink-0 items-center gap-2 md:gap-3">
        {demo && (
          <span className="whitespace-nowrap rounded-sm border border-dashed px-2 py-0.5 font-mono text-[10px] text-muted-foreground uppercase">
            Sample<span className="hidden sm:inline"> data</span>
          </span>
        )}
        <span className="hidden whitespace-nowrap font-mono text-[11px] text-muted-foreground lg:inline">
          Week {settings?.week_type ?? "A"} · Job Scout {lastScout ? timeAgo(lastScout.started_at) : "not run yet"}
        </span>
        <Tooltip>
          <TooltipTrigger render={<Button aria-label="Refresh data" onClick={() => void reload()} size="icon-sm" variant="outline" />}>
            <RefreshCwIcon />
          </TooltipTrigger>
          <TooltipContent>Refresh (updates arrive live anyway)</TooltipContent>
        </Tooltip>
        <Separator className="h-4 data-[orientation=vertical]:self-center" orientation="vertical" />
        <NavUser />
      </div>
    </header>
  );
}
