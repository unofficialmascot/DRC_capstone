import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiJson } from "@/lib/api";
import { api } from "@shared/routes";
import type { User } from "@/types/gscholar";

interface SupervisorDashboardProps {
  user: User;
}

export default function SupervisorDashboard({}: SupervisorDashboardProps) {
  const [supervisorTab, setSupervisorTab] = useState<
    "scholars" | "applications"
  >("scholars");

  const { data: scholars = [], isLoading: isLoadingScholars } = useQuery({
    queryKey: [api.supervisors.scholars.path],
    queryFn: () => apiJson<any[]>(api.supervisors.scholars.path, { method: api.supervisors.scholars.method }),
    enabled: supervisorTab === "scholars",
  });

  const { data: applications = [], isLoading: isLoadingApplications } = useQuery({
    queryKey: [api.supervisors.applications.path],
    queryFn: () => apiJson<any[]>(api.supervisors.applications.path, { method: api.supervisors.applications.method }),
    enabled: supervisorTab === "applications",
  });

  return (
    <div className="page-section">
      <h2 className="page-title">Supervisor Dashboard</h2>

      <div className="tab-bar">
        <button
          onClick={() => setSupervisorTab("scholars")}
          className={`tab-button ${
            supervisorTab === "scholars" ? "active" : ""
          }`}
        >
          👥 My Scholars ({scholars.length})
        </button>
        <button
          onClick={() => setSupervisorTab("applications")}
          className={`tab-button ${
            supervisorTab === "applications" ? "active" : ""
          }`}
        >
          📋 Applications ({applications.length})
        </button>
      </div>

      {supervisorTab === "scholars" && (
        <div>
          {isLoadingScholars ? (
            <div className="module-loading">Loading scholars...</div>
          ) : scholars.length === 0 ? (
            <div className="module-empty">No scholars assigned to you yet.</div>
          ) : (
            <div className="grid-cards">
              {scholars.map((scholar: any) => (
                <div key={scholar.id} className="scholar-card">
                  <div className="scholar-card-header">
                    <h3 className="scholar-card-title">{scholar.name}</h3>
                    <p className="scholar-card-subtitle">
                      <strong>Scholar ID:</strong> {scholar.scholarId}
                    </p>
                  </div>
                  <div className="scholar-card-body">
                    <p>
                      <strong>Department:</strong> {scholar.department || "N/A"}
                    </p>
                    <p>
                      <strong>Research Area:</strong> {scholar.researchArea || "N/A"}
                    </p>
                    <p>
                      <strong>Joining Date:</strong>{" "}
                      {scholar.joiningDate
                        ? new Date(scholar.joiningDate).toLocaleDateString()
                        : "N/A"}
                    </p>
                    <p>
                      <strong>Status:</strong>{" "}
                      <span className="status-highlight">
                        {scholar.status || "Active"}
                      </span>
                    </p>
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
            <div className="module-loading">Loading applications...</div>
          ) : applications.length === 0 ? (
            <div className="module-empty">No applications from your scholars yet.</div>
          ) : (
            <div className="review-list">
              {applications.map((app: any) => (
                <div key={app.id} className="review-card">
                  <div className="review-card-header">
                    <div>
                      <h3 className="review-card-title">{app.type}</h3>
                      <p className="review-card-subtitle">Scholar User ID: {app.userId}</p>
                    </div>
                    <span
                      className={`status-chip ${
                        app.status === "Approved"
                          ? "approved"
                          : app.status === "Rejected"
                            ? "rejected"
                            : "pending"
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>
                  <div className="review-card-body">
                    <p>
                      <strong>Current Stage:</strong> {app.currentStage.toUpperCase()}
                    </p>
                    <p>
                      <strong>Submitted:</strong>{" "}
                      {new Date(app.submissionDate).toLocaleDateString()}
                    </p>
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
