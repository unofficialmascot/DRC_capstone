import { useApplicationsByStage } from "@/hooks/use-application-reviews";
import { useToast } from "@/hooks/use-toast";
import ScholarProfile from "@/pages/scholar/ScholarProfile";
import { FormCard } from "@/components/ui/form-card";
import { FormTable } from "@/components/ui/form-table";
import type { Application } from "@shared/schema";
import type { PublicUser } from "@/lib/types";

export default function ReviewerDashboard({ role, user, activeSection = "dashboard" }: { role: string; user?: PublicUser; activeSection?: string }) {
  const { toast } = useToast();
  
  const roleLabel =
    role === "drc_convener"
      ? "DRC Convener"
      : role === "drc_chairman"
        ? "DRC Chairman"
        : role === "drc"
          ? "DRC Member"
          : role === "irc"
            ? "IRC Member"
            : role === "doaa"
              ? "DoAA Officer"
              : role.toUpperCase();

  const { data: pendingApps = [] } = useApplicationsByStage(
    role === "drc_chairman" ? "" : role,
  ) as { data: Application[] | undefined };

  const sectionTitle =
    activeSection === "profile"
      ? "Profile"
      : activeSection === "help-support"
        ? "Help and Support"
        : `${roleLabel} Dashboard`;

  if (activeSection === "profile" && user) {
    return <ScholarProfile user={user} viewMode="supervisor" />;
  }

  if (activeSection === "help-support") {
    const supportData = [
      ["Email", "drc-support@gitam.edu"],
      ["Phone", "+91-00000-00000"],
      ["Hours", "Mon-Fri, 9:00 AM - 5:00 PM"],
      ["Response Time", "Within 24 hours"],
    ];

    return (
      <div style={{ padding: "20px" }}>
        <h2 style={{ color: "#0b6a55", marginBottom: "20px" }}>{sectionTitle}</h2>
        <FormCard title="Support Channels">
          <FormTable headers={["Contact Method", "Details"]} rows={supportData} />
        </FormCard>
        <FormCard title="Application Review Guidance">
          <p style={{ color: "#555", margin: 0 }}>
            Use the Dashboard tab to view pending applications and submit approvals or rejections with detailed remarks.
            All reviews are tracked and contribute to the scholar's research progress evaluation.
          </p>
        </FormCard>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ color: "#0b6a55", marginBottom: "20px" }}>{roleLabel} Dashboard</h2>
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Pending Reviews</div>
            <div className="stat-value">{role === "drc_chairman" ? "-" : pendingApps.length}</div>
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
