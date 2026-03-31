import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { api } from "@shared/routes";
import type { PublicUser } from "@/lib/types";
import { useClearNotification, useClearNotifications, useNotifications } from "@/hooks/use-notifications";
import ScholarProfile from "@/pages/scholar/ScholarProfile";
import ScholarApplications from "@/pages/scholar/ScholarApplications";
import ScholarResearchProgress from "@/pages/scholar/ScholarResearchProgress";
import ScholarFeeDetails from "@/pages/scholar/ScholarFeeDetails";
import ScholarDocHub from "@/pages/scholar/ScholarDocHub";
import ScholarNoticeBoard from "@/pages/scholar/ScholarNoticeBoard";
import ReviewerDashboard from "@/pages/reviewer/ReviewerDashboard";
import ReviewerApplications from "@/pages/reviewer/ReviewerApplications";
import ReviewerMeetings from "@/pages/reviewer/ReviewerMeetings";
import ChairmanMinutes from "@/pages/reviewer/ChairmanMinutes";
import ChairmanDashboard from "@/pages/reviewer/ChairmanDashboard";
import SupervisorDashboard from "@/pages/supervisor/SupervisorDashboard";
import RoleDashboardLayout from "./RoleDashboardLayout";
import { getRoleConfig, getRoleLabel } from "./role-config";

const scholarPageBySegment: Record<string, string> = {
  profile: "profile",
  applications: "applications",
  research: "research",
  fees: "fees",
  dochub: "dochub",
  noticeboard: "noticeboard",
};

const reviewerPageBySegment: Record<string, string> = {
  dashboard: "dashboard",
  reviews: "reviews",
  meetings: "meetings",
};

const chairmanSectionBySegment: Record<string, string> = {
  dashboard: "dashboard",
  "rac-reviews": "rac_reviews",
  profile: "profile",
  minutes: "minutes",
  extensions: "extensions",
};

const supervisorSectionBySegment: Record<string, string> = {
  dashboard: "dashboard",
  profile: "profile",
  "rac-reviews": "rac-reviews",
  "application-requests": "application-requests",
  biometric: "biometric",
  "help-support": "help-support",
};

export default function HomeDashboard({ user, onLogout }: { user: PublicUser; onLogout: () => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [clearingNoticeId, setClearingNoticeId] = useState<number | null>(null);
  const [viewRole, setViewRole] = useState<string>(user.role);
  const [location, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const canViewNotifications = true;
  const {
    data: notifications = [],
    isLoading: isNotificationsLoading,
    isError: isNotificationsError,
    refetch: refetchNotifications,
  } = useNotifications(canViewNotifications);
  const clearNotificationsMutation = useClearNotifications();
  const clearNotificationMutation = useClearNotification();

  const normalizedPath = useMemo(() => {
    const pathOnly = location.split("?")[0].replace(/\/+$/, "");
    return pathOnly || "/";
  }, [location]);

  const pathSegments = normalizedPath.split("/").filter(Boolean);
  const segment = pathSegments[1] || "";
  const scholarPage = scholarPageBySegment[segment] || "profile";
  const reviewerPage = reviewerPageBySegment[segment] || "dashboard";
  const chairmanSection = chairmanSectionBySegment[segment] || "dashboard";
  const supervisorSection = supervisorSectionBySegment[segment] || "dashboard";

  const roleConfig = getRoleConfig(user.role);

  const canSwitchRoles = user.role === 'supervisor' || user.role === 'drc_chairman' || user.role === 'drc';
  const availableViewRoles = canSwitchRoles ? (
    user.role === 'supervisor' ? ['supervisor', 'drc', 'drc_convener'] :
    user.role === 'drc_chairman' ? ['drc_chairman', 'drc'] :
    user.role === 'drc' ? ['drc', 'supervisor', 'drc_convener'] :
    [user.role]
  ) : [user.role];

  const viewRoleConfig = getRoleConfig(viewRole);

  useEffect(() => {
    const defaultPath = viewRoleConfig.defaultPath;

    if (normalizedPath === "/") {
      navigate(defaultPath);
      return;
    }

    if (!viewRoleConfig.validPaths.includes(normalizedPath)) {
      navigate(defaultPath);
    }
  }, [navigate, normalizedPath, viewRoleConfig]);

  useEffect(() => {
    if (!notificationsOpen) return;

    const onDocumentClick = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) return;
      setNotificationsOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNotificationsOpen(false);
    };

    document.addEventListener("mousedown", onDocumentClick);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onDocumentClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [notificationsOpen]);

  const handleLogout = async () => {
    try {
      const response = await fetch(api.auth.logout.path, {
        method: api.auth.logout.method,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to logout");
      }

      api.auth.logout.responses[200].parse(await response.json());
      queryClient.clear();
      onLogout();
      toast({ title: "Success", description: "Logged out successfully." });
    } catch (error: unknown) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to logout", variant: "destructive" });
    }
  };

  const sidebarItems = viewRoleConfig.sidebarItems.map((item) => ({
    ...item,
    isActive: normalizedPath === item.route,
    onClick: () => {
      setProfileDropdownOpen(false);
      setNotificationsOpen(false);
      navigate(item.route);
    },
  }));

  const renderContent = () => {
    if (viewRole === "scholar") {
      switch (scholarPage) {
        case "profile":
          return <ScholarProfile user={user} />;
        case "applications":
          return <ScholarApplications user={user} />;
        case "research":
          return <ScholarResearchProgress userId={user.id} />;
        case "fees":
          return <ScholarFeeDetails />;
        case "dochub":
          return <ScholarDocHub scholarId={user.scholarId || ""} />;
        case "noticeboard":
          return <ScholarNoticeBoard />;
        default:
          return <ScholarProfile user={user} />;
      }
    }

    if (viewRole === "supervisor") {
      return <SupervisorDashboard user={user} activeSection={supervisorSection as any} />;
    }

    if (viewRole === "drc_chairman") {
      if (chairmanSection === "minutes") {
        return <ChairmanMinutes />;
      }
      return <ChairmanDashboard user={user} activeSection={chairmanSection as any} />;
    }

    if (viewRole === "drc") {
      switch (reviewerPage) {
        case "dashboard":
          return <ReviewerDashboard role={viewRole} />;
        case "meetings":
          return <ReviewerMeetings role={viewRole} />;
        default:
          return <ReviewerDashboard role={viewRole} />;
      }
    }

    if (viewRole === "drc_convener" || viewRole === "irc" || viewRole === "doaa" || viewRole === "admin") {
      switch (reviewerPage) {
        case "dashboard":
          return <ReviewerDashboard role={viewRole} />;
        case "reviews":
          return <ReviewerApplications user={user} />;
        default:
          return <ReviewerDashboard role={viewRole} />;
      }
    }

    return <div>Please contact administrator for access rights.</div>;
  };

  return (
    <RoleDashboardLayout
      user={user}
      roleLabel={getRoleLabel(viewRole)}
      sidebarOpen={sidebarOpen}
      onToggleSidebar={() => setSidebarOpen((open) => !open)}
      sidebarItems={sidebarItems}
      onLogout={handleLogout}
      notificationsOpen={notificationsOpen}
      onToggleNotifications={() => {
        setNotificationsOpen((open) => !open);
        setProfileDropdownOpen(false);
      }}
      canSwitchRoles={canSwitchRoles}
      availableViewRoles={availableViewRoles}
      viewRole={viewRole}
      onViewRoleChange={setViewRole}
    >
      {renderContent()}
    </RoleDashboardLayout>
  );
}
