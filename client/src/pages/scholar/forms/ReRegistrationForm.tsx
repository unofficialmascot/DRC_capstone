import { useState } from "react";
import type { CSSProperties } from "react";
import type { PublicUser } from "@/lib/types";
import { SignatureBlock } from "@/components/forms/SignatureBlock";

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
    scholarName: user.name || "",
    regNo: user.scholarId || "",
    joiningDate: user.joiningDate || "",
    department: user.department || "",
    mobile: user.phone || "",
    email: user.email || "",
    programmeCategory: user.programme || "Full Time",
    researchArea: user.researchArea || "",
    feeAcademicYear: "",
    feeChallanRef: "",
    feePaymentDate: "",
    feeAmount: "",
    supervisorName: user.supervisorId || "",
    supervisorDesignation: "",
    supervisorDepartment: user.department || "",
    coSupervisorName: user.coSupervisorId || "",
    coSupervisorDesignation: "",
    coSupervisorDepartment: "",
    extensionDetails: "",
    supervisorComments: "",
    recommendedForExtension: "Select",
    publicationJournalName: "",
    publicationPaperDetails: "",
    publicationVolIssueYear: "",
    publicationImpactFactor: "",
    journalsPublishedIntl: "0",
    journalsPublishedNatl: "0",
    journalsAcceptedIntl: "0",
    journalsAcceptedNatl: "0",
    journalsCommunicatedIntl: "0",
    journalsCommunicatedNatl: "0",
    conferencesPublishedIntl: "0",
    conferencesPublishedNatl: "0",
    conferencesAcceptedIntl: "0",
    conferencesAcceptedNatl: "0",
    conferencesCommunicatedIntl: "0",
    conferencesCommunicatedNatl: "0",
  });

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
    width: "30%",
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

  const submitPayload = {
    scholarName: formData.scholarName,
    regNo: formData.regNo,
    joiningDate: formData.joiningDate,
    department: formData.department,
    mobile: formData.mobile,
    email: formData.email,
    programmeCategory: formData.programmeCategory,
    researchArea: formData.researchArea,
    feeAcademicYear: formData.feeAcademicYear,
    feeChallanRef: formData.feeChallanRef,
    feePaymentDate: formData.feePaymentDate,
    feeAmount: formData.feeAmount,
    supervisorName: formData.supervisorName,
    supervisorDesignation: formData.supervisorDesignation,
    supervisorDepartment: formData.supervisorDepartment,
    coSupervisorName: formData.coSupervisorName,
    coSupervisorDesignation: formData.coSupervisorDesignation,
    coSupervisorDepartment: formData.coSupervisorDepartment,
    extensionDetails: formData.extensionDetails,
    supervisorComments: formData.supervisorComments,
    recommendedForExtension: formData.recommendedForExtension,
    publicationJournalName: formData.publicationJournalName,
    publicationPaperDetails: formData.publicationPaperDetails,
    publicationVolIssueYear: formData.publicationVolIssueYear,
    publicationImpactFactor: formData.publicationImpactFactor,
    journalsPublishedIntl: formData.journalsPublishedIntl,
    journalsPublishedNatl: formData.journalsPublishedNatl,
    journalsAcceptedIntl: formData.journalsAcceptedIntl,
    journalsAcceptedNatl: formData.journalsAcceptedNatl,
    journalsCommunicatedIntl: formData.journalsCommunicatedIntl,
    journalsCommunicatedNatl: formData.journalsCommunicatedNatl,
    conferencesPublishedIntl: formData.conferencesPublishedIntl,
    conferencesPublishedNatl: formData.conferencesPublishedNatl,
    conferencesAcceptedIntl: formData.conferencesAcceptedIntl,
    conferencesAcceptedNatl: formData.conferencesAcceptedNatl,
    conferencesCommunicatedIntl: formData.conferencesCommunicatedIntl,
    conferencesCommunicatedNatl: formData.conferencesCommunicatedNatl,
  };

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        background: "white",
        padding: "30px",
        borderRadius: "16px",
        border: "1px solid #e1e5e9",
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
      }}
    >
      <div style={sectionStyle}>
        <div style={{ textAlign: "center", marginBottom: "25px", paddingBottom: "20px", borderBottom: "2px solid #0b6a55" }}>
          <div style={{ fontWeight: "bold", fontSize: "20px", color: "#0b6a55", textTransform: "uppercase" }}>
            Gandhi Institute of Technology and Management (GITAM)
          </div>
          <div style={{ fontSize: "15px", margin: "4px 0", color: "#444", fontWeight: 600 }}>(Deemed to be University)</div>
          <div style={{ fontSize: "15px", margin: "4px 0", color: "#444", fontWeight: 600 }}>GITAM School of Technology - Hyderabad</div>
          <div style={{ fontSize: "12px", color: "#777" }}>Rudraram, Patancheru Mandal, Sangareddy (Dist) - 502 329, T.S., INDIA</div>
        </div>
        <div style={{ textAlign: "center", fontSize: "18px", fontWeight: "bold", margin: "25px 0", color: "#0b6a55", textDecoration: "underline" }}>
          PH.D. RE-REGISTRATION FORM
        </div>

        <table style={tableStyle}>
          <tbody>
            <tr>
              <td style={labelCellStyle}>1. Name of the Scholar</td>
              <td style={cellStyle} colSpan={3}><input style={readOnlyInputStyle} type="text" value={formData.scholarName} readOnly /></td>
            </tr>
            <tr>
              <td style={labelCellStyle}>2. Reg. No.</td>
              <td style={cellStyle}><input style={readOnlyInputStyle} type="text" value={formData.regNo} readOnly /></td>
              <td style={labelCellStyle}>Date of Joining</td>
              <td style={cellStyle}><input style={readOnlyInputStyle} type="date" value={formData.joiningDate} readOnly /></td>
            </tr>
            <tr>
              <td style={labelCellStyle}>3. Dept. & School</td>
              <td style={cellStyle} colSpan={3}><input style={readOnlyInputStyle} type="text" value={formData.department} readOnly /></td>
            </tr>
            <tr>
              <td style={labelCellStyle}>4. Mobile No.</td>
              <td style={cellStyle}><input style={readOnlyInputStyle} type="text" value={formData.mobile} readOnly /></td>
              <td style={labelCellStyle}>E-mail</td>
              <td style={cellStyle}><input style={readOnlyInputStyle} type="text" value={formData.email} readOnly /></td>
            </tr>
            <tr>
              <td style={labelCellStyle}>5. Programme Category</td>
              <td style={cellStyle} colSpan={3}><input style={readOnlyInputStyle} type="text" value={formData.programmeCategory} readOnly /></td>
            </tr>
            <tr>
              <td style={labelCellStyle}>6. Area of research work</td>
              <td style={cellStyle} colSpan={3}><input style={readOnlyInputStyle} type="text" value={formData.researchArea} readOnly /></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>7. Fee Payment Details (From Registration Date)</span>
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: "#f8fafc", fontWeight: "bold" }}>
              <td style={cellStyle}>Academic Year</td>
              <td style={cellStyle}>Challan / Ref No.</td>
              <td style={cellStyle}>Date of Payment</td>
              <td style={cellStyle}>Amount (₹)</td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={cellStyle}><input style={inputStyle} type="text" value={formData.feeAcademicYear} onChange={(e) => setFormData({ ...formData, feeAcademicYear: e.target.value })} /></td>
              <td style={cellStyle}><input style={inputStyle} type="text" value={formData.feeChallanRef} onChange={(e) => setFormData({ ...formData, feeChallanRef: e.target.value })} /></td>
              <td style={cellStyle}><input style={inputStyle} type="date" value={formData.feePaymentDate} onChange={(e) => setFormData({ ...formData, feePaymentDate: e.target.value })} /></td>
              <td style={cellStyle}><input style={inputStyle} type="number" value={formData.feeAmount} onChange={(e) => setFormData({ ...formData, feeAmount: e.target.value })} /></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>8. Research Supervisor Details</span>
        <table style={tableStyle}>
          <tbody>
            <tr>
              <td style={labelCellStyle}>Name</td>
              <td style={cellStyle}><input style={readOnlyInputStyle} type="text" value={formData.supervisorName} readOnly /></td>
              <td style={labelCellStyle}>Designation</td>
              <td style={cellStyle}><input style={inputStyle} type="text" value={formData.supervisorDesignation} onChange={(e) => setFormData({ ...formData, supervisorDesignation: e.target.value })} /></td>
            </tr>
            <tr>
              <td style={labelCellStyle}>Department</td>
              <td style={cellStyle} colSpan={3}><input style={readOnlyInputStyle} type="text" value={formData.supervisorDepartment} readOnly /></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>9. Research Co-Supervisor Details (if any)</span>
        <table style={tableStyle}>
          <tbody>
            <tr>
              <td style={labelCellStyle}>Name</td>
              <td style={cellStyle}><input style={readOnlyInputStyle} type="text" value={formData.coSupervisorName} readOnly /></td>
              <td style={labelCellStyle}>Designation</td>
              <td style={cellStyle}><input style={inputStyle} type="text" value={formData.coSupervisorDesignation} onChange={(e) => setFormData({ ...formData, coSupervisorDesignation: e.target.value })} /></td>
            </tr>
            <tr>
              <td style={labelCellStyle}>Department</td>
              <td style={cellStyle} colSpan={3}><input style={inputStyle} type="text" value={formData.coSupervisorDepartment} onChange={(e) => setFormData({ ...formData, coSupervisorDepartment: e.target.value })} /></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>10. Details of Extension of Ph.D duration if any</span>
        <textarea style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} value={formData.extensionDetails} onChange={(e) => setFormData({ ...formData, extensionDetails: e.target.value })} />
      </div>

      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>11. Comments by the Research Supervisor</span>
        <textarea style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} value={formData.supervisorComments} onChange={(e) => setFormData({ ...formData, supervisorComments: e.target.value })} />
      </div>

      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>12. Recommended for Extension / Re-registration</span>
        <select style={{ ...inputStyle, maxWidth: "220px" }} value={formData.recommendedForExtension} onChange={(e) => setFormData({ ...formData, recommendedForExtension: e.target.value })}>
          <option value="Select">Select</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </div>

      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>13. Status of the research work (Papers published in journals & conferences)</span>
        <table style={{ ...tableStyle, marginBottom: "25px" }}>
          <thead>
            <tr style={{ background: "#f8fafc", fontWeight: "bold", textAlign: "center" }}>
              <td style={{ ...cellStyle, width: "60px" }}>S.No.</td>
              <td style={cellStyle}>Name of the Journal</td>
              <td style={cellStyle}>Published paper Details</td>
              <td style={cellStyle}>Vol/Issue/Year</td>
              <td style={cellStyle}>Impact Factor</td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...cellStyle, textAlign: "center" }}>1</td>
              <td style={cellStyle}><input style={inputStyle} type="text" value={formData.publicationJournalName} onChange={(e) => setFormData({ ...formData, publicationJournalName: e.target.value })} /></td>
              <td style={cellStyle}><input style={inputStyle} type="text" value={formData.publicationPaperDetails} onChange={(e) => setFormData({ ...formData, publicationPaperDetails: e.target.value })} /></td>
              <td style={cellStyle}><input style={inputStyle} type="text" value={formData.publicationVolIssueYear} onChange={(e) => setFormData({ ...formData, publicationVolIssueYear: e.target.value })} /></td>
              <td style={cellStyle}><input style={inputStyle} type="text" value={formData.publicationImpactFactor} onChange={(e) => setFormData({ ...formData, publicationImpactFactor: e.target.value })} /></td>
            </tr>
          </tbody>
        </table>

        <span style={{ ...sectionTitleStyle, marginTop: "10px" }}>Research Papers Status</span>
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: "#f8fafc", fontWeight: "bold" }}>
              <td style={cellStyle} rowSpan={2}>Research Papers</td>
              <td style={cellStyle} colSpan={2}>Published</td>
              <td style={cellStyle} colSpan={2}>Accepted</td>
              <td style={cellStyle} colSpan={2}>Communicated</td>
            </tr>
            <tr style={{ background: "#f8fafc", fontWeight: "bold" }}>
              <td style={cellStyle}>Intl.</td>
              <td style={cellStyle}>Natl.</td>
              <td style={cellStyle}>Intl.</td>
              <td style={cellStyle}>Natl.</td>
              <td style={cellStyle}>Intl.</td>
              <td style={cellStyle}>Natl.</td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...cellStyle, fontWeight: 600 }}>Journals</td>
              <td style={cellStyle}><input style={inputStyle} type="number" min="0" value={formData.journalsPublishedIntl} onChange={(e) => setFormData({ ...formData, journalsPublishedIntl: e.target.value })} /></td>
              <td style={cellStyle}><input style={inputStyle} type="number" min="0" value={formData.journalsPublishedNatl} onChange={(e) => setFormData({ ...formData, journalsPublishedNatl: e.target.value })} /></td>
              <td style={cellStyle}><input style={inputStyle} type="number" min="0" value={formData.journalsAcceptedIntl} onChange={(e) => setFormData({ ...formData, journalsAcceptedIntl: e.target.value })} /></td>
              <td style={cellStyle}><input style={inputStyle} type="number" min="0" value={formData.journalsAcceptedNatl} onChange={(e) => setFormData({ ...formData, journalsAcceptedNatl: e.target.value })} /></td>
              <td style={cellStyle}><input style={inputStyle} type="number" min="0" value={formData.journalsCommunicatedIntl} onChange={(e) => setFormData({ ...formData, journalsCommunicatedIntl: e.target.value })} /></td>
              <td style={cellStyle}><input style={inputStyle} type="number" min="0" value={formData.journalsCommunicatedNatl} onChange={(e) => setFormData({ ...formData, journalsCommunicatedNatl: e.target.value })} /></td>
            </tr>
            <tr>
              <td style={{ ...cellStyle, fontWeight: 600 }}>Conferences</td>
              <td style={cellStyle}><input style={inputStyle} type="number" min="0" value={formData.conferencesPublishedIntl} onChange={(e) => setFormData({ ...formData, conferencesPublishedIntl: e.target.value })} /></td>
              <td style={cellStyle}><input style={inputStyle} type="number" min="0" value={formData.conferencesPublishedNatl} onChange={(e) => setFormData({ ...formData, conferencesPublishedNatl: e.target.value })} /></td>
              <td style={cellStyle}><input style={inputStyle} type="number" min="0" value={formData.conferencesAcceptedIntl} onChange={(e) => setFormData({ ...formData, conferencesAcceptedIntl: e.target.value })} /></td>
              <td style={cellStyle}><input style={inputStyle} type="number" min="0" value={formData.conferencesAcceptedNatl} onChange={(e) => setFormData({ ...formData, conferencesAcceptedNatl: e.target.value })} /></td>
              <td style={cellStyle}><input style={inputStyle} type="number" min="0" value={formData.conferencesCommunicatedIntl} onChange={(e) => setFormData({ ...formData, conferencesCommunicatedIntl: e.target.value })} /></td>
              <td style={cellStyle}><input style={inputStyle} type="number" min="0" value={formData.conferencesCommunicatedNatl} onChange={(e) => setFormData({ ...formData, conferencesCommunicatedNatl: e.target.value })} /></td>
            </tr>
          </tbody>
        </table>
      </div>

      <SignatureBlock signatures={[
        { label: "Research Scholar", signerName: "Pending signature", signerRole: "Scholar", isPending: true },
        { label: "Research Supervisor", signerName: "Pending signature", signerRole: "Supervisor", isPending: true },
      ]} />

      <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "30px" }}>
        <button type="button" className="submit-btn" onClick={onBack} style={{ background: "#6c757d" }}>Back</button>
        <button type="button" className="submit-btn" onClick={() => onSubmit(submitPayload)} disabled={isSubmitting}>{isSubmitting ? "Submitting..." : "Submit Application"}</button>
      </div>
    </div>
  );
}
