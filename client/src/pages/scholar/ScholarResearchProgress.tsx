import { useStats } from "@/hooks/use-stats";
import { FormCard } from "@/components/ui/form-card";
import { FormTable } from "@/components/ui/form-table";

export default function ScholarResearchProgress({ userId }: { userId: number }) {
  const { data: stats } = useStats(userId);

  const headers = ["Milestone", "Status", "Date"];
  const rows = [
    ["Course Work Completion", <span key="completed1" className="status-pill status-pill-success">Completed</span>, "Dec 2023"],
    ["Research Proposal Approval", <span key="completed2" className="status-pill status-pill-success">Completed</span>, "Mar 2024"],
    ["Literature Review", <span key="completed3" className="status-pill status-pill-success">Completed</span>, "Jun 2024"],
    ["Pre-talk Seminar", <span key="progress" className="status-pill status-pill-warning">In Progress</span>, "Expected: Dec 2025"],
    ["Thesis Submission", <span key="pending" className="status-pill status-pill-neutral">Pending</span>, "Expected: Jun 2026"],
  ];

  return (
    <div className="research-container">
      <div className="research-title">Research Progress</div>
      <div className="stats-container">
        <div className="stat-card"><div className="stat-info"><div className="stat-label">Research Phase</div><div className="stat-value">Phase-II</div></div><div className="stat-icon text-[#0b6a55]">📊</div></div>
        <div className="stat-card"><div className="stat-info"><div className="stat-label">Publications</div><div className="stat-value">{stats?.publications || 0}</div></div><div className="stat-icon text-[#f39c12]">📚</div></div>
        <div className="stat-card"><div className="stat-info"><div className="stat-label">Conferences</div><div className="stat-value">2</div></div><div className="stat-icon text-[#27ae60]">🎤</div></div>
        <div className="stat-card"><div className="stat-info"><div className="stat-label">Research Reviews</div><div className="stat-value">{stats?.completedReviews || 0}</div></div><div className="stat-icon text-[#3498db]">✓</div></div>
      </div>
      <FormCard title="Research Milestones">
        <FormTable headers={headers} rows={rows} />
      </FormCard>
    </div>
  );
}
