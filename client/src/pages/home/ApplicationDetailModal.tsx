import { useQuery } from "@tanstack/react-query";
import type { Application, ApplicationReview } from "@/types/gscholar";

interface ApplicationDetailModalProps {
  app: Application;
  onClose: () => void;
}

export default function ApplicationDetailModal({
  app,
  onClose,
}: ApplicationDetailModalProps) {
  const { data: reviews = [] } = useQuery<ApplicationReview[]>({
    queryKey: ["/api/applications", app.id, "reviews"],
    queryFn: () =>
      fetch(`/api/applications/${app.id}/reviews`).then((res) => res.json()),
  });

  const stages = ["supervisor", "drc", "irc", "doaa", "completed"];
  const currentIndex = stages.indexOf(app.currentStage);

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div
        className="modal-content application-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">{app.type} Application</div>
          <button className="close-btn" onClick={onClose} data-testid="button-close-modal">
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="application-stages">
            {["Supervisor", "DRC", "IRC", "DoAA", "Complete"].map((label, idx) => {
              const stageKey = stages[idx];
              const review = reviews.find((r) => r.stage === stageKey);
              const isPast = idx < currentIndex || app.status === "Approved";
              const isCurrent = idx === currentIndex && app.status === "Pending";
              const isRejected = review?.decision === "rejected";
              const statusClass = isRejected
                ? "rejected"
                : isPast
                  ? "approved"
                  : isCurrent
                    ? "current"
                    : "pending";

              return (
                <div key={label} className="application-stage">
                  <div className={`stage-bubble ${statusClass}`}>{idx + 1}</div>
                  <div className="stage-label">{label}</div>
                  <div className="stage-status">
                    {review
                      ? isRejected
                        ? "Rejected"
                        : "Approved"
                      : isCurrent
                        ? "Under Review"
                        : isPast
                          ? "Passed"
                          : "Pending"}
                  </div>
                  {review && (
                    <div className="stage-date">
                      {new Date(review.reviewDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {reviews.length > 0 && (
            <div className="review-history">
              <h4 className="review-history-title">Review History</h4>
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className={`review-card ${
                    review.decision === "approved" ? "approved" : "rejected"
                  }`}
                >
                  <div className="review-card-title">
                    {review.stage.toUpperCase()} -
                    {review.decision === "approved" ? " Approved" : " Rejected"}
                  </div>
                  <div className="review-card-remarks">Remarks: {review.remarks}</div>
                  <div className="review-card-date">
                    {new Date(review.reviewDate).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div
            className={`application-status-summary ${
              app.status === "Approved"
                ? "approved"
                : app.status === "Rejected"
                  ? "rejected"
                  : "pending"
            }`}
          >
            <strong>Status:</strong> {app.status}
            <br />
            <strong>Current Stage:</strong> {app.currentStage.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}
