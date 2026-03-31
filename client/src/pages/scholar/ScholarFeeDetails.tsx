import { FormCard } from "@/components/ui/form-card";
import { FormTable } from "@/components/ui/form-table";

export default function ScholarFeeDetails() {
  const headers = ["Academic Year", "Semester", "Amount", "Due Date", "Status"];
  const rows = [
    ["2024-2025", "Odd", "₹75,000", "Aug 31, 2024", <span key="paid" className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Paid</span>],
    ["2024-2025", "Even", "₹75,000", "Jan 31, 2025", <span key="due" className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">Due</span>],
  ];

  return (
    <div className="fee-container">
      <div className="fee-title">Fee Details</div>
      <FormCard>
        <FormTable headers={headers} rows={rows} />
      </FormCard>
    </div>
  );
}
