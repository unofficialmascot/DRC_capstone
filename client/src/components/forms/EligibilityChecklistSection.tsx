import type { CSSProperties } from "react";

export interface EligibilityCriterion {
  codes: string[];
  label: string;
  visibleByDefault?: boolean;
}

interface EligibilityChecklistSectionProps {
  criteria: EligibilityCriterion[];
  failingCodes: Set<string>;
  isLoading: boolean;
  eligibilityMode: string;
  titleStyle?: CSSProperties;
  wrapperStyle?: CSSProperties;
}

export function EligibilityChecklistSection({
  criteria,
  failingCodes,
  isLoading,
  eligibilityMode,
  titleStyle,
  wrapperStyle,
}: EligibilityChecklistSectionProps) {
  const visibleCriteria = criteria.filter(
    (criterion) => criterion.visibleByDefault !== false || criterion.codes.some((code) => failingCodes.has(code)),
  );

  return (
    <div style={wrapperStyle}>
      <div style={titleStyle}>Eligibility Checklist</div>
      <p style={{ fontSize: "13px", color: "#666", marginBottom: "12px" }}>
        {eligibilityMode === "enforced"
          ? "Enforced mode - unmet criteria can block submission."
          : "Advisory mode - unmet criteria will not block submission at this time."}
      </p>
      {isLoading ? (
        <p style={{ fontSize: "13px", color: "#888" }}>Checking eligibility...</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
          {visibleCriteria.map((criterion) => {
            const passes = !criterion.codes.some((code) => failingCodes.has(code));
            return (
              <li
                key={criterion.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  background: passes ? "#f0faf5" : "#fff8f0",
                  border: `1px solid ${passes ? "#b7e4cf" : "#f6d8ae"}`,
                  fontSize: "14px",
                  color: passes ? "#0b6a55" : "#b45309",
                }}
              >
                <span style={{ fontSize: "16px", lineHeight: 1 }}>{passes ? "✓" : "✗"}</span>
                <span>{criterion.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}