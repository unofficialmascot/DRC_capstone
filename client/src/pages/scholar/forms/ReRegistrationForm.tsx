import { useState } from "react";
import type { PublicUser } from "@/lib/types";

export default function ReRegistrationForm({
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
    scholarName: user.name,
    regNo: user.scholarId || "",
    joiningDate: user.joiningDate || "",
    department: user.department || "",
    mobile: user.phone || "",
    email: user.email,
  });
  return (
    <div className="form-container">
      <div style={{ textAlign: "center", marginBottom: "25px" }}>
        <div style={{ fontSize: "18px", fontWeight: "bold", color: "#0b6a55" }}>GITAM SCHOOL OF TECHNOLOGY</div>
      </div>
      <div className="form-title">Ph.D (FT/PT) Re-Registration form</div>
      <div className="form-group"><label>Name of the Scholar</label><input type="text" value={formData.scholarName} onChange={(e) => setFormData({ ...formData, scholarName: e.target.value })} /></div>
      <div className="form-group"><label>Reg. No.</label><input type="text" value={formData.regNo} onChange={(e) => setFormData({ ...formData, regNo: e.target.value })} /></div>
      <div className="form-group"><label>Date of Joining</label><input type="text" value={formData.joiningDate} onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })} /></div>
      <div className="form-group"><label>Name of the Dept. & School</label><input type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} /></div>
      <div className="form-group"><label>Mobile No.</label><input type="text" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} /></div>
      <div className="form-group"><label>E-mail</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
      <div style={{ display: "flex", gap: "10px" }}>
        <button type="button" className="submit-btn" onClick={() => onSubmit(formData)} disabled={isSubmitting}>{isSubmitting ? "Submitting..." : "Submit Application"}</button>
        <button type="button" className="submit-btn" onClick={onBack} style={{ background: "#6c757d" }}>Back</button>
      </div>
    </div>
  );
}
