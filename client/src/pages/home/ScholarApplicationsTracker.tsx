import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiJson } from "@/lib/api";
import { api, appendQuery } from "@shared/routes";
import type { Application, User } from "@/types/gscholar";
import ApplicationDetailModal from "@/pages/home/ApplicationDetailModal";

interface ScholarApplicationsTrackerProps {
  user: User;
}

export default function ScholarApplicationsTracker({
  user,
}: ScholarApplicationsTrackerProps) {
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const { data: applications = [], isLoading } = useQuery<Application[]>({
    queryKey: [api.applications.list.path, { scholarId: user.scholarId }],
    queryFn: () => {
      const query = api.applications.list.input?.parse({ scholarId: user.scholarId });
      return apiJson<Application[]>(appendQuery(api.applications.list.path, query), {
        method: api.applications.list.method,
      });
    },
  });

  const getStageProgress = (stage: string, status: string) => {
    if (status === "Rejected") {
      return { percent: 100, label: "Rejected", color: "#e74c3c" };
    }
    if (status === "Approved") {
      return { percent: 100, label: "Approved", color: "#27ae60" };
    }
    switch (stage) {
      case "supervisor":
        return { percent: 10, label: "With Supervisor", color: "#2c7a7b" };
      case "drc":
        return { percent: 25, label: "At DRC", color: "#3498db" };
      case "irc":
        return { percent: 50, label: "At IRC", color: "#f39c12" };
      case "doaa":
        return { percent: 75, label: "At DoAA", color: "#9b59b6" };
      case "completed":
        return { percent: 100, label: "Completed", color: "#27ae60" };
      default:
        return { percent: 0, label: "Submitted", color: "#95a5a6" };
    }
  };

  return (
    <div className="applications-container">
      <div className="applications-title">Track My Application</div>

      {isLoading ? (
        <div className="module-loading">Loading applications...</div>
      ) : applications.length === 0 ? (
        <div className="module-empty">
          No applications found. Submit an application to get started.
        </div>
      ) : (
        <div className="tracking-container">
          {applications.map((app) => {
            const progress = getStageProgress(app.currentStage, app.status);
            return (
              <div className="application-card" key={app.id}>
                <div className="application-header">
                  <div className="application-type">{app.type}</div>
                  <div className="application-submitted">
                    Submitted: {new Date(app.submissionDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="application-body">
                  <div className="current-stage">
                    <div
                      className={`stage-indicator ${
                        app.status === "Pending"
                          ? "in-progress"
                          : app.status === "Approved"
                            ? "completed"
                            : "rejected"
                      }`}
                    ></div>
                    <div className="stage-text">{progress.label}</div>
                  </div>
                  <div className="progress-container">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${progress.percent}%`, background: progress.color }}
                      ></div>
                    </div>
                    <div className="progress-text">
                      <span>Submitted</span>
                      <span>{progress.percent}% Complete</span>
                    </div>
                  </div>
                </div>
                <div className="application-footer">
                  <div
                    className={`status-badge ${
                      app.status === "Pending"
                        ? "in-progress"
                        : app.status === "Approved"
                          ? "completed"
                          : "rejected"
                    }`}
                  >
                    {app.status}
                  </div>
                  <button
                    className="details-btn"
                    onClick={() => setSelectedApp(app)}
                    data-testid={`button-details-${app.id}`}
                  >
                    More Details →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedApp && (
        <ApplicationDetailModal app={selectedApp} onClose={() => setSelectedApp(null)} />
      )}
    </div>
  );
}
