import { useApplicationsByStage } from "@/hooks/use-application-reviews";
import type { Application } from "@shared/schema";

export default function ReviewerDashboard({ role }: { role: string }) {
  const roleLabel =
    role === "drc_convener"
      ? "DRC Convener"
      : role === "drc_chairman"
        ? "DRC Chairman"
        : role === "irc_convener"
          ? "IRC Convener"
          : role === "irc_chairman"
            ? "IRC Chairman"
        : role.toUpperCase();

  const { data: pendingApps = [] } = useApplicationsByStage(
    role === "drc_chairman" || role === "irc_chairman" ? "" : role,
  ) as { data: Application[] | undefined };

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ color: "#0b6a55", marginBottom: "20px" }}>{roleLabel} Dashboard</h2>
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Pending Reviews</div>
            <div className="stat-value">{role === "drc_chairman" || role === "irc_chairman" ? "-" : pendingApps.length}</div>
          </div>
          <div className="stat-icon" style={{ color: "#f39c12" }}>📋</div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Your Role</div>
            <div className="stat-value">{roleLabel}</div>
          </div>
          <div className="stat-icon" style={{ color: "#0b6a55" }}>👤</div>
        </div>
      </div>
      <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", border: "1px solid #e6e6e6", marginTop: "20px" }}>
        <h3 style={{ marginBottom: "15px", color: "#0b6a55" }}>Approval Workflow</h3>
        <p style={{ color: "#666" }}>Applications flow through: <strong>DRC → IRC → DoAA → Completed</strong></p>
        <p style={{ color: "#666", marginTop: "10px" }}>You can only review applications at your assigned stage.</p>
      </div>
    </div>
  );
}
