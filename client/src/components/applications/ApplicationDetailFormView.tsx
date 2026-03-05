import type { Application } from "@shared/schema";
import type { CSSProperties } from "react";

type ApplicationDetailFormViewProps = {
  application: Application;
  scholarDisplayName?: string;
};

const sectionHeaderStyle: CSSProperties = {
  backgroundColor: "#0b6a55",
  color: "#fff",
  padding: "10px 15px",
  fontWeight: "bold",
  margin: "20px 0 12px 0",
  borderRadius: "4px",
};

const labelStyle: CSSProperties = {
  fontSize: "12px",
  fontWeight: "bold",
  color: "#555",
  marginBottom: "5px",
  textTransform: "uppercase",
};

const valueStyle: CSSProperties = {
  border: "1px solid #dee2e6",
  padding: "10px",
  borderRadius: "4px",
  backgroundColor: "#fafafa",
  fontSize: "14px",
};

function getDetails(application: Application): Record<string, unknown> {
  return application.details && typeof application.details === "object" && !Array.isArray(application.details)
    ? (application.details as Record<string, unknown>)
    : {};
}

function renderField(label: string, value: unknown) {
  return (
    <div style={{ display: "flex", flexDirection: "column", marginBottom: "12px" }}>
      <label style={labelStyle}>{label}</label>
      <div style={valueStyle}>{value ? String(value) : "N/A"}</div>
    </div>
  );
}

function PreTalkDetail({ details }: { details: Record<string, unknown> }) {
  return (
    <>
      <div style={sectionHeaderStyle}>Part A: Research Scholar Details</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        {renderField("Department", details.department)}
        {renderField("Regd. No.", details.regdNo)}
        {renderField("Name of Research Scholar", details.scholarName)}
        {renderField("Month and Year of Joining", details.joiningMonthYear)}
      </div>
      {renderField("Name of the Research Supervisor, Institute, Campus", details.supervisorNameInstituteCampus)}
      {renderField("Topic of Research Work", details.researchTopic)}

      <div style={sectionHeaderStyle}>Publication Details</div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #dee2e6", padding: "10px", textAlign: "left", background: "#f8f9fa" }}>Publications</th>
            <th style={{ border: "1px solid #dee2e6", padding: "10px", textAlign: "left", background: "#f8f9fa" }}>National</th>
            <th style={{ border: "1px solid #dee2e6", padding: "10px", textAlign: "left", background: "#f8f9fa" }}>International</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: "1px solid #dee2e6", padding: "10px" }}>Conferences</td>
            <td style={{ border: "1px solid #dee2e6", padding: "10px" }}>{String(details.publicationsConferencesNational ?? "0")}</td>
            <td style={{ border: "1px solid #dee2e6", padding: "10px" }}>{String(details.publicationsConferencesInternational ?? "0")}</td>
          </tr>
          <tr>
            <td style={{ border: "1px solid #dee2e6", padding: "10px" }}>SCI Journals</td>
            <td style={{ border: "1px solid #dee2e6", padding: "10px" }}>{String(details.publicationsSciJournalsNational ?? "0")}</td>
            <td style={{ border: "1px solid #dee2e6", padding: "10px" }}>{String(details.publicationsSciJournalsInternational ?? "0")}</td>
          </tr>
          <tr>
            <td style={{ border: "1px solid #dee2e6", padding: "10px" }}>Non SCI Journals with impact factor</td>
            <td style={{ border: "1px solid #dee2e6", padding: "10px" }}>{String(details.publicationsNonSciImpactNational ?? "0")}</td>
            <td style={{ border: "1px solid #dee2e6", padding: "10px" }}>{String(details.publicationsNonSciImpactInternational ?? "0")}</td>
          </tr>
          <tr>
            <td style={{ border: "1px solid #dee2e6", padding: "10px" }}>Journals without impact factor</td>
            <td style={{ border: "1px solid #dee2e6", padding: "10px" }}>{String(details.publicationsNoImpactNational ?? "0")}</td>
            <td style={{ border: "1px solid #dee2e6", padding: "10px" }}>{String(details.publicationsNoImpactInternational ?? "0")}</td>
          </tr>
        </tbody>
      </table>
    </>
  );
}

