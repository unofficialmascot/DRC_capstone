import { FormCard } from "@/components/ui/form-card";

export default function ScholarNoticeBoard() {
  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ color: "#0b6a55", marginBottom: "20px" }}>Notice Board</h2>
      <FormCard title="PhD Pre-Talk Schedule 2026" style={{ marginBottom: "15px" }}>
        <p style={{ color: "#666", fontSize: "14px" }}>Pre-talk seminars for the upcoming batch will be scheduled in February 2026.</p>
        <span style={{ fontSize: "12px", color: "#888" }}>Posted: Jan 15, 2026</span>
      </FormCard>
      <FormCard title="Fee Payment Reminder">
        <p style={{ color: "#666", fontSize: "14px" }}>Please ensure all fee payments are completed before the deadline.</p>
        <span style={{ fontSize: "12px", color: "#888" }}>Posted: Jan 10, 2026</span>
      </FormCard>
    </div>
  );
}
