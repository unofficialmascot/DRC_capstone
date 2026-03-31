import { useState } from "react";
import { useDocuments } from "@/hooks/use-documents";
import { DOC_HUB_DOCUMENT_TYPES } from "@shared/enclosures";
import FormCard from "@/components/ui/FormCard";
import ActionButton from "@/components/ui/ActionButton";

export default function ScholarDocHub({ scholarId }: { scholarId: string }) {
  const { documents, viewDocument, downloadDocument, uploadDocument, isUploading } = useDocuments(scholarId);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    documentType: "",
    category: "",
  });

  const documentTypes = DOC_HUB_DOCUMENT_TYPES;

  const handleUpload = () => {
    if (!uploadForm.file || !uploadForm.documentType || !uploadForm.category) {
      return;
    }

    uploadDocument({
      file: uploadForm.file,
      scholarId,
      documentType: uploadForm.documentType,
      category: uploadForm.category,
    });

    setUploadOpen(false);
    setUploadForm({ file: null, documentType: "", category: "" });
  };

  const getDocumentInfo = (type: string, category: string) => {
    const categoryDocs = documentTypes[category as keyof typeof documentTypes] || [];
    return categoryDocs.find((doc) => doc.value === type);
  };

  const renderDocumentCard = (type: string, category: string) => {
    const info = getDocumentInfo(type, category);
    if (!info) return null;

    const doc = documents.find((d) => d.documentType === type);

    return (
      <FormCard key={type} style={{ marginBottom: "15px" }}>
        <div style={{ marginBottom: "15px" }}>
          <h4 style={{ color: "#0b6a55", marginBottom: "8px" }}>{info.label}</h4>
          <p style={{ color: "#666", fontSize: "14px" }}>{info.description}</p>
        </div>
        {doc && (
          <div style={{ fontSize: "13px", color: "#666", marginBottom: "10px" }}>
            <span>Uploaded: {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : "N/A"}</span>
            {doc.isVerified && (
              <span style={{ marginLeft: "10px", color: "#27ae60", fontWeight: "600" }}>✓ Verified</span>
            )}
          </div>
        )}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <ActionButton
            variant="primary"
            size="sm"
            onClick={() => doc && viewDocument(doc.id)}
            disabled={!doc}
          >
            👁 View
          </ActionButton>
          <ActionButton
            variant="success"
            size="sm"
            onClick={() => doc && downloadDocument(doc.id)}
            disabled={!doc}
          >
            ⬇ Download
          </ActionButton>
          <ActionButton
            variant="warning"
            size="sm"
            onClick={() => {
              setUploadForm({ file: null, documentType: type, category: category });
              setUploadOpen(true);
            }}
          >
            ⬆ Upload
          </ActionButton>
        </div>
      </FormCard>
    );
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ color: "#0b6a55", marginBottom: "20px" }}>Doc-Hub</h2>
      
      <div style={{ marginBottom: "30px" }}>
        <h3 style={{ color: "#0b6a55", marginBottom: "15px", fontSize: "18px" }}>Personal Identification Documents</h3>
        {documentTypes.personal.map((doc) => renderDocumentCard(doc.value, "personal"))}
      </div>

      <div style={{ marginBottom: "30px" }}>
        <h3 style={{ color: "#0b6a55", marginBottom: "15px", fontSize: "18px" }}>Academic Documents</h3>
        {documentTypes.academic.map((doc) => renderDocumentCard(doc.value, "academic"))}
      </div>

      <div style={{ marginBottom: "30px" }}>
        <h3 style={{ color: "#0b6a55", marginBottom: "15px", fontSize: "18px" }}>Research & Enclosure Documents</h3>
        {documentTypes.research.map((doc) => renderDocumentCard(doc.value, "research"))}
      </div>

      {uploadOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }} onClick={() => setUploadOpen(false)}>
          <div style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "30px",
            width: "90%",
            maxWidth: "500px",
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: "#0b6a55", marginBottom: "20px" }}>Upload Document</h3>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Document Category</label>
              <select 
                value={uploadForm.category} 
                onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value, documentType: "" })}
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ddd" }}
              >
                <option value="">Select category</option>
                <option value="personal">Personal Identification</option>
                <option value="academic">Academic Documents</option>
                <option value="research">Research & Enclosures</option>
              </select>
            </div>
            {uploadForm.category && (
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Document Type</label>
                <select 
                  value={uploadForm.documentType} 
                  onChange={(e) => setUploadForm({ ...uploadForm, documentType: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ddd" }}
                >
                  <option value="">Select document type</option>
                  {documentTypes[uploadForm.category as keyof typeof documentTypes]?.map((doc) => (
                    <option key={doc.value} value={doc.value}>{doc.label}</option>
                  ))}
                </select>
              </div>
            )}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>File (PDF, JPG, PNG - max 10MB)</label>
              <input 
                type="file" 
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                style={{ width: "100%", padding: "10px" }}
              />
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button 
                type="button"
                className="submit-btn"
                onClick={handleUpload}
                disabled={isUploading}
                style={{ flex: 1 }}
              >
                {isUploading ? "Uploading..." : "Upload"}
              </button>
              <button 
                type="button"
                className="submit-btn"
                onClick={() => setUploadOpen(false)}
                style={{ flex: 1, background: "#666" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