function ExtensionDetail({ details }: { details: Record<string, unknown> }) {
  const tableCellStyle: CSSProperties = {
    border: "1px solid #ddd",
    padding: "10px",
    textAlign: "left",
  };

  const tableStyle: CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  };

  return (
    <>
      <div style={sectionHeaderStyle}>1. (a) Research Scholar Details</div>
      <table style={tableStyle}>
        <tbody>
          <tr><td style={tableCellStyle}>Name of the Candidate</td><td style={tableCellStyle}>{String(details.candidateName ?? "N/A")}</td></tr>
          <tr><td style={tableCellStyle}>Date of Registration & Department</td><td style={tableCellStyle}>{String(details.registrationDateDepartment ?? "N/A")}</td></tr>
          <tr><td style={tableCellStyle}>Program Registration Category</td><td style={tableCellStyle}>{String(details.programRegistrationCategory ?? "N/A")}</td></tr>
          <tr><td style={tableCellStyle}>Phone No. & Email Id</td><td style={tableCellStyle}>{String(details.phoneEmail ?? "N/A")}</td></tr>
          <tr><td style={tableCellStyle}>Name of the Research Supervisor</td><td style={tableCellStyle}>{String(details.supervisorName ?? "N/A")}</td></tr>
          <tr><td style={tableCellStyle}>Area of Research</td><td style={tableCellStyle}>{String(details.researchArea ?? "N/A")}</td></tr>
          <tr><td style={tableCellStyle}>Title of the Research Work</td><td style={tableCellStyle}>{String(details.researchTitle ?? "N/A")}</td></tr>
        </tbody>
      </table>

      <div style={sectionHeaderStyle}>1. (b) Extension Duration Required Details</div>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={tableCellStyle}>Registration Date</th>
            <th style={tableCellStyle}>Duration Eligible</th>
            <th style={tableCellStyle}>Required Extension till Date</th>
            <th style={tableCellStyle}>Months Required</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tableCellStyle}>{String(details.registrationDate ?? "N/A")}</td>
            <td style={tableCellStyle}>{String(details.durationEligible ?? "N/A")}</td>
            <td style={tableCellStyle}>{String(details.requiredExtensionTillDate ?? "N/A")}</td>
            <td style={tableCellStyle}>{String(details.extensionDuration ?? "N/A")}</td>
          </tr>
        </tbody>
      </table>

      <div style={sectionHeaderStyle}>2. Brief Details of Research Progress</div>
      <div style={valueStyle}>{String(details.researchProgress ?? "N/A")}</div>

      <div style={sectionHeaderStyle}>3. Details of Publications</div>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={tableCellStyle}>Category</th>
            <th style={tableCellStyle}>National</th>
            <th style={tableCellStyle}>International</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tableCellStyle}>Conferences</td>
            <td style={tableCellStyle}>{String(details.publicationsConferencesNational ?? "0")}</td>
            <td style={tableCellStyle}>{String(details.publicationsConferencesInternational ?? "0")}</td>
          </tr>
          <tr>
            <td style={tableCellStyle}>SCI Journals</td>
            <td style={tableCellStyle}>{String(details.publicationsSciJournalsNational ?? "0")}</td>
            <td style={tableCellStyle}>{String(details.publicationsSciJournalsInternational ?? "0")}</td>
          </tr>
        </tbody>
      </table>
    </>
  );
}

function SupervisorChangeDetail({ details }: { details: Record<string, unknown> }) {
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

  return (
    <>
      <div style={sectionHeaderStyle}>Scholar Details</div>
      <table style={tableStyle}>
        <tbody>
          <tr>
            <td style={labelCellStyle}>Name of Scholar</td>
            <td style={tableCellStyle}>{String(details.scholarName ?? "N/A")}</td>
            <td style={labelCellStyle}>Department</td>
            <td style={tableCellStyle}>{String(details.department ?? "N/A")}</td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Regd. No.</td>
            <td style={tableCellStyle}>{String(details.regdNo ?? "N/A")}</td>
            <td style={labelCellStyle}>Date of Joining</td>
            <td style={tableCellStyle}>{String(details.joiningDate ?? "N/A")}</td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Basic Qualification</td>
            <td style={tableCellStyle}>{String(details.basicQualification ?? "N/A")}</td>
            <td style={labelCellStyle}>Research Area</td>
            <td style={tableCellStyle}>{String(details.researchArea ?? "N/A")}</td>
          </tr>
        </tbody>
      </table>

      <div style={sectionHeaderStyle}>Existing Supervisor Details</div>
      <table style={tableStyle}>
        <tbody>
          <tr>
            <td style={labelCellStyle}>Supervisor Name</td>
            <td style={tableCellStyle}>{String(details.currentSupervisorName ?? "N/A")}</td>
            <td style={labelCellStyle}>Designation</td>
            <td style={tableCellStyle}>{String(details.currentSupervisorDesignation ?? "N/A")}</td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Co-Supervisor Name</td>
            <td style={tableCellStyle}>{String(details.existingCoSupervisorName ?? "N/A")}</td>
            <td style={labelCellStyle}>Designation</td>
            <td style={tableCellStyle}>{String(details.existingCoSupervisorDesignation ?? "N/A")}</td>
          </tr>
        </tbody>
      </table>

      <div style={sectionHeaderStyle}>Proposed Supervisor Details</div>
      <table style={tableStyle}>
        <tbody>
          <tr>
            <td style={labelCellStyle}>New Supervisor</td>
            <td style={tableCellStyle}>{String(details.proposedSupervisorName ?? details.proposedSupervisorEmployeeId ?? "N/A")}</td>
            <td style={labelCellStyle}>New Co-Supervisor</td>
            <td style={tableCellStyle}>{String(details.proposedCoSupervisorName ?? "N/A")}</td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Effect From</td>
            <td style={tableCellStyle} colSpan={3}>{String(details.effectFromDate ?? "N/A")}</td>
          </tr>
        </tbody>
      </table>

      <div style={sectionHeaderStyle}>Reason / Justification</div>
      <div style={valueStyle}>{String(details.reasonJustification ?? "N/A")}</div>
    </>
  );
}

