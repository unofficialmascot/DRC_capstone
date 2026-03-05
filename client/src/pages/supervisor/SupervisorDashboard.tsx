import { useState } from "react";
import { useApplications } from "@/hooks/use-applications";
import { useApplicationById, useSubmitReview } from "@/hooks/use-application-reviews";
import { useToast } from "@/hooks/use-toast";
import ApplicationDetailFormView from "@/components/applications/ApplicationDetailFormView";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Application } from "@shared/schema";
import type { PublicUser } from "@/lib/types";

type ApplicationDetailsPayload = Application;

export default function SupervisorDashboard({ user }: { user: PublicUser }) {
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [decision, setDecision] = useState<"approved" | "rejected">("approved");
  const { toast } = useToast();
  const reviewerKey = user.employeeId || user.scholarId || user.username || user.email;

  const { data: applications = [], isLoading } = useApplications() as {
    data: Application[] | undefined;
    isLoading: boolean;
  };

  const pendingApplications = applications.filter(
    (app) => app.status === "Pending" && app.currentStage === "supervisor",
  );

  const reviewMutation = useSubmitReview(selectedApp?.id ?? 0);

  const { data: selectedApplicationDetail } = useApplicationById(selectedApp?.id ?? 0) as {
    data: ApplicationDetailsPayload | undefined;
  };

  const displayApplication = (selectedApplicationDetail ?? selectedApp) as ApplicationDetailsPayload | null;

  const getDisplayStatus = (app: Application) => {
    if (app.status === "Pending" && app.currentStage !== "supervisor") {
      return "Submitted";
    }
    return app.status;
  };

  const handleOpenDetails = (application: Application) => {
    setSelectedApp(application);
    setShowReviewForm(false);
    setRemarks("");
  };

  const handleCloseDetails = (open: boolean) => {
    if (open) {
      return;
    }

    setSelectedApp(null);
    setShowReviewForm(false);
    setRemarks("");
  };

  const handleSubmitReview = () => {
    if (!selectedApp) {
      return;
    }

    if (!remarks.trim()) {
      toast({
        title: "Action Required",
        description: "Please provide remarks for your decision.",
        variant: "destructive",
      });
      return;
    }

    if (!reviewerKey) {
      toast({
        title: "Action Required",
        description: "Employee ID is missing. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    reviewMutation.mutate(
      { reviewerId: reviewerKey, decision, remarks },
      {
        onSuccess: () => {
          setSelectedApp(null);
          setShowReviewForm(false);
          setRemarks("");
          toast({ title: "Success", description: "Review submitted successfully!" });
        },
        onError: (error: Error) => {
          toast({
            title: "Error",
            description: error.message || "Failed to submit review",
            variant: "destructive",
          });
        },
      },
    );
  };

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
                    <span
                      className="pill"
                      style={{
                        background: getDisplayStatus(app) === "Submitted"
                          ? "#27ae60"
                          : app.status === "Approved"
                            ? "#27ae60"
                            : app.status === "Rejected"
                              ? "#e74c3c"
                              : "#f39c12",
                        color: "white",
                        padding: "4px 10px",
                        borderRadius: "15px",
                        fontSize: "13px",
                      }}
                    >
                      {getDisplayStatus(app)}
                    </span>
                  </td>
                  <td style={{ textTransform: "capitalize" }}>{app.currentStage}</td>
                  <td>
                    <button
                      type="button"
                      className="submit-btn"
                      onClick={() => handleOpenDetails(app)}
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

      <Dialog open={Boolean(selectedApp && displayApplication)} onOpenChange={handleCloseDetails}>
        <DialogContent
          style={{
            maxWidth: "980px",
            width: "calc(100vw - 2rem)",
            maxHeight: "90vh",
            overflowY: "auto",
          }}
        >
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>

          {displayApplication && (
            <>
              <ApplicationDetailFormView
                application={displayApplication}
                scholarDisplayName={displayApplication.scholarId}
              />

              {selectedApp?.status === "Pending" && selectedApp.currentStage === "supervisor" && (
                <div style={{ marginTop: "16px", borderTop: "1px solid #e6e6e6", paddingTop: "16px" }}>
                  <h4 style={{ color: "#0b6a55", marginBottom: "12px" }}>Review Application</h4>

                  {!showReviewForm ? (
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        type="button"
                        className="submit-btn"
                        onClick={() => {
                          setDecision("approved");
                          setShowReviewForm(true);
                        }}
                        style={{ background: "#27ae60" }}
                      >
                        ✓ Approve
                      </button>
                      <button
                        type="button"
                        className="submit-btn"
                        onClick={() => {
                          setDecision("rejected");
                          setShowReviewForm(true);
                        }}
                        style={{ background: "#e74c3c" }}
                      >
                        ✗ Reject
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ marginBottom: "12px" }}>
                        <strong style={{ color: decision === "approved" ? "#27ae60" : "#e74c3c" }}>
                          Decision: {decision === "approved" ? "Approve" : "Reject"}
                        </strong>
                      </div>
                      <textarea
                        value={remarks}
                        onChange={(event) => setRemarks(event.target.value)}
                        placeholder="Provide your remarks for this decision..."
                        rows={4}
                        style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px" }}
                      />
                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          marginTop: "12px",
                          position: "sticky",
                          bottom: 0,
                          background: "#fff",
                          paddingTop: "12px",
                          borderTop: "1px solid #eee",
                        }}
                      >
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
                          onClick={() => {
                            setShowReviewForm(false);
                            setRemarks("");
                          }}
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
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
