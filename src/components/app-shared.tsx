import type { ReactNode } from "react";
import {
  BarChart3Icon,
  BriefcaseIcon,
  GraduationCapIcon,
  HomeIcon,
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
    items: [{ title: "Home", path: "/", icon: <HomeIcon /> }],
  },
  {
    label: "Jobs",
    items: [
      { title: "Today", path: "/today", icon: <SunriseIcon /> },
      { title: "Jobs", path: "/jobs", icon: <BriefcaseIcon /> },
      { title: "Contacts", path: "/contacts", icon: <UsersIcon /> },
    ],
  },
  {
    label: "Research",
    items: [{ title: "PhD", path: "/phd", icon: <GraduationCapIcon /> }],
  },
  {
    label: "Later",
    items: [
      { title: "Companies", path: "/companies", icon: <Building2Icon />, phase: "Bot 2" },
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
  if (pathname.startsWith("/phd/")) return { title: "PhD position", icon: <GraduationCapIcon /> };
  return navLinks.find((i) => i.path === pathname) ?? navLinks[0];
}
