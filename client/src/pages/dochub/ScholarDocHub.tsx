import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiJson, apiRequest } from "@/lib/api";
import { api, appendQuery, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

interface ScholarDocHubUser {
  id: number;
}

interface Application {
  id: number;
  type: string;
}

export function ScholarDocHub({ user }: { user: ScholarDocHubUser }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAppId, setSelectedAppId] = useState<number | "">("");
  const [documentType, setDocumentType] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: [api.applications.list.path, { userId: user.id }],
    queryFn: () => {
      const query = api.applications.list.input?.parse({ userId: user.id });
      return apiJson<Application[]>(appendQuery(api.applications.list.path, query), { method: api.applications.list.method });
    },
  });

  useEffect(() => {
    if (!selectedAppId && applications.length > 0) {
      setSelectedAppId(applications[0].id);
    }
  }, [applications, selectedAppId]);

  const activeApplicationId = selectedAppId ? Number(selectedAppId) : undefined;

  const { data: documents = [], isLoading: isLoadingDocuments } = useQuery<any[]>({
    queryKey: [api.applications.documents.list.path, activeApplicationId],
    queryFn: () =>
      apiJson(buildUrl(api.applications.documents.list.path, { id: activeApplicationId! }), {
        method: api.applications.documents.list.method,
      }),
    enabled: Boolean(activeApplicationId),
  });

  const { data: checklist = [] } = useQuery<any[]>({
    queryKey: [api.applications.documents.checklist.path, activeApplicationId],
    queryFn: () =>
      apiJson(buildUrl(api.applications.documents.checklist.path, { id: activeApplicationId! }), {
        method: api.applications.documents.checklist.method,
      }),
    enabled: Boolean(activeApplicationId),
  });

  const handleUpload = async () => {
    if (!activeApplicationId) {
      toast({
        variant: "destructive",
        title: "Select an application",
        description: "Choose an application before uploading documents.",
      });
      return;
    }

    if (!documentType.trim()) {
      toast({
        variant: "destructive",
        title: "Document type required",
        description: "Provide a document type before uploading.",
      });
      return;
    }

    if (!selectedFile) {
      toast({
        variant: "destructive",
        title: "File required",
        description: "Choose a file to upload.",
      });
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg"];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast({
        variant: "destructive",
        title: "Unsupported file type",
        description: "Upload a PDF, PNG, or JPEG document.",
      });
      return;
    }

    if (selectedFile.size > maxSize) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Document uploads are limited to 10 MB.",
      });
      return;
    }

    setIsUploading(true);

    try {
      const uploadUrlPayload = await apiJson<any>(
        buildUrl(api.applications.documents.uploadUrl.path, { id: activeApplicationId }),
        {
          method: api.applications.documents.uploadUrl.method,
          body: {
            documentType,
            fileName: selectedFile.name,
            mimeType: selectedFile.type,
            fileSize: selectedFile.size,
          },
        },
      );

      await apiRequest(uploadUrlPayload.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": selectedFile.type,
        },
        body: selectedFile,
        includeCredentials: false,
      });

      await apiRequest(buildUrl(api.applications.documents.upload.path, { id: activeApplicationId }), {
        method: api.applications.documents.upload.method,
        body: {
          documentType,
          fileName: selectedFile.name,
          fileUrl: uploadUrlPayload.downloadUrl,
          fileSize: selectedFile.size,
          mimeType: selectedFile.type,
          objectKey: uploadUrlPayload.objectKey,
        },
      });

      toast({
        title: "Upload complete",
        description: "Your document was uploaded successfully.",
      });

      setDocumentType("");
      setSelectedFile(null);
      queryClient.invalidateQueries({
        queryKey: [api.applications.documents.list.path, activeApplicationId],
      });
      queryClient.invalidateQueries({
        queryKey: [api.applications.documents.checklist.path, activeApplicationId],
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error?.message || "Unable to upload the document.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ color: "#0b6a55", marginBottom: "20px" }}>Document Hub</h2>
      <div
        style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "10px",
          border: "1px solid #e6e6e6",
          marginBottom: "20px",
        }}
      >
        <p style={{ color: "#666" }}>
          Upload and manage your research documents here. Supported formats: PDF, PNG, JPEG (max
          10&nbsp;MB).
        </p>
        <div style={{ display: "grid", gap: "12px", marginTop: "15px" }}>
          <div className="form-group">
            <label>Application</label>
            <select
              value={selectedAppId}
              onChange={(event) => {
                const value = event.target.value;
                setSelectedAppId(value ? Number(value) : "");
              }}
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ddd" }}
            >
              {applications.length === 0 && <option value="">No applications found</option>}
              {applications.map((app: Application) => (
                <option key={app.id} value={app.id}>
                  {app.type} (#{app.id})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Document Type</label>
            <input
              type="text"
              value={documentType}
              onChange={(event) => setDocumentType(event.target.value)}
              placeholder="e.g., progress_report"
            />
          </div>
          <div className="form-group">
            <label>Choose File</label>
            <input
              type="file"
              accept=".pdf,image/png,image/jpeg"
              onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
            />
          </div>
          <button
            className="submit-btn"
            style={{ marginTop: "10px", width: "fit-content" }}
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? "Uploading..." : "Upload Document"}
          </button>
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "10px",
          border: "1px solid #e6e6e6",
          marginBottom: "20px",
        }}
      >
        <h3 style={{ marginBottom: "10px", color: "#0b6a55" }}>Document Checklist</h3>
        {checklist.length === 0 ? (
          <p style={{ color: "#666" }}>No checklist available for this application.</p>
        ) : (
          <table className="info-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Status</th>
                <th>Uploads</th>
              </tr>
            </thead>
            <tbody>
              {checklist.map((item: any) => (
                <tr key={item.documentType}>
                  <td>{item.displayName}</td>
                  <td>{item.status}</td>
                  <td>{item.uploadedCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", border: "1px solid #e6e6e6" }}>
        <h3 style={{ marginBottom: "10px", color: "#0b6a55" }}>Uploaded Documents</h3>
        {isLoadingDocuments ? (
          <p style={{ color: "#666" }}>Loading documents...</p>
        ) : documents.length === 0 ? (
          <p style={{ color: "#666" }}>No documents uploaded yet.</p>
        ) : (
          <table className="info-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Type</th>
                <th>Size</th>
                <th>Status</th>
                <th>Download</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc: any) => (
                <tr key={doc.id}>
                  <td>{doc.fileName}</td>
                  <td>{doc.mimeType || "N/A"}</td>
                  <td>{doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : "N/A"}</td>
                  <td>{doc.isVerified ? "Verified" : "Pending"}</td>
                  <td>
                    <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
