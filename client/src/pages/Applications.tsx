import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApplications, useCreateApplication } from "@/hooks/use-applications";
import { apiRequest } from "@/lib/queryClient";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FilePlus, FileClock, AlertCircle, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface User {
  id: number;
  scholarId?: string;
  name: string;
  role: string;
  email: string;
  // Scholar-related fields (included when fetched from /users/:id)
  userId?: number;
  batch?: string;
  status?: string;
  department?: string;
  researchArea?: string;
  researchTitle?: string;
}

const APPLICATION_TYPES = [
  { id: "Leave", label: "Leave Application", icon: FileClock, color: "bg-blue-500" },
  { id: "Extension", label: "Extension Request", icon: Calendar, color: "bg-purple-500" },
  { id: "Deregistration", label: "Deregistration", icon: AlertCircle, color: "bg-red-500" },
  { id: "General", label: "General Request", icon: FilePlus, color: "bg-emerald-500" },
];

export default function Applications() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const { toast } = useToast();

  // Get current user
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: () => apiRequest("GET", "/api/auth/me").then(res => res.json()),
  });

  // Get applications for current user's scholar ID
  const { data: applications, isLoading } = useApplications(user?.id?.toString());
  const createApplication = useCreateApplication();

  const handleApply = () => {
    if (!selectedType || !user?.id) return;
    
    createApplication.mutate({
      scholarId: user.id,
      type: selectedType,
      details: { reason },
    }, {
      onSuccess: () => {
        toast({
          title: "Application Submitted",
          description: `Your ${selectedType} application has been submitted successfully.`,
        });
        setSelectedType(null);
        setReason("");
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Submission Failed",
          description: `${(error as Error).message || "Could not submit application. Please try again."}`,
        });
      }
    });
  };

  return (
    <div className="flex h-screen bg-slate-50/50 overflow-hidden">
      <Sidebar className="w-64 hidden md:flex" />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            <div className="mb-10">
              <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">Applications</h1>
              <p className="text-muted-foreground">Submit and track your academic requests.</p>
            </div>

            {/* Application Type Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {APPLICATION_TYPES.map((type, i) => (
                <motion.div 
                  key={type.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Button
                    variant="outline"
                    className="w-full h-32 flex flex-col gap-4 border-2 hover:border-primary/50 hover:bg-slate-50 hover:shadow-lg transition-all rounded-2xl group"
                    onClick={() => setSelectedType(type.id)}
                  >
                    <div className={cn("p-3 rounded-full text-white transition-transform group-hover:scale-110", type.color)}>
                      <type.icon className="w-6 h-6" />
                    </div>
                    <span className="font-semibold text-slate-700">{type.label}</span>
                  </Button>
                </motion.div>
              ))}
            </div>

            {/* History Table */}
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-xl font-display font-bold mb-6">Application History</h3>
                
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />)}
                  </div>
                ) : applications?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No applications submitted yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications?.map((app) => (
                      <div key={app.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className={cn("w-2 h-12 rounded-full", 
                            app.status === "Approved" ? "bg-emerald-500" :
                            app.status === "Rejected" ? "bg-red-500" : "bg-yellow-400"
                          )} />
                          <div>
                            <h4 className="font-bold text-slate-900">{app.type} Application</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(app.submissionDate || "").toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide",
                            app.status === "Approved" ? "bg-emerald-100 text-emerald-800" :
                            app.status === "Rejected" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                          )}>
                            {app.status}
                          </span>
                          <Button variant="ghost" size="sm">Details</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Application Modal */}
      <Dialog open={!!selectedType} onOpenChange={(open) => !open && setSelectedType(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>New {selectedType} Application</DialogTitle>
            <DialogDescription>
              Please provide the necessary details for your request.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="scholarCode">Scholar Code</Label>
              <Input id="scholarCode" value={user?.scholarId || ""} disabled className="bg-slate-50" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reason">Reason / Description</Label>
              <Textarea 
                id="reason" 
                value={reason} 
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please describe why you are applying..." 
                className="h-32" 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedType(null)}>Cancel</Button>
            <Button 
              onClick={handleApply} 
              disabled={!reason || createApplication.isPending || !user?.id}
              className="bg-primary hover:bg-primary/90"
            >
              {createApplication.isPending ? "Submitting..." : "Submit Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
