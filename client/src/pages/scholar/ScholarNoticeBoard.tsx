import { FormCard } from "@/components/ui/form-card";

export default function ScholarNoticeBoard() {
  return (
    <div className="p-5">
      <h2 className="scholar-section-title">Notice Board</h2>
      <FormCard title="PhD Pre-Talk Schedule 2026" className="mb-[15px]">
        <p className="text-sm text-[#666]">Pre-talk seminars for the upcoming batch will be scheduled in February 2026.</p>
        <span className="text-xs text-[#888]">Posted: Jan 15, 2026</span>
      </FormCard>
      <FormCard title="Fee Payment Reminder">
        <p className="text-sm text-[#666]">Please ensure all fee payments are completed before the deadline.</p>
        <span className="text-xs text-[#888]">Posted: Jan 10, 2026</span>
      </FormCard>
    </div>
  );
}
