import { useState } from "react";
import type { PublicUser } from "@/lib/types";

export default function PreTalkForm({
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
    department: user.department || "Computer Science",
    scholarName: user.name,
    regdNo: user.scholarId || "",
    researchTopic: user.researchTitle || "",
    preTalkDate: "",
    venue: "Seminar Hall",
  });
  return (
    <div className="form-container">
      <div style={{ textAlign: "center", marginBottom: "25px" }}>
        <div style={{ fontSize: "18px", fontWeight: "bold", color: "#0b6a55" }}>GANDHI INSTITUTE OF TECHNOLOGY AND MANAGEMENT (GITAM)</div>
      </div>
      <div className="form-title">Research Form -V: Ph.D. Pre-Submission Talk Report</div>
      <div className="form-group"><label>Department</label><input type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} /></div>
      <div className="form-group"><label>Name of Research Scholar</label><input type="text" value={formData.scholarName} onChange={(e) => setFormData({ ...formData, scholarName: e.target.value })} /></div>
      <div className="form-group"><label>Topic of Research Work</label><input type="text" value={formData.researchTopic} onChange={(e) => setFormData({ ...formData, researchTopic: e.target.value })} /></div>
      <div className="form-group"><label>Date of Pre-talk Seminar</label><input type="date" value={formData.preTalkDate} onChange={(e) => setFormData({ ...formData, preTalkDate: e.target.value })} /></div>
      <div className="form-group"><label>Venue</label><input type="text" value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} /></div>
      <div style={{ display: "flex", gap: "10px" }}>
        <button type="button" className="submit-btn" onClick={() => onSubmit(formData)} disabled={isSubmitting}>{isSubmitting ? "Submitting..." : "Submit Application"}</button>
        <button type="button" className="submit-btn" onClick={onBack} style={{ background: "#6c757d" }}>Back</button>
      </div>
    </div>
  );
}
