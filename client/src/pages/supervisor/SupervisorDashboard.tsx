import { useState } from "react";
import { useApplications } from "@/hooks/use-applications";
import { useSubmitReview } from "@/hooks/use-application-reviews";
import type { Application } from "@shared/schema";
import type { PublicUser } from "@/lib/types";

export default function SupervisorDashboard({ user }: { user: PublicUser }) {
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [decision, setDecision] = useState<"approved" | "rejected">("approved");

  const getDisplayStatus = (app: Application) => {
    if (app.status === "Pending" && app.currentStage !== "supervisor") {
      return "Submitted";
    }
    return app.status;
  };

  const { data: applications = [], isLoading } = useApplications() as {
    data: Application[] | undefined;
    isLoading: boolean;
  };

  const pendingApplications = applications.filter(
    (app) => app.status === "Pending" && app.currentStage === "supervisor",
  );

  const reviewMutation = useSubmitReview(selectedApp?.id ?? 0);

  const handleSubmitReview = () => {
    if (!remarks.trim()) {
      alert("Please provide remarks for your decision");
      return;
    }
    if (!user.username) {
      alert("Employee ID is missing. Please log in again.");
      return;
    }
    reviewMutation.mutate(
      { reviewerId: user.username, decision, remarks },
      {
        onSuccess: () => {
          setSelectedApp(null);
          setShowReviewForm(false);
          setRemarks("");
          alert("Review submitted successfully!");
        },
        onError: (error: Error) => {
          alert(error.message || "Failed to submit review");
        },
      },
    );
  };

  if (selectedApp) {
    return (
      <div style={{ padding: "20px" }}>
        <button 
          type="button"
          className="submit-btn" 
          onClick={() => setSelectedApp(null)} 
          style={{ marginBottom: "20px", background: "#666" }}
        >
          ← Back to Applications
        </button>
        
        <h2 style={{ color: "#0b6a55", marginBottom: "20px" }}>Application Details</h2>
        
        <div style={{ background: "#fff", padding: "25px", borderRadius: "10px", border: "1px solid #e6e6e6", marginBottom: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px" }}>
            <div>
              <strong style={{ color: "#0b6a55" }}>Application ID:</strong> {selectedApp.id}
            </div>
            <div>
              <strong style={{ color: "#0b6a55" }}>Scholar ID:</strong> {selectedApp.scholarId}
            </div>
            <div>
              <strong style={{ color: "#0b6a55" }}>Type:</strong> {selectedApp.type}
            </div>
            <div>
              <strong style={{ color: "#0b6a55" }}>Status:</strong> 
              <span style={{
                marginLeft: "10px",
                background: getDisplayStatus(selectedApp) === "Submitted" ? "#27ae60" :
                           selectedApp.status === "Approved" ? "#27ae60" : 
                           selectedApp.status === "Rejected" ? "#e74c3c" : "#f39c12",
                color: "white",
                padding: "4px 10px",
                borderRadius: "15px",
                fontSize: "13px",
              }}>
                {getDisplayStatus(selectedApp)}
              </span>
            </div>
            <div>
              <strong style={{ color: "#0b6a55" }}>Current Stage:</strong> {selectedApp.currentStage}
            </div>
            <div>
              <strong style={{ color: "#0b6a55" }}>Submitted:</strong> {new Date(selectedApp.submissionDate as unknown as string).toLocaleString()}
            </div>
          </div>
          
          {Boolean(selectedApp.details && Object.keys(selectedApp.details as Record<string, unknown>).length > 0) && (
            <>
              <hr style={{ margin: "20px 0", border: "none", borderTop: "1px solid #e6e6e6" }} />
              <h4 style={{ color: "#0b6a55", marginBottom: "15px" }}>Application Details</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "10px" }}>
                {Object.entries(selectedApp.details as Record<string, unknown>).map(([key, value]) => (
                  <div key={key} style={{ padding: "10px", background: "#f8f9fa", borderRadius: "6px" }}>
                    <strong style={{ textTransform: "capitalize", color: "#555" }}>
                      {key.replace(/([A-Z])/g, " $1").trim()}:
                    </strong>
                    <span style={{ marginLeft: "10px", color: "#333" }}>
                      {typeof value === "object" ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {selectedApp.status === "Pending" && selectedApp.currentStage === "supervisor" && (
          <div style={{ background: "#fff", padding: "25px", borderRadius: "10px", border: "1px solid #e6e6e6" }}>
            <h4 style={{ color: "#0b6a55", marginBottom: "15px" }}>Review Application</h4>
            
            {!showReviewForm ? (
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  className="submit-btn"
                  onClick={() => { setDecision("approved"); setShowReviewForm(true); }}
                  style={{ background: "#27ae60" }}
                >
                  ✓ Approve
                </button>
                <button
                  type="button"
                  className="submit-btn"
                  onClick={() => { setDecision("rejected"); setShowReviewForm(true); }}
                  style={{ background: "#e74c3c" }}
                >
                  ✗ Reject
                </button>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: "15px" }}>
                  <strong style={{ color: decision === "approved" ? "#27ae60" : "#e74c3c" }}>
                    Decision: {decision === "approved" ? "Approve" : "Reject"}
                  </strong>
                </div>
                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                    Remarks *
                  </label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e?.target?.value || "")}
                    placeholder="Provide your remarks for this decision..."
                    rows={4}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "6px",
                      fontSize: "14px",
                    }}
                  />
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    className="submit-btn"
                    onClick={handleSubmitReview}
                    disabled={reviewMutation.isPending}
                    style={{ background: decision === "approved" ? "#27ae60" : "#e74c3c" }}
                  >
                    {reviewMutation.isPending ? "Submitting..." : "Submit Review"}
                  </button>
                  <button
                    type="button"
                    className="submit-btn"
                    onClick={() => { setShowReviewForm(false); setRemarks(""); }}
                    style={{ background: "#666" }}
                    disabled={reviewMutation.isPending}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ color: "#0b6a55", marginBottom: "20px" }}>Supervisor Dashboard</h2>
      
      <div className="stats-container" style={{ marginBottom: "30px" }}>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Pending Reviews</div>
            <div className="stat-value">{pendingApplications.length}</div>
          </div>
          <div className="stat-icon" style={{ color: "#f39c12" }}>📄</div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Total Applications</div>
            <div className="stat-value">{applications.length}</div>
          </div>
          <div className="stat-icon" style={{ color: "#0b6a55" }}>📋</div>
        </div>
      </div>

      <h3 style={{ color: "#0b6a55", marginBottom: "15px" }}>Scholar Applications</h3>
      
      {isLoading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>Loading applications...</div>
      ) : applications.length === 0 ? (
        <div style={{ background: "#fff", padding: "40px", borderRadius: "10px", border: "1px solid #e6e6e6", textAlign: "center", color: "#666" }}>
          No applications submitted yet
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #e6e6e6", overflow: "hidden" }}>
          <table className="info-table">
            <thead>
              <tr>
                <th>Scholar ID</th>
                <th>Type</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Stage</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id}>
                  <td>{app.scholarId}</td>
                  <td>{app.type}</td>
                  <td>{new Date(app.submissionDate as unknown as string).toLocaleDateString()}</td>
                  <td>
                    <span className="pill" style={{
                      background: getDisplayStatus(app) === "Submitted" ? "#27ae60" :
                                 app.status === "Approved" ? "#27ae60" : 
                                 app.status === "Rejected" ? "#e74c3c" : "#f39c12",
                      color: "white",
                      padding: "4px 10px",
                      borderRadius: "15px",
                      fontSize: "13px",
                    }}>
                      {getDisplayStatus(app)}
                    </span>
                  </td>
                  <td style={{ textTransform: "capitalize" }}>{app.currentStage}</td>
                  <td>
                    <button 
                      type="button"
                      className="submit-btn" 
                      onClick={() => setSelectedApp(app)}
                      style={{ padding: "6px 12px", fontSize: "13px" }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