function ReRegistrationDetail({ details }: { details: Record<string, unknown> }) {
  const tableStyle: CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    margin: "12px 0",
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

  return (
    <>
      <div style={sectionHeaderStyle}>Scholar Details</div>
      <table style={tableStyle}>
        <tbody>
          <tr>
            <td style={labelCellStyle}>Name of the Scholar</td>
            <td style={cellStyle}>{String(details.scholarName ?? "N/A")}</td>
            <td style={labelCellStyle}>Reg. No.</td>
            <td style={cellStyle}>{String(details.regNo ?? "N/A")}</td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Date of Joining</td>
            <td style={cellStyle}>{String(details.joiningDate ?? "N/A")}</td>
            <td style={labelCellStyle}>Programme Category</td>
            <td style={cellStyle}>{String(details.programmeCategory ?? "N/A")}</td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Department & School</td>
            <td style={cellStyle}>{String(details.department ?? "N/A")}</td>
            <td style={labelCellStyle}>Area of Research</td>
            <td style={cellStyle}>{String(details.researchArea ?? "N/A")}</td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Mobile</td>
            <td style={cellStyle}>{String(details.mobile ?? "N/A")}</td>
            <td style={labelCellStyle}>Email</td>
            <td style={cellStyle}>{String(details.email ?? "N/A")}</td>
          </tr>
        </tbody>
      </table>

      <div style={sectionHeaderStyle}>Fee Payment Details</div>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={cellStyle}>Academic Year</th>
            <th style={cellStyle}>Challan / Ref No.</th>
            <th style={cellStyle}>Date of Payment</th>
            <th style={cellStyle}>Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={cellStyle}>{String(details.feeAcademicYear ?? "N/A")}</td>
            <td style={cellStyle}>{String(details.feeChallanRef ?? "N/A")}</td>
            <td style={cellStyle}>{String(details.feePaymentDate ?? "N/A")}</td>
            <td style={cellStyle}>{String(details.feeAmount ?? "N/A")}</td>
          </tr>
        </tbody>
      </table>

      <div style={sectionHeaderStyle}>Supervisor Recommendation</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        {renderField("Research Supervisor", details.supervisorName)}
        {renderField("Supervisor Designation", details.supervisorDesignation)}
        {renderField("Supervisor Department", details.supervisorDepartment)}
        {renderField("Co-Supervisor", details.coSupervisorName)}
      </div>
      {renderField("Co-Supervisor Designation", details.coSupervisorDesignation)}
      {renderField("Co-Supervisor Department", details.coSupervisorDepartment)}
      {renderField("Extension Details", details.extensionDetails)}
      {renderField("Supervisor Comments", details.supervisorComments)}
      {renderField("Recommended for Extension / Re-registration", details.recommendedForExtension)}

      <div style={sectionHeaderStyle}>Publication Summary</div>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={cellStyle}>Journal</th>
            <th style={cellStyle}>Paper Details</th>
            <th style={cellStyle}>Vol/Issue/Year</th>
            <th style={cellStyle}>Impact Factor</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={cellStyle}>{String(details.publicationJournalName ?? "N/A")}</td>
            <td style={cellStyle}>{String(details.publicationPaperDetails ?? "N/A")}</td>
            <td style={cellStyle}>{String(details.publicationVolIssueYear ?? "N/A")}</td>
            <td style={cellStyle}>{String(details.publicationImpactFactor ?? "N/A")}</td>
          </tr>
        </tbody>
      </table>
    </>
  );
}

