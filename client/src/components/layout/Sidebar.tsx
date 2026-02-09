import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  UserCircle,
  FileText,
  FileCheck,
  FileSignature,
  BookOpen,
  GraduationCap,
  Bell,
  HardDrive,
  LifeBuoy,
  Wallet,
  FileBadge,
  Fingerprint
} from "lucide-react";
import { useUser } from "@/hooks/use-users";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { data: user } = useUser(1); // Hardcoded ID 1 for demo
  const role = user?.role || "scholar";

  const menuItems = {
    scholar: [
      { label: "My Profile", icon: UserCircle, href: "/profile" },
      { label: "Research Progress", icon: LayoutDashboard, href: "/research" },
      { label: "Fee Details", icon: Wallet, href: "/fees" },
      { label: "Change of Supervisor", icon: FileText, href: "/applications/change-supervisor" },
      { label: "Pre-talk Application", icon: FileText, href: "/applications/pre-talk" },
      { label: "Extension Application", icon: FileText, href: "/applications/extension" },
      { label: "Re-Registration Application", icon: FileText, href: "/applications/re-registration" },
      { label: "Track My Application", icon: FileCheck, href: "/applications/track", highlight: true },
      { label: "Thesis Submission", icon: FileSignature, href: "/applications/thesis-submission" },
      { label: "Academic Progress", icon: GraduationCap, href: "/academic" },
      { label: "Doc-Hub", icon: BookOpen, href: "/doc-hub", highlight: true },
      { label: "Notice Board", icon: Bell, href: "/notices" },
      { label: "Repository", icon: HardDrive, href: "/repository" },
      { label: "Support", icon: LifeBuoy, href: "/support" },
    ],
    supervisor: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
      { label: "RAC Reports", icon: FileText, href: "/rac-reports" },
      { label: "Notice Board", icon: Bell, href: "/notices" },
      { label: "Profile", icon: UserCircle, href: "/profile" },
      { label: "Biometric", icon: Fingerprint, href: "/biometric" },
      { label: "Support", icon: LifeBuoy, href: "/support" },
      { label: "LPC", icon: FileBadge, href: "/lpc" },
    ],
    rac: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
      { label: "RAC Reviews", icon: FileText, href: "/reviews" },
      { label: "Notice Board", icon: Bell, href: "/notices" },
      { label: "Profile", icon: UserCircle, href: "/profile" },
      { label: "Support", icon: LifeBuoy, href: "/support" },
    ],
  };

  const currentItems = menuItems[role as keyof typeof menuItems] || menuItems.scholar;

  return (
    <div className={cn("flex flex-col h-full bg-white border-r border-border", className)}>
      <div className="p-6 border-b border-border/50">
        <h2 className="text-xl font-bold font-display text-primary tracking-tight">G-Scholar Hub</h2>
        <p className="text-xs text-muted-foreground mt-1 font-medium tracking-wide uppercase">
          {role} Portal
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {currentItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "nav-item cursor-pointer group",
                  isActive && "nav-item-active",
                  ('highlight' in item) && item.highlight && !isActive && "text-red-500 hover:text-red-600 hover:bg-red-50"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5",
                    isActive ? "text-white" : ('highlight' in item) && item.highlight ? "text-red-500" : "text-slate-400 group-hover:text-primary"
                  )}
                />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
            {user?.name?.charAt(0) || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-slate-900">{user?.name || "Loading..."}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
