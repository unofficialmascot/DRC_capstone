import { useQuery } from "@tanstack/react-query";

interface ScholarResearchProgressProps {
  userId: number;
}

export default function ScholarResearchProgress({
  userId,
}: ScholarResearchProgressProps) {
  const { data: stats } = useQuery({
    queryKey: ["/api/stats", userId],
    queryFn: () => fetch(`/api/stats/${userId}`).then((res) => res.json()),
  });

  return (
    <div className="research-container">
      <div className="research-title">Research Progress</div>
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Research Phase</div>
            <div className="stat-value">Phase-II</div>
          </div>
          <div className="stat-icon primary">📊</div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Publications</div>
            <div className="stat-value">{stats?.publications || 0}</div>
          </div>
          <div className="stat-icon warning">📚</div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Conferences</div>
            <div className="stat-value">2</div>
          </div>
          <div className="stat-icon success">🎤</div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Research Reviews</div>
            <div className="stat-value">{stats?.completedReviews || 0}</div>
          </div>
          <div className="stat-icon info">✓</div>
        </div>
      </div>
      <div className="info-card">
        <h3 className="info-card-title">Research Milestones</h3>
        <table className="info-table">
          <thead>
            <tr>
              <th>Milestone</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Course Work Completion</td>
              <td>
                <span className="pill">Completed</span>
              </td>
              <td>Dec 2023</td>
            </tr>
            <tr>
              <td>Research Proposal Approval</td>
              <td>
                <span className="pill">Completed</span>
              </td>
              <td>Mar 2024</td>
            </tr>
            <tr>
              <td>Literature Review</td>
              <td>
                <span className="pill">Completed</span>
              </td>
              <td>Jun 2024</td>
            </tr>
            <tr>
              <td>Pre-talk Seminar</td>
              <td>
                <span className="pill warning">In Progress</span>
              </td>
              <td>Expected: Dec 2025</td>
            </tr>
            <tr>
              <td>Thesis Submission</td>
              <td>
                <span className="pill muted">Pending</span>
              </td>
              <td>Expected: Jun 2026</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