function ThesisSubmissionDetail({ details }: { details: Record<string, unknown> }) {
  const tableStyle: CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    margin: "12px 0",
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

  return (
    <>
      <div style={sectionHeaderStyle}>Thesis Submission Details</div>
      <table style={tableStyle}>
        <tbody>
          <tr><td style={labelCellStyle}>Name of Scholar</td><td style={cellStyle}>{String(details.scholarName ?? "N/A")}</td></tr>
          <tr><td style={labelCellStyle}>Registration Number</td><td style={cellStyle}>{String(details.regNo ?? "N/A")}</td></tr>
          <tr><td style={labelCellStyle}>Category</td><td style={cellStyle}>{String(details.category ?? "N/A")}</td></tr>
          <tr><td style={labelCellStyle}>Department</td><td style={cellStyle}>{String(details.department ?? "N/A")}</td></tr>
          <tr><td style={labelCellStyle}>Title of Thesis</td><td style={cellStyle}>{String(details.thesisTitle ?? "N/A")}</td></tr>
          <tr><td style={labelCellStyle}>Year of Registration & Date</td><td style={cellStyle}>{String(details.registrationYearDate ?? "N/A")}</td></tr>
        </tbody>
      </table>

      <div style={sectionHeaderStyle}>Supervisor Information</div>
      {renderField("Research Supervisor & Address", details.supervisorNameAddress)}
      {renderField("Co-Research Supervisor & Address", details.coSupervisorNameAddress)}

      <div style={sectionHeaderStyle}>No-Dues Certificates</div>
      <table style={tableStyle}>
        <tbody>
          <tr>
            <td style={labelCellStyle}>Principal's Office</td>
            <td style={cellStyle}>{String(details.noDuesPrincipal ?? "N/A")}</td>
            <td style={labelCellStyle}>Head of Department</td>
            <td style={cellStyle}>{String(details.noDuesHod ?? "N/A")}</td>
          </tr>
          <tr>
            <td style={labelCellStyle}>University Library (KRC)</td>
            <td style={cellStyle}>{String(details.noDuesLibrary ?? "N/A")}</td>
            <td style={labelCellStyle}>Hostel</td>
            <td style={cellStyle}>{String(details.noDuesHostel ?? "N/A")}</td>
          </tr>
        </tbody>
      </table>

      <div style={sectionHeaderStyle}>Fee and Correspondence</div>
      {renderField("Adjudication Fee Amount", details.adjudicationFeeAmount)}
      {renderField("Address for Correspondence", details.correspondenceAddress)}
      {renderField("Scholar Signature Date", details.signatureDate)}
    </>
  );
}

function GenericDetail({ details, title }: { details: Record<string, unknown>; title: string }) {
  return (
    <>
      <div style={sectionHeaderStyle}>{title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        {Object.entries(details)
          .filter(([key, value]) => key !== "enclosures" && typeof value !== "object")
          .map(([key, value]) => (
            <div key={key}>{renderField(key.replace(/([A-Z])/g, " $1").trim(), value)}</div>
          ))}
      </div>
    </>
  );
}

function ApplicationTypeSection({ application }: { application: Application }) {
  const details = getDetails(application);

  if (application.type === "Pre-Talk") {
    return <PreTalkDetail details={details} />;
  }

  if (application.type === "Extension") {
    return <ExtensionDetail details={details} />;
  }

  if (application.type === "Supervisor Change") {
    return <SupervisorChangeDetail details={details} />;
  }

  if (application.type === "Re-Registration") {
    return <ReRegistrationDetail details={details} />;
  }

  if (application.type === "Thesis Submission") {
    return <ThesisSubmissionDetail details={details} />;
  }

  return <GenericDetail details={details} title="Application Details" />;
}

export default function ApplicationDetailFormView({
  application,
  scholarDisplayName,
}: ApplicationDetailFormViewProps) {
  return (
    <div style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: "8px" }}>
      <div style={{ marginBottom: "12px", fontSize: "14px", color: "#555" }}>
        <strong>Scholar:</strong> {scholarDisplayName || application.scholarId} | <strong>Type:</strong> {application.type}
      </div>

      <ApplicationTypeSection application={application} />
    </div>
  );
}
