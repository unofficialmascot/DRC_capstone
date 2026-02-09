import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Application, User } from "@/types/gscholar";

interface ReviewerApplicationsProps {
  user: User;
}

export default function ReviewerApplications({ user }: ReviewerApplicationsProps) {
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [remarks, setRemarks] = useState("");
  const queryClient = useQueryClient();

  const { data: pendingApps = [], isLoading } = useQuery<Application[]>({
    queryKey: ["/api/applications/stage", user.role],
    queryFn: () => fetch(`/api/applications/stage/${user.role}`).then((res) => res.json()),
  });

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: () => fetch("/api/users").then((res) => res.json()),
  });

  const getScholarName = (userId: number) => {
    const scholar = allUsers.find((u) => u.id === userId);
    return scholar?.name || `User ${userId}`;
  };

  const getScholarIdentifier = (userId: number) => {
    const scholar = allUsers.find((u) => u.id === userId);
    return scholar?.scholarId || `User ${userId}`;
  };

  const reviewMutation = useMutation({
    mutationFn: async ({
      appId,
      decision,
      remarks: reviewRemarks,
    }: {
      appId: number;
      decision: "approved" | "rejected";
      remarks: string;
    }) => {
      const res = await apiRequest("POST", `/api/applications/${appId}/review`, {
        reviewerId: user.id,
        decision,
        remarks: reviewRemarks,
      });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      alert(
        `Application ${variables.decision === "approved" ? "approved" : "rejected"} successfully!`,
      );
      setSelectedApp(null);
      setRemarks("");
    },
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
    <div className="page-section">
      <h2 className="page-title">Pending Reviews - {user.role.toUpperCase()}</h2>
      {isLoading ? (
        <div className="module-loading">Loading...</div>
      ) : pendingApps.length === 0 ? (
        <div className="empty-card">
          No applications pending at {user.role.toUpperCase()} stage.
        </div>
      ) : (
        <div className="review-list">
          {pendingApps.map((app) => (
            <div key={app.id} className="review-card">
              <div className="review-card-header">
                <div>
                  <div className="review-card-title">{app.type}</div>
                  <div className="review-card-subtitle">
                    Scholar: {getScholarName(app.userId)} | Submitted:{" "}
                    {new Date(app.submissionDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="status-badge in-progress">Awaiting Review</div>
              </div>
              {app.details && (
                <div className="review-details">
                  <strong>Application Details:</strong>
                  <pre className="review-details-pre">
                    {JSON.stringify(app.details, null, 2)}
                  </pre>
                </div>
              )}
              <button
                className="submit-btn review-action"
                onClick={() => setSelectedApp(app)}
                data-testid={`button-review-${app.id}`}
              >
                Review Application
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedApp && (
        <div className="modal-overlay active" onClick={() => setSelectedApp(null)}>
          <div
            className="modal-content review-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title">Review: {selectedApp.type}</div>
              <button className="close-btn" onClick={() => setSelectedApp(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="review-meta">
                <strong>Scholar:</strong> {getScholarName(selectedApp.userId)} ({getScholarIdentifier(selectedApp.userId)})
                <br />
                <strong>Type:</strong> {selectedApp.type}
                <br />
                <strong>Submitted:</strong> {new Date(selectedApp.submissionDate).toLocaleDateString()}
              </div>
              {selectedApp.details && (
                <div className="review-details">
                  <strong>Details:</strong>
                  <pre className="review-details-pre">
                    {JSON.stringify(selectedApp.details, null, 2)}
                  </pre>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Your Remarks (Required)</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Provide your remarks and reasoning for the decision..."
                  className="form-textarea form-textarea-md"
                  data-testid="input-remarks"
                />
              </div>
              <div className="review-actions">
                <button
                  className="submit-btn btn-approve"
                  onClick={() => handleReview("approved")}
                  disabled={reviewMutation.isPending}
                  data-testid="button-approve"
                >
                  {reviewMutation.isPending ? "Processing..." : "Approve"}
                </button>
                <button
                  className="submit-btn btn-reject"
                  onClick={() => handleReview("rejected")}
                  disabled={reviewMutation.isPending}
                  data-testid="button-reject"
                >
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
