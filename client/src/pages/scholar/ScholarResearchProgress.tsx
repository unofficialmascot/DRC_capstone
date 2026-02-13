import { useStats } from "@/hooks/use-stats";

export default function ScholarResearchProgress({ userId }: { userId: number }) {
  const { data: stats } = useStats(userId);

  return (
    <div className="research-container">
      <div className="research-title">Research Progress</div>
      <div className="stats-container">
        <div className="stat-card"><div className="stat-info"><div className="stat-label">Research Phase</div><div className="stat-value">Phase-II</div></div><div className="stat-icon" style={{ color: "#0b6a55" }}>📊</div></div>
        <div className="stat-card"><div className="stat-info"><div className="stat-label">Publications</div><div className="stat-value">{stats?.publications || 0}</div></div><div className="stat-icon" style={{ color: "#f39c12" }}>📚</div></div>
        <div className="stat-card"><div className="stat-info"><div className="stat-label">Conferences</div><div className="stat-value">2</div></div><div className="stat-icon" style={{ color: "#27ae60" }}>🎤</div></div>
        <div className="stat-card"><div className="stat-info"><div className="stat-label">Research Reviews</div><div className="stat-value">{stats?.completedReviews || 0}</div></div><div className="stat-icon" style={{ color: "#3498db" }}>✓</div></div>
      </div>
      <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", border: "1px solid #e6e6e6" }}>
        <h3 style={{ marginBottom: "15px", color: "#0b6a55" }}>Research Milestones</h3>
        <table className="info-table">
          <thead><tr><th>Milestone</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            <tr><td>Course Work Completion</td><td><span className="pill">Completed</span></td><td>Dec 2023</td></tr>
            <tr><td>Research Proposal Approval</td><td><span className="pill">Completed</span></td><td>Mar 2024</td></tr>
            <tr><td>Literature Review</td><td><span className="pill">Completed</span></td><td>Jun 2024</td></tr>
            <tr><td>Pre-talk Seminar</td><td><span style={{ background: "#f39c12", color: "white", padding: "4px 10px", borderRadius: "15px", fontSize: "13px" }}>In Progress</span></td><td>Expected: Dec 2025</td></tr>
            <tr><td>Thesis Submission</td><td><span style={{ background: "#e0e0e0", color: "#666", padding: "4px 10px", borderRadius: "15px", fontSize: "13px" }}>Pending</span></td><td>Expected: Jun 2026</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
