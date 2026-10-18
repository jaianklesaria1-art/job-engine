import { PanelLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

export function CustomSidebarTrigger() {
  const { toggleSidebar } = useSidebar();
  return (
    <Button aria-label="Toggle sidebar" onClick={toggleSidebar} size="icon-sm" variant="ghost">
      <PanelLeftIcon />
    </Button>
  );
}
