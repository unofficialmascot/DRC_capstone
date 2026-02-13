import { useState } from "react";
import { useSupervisors } from "@/hooks/use-users";
import type { PublicUser } from "@/lib/types";

export default function SupervisorChangeForm({
  user,
  onSubmit,
  onBack,
  isSubmitting,
}: {
  user: PublicUser;
  onSubmit: (details: Record<string, unknown>) => void;
  onBack: () => void;
  isSubmitting: boolean;
}) {
  const { data: supervisors = [], isLoading: supervisorsLoading } = useSupervisors();

  const [formData, setFormData] = useState({
    scholarName: user.name,
    department: user.department || "Computer Science",
    regdNo: user.scholarId || "",
    joiningDate: user.joiningDate || "",
    currentSupervisor: user.supervisorId || "",
    proposedSupervisor: "",
    reason: "",
  });
  return (
    <div className="form-container">
      <div style={{ textAlign: "center", marginBottom: "25px" }}>
        <div style={{ fontSize: "18px", fontWeight: "bold", color: "#0b6a55" }}>GANDHI INSTITUTE OF TECHNOLOGY AND MANAGEMENT (GITAM)</div>
        <div style={{ fontSize: "14px", color: "#666" }}>(DEEMED TO BE UNIVERSITY)</div>
      </div>
      <div className="form-title">Request for Change/Addition of Supervisor(s)</div>
      <div className="form-group"><label>Name of the Scholar</label><input type="text" value={formData.scholarName} onChange={(e) => setFormData({ ...formData, scholarName: e.target.value })} /></div>
      <div className="form-group"><label>Department</label><input type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} /></div>
      <div className="form-group"><label>Regd. No.</label><input type="text" value={formData.regdNo} onChange={(e) => setFormData({ ...formData, regdNo: e.target.value })} /></div>
      <div className="form-group"><label>Current Supervisor</label><input type="text" value={formData.currentSupervisor} onChange={(e) => setFormData({ ...formData, currentSupervisor: e.target.value })} /></div>
      <div className="form-group">
        <label>Proposed New Supervisor</label>
        <select
          value={formData.proposedSupervisor}
          onChange={(e) => setFormData({ ...formData, proposedSupervisor: e.target.value })}
          data-testid="select-proposed-supervisor"
          disabled={supervisorsLoading}
        >
          <option value="">{supervisorsLoading ? "Loading supervisors..." : "Select a supervisor"}</option>
          {supervisors
            .filter((supervisor) => supervisor.employeeId !== formData.currentSupervisor)
            .map((supervisor) => (
              <option key={supervisor.employeeId} value={supervisor.employeeId}>
                {supervisor.name} ({supervisor.employeeId})
              </option>
            ))}
        </select>
      </div>
      <div className="form-group"><label>Reason/Justification</label><textarea value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="Please provide detailed reason" style={{ height: "120px" }} /></div>
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          type="button"
          className="submit-btn"
          onClick={() => {
            const selectedSupervisor = supervisors.find(
              (supervisor) => supervisor.employeeId === formData.proposedSupervisor,
            );

            onSubmit({
              ...formData,
              proposedSupervisorEmployeeId: formData.proposedSupervisor,
              proposedSupervisorName: selectedSupervisor?.name,
            });
          }}
          disabled={isSubmitting || !formData.proposedSupervisor}
          data-testid="button-submit-form"
        >
          {isSubmitting ? "Submitting..." : "Submit Application"}
        </button>
        <button type="button" className="submit-btn" onClick={onBack} style={{ background: "#6c757d" }}>Back to Options</button>
      </div>
    </div>
  );
}
