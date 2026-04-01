import type { ReactNode } from "react";
import type { PublicUser } from "@/lib/types";
import type { SidebarItem } from "./role-config";
import ActionButton from "@/components/ui/ActionButton";

interface RoleDashboardLayoutProps {
  user: PublicUser;
  roleLabel: string;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  sidebarItems: Array<SidebarItem & { isActive: boolean; onClick: () => void }>;
  onLogout: () => void;
  notificationsOpen: boolean;
  onToggleNotifications: () => void;
  canSwitchRoles?: boolean;
  availableViewRoles?: string[];
  viewRole?: string;
  onViewRoleChange?: (role: string) => void;
  children: ReactNode;
}

export default function RoleDashboardLayout({
  user,
  roleLabel,
  sidebarOpen,
  onToggleSidebar,
  sidebarItems,
  onLogout,
  notificationsOpen,
  onToggleNotifications,
  canSwitchRoles = false,
  availableViewRoles = [],
  viewRole = user.role,
  onViewRoleChange,
  children,
}: RoleDashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="header">
        <button
          type="button"
          className="toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          data-testid="button-sidebar-toggle"
        >
          ☰
        </button>
        <div className="logo"><span className="text-[18px] font-bold">GITAM</span></div>
        <div className="title">G-Scholar Hub</div>
        <span className="role-label">{roleLabel}</span>

        <button
          type="button"
          onClick={onToggleNotifications}
          aria-label="Toggle notifications"
          aria-expanded={notificationsOpen}
          data-testid="button-notifications"
          className="cursor-pointer border-none bg-transparent text-[20px] text-white"
        >
          🔔
        </button>

        {canSwitchRoles && (
          <select
            value={viewRole}
            onChange={(e) => onViewRoleChange?.(e.target.value)}
            className="ml-3 rounded border border-[#ccc] bg-white px-2 py-1 text-sm text-black"
          >
            {availableViewRoles.map((role) => (
              <option key={role} value={role}>
                View as {role.replace('_', ' ')}
              </option>
            ))}
          </select>
        )}

        <ActionButton
          variant="secondary"
          size="md"
          onClick={onLogout}
          className="ml-3"
          data-testid="button-logout"
          title="Logout"
        >
          ⏻
        </ActionButton>
      </header>

      <div className="flex flex-1">
        {sidebarOpen && (
          <aside className="w-[240px] border-r border-[#e6e6e6] bg-white p-4">
            <ul className="m-0 list-none p-0">
              {sidebarItems.map((item) => (
                <li key={item.route} className="mb-[10px]">
                  <button
                    type="button"
                    onClick={item.onClick}
                    className={`w-full rounded-md px-[10px] py-[10px] text-left ${item.isActive
                      ? "border-2 border-[#0b6a55] bg-[#e6f3ef] font-bold"
                      : "border border-[#ddd] bg-white font-medium"}`}
                    aria-current={item.isActive ? "page" : undefined}
                    data-testid={`nav-${item.route.replace(/\//g, "-")}`}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        )}

        <main className="flex-1 p-5">{children}</main>
      </div>
    </div>
  );
}
