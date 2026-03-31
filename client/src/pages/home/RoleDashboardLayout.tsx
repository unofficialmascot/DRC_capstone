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
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
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
        <div className="logo"><span style={{ fontWeight: "bold", fontSize: "18px" }}>GITAM</span></div>
        <div className="title">G-Scholar Hub</div>
        <span className="role-label">{roleLabel}</span>

        <button
          type="button"
          onClick={onToggleNotifications}
          aria-label="Toggle notifications"
          aria-expanded={notificationsOpen}
          data-testid="button-notifications"
          style={{ border: "none", background: "transparent", color: "#fff", fontSize: "20px", cursor: "pointer" }}
        >
          🔔
        </button>

        {canSwitchRoles && (
          <select
            value={viewRole}
            onChange={(e) => onViewRoleChange?.(e.target.value)}
            style={{
              marginLeft: "12px",
              padding: "4px 8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              background: "#fff",
              color: "#000",
              fontSize: "14px",
            }}
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
          style={{ marginLeft: "12px" }}
          data-testid="button-logout"
        >
          Logout
        </ActionButton>
      </header>

      <div style={{ flex: 1, display: "flex" }}>
        {sidebarOpen && (
          <aside style={{ width: "240px", background: "#fff", borderRight: "1px solid #e6e6e6", padding: "16px" }}>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {sidebarItems.map((item) => (
                <li key={item.route} style={{ marginBottom: "10px" }}>
                  <button
                    type="button"
                    onClick={item.onClick}
                    className={item.isActive ? "active" : ""}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: item.isActive ? "2px solid #0b6a55" : "1px solid #ddd",
                      background: item.isActive ? "#e6f3ef" : "#fff",
                      cursor: "pointer",
                      textAlign: "left",
                      fontWeight: item.isActive ? 700 : 500,
                    }}
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

        <main style={{ flex: 1, padding: "20px" }}>{children}</main>
      </div>
    </div>
  );
}
