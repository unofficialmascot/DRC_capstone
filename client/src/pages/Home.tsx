import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import "../styles/gscholar.css";

type ScholarPage = "profile" | "applications" | "research" | "fees" | "dochub" | "noticeboard";
type ReviewerPage = "dashboard" | "reviews" | "applications";

interface User {
  id: number;
  username: string;
  role: string;
  name: string;
  email: string;
  phone?: string;
  scholarId?: string;
  location?: string;
  batch?: string;
  status?: string;
  department?: string;
  supervisor?: string;
  coSupervisor?: string;
  researchArea?: string;
  researchTitle?: string;
  joiningDate?: string;
  phase?: string;
  programme?: string;
  fatherName?: string;
  parentMobile?: string;
  nationality?: string;
  address?: string;
}

interface Application {
  id: number;
  scholarId: number;
  type: string;
  status: string;
  currentStage: string;
  submissionDate: string;
  details: Record<string, unknown>;
  finalOutcome: string | null;
}

interface ApplicationReview {
  id: number;
  applicationId: number;
  reviewerId: number;
  stage: string;
  decision: string;
  remarks: string;
  reviewDate: string;
}

interface ApplicationEnclosure {
  name: string;
  contentType: "application/pdf";
  dataUrl: string;
  uploadedAt?: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setUser(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>Loading...</div>;
  }

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  return <Dashboard user={user} onLogout={() => setUser(null)} />;
}

function LoginPage({ onLogin }: { onLogin: (user: User) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Login failed");
      }

      const user = await res.json();
      onLogin(user);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", display: "flex", flexDirection: "column" }}>
      <header className="header">
        <div className="logo"><span style={{ fontWeight: "bold", fontSize: "18px" }}>GITAM</span></div>
        <div className="title">G-Scholar Hub</div>
      </header>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ background: "#fff", borderRadius: "12px", padding: "40px", width: "100%", maxWidth: "400px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
          <h2 style={{ textAlign: "center", color: "#0b6a55", marginBottom: "30px" }}>Login to G-Scholar Hub</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" required data-testid="input-username" />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" required data-testid="input-password" />
            </div>
            {error && <div style={{ color: "#e74c3c", marginBottom: "15px", textAlign: "center" }}>{error}</div>}
            <button className="submit-btn" type="submit" disabled={isSubmitting} style={{ width: "100%" }} data-testid="button-login">
              {isSubmitting ? "Logging in..." : "Login"}
            </button>
          </form>
          <div style={{ marginTop: "30px", padding: "20px", background: "#f8f9fa", borderRadius: "8px" }}>
            <h4 style={{ color: "#0b6a55", marginBottom: "10px" }}>Demo Accounts</h4>
            <div style={{ fontSize: "13px", color: "#666" }}>
              <div style={{ marginBottom: "5px" }}><strong>scholar1</strong> / password123 - Scholar</div>
              <div style={{ marginBottom: "5px" }}><strong>scholar2</strong> / password123 - Scholar</div>
              <div style={{ marginBottom: "5px" }}><strong>supervisor1</strong> / password123 - Supervisor</div>
              <div style={{ marginBottom: "5px" }}><strong>drc1</strong> / password123 - DRC Member</div>
              <div style={{ marginBottom: "5px" }}><strong>irc1</strong> / password123 - IRC Member</div>
              <div><strong>doaa1</strong> / password123 - DoAA Officer</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
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
      <li className={reviewerPage === "dashboard" ? "active" : ""} onClick={() => setReviewerPage("dashboard")} data-testid="nav-reviewer-dashboard">{user.role.toUpperCase()} Dashboard</li>
      {user.role === "supervisor" ? (
        <li className={`red-button ${reviewerPage === "applications" ? "active" : ""}`} onClick={() => setReviewerPage("applications")} data-testid="nav-supervisor-applications">Applications</li>
      ) : (
        <li className={`red-button ${reviewerPage === "reviews" ? "active" : ""}`} onClick={() => setReviewerPage("reviews")} data-testid="nav-reviewer-reviews">Pending Reviews</li>
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
        case "dochub": return <ScholarDocHub />;
        case "noticeboard": return <ScholarNoticeBoard />;
        default: return <ScholarProfile user={user} />;
      }
    } else {
      switch (reviewerPage) {
        case "dashboard":
          return user.role === "supervisor" ? <SupervisorDashboard /> : <ReviewerDashboard role={user.role} />;
        case "reviews":
          return user.role === "supervisor" ? <SupervisorApplications user={user} /> : <ReviewerApplications user={user} />;
        case "applications":
          return <SupervisorApplications user={user} />;
        default:
          return user.role === "supervisor" ? <SupervisorDashboard /> : <ReviewerDashboard role={user.role} />;
      }
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="header">
        <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)} data-testid="button-sidebar-toggle">☰</button>
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
          {user.role === "supervisor" && renderReviewerSidebar()}
          {(user.role === "drc" || user.role === "irc" || user.role === "doaa") && renderReviewerSidebar()}
        </nav>
        <main className="content">{renderContent()}</main>
      </div>
    </div>
  );
}

