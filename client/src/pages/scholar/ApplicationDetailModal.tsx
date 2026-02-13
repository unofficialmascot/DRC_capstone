import { useApplicationReviews } from "@/hooks/use-application-reviews";
import type { Application, ApplicationReview } from "@shared/schema";

export default function ApplicationDetailModal({ app, onClose }: { app: Application; onClose: () => void }) {
  const { data: reviews = [] } = useApplicationReviews(app.id) as { data: ApplicationReview[] | undefined };

  const stages = ["supervisor", "drc", "irc", "doaa", "completed"];
  const currentIndex = stages.indexOf(app.currentStage || "");

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "700px" }}>
        <div className="modal-header">
          <div className="modal-title">{app.type} Application</div>
          <button type="button" className="close-btn" onClick={onClose} data-testid="button-close-modal">×</button>
        </div>
        <div className="modal-body">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px", padding: "20px", background: "#f8f9fa", borderRadius: "8px" }}>
            {["Supervisor", "DRC", "IRC", "DoAA", "Complete"].map((label, idx) => {
              const stageKey = stages[idx];
              const review = reviews.find((r) => r.stage === stageKey);
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
                    margin: "0 auto 10px", fontWeight: "bold",
                  }}>{idx + 1}</div>
                  <div style={{ fontWeight: "600" }}>{label}</div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    {review ? (isRejected ? "Rejected" : "Approved") : isCurrent ? "Under Review" : isPast ? "Passed" : "Pending"}
                  </div>
                  {review && <div style={{ fontSize: "11px", color: "#888" }}>{new Date(review.reviewDate as unknown as string).toLocaleDateString()}</div>}
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
                  <div style={{ fontSize: "12px", color: "#888" }}>{new Date(review.reviewDate as unknown as string).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ padding: "15px", background: app.status === "Approved" ? "#e8f5e9" : app.status === "Rejected" ? "#ffebee" : "#e3f2fd", borderRadius: "8px" }}>
            <strong>Status:</strong> {app.status}<br />
            <strong>Current Stage:</strong> {app.currentStage?.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}
