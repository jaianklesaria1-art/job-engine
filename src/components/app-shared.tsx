import type { ReactNode } from "react";
import {
  BarChart3Icon,
  BriefcaseIcon,
  Building2Icon,
  KeyboardIcon,
  MailIcon,
  SettingsIcon,
  SunriseIcon,
  UsersIcon,
} from "lucide-react";

export type SidebarNavItem = {
  title: string;
  path?: string;
  icon?: ReactNode;
  isActive?: boolean;
  subItems?: SidebarNavItem[];
  phase?: string;
};

export type SidebarNavGroup = {
  label?: string;
  items: SidebarNavItem[];
};

export const navGroups: SidebarNavGroup[] = [
  {
    label: "Daily",
    items: [
      { title: "Today", path: "/", icon: <SunriseIcon /> },
      { title: "Jobs", path: "/jobs", icon: <BriefcaseIcon /> },
    ],
  },
  {
    label: "People",
    items: [
      { title: "Companies", path: "/companies", icon: <Building2Icon />, phase: "Bot 2" },
      { title: "Contacts", path: "/contacts", icon: <UsersIcon />, phase: "Bot 2" },
      { title: "Outreach", path: "/outreach", icon: <MailIcon />, phase: "Bot 3" },
    ],
  },
  {
    label: "Progress",
    items: [{ title: "Review", path: "/review", icon: <BarChart3Icon />, phase: "Bot 4" }],
  },
];

export const footerNavLinks: SidebarNavItem[] = [
  { title: "Settings", path: "/settings", icon: <SettingsIcon /> },
  { title: "Shortcuts", path: "#shortcuts", icon: <KeyboardIcon /> },
];

export const navLinks: SidebarNavItem[] = [...navGroups.flatMap((g) => g.items), ...footerNavLinks];

export function pageForPath(pathname: string) {
  if (pathname.startsWith("/jobs/")) return { title: "Job detail", icon: <BriefcaseIcon /> };
  return navLinks.find((i) => i.path === pathname) ?? navLinks[0];
}
