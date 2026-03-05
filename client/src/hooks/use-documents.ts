import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { api, buildUrl } from "@shared/routes";

type Document = {
  id: number;
  scholarId: string;
  documentType: string;
  category: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string | Date | null;
  isVerified: boolean;
  verifiedBy: string | null;
  verifiedAt: string | Date | null;
};

type UploadData = {
  file: File;
  scholarId: string;
  documentType: string;
  category: string;
};

export function useDocuments(scholarId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch documents for a scholar
  const { data: documents = [], isLoading, error } = useQuery<Document[]>({
    queryKey: [api.documents.list.path, scholarId],
    queryFn: async () => {
      if (!scholarId) return [];
      const validatedInput = api.documents.list.input.parse({ scholarId });
      const url = `${api.documents.list.path}?scholarId=${encodeURIComponent(validatedInput.scholarId)}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error('Failed to fetch documents');
      return api.documents.list.responses[200].parse(await res.json());
    },
    enabled: !!scholarId,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: UploadData) => {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('scholarId', data.scholarId);
      formData.append('documentType', data.documentType);
      formData.append('category', data.category);

      const res = await fetch(api.documents.upload.path, {
        method: api.documents.upload.method,
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to upload');
      }
      return api.documents.upload.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.documents.list.path] });
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const path = buildUrl(api.documents.delete.path, { id });
      const res = await fetch(path, {
        method: api.documents.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error('Failed to delete');
      return api.documents.delete.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.documents.list.path] });
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // View document in new tab (browser preview)
  const viewDocument = (documentId: number) => {
    const path = buildUrl(api.documents.view.path, { id: documentId });
    window.open(path, '_blank');
  };

  // Download document
  const downloadDocument = (documentId: number) => {
    const path = buildUrl(api.documents.download.path, { id: documentId });
    window.open(path, '_blank');
  };

  // Upload helper with proper typing
  const uploadDocument = (data: UploadData) => {
    return uploadMutation.mutate(data);
  };

  // Delete helper
  const deleteDocument = (documentId: number) => {
    return deleteMutation.mutate(documentId);
  };

  return {
    documents,
    isLoading,
    error,
    viewDocument,
    downloadDocument,
    uploadDocument,
    deleteDocument,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
