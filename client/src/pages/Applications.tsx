import { useQuery } from "@tanstack/react-query";
import { useApplications } from "@/hooks/use-applications";
import { apiRequest } from "@/lib/api";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

export default function Applications() {
  // Get current user
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: () => apiRequest("/api/auth/me", { method: "GET" }).then(res => res.json()),
  });

  // Get applications for current user ID
  const { data: applications, isLoading } = useApplications(user?.id?.toString());
  const createApplication = useCreateApplication();

  const handleApply = () => {
    if (!selectedType || !user?.id) return;
    
    createApplication.mutate({
      userId: user.id,
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
              <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">Track My Application</h1>
              <p className="text-muted-foreground">Monitor the status of your submitted requests.</p>
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
    </div>
  );
}
