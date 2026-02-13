import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, Eye, CheckCircle2, FileText, CreditCard, Image as ImageIcon, GraduationCap, FileCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DOC_HUB_DOCUMENT_TYPES } from "@shared/enclosures";

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

const documentTypes = {
  personal: DOC_HUB_DOCUMENT_TYPES.personal.map((item) => ({ ...item, icon: item.value === "pan" ? CreditCard : item.value === "passport" ? ImageIcon : FileText })),
  academic: DOC_HUB_DOCUMENT_TYPES.academic.map((item) => ({ ...item, icon: item.value === "grade_cards" ? GraduationCap : item.value === "degree_certificates" ? FileCheck : FileText })),
  research: DOC_HUB_DOCUMENT_TYPES.research.map((item) => ({ ...item, icon: FileText })),
};

export default function DocHub() {
  const { id } = useParams<{ id: string }>();
  const scholarId = id || "GITAM-SCH-2021-204"; // Default for demo
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    documentType: '',
    category: '',
  });

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ['/api/documents', scholarId],
    queryFn: async () => {
      const res = await fetch(`/api/documents?scholarId=${scholarId}`);
      if (!res.ok) throw new Error('Failed to fetch documents');
      return res.json();
    },
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
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
      setUploadOpen(false);
      setUploadForm({ file: null, documentType: '', category: '' });
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
  });

  const handleUpload = () => {
    if (!uploadForm.file || !uploadForm.documentType || !uploadForm.category) {
      toast({
        title: "Validation Error",
        description: "Please fill all fields",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadForm.file);
    formData.append('scholarId', scholarId);
    formData.append('documentType', uploadForm.documentType);
    formData.append('category', uploadForm.category);

    uploadMutation.mutate(formData);
  };

  const handleDownload = async (docId: number) => {
    window.open(`/api/documents/${docId}/download`, '_blank');
  };

  const getDocumentInfo = (type: string, category: string) => {
    const categoryDocs = documentTypes[category as keyof typeof documentTypes] || [];
    return categoryDocs.find(d => d.value === type);
  };

  const renderDocumentCard = (type: string, category: string) => {
    const info = getDocumentInfo(type, category);
    if (!info) return null;

    const doc = documents.find(d => d.documentType === type);
    const Icon = info.icon;

    return (
      <Card key={type} className="relative overflow-hidden hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-50">
                <Icon className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <CardTitle className="text-lg text-teal-700">{info.label}</CardTitle>
                <CardDescription className="text-sm mt-1">
                  {info.description}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {doc && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</span>
              {doc.isVerified && (
                <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="default" 
              className="bg-teal-600 hover:bg-teal-700"
              onClick={() => doc && handleDownload(doc.id)}
              disabled={!doc}
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button 
              size="sm" 
              variant="default" 
              className="bg-teal-700 hover:bg-teal-800"
              onClick={() => doc && handleDownload(doc.id)}
              disabled={!doc}
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <DialogTrigger asChild>
                <Button 
                  size="sm" 
                  variant="default" 
                  className="bg-amber-500 hover:bg-amber-600"
                  onClick={() => {
                    setUploadForm({ 
                      file: null, 
                      documentType: type, 
                      category: category 
                    });
                    setUploadOpen(true);
                  }}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Upload
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50/50 overflow-hidden">
      <Sidebar className="w-64 hidden md:flex" />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-display font-bold text-teal-700 mb-2">Doc-Hub</h1>
              <p className="text-slate-600">Manage your personal and academic documents</p>
            </div>

            {/* Personal Identification Documents */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-teal-700 mb-4">Personal Identification Documents</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documentTypes.personal.map(doc => renderDocumentCard(doc.value, 'personal'))}
              </div>
            </section>

            {/* Academic Documents */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-teal-700 mb-4">Academic Documents</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documentTypes.academic.map(doc => renderDocumentCard(doc.value, 'academic'))}
              </div>
            </section>

            {/* Research & Enclosures Documents */}
            <section>
              <h2 className="text-xl font-semibold text-teal-700 mb-4">Research & Enclosure Documents</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documentTypes.research.map(doc => renderDocumentCard(doc.value, 'research'))}
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload your document. Supported formats: PDF, JPG, PNG (max 10MB)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Document Category</Label>
              <Select 
                value={uploadForm.category} 
                onValueChange={(value) => setUploadForm({ ...uploadForm, category: value, documentType: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal Identification</SelectItem>
                  <SelectItem value="academic">Academic Documents</SelectItem>
                  <SelectItem value="research">Research & Enclosures</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {uploadForm.category && (
              <div>
                <Label>Document Type</Label>
                <Select 
                  value={uploadForm.documentType} 
                  onValueChange={(value) => setUploadForm({ ...uploadForm, documentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes[uploadForm.category as keyof typeof documentTypes]?.map(doc => (
                      <SelectItem key={doc.value} value={doc.value}>
                        {doc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>File</Label>
              <Input 
                type="file" 
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
              />
            </div>
            <Button 
              onClick={handleUpload} 
              disabled={uploadMutation.isPending}
              className="w-full"
            >
              {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
