import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { PublicUser } from "@/lib/types";
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
import SupervisorDashboard from "@/pages/supervisor/SupervisorDashboard";

type ScholarPage = "profile" | "applications" | "research" | "fees" | "dochub" | "noticeboard";
type ReviewerPage = "dashboard" | "reviews" | "meetings" | "minutes";

export default function HomeDashboard({ user, onLogout }: { user: PublicUser; onLogout: () => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [scholarPage, setScholarPage] = useState<ScholarPage>("profile");
  const [reviewerPage, setReviewerPage] = useState<ReviewerPage>("dashboard");
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    queryClient.clear();
    onLogout();
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
      <li className={scholarPage === "profile" ? "active" : ""} onClick={() => setScholarPage("profile")} data-testid="nav-profile">Profile</li>
      <li className={`red-button ${scholarPage === "applications" ? "active" : ""}`} onClick={() => setScholarPage("applications")} data-testid="nav-applications">Applications</li>
      <li className={scholarPage === "research" ? "active" : ""} onClick={() => setScholarPage("research")} data-testid="nav-research">Research Progress</li>
      <li className={scholarPage === "fees" ? "active" : ""} onClick={() => setScholarPage("fees")} data-testid="nav-fees">Fee Details</li>
      <li className={`red-button ${scholarPage === "dochub" ? "active" : ""}`} onClick={() => setScholarPage("dochub")} data-testid="nav-dochub">Doc-Hub</li>
      <li className={scholarPage === "noticeboard" ? "active" : ""} onClick={() => setScholarPage("noticeboard")} data-testid="nav-noticeboard">Notice Board</li>
    </ul>
  );

  const renderReviewerSidebar = () => (
    <ul>
      <li className={reviewerPage === "dashboard" ? "active" : ""} onClick={() => setReviewerPage("dashboard")} data-testid="nav-reviewer-dashboard">
        {user.role === "drc_convener"
          ? "DRC Convener Dashboard"
          : user.role === "drc_chairman"
            ? "DRC Chairman Dashboard"
            : `${user.role?.toUpperCase()} Dashboard`}
      </li>
      {(user.role === "drc" || user.role === "irc" || user.role === "doaa") && (
        <li className={`red-button ${reviewerPage === "reviews" ? "active" : ""}`} onClick={() => setReviewerPage("reviews")} data-testid="nav-reviewer-reviews">Pending Reviews</li>
      )}
      {user.role === "drc_convener" && (
        <li className={`red-button ${reviewerPage === "reviews" ? "active" : ""}`} onClick={() => setReviewerPage("reviews")} data-testid="nav-reviewer-reviews">Meeting Agenda</li>
      )}
      {user.role === "drc" && <li className={`red-button ${reviewerPage === "meetings" ? "active" : ""}`} onClick={() => setReviewerPage("meetings")} data-testid="nav-reviewer-meetings">Meetings</li>}
      {user.role === "drc_chairman" && <li className={`red-button ${reviewerPage === "minutes" ? "active" : ""}`} onClick={() => setReviewerPage("minutes")} data-testid="nav-reviewer-minutes">Minutes</li>}
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
    } else {
      switch (reviewerPage) {
        case "dashboard": return <ReviewerDashboard role={user.role} />;
        case "reviews": return <ReviewerApplications user={user} />;
        case "meetings": return <ReviewerMeetings role={user.role} />;
        case "minutes": return <ChairmanMinutes />;
        default: return <ReviewerDashboard role={user.role} />;
      }
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="header">
        <button type="button" className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)} data-testid="button-sidebar-toggle">☰</button>
        <div className="logo"><span style={{ fontWeight: "bold", fontSize: "18px" }}>GITAM</span></div>
        <div className="title">G-Scholar Hub</div>
        <span className="role-label">{getRoleLabel()}</span>
        <div className="profile-menu">
          <div className="profile-icon" onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} data-testid="button-profile-menu"></div>
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
          {user.role === "supervisor" && <ul><li className="active">Supervisor Dashboard</li></ul>}
          {(user.role === "drc" || user.role === "drc_convener" || user.role === "drc_chairman" || user.role === "irc" || user.role === "doaa") && renderReviewerSidebar()}
        </nav>
        <main className="content">{renderContent()}</main>
      </div>
    </div>
  );
}
