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
import ChairmanDashboard, { type ChairmanSection } from "@/pages/reviewer/ChairmanDashboard";
import SupervisorDashboard from "@/pages/supervisor/SupervisorDashboard";

type ScholarPage = "profile" | "applications" | "research" | "fees" | "dochub" | "noticeboard";
type ReviewerPage = "dashboard" | "reviews" | "meetings";
type ChairmanSidebarSection = ChairmanSection | "minutes";

const scholarPageBySegment: Record<string, ScholarPage> = {
  profile: "profile",
  applications: "applications",
  research: "research",
  fees: "fees",
  dochub: "dochub",
  noticeboard: "noticeboard",
};

const reviewerPageBySegment: Record<string, ReviewerPage> = {
  dashboard: "dashboard",
  reviews: "reviews",
  meetings: "meetings",
};

const chairmanSectionBySegment: Record<string, ChairmanSidebarSection> = {
  dashboard: "dashboard",
  "rac-reviews": "rac_reviews",
  profile: "profile",
  minutes: "minutes",
  extensions: "extensions",
};

function getDefaultPathForRole(role: string): string {
  if (role === "scholar") {
    return "/scholar/profile";
  }
  if (role === "supervisor") {
    return "/supervisor/dashboard";
  }
  if (role === "drc_chairman") {
    return "/chairman/dashboard";
  }
  return "/reviewer/dashboard";
}

function getNotificationsLandingPath(role: string): string {
  if (role === "scholar") {
    return "/scholar/noticeboard";
  }

  if (role === "supervisor") {
    return "/supervisor/dashboard";
  }

  if (role === "drc_chairman") {
    return "/chairman/minutes";
  }

  if (role === "drc") {
    return "/reviewer/meetings";
  }

  if (role === "drc_convener" || role === "irc" || role === "doaa") {
    return "/reviewer/reviews";
  }

  return getDefaultPathForRole(role);
}

function getNotificationTypeLabel(type: string | null | undefined): string {
  if (!type || type === "general") {
    return "General";
  }

  if (type === "drc_meeting_scheduled") {
    return "DRC Meeting";
  }

  if (type === "review_decision") {
    return "Decision";
  }

  if (type === "review_pending") {
    return "Action Required";
  }

  if (type === "minutes_generated") {
    return "Minutes";
  }

  if (type === "chairman_decision") {
    return "Chairman";
  }

  return "Update";
}

function formatRelativeTime(value: unknown): string {
  if (!value) {
    return "Just now";
  }

  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    return "Just now";
  }

  const diffMs = Date.now() - parsed.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) {
    return "Just now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }

  return parsed.toLocaleDateString();
}

function isValidPathForRole(role: string, path: string): boolean {
  const segments = path.split("/").filter(Boolean);
  const [scope, section] = segments;

  if (!scope || !section) {
    return false;
  }

  if (role === "scholar") {
    return scope === "scholar" && Boolean(scholarPageBySegment[section]);
  }

  if (role === "supervisor") {
    return scope === "supervisor" && section === "dashboard";
  }

  if (role === "drc_chairman") {
    return scope === "chairman" && Boolean(chairmanSectionBySegment[section]);
  }

  if (role === "drc") {
    return scope === "reviewer" && Boolean(reviewerPageBySegment[section]);
  }

  if (role === "drc_convener" || role === "irc" || role === "doaa") {
    return scope === "reviewer" && (section === "dashboard" || section === "reviews");
  }

  return path === "/reviewer/dashboard";
}

