import { useState } from "react";
import type { CSSProperties } from "react";
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
    candidateName: user.name || "",
    registrationDateDepartment: `${user.joiningDate || "N/A"}, ${user.department || "N/A"}`,
    programRegistrationCategory: "Full Time (FT)",
    phoneEmail: `${user.phone || "N/A"}, ${user.email || "N/A"}`,
    supervisorName: user.supervisorId || "N/A",
    researchArea: user.researchArea || "N/A",
    researchTitle: user.researchTitle || "N/A",
    registrationDate: user.joiningDate || "",
    durationEligible: "3 Years",
    requiredExtensionTillDate: "",
    extensionDuration: "6 months",
    researchProgress: "",
    publicationsConferencesNational: "0",
    publicationsConferencesInternational: "0",
    publicationsSciJournalsNational: "0",
    publicationsSciJournalsInternational: "0",
  });

  const cardStyle: CSSProperties = {
    maxWidth: "900px",
    margin: "0 auto",
    background: "#fff",
    padding: "40px",
    border: "1px solid #e1e5e9",
    borderRadius: "12px",
    boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
  };

  const sectionStyle: CSSProperties = {
    marginBottom: "30px",
    padding: "20px",
    border: "1px solid #eee",
    borderRadius: "10px",
  };

  const sectionTitleStyle: CSSProperties = {
    fontWeight: "bold",
    marginBottom: "15px",
    paddingBottom: "8px",
    borderBottom: "1px solid #eee",
    color: "#0b6a55",
    fontSize: "16px",
  };

  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "14px",
  };

  const readOnlyInputStyle: CSSProperties = {
    ...inputStyle,
    backgroundColor: "#fafafa",
    color: "#333",
    border: "1px solid #dee2e6",
  };

  const tableStyle: CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  };

  const thTdStyle: CSSProperties = {
    border: "1px solid #ddd",
    padding: "12px",
    textAlign: "left",
  };

  const buildSubmitPayload = () => ({
    candidateName: formData.candidateName,
    registrationDateDepartment: formData.registrationDateDepartment,
    programRegistrationCategory: formData.programRegistrationCategory,
    phoneEmail: formData.phoneEmail,
    supervisorName: formData.supervisorName,
    researchArea: formData.researchArea,
    researchTitle: formData.researchTitle,
    registrationDate: formData.registrationDate,
    durationEligible: formData.durationEligible,
    requiredExtensionTillDate: formData.requiredExtensionTillDate,
    extensionDuration: formData.extensionDuration,
    researchProgress: formData.researchProgress,
    publicationsConferencesNational: formData.publicationsConferencesNational,
    publicationsConferencesInternational: formData.publicationsConferencesInternational,
    publicationsSciJournalsNational: formData.publicationsSciJournalsNational,
    publicationsSciJournalsInternational: formData.publicationsSciJournalsInternational,
  });

  return (
    <div style={cardStyle}>
      <div style={{ textAlign: "center", marginBottom: "25px", paddingBottom: "20px", borderBottom: "2px solid #0b6a55" }}>
        <div style={{ fontWeight: "bold", fontSize: "20px", color: "#0b6a55", textTransform: "uppercase" }}>GANDHI INSTITUTE OF TECHNOLOGY AND MANAGEMENT (GITAM)</div>
        <div style={{ fontSize: "15px", margin: "4px 0", color: "#444", fontWeight: 600 }}>(DEEMED TO BE UNIVERSITY)</div>
        <div style={{ fontSize: "15px", margin: "4px 0", color: "#444", fontWeight: 600 }}>GITAM School of Technology - Hyderabad</div>
        <div style={{ fontSize: "13px", margin: "4px 0", color: "#666" }}>Accredited by NAAC with A+ Grade</div>
        <div style={{ fontSize: "12px", color: "#777" }}>Rudraram, Patancheru Mandal, Sangareddy (Dist) - 502 329, T.S., INDIA</div>
      </div>

      <div style={{ textAlign: "center", fontSize: "18px", fontWeight: "bold", margin: "25px 0", color: "#0b6a55", textDecoration: "underline" }}>
        PH.D. RESEARCH SCHOLAR DATA SHEET FOR EXTENSION OF PH.D. DURATION
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>1. (a) Research Scholar Details</div>
        <table style={tableStyle}>
          <tbody>
            <tr>
              <td style={{ ...thTdStyle, width: "35%" }}>Name of the Candidate</td>
              <td style={thTdStyle}><input style={readOnlyInputStyle} type="text" value={formData.candidateName} readOnly /></td>
            </tr>
            <tr>
              <td style={thTdStyle}>Date of Registration & Department</td>
              <td style={thTdStyle}><input style={readOnlyInputStyle} type="text" value={formData.registrationDateDepartment} readOnly /></td>
            </tr>
            <tr>
              <td style={thTdStyle}>Program Registration Category</td>
              <td style={thTdStyle}><input style={readOnlyInputStyle} type="text" value={formData.programRegistrationCategory} readOnly /></td>
            </tr>
            <tr>
              <td style={thTdStyle}>Phone No. & Email Id</td>
              <td style={thTdStyle}><input style={readOnlyInputStyle} type="text" value={formData.phoneEmail} readOnly /></td>
            </tr>
            <tr>
              <td style={thTdStyle}>Name of the Research Supervisor</td>
              <td style={thTdStyle}><input style={readOnlyInputStyle} type="text" value={formData.supervisorName} readOnly /></td>
            </tr>
            <tr>
              <td style={thTdStyle}>Area of Research</td>
              <td style={thTdStyle}><input style={readOnlyInputStyle} type="text" value={formData.researchArea} readOnly /></td>
            </tr>
            <tr>
              <td style={thTdStyle}>Title of the Research Work</td>
              <td style={thTdStyle}><input style={readOnlyInputStyle} type="text" value={formData.researchTitle} readOnly /></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>1. (b) Extension Duration Required Details</div>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thTdStyle}>Registration Date</th>
              <th style={thTdStyle}>Duration Eligible</th>
              <th style={thTdStyle}>Required Extension till Date</th>
              <th style={thTdStyle}>Months Required</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={thTdStyle}><input style={readOnlyInputStyle} type="date" value={formData.registrationDate} readOnly /></td>
              <td style={thTdStyle}><input style={inputStyle} type="text" value={formData.durationEligible} onChange={(e) => setFormData({ ...formData, durationEligible: e.target.value })} /></td>
              <td style={thTdStyle}><input style={inputStyle} type="date" value={formData.requiredExtensionTillDate} onChange={(e) => setFormData({ ...formData, requiredExtensionTillDate: e.target.value })} /></td>
              <td style={thTdStyle}><input style={inputStyle} type="text" value={formData.extensionDuration} onChange={(e) => setFormData({ ...formData, extensionDuration: e.target.value })} placeholder="e.g. 6 Months" /></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>2. Brief Details of Research Progress</div>
        <textarea
          style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
          value={formData.researchProgress}
          onChange={(e) => setFormData({ ...formData, researchProgress: e.target.value })}
          placeholder="Outline the quantum of work completed to date..."
        />
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>3. Details of Publications</div>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thTdStyle}>Category</th>
              <th style={thTdStyle}>National</th>
              <th style={thTdStyle}>International</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={thTdStyle}>Conferences</td>
              <td style={thTdStyle}><input style={inputStyle} type="number" min="0" value={formData.publicationsConferencesNational} onChange={(e) => setFormData({ ...formData, publicationsConferencesNational: e.target.value })} /></td>
              <td style={thTdStyle}><input style={inputStyle} type="number" min="0" value={formData.publicationsConferencesInternational} onChange={(e) => setFormData({ ...formData, publicationsConferencesInternational: e.target.value })} /></td>
            </tr>
            <tr>
              <td style={thTdStyle}>SCI Journals</td>
              <td style={thTdStyle}><input style={inputStyle} type="number" min="0" value={formData.publicationsSciJournalsNational} onChange={(e) => setFormData({ ...formData, publicationsSciJournalsNational: e.target.value })} /></td>
              <td style={thTdStyle}><input style={inputStyle} type="number" min="0" value={formData.publicationsSciJournalsInternational} onChange={(e) => setFormData({ ...formData, publicationsSciJournalsInternational: e.target.value })} /></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "40px" }}>
        <div style={{ width: "45%", textAlign: "center", fontSize: "14px", fontWeight: 600 }}>
          <div style={{ height: "60px", borderBottom: "1px solid #333", marginBottom: "10px" }}></div>
          Signature of the Research Scholar
        </div>
        <div style={{ width: "45%", textAlign: "center", fontSize: "14px", fontWeight: 600 }}>
          <div style={{ height: "60px", borderBottom: "1px solid #333", marginBottom: "10px" }}></div>
          Signature of the Research Supervisor
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "30px" }}>
        <button type="button" className="submit-btn" onClick={onBack} style={{ background: "#6c757d" }}>Back</button>
        <button type="button" className="submit-btn" onClick={() => onSubmit(buildSubmitPayload())} disabled={isSubmitting}>{isSubmitting ? "Submitting..." : "Submit Application"}</button>
      </div>
    </div>
  );
}
