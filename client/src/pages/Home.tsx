import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import "../styles/gscholar.css";

type ScholarPage =
  | "profile"
  | "application-supervisor"
  | "application-pretalk"
  | "application-extension"
  | "application-reregistration"
  | "application-track"
  | "application-thesis"
  | "research"
  | "fees"
  | "dochub"
  | "noticeboard";
type ReviewerPage = "dashboard" | "reviews";

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
  userId: number;
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

interface FeeStructureRow {
  feeId: number;
  academicYear: string;
  phase: string;
  batch: string;
  year1Fee?: number | string | null;
  year2Fee?: number | string | null;
  year3Fee?: number | string | null;
  year4Fee?: number | string | null;
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
  const [id, setId] = useState("");
  const [idType, setIdType] = useState<"scholar" | "employee">("scholar");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const body = idType === "scholar" 
        ? { scholarId: id, password }
        : { employeeId: id, password };

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
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
              <label>Login Type</label>
              <select value={idType} onChange={(e) => setIdType(e.target.value as "scholar" | "employee")} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ddd" }} data-testid="select-id-type">
                <option value="scholar">Scholar</option>
                <option value="employee">Employee</option>
              </select>
            </div>
            <div className="form-group">
              <label>{idType === "scholar" ? "Scholar ID" : "Employee ID"}</label>
              <input 
                type="text" 
                value={id} 
                onChange={(e) => setId(e.target.value)} 
                placeholder={idType === "scholar" ? "e.g., GITAM-SCH-2020-118" : "e.g., EMP-SUPERVISOR-001"} 
                required 
                data-testid="input-id" 
              />
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
              <div style={{ marginBottom: "5px" }}><strong>GITAM-SCH-2020-118</strong> / password123 - Scholar</div>
              <div style={{ marginBottom: "5px" }}><strong>GITAM-SCH-2021-204</strong> / password123 - Scholar</div>
              <div style={{ marginBottom: "5px" }}><strong>EMP-SUPERVISOR-001</strong> / password123 - Supervisor</div>
              <div style={{ marginBottom: "5px" }}><strong>EMP-DRC-001</strong> / password123 - DRC Member</div>
              <div style={{ marginBottom: "5px" }}><strong>EMP-IRC-001</strong> / password123 - IRC Member</div>
              <div><strong>EMP-DOAA-001</strong> / password123 - DoAA Officer</div>
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
      <li className={scholarPage === "application-supervisor" ? "active" : ""} onClick={() => setScholarPage("application-supervisor")} data-testid="nav-application-supervisor">Change of Supervisor</li>
      <li className={scholarPage === "application-pretalk" ? "active" : ""} onClick={() => setScholarPage("application-pretalk")} data-testid="nav-application-pretalk">Pre-talk Application</li>
      <li className={scholarPage === "application-extension" ? "active" : ""} onClick={() => setScholarPage("application-extension")} data-testid="nav-application-extension">Extension Application</li>
      <li className={scholarPage === "application-reregistration" ? "active" : ""} onClick={() => setScholarPage("application-reregistration")} data-testid="nav-application-reregistration">Re-Registration Application</li>
      <li className={scholarPage === "application-thesis" ? "active" : ""} onClick={() => setScholarPage("application-thesis")} data-testid="nav-application-thesis">Thesis Submission</li>
      <li className={`red-button ${scholarPage === "application-track" ? "active" : ""}`} onClick={() => setScholarPage("application-track")} data-testid="nav-application-track">Track My Application</li>
      <li className={scholarPage === "research" ? "active" : ""} onClick={() => setScholarPage("research")} data-testid="nav-research">Research Progress</li>
      <li className={scholarPage === "fees" ? "active" : ""} onClick={() => setScholarPage("fees")} data-testid="nav-fees">Fee Details</li>
      <li className={`red-button ${scholarPage === "dochub" ? "active" : ""}`} onClick={() => setScholarPage("dochub")} data-testid="nav-dochub">Doc-Hub</li>
      <li className={scholarPage === "noticeboard" ? "active" : ""} onClick={() => setScholarPage("noticeboard")} data-testid="nav-noticeboard">Notice Board</li>
    </ul>
  );

  const renderReviewerSidebar = () => (
    <ul>
      <li className={reviewerPage === "dashboard" ? "active" : ""} onClick={() => setReviewerPage("dashboard")} data-testid="nav-reviewer-dashboard">{user.role.toUpperCase()} Dashboard</li>
      <li className={`red-button ${reviewerPage === "reviews" ? "active" : ""}`} onClick={() => setReviewerPage("reviews")} data-testid="nav-reviewer-reviews">Pending Reviews</li>
    </ul>
  );

  const renderContent = () => {
    if (user.role === "scholar") {
      switch (scholarPage) {
        case "profile": return <ScholarProfile user={user} />;
        case "application-supervisor":
          return <ScholarApplicationFormPage user={user} formType="supervisor" onBack={() => setScholarPage("application-track")} />;
        case "application-pretalk":
          return <ScholarApplicationFormPage user={user} formType="pretalk" onBack={() => setScholarPage("application-track")} />;
        case "application-extension":
          return <ScholarApplicationFormPage user={user} formType="extension" onBack={() => setScholarPage("application-track")} />;
        case "application-reregistration":
          return <ScholarApplicationFormPage user={user} formType="reregistration" onBack={() => setScholarPage("application-track")} />;
        case "application-thesis":
          return <ScholarThesisSubmission />;
        case "application-track":
          return <ScholarApplicationsTracker user={user} />;
        case "research": return <ScholarResearchProgress userId={user.id} />;
        case "fees": return <ScholarFeeDetails />;
        case "dochub": return <ScholarDocHub user={user} />;
        case "noticeboard": return <ScholarNoticeBoard />;
        default: return <ScholarProfile user={user} />;
      }
    } else if (user.role === "supervisor") {
      return <SupervisorDashboard user={user} />;
    } else {
      switch (reviewerPage) {
        case "dashboard": return <ReviewerDashboard role={user.role} />;
        case "reviews": return <ReviewerApplications user={user} />;
        default: return <ReviewerDashboard role={user.role} />;
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
          {user.role === "supervisor" && <ul><li className="active">Supervisor Dashboard</li></ul>}
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
  const { data: feeStructure = [] } = useQuery<FeeStructureRow[]>({
    queryKey: ["/api/fees/structure"],
    queryFn: () => fetch("/api/fees/structure").then(res => res.json()),
  });

  const displayUser = freshUser || user;
  const formatFee = (value: number | string | null | undefined) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }
    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      return String(value);
    }
    return `₹${numeric.toLocaleString("en-IN")}`;
  };
  const feeDemand = {
    arrears: "₹12,500",
    hostelArrears: "₹5,000",
    annualFee: "₹90,000"
  };
  const paymentHistory = [
    {
      transactionId: "TXN-2023-1142",
      dateTime: "2023-08-14 11:45",
      bankName: "State Bank of India",
      totalPaid: "₹90,000",
      status: "Success",
      academicYear: "2023-24",
      mode: "Net Banking",
      receiptNumber: "RCPT-3321",
      reconciliation: "Matched",
      createdAt: "2023-08-14 11:47"
    },
    {
      transactionId: "TXN-2024-0266",
      dateTime: "2024-01-10 16:18",
      bankName: "HDFC Bank",
      totalPaid: "₹45,000",
      status: "Pending",
      academicYear: "2024-25",
      mode: "UPI",
      receiptNumber: "RCPT-4108",
      reconciliation: "In Review",
      createdAt: "2024-01-10 16:20"
    }
  ];
  const prePhdExam = {
    examType: "Pre-PhD Regular",
    conductedMonthYear: "July 2023",
    certificateLabel: "Download Certificate",
    subjects: [
      { name: "Research Methodology", code: "RSH-501", conductedOn: "July 2023", semester: "Semester I", grade: "A" },
      { name: "Advanced Computing", code: "CSE-542", conductedOn: "July 2023", semester: "Semester I", grade: "A+" },
      { name: "Ethics & Publication", code: "RSH-506", conductedOn: "July 2023", semester: "Semester I", grade: "O" }
    ]
  };
  const progressionSummary = [
    {
      number: "PR-01",
      title: "Progression Review - 1",
      conductedOn: "2023-12-15",
      rac1: { id: "RAC-118", name: "Dr. Nandita B. Chaudhuri" },
      rac2: { id: "RAC-203", name: "Dr. S. Rama Krishna" },
      documentLabel: "View Progression File",
      supervisorUploadedOn: "2023-12-02 10:30",
      drcApprovalOn: "2023-12-18 15:10",
      finalResult: "Satisfactory"
    }
  ];
  const reviewCycles = [
    {
      reviewMonthYear: "December 2023",
      reviewType: "6-monthly",
      scholarStatus: "Submitted",
      scholarSubmittedOn: "2023-12-01 09:15",
      scholarAbsent: "No",
      supervisorStatus: "Reviewed",
      supervisorSubmittedOn: "2023-12-03 11:40",
      rac1Status: "Reviewed",
      rac1SubmittedOn: "2023-12-05 14:05",
      rac2Status: "Pending",
      rac2SubmittedOn: "--",
      drcStatus: "Pending",
      drcReviewedOn: "--",
      outcome: "Pending"
    }
  ];
  const documentRecords = [
    {
      type: "Progression Report",
      file: "progression-report-pr01.pdf",
      uploadedBy: "Supervisor",
      uploadedOn: "2023-12-02 10:30",
      version: "v2",
      locked: "Yes",
      visibility: "Scholar / RAC / DRC"
    },
    {
      type: "Coursework Certificate",
      file: "prephd-certificate.pdf",
      uploadedBy: "Scholar",
      uploadedOn: "2023-07-29 15:05",
      version: "v1",
      locked: "Yes",
      visibility: "Scholar / DRC"
    }
  ];
  const auditTimeline = [
    {
      reviewCycleId: "RC-2023-12",
      reviewerRole: "Scholar",
      actionTimestamp: "2023-12-01 09:15",
      actionPerformed: "Submit",
      remarks: "Uploaded report and self-evaluation",
      auditRef: "AUD-9912"
    },
    {
      reviewCycleId: "RC-2023-12",
      reviewerRole: "Supervisor",
      actionTimestamp: "2023-12-03 11:40",
      actionPerformed: "Review",
      remarks: "Recommended for RAC review",
      auditRef: "AUD-9945"
    }
  ];

  return (
    <div style={{ padding: "8px" }}>
      <div className="profile-card">
        <div className="avatar-col">
          <div className="avatar-placeholder"></div>
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
        <div className="personal-header"><h3>Personal Details</h3></div>
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
      <div className="module-card">
        <div className="module-header">
          <h3>Fee & Payments Module</h3>
          <span className="module-subtitle">Fee Structure (Per Academic Year)</span>
        </div>
        <div className="module-body">
          <table className="module-table">
            <thead>
              <tr>
                <th>Academic Year</th>
                <th>Phase</th>
                <th>Batch</th>
                <th>1st Year Fee</th>
                <th>2nd Year Fee</th>
                <th>3rd Year Fee</th>
                <th>4th Year Fee</th>
              </tr>
            </thead>
            <tbody>
              {feeStructure.length ? (
                feeStructure.map((row) => (
                  <tr key={row.feeId}>
                    <td>{row.academicYear}</td>
                    <td>{row.phase}</td>
                    <td>{row.batch}</td>
                    <td>{formatFee(row.year1Fee)}</td>
                    <td>{formatFee(row.year2Fee)}</td>
                    <td>{formatFee(row.year3Fee)}</td>
                    <td>{formatFee(row.year4Fee)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>No fee structure available.</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="module-split">
            <div className="module-block">
              <h4>Fee Demand Summary (Without Scholarship)</h4>
              <table className="module-table compact">
                <tbody>
                  <tr><th>Arrears Amount</th><td>{feeDemand.arrears}</td></tr>
                  <tr><th>Hostel Arrears Amount</th><td>{feeDemand.hostelArrears}</td></tr>
                  <tr><th>Annual Fee</th><td>{feeDemand.annualFee}</td></tr>
                </tbody>
              </table>
            </div>
            <div className="module-block">
              <h4>Payment History (From 2nd Year onwards)</h4>
              <table className="module-table">
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Transaction Date & Time</th>
                    <th>Bank Name</th>
                    <th>Total Fee Paid</th>
                    <th>Payment Status</th>
                    <th>Academic Year</th>
                    <th>Payment Mode</th>
                    <th>Receipt Number</th>
                    <th>Reconciliation Status</th>
                    <th>Created Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map((row) => (
                    <tr key={row.transactionId}>
                      <td>{row.transactionId}</td>
                      <td>{row.dateTime}</td>
                      <td>{row.bankName}</td>
                      <td>{row.totalPaid}</td>
                      <td><span className={`status-pill ${row.status.toLowerCase()}`}>{row.status}</span></td>
                      <td>{row.academicYear}</td>
                      <td>{row.mode}</td>
                      <td>{row.receiptNumber}</td>
                      <td>{row.reconciliation}</td>
                      <td>{row.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div className="module-card">
        <div className="module-header">
          <h3>Coursework / Pre-PhD Results Module</h3>
        </div>
        <div className="module-body">
          <div className="module-block">
            <h4>Pre-PhD Result (Regular)</h4>
            <div className="module-meta">
              <div><strong>Exam Type:</strong> {prePhdExam.examType}</div>
              <div><strong>Conducted Month & Year:</strong> {prePhdExam.conductedMonthYear}</div>
              <div><strong>Certificate:</strong> <a className="doc-link" href="#">{prePhdExam.certificateLabel}</a></div>
            </div>
            <table className="module-table">
              <thead>
                <tr>
                  <th>Subject Name</th>
                  <th>Subject Code</th>
                  <th>Conducted On (Month-Year)</th>
                  <th>Semester</th>
                  <th>Grade / Result</th>
                </tr>
              </thead>
              <tbody>
                {prePhdExam.subjects.map((subject) => (
                  <tr key={subject.code}>
                    <td>{subject.name}</td>
                    <td>{subject.code}</td>
                    <td>{subject.conductedOn}</td>
                    <td>{subject.semester}</td>
                    <td><span className="badge">{subject.grade}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="module-card">
        <div className="module-header">
          <h3>Research Progression & Reviews Module</h3>
          <span className="module-subtitle">Progression Summary</span>
        </div>
        <div className="module-body">
          <table className="module-table">
            <thead>
              <tr>
                <th>Progression Number</th>
                <th>Progression Title</th>
                <th>Conducted On</th>
                <th>RAC Member 1</th>
                <th>RAC Member 2</th>
                <th>View Document</th>
                <th>Supervisor Uploaded On</th>
                <th>DRC Approval Date & Time</th>
                <th>Final Result</th>
              </tr>
            </thead>
            <tbody>
              {progressionSummary.map((row) => (
                <tr key={row.number}>
                  <td>{row.number}</td>
                  <td>{row.title}</td>
                  <td>{row.conductedOn}</td>
                  <td>
                    <div>{row.rac1.id}</div>
                    <div className="muted">{row.rac1.name}</div>
                  </td>
                  <td>
                    <div>{row.rac2.id}</div>
                    <div className="muted">{row.rac2.name}</div>
                  </td>
                  <td><a className="doc-link" href="#">{row.documentLabel}</a></td>
                  <td>{row.supervisorUploadedOn}</td>
                  <td>{row.drcApprovalOn}</td>
                  <td><span className={`status-pill ${row.finalResult.toLowerCase()}`}>{row.finalResult}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="module-block">
            <h4>Scholar’s RAC Ongoing Online Review Reports</h4>
            <table className="module-table">
              <thead>
                <tr>
                  <th>Review Month & Year</th>
                  <th>Review Type</th>
                  <th>Scholar Status</th>
                  <th>Submitted On</th>
                  <th>Absent</th>
                  <th>Supervisor Status</th>
                  <th>Submitted On</th>
                  <th>RAC Member 1 Status</th>
                  <th>Submitted On</th>
                  <th>RAC Member 2 Status</th>
                  <th>Submitted On</th>
                  <th>DRC Status</th>
                  <th>Reviewed On</th>
                  <th>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {reviewCycles.map((row) => (
                  <tr key={row.reviewMonthYear}>
                    <td>{row.reviewMonthYear}</td>
                    <td>{row.reviewType}</td>
                    <td><span className={`status-pill ${row.scholarStatus.toLowerCase().replace(" ", "-")}`}>{row.scholarStatus}</span></td>
                    <td>{row.scholarSubmittedOn}</td>
                    <td>{row.scholarAbsent}</td>
                    <td><span className={`status-pill ${row.supervisorStatus.toLowerCase()}`}>{row.supervisorStatus}</span></td>
                    <td>{row.supervisorSubmittedOn}</td>
                    <td><span className={`status-pill ${row.rac1Status.toLowerCase()}`}>{row.rac1Status}</span></td>
                    <td>{row.rac1SubmittedOn}</td>
                    <td><span className={`status-pill ${row.rac2Status.toLowerCase()}`}>{row.rac2Status}</span></td>
                    <td>{row.rac2SubmittedOn}</td>
                    <td><span className={`status-pill ${row.drcStatus.toLowerCase()}`}>{row.drcStatus}</span></td>
                    <td>{row.drcReviewedOn}</td>
                    <td><span className={`status-pill ${row.outcome.toLowerCase()}`}>{row.outcome}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="module-block">
            <h4>Review States Supported</h4>
            <div className="state-list">
              <span className="status-pill submitted">Submitted</span>
              <span className="status-pill reviewed">Reviewed</span>
              <span className="status-pill pending">Pending</span>
              <span className="status-pill absent">Absent</span>
              <span className="status-pill muted">--</span>
            </div>
          </div>
        </div>
      </div>
      <div className="module-card">
        <div className="module-header">
          <h3>Document & Interaction Layer</h3>
        </div>
        <div className="module-body">
          <table className="module-table">
            <thead>
              <tr>
                <th>Document Type</th>
                <th>Uploaded File</th>
                <th>Uploaded By</th>
                <th>Uploaded On</th>
                <th>Version Number</th>
                <th>Locked After Approval</th>
                <th>Visibility Scope</th>
              </tr>
            </thead>
            <tbody>
              {documentRecords.map((doc) => (
                <tr key={doc.file}>
                  <td>{doc.type}</td>
                  <td><a className="doc-link" href="#">{doc.file}</a></td>
                  <td>{doc.uploadedBy}</td>
                  <td>{doc.uploadedOn}</td>
                  <td>{doc.version}</td>
                  <td>{doc.locked}</td>
                  <td>{doc.visibility}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="module-card">
        <div className="module-header">
          <h3>Timeline & Audit</h3>
        </div>
        <div className="module-body">
          <table className="module-table">
            <thead>
              <tr>
                <th>Review Cycle ID</th>
                <th>Reviewer Role</th>
                <th>Action Timestamp</th>
                <th>Action Performed</th>
                <th>Remarks / Comments</th>
                <th>Audit Log Reference</th>
              </tr>
            </thead>
            <tbody>
              {auditTimeline.map((log) => (
                <tr key={`${log.reviewCycleId}-${log.actionTimestamp}`}>
                  <td>{log.reviewCycleId}</td>
                  <td>{log.reviewerRole}</td>
                  <td>{log.actionTimestamp}</td>
                  <td>{log.actionPerformed}</td>
                  <td>{log.remarks}</td>
                  <td>{log.auditRef}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface EligibilityStatus {
  isEligible: boolean;
  issues: string[];
  warnings: string[];
  details: {
    yearsCompleted: number;
    racMeetingsCount: number;
    hasPreTalk: boolean;
    coursesCompleted: boolean;
    feeArrears: number;
    currentExtensions: number;
    maxAllowedExtensions: number;
  };
}

type ApplicationFormType = "extension" | "supervisor" | "pretalk" | "reregistration";

const applicationFormTitles: Record<ApplicationFormType, string> = {
  supervisor: "Change of Supervisor",
  pretalk: "Pre-talk Application",
  extension: "Extension Application",
  reregistration: "Re-Registration Application",
};

const applicationSubmitTypes: Record<ApplicationFormType, string> = {
  supervisor: "Supervisor Change",
  pretalk: "Pre-Talk",
  extension: "Extension",
  reregistration: "Re-Registration",
};

function ScholarApplicationFormPage({
  user,
  formType,
  onBack,
}: {
  user: User;
  formType: ApplicationFormType;
  onBack: () => void;
}) {
  const [eligibility, setEligibility] = useState<EligibilityStatus | null>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(formType === "extension");
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: applications = [], isLoading } = useQuery<Application[]>({
    queryKey: ["/api/applications", { userId: user.id }],
    queryFn: () => fetch(`/api/applications?userId=${user.id}`).then(res => res.json())
  });

    const checkEligibility = async () => {
      try {
        setEligibilityLoading(true);
        setEligibilityError(null);
        const scholarIdentifier = user.scholarId ?? String(user.id);
        const res = await fetch(`/api/extensions/check-eligibility/${scholarIdentifier}`);
        if (!res.ok) {
          throw new Error("Unable to check eligibility");
        }
        const data = await res.json();
        setEligibility(data.eligibility);
      } catch (error: any) {
        setEligibilityError(error?.message || "Failed to check eligibility");
      } finally {
        setEligibilityLoading(false);
      }
    };

    checkEligibility();
  }, [formType, user.id, user.scholarId]);

  const submitMutation = useMutation({
    mutationFn: async (data: { type: string; details: Record<string, unknown> }) => {
      const res = await apiRequest("POST", "/api/applications", {
        userId: user.id,
        type: data.type,
        details: data.details
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({
        title: "Application submitted",
        description: "Your application was submitted successfully and will be reviewed by the Supervisor."
      });
    },
    onError: (error: any) => {
      const message = typeof error?.message === "string" ? error.message : "Failed to submit application";
      toast({
        title: "Submission failed",
        description: message,
        variant: "destructive"
      });
    }
  });

  const renderForm = () => {
    const submitType = applicationSubmitTypes[formType];
    switch (formType) {
      case "extension":
        return (
          <ExtensionForm
            user={user}
            onSubmit={(details) => submitMutation.mutate({ type: submitType, details })}
            onBack={onBack}
            isSubmitting={submitMutation.isPending}
          />
        );
      case "supervisor":
        return (
          <SupervisorChangeForm
            user={user}
            onSubmit={(details) => submitMutation.mutate({ type: submitType, details })}
            onBack={onBack}
            isSubmitting={submitMutation.isPending}
          />
        );
      case "pretalk":
        return (
          <PreTalkForm
            user={user}
            onSubmit={(details) => submitMutation.mutate({ type: submitType, details })}
            onBack={onBack}
            isSubmitting={submitMutation.isPending}
          />
        );
      case "reregistration":
        return (
          <ReRegistrationForm
            user={user}
            onSubmit={(details) => submitMutation.mutate({ type: submitType, details })}
            onBack={onBack}
            isSubmitting={submitMutation.isPending}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="applications-container">
      <div className="applications-title">{applicationFormTitles[formType]}</div>

      {formType === "extension" && eligibilityLoading && (
        <div style={{ textAlign: "center", padding: "40px" }}>Checking extension eligibility...</div>
      )}

      {formType === "extension" && !eligibilityLoading && eligibilityError && (
        <div className="form-container" style={{ textAlign: "center" }}>
          <p style={{ color: "#e74c3c", marginBottom: "20px" }}>{eligibilityError}</p>
          <button className="submit-btn" onClick={onBack} style={{ background: "#6c757d" }}>Back</button>
        </div>
      )}

      {formType === "extension" && !eligibilityLoading && eligibility && !eligibility.isEligible && (
        <div className="form-container" style={{ textAlign: "center" }}>
          <h3 style={{ color: "#e74c3c", marginBottom: "10px" }}>Extension Not Eligible</h3>
          <p style={{ color: "#666", marginBottom: "20px" }}>
            {eligibility.issues?.[0] || "You are not eligible for a Ph.D extension at this time."}
          </p>
          <button className="submit-btn" onClick={onBack} style={{ background: "#6c757d" }}>Back</button>
        </div>
      )}

      {formType !== "extension" || (!eligibilityLoading && !eligibilityError && (!eligibility || eligibility.isEligible)) ? renderForm() : null}
    </div>
  );
}

function ScholarApplicationsTracker({ user }: { user: User }) {
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const { data: applications = [], isLoading } = useQuery<Application[]>({
    queryKey: ["/api/applications", { scholarId: user.scholarId }],
    queryFn: () => fetch(`/api/applications?scholarId=${user.scholarId}`).then(res => res.json())
  });

  const getStageProgress = (stage: string, status: string) => {
    if (status === "Rejected") return { percent: 100, label: "Rejected", color: "#e74c3c" };
    if (status === "Approved") return { percent: 100, label: "Approved", color: "#27ae60" };
    switch (stage) {
      case "supervisor": return { percent: 10, label: "With Supervisor", color: "#2c7a7b" };
      case "drc": return { percent: 25, label: "At DRC", color: "#3498db" };
      case "irc": return { percent: 50, label: "At IRC", color: "#f39c12" };
      case "doaa": return { percent: 75, label: "At DoAA", color: "#9b59b6" };
      case "completed": return { percent: 100, label: "Completed", color: "#27ae60" };
      default: return { percent: 0, label: "Submitted", color: "#95a5a6" };
    }
  };

  return (
    <div className="applications-container">
      <div className="applications-title">Track My Application</div>

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

      {selectedApp && <ApplicationDetailModal app={selectedApp} onClose={() => setSelectedApp(null)} />}
    </div>
  );
}

function ScholarThesisSubmission() {
  return (
    <div className="applications-container">
      <div className="applications-title">Thesis Submission</div>
      <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
        Thesis submission routing is ready. Content will be added soon.
      </div>
    </div>
  );
}

function ApplicationDetailModal({ app, onClose }: { app: Application; onClose: () => void }) {
  const { data: reviews = [] } = useQuery<ApplicationReview[]>({
    queryKey: ["/api/applications", app.id, "reviews"],
    queryFn: () => fetch(`/api/applications/${app.id}/reviews`).then(res => res.json())
  });

  const stages = ["supervisor", "drc", "irc", "doaa", "completed"];
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
            {["Supervisor", "DRC", "IRC", "DoAA", "Complete"].map((label, idx) => {
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

  const getScholarName = (userId: number) => {
    const scholar = allUsers.find(u => u.id === userId);
    return scholar?.name || `User ${userId}`;
  };

  const getScholarIdentifier = (userId: number) => {
    const scholar = allUsers.find(u => u.id === userId);
    return scholar?.scholarId || `User ${userId}`;
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
                  <div style={{ fontSize: "13px", color: "#666" }}>Scholar: {getScholarName(app.userId)} | Submitted: {new Date(app.submissionDate).toLocaleDateString()}</div>
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
                <strong>Scholar:</strong> {getScholarName(selectedApp.userId)} ({getScholarIdentifier(selectedApp.userId)})<br />
                <strong>Type:</strong> {selectedApp.type}<br />
                <strong>Submitted:</strong> {new Date(selectedApp.submissionDate).toLocaleDateString()}
              </div>
              {selectedApp.details && (
                <div style={{ background: "#f8f9fa", padding: "15px", borderRadius: "6px", marginBottom: "20px" }}>
                  <strong>Details:</strong>
                  <pre style={{ fontSize: "13px", whiteSpace: "pre-wrap", marginTop: "10px" }}>{JSON.stringify(selectedApp.details, null, 2)}</pre>
                </div>
              )}
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
      <div style={{ display: "flex", gap: "10px" }}>
        <button className="submit-btn" onClick={() => onSubmit(formData)} disabled={isSubmitting} data-testid="button-submit-form">{isSubmitting ? "Submitting..." : "Submit Application"}</button>
        <button className="submit-btn" onClick={onBack} style={{ background: "#6c757d" }}>Back to Tracking</button>
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
      <div style={{ display: "flex", gap: "10px" }}>
        <button className="submit-btn" onClick={() => onSubmit(formData)} disabled={isSubmitting}>{isSubmitting ? "Submitting..." : "Submit Application"}</button>
        <button className="submit-btn" onClick={onBack} style={{ background: "#6c757d" }}>Back to Tracking</button>
      </div>
    </div>
  );
}

function ExtensionForm({ user, onSubmit, onBack, isSubmitting }: { user: User; onSubmit: (details: Record<string, unknown>) => void; onBack: () => void; isSubmitting: boolean }) {
  const [formData, setFormData] = useState({
    candidateName: user.name,
    joiningDate: user.joiningDate || "",
    extensionDuration: "",
    reason: "",
    timeline: ""
  });
  return (
    <div className="form-container">
      <div style={{ textAlign: "center", marginBottom: "25px" }}>
        <div style={{ fontSize: "18px", fontWeight: "bold", color: "#0b6a55" }}>GANDHI INSTITUTE OF TECHNOLOGY AND MANAGEMENT (GITAM)</div>
      </div>

      <div className="form-title">Application for Extension of Ph.D. Program Duration</div>
      <div className="form-group"><label>Name of the Candidate</label><input type="text" value={formData.candidateName} onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })} /></div>
      <div className="form-group"><label>Date of Joining</label><input type="text" value={formData.joiningDate} onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })} /></div>
      <div className="form-group"><label>Required Extension Duration</label><input type="text" value={formData.extensionDuration} onChange={(e) => setFormData({ ...formData, extensionDuration: e.target.value })} placeholder="e.g., 6 months" /></div>
      <div className="form-group"><label>Reason for Extension</label><textarea value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="Explain why you need the extension" style={{ height: "80px" }} /></div>
      <div className="form-group"><label>Expected Timeline</label><textarea value={formData.timeline} onChange={(e) => setFormData({ ...formData, timeline: e.target.value })} placeholder="When do you expect to complete?" style={{ height: "80px" }} /></div>
      <div style={{ display: "flex", gap: "10px" }}>
        <button className="submit-btn" onClick={() => onSubmit(formData)} disabled={isSubmitting}>{isSubmitting ? "Submitting..." : "Submit Application"}</button>
        <button className="submit-btn" onClick={onBack} style={{ background: "#6c757d" }}>Back to Tracking</button>
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
      <div style={{ display: "flex", gap: "10px" }}>
        <button className="submit-btn" onClick={() => onSubmit(formData)} disabled={isSubmitting}>{isSubmitting ? "Submitting..." : "Submit Application"}</button>
        <button className="submit-btn" onClick={onBack} style={{ background: "#6c757d" }}>Back to Tracking</button>
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

function ScholarDocHub({ user }: { user: User }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAppId, setSelectedAppId] = useState<number | "">("");
  const [documentType, setDocumentType] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: applications = [] } = useQuery({
    queryKey: ["/api/applications", { userId: user.id }],
    queryFn: () => fetch(`/api/applications?userId=${user.id}`).then((res) => res.json()),
  });

  useEffect(() => {
    if (!selectedAppId && applications.length > 0) {
      setSelectedAppId(applications[0].id);
    }
  }, [applications, selectedAppId]);

  const activeApplicationId = selectedAppId ? Number(selectedAppId) : undefined;

  const { data: documents = [], isLoading: isLoadingDocuments } = useQuery({
    queryKey: ["/api/applications", activeApplicationId, "documents"],
    queryFn: () =>
      fetch(`/api/applications/${activeApplicationId}/documents`).then((res) => res.json()),
    enabled: Boolean(activeApplicationId),
  });

  const { data: checklist = [] } = useQuery({
    queryKey: ["/api/applications", activeApplicationId, "document-checklist"],
    queryFn: () =>
      fetch(`/api/applications/${activeApplicationId}/document-checklist`).then((res) =>
        res.json(),
      ),
    enabled: Boolean(activeApplicationId),
  });

  const handleUpload = async () => {
    if (!activeApplicationId) {
      toast({
        variant: "destructive",
        title: "Select an application",
        description: "Choose an application before uploading documents.",
      });
      return;
    }

    if (!documentType.trim()) {
      toast({
        variant: "destructive",
        title: "Document type required",
        description: "Provide a document type before uploading.",
      });
      return;
    }

    if (!selectedFile) {
      toast({
        variant: "destructive",
        title: "File required",
        description: "Choose a file to upload.",
      });
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg"];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast({
        variant: "destructive",
        title: "Unsupported file type",
        description: "Upload a PDF, PNG, or JPEG document.",
      });
      return;
    }

    if (selectedFile.size > maxSize) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Document uploads are limited to 10 MB.",
      });
      return;
    }

    setIsUploading(true);

    try {
      const uploadUrlResponse = await apiRequest(
        "POST",
        `/api/applications/${activeApplicationId}/upload-url`,
        {
          documentType,
          fileName: selectedFile.name,
          mimeType: selectedFile.type,
          fileSize: selectedFile.size,
        },
      );

      const uploadUrlPayload = await uploadUrlResponse.json();

      const uploadResult = await fetch(uploadUrlPayload.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": selectedFile.type,
        },
        body: selectedFile,
      });

      if (!uploadResult.ok) {
        throw new Error("Upload failed. Please try again.");
      }

      await apiRequest("POST", `/api/applications/${activeApplicationId}/upload-document`, {
        documentType,
        fileName: selectedFile.name,
        fileUrl: uploadUrlPayload.downloadUrl,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
        objectKey: uploadUrlPayload.objectKey,
      });

      toast({
        title: "Upload complete",
        description: "Your document was uploaded successfully.",
      });

      setDocumentType("");
      setSelectedFile(null);
      queryClient.invalidateQueries({
        queryKey: ["/api/applications", activeApplicationId, "documents"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/applications", activeApplicationId, "document-checklist"],
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error?.message || "Unable to upload the document.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ color: "#0b6a55", marginBottom: "20px" }}>Document Hub</h2>
      <div
        style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "10px",
          border: "1px solid #e6e6e6",
          marginBottom: "20px",
        }}
      >
        <p style={{ color: "#666" }}>
          Upload and manage your research documents here. Supported formats: PDF, PNG, JPEG (max
          10&nbsp;MB).
        </p>
        <div style={{ display: "grid", gap: "12px", marginTop: "15px" }}>
          <div className="form-group">
            <label>Application</label>
            <select
              value={selectedAppId}
              onChange={(event) => {
                const value = event.target.value;
                setSelectedAppId(value ? Number(value) : "");
              }}
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ddd" }}
            >
              {applications.length === 0 && <option value="">No applications found</option>}
              {applications.map((app: Application) => (
                <option key={app.id} value={app.id}>
                  {app.type} (#{app.id})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Document Type</label>
            <input
              type="text"
              value={documentType}
              onChange={(event) => setDocumentType(event.target.value)}
              placeholder="e.g., progress_report"
            />
          </div>
          <div className="form-group">
            <label>Choose File</label>
            <input
              type="file"
              accept=".pdf,image/png,image/jpeg"
              onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
            />
          </div>
          <button
            className="submit-btn"
            style={{ marginTop: "10px", width: "fit-content" }}
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? "Uploading..." : "Upload Document"}
          </button>
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "10px",
          border: "1px solid #e6e6e6",
          marginBottom: "20px",
        }}
      >
        <h3 style={{ marginBottom: "10px", color: "#0b6a55" }}>Document Checklist</h3>
        {checklist.length === 0 ? (
          <p style={{ color: "#666" }}>No checklist available for this application.</p>
        ) : (
          <table className="info-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Status</th>
                <th>Uploads</th>
              </tr>
            </thead>
            <tbody>
              {checklist.map((item: any) => (
                <tr key={item.documentType}>
                  <td>{item.displayName}</td>
                  <td>{item.status}</td>
                  <td>{item.uploadedCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", border: "1px solid #e6e6e6" }}>
        <h3 style={{ marginBottom: "10px", color: "#0b6a55" }}>Uploaded Documents</h3>
        {isLoadingDocuments ? (
          <p style={{ color: "#666" }}>Loading documents...</p>
        ) : documents.length === 0 ? (
          <p style={{ color: "#666" }}>No documents uploaded yet.</p>
        ) : (
          <table className="info-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Type</th>
                <th>Size</th>
                <th>Status</th>
                <th>Download</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc: any) => (
                <tr key={doc.id}>
                  <td>{doc.fileName}</td>
                  <td>{doc.mimeType || "N/A"}</td>
                  <td>{doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : "N/A"}</td>
                  <td>{doc.isVerified ? "Verified" : "Pending"}</td>
                  <td>
                    <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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

function SupervisorDashboard({ user }: { user: User }) {
  const [supervisorTab, setSupervisorTab] = useState<"scholars" | "applications">("scholars");
  const { toast } = useToast();

  const { data: scholars = [], isLoading: isLoadingScholars } = useQuery({
    queryKey: ["/api/supervisors/scholars"],
    queryFn: () => fetch("/api/supervisors/scholars").then(res => {
      if (!res.ok) throw new Error("Failed to fetch scholars");
      return res.json();
    }),
    enabled: supervisorTab === "scholars"
  });

  const { data: applications = [], isLoading: isLoadingApplications } = useQuery({
    queryKey: ["/api/supervisors/applications"],
    queryFn: () => fetch("/api/supervisors/applications").then(res => {
      if (!res.ok) throw new Error("Failed to fetch applications");
      return res.json();
    }),
    enabled: supervisorTab === "applications"
  });

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ color: "#0b6a55", marginBottom: "20px" }}>Supervisor Dashboard</h2>
      
      <div style={{ marginBottom: "20px", borderBottom: "2px solid #0b6a55" }}>
        <button 
          onClick={() => setSupervisorTab("scholars")}
          style={{
            padding: "12px 20px",
            marginRight: "10px",
            background: supervisorTab === "scholars" ? "#0b6a55" : "#f0f0f0",
            color: supervisorTab === "scholars" ? "white" : "#333",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          👥 My Scholars ({scholars.length})
        </button>
        <button 
          onClick={() => setSupervisorTab("applications")}
          style={{
            padding: "12px 20px",
            background: supervisorTab === "applications" ? "#0b6a55" : "#f0f0f0",
            color: supervisorTab === "applications" ? "white" : "#333",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          📋 Applications ({applications.length})
        </button>
      </div>

      {supervisorTab === "scholars" && (
        <div>
          {isLoadingScholars ? (
            <div style={{ textAlign: "center", padding: "40px" }}>Loading scholars...</div>
          ) : scholars.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>No scholars assigned to you yet.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
              {scholars.map((scholar: any) => (
                <div key={scholar.id} style={{
                  background: "white",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "20px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                }}>
                  <div style={{ marginBottom: "15px", borderBottom: "2px solid #0b6a55", paddingBottom: "10px" }}>
                    <h3 style={{ margin: "0 0 5px 0", color: "#0b6a55" }}>{scholar.name}</h3>
                    <p style={{ margin: "5px 0", color: "#666", fontSize: "14px" }}>
                      <strong>Scholar ID:</strong> {scholar.scholarId}
                    </p>
                  </div>
                  <div style={{ fontSize: "14px", color: "#333" }}>
                    <p style={{ margin: "8px 0" }}><strong>Department:</strong> {scholar.department || "N/A"}</p>
                    <p style={{ margin: "8px 0" }}><strong>Research Area:</strong> {scholar.researchArea || "N/A"}</p>
                    <p style={{ margin: "8px 0" }}><strong>Joining Date:</strong> {scholar.joiningDate ? new Date(scholar.joiningDate).toLocaleDateString() : "N/A"}</p>
                    <p style={{ margin: "8px 0" }}><strong>Status:</strong> <span style={{ color: "#27ae60", fontWeight: "bold" }}>{scholar.status || "Active"}</span></p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {supervisorTab === "applications" && (
        <div>
          {isLoadingApplications ? (
            <div style={{ textAlign: "center", padding: "40px" }}>Loading applications...</div>
          ) : applications.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>No applications from your scholars yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {applications.map((app: any) => (
                <div key={app.id} style={{
                  background: "white",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "20px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "15px" }}>
                    <div>
                      <h3 style={{ margin: "0 0 5px 0", color: "#0b6a55" }}>{app.type}</h3>
                      <p style={{ margin: "5px 0", color: "#666", fontSize: "14px" }}>
                        Scholar User ID: {app.userId}
                      </p>
                    </div>
                    <span style={{
                      padding: "5px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      background: app.status === "Approved" ? "#d4edda" : app.status === "Rejected" ? "#f8d7da" : "#e2e3e5",
                      color: app.status === "Approved" ? "#155724" : app.status === "Rejected" ? "#721c24" : "#383d41"
                    }}>
                      {app.status}
                    </span>
                  </div>
                  <div style={{ fontSize: "14px", color: "#666" }}>
                    <p style={{ margin: "5px 0" }}><strong>Current Stage:</strong> {app.currentStage.toUpperCase()}</p>
                    <p style={{ margin: "5px 0" }}><strong>Submitted:</strong> {new Date(app.submissionDate).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
