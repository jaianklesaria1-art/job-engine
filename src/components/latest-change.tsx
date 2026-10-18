import { cn } from "@/lib/utils";
import { useData } from "@/lib/data";

export function LatestChange() {
  const { settings } = useData();
  const week = settings?.week_type ?? "A";
  return (
    <div
      className={cn(
        "relative flex min-h-24 flex-col justify-center gap-1 overflow-hidden border-t px-4 pt-3 pb-2 *:text-nowrap",
        "transition-opacity group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:opacity-0",
      )}
    >
      <span className="font-light font-mono text-[10px] text-muted-foreground">THIS WEEK</span>
      <p className="font-heading text-base leading-tight">
        {week === "A" ? "India + Remote" : "International"}
      </p>
      <span className="text-[10px] text-muted-foreground">
        Week {week}. Next week: {week === "A" ? "International" : "India + Remote"}.
      </span>
      {settings?.paused && <span className="font-mono text-[10px] text-destructive">ALL BOTS PAUSED</span>}
    </div>
  );
}