export default function HomeDashboard({ user, onLogout }: { user: PublicUser; onLogout: () => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const [location, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [clearingNoticeId, setClearingNoticeId] = useState<number | null>(null);
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
  const notificationsLandingPath = getNotificationsLandingPath(user.role);

  const goScholarPage = (page: ScholarPage) => {
    navigate(`/scholar/${page}`);
  };

  const goReviewerPage = (page: ReviewerPage) => {
    navigate(`/reviewer/${page}`);
  };

  const goChairmanSection = (sectionName: ChairmanSidebarSection) => {
    if (sectionName === "rac_reviews") {
      navigate("/chairman/rac-reviews");
      return;
    }
    navigate(`/chairman/${sectionName}`);
  };

  useEffect(() => {
    const defaultPath = getDefaultPathForRole(user.role);

    if (normalizedPath === "/") {
      navigate(defaultPath);
      return;
    }

    if (!isValidPathForRole(user.role, normalizedPath)) {
      navigate(defaultPath);
    }
  }, [navigate, normalizedPath, user.role]);

  useEffect(() => {
    if (!notificationsOpen) {
      return;
    }

    const onDocumentClick = (event: MouseEvent) => {
      if (!notificationsRef.current) {
        return;
      }

      if (!notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
      }
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
      toast({
        title: "Success",
        description: "Logged out successfully.",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to logout",
        variant: "destructive",
      });
    }
  };

  const getRoleLabel = () => {
    switch (user.role) {
      case "scholar": return "Scholar";
      case "supervisor": return "Supervisor";
      case "drc": return "DRC Member";
      case "drc_convener": return "DRC Convener";
      case "drc_chairman": return "DRC Chairman";
      case "irc": return "IRC Member";
      case "doaa": return "DoAA Officer";
      default: return user.role;
    }
  };

  const renderScholarSidebar = () => (
    <ul>
      <li className={scholarPage === "profile" ? "active" : ""}>
        <button type="button" onClick={() => goScholarPage("profile")} aria-current={scholarPage === "profile" ? "page" : undefined} data-testid="nav-profile">Profile</button>
      </li>
      <li className={`red-button ${scholarPage === "applications" ? "active" : ""}`}>
        <button type="button" onClick={() => goScholarPage("applications")} aria-current={scholarPage === "applications" ? "page" : undefined} data-testid="nav-applications">Applications</button>
      </li>
      <li className={scholarPage === "research" ? "active" : ""}>
        <button type="button" onClick={() => goScholarPage("research")} aria-current={scholarPage === "research" ? "page" : undefined} data-testid="nav-research">Research Progress</button>
      </li>
      <li className={scholarPage === "fees" ? "active" : ""}>
        <button type="button" onClick={() => goScholarPage("fees")} aria-current={scholarPage === "fees" ? "page" : undefined} data-testid="nav-fees">Fee Details</button>
      </li>
      <li className={`red-button ${scholarPage === "dochub" ? "active" : ""}`}>
        <button type="button" onClick={() => goScholarPage("dochub")} aria-current={scholarPage === "dochub" ? "page" : undefined} data-testid="nav-dochub">Doc-Hub</button>
      </li>
      <li className={scholarPage === "noticeboard" ? "active" : ""}>
        <button type="button" onClick={() => goScholarPage("noticeboard")} aria-current={scholarPage === "noticeboard" ? "page" : undefined} data-testid="nav-noticeboard">Notice Board</button>
      </li>
    </ul>
  );

  const renderReviewerSidebar = () => (
    <ul>
      {user.role === "drc_chairman" ? (
        <>
          <li className={chairmanSection === "dashboard" ? "active" : ""}>
            <button type="button" onClick={() => goChairmanSection("dashboard")} aria-current={chairmanSection === "dashboard" ? "page" : undefined} data-testid="nav-reviewer-chairman-dashboard">Dashboard</button>
          </li>
          <li className={`red-button ${chairmanSection === "rac_reviews" ? "active" : ""}`}>
            <button type="button" onClick={() => goChairmanSection("rac_reviews")} aria-current={chairmanSection === "rac_reviews" ? "page" : undefined} data-testid="nav-reviewer-chairman-rac-reviews">RAC Reviews</button>
          </li>
          <li className={chairmanSection === "profile" ? "active" : ""}>
            <button type="button" onClick={() => goChairmanSection("profile")} aria-current={chairmanSection === "profile" ? "page" : undefined} data-testid="nav-reviewer-chairman-profile">Profile</button>
          </li>
          <li className={chairmanSection === "extensions" ? "active" : ""}>
            <button type="button" onClick={() => goChairmanSection("extensions")} aria-current={chairmanSection === "extensions" ? "page" : undefined} data-testid="nav-reviewer-chairman-extensions">Extensions</button>
          </li>
          <li className={`red-button ${chairmanSection === "minutes" ? "active" : ""}`}>
            <button type="button" onClick={() => goChairmanSection("minutes")} aria-current={chairmanSection === "minutes" ? "page" : undefined} data-testid="nav-reviewer-chairman-minutes">Minutes</button>
          </li>
        </>
      ) : (
        <li className={reviewerPage === "dashboard" ? "active" : ""}>
          <button type="button" onClick={() => goReviewerPage("dashboard")} aria-current={reviewerPage === "dashboard" ? "page" : undefined} data-testid="nav-reviewer-dashboard">
            {user.role === "drc_convener"
              ? "DRC Convener Dashboard"
              : `${user.role?.toUpperCase()} Dashboard`}
          </button>
        </li>
      )}
      {(user.role === "drc" || user.role === "irc" || user.role === "doaa") && (
        <li className={`red-button ${reviewerPage === "reviews" ? "active" : ""}`}>
          <button type="button" onClick={() => goReviewerPage("reviews")} aria-current={reviewerPage === "reviews" ? "page" : undefined} data-testid="nav-reviewer-reviews">Pending Reviews</button>
        </li>
      )}
      {user.role === "drc_convener" && (
        <li className={`red-button ${reviewerPage === "reviews" ? "active" : ""}`}>
          <button type="button" onClick={() => goReviewerPage("reviews")} aria-current={reviewerPage === "reviews" ? "page" : undefined} data-testid="nav-reviewer-reviews">Meeting Agenda</button>
        </li>
      )}
      {user.role === "drc" && (
        <li className={`red-button ${reviewerPage === "meetings" ? "active" : ""}`}>
          <button type="button" onClick={() => goReviewerPage("meetings")} aria-current={reviewerPage === "meetings" ? "page" : undefined} data-testid="nav-reviewer-meetings">Meetings</button>
        </li>
      )}
    </ul>
  );

  const renderContent = () => {
    if (user.role === "scholar") {
      switch (scholarPage) {
        case "profile": return <ScholarProfile user={user} />;
        case "applications": return <ScholarApplications user={user} />;
        case "research": return <ScholarResearchProgress userId={user.id} />;
        case "fees": return <ScholarFeeDetails />;
        case "dochub": return <ScholarDocHub scholarId={user.scholarId || ""} />;
        case "noticeboard": return <ScholarNoticeBoard />;
        default: return <ScholarProfile user={user} />;
      }
    } else if (user.role === "supervisor") {
      return <SupervisorDashboard user={user} />;
    } else if (user.role === "drc_chairman") {
      switch (chairmanSection) {
        case "minutes": return <ChairmanMinutes />;
        case "dashboard":
        case "rac_reviews":
        case "profile":
        case "extensions":
          return <ChairmanDashboard user={user} activeSection={chairmanSection} />;
        default:
          return <ChairmanDashboard user={user} activeSection="dashboard" />;
      }
    } else {
      switch (reviewerPage) {
        case "dashboard": return <ReviewerDashboard role={user.role} />;
        case "reviews": return <ReviewerApplications user={user} />;
        case "meetings": return <ReviewerMeetings role={user.role} />;
        default: return <ReviewerDashboard role={user.role} />;
      }
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="header">
        <button type="button" className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle sidebar" data-testid="button-sidebar-toggle">☰</button>
        <div className="logo"><span style={{ fontWeight: "bold", fontSize: "18px" }}>GITAM</span></div>
        <div className="title">G-Scholar Hub</div>
        <span className="role-label">{getRoleLabel()}</span>

        <div ref={notificationsRef} style={{ position: "relative", marginRight: "10px" }}>
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen((current) => !current);
              setProfileDropdownOpen(false);
            }}
            aria-label="Toggle notifications"
            aria-expanded={notificationsOpen}
            data-testid="button-notifications"
            style={{
              border: "none",
              background: "transparent",
              color: "#fff",
              fontSize: "20px",
              cursor: "pointer",
              position: "relative",
              padding: "6px",
            }}
          >
            🔔
            {notifications.length > 0 && (
              <span
                aria-label={`${notifications.length} notifications`}
                style={{
                  position: "absolute",
                  top: "0px",
                  right: "0px",
                  minWidth: "18px",
                  height: "18px",
                  borderRadius: "999px",
                  background: "#e74c3c",
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 4px",
                }}
              >
                {notifications.length}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "40px",
                width: "min(360px, 92vw)",
                maxHeight: "360px",
                overflowY: "auto",
                background: "#fff",
                borderRadius: "10px",
                border: "1px solid #e6e6e6",
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                zIndex: 50,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", borderBottom: "1px solid #eee" }}>
                <strong style={{ color: "#0b6a55", fontSize: "14px" }}>Notifications</strong>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => refetchNotifications()}
                    style={{ border: "none", background: "transparent", color: "#0b6a55", cursor: "pointer", fontWeight: 600 }}
                    data-testid="button-refresh-notifications"
                  >
                    Refresh
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const result = await clearNotificationsMutation.mutateAsync();
                        toast({
                          title: "Notifications cleared",
                          description: result.cleared > 0 ? `${result.cleared} notification(s) cleared.` : "No notifications to clear.",
                        });
                      } catch (error: unknown) {
                        toast({
                          title: "Unable to clear notifications",
                          description: error instanceof Error ? error.message : "Please try again.",
                          variant: "destructive",
                        });
                      }
                    }}
                    disabled={!canViewNotifications || clearNotificationsMutation.isPending || notifications.length === 0}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: notifications.length === 0 ? "#9ca3af" : "#0b6a55",
                      cursor: notifications.length === 0 ? "not-allowed" : "pointer",
                      fontWeight: 600,
                    }}
                    data-testid="button-clear-notifications"
                  >
                    {clearNotificationsMutation.isPending ? "Clearing..." : "Clear all"}
                  </button>
                </div>
              </div>

              {!canViewNotifications ? (
                <div style={{ padding: "12px", fontSize: "13px", color: "#666" }}>No notifications available for this role.</div>
              ) : isNotificationsLoading ? (
                <div style={{ padding: "12px", fontSize: "13px", color: "#666" }}>Loading notifications...</div>
              ) : isNotificationsError ? (
                <div style={{ padding: "12px", fontSize: "13px", color: "#c0392b" }}>Failed to load notifications.</div>
              ) : notifications.length === 0 ? (
                <div style={{ padding: "12px", fontSize: "13px", color: "#666" }}>No recent notifications.</div>
              ) : (
                notifications.map((notice) => (
                  <div key={notice.id} style={{ padding: "12px", borderBottom: "1px solid #f1f1f1" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", marginBottom: "6px" }}>
                      <strong
                        style={{
                          fontSize: "13px",
                          color: "#1f2937",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "220px",
                        }}
                        title={notice.title}
                      >
                        {notice.title}
                      </strong>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase" }}>
                          {getNotificationTypeLabel(notice.notificationType)}
                        </span>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              setClearingNoticeId(notice.id);
                              const result = await clearNotificationMutation.mutateAsync(notice.id);
                              if (!result.cleared) {
                                toast({
                                  title: "Notification already cleared",
                                  description: "This notification is no longer active.",
                                });
                              }
                            } catch (error: unknown) {
                              toast({
                                title: "Unable to clear notification",
                                description: error instanceof Error ? error.message : "Please try again.",
                                variant: "destructive",
                              });
                            } finally {
                              setClearingNoticeId(null);
                            }
                          }}
                          disabled={clearNotificationMutation.isPending && clearingNoticeId === notice.id}
                          style={{
                            border: "none",
                            background: "transparent",
                            color: "#9ca3af",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: 700,
                            lineHeight: 1,
                          }}
                          aria-label={`Clear notification ${notice.id}`}
                          data-testid={`button-clear-notification-${notice.id}`}
                        >
                          {clearNotificationMutation.isPending && clearingNoticeId === notice.id ? "..." : "x"}
                        </button>
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#4b5563",
                        marginBottom: "4px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                      title={notice.content}
                    >
                      {notice.content}
                    </div>
                    <div style={{ fontSize: "11px", color: "#9ca3af" }}>
                      {formatRelativeTime(notice.date)}
                      <span style={{ marginLeft: "8px" }}>{new Date(String(notice.date)).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}

              <div style={{ padding: "10px 12px", borderTop: "1px solid #eee", background: "#fafafa" }}>
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsOpen(false);
                    navigate(notificationsLandingPath);
                  }}
                  style={{
                    width: "100%",
                    border: "1px solid #d9d9d9",
                    background: "#fff",
                    color: "#0b6a55",
                    borderRadius: "6px",
                    padding: "8px 10px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  data-testid="button-view-all-notifications"
                >
                  View All
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="profile-menu">
          <button
            type="button"
            className="profile-icon"
            onClick={() => {
              setProfileDropdownOpen((current) => !current);
              setNotificationsOpen(false);
            }}
            aria-label="Toggle profile menu"
            aria-expanded={profileDropdownOpen}
            data-testid="button-profile-menu"
            style={{ border: "none", backgroundColor: "transparent", cursor: "pointer" }}
          ></button>
          {profileDropdownOpen && (
            <div className="profile-dropdown">
              <div style={{ padding: "10px 15px", borderBottom: "1px solid #eee" }}>
                <div style={{ fontWeight: "600" }}>{user.name}</div>
                <div style={{ fontSize: "12px", color: "#666" }}>{user.email}</div>
              </div>
              <button onClick={handleLogout} data-testid="button-logout">Logout</button>
            </div>
          )}
        </div>
      </header>
      <div className="layout">
        <nav className={`sidebar ${!sidebarOpen ? "collapsed" : ""}`}>
          {user.role === "scholar" && renderScholarSidebar()}
          {user.role === "supervisor" && (
            <ul>
              <li className="active">
                <button type="button" onClick={() => navigate("/supervisor/dashboard")} aria-current="page">Supervisor Dashboard</button>
              </li>
            </ul>
          )}
          {(user.role === "drc" || user.role === "drc_convener" || user.role === "drc_chairman" || user.role === "irc" || user.role === "doaa") && renderReviewerSidebar()}
        </nav>
        <main className="content">{renderContent()}</main>
      </div>
    </div>
  );
}
