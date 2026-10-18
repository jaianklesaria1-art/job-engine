import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOutIcon, MonitorIcon, MoonIcon, SettingsIcon, SunIcon } from "lucide-react";
import { supabase, OWNER_EMAIL } from "@/lib/supabase";
import { useTheme } from "@/lib/theme";
import { useData } from "@/lib/data";

export function NavUser() {
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { demo } = useData();

  const signOut = async () => {
    if (demo) {
      window.location.href = "/";
      return;
    }
    await supabase.auth.signOut();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Account menu" className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar className="size-8">
          <AvatarFallback className="font-mono text-xs">JA</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="pointer-events-none">
            <span className="font-medium text-foreground">Jai Anklesaria</span>
            <div className="truncate text-muted-foreground text-xs">{demo ? "Preview mode" : OWNER_EMAIL}</div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate("/settings")}>
            <SettingsIcon />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("light")}>
            <SunIcon />
            Light
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")}>
            <MoonIcon />
            Dark
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")}>
            <MonitorIcon />
            Match system
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={signOut} variant="destructive">
            <LogOutIcon />
            {demo ? "Leave preview" : "Sign out"}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
