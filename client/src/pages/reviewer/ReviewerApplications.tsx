import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApplicationsByStage, useSubmitReview } from "@/hooks/use-application-reviews";
import type { Application } from "@shared/schema";
import type { PublicUser } from "@/lib/types";

export default function ReviewerApplications({ user }: { user: PublicUser }) {
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [remarks, setRemarks] = useState("");

  const { data: pendingApps = [], isLoading } = useApplicationsByStage(user.role) as {
    data: Application[] | undefined;
    isLoading: boolean;
  };

  const { data: allUsers = [] } = useQuery<PublicUser[]>({
    queryKey: ["/api/users"],
    queryFn: () => fetch("/api/users").then((res) => res.json()),
  });

  const getScholarName = (scholarId: string) => {
    const scholar = allUsers.find((u) => u.scholarId === scholarId);
    return scholar?.name || scholarId;
  };

  const reviewMutation = useSubmitReview(selectedApp?.id ?? 0);

  const handleReview = (decision: "approved" | "rejected") => {
    if (!selectedApp) return;
    if (!remarks.trim()) {
      alert("Please provide remarks for your decision.");
      return;
    }
    if (!user.username) {
      alert("Employee ID is missing. Please log in again.");
      return;
    }
    reviewMutation.mutate({ reviewerId: user.username, decision, remarks }, {
      onSuccess: () => {
        alert(`Application ${decision === "approved" ? "approved" : "rejected"} successfully!`);
        setSelectedApp(null);
        setRemarks("");
      },
    });
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
                  <div style={{ fontSize: "13px", color: "#666" }}>Scholar: {getScholarName(app.scholarId)} | Submitted: {new Date(app.submissionDate as unknown as string).toLocaleDateString()}</div>
                </div>
                <div className="status-badge in-progress">Awaiting Review</div>
              </div>
              {Boolean(app.details) && (
                <div style={{ background: "#f8f9fa", padding: "15px", borderRadius: "6px", marginBottom: "15px" }}>
                  <strong>Application Details:</strong>
                  <pre style={{ fontSize: "13px", whiteSpace: "pre-wrap", marginTop: "10px" }}>{JSON.stringify(app.details as Record<string, unknown>, null, 2)}</pre>
                </div>
              )}
              <button type="button" className="submit-btn" onClick={() => setSelectedApp(app)} style={{ marginRight: "10px" }} data-testid={`button-review-${app.id}`}>Review Application</button>
            </div>
          ))}
        </div>
      )}

      {selectedApp && (
        <div className="modal-overlay active" onClick={() => setSelectedApp(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
            <div className="modal-header">
              <div className="modal-title">Review: {selectedApp.type}</div>
              <button type="button" className="close-btn" onClick={() => setSelectedApp(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: "20px" }}>
                <strong>Scholar:</strong> {getScholarName(selectedApp.scholarId)}<br />
                <strong>Type:</strong> {selectedApp.type}<br />
                <strong>Submitted:</strong> {new Date(selectedApp.submissionDate as unknown as string).toLocaleDateString()}
              </div>
              {Boolean(selectedApp.details) && (
                <div style={{ background: "#f8f9fa", padding: "15px", borderRadius: "6px", marginBottom: "20px" }}>
                  <strong>Details:</strong>
                  <pre style={{ fontSize: "13px", whiteSpace: "pre-wrap", marginTop: "10px" }}>{JSON.stringify(selectedApp.details as Record<string, unknown>, null, 2)}</pre>
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
                <button type="button" className="submit-btn" style={{ background: "#27ae60", flex: 1 }} onClick={() => handleReview("approved")} disabled={reviewMutation.isPending} data-testid="button-approve">
                  {reviewMutation.isPending ? "Processing..." : "Approve"}
                </button>
                <button type="button" className="submit-btn" style={{ background: "#e74c3c", flex: 1 }} onClick={() => handleReview("rejected")} disabled={reviewMutation.isPending} data-testid="button-reject">
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
