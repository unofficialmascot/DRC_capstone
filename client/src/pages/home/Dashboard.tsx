import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ReviewerPage, ScholarPage, User } from "@/types/gscholar";
import ScholarApplicationFormPage from "@/pages/home/ScholarApplicationFormPage";
import ScholarApplicationsTracker from "@/pages/home/ScholarApplicationsTracker";
import ScholarDocHub from "@/pages/home/ScholarDocHub";
import ScholarFeeDetails from "@/pages/home/ScholarFeeDetails";
import ScholarNoticeBoard from "@/pages/home/ScholarNoticeBoard";
import ScholarProfile from "@/pages/home/ScholarProfile";
import ScholarResearchProgress from "@/pages/home/ScholarResearchProgress";
import ScholarThesisSubmission from "@/pages/home/ScholarThesisSubmission";
import ReviewerApplications from "@/pages/home/ReviewerApplications";
import ReviewerDashboard from "@/pages/home/ReviewerDashboard";
import SupervisorDashboard from "@/pages/home/SupervisorDashboard";

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
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
      case "scholar":
        return "Scholar";
      case "supervisor":
        return "Supervisor";
      case "drc":
        return "DRC Member";
      case "irc":
        return "IRC Member";
      case "doaa":
        return "DoAA Officer";
      default:
        return user.role;
    }
  };

  const renderScholarSidebar = () => (
    <ul>
      <li
        className={scholarPage === "profile" ? "active" : ""}
        onClick={() => setScholarPage("profile")}
        data-testid="nav-profile"
      >
        Profile
      </li>
      <li
        className={scholarPage === "application-supervisor" ? "active" : ""}
        onClick={() => setScholarPage("application-supervisor")}
        data-testid="nav-application-supervisor"
      >
        Change of Supervisor
      </li>
      <li
        className={scholarPage === "application-pretalk" ? "active" : ""}
        onClick={() => setScholarPage("application-pretalk")}
        data-testid="nav-application-pretalk"
      >
        Pre-talk Application
      </li>
      <li
        className={scholarPage === "application-extension" ? "active" : ""}
        onClick={() => setScholarPage("application-extension")}
        data-testid="nav-application-extension"
      >
        Extension Application
      </li>
      <li
        className={scholarPage === "application-reregistration" ? "active" : ""}
        onClick={() => setScholarPage("application-reregistration")}
        data-testid="nav-application-reregistration"
      >
        Re-Registration Application
      </li>
      <li
        className={scholarPage === "application-thesis" ? "active" : ""}
        onClick={() => setScholarPage("application-thesis")}
        data-testid="nav-application-thesis"
      >
        Thesis Submission
      </li>
      <li
        className={`red-button ${
          scholarPage === "application-track" ? "active" : ""
        }`}
        onClick={() => setScholarPage("application-track")}
        data-testid="nav-application-track"
      >
        Track My Application
      </li>
      <li
        className={scholarPage === "research" ? "active" : ""}
        onClick={() => setScholarPage("research")}
        data-testid="nav-research"
      >
        Research Progress
      </li>
      <li
        className={scholarPage === "fees" ? "active" : ""}
        onClick={() => setScholarPage("fees")}
        data-testid="nav-fees"
      >
        Fee Details
      </li>
      <li
        className={`red-button ${scholarPage === "dochub" ? "active" : ""}`}
        onClick={() => setScholarPage("dochub")}
        data-testid="nav-dochub"
      >
        Doc-Hub
      </li>
      <li
        className={scholarPage === "noticeboard" ? "active" : ""}
        onClick={() => setScholarPage("noticeboard")}
        data-testid="nav-noticeboard"
      >
        Notice Board
      </li>
    </ul>
  );

  const renderReviewerSidebar = () => (
    <ul>
      <li
        className={reviewerPage === "dashboard" ? "active" : ""}
        onClick={() => setReviewerPage("dashboard")}
        data-testid="nav-reviewer-dashboard"
      >
        {user.role.toUpperCase()} Dashboard
      </li>
      <li
        className={`red-button ${reviewerPage === "reviews" ? "active" : ""}`}
        onClick={() => setReviewerPage("reviews")}
        data-testid="nav-reviewer-reviews"
      >
        Pending Reviews
      </li>
    </ul>
  );

  const renderContent = () => {
    if (user.role === "scholar") {
      switch (scholarPage) {
        case "profile":
          return <ScholarProfile user={user} />;
        case "application-supervisor":
          return (
            <ScholarApplicationFormPage
              user={user}
              formType="supervisor"
              onBack={() => setScholarPage("application-track")}
            />
          );
        case "application-pretalk":
          return (
            <ScholarApplicationFormPage
              user={user}
              formType="pretalk"
              onBack={() => setScholarPage("application-track")}
            />
          );
        case "application-extension":
          return (
            <ScholarApplicationFormPage
              user={user}
              formType="extension"
              onBack={() => setScholarPage("application-track")}
            />
          );
        case "application-reregistration":
          return (
            <ScholarApplicationFormPage
              user={user}
              formType="reregistration"
              onBack={() => setScholarPage("application-track")}
            />
          );
        case "application-thesis":
          return <ScholarThesisSubmission />;
        case "application-track":
          return <ScholarApplicationsTracker user={user} />;
        case "research":
          return <ScholarResearchProgress userId={user.id} />;
        case "fees":
          return <ScholarFeeDetails />;
        case "dochub":
          return <ScholarDocHub />;
        case "noticeboard":
          return <ScholarNoticeBoard />;
        default:
          return <ScholarProfile user={user} />;
      }
    }
    if (user.role === "supervisor") {
      return <SupervisorDashboard user={user} />;
    }
    switch (reviewerPage) {
      case "dashboard":
        return <ReviewerDashboard role={user.role} />;
      case "reviews":
        return <ReviewerApplications user={user} />;
      default:
        return <ReviewerDashboard role={user.role} />;
    }
  };

  return (
    <div className="dashboard-shell">
      <header className="header">
        <button
          className="toggle-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          data-testid="button-sidebar-toggle"
        >
          ☰
        </button>
        <div className="logo">
          <span className="header-logo-text">GITAM</span>
        </div>
        <div className="title">G-Scholar Hub</div>
        <span className="role-label">{getRoleLabel()}</span>
        <div className="profile-menu">
          <button
            type="button"
            className="profile-icon"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            data-testid="button-profile-menu"
          ></button>
          {profileDropdownOpen && (
            <div className="profile-dropdown">
              <div className="profile-dropdown-header">
                <div className="profile-dropdown-name">{user.name}</div>
                <div className="profile-dropdown-email">{user.email}</div>
              </div>
              <button onClick={handleLogout} data-testid="button-logout">
                Logout
              </button>
            </div>
          )}
        </div>
      </header>
      <div className="layout">
        <nav className={`sidebar ${!sidebarOpen ? "collapsed" : ""}`}>
          {user.role === "scholar" && renderScholarSidebar()}
          {user.role === "supervisor" && (
            <ul>
              <li className="active">Supervisor Dashboard</li>
            </ul>
          )}
          {(user.role === "drc" || user.role === "irc" || user.role === "doaa") &&
            renderReviewerSidebar()}
        </nav>
        <main className="content">{renderContent()}</main>
      </div>
    </div>
  );
}
