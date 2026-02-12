import { ExtensionApplicationDetail } from "./ExtensionApplicationDetail";
import type { Application } from "@shared/schema";

interface ApplicationDetailViewProps {
  application: Application & {
    scholar?: {
      scholarId: string;
      name: string;
      email: string;
      phone: string;
      department: string;
      researchArea: string;
      researchTitle: string;
      phase: string;
      programme: string;
      joiningDate: string;
      supervisorName?: string;
      coSupervisorName?: string;
    };
    documents?: Array<{
      id: number;
      documentType: string;
      fileName: string;
      filePath: string;
      category: string;
    }>;
  };
  onApprove?: (remarks: string) => Promise<void>;
  onReject?: (remarks: string) => Promise<void>;
  canReview?: boolean;
}

/**
 * ApplicationDetailView - A modular component that renders the appropriate
 * detail view based on the application type.
 * 
 * Currently supports:
 * - Extension: Detailed view for Ph.D extension applications
 * 
 * Future application types can be added here (e.g., Re-Registration, 
 * Supervisor Change, Pre-Talk, Thesis Submission, etc.)
 */
export function ApplicationDetailView({
  application,
  onApprove,
  onReject,
  canReview,
}: ApplicationDetailViewProps) {
  // Route to the appropriate detail view based on application type
  switch (application.type) {
    case "Extension":
      return (
        <ExtensionApplicationDetail
          application={application}
          onApprove={onApprove}
          onReject={onReject}
          canReview={canReview}
        />
      );
    
    // Add other application types here as they are implemented
    // case "Re-Registration":
    //   return <ReRegistrationApplicationDetail ... />;
    // case "Supervisor Change":
    //   return <SupervisorChangeApplicationDetail ... />;
    
    default:
      // Fallback for application types without custom views
      return (
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">{application.type} Application</h2>
          <p className="text-muted-foreground mb-4">
            Detailed view for this application type is not yet implemented.
          </p>
          <div className="bg-slate-50 p-4 rounded-lg">
            <pre className="text-sm">
              {JSON.stringify(application, null, 2)}
            </pre>
          </div>
        </div>
      );
  }
}
