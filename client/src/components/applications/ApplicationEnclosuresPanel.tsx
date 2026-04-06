type EnclosureMatchedDocument = {
  id: number;
  fileName: string;
  documentType: string;
  category: string;
  uploadedAt?: string;
  isVerified?: boolean;
};

type EnclosureRequirement = {
  code: string;
  label: string;
  required: boolean;
  status: "attached" | "missing";
  matchedDocuments: EnclosureMatchedDocument[];
};

type EnclosureSnapshot = {
  source: "dochub";
  generatedAt: string;
  requirements: EnclosureRequirement[];
  summary: {
    requiredTotal: number;
    requiredAttached: number;
    requiredMissing: number;
  };
};

type ApplicationAttachedDocument = {
  id: number;
  fileName: string;
  documentType: string;
  category: string;
  uploadedAt?: string;
  isVerified?: boolean;
  requirementCode?: string | null;
};

function isEnclosureSnapshot(value: unknown): value is EnclosureSnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as { requirements?: unknown; summary?: unknown };
  return Array.isArray(candidate.requirements) && !!candidate.summary;
}

export default function ApplicationEnclosuresPanel({
  details,
  documents = [],
}: {
  details: unknown;
  documents?: ApplicationAttachedDocument[];
}) {
  const detailRecord = details && typeof details === "object"
    ? (details as { enclosures?: unknown })
    : undefined;
  const enclosureSnapshot = detailRecord && isEnclosureSnapshot(detailRecord.enclosures)
    ? detailRecord.enclosures
    : null;

  if (!enclosureSnapshot && documents.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: "20px", borderTop: "1px solid #e6e6e6", paddingTop: "20px" }}>
      {enclosureSnapshot && (
        <>
          <h4 style={{ color: "#0b6a55", marginBottom: "10px" }}>Enclosures (Auto Attached from Doc Hub)</h4>
          <div style={{ fontSize: "13px", color: "#666", marginBottom: "12px" }}>
            Required attached: {enclosureSnapshot.summary.requiredAttached}/{enclosureSnapshot.summary.requiredTotal} • Missing: {enclosureSnapshot.summary.requiredMissing}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "10px", marginBottom: documents.length > 0 ? "18px" : 0 }}>
            {enclosureSnapshot.requirements.map((requirement) => (
              <div
                key={requirement.code}
                style={{
                  border: "1px solid #e6e6e6",
                  borderRadius: "8px",
                  padding: "12px",
                  background: requirement.status === "attached" ? "#f1fff7" : "#fff5f5",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "8px" }}>
                  <div style={{ fontWeight: 600, color: "#0b6a55" }}>{requirement.label}</div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: requirement.status === "attached" ? "#27ae60" : "#e74c3c" }}>
                    {requirement.status === "attached" ? "Attached" : "Missing"}
                    {requirement.required ? " • Required" : " • Optional"}
                  </div>
                </div>

                {requirement.matchedDocuments.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px" }}>
                    {requirement.matchedDocuments.map((document) => (
                      <div key={document.id} style={{ background: "#fff", borderRadius: "6px", padding: "8px", border: "1px solid #e6e6e6" }}>
                        <div style={{ fontSize: "13px", color: "#333", marginBottom: "6px" }}>{document.fileName}</div>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <button type="button" className="submit-btn" style={{ padding: "6px 10px", fontSize: "12px" }} onClick={() => window.open(`/api/documents/${document.id}/view`, "_blank")}>View</button>
                          <button type="button" className="submit-btn" style={{ padding: "6px 10px", fontSize: "12px", background: "#27ae60" }} onClick={() => window.open(`/api/documents/${document.id}/download`, "_blank")}>Download</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: "12px", color: "#777" }}>No matching file found in Doc Hub.</div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {documents.length > 0 && (
        <>
          <h4 style={{ color: "#0b6a55", marginBottom: "10px" }}>Documents Linked to This Application</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px" }}>
            {documents.map((document) => (
              <div key={document.id} style={{ background: "#fff", borderRadius: "6px", padding: "10px", border: "1px solid #e6e6e6" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "6px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#333" }}>{document.fileName}</div>
                  {document.isVerified ? (
                    <div style={{ fontSize: "11px", color: "#0b6a55" }}>
                      Verified
                    </div>
                  ) : null}
                </div>
                <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
                  {document.documentType} • {document.category}
                  {document.requirementCode ? ` • Requirement: ${document.requirementCode}` : ""}
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button type="button" className="submit-btn" style={{ padding: "6px 10px", fontSize: "12px" }} onClick={() => window.open(`/api/documents/${document.id}/view`, "_blank")}>View</button>
                  <button type="button" className="submit-btn" style={{ padding: "6px 10px", fontSize: "12px", background: "#27ae60" }} onClick={() => window.open(`/api/documents/${document.id}/download`, "_blank")}>Download</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}