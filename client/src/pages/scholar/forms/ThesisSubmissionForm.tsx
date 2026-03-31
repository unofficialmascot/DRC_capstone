import { useState } from "react";
import type { CSSProperties } from "react";
import type { PublicUser } from "@/lib/types";
import { SignatureBlock } from "@/components/forms/SignatureBlock";

export default function ThesisSubmissionForm({
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
    scholarName: user.name || "",
    regNo: user.scholarId || "",
    category: user.programme || "Full-Time",
    department: user.department || "",
    thesisTitle: user.researchTitle || "",
    registrationYearDate: user.joiningDate || "",
    supervisorNameAddress: user.supervisorId || "",
    coSupervisorNameAddress: user.coSupervisorId || "",
    noDuesPrincipal: "",
    noDuesHod: "",
    noDuesLibrary: "",
    noDuesHostel: "",
    adjudicationFeeAmount: "",
    correspondenceAddress: user.address || "",
    signatureDate: "",
  });

  const wrapperStyle: CSSProperties = {
    maxWidth: "1000px",
    margin: "0 auto",
    background: "white",
    padding: "30px",
    borderRadius: "16px",
    border: "1px solid #e1e5e9",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  };

  const sectionStyle: CSSProperties = {
    background: "#ffffff",
    padding: "24px",
    borderRadius: "12px",
    border: "1px solid #eee",
    marginBottom: "20px",
  };

  const sectionTitleStyle: CSSProperties = {
    fontWeight: "bold",
    marginBottom: "15px",
    color: "#0b6a55",
    fontSize: "16px",
    display: "block",
  };

  const tableStyle: CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  };

  const cellStyle: CSSProperties = {
    border: "1px solid #ddd",
    padding: "10px",
    textAlign: "left",
  };

  const labelCellStyle: CSSProperties = {
    ...cellStyle,
    backgroundColor: "#f8fafc",
    fontWeight: 600,
    width: "35%",
  };

  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "14px",
    outline: "none",
  };

  const readOnlyInputStyle: CSSProperties = {
    ...inputStyle,
    backgroundColor: "#fafafa",
    color: "#333",
    border: "1px solid #dee2e6",
  };

  const noteStyle: CSSProperties = {
    fontSize: "12px",
    color: "#666",
    fontStyle: "italic",
    marginTop: "5px",
    display: "block",
  };

  const submitPayload = {
    scholarName: formData.scholarName,
    regNo: formData.regNo,
    category: formData.category,
    department: formData.department,
    thesisTitle: formData.thesisTitle,
    registrationYearDate: formData.registrationYearDate,
    supervisorNameAddress: formData.supervisorNameAddress,
    coSupervisorNameAddress: formData.coSupervisorNameAddress,
    noDuesPrincipal: formData.noDuesPrincipal,
    noDuesHod: formData.noDuesHod,
    noDuesLibrary: formData.noDuesLibrary,
    noDuesHostel: formData.noDuesHostel,
    adjudicationFeeAmount: formData.adjudicationFeeAmount,
    correspondenceAddress: formData.correspondenceAddress,
    signatureDate: formData.signatureDate,
  };

  return (
    <div style={wrapperStyle}>
      <div style={sectionStyle}>
        <div style={{ textAlign: "center", marginBottom: "25px", paddingBottom: "20px", borderBottom: "2px solid #0b6a55" }}>
          <div style={{ fontWeight: "bold", fontSize: "20px", color: "#0b6a55", textTransform: "uppercase" }}>GITAM Deemed to be University</div>
          <div style={{ fontSize: "15px", margin: "4px 0", color: "#444", fontWeight: 600 }}>School of Technology</div>
          <div style={{ fontSize: "15px", margin: "4px 0", color: "#444", fontWeight: 600 }}>Hyderabad Campus</div>
        </div>
        <div style={{ textAlign: "center", fontSize: "18px", fontWeight: "bold", margin: "20px 0", color: "#0b6a55", textDecoration: "underline" }}>
          APPLICATION FORM FOR SUBMISSION OF Ph.D. THESIS
        </div>

        <table style={tableStyle}>
          <tbody>
            <tr>
              <td style={labelCellStyle}>1) Name of the Scholar (Full Name)</td>
              <td style={cellStyle}><input style={readOnlyInputStyle} type="text" value={formData.scholarName} readOnly /></td>
            </tr>
            <tr>
              <td style={labelCellStyle}>2) Reg. No.</td>
              <td style={cellStyle}><input style={readOnlyInputStyle} type="text" value={formData.regNo} readOnly /></td>
            </tr>
            <tr>
              <td style={labelCellStyle}>3) Category (Full-Time / Part-Time)</td>
              <td style={cellStyle}><input style={readOnlyInputStyle} type="text" value={formData.category} readOnly /></td>
            </tr>
            <tr>
              <td style={labelCellStyle}>4) Name of the Department</td>
              <td style={cellStyle}><input style={readOnlyInputStyle} type="text" value={formData.department} readOnly /></td>
            </tr>
            <tr>
              <td style={labelCellStyle}>5) Title of the Thesis</td>
              <td style={cellStyle}><textarea style={{ ...readOnlyInputStyle, minHeight: "80px", resize: "vertical" }} value={formData.thesisTitle} readOnly /></td>
            </tr>
            <tr>
              <td style={labelCellStyle}>6) Year of Registration & Date</td>
              <td style={cellStyle}>
                <input style={readOnlyInputStyle} type="text" value={formData.registrationYearDate} readOnly placeholder="Year - DD/MM/YYYY" />
                <span style={noteStyle}>(Copy of provisional allotment should be enclosed)</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>Supervisor Information</span>
        <table style={tableStyle}>
          <tbody>
            <tr>
              <td style={labelCellStyle}>7) Name of Research Supervisor & Address</td>
              <td style={cellStyle}><textarea style={{ ...readOnlyInputStyle, minHeight: "70px", resize: "vertical" }} value={formData.supervisorNameAddress} readOnly /></td>
            </tr>
            <tr>
              <td style={labelCellStyle}>8) Name of Co-Research Supervisor & Address</td>
              <td style={cellStyle}><textarea style={{ ...readOnlyInputStyle, minHeight: "70px", resize: "vertical" }} value={formData.coSupervisorNameAddress} readOnly /></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>9) Whether No-Dues Certificates are Enclosed</span>
        <table style={tableStyle}>
          <tbody>
            <tr>
              <td style={labelCellStyle}>a) Principal's Office</td>
              <td style={cellStyle}><input style={inputStyle} type="text" value={formData.noDuesPrincipal} onChange={(e) => setFormData({ ...formData, noDuesPrincipal: e.target.value })} placeholder="Yes / No" /></td>
              <td style={labelCellStyle}>b) Head of the Department</td>
              <td style={cellStyle}><input style={inputStyle} type="text" value={formData.noDuesHod} onChange={(e) => setFormData({ ...formData, noDuesHod: e.target.value })} placeholder="Yes / No" /></td>
            </tr>
            <tr>
              <td style={labelCellStyle}>c) University Library (KRC)</td>
              <td style={cellStyle}><input style={inputStyle} type="text" value={formData.noDuesLibrary} onChange={(e) => setFormData({ ...formData, noDuesLibrary: e.target.value })} placeholder="Yes / No" /></td>
              <td style={labelCellStyle}>d) Hostel</td>
              <td style={cellStyle}><input style={inputStyle} type="text" value={formData.noDuesHostel} onChange={(e) => setFormData({ ...formData, noDuesHostel: e.target.value })} placeholder="Yes / No" /></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={sectionStyle}>
        <table style={tableStyle}>
          <tbody>
            <tr>
              <td style={labelCellStyle}>10) Details of Adjudication fee paid</td>
              <td style={cellStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>Amount:</span>
                  <input style={{ ...inputStyle, maxWidth: "220px" }} type="text" value={formData.adjudicationFeeAmount} onChange={(e) => setFormData({ ...formData, adjudicationFeeAmount: e.target.value })} />
                </div>
                <span style={noteStyle}>(Receipt duly signed by accounts department should be enclosed)</span>
              </td>
            </tr>
            <tr>
              <td style={labelCellStyle}>11) Address for further correspondence</td>
              <td style={cellStyle}><textarea style={{ ...readOnlyInputStyle, minHeight: "80px", resize: "vertical" }} value={formData.correspondenceAddress} readOnly /></td>
            </tr>
          </tbody>
        </table>
      </div>

      <SignatureBlock signatures={[
        { label: "Scholar", signerName: user.name || "Pending signature", signerRole: "Scholar", signedAt: formData.signatureDate || null, isPending: !formData.signatureDate },
        { label: "Research Supervisor", signerName: "Pending signature", signerRole: "Supervisor", isPending: true },
        { label: "Co-Research Supervisor", signerName: "Pending signature", signerRole: "Co-Supervisor", isPending: true },
        { label: "Head of Department", signerName: "Pending signature", signerRole: "HoD", isPending: true },
        { label: "Head of Institute", signerName: "Pending signature", signerRole: "Institute Head", isPending: true },
      ]} />

      <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "30px" }}>
        <button type="button" className="submit-btn" onClick={onBack} style={{ background: "#6c757d" }}>Back</button>
        <button type="button" className="submit-btn" onClick={() => onSubmit(submitPayload)} disabled={isSubmitting}>{isSubmitting ? "Submitting..." : "Submit Application"}</button>
      </div>
    </div>
  );
}
