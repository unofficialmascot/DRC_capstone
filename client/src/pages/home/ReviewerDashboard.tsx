import { useQuery } from "@tanstack/react-query";
import { apiJson } from "@/lib/api";
import { api, buildUrl } from "@shared/routes";
import type { Application } from "@/types/gscholar";

interface ReviewerDashboardProps {
  role: string;
}

export default function ReviewerDashboard({ role }: ReviewerDashboardProps) {
  const { data: pendingApps = [] } = useQuery<Application[]>({
    queryKey: [api.applications.getByStage.path, role],
    queryFn: () =>
      apiJson<Application[]>(buildUrl(api.applications.getByStage.path, { stage: role }), {
        method: api.applications.getByStage.method,
      }),
  });

  return (
    <div className="page-section">
      <h2 className="page-title">{role.toUpperCase()} Dashboard</h2>
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Pending Reviews</div>
            <div className="stat-value">{pendingApps.length}</div>
          </div>
          <div className="stat-icon warning">📋</div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Your Role</div>
            <div className="stat-value">{role.toUpperCase()}</div>
          </div>
          <div className="stat-icon primary">👤</div>
        </div>
      </div>
      <div className="info-card">
        <h3 className="info-card-title">Approval Workflow</h3>
        <p className="info-card-text">
          Applications flow through: <strong>DRC → IRC → DoAA → Completed</strong>
        </p>
        <p className="info-card-text">
          You can only review applications at the <strong>{role.toUpperCase()}</strong> stage.
        </p>
      </div>
    </div>
  );
}
