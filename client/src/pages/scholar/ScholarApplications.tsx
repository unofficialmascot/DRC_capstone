import { useState } from "react";
import { useApplications, useCreateApplication } from "@/hooks/use-applications";
import { useApplicationReviews } from "@/hooks/use-application-reviews";
import { useToast } from "@/hooks/use-toast";
import { APP_SETTINGS } from "@shared/app-settings";
import type { Application, ApplicationReview } from "@shared/schema";
import type { PublicUser } from "@/lib/types";
import ExtensionForm from "@/pages/scholar/forms/ExtensionForm";
import PreTalkForm from "@/pages/scholar/forms/PreTalkForm";
import ReRegistrationForm from "@/pages/scholar/forms/ReRegistrationForm";
import SupervisorChangeForm from "@/pages/scholar/forms/SupervisorChangeForm";
import ThesisSubmissionForm from "@/pages/scholar/forms/ThesisSubmissionForm";

const TRACKING_STEPS = [
  { key: "supervisor", label: "Supervisor" },
  { key: "drc", label: "DRC" },
  { key: "irc", label: "IRC" },
  { key: "doaa", label: "DOAA" },
] as const;

type StepState = "completed" | "current" | "future" | "rejected";

function ApplicationTrackingCard({ app }: { app: Application }) {
  const { data: reviews = [] } = useApplicationReviews(app.id) as { data: ApplicationReview[] | undefined };

  const currentIndex = TRACKING_STEPS.findIndex((step) => step.key === app.currentStage);
  const rejectedReview = reviews.find((review) => review.decision === "rejected");
  const rejectedIndex = rejectedReview
    ? TRACKING_STEPS.findIndex((step) => step.key === rejectedReview.stage)
    : -1;

  const getStepState = (index: number): StepState => {
    if (app.status === "Approved") return "completed";

    if (app.status === "Rejected") {
      if (index < rejectedIndex) return "completed";
      if (index === rejectedIndex) return "rejected";
      return "future";
    }

    if (index < currentIndex) return "completed";
    if (index === currentIndex) return "current";
    return "future";
  };

  const getDisplayStatus = () => {
    if (app.status === "Pending" && app.currentStage !== "supervisor") {
      return "Submitted";
    }
    return app.status;
  };

  const displayStatus = getDisplayStatus();
  const statusClass =
    displayStatus === "Submitted"
      ? "completed"
      : app.status === "Pending"
        ? "in-progress"
        : app.status === "Approved"
          ? "completed"
          : "rejected";

  return (
    <div className="application-card" key={app.id}>
      <div className="application-header">
        <div className="application-type">{app.type}</div>
        <div className="application-submitted">Submitted: {new Date(app.submissionDate as unknown as string).toLocaleDateString()}</div>
      </div>
      <div className="application-body">
        <div className="current-stage">
          <div className="stage-text">Application Tracking</div>
        </div>

        <div className="stepper-container" data-testid={`stepper-${app.id}`}>
          {TRACKING_STEPS.map((step, index) => {
            const stepState = getStepState(index);
            const review = reviews.find((item) => item.stage === step.key);
            const showMeta = stepState === "completed" || stepState === "rejected";
            const stepStatusText =
              stepState === "completed"
                ? "Approved"
                : stepState === "current" && app.status === "Pending"
                  ? "Pending"
                  : stepState === "rejected"
                    ? "Rejected"
                    : "\u00A0";
            const endCapState: StepState = app.status === "Approved" ? "completed" : "future";

            return (
              <div className="stepper-step" key={step.key}>
                {index === 0 && <div className={`stepper-cap start ${stepState}`}></div>}
                {index > 0 && (
                  <div className={`stepper-line ${getStepState(index - 1) === "completed" ? "completed" : "upcoming"}`}></div>
                )}
                {index === TRACKING_STEPS.length - 1 && <div className={`stepper-cap end ${endCapState}`}></div>}
                <div className="stepper-step-status">{stepStatusText}</div>
                <div className={`stepper-node ${stepState}`}></div>
                <div className="stepper-label">{step.label}</div>
                {showMeta && review && (
                  <>
                    <div className="stepper-date">{new Date(review.reviewDate as unknown as string).toLocaleDateString()}</div>
                    {review.remarks && <div className="stepper-comment">{review.remarks}</div>}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="application-footer">
        <div className={`status-badge ${statusClass}`}>
          {displayStatus}
        </div>
      </div>
    </div>
  );
}

export default function ScholarApplications({ user }: { user: PublicUser }) {
  const [view, setView] = useState<"options" | "apply" | "track">("options");
  const [formType, setFormType] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: applications = [], isLoading } = useApplications(user.scholarId || undefined) as {
    data: Application[] | undefined;
    isLoading: boolean;
  };

  const createApplication = useCreateApplication();

  const submissionsDisabled = APP_SETTINGS.applicationSubmissionMode === "none";
  const enforceSingleActivePerType =
    APP_SETTINGS.applicationSubmissionMode === "single-active-per-type";

  const hasActiveApplication = (type: string): boolean => {
    if (!enforceSingleActivePerType) {
      return false;
    }

    return applications.some(
      (app) => app.type === type && app.status !== "Approved" && app.status !== "Rejected"
    );
  };

  const getActiveApplication = (type: string): Application | undefined => {
    return applications.find(
      (app) => app.type === type && app.status !== "Approved" && app.status !== "Rejected"
    );
  };

  const handleFormTypeSelection = (formTypeKey: string, typeName: string) => {
    if (submissionsDisabled) {
      toast({
        title: "Action Required",
        description: "Application submissions are currently disabled by settings.",
        variant: "destructive",
      });
      return;
    }

    if (hasActiveApplication(typeName)) {
      const activeApp = getActiveApplication(typeName);
      toast({
        title: "Action Required",
        description:
          `You already have an active ${typeName} application. ` +
          `Status: ${activeApp?.status}. Current Stage: ${activeApp?.currentStage.toUpperCase()}. ` +
          "Please wait until it is Approved or Rejected before submitting a new one.",
        variant: "destructive",
      });
      return;
    }
    setFormType(formTypeKey);
  };

  const submitApplication = (type: string, details: Record<string, unknown>) => {
    if (submissionsDisabled) {
      toast({
        title: "Action Required",
        description: "Application submissions are currently disabled by settings.",
        variant: "destructive",
      });
      return;
    }

    if (!user.scholarId) {
      toast({
        title: "Action Required",
        description: "Scholar ID is missing. Please log in again.",
        variant: "destructive",
      });
      return;
    }
    
    // Double-check before submission
    if (enforceSingleActivePerType && hasActiveApplication(type)) {
      toast({
        title: "Action Required",
        description: `You already have an active ${type} application. Please wait for it to be processed.`,
        variant: "destructive",
      });
      return;
    }
    
    createApplication.mutate(
      { scholarId: user.scholarId, type, details },
      {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Application submitted successfully! It will be reviewed by the Supervisor.",
          });
          setView("options");
          setFormType(null);
        },
        onError: (error: Error) => {
          console.error("Application submission error:", error);
          toast({
            title: "Error",
            description: `Failed to submit application: ${error.message || "Unknown error"}. Please try again.`,
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <div className="applications-container">
      <div className="applications-title">Applications</div>

      {view === "options" && (
        <div className="applications-options">
          <button
            type="button"
            className="application-option"
            onClick={() => { setView("apply"); setFormType(null); }}
            data-testid="button-apply"
            disabled={submissionsDisabled}
            style={submissionsDisabled ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
          >
            Apply
          </button>
          <button type="button" className="application-option" onClick={() => setView("track")} data-testid="button-track">Track Your Application</button>
        </div>
      )}

      {view === "apply" && !formType && (
        <div className="dropdown-container" style={{ display: "block" }}>
          {submissionsDisabled && (
            <div style={{ marginBottom: "12px", color: "#c0392b", fontWeight: 600 }}>
              Application submissions are disabled by settings.
            </div>
          )}
          <div className="dropdown-box" data-testid="dropdown-application-type">Select Application Type ▼</div>
          <div className="dropdown-content" style={{ display: "block", position: "relative" }}>
            <button 
              type="button" 
              onClick={() => handleFormTypeSelection("supervisor", "Supervisor Change")} 
              data-testid="button-supervisor-change"
              disabled={hasActiveApplication("Supervisor Change")}
              style={{ 
                opacity: hasActiveApplication("Supervisor Change") ? 0.6 : 1,
                cursor: hasActiveApplication("Supervisor Change") ? "not-allowed" : "pointer",
                position: "relative"
              }}
            >
              Change of Supervisor
              {hasActiveApplication("Supervisor Change") && (
                <span style={{ fontSize: "11px", color: "#e74c3c", display: "block", marginTop: "3px" }}>
                  ⚠ Active application exists
                </span>
              )}
            </button>
            <button 
              type="button" 
              onClick={() => handleFormTypeSelection("pretalk", "Pre-Talk")} 
              data-testid="button-pretalk"
              disabled={hasActiveApplication("Pre-Talk")}
              style={{ 
                opacity: hasActiveApplication("Pre-Talk") ? 0.6 : 1,
                cursor: hasActiveApplication("Pre-Talk") ? "not-allowed" : "pointer",
                position: "relative"
              }}
            >
              Apply for Pre-talk
              {hasActiveApplication("Pre-Talk") && (
                <span style={{ fontSize: "11px", color: "#e74c3c", display: "block", marginTop: "3px" }}>
                  ⚠ Active application exists
                </span>
              )}
            </button>
            <button 
              type="button" 
              onClick={() => handleFormTypeSelection("extension", "Extension")} 
              data-testid="button-extension"
              disabled={hasActiveApplication("Extension")}
              style={{ 
                opacity: hasActiveApplication("Extension") ? 0.6 : 1,
                cursor: hasActiveApplication("Extension") ? "not-allowed" : "pointer",
                position: "relative"
              }}
            >
              Extension of Ph.D Duration
              {hasActiveApplication("Extension") && (
                <span style={{ fontSize: "11px", color: "#e74c3c", display: "block", marginTop: "3px" }}>
                  ⚠ Active application exists
                </span>
              )}
            </button>
            <button 
              type="button" 
              onClick={() => handleFormTypeSelection("reregistration", "Re-Registration")} 
              data-testid="button-reregistration"
              disabled={hasActiveApplication("Re-Registration")}
              style={{ 
                opacity: hasActiveApplication("Re-Registration") ? 0.6 : 1,
                cursor: hasActiveApplication("Re-Registration") ? "not-allowed" : "pointer",
                position: "relative"
              }}
            >
              Ph.D Re-Registration
              {hasActiveApplication("Re-Registration") && (
                <span style={{ fontSize: "11px", color: "#e74c3c", display: "block", marginTop: "3px" }}>
                  ⚠ Active application exists
                </span>
              )}
            </button>
            <button 
              type="button" 
              onClick={() => handleFormTypeSelection("thesis-submission", "Thesis Submission")} 
              data-testid="button-thesis-submission"
              disabled={hasActiveApplication("Thesis Submission")}
              style={{ 
                opacity: hasActiveApplication("Thesis Submission") ? 0.6 : 1,
                cursor: hasActiveApplication("Thesis Submission") ? "not-allowed" : "pointer",
                position: "relative"
              }}
            >
              Thesis Submission
              {hasActiveApplication("Thesis Submission") && (
                <span style={{ fontSize: "11px", color: "#e74c3c", display: "block", marginTop: "3px" }}>
                  ⚠ Active application exists
                </span>
              )}
            </button>
          </div>
          <button type="button" className="submit-btn" onClick={() => setView("options")} style={{ marginTop: "20px", background: "#6c757d" }} data-testid="button-back-options">Back to Options</button>
        </div>
      )}

      {view === "apply" && formType === "extension" && (
        <ExtensionForm user={user} onSubmit={(details) => submitApplication("Extension", details)} onBack={() => { setView("options"); setFormType(null); }} isSubmitting={createApplication.isPending} />
      )}

      {view === "apply" && formType === "supervisor" && (
        <SupervisorChangeForm user={user} onSubmit={(details) => submitApplication("Supervisor Change", details)} onBack={() => { setView("options"); setFormType(null); }} isSubmitting={createApplication.isPending} />
      )}

      {view === "apply" && formType === "pretalk" && (
        <PreTalkForm user={user} onSubmit={(details) => submitApplication("Pre-Talk", details)} onBack={() => { setView("options"); setFormType(null); }} isSubmitting={createApplication.isPending} />
      )}

      {view === "apply" && formType === "reregistration" && (
        <ReRegistrationForm user={user} onSubmit={(details) => submitApplication("Re-Registration", details)} onBack={() => { setView("options"); setFormType(null); }} isSubmitting={createApplication.isPending} />
      )}

      {view === "apply" && formType === "thesis-submission" && (
        <ThesisSubmissionForm user={user} onSubmit={(details) => submitApplication("Thesis Submission", details)} onBack={() => { setView("options"); setFormType(null); }} isSubmitting={createApplication.isPending} />
      )}

      {view === "track" && (
        <>
          <button type="button" className="submit-btn" onClick={() => setView("options")} style={{ marginBottom: "20px", background: "#6c757d" }} data-testid="button-back-options-track">Back to Options</button>
          {isLoading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>Loading applications...</div>
          ) : applications.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>No applications found. Submit an application to get started.</div>
          ) : (
            <div className="tracking-container">
              {applications.map((app) => (
                <ApplicationTrackingCard app={app} key={app.id} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
