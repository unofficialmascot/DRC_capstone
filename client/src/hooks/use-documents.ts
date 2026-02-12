import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type Document = {
  id: number;
  scholarId: string;
  documentType: string;
  category: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  isVerified: boolean;
  verifiedBy: string | null;
  verifiedAt: string | null;
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
    queryKey: ['/api/documents', scholarId],
    queryFn: async () => {
      if (!scholarId) return [];
      const res = await fetch(`/api/documents?scholarId=${scholarId}`);
      if (!res.ok) throw new Error('Failed to fetch documents');
      return res.json();
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

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to upload');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // View document in new tab (browser preview)
  const viewDocument = (documentId: number) => {
    window.open(`/api/documents/${documentId}/view`, '_blank');
  };

  // Download document
  const downloadDocument = (documentId: number) => {
    window.open(`/api/documents/${documentId}/download`, '_blank');
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
