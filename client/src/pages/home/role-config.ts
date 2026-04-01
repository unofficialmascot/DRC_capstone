import type { PublicUser } from "@/lib/types";

export type RoleType =
  | "scholar"
  | "supervisor"
  | "drc"
  | "drc_convener"
  | "drc_chairman"
  | "irc"
  | "doaa"
  | "admin";

export interface SidebarItem {
  route: string;
  label: string;
  isHighlighted?: boolean;
}

export interface RoleConfig {
  role: RoleType;
  defaultPath: string;
  validPaths: string[];
  sidebarItems: SidebarItem[];
}

export function getRoleConfig(role: string): RoleConfig {
  switch (role) {
    case "scholar":
      return {
        role: "scholar",
        defaultPath: "/scholar/profile",
        validPaths: [
          "/scholar/profile",
          "/scholar/applications",
          "/scholar/research",
          "/scholar/fees",
          "/scholar/dochub",
          "/scholar/noticeboard",
        ],
        sidebarItems: [
          { route: "/scholar/profile", label: "Profile" },
          { route: "/scholar/applications", label: "Applications", isHighlighted: true },
          { route: "/scholar/research", label: "Research Progress" },
          { route: "/scholar/fees", label: "Fee Details" },
          { route: "/scholar/dochub", label: "Doc-Hub", isHighlighted: true },
          { route: "/scholar/noticeboard", label: "Notice Board" },
        ],
      };

    case "supervisor":
      return {
        role: "supervisor",
        defaultPath: "/supervisor/dashboard",
        validPaths: [
          "/supervisor/dashboard",
          "/supervisor/profile",
          "/supervisor/rac-reviews",
          "/supervisor/application-requests",
          "/supervisor/biometric",
          "/supervisor/help-support",
        ],
        sidebarItems: [
          { route: "/supervisor/dashboard", label: "Dashboard" },
          { route: "/supervisor/profile", label: "Profile" },
          { route: "/supervisor/application-requests", label: "Application Requests", isHighlighted: true },
          { route: "/supervisor/rac-reviews", label: "RAC Reviews" },
          { route: "/supervisor/biometric", label: "Biometric" },
          { route: "/supervisor/help-support", label: "Help & Support" },
        ],
      };

    case "drc_chairman":
      return {
        role: "drc_chairman",
        defaultPath: "/chairman/dashboard",
        validPaths: [
          "/chairman/dashboard",
          "/chairman/rac-reviews",
          "/chairman/profile",
          "/chairman/extensions",
          "/chairman/minutes",
        ],
        sidebarItems: [
          { route: "/chairman/dashboard", label: "Dashboard" },
          { route: "/chairman/rac-reviews", label: "RAC Reviews" },
          { route: "/chairman/profile", label: "Profile" },
          { route: "/chairman/extensions", label: "Extensions" },
          { route: "/chairman/minutes", label: "Minutes", isHighlighted: true },
        ],
      };

    case "drc":
      return {
        role: "drc",
        defaultPath: "/reviewer/dashboard",
        validPaths: ["/reviewer/dashboard", "/reviewer/meetings", "/reviewer/profile", "/reviewer/help-support"],
        sidebarItems: [
          { route: "/reviewer/dashboard", label: "Dashboard" },
          { route: "/reviewer/profile", label: "Profile" },
          { route: "/reviewer/meetings", label: "Meetings", isHighlighted: true },
          { route: "/reviewer/help-support", label: "Help & Support" },
        ],
      };

    case "drc_convener":
    case "irc":
    case "doaa":
      return {
        role: role as RoleType,
        defaultPath: "/reviewer/dashboard",
        validPaths: ["/reviewer/dashboard", "/reviewer/reviews", "/reviewer/profile", "/reviewer/help-support"],
        sidebarItems: [
          { route: "/reviewer/dashboard", label: "Dashboard" },
          { route: "/reviewer/profile", label: "Profile" },
          { route: "/reviewer/reviews", label: role === "drc_convener" ? "Meeting Agenda" : "Pending Reviews", isHighlighted: true },
          { route: "/reviewer/help-support", label: "Help & Support" },
        ],
      };

    case "admin":
      return {
        role: "admin",
        defaultPath: "/reviewer/dashboard",
        validPaths: ["/reviewer/dashboard", "/reviewer/reviews", "/reviewer/meetings"],
        sidebarItems: [
          { route: "/reviewer/dashboard", label: "Admin Dashboard" },
          { route: "/reviewer/reviews", label: "Review Queue" },
          { route: "/reviewer/meetings", label: "Meetings" },
        ],
      };

    default:
      return {
        role: "scholar",
        defaultPath: "/scholar/profile",
        validPaths: ["/scholar/profile"],
        sidebarItems: [{ route: "/scholar/profile", label: "Profile" }],
      };
  }
}

export function getRoleLabel(role: string): string {
  switch (role) {
    case "scholar":
      return "Scholar";
    case "supervisor":
      return "Supervisor";
    case "drc":
      return "DRC Member";
    case "drc_convener":
      return "DRC Convener";
    case "drc_chairman":
      return "DRC Chairman";
    case "irc":
      return "IRC Member";
    case "doaa":
      return "DoAA Officer";
    case "admin":
      return "Admin";
    default:
      return role;
  }
}
