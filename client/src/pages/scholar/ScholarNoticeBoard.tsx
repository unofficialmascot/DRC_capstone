export default function ScholarNoticeBoard() {
  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ color: "#0b6a55", marginBottom: "20px" }}>Notice Board</h2>
      <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", border: "1px solid #e6e6e6", marginBottom: "15px" }}>
        <h4 style={{ color: "#0b6a55" }}>PhD Pre-Talk Schedule 2026</h4>
        <p style={{ color: "#666", fontSize: "14px" }}>Pre-talk seminars for the upcoming batch will be scheduled in February 2026.</p>
        <span style={{ fontSize: "12px", color: "#888" }}>Posted: Jan 15, 2026</span>
      </div>
      <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", border: "1px solid #e6e6e6" }}>
        <h4 style={{ color: "#0b6a55" }}>Fee Payment Reminder</h4>
        <p style={{ color: "#666", fontSize: "14px" }}>Please ensure all fee payments are completed before the deadline.</p>
        <span style={{ fontSize: "12px", color: "#888" }}>Posted: Jan 10, 2026</span>
      </div>
    </div>
  );
}
