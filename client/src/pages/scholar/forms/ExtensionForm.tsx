import { useState } from "react";
import type { PublicUser } from "@/lib/types";

export default function ExtensionForm({
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
  const [formData, setFormData] = useState({
    candidateName: user.name,
    registrationDate: user.joiningDate || "",
    durationEligible: "5 years",
    extensionDuration: "",
    reason: "",
    timeline: "",
  });
  return (
    <div className="form-container">
      <div style={{ textAlign: "center", marginBottom: "25px" }}>
        <div style={{ fontSize: "18px", fontWeight: "bold", color: "#0b6a55" }}>GANDHI INSTITUTE OF TECHNOLOGY AND MANAGEMENT (GITAM)</div>
      </div>
      <div className="form-title">Application for Extension of Ph.D. Program Duration</div>
      <div className="form-group"><label>Name of the Candidate</label><input type="text" value={formData.candidateName} onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })} /></div>
      <div className="form-group"><label>Date of Registration</label><input type="text" value={formData.registrationDate} onChange={(e) => setFormData({ ...formData, registrationDate: e.target.value })} /></div>
      <div className="form-group"><label>Duration Eligible</label><input type="text" value={formData.durationEligible} onChange={(e) => setFormData({ ...formData, durationEligible: e.target.value })} /></div>
      <div className="form-group"><label>Required Extension Duration</label><input type="text" value={formData.extensionDuration} onChange={(e) => setFormData({ ...formData, extensionDuration: e.target.value })} placeholder="e.g., 6 months" /></div>
      <div className="form-group"><label>Reason for Extension</label><textarea value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="Explain why you need the extension" style={{ height: "80px" }} /></div>
      <div className="form-group"><label>Expected Timeline</label><textarea value={formData.timeline} onChange={(e) => setFormData({ ...formData, timeline: e.target.value })} placeholder="When do you expect to complete?" style={{ height: "80px" }} /></div>
      <div style={{ display: "flex", gap: "10px" }}>
        <button type="button" className="submit-btn" onClick={() => onSubmit(formData)} disabled={isSubmitting}>{isSubmitting ? "Submitting..." : "Submit Application"}</button>
        <button type="button" className="submit-btn" onClick={onBack} style={{ background: "#6c757d" }}>Back</button>
      </div>
    </div>
  );
}
