import { useState } from "react";
import { useSupervisors } from "@/hooks/use-users";
import type { PublicUser } from "@/lib/types";
import { EligibilityChecklistSection } from "@/components/forms/EligibilityChecklistSection";
import { useApplicationEligibility } from "@/hooks/use-applications";
import { APP_SETTINGS } from "@shared/app-settings";

const PRE_TALK_CRITERIA = [
  { codes: ["FEE_DUES_OUTSTANDING"], label: "No outstanding fee dues" },
  { codes: ["ACADEMIC_PERCENTAGE_TOO_LOW", "ACADEMIC_PERCENTAGE_UNAVAILABLE"], label: "Minimum 70% academic percentage" },
  { codes: ["INSUFFICIENT_RAC_MEETINGS"], label: "At least 2 RAC meetings attended" },
  { codes: ["SCHOLAR_NOT_ACTIVE"], label: "Scholar status is Active", visibleByDefault: false },
  { codes: ["INSUFFICIENT_REVIEWS"], label: "Required reviews completed", visibleByDefault: false },
  { codes: ["PENDING_REPORTS_EXIST"], label: "No pending reports", visibleByDefault: false },
  { codes: ["MISSING_VERIFIED_DOCUMENTS"], label: "Required documents verified (progress report, coursework marks memo)", visibleByDefault: false },
  { codes: ["ACTIVE_APPLICATION_EXISTS"], label: "No active application of this type", visibleByDefault: false },
];

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
  const { data: supervisors = [] } = useSupervisors();
  const { data: eligibilityData, isLoading: isEligibilityLoading } = useApplicationEligibility();

  const preTalkEligibility = eligibilityData?.items.find(
    (item) => item.applicationType === "Pre-Talk",
  );
  const eligibilityMode = eligibilityData?.mode ?? APP_SETTINGS.applicationEligibilityMode;
  const failingCodes = new Set(
    (preTalkEligibility?.reasons ?? []).map((r) => r.code),
  );

  const [publicationDetails, setPublicationDetails] = useState({
    publicationsConferencesNational: "0",
    publicationsConferencesInternational: "0",
    publicationsSciJournalsNational: "0",
    publicationsSciJournalsInternational: "0",
    publicationsNonSciImpactNational: "0",
    publicationsNonSciImpactInternational: "0",
    publicationsNoImpactNational: "0",
    publicationsNoImpactInternational: "0",
  });

  const formatJoiningMonthYear = (joiningDate?: string | null): string => {
    if (!joiningDate) {
      return "N/A";
    }

    const parsed = new Date(joiningDate);
    if (Number.isNaN(parsed.getTime())) {
      return joiningDate;
    }

    return parsed.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const supervisorName = supervisors.find(
    (supervisor) => supervisor.employeeId === user.supervisorId,
  )?.name;

  const partADetails = {
    department: user.department || "N/A",
    regdNo: user.scholarId || "N/A",
    scholarName: user.name || "N/A",
    joiningMonthYear: formatJoiningMonthYear(user.joiningDate || null),
    supervisorNameInstituteCampus: `${supervisorName || user.supervisorId || "N/A"}, GITAM, ${user.location || "N/A"}`,
    researchTopic: user.researchTitle || "N/A",
  };

  const submitDetails = {
    ...partADetails,
    ...publicationDetails,
  };

  const sectionHeaderStyle: React.CSSProperties = {
    backgroundColor: "#0b6a55",
    color: "#ffffff",
    padding: "10px 15px",
    fontWeight: "bold",
    margin: "25px 0 15px 0",
    borderRadius: "4px",
    fontSize: "14px",
  };

  const fieldLabelStyle: React.CSSProperties = {
    fontSize: "12px",
    fontWeight: "bold",
    color: "#555",
    marginBottom: "5px",
    textTransform: "uppercase",
  };

  const readOnlyInputStyle: React.CSSProperties = {
    border: "1px solid #dee2e6",
    padding: "10px",
    borderRadius: "4px",
    backgroundColor: "#fafafa",
    fontSize: "14px",
    color: "#333",
  };

  const publicationInputStyle: React.CSSProperties = {
    border: "1px solid #dee2e6",
    padding: "6px",
    borderRadius: "4px",
    width: "64px",
    backgroundColor: "#fafafa",
    fontSize: "14px",
  };

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        background: "#fff",
        padding: "40px",
        borderTop: "8px solid #0b6a55",
        boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ textAlign: "center", borderBottom: "1px solid #dee2e6", marginBottom: "30px", paddingBottom: "20px" }}>
        <div style={{ color: "#0b6a55", fontSize: "24px", fontWeight: 700, margin: 0 }}>
          GANDHI INSTITUTE OF TECHNOLOGY AND MANAGEMENT (GITAM)
        </div>
        <div style={{ fontSize: "18px", margin: "5px 0", fontWeight: 500 }}>(DEEMED TO BE UNIVERSITY)</div>
        <div>GITAM School of Technology - Hyderabad</div>
        <div style={{ fontWeight: "bold", color: "#666", marginTop: "10px" }}>
          Research Form - V: Ph.D. Pre-Submission Talk Report
        </div>
      </div>

      <div style={{ marginBottom: "24px", padding: "20px", border: "1px solid #eee", borderRadius: "10px" }}>
        <EligibilityChecklistSection
          criteria={PRE_TALK_CRITERIA}
          failingCodes={failingCodes}
          isLoading={isEligibilityLoading}
          eligibilityMode={eligibilityMode}
          titleStyle={{ fontWeight: "bold", marginBottom: "15px", paddingBottom: "8px", borderBottom: "1px solid #eee", color: "#0b6a55", fontSize: "16px" }}
          wrapperStyle={{}}
        />
      </div>

      <div style={sectionHeaderStyle}>Part A: To be filled in by the Research Scholar</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div style={{ display: "flex", flexDirection: "column", marginBottom: "15px" }}>
          <label style={fieldLabelStyle}>Department</label>
          <input type="text" value={partADetails.department} readOnly style={readOnlyInputStyle} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginBottom: "15px" }}>
          <label style={fieldLabelStyle}>Regd. No.</label>
          <input type="text" value={partADetails.regdNo} readOnly style={readOnlyInputStyle} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginBottom: "15px" }}>
          <label style={fieldLabelStyle}>Name of Research Scholar</label>
          <input type="text" value={partADetails.scholarName} readOnly style={readOnlyInputStyle} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginBottom: "15px" }}>
          <label style={fieldLabelStyle}>Month and Year of Joining</label>
          <input type="text" value={partADetails.joiningMonthYear} readOnly style={readOnlyInputStyle} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", marginBottom: "15px" }}>
        <label style={fieldLabelStyle}>Name of the Research Supervisor, Institute, Campus</label>
        <input type="text" value={partADetails.supervisorNameInstituteCampus} readOnly style={readOnlyInputStyle} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", marginBottom: "15px" }}>
        <label style={fieldLabelStyle}>Topic of Research Work</label>
        <textarea rows={2} value={partADetails.researchTopic} readOnly style={readOnlyInputStyle} />
      </div>

      <div style={sectionHeaderStyle}>Details of Publications</div>

      <table style={{ width: "100%", borderCollapse: "collapse", margin: "15px 0" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #dee2e6", padding: "12px", textAlign: "left", backgroundColor: "#f8f9fa" }}>Publications</th>
            <th style={{ border: "1px solid #dee2e6", padding: "12px", textAlign: "left", backgroundColor: "#f8f9fa" }}>National</th>
            <th style={{ border: "1px solid #dee2e6", padding: "12px", textAlign: "left", backgroundColor: "#f8f9fa" }}>International</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: "1px solid #dee2e6", padding: "12px" }}>Conferences</td>
            <td style={{ border: "1px solid #dee2e6", padding: "12px" }}>
              <input
                type="number"
                min="0"
                value={publicationDetails.publicationsConferencesNational}
                onChange={(e) =>
                  setPublicationDetails((current) => ({
                    ...current,
                    publicationsConferencesNational: e.target.value,
                  }))
                }
                style={publicationInputStyle}
              />
            </td>
            <td style={{ border: "1px solid #dee2e6", padding: "12px" }}>
              <input
                type="number"
                min="0"
                value={publicationDetails.publicationsConferencesInternational}
                onChange={(e) =>
                  setPublicationDetails((current) => ({
                    ...current,
                    publicationsConferencesInternational: e.target.value,
                  }))
                }
                style={publicationInputStyle}
              />
            </td>
          </tr>
          <tr>
            <td style={{ border: "1px solid #dee2e6", padding: "12px" }}>SCI Journals</td>
            <td style={{ border: "1px solid #dee2e6", padding: "12px" }}>
              <input
                type="number"
                min="0"
                value={publicationDetails.publicationsSciJournalsNational}
                onChange={(e) =>
                  setPublicationDetails((current) => ({
                    ...current,
                    publicationsSciJournalsNational: e.target.value,
                  }))
                }
                style={publicationInputStyle}
              />
            </td>
            <td style={{ border: "1px solid #dee2e6", padding: "12px" }}>
              <input
                type="number"
                min="0"
                value={publicationDetails.publicationsSciJournalsInternational}
                onChange={(e) =>
                  setPublicationDetails((current) => ({
                    ...current,
                    publicationsSciJournalsInternational: e.target.value,
                  }))
                }
                style={publicationInputStyle}
              />
            </td>
          </tr>
          <tr>
            <td style={{ border: "1px solid #dee2e6", padding: "12px" }}>Non SCI Journals with impact factor</td>
            <td style={{ border: "1px solid #dee2e6", padding: "12px" }}>
              <input
                type="number"
                min="0"
                value={publicationDetails.publicationsNonSciImpactNational}
                onChange={(e) =>
                  setPublicationDetails((current) => ({
                    ...current,
                    publicationsNonSciImpactNational: e.target.value,
                  }))
                }
                style={publicationInputStyle}
              />
            </td>
            <td style={{ border: "1px solid #dee2e6", padding: "12px" }}>
              <input
                type="number"
                min="0"
                value={publicationDetails.publicationsNonSciImpactInternational}
                onChange={(e) =>
                  setPublicationDetails((current) => ({
                    ...current,
                    publicationsNonSciImpactInternational: e.target.value,
                  }))
                }
                style={publicationInputStyle}
              />
            </td>
          </tr>
          <tr>
            <td style={{ border: "1px solid #dee2e6", padding: "12px" }}>Journals without impact factor</td>
            <td style={{ border: "1px solid #dee2e6", padding: "12px" }}>
              <input
                type="number"
                min="0"
                value={publicationDetails.publicationsNoImpactNational}
                onChange={(e) =>
                  setPublicationDetails((current) => ({
                    ...current,
                    publicationsNoImpactNational: e.target.value,
                  }))
                }
                style={publicationInputStyle}
              />
            </td>
            <td style={{ border: "1px solid #dee2e6", padding: "12px" }}>
              <input
                type="number"
                min="0"
                value={publicationDetails.publicationsNoImpactInternational}
                onChange={(e) =>
                  setPublicationDetails((current) => ({
                    ...current,
                    publicationsNoImpactInternational: e.target.value,
                  }))
                }
                style={publicationInputStyle}
              />
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ display: "flex", justifyContent: "center", gap: "15px", marginTop: "30px" }}>
        <button
          type="button"
          className="submit-btn"
          style={{ background: "#6c757d" }}
          onClick={onBack}
        >
          Back to Options
        </button>
        <button
          type="button"
          className="submit-btn"
          onClick={() => onSubmit(submitDetails)}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Application"}
        </button>
      </div>
    </div>
  );
}