function ScholarProfile({ user }: { user: User }) {
  const { data: freshUser } = useQuery<User>({
    queryKey: ["/api/users", user.id],
    queryFn: () => fetch(`/api/users/${user.id}`).then(res => res.json()),
    initialData: user
  });

  const displayUser = freshUser || user;

  return (
    <div style={{ padding: "8px" }}>
      <div className="profile-card">
        <div className="avatar-col">
          <div className="avatar-placeholder"></div>
          <span className="change-photo">Change Photo</span>
        </div>
        <div className="details-col">
          <table className="info-table">
            <thead>
              <tr><th>Name</th><th>Registration No</th><th>Campus</th><th>Department</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>{displayUser.name}</td>
                <td>{displayUser.scholarId || "N/A"}</td>
                <td>{displayUser.location || "N/A"}</td>
                <td>{displayUser.department || "N/A"}</td>
                <td><span className="pill">{displayUser.status || "Active"}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="personal-card">
        <div className="personal-header"><h3>Personal Details</h3><button className="edit-btn" data-testid="button-edit-profile">Edit</button></div>
        <div className="personal-grid">
          <div className="pd-row">
            <span className="pd-label">Name</span><span className="pd-value">{displayUser.name}</span>
            <span className="pd-label">Contact</span><span className="pd-value">{displayUser.phone || "N/A"}</span>
            <span className="pd-label">Email</span><span className="pd-value">{displayUser.email}</span>
          </div>
          <div className="pd-row">
            <span className="pd-label">Department</span><span className="pd-value">{displayUser.department || "N/A"}</span>
            <span className="pd-label">Batch</span><span className="pd-value">{displayUser.batch || "N/A"}</span>
            <span className="pd-label">Programme</span><span className="pd-value">{displayUser.programme || "N/A"}</span>
          </div>
          <div className="pd-row">
            <span className="pd-label">Phase</span><span className="pd-value">{displayUser.phase || "N/A"}</span>
            <span className="pd-label">Supervisor</span><span className="pd-value" data-testid="text-supervisor">{displayUser.supervisor || "N/A"}</span>
            <span className="pd-label">Co-Supervisor</span><span className="pd-value">{displayUser.coSupervisor || "N/A"}</span>
          </div>
          <div className="pd-row">
            <span className="pd-label">Date of Joining</span><span className="pd-value">{displayUser.joiningDate || "N/A"}</span>
            <span className="pd-label">Research Area</span><span className="pd-value">{displayUser.researchArea || "N/A"}</span>
            <span className="pd-label">Research Title</span><span className="pd-value">{displayUser.researchTitle || "N/A"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScholarApplications({ user }: { user: User }) {
  const [view, setView] = useState<"options" | "apply" | "track">("options");
  const [formType, setFormType] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const queryClient = useQueryClient();

  const { data: applications = [], isLoading } = useQuery<Application[]>({
    queryKey: ["/api/applications", { scholarId: user.id }],
    queryFn: () => fetch(`/api/applications?scholarId=${user.id}`).then(res => res.json())
  });

  const submitMutation = useMutation({
    mutationFn: async (data: { type: string; details: Record<string, unknown> }) => {
      const res = await apiRequest("POST", "/api/applications", {
        scholarId: user.id,
        type: data.type,
        details: data.details
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      alert("Application submitted successfully! It will be reviewed by the DRC.");
      setView("options");
      setFormType(null);
    }
  });

  const getStageProgress = (stage: string, status: string) => {
    if (status === "Rejected") return { percent: 100, label: "Rejected", color: "#e74c3c" };
    if (status === "Approved") return { percent: 100, label: "Approved", color: "#27ae60" };
    switch (stage) {
      case "drc": return { percent: 25, label: "At DRC", color: "#3498db" };
      case "irc": return { percent: 50, label: "At IRC", color: "#f39c12" };
      case "doaa": return { percent: 75, label: "At DoAA", color: "#9b59b6" };
      case "completed": return { percent: 100, label: "Completed", color: "#27ae60" };
      default: return { percent: 0, label: "Submitted", color: "#95a5a6" };
    }
  };

  return (
    <div className="applications-container">
      <div className="applications-title">Applications</div>

      {view === "options" && (
        <div className="applications-options">
          <button className="application-option" onClick={() => { setView("apply"); setFormType(null); }} data-testid="button-apply">Apply</button>
          <button className="application-option" onClick={() => setView("track")} data-testid="button-track">Track Your Application</button>
        </div>
      )}

      {view === "apply" && !formType && (
        <div className="dropdown-container" style={{ display: "block" }}>
          <div className="dropdown-box" data-testid="dropdown-application-type">Select Application Type ▼</div>
          <div className="dropdown-content" style={{ display: "block", position: "relative" }}>
            <button onClick={() => setFormType("supervisor")} data-testid="button-supervisor-change">Change of Supervisor</button>
            <button onClick={() => setFormType("pretalk")} data-testid="button-pretalk">Apply for Pre-talk</button>
            <button onClick={() => setFormType("extension")} data-testid="button-extension">Extension of Ph.D Duration</button>
            <button onClick={() => setFormType("reregistration")} data-testid="button-reregistration">Ph.D Re-Registration</button>
          </div>
          <button className="submit-btn" onClick={() => setView("options")} style={{ marginTop: "20px", background: "#6c757d" }} data-testid="button-back-options">Back to Options</button>
        </div>
      )}

      {view === "apply" && formType === "extension" && (
        <ExtensionForm user={user} onSubmit={(details) => submitMutation.mutate({ type: "Extension", details })} onBack={() => { setView("options"); setFormType(null); }} isSubmitting={submitMutation.isPending} />
      )}

      {view === "apply" && formType === "supervisor" && (
        <SupervisorChangeForm user={user} onSubmit={(details) => submitMutation.mutate({ type: "Supervisor Change", details })} onBack={() => { setView("options"); setFormType(null); }} isSubmitting={submitMutation.isPending} />
      )}

      {view === "apply" && formType === "pretalk" && (
        <PreTalkForm user={user} onSubmit={(details) => submitMutation.mutate({ type: "Pre-Talk", details })} onBack={() => { setView("options"); setFormType(null); }} isSubmitting={submitMutation.isPending} />
      )}

      {view === "apply" && formType === "reregistration" && (
        <ReRegistrationForm user={user} onSubmit={(details) => submitMutation.mutate({ type: "Re-Registration", details })} onBack={() => { setView("options"); setFormType(null); }} isSubmitting={submitMutation.isPending} />
      )}

      {view === "track" && (
        <>
          <button className="submit-btn" onClick={() => setView("options")} style={{ marginBottom: "20px", background: "#6c757d" }} data-testid="button-back-options-track">Back to Options</button>
          {isLoading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>Loading applications...</div>
          ) : applications.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>No applications found. Submit an application to get started.</div>
          ) : (
            <div className="tracking-container">
              {applications.map((app) => {
                const progress = getStageProgress(app.currentStage, app.status);
                return (
                  <div className="application-card" key={app.id}>
                    <div className="application-header">
                      <div className="application-type">{app.type}</div>
                      <div className="application-submitted">Submitted: {new Date(app.submissionDate).toLocaleDateString()}</div>
                    </div>
                    <div className="application-body">
                      <div className="current-stage">
                        <div className={`stage-indicator ${app.status === "Pending" ? "in-progress" : app.status === "Approved" ? "completed" : "rejected"}`}></div>
                        <div className="stage-text">{progress.label}</div>
                      </div>
                      <div className="progress-container">
                        <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress.percent}%`, background: progress.color }}></div></div>
                        <div className="progress-text"><span>Submitted</span><span>{progress.percent}% Complete</span></div>
                      </div>
                    </div>
                    <div className="application-footer">
                      <div className={`status-badge ${app.status === "Pending" ? "in-progress" : app.status === "Approved" ? "completed" : "rejected"}`}>{app.status}</div>
                      <button className="details-btn" onClick={() => setSelectedApp(app)} data-testid={`button-details-${app.id}`}>More Details →</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {selectedApp && <ApplicationDetailModal app={selectedApp} onClose={() => setSelectedApp(null)} />}
    </div>
  );
}

function ApplicationDetailModal({ app, onClose }: { app: Application; onClose: () => void }) {
  const { data: reviews = [] } = useQuery<ApplicationReview[]>({
    queryKey: ["/api/applications", app.id, "reviews"],
    queryFn: () => fetch(`/api/applications/${app.id}/reviews`).then(res => res.json())
  });

  const stages = ["drc", "irc", "doaa", "completed"];
  const currentIndex = stages.indexOf(app.currentStage);

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "700px" }}>
        <div className="modal-header">
          <div className="modal-title">{app.type} Application</div>
          <button className="close-btn" onClick={onClose} data-testid="button-close-modal">×</button>
        </div>
        <div className="modal-body">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px", padding: "20px", background: "#f8f9fa", borderRadius: "8px" }}>
            {["DRC", "IRC", "DoAA", "Complete"].map((label, idx) => {
              const stageKey = stages[idx];
              const review = reviews.find(r => r.stage === stageKey);
              const isPast = idx < currentIndex || app.status === "Approved";
              const isCurrent = idx === currentIndex && app.status === "Pending";
              const isRejected = review?.decision === "rejected";

              return (
                <div key={label} style={{ textAlign: "center", flex: 1 }}>
                  <div style={{
                    width: "40px", height: "40px",
                    background: isRejected ? "#e74c3c" : isPast ? "#27ae60" : isCurrent ? "#3498db" : "#e0e0e0",
                    color: isPast || isCurrent || isRejected ? "white" : "#666",
                    borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 10px", fontWeight: "bold"
                  }}>{idx + 1}</div>
                  <div style={{ fontWeight: "600" }}>{label}</div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    {review ? (isRejected ? "Rejected" : "Approved") : isCurrent ? "Under Review" : isPast ? "Passed" : "Pending"}
                  </div>
                  {review && <div style={{ fontSize: "11px", color: "#888" }}>{new Date(review.reviewDate).toLocaleDateString()}</div>}
                </div>
              );
            })}
          </div>

          {reviews.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ marginBottom: "10px", color: "#0b6a55" }}>Review History</h4>
              {reviews.map((review) => (
                <div key={review.id} style={{ padding: "10px", background: review.decision === "approved" ? "#e8f5e9" : "#ffebee", borderRadius: "6px", marginBottom: "8px" }}>
                  <div style={{ fontWeight: "600" }}>{review.stage.toUpperCase()} - {review.decision === "approved" ? "Approved" : "Rejected"}</div>
                  <div style={{ fontSize: "13px", color: "#555" }}>Remarks: {review.remarks}</div>
                  <div style={{ fontSize: "12px", color: "#888" }}>{new Date(review.reviewDate).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginBottom: "14px" }}>
            <strong>PDF Enclosures</strong>
            <div style={{ marginTop: "8px" }}>
              <ApplicationEnclosureViewer enclosures={getEnclosuresFromDetails(app.details)} />
            </div>
          </div>
          <div style={{ padding: "15px", background: app.status === "Approved" ? "#e8f5e9" : app.status === "Rejected" ? "#ffebee" : "#e3f2fd", borderRadius: "8px" }}>
            <strong>Status:</strong> {app.status}<br />
            <strong>Current Stage:</strong> {app.currentStage.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewerDashboard({ role }: { role: string }) {
  const { data: pendingApps = [] } = useQuery<Application[]>({
    queryKey: ["/api/applications/stage", role],
    queryFn: () => fetch(`/api/applications/stage/${role}`).then(res => res.json())
  });

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ color: "#0b6a55", marginBottom: "20px" }}>{role.toUpperCase()} Dashboard</h2>
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Pending Reviews</div>
            <div className="stat-value">{pendingApps.length}</div>
          </div>
          <div className="stat-icon" style={{ color: "#f39c12" }}>📋</div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Your Role</div>
            <div className="stat-value">{role.toUpperCase()}</div>
          </div>
          <div className="stat-icon" style={{ color: "#0b6a55" }}>👤</div>
        </div>
      </div>
      <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", border: "1px solid #e6e6e6", marginTop: "20px" }}>
        <h3 style={{ marginBottom: "15px", color: "#0b6a55" }}>Approval Workflow</h3>
        <p style={{ color: "#666" }}>Applications flow through: <strong>DRC → IRC → DoAA → Completed</strong></p>
        <p style={{ color: "#666", marginTop: "10px" }}>You can only review applications at the <strong>{role.toUpperCase()}</strong> stage.</p>
      </div>
    </div>
  );
}

function ReviewerApplications({ user }: { user: User }) {
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [remarks, setRemarks] = useState("");
  const queryClient = useQueryClient();

  const { data: pendingApps = [], isLoading } = useQuery<Application[]>({
    queryKey: ["/api/applications/stage", user.role],
    queryFn: () => fetch(`/api/applications/stage/${user.role}`).then(res => res.json())
  });

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: () => fetch("/api/users").then(res => res.json())
  });

  const getScholarName = (scholarId: number) => {
    const scholar = allUsers.find(u => u.id === scholarId);
    return scholar?.name || `Scholar #${scholarId}`;
  };

  const reviewMutation = useMutation({
    mutationFn: async ({ appId, decision, remarks }: { appId: number; decision: "approved" | "rejected"; remarks: string }) => {
      const res = await apiRequest("POST", `/api/applications/${appId}/review`, { reviewerId: user.id, decision, remarks });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      alert(`Application ${variables.decision === "approved" ? "approved" : "rejected"} successfully!`);
      setSelectedApp(null);
      setRemarks("");
    }
  });

  const handleReview = (decision: "approved" | "rejected") => {
    if (!selectedApp) return;
    if (!remarks.trim()) {
      alert("Please provide remarks for your decision.");
      return;
    }
    reviewMutation.mutate({ appId: selectedApp.id, decision, remarks });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ color: "#0b6a55", marginBottom: "20px" }}>Pending Reviews - {user.role.toUpperCase()}</h2>
      {isLoading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>Loading...</div>
      ) : pendingApps.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#666", background: "#fff", borderRadius: "10px", border: "1px solid #e6e6e6" }}>
          No applications pending at {user.role.toUpperCase()} stage.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {pendingApps.map((app) => (
            <div key={app.id} style={{ background: "#fff", padding: "20px", borderRadius: "10px", border: "1px solid #e6e6e6" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                <div>
                  <div style={{ fontWeight: "600", fontSize: "16px" }}>{app.type}</div>
                  <div style={{ fontSize: "13px", color: "#666" }}>Scholar: {getScholarName(app.scholarId)} | Submitted: {new Date(app.submissionDate).toLocaleDateString()}</div>
                </div>
                <div className="status-badge in-progress">Awaiting Review</div>
              </div>
              {app.details && (
                <div style={{ background: "#f8f9fa", padding: "15px", borderRadius: "6px", marginBottom: "15px" }}>
                  <strong>Application Details:</strong>
                  <pre style={{ fontSize: "13px", whiteSpace: "pre-wrap", marginTop: "10px" }}>{JSON.stringify(app.details, null, 2)}</pre>
                </div>
              )}
              <button className="submit-btn" onClick={() => setSelectedApp(app)} style={{ marginRight: "10px" }} data-testid={`button-review-${app.id}`}>Review Application</button>
            </div>
          ))}
        </div>
      )}

      {selectedApp && (
        <div className="modal-overlay active" onClick={() => setSelectedApp(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
            <div className="modal-header">
              <div className="modal-title">Review: {selectedApp.type}</div>
              <button className="close-btn" onClick={() => setSelectedApp(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: "20px" }}>
                <strong>Scholar:</strong> {getScholarName(selectedApp.scholarId)}<br />
                <strong>Type:</strong> {selectedApp.type}<br />
                <strong>Submitted:</strong> {new Date(selectedApp.submissionDate).toLocaleDateString()}
              </div>
              {selectedApp.details && (
                <div style={{ background: "#f8f9fa", padding: "15px", borderRadius: "6px", marginBottom: "20px" }}>
                  <strong>Details:</strong>
                  <pre style={{ fontSize: "13px", whiteSpace: "pre-wrap", marginTop: "10px" }}>{JSON.stringify(selectedApp.details, null, 2)}</pre>
                </div>
              )}
              <div style={{ marginBottom: "20px" }}>
                <strong>PDF Enclosures:</strong>
                <div style={{ marginTop: "8px" }}>
                  <ApplicationEnclosureViewer enclosures={getEnclosuresFromDetails(selectedApp.details)} />
                </div>
              </div>
              <div className="form-group">
                <label style={{ fontWeight: "600" }}>Your Remarks (Required)</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Provide your remarks and reasoning for the decision..."
                  style={{ height: "100px", width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ddd" }}
                  data-testid="input-remarks"
                />
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button className="submit-btn" style={{ background: "#27ae60", flex: 1 }} onClick={() => handleReview("approved")} disabled={reviewMutation.isPending} data-testid="button-approve">
                  {reviewMutation.isPending ? "Processing..." : "Approve"}
                </button>
                <button className="submit-btn" style={{ background: "#e74c3c", flex: 1 }} onClick={() => handleReview("rejected")} disabled={reviewMutation.isPending} data-testid="button-reject">
                  {reviewMutation.isPending ? "Processing..." : "Reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SupervisorChangeForm({ user, onSubmit, onBack, isSubmitting }: { user: User; onSubmit: (details: Record<string, unknown>) => void; onBack: () => void; isSubmitting: boolean }) {
  const [formData, setFormData] = useState({
    scholarName: user.name,
    department: user.department || "Computer Science",
    regdNo: user.scholarId || "",
    joiningDate: user.joiningDate || "",
    currentSupervisor: user.supervisor || "",
    proposedSupervisor: "",
    reason: ""
  });
  const [enclosures, setEnclosures] = useState<ApplicationEnclosure[]>([]);
  return (
    <div className="form-container">
      <div style={{ textAlign: "center", marginBottom: "25px" }}>
        <div style={{ fontSize: "18px", fontWeight: "bold", color: "#0b6a55" }}>GANDHI INSTITUTE OF TECHNOLOGY AND MANAGEMENT (GITAM)</div>
        <div style={{ fontSize: "14px", color: "#666" }}>(DEEMED TO BE UNIVERSITY)</div>
      </div>
      <div className="form-title">Request for Change/Addition of Supervisor(s)</div>
      <div className="form-group"><label>Name of the Scholar</label><input type="text" value={formData.scholarName} onChange={(e) => setFormData({ ...formData, scholarName: e.target.value })} /></div>
      <div className="form-group"><label>Department</label><input type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} /></div>
      <div className="form-group"><label>Regd. No.</label><input type="text" value={formData.regdNo} onChange={(e) => setFormData({ ...formData, regdNo: e.target.value })} /></div>
      <div className="form-group"><label>Current Supervisor</label><input type="text" value={formData.currentSupervisor} onChange={(e) => setFormData({ ...formData, currentSupervisor: e.target.value })} /></div>
      <div className="form-group"><label>Proposed New Supervisor</label><input type="text" value={formData.proposedSupervisor} onChange={(e) => setFormData({ ...formData, proposedSupervisor: e.target.value })} placeholder="Enter name of proposed supervisor" data-testid="input-proposed-supervisor" /></div>
      <div className="form-group"><label>Reason/Justification</label><textarea value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="Please provide detailed reason" style={{ height: "120px" }} /></div>
      <EnclosureUpload onChange={setEnclosures} />
      <div style={{ display: "flex", gap: "10px" }}>
        <button className="submit-btn" onClick={() => onSubmit({ ...formData, enclosures })} disabled={isSubmitting} data-testid="button-submit-form">{isSubmitting ? "Submitting..." : "Submit Application"}</button>
        <button className="submit-btn" onClick={onBack} style={{ background: "#6c757d" }}>Back to Options</button>
      </div>
    </div>
  );
}

function PreTalkForm({ user, onSubmit, onBack, isSubmitting }: { user: User; onSubmit: (details: Record<string, unknown>) => void; onBack: () => void; isSubmitting: boolean }) {
  const [formData, setFormData] = useState({
    department: user.department || "Computer Science",
    scholarName: user.name,
    regdNo: user.scholarId || "",
    researchTopic: user.researchTitle || "",
    preTalkDate: "",
    venue: "Seminar Hall"
  });
  const [enclosures, setEnclosures] = useState<ApplicationEnclosure[]>([]);
  return (
    <div className="form-container">
      <div style={{ textAlign: "center", marginBottom: "25px" }}>
        <div style={{ fontSize: "18px", fontWeight: "bold", color: "#0b6a55" }}>GANDHI INSTITUTE OF TECHNOLOGY AND MANAGEMENT (GITAM)</div>
      </div>
      <div className="form-title">Research Form -V: Ph.D. Pre-Submission Talk Report</div>
      <div className="form-group"><label>Department</label><input type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} /></div>
      <div className="form-group"><label>Name of Research Scholar</label><input type="text" value={formData.scholarName} onChange={(e) => setFormData({ ...formData, scholarName: e.target.value })} /></div>
      <div className="form-group"><label>Topic of Research Work</label><input type="text" value={formData.researchTopic} onChange={(e) => setFormData({ ...formData, researchTopic: e.target.value })} /></div>
      <div className="form-group"><label>Date of Pre-talk Seminar</label><input type="date" value={formData.preTalkDate} onChange={(e) => setFormData({ ...formData, preTalkDate: e.target.value })} /></div>
      <div className="form-group"><label>Venue</label><input type="text" value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} /></div>
      <EnclosureUpload onChange={setEnclosures} />
      <div style={{ display: "flex", gap: "10px" }}>
        <button className="submit-btn" onClick={() => onSubmit({ ...formData, enclosures })} disabled={isSubmitting}>{isSubmitting ? "Submitting..." : "Submit Application"}</button>
        <button className="submit-btn" onClick={onBack} style={{ background: "#6c757d" }}>Back</button>
      </div>
    </div>
  );
}

function ExtensionForm({ user, onSubmit, onBack, isSubmitting }: { user: User; onSubmit: (details: Record<string, unknown>) => void; onBack: () => void; isSubmitting: boolean }) {
  const [formData, setFormData] = useState({
    candidateName: user.name,
    registrationDate: user.joiningDate || "",
    durationEligible: "5 years",
    extensionDuration: "",
    reason: "",
    timeline: ""
  });
  const [enclosures, setEnclosures] = useState<ApplicationEnclosure[]>([]);
  return (
    <div className="form-container">
      <div style={{ textAlign: "center", marginBottom: "25px" }}>
        <div style={{ fontSize: "18px", fontWeight: "bold", color: "#0b6a55" }}>GANDHI INSTITUTE OF TECHNOLOGY AND MANAGEMENT (GITAM)</div>
      </div>
      <div className="form-title">Application for Extension of Ph.D. Program Duration</div>
      <div className="form-group"><label>Name of the Candidate</label><input type="text" value={formData.candidateName} onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })} /></div>
      <div className="form-group"><label>Date of Registration</label><input type="text" value={formData.registrationDate} onChange={(e) => setFormData({ ...formData, registrationDate: e.target.value })} /></div>
      <div className="form-group"><label>Duration Eligible</label><input type="text" value={formData.durationEligible} onChange={(e) => setFormData({ ...formData, durationEligible: e.target.value })} /></div>
      <div className="form-group"><label>Required Extension Duration</label><input type="text" value={formData.extensionDuration} onChange={(e) => setFormData({ ...formData, extensionDuration: e.target.value })} placeholder="e.g., 6 months" /></div>
      <div className="form-group"><label>Reason for Extension</label><textarea value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="Explain why you need the extension" style={{ height: "80px" }} /></div>
      <div className="form-group"><label>Expected Timeline</label><textarea value={formData.timeline} onChange={(e) => setFormData({ ...formData, timeline: e.target.value })} placeholder="When do you expect to complete?" style={{ height: "80px" }} /></div>
      <EnclosureUpload onChange={setEnclosures} />
      <div style={{ display: "flex", gap: "10px" }}>
        <button className="submit-btn" onClick={() => onSubmit({ ...formData, enclosures })} disabled={isSubmitting}>{isSubmitting ? "Submitting..." : "Submit Application"}</button>
        <button className="submit-btn" onClick={onBack} style={{ background: "#6c757d" }}>Back</button>
      </div>
    </div>
  );
}

function ReRegistrationForm({ user, onSubmit, onBack, isSubmitting }: { user: User; onSubmit: (details: Record<string, unknown>) => void; onBack: () => void; isSubmitting: boolean }) {
  const [formData, setFormData] = useState({
    scholarName: user.name,
    regNo: user.scholarId || "",
    joiningDate: user.joiningDate || "",
    department: user.department || "",
    mobile: user.phone || "",
    email: user.email
  });
  const [enclosures, setEnclosures] = useState<ApplicationEnclosure[]>([]);
  return (
    <div className="form-container">
      <div style={{ textAlign: "center", marginBottom: "25px" }}>
        <div style={{ fontSize: "18px", fontWeight: "bold", color: "#0b6a55" }}>GITAM SCHOOL OF TECHNOLOGY</div>
      </div>
      <div className="form-title">Ph.D (FT/PT) Re-Registration form</div>
      <div className="form-group"><label>Name of the Scholar</label><input type="text" value={formData.scholarName} onChange={(e) => setFormData({ ...formData, scholarName: e.target.value })} /></div>
      <div className="form-group"><label>Reg. No.</label><input type="text" value={formData.regNo} onChange={(e) => setFormData({ ...formData, regNo: e.target.value })} /></div>
      <div className="form-group"><label>Date of Joining</label><input type="text" value={formData.joiningDate} onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })} /></div>
      <div className="form-group"><label>Name of the Dept. & School</label><input type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} /></div>
      <div className="form-group"><label>Mobile No.</label><input type="text" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} /></div>
      <div className="form-group"><label>E-mail</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
      <EnclosureUpload onChange={setEnclosures} />
      <div style={{ display: "flex", gap: "10px" }}>
        <button className="submit-btn" onClick={() => onSubmit({ ...formData, enclosures })} disabled={isSubmitting}>{isSubmitting ? "Submitting..." : "Submit Application"}</button>
        <button className="submit-btn" onClick={onBack} style={{ background: "#6c757d" }}>Back</button>
      </div>
    </div>
  );
}

function ScholarResearchProgress({ userId }: { userId: number }) {
  const { data: stats } = useQuery({
    queryKey: ["/api/stats", userId],
    queryFn: () => fetch(`/api/stats/${userId}`).then(res => res.json())
  });

  return (
    <div className="research-container">
      <div className="research-title">Research Progress</div>
      <div className="stats-container">
        <div className="stat-card"><div className="stat-info"><div className="stat-label">Research Phase</div><div className="stat-value">Phase-II</div></div><div className="stat-icon" style={{ color: "#0b6a55" }}>📊</div></div>
        <div className="stat-card"><div className="stat-info"><div className="stat-label">Publications</div><div className="stat-value">{stats?.publications || 0}</div></div><div className="stat-icon" style={{ color: "#f39c12" }}>📚</div></div>
        <div className="stat-card"><div className="stat-info"><div className="stat-label">Conferences</div><div className="stat-value">2</div></div><div className="stat-icon" style={{ color: "#27ae60" }}>🎤</div></div>
        <div className="stat-card"><div className="stat-info"><div className="stat-label">Research Reviews</div><div className="stat-value">{stats?.completedReviews || 0}</div></div><div className="stat-icon" style={{ color: "#3498db" }}>✓</div></div>
      </div>
      <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", border: "1px solid #e6e6e6" }}>
        <h3 style={{ marginBottom: "15px", color: "#0b6a55" }}>Research Milestones</h3>
        <table className="info-table">
          <thead><tr><th>Milestone</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            <tr><td>Course Work Completion</td><td><span className="pill">Completed</span></td><td>Dec 2023</td></tr>
            <tr><td>Research Proposal Approval</td><td><span className="pill">Completed</span></td><td>Mar 2024</td></tr>
            <tr><td>Literature Review</td><td><span className="pill">Completed</span></td><td>Jun 2024</td></tr>
            <tr><td>Pre-talk Seminar</td><td><span style={{ background: "#f39c12", color: "white", padding: "4px 10px", borderRadius: "15px", fontSize: "13px" }}>In Progress</span></td><td>Expected: Dec 2025</td></tr>
            <tr><td>Thesis Submission</td><td><span style={{ background: "#e0e0e0", color: "#666", padding: "4px 10px", borderRadius: "15px", fontSize: "13px" }}>Pending</span></td><td>Expected: Jun 2026</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScholarFeeDetails() {
  return (
    <div className="fee-container">
      <div className="fee-title">Fee Details</div>
      <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", border: "1px solid #e6e6e6" }}>
        <table className="info-table">
          <thead><tr><th>Academic Year</th><th>Semester</th><th>Amount</th><th>Due Date</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>2024-2025</td><td>Odd</td><td>₹75,000</td><td>Aug 31, 2024</td><td><span className="pill">Paid</span></td></tr>
            <tr><td>2024-2025</td><td>Even</td><td>₹75,000</td><td>Jan 31, 2025</td><td><span style={{ background: "#f39c12", color: "white", padding: "4px 10px", borderRadius: "15px", fontSize: "13px" }}>Due</span></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScholarDocHub() {
  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ color: "#0b6a55", marginBottom: "20px" }}>Document Hub</h2>
      <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", border: "1px solid #e6e6e6" }}>
        <p style={{ color: "#666" }}>Upload and manage your research documents here.</p>
        <button className="submit-btn" style={{ marginTop: "15px" }}>Upload Document</button>
      </div>
    </div>
  );
}

function ScholarNoticeBoard() {
  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ color: "#0b6a55", marginBottom: "20px" }}>Notice Board</h2>
      <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", border: "1px solid #e6e6e6", marginBottom: "15px" }}>
        <h4 style={{ color: "#0b6a55" }}>PhD Pre-Talk Schedule 2026</h4>
        <p style={{ color: "#666", fontSize: "14px" }}>Pre-talk seminars for the upcoming batch will be scheduled in February 2026.</p>
        <span style={{ fontSize: "12px", color: "#888" }}>Posted: Jan 15, 2026</span>
      </div>
      <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", border: "1px solid #e6e6e6" }}>
        <h4 style={{ color: "#0b6a55" }}>Fee Payment Reminder</h4>
        <p style={{ color: "#666", fontSize: "14px" }}>Please ensure all fee payments are completed before the deadline.</p>
        <span style={{ fontSize: "12px", color: "#888" }}>Posted: Jan 10, 2026</span>
      </div>
    </div>
  );
}


function getEnclosuresFromDetails(details: Record<string, unknown> | undefined): ApplicationEnclosure[] {
  if (!details || !Array.isArray(details.enclosures)) {
    return [];
  }

  return details.enclosures.filter((entry): entry is ApplicationEnclosure => {
    if (!entry || typeof entry !== "object") return false;
    const enclosure = entry as Record<string, unknown>;
    return (
      typeof enclosure.name === "string" &&
      enclosure.contentType === "application/pdf" &&
      typeof enclosure.dataUrl === "string" &&
      enclosure.dataUrl.startsWith("data:application/pdf;base64,")
    );
  });
}

function ApplicationEnclosureViewer({ enclosures }: { enclosures: ApplicationEnclosure[] }) {
  if (enclosures.length === 0) {
    return <div style={{ fontSize: "13px", color: "#666" }}>No enclosures uploaded.</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {enclosures.map((enclosure, index) => (
        <div key={`${enclosure.name}-${index}`} style={{ padding: "10px", border: "1px solid #ddd", borderRadius: "6px", background: "#fff" }}>
          <div style={{ fontWeight: 600 }}>{enclosure.name}</div>
          <a href={enclosure.dataUrl} target="_blank" rel="noreferrer" style={{ color: "#0b6a55", fontSize: "13px" }}>View PDF</a>
        </div>
      ))}
    </div>
  );
}

function SupervisorApplications({ user }: { user: User }) {
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const { data: applications = [], isLoading } = useQuery<Application[]>({
    queryKey: ["/api/applications/supervisor", user.id],
    queryFn: () => fetch(`/api/applications/supervisor/${user.id}`).then(res => res.json())
  });

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: () => fetch("/api/users").then(res => res.json())
  });

  const getScholarName = (scholarId: number) => allUsers.find(u => u.id === scholarId)?.name || `Scholar #${scholarId}`;

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ color: "#0b6a55", marginBottom: "20px" }}>Applications from Your Scholars</h2>
      {isLoading ? (
        <div>Loading...</div>
      ) : applications.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid #e6e6e6", padding: "20px", borderRadius: "10px", color: "#666" }}>
          No applications found for your supervised scholars.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {applications.map((app) => {
            const enclosures = getEnclosuresFromDetails(app.details);
            return (
              <div key={app.id} style={{ background: "#fff", border: "1px solid #e6e6e6", padding: "20px", borderRadius: "10px" }}>
                <div style={{ fontWeight: 700 }}>{app.type}</div>
                <div style={{ fontSize: "13px", color: "#666", marginBottom: "8px" }}>Scholar: {getScholarName(app.scholarId)} | Status: {app.status}</div>
                <div style={{ fontSize: "13px", color: "#333", marginBottom: "10px" }}>PDF Enclosures: {enclosures.length}</div>
                <button className="submit-btn" onClick={() => setSelectedApp(app)}>View Details</button>
              </div>
            );
          })}
        </div>
      )}

      {selectedApp && (
        <div className="modal-overlay active" onClick={() => setSelectedApp(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "760px" }}>
            <div className="modal-header">
              <div className="modal-title">{selectedApp.type} - {getScholarName(selectedApp.scholarId)}</div>
              <button className="close-btn" onClick={() => setSelectedApp(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: "10px" }}><strong>Status:</strong> {selectedApp.status}</div>
              <div style={{ marginBottom: "15px" }}><strong>Submitted:</strong> {new Date(selectedApp.submissionDate).toLocaleString()}</div>
              <div style={{ background: "#f8f9fa", padding: "15px", borderRadius: "6px", marginBottom: "15px" }}>
                <strong>Application Details</strong>
                <pre style={{ fontSize: "13px", whiteSpace: "pre-wrap", marginTop: "8px" }}>{JSON.stringify(selectedApp.details, null, 2)}</pre>
              </div>
              <div>
                <strong>PDF Enclosures</strong>
                <div style={{ marginTop: "8px" }}>
                  <ApplicationEnclosureViewer enclosures={getEnclosuresFromDetails(selectedApp.details)} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EnclosureUpload({ onChange }: { onChange: (enclosures: ApplicationEnclosure[]) => void }) {
  const [files, setFiles] = useState<ApplicationEnclosure[]>([]);

  const handleFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const pdfFiles = selectedFiles.filter((file) => file.type === "application/pdf");

    if (pdfFiles.length !== selectedFiles.length) {
      alert("Only PDF documents are allowed as enclosures.");
    }

    const converted = await Promise.all(
      pdfFiles.map(
        (file) =>
          new Promise<ApplicationEnclosure>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve({
              name: file.name,
              contentType: "application/pdf",
              dataUrl: String(reader.result || "")
            });
            reader.onerror = reject;
            reader.readAsDataURL(file);
          }),
      ),
    );

    const next = [...files, ...converted];
    setFiles(next);
    onChange(next);
    event.target.value = "";
  };

  return (
    <div className="form-group">
      <label>Application Enclosures (PDF only)</label>
      <input type="file" accept="application/pdf" multiple onChange={handleFiles} />
      {files.length > 0 && (
        <ul style={{ marginTop: "8px", fontSize: "13px" }}>
          {files.map((file, i) => <li key={`${file.name}-${i}`}>{file.name}</li>)}
        </ul>
      )}
    </div>
  );
}

function SupervisorDashboard() {
  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ color: "#0b6a55", marginBottom: "20px" }}>Supervisor Dashboard</h2>
      <div className="stats-container">
        <div className="stat-card"><div className="stat-info"><div className="stat-label">Assigned Scholars</div><div className="stat-value">5</div></div><div className="stat-icon" style={{ color: "#0b6a55" }}>👥</div></div>
        <div className="stat-card"><div className="stat-info"><div className="stat-label">Pending Reports</div><div className="stat-value">2</div></div><div className="stat-icon" style={{ color: "#f39c12" }}>📄</div></div>
      </div>
    </div>
  );
}
