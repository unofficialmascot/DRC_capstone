import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useSupervisors } from "@/hooks/use-users";
import type { PublicUser } from "@/lib/types";
import { SignatureBlock } from "@/components/forms/SignatureBlock";
import { EligibilityChecklistSection } from "@/components/forms/EligibilityChecklistSection";
import { useApplicationEligibility } from "@/hooks/use-applications";
import { APP_SETTINGS } from "@shared/app-settings";

const SUPERVISOR_CHANGE_CRITERIA = [
  { codes: ["FEE_DUES_OUTSTANDING"], label: "No outstanding fee dues" },
  { codes: ["INSUFFICIENT_RAC_MEETINGS"], label: "At least 2 RAC meetings attended" },
  { codes: ["SCHOLAR_NOT_ACTIVE"], label: "Scholar status is Active", visibleByDefault: false },
];

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
  const { data: eligibilityData, isLoading: isEligibilityLoading } = useApplicationEligibility();

  const supervisorChangeEligibility = eligibilityData?.items.find(
    (item) => item.applicationType === "Supervisor Change",
  );
  const eligibilityMode = eligibilityData?.mode ?? APP_SETTINGS.applicationEligibilityMode;
  const failingCodes = new Set(
    (supervisorChangeEligibility?.reasons ?? []).map((r) => r.code),
  );

  const currentSupervisor = supervisors.find(
    (supervisor) => supervisor.employeeId === user.supervisorId,
  );

  const [formData, setFormData] = useState({
    scholarName: user.name || "",
    department: user.department || "N/A",
    regdNo: user.scholarId || "",
    joiningDate: user.joiningDate || "",
    basicQualification: "N/A",
    researchArea: user.researchArea || "N/A",
    currentSupervisorEmployeeId: user.supervisorId || "",
    currentSupervisorName: currentSupervisor?.name || user.supervisorId || "N/A",
    currentSupervisorDesignation: currentSupervisor?.designation || "N/A",
    existingCoSupervisorName: user.coSupervisorId || "N/A",
    existingCoSupervisorDesignation: "N/A",
    proposedSupervisorEmployeeId: "",
    proposedSupervisorName: "",
    proposedCoSupervisorName: "",
    effectFromDate: "",
    reasonJustification: "",
  });

  useEffect(() => {
    if (!currentSupervisor) {
      return;
    }

    setFormData((previous) => ({
      ...previous,
      currentSupervisorName:
        previous.currentSupervisorName === previous.currentSupervisorEmployeeId || previous.currentSupervisorName === "N/A"
          ? currentSupervisor.name
          : previous.currentSupervisorName,
      currentSupervisorDesignation:
        previous.currentSupervisorDesignation === "N/A"
          ? currentSupervisor.designation || "N/A"
          : previous.currentSupervisorDesignation,
    }));
  }, [currentSupervisor]);

  const cardStyle: CSSProperties = {
    maxWidth: "900px",
    margin: "0 auto",
    background: "white",
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

  const tableStyle: CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    margin: "12px 0",
    fontSize: "14px",
  };

  const tableCellStyle: CSSProperties = {
    border: "1px solid #ddd",
    padding: "10px",
  };

  const labelCellStyle: CSSProperties = {
    ...tableCellStyle,
    backgroundColor: "#f8fafc",
    fontWeight: 600,
    width: "25%",
  };

  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "8px",
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

  const buildSubmitPayload = () => ({
    scholarName: formData.scholarName,
    department: formData.department,
    regdNo: formData.regdNo,
    joiningDate: formData.joiningDate,
    basicQualification: formData.basicQualification,
    researchArea: formData.researchArea,
    currentSupervisorEmployeeId: formData.currentSupervisorEmployeeId,
    currentSupervisorName: formData.currentSupervisorName,
    currentSupervisorDesignation: formData.currentSupervisorDesignation,
    existingCoSupervisorName: formData.existingCoSupervisorName,
    existingCoSupervisorDesignation: formData.existingCoSupervisorDesignation,
    proposedSupervisorEmployeeId: formData.proposedSupervisorEmployeeId,
    proposedSupervisorName: formData.proposedSupervisorName,
    proposedCoSupervisorName: formData.proposedCoSupervisorName,
    effectFromDate: formData.effectFromDate,
    reasonJustification: formData.reasonJustification,
  });

  return (
    <div style={cardStyle}>
      <div style={{ textAlign: "center", marginBottom: "25px", paddingBottom: "20px", borderBottom: "2px solid #0b6a55" }}>
        <div style={{ fontWeight: "bold", fontSize: "19px", color: "#0b6a55", textTransform: "uppercase" }}>GANDHI INSTITUTE OF TECHNOLOGY AND MANAGEMENT (GITAM)</div>
        <div style={{ fontSize: "15px", margin: "4px 0", color: "#444", fontWeight: 600 }}>(DEEMED TO BE UNIVERSITY)</div>
        <div style={{ fontSize: "15px", margin: "4px 0", color: "#444", fontWeight: 600 }}>School of Technology</div>
        <div style={{ fontSize: "13px", margin: "4px 0", color: "#666" }}>Accredited by NAAC with A+ Grade</div>
        <div style={{ fontSize: "12px", color: "#777" }}>Rudraram, Patancheru Mandal, Sangareddy (Dist) - 502 329, T.S., INDIA</div>
      </div>

      <div style={{ textAlign: "center", fontSize: "17px", fontWeight: "bold", margin: "25px 0", color: "#0b6a55", textDecoration: "underline", textTransform: "uppercase" }}>
        Request for Change / Addition of Supervisor(s)
      </div>

      <div style={{ ...sectionStyle, marginBottom: "24px" }}>
        <EligibilityChecklistSection
          criteria={SUPERVISOR_CHANGE_CRITERIA}
          failingCodes={failingCodes}
          isLoading={isEligibilityLoading}
          eligibilityMode={eligibilityMode}
          titleStyle={sectionTitleStyle}
          wrapperStyle={{}}
        />
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Scholar Details</div>
        <table style={tableStyle}>
          <tbody>
            <tr>
              <td style={labelCellStyle}>Name of Scholar</td>
              <td style={tableCellStyle}><input style={readOnlyInputStyle} type="text" value={formData.scholarName} readOnly /></td>
              <td style={labelCellStyle}>Department</td>
              <td style={tableCellStyle}><input style={readOnlyInputStyle} type="text" value={formData.department} readOnly /></td>
            </tr>
            <tr>
              <td style={labelCellStyle}>Regd. No.</td>
              <td style={tableCellStyle}><input style={readOnlyInputStyle} type="text" value={formData.regdNo} readOnly /></td>
              <td style={labelCellStyle}>Date of Joining</td>
              <td style={tableCellStyle}><input style={readOnlyInputStyle} type="date" value={formData.joiningDate} readOnly /></td>
            </tr>
            <tr>
              <td style={labelCellStyle}>Basic Qualification</td>
              <td style={tableCellStyle}><input style={inputStyle} type="text" value={formData.basicQualification} onChange={(e) => setFormData({ ...formData, basicQualification: e.target.value })} /></td>
              <td style={labelCellStyle}>Research Area</td>
              <td style={tableCellStyle}><input style={readOnlyInputStyle} type="text" value={formData.researchArea} readOnly /></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Existing Supervisor Details</div>
        <table style={tableStyle}>
          <tbody>
            <tr>
              <td style={labelCellStyle}>Supervisor Name</td>
              <td style={tableCellStyle}><input style={readOnlyInputStyle} type="text" value={formData.currentSupervisorName} readOnly /></td>
              <td style={labelCellStyle}>Designation</td>
              <td style={tableCellStyle}><input style={readOnlyInputStyle} type="text" value={formData.currentSupervisorDesignation} readOnly /></td>
            </tr>
            <tr>
              <td style={labelCellStyle}>Co-Supervisor Name</td>
              <td style={tableCellStyle}><input style={readOnlyInputStyle} type="text" value={formData.existingCoSupervisorName} readOnly /></td>
              <td style={labelCellStyle}>Designation</td>
              <td style={tableCellStyle}><input style={readOnlyInputStyle} type="text" value={formData.existingCoSupervisorDesignation} readOnly /></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Proposed Supervisor Details</div>
        <table style={tableStyle}>
          <tbody>
            <tr>
              <td style={labelCellStyle}>New Supervisor</td>
              <td style={tableCellStyle}>
                <select
                  style={inputStyle}
                  value={formData.proposedSupervisorEmployeeId}
                  onChange={(e) => {
                    const nextEmployeeId = e.target.value;
                    const selectedSupervisor = supervisors.find(
                      (supervisor) => supervisor.employeeId === nextEmployeeId,
                    );

                    setFormData({
                      ...formData,
                      proposedSupervisorEmployeeId: nextEmployeeId,
                      proposedSupervisorName: selectedSupervisor?.name || "",
                    });
                  }}
                  data-testid="select-proposed-supervisor"
                  disabled={supervisorsLoading}
                >
                  <option value="">{supervisorsLoading ? "Loading supervisors..." : "Select a supervisor"}</option>
                  {supervisors
                    .filter((supervisor) => supervisor.employeeId !== formData.currentSupervisorEmployeeId)
                    .map((supervisor) => (
                      <option key={supervisor.employeeId} value={supervisor.employeeId}>
                        {supervisor.name} ({supervisor.employeeId})
                      </option>
                    ))}
                </select>
              </td>
              <td style={labelCellStyle}>New Co-Supervisor</td>
              <td style={tableCellStyle}><input style={inputStyle} type="text" value={formData.proposedCoSupervisorName} onChange={(e) => setFormData({ ...formData, proposedCoSupervisorName: e.target.value })} placeholder="Proposed Co-Supervisor Name" /></td>
            </tr>
            <tr>
              <td style={labelCellStyle}>Effect From</td>
              <td style={tableCellStyle} colSpan={3}><input style={inputStyle} type="date" value={formData.effectFromDate} onChange={(e) => setFormData({ ...formData, effectFromDate: e.target.value })} /></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Reason / Justification</div>
        <textarea
          style={{ ...inputStyle, minHeight: "120px", resize: "vertical" }}
          value={formData.reasonJustification}
          onChange={(e) => setFormData({ ...formData, reasonJustification: e.target.value })}
          placeholder="Please provide detailed reason and justification for the change/addition of supervisor(s)..."
        />
      </div>

      <SignatureBlock signatures={[
        { label: "Research Scholar", signerName: "Pending signature", signerRole: "Scholar", isPending: true },
        { label: "Research Supervisor", signerName: "Pending signature", signerRole: "Supervisor", isPending: true },
      ]} />

      <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "40px" }}>
        <button type="button" className="submit-btn" onClick={onBack} style={{ background: "#6c757d" }}>Back</button>
        <button
          type="button"
          className="submit-btn"
          onClick={() => onSubmit(buildSubmitPayload())}
          disabled={isSubmitting || !formData.proposedSupervisorEmployeeId}
          data-testid="button-submit-form"
        >
          {isSubmitting ? "Submitting..." : "Submit Application"}
        </button>
      </div>
    </div>
  );
}
