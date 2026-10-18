import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { ShortcutsDialog } from "@/components/shortcuts-dialog";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { CircleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useData } from "@/lib/data";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [helpOpen, setHelpOpen] = useState(false);
  const navigate = useNavigate();
  const { error, reload, lastLoadedAt } = useData();
  const [retrying, setRetrying] = useState(false);

  useHotkeys({
    "?": () => setHelpOpen((o) => !o),
    "g t": () => navigate("/"),
    "g j": () => navigate("/jobs"),
    "g c": () => navigate("/contacts"),
    "g o": () => navigate("/outreach"),
    "g r": () => navigate("/review"),
    "g s": () => navigate("/settings"),
  });

  return (
    <SidebarProvider className={cn("[--app-wrapper-max-width:84rem]")} defaultOpen={window.innerWidth >= 1280}>
      <AppSidebar onShortcuts={() => setHelpOpen(true)} />
      <SidebarInset className="min-w-0">
        <AppHeader />
        <div className={cn("flex min-w-0 flex-1 flex-col p-4 md:p-6", "mx-auto w-full max-w-(--app-wrapper-max-width)")}>
          {error && (
            <div className="mb-6 flex flex-wrap items-center gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm" role="alert">
              <CircleAlertIcon className="size-4 shrink-0 text-destructive" />
              <p className="min-w-0 flex-1">
                <span className="font-medium">Can't reach the database.</span>{" "}
                <span className="text-muted-foreground">
                  {lastLoadedAt ? "Showing what loaded last time." : "Check your internet connection."} ({error})
                </span>
              </p>
              <Button
                disabled={retrying}
                onClick={async () => {
                  setRetrying(true);
                  await reload();
                  setRetrying(false);
                }}
                size="sm"
                variant="outline"
              >
                {retrying ? "Trying..." : "Try again"}
              </Button>
            </div>
          )}
          {children}
        </div>
      </SidebarInset>
      <ShortcutsDialog onOpenChange={setHelpOpen} open={helpOpen} />
    </SidebarProvider>
  );
}
