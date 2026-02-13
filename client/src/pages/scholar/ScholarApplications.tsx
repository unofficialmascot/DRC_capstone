import { useState } from "react";
import { useApplications, useCreateApplication } from "@/hooks/use-applications";
import type { Application } from "@shared/schema";
import type { PublicUser } from "@/lib/types";
import ApplicationDetailModal from "@/pages/scholar/ApplicationDetailModal";
import ExtensionForm from "@/pages/scholar/forms/ExtensionForm";
import PreTalkForm from "@/pages/scholar/forms/PreTalkForm";
import ReRegistrationForm from "@/pages/scholar/forms/ReRegistrationForm";
import SupervisorChangeForm from "@/pages/scholar/forms/SupervisorChangeForm";

export default function ScholarApplications({ user }: { user: PublicUser }) {
  const [view, setView] = useState<"options" | "apply" | "track">("options");
  const [formType, setFormType] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const getDisplayStatus = (app: Application) => {
    if (app.status === "Pending" && app.currentStage !== "supervisor") {
      return "Submitted";
    }
    return app.status;
  };

  const { data: applications = [], isLoading } = useApplications(user.scholarId || undefined) as {
    data: Application[] | undefined;
    isLoading: boolean;
  };

  const createApplication = useCreateApplication();

  const hasActiveApplication = (type: string): boolean => {
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
    if (hasActiveApplication(typeName)) {
      const activeApp = getActiveApplication(typeName);
      alert(
        `You already have an active ${typeName} application.\n\n` +
        `Status: ${activeApp?.status}\n` +
        `Current Stage: ${activeApp?.currentStage.toUpperCase()}\n\n` +
        `Please wait for it to be processed (Approved or Rejected) before submitting a new one.`
      );
      return;
    }
    setFormType(formTypeKey);
  };

  const submitApplication = (type: string, details: Record<string, unknown>) => {
    if (!user.scholarId) {
      alert("Scholar ID is missing. Please log in again.");
      return;
    }
    
    // Double-check before submission
    if (hasActiveApplication(type)) {
      alert(`You already have an active ${type} application. Please wait for it to be processed.`);
      return;
    }
    
    createApplication.mutate(
      { scholarId: user.scholarId, type, details },
      {
        onSuccess: () => {
          alert("Application submitted successfully! It will be reviewed by the Supervisor.");
          setView("options");
          setFormType(null);
        },
        onError: (error: Error) => {
          console.error("Application submission error:", error);
          alert(`Failed to submit application: ${error.message || "Unknown error"}. Please try again.`);
        },
      },
    );
  };

  const getStageProgress = (stage: string, status: string) => {
    if (status === "Rejected") return { percent: 100, label: "Rejected", color: "#e74c3c" };
    if (status === "Approved") return { percent: 100, label: "Approved", color: "#27ae60" };
    switch (stage) {
      case "supervisor": return { percent: 10, label: "With Supervisor", color: "#2c7a7b" };
      case "drc": return { percent: 25, label: "At DRC", color: "#3498db" };
      case "irc": return { percent: 50, label: "At IRC", color: "#f39c12" };
      case "doaa": return { percent: 75, label: "At DoAA", color: "#9b59b6" };
      case "completed": return { percent: 100, label: "Completed", color: "#27ae60" };
      default: return { percent: 0, label: "Submitted", color: "#95a5a6" };
    }
  };

  return (
    <div className="applications-container">
      <div className="applications-title">Applications</div>

      {view === "options" && (
        <div className="applications-options">
          <button type="button" className="application-option" onClick={() => { setView("apply"); setFormType(null); }} data-testid="button-apply">Apply</button>
          <button type="button" className="application-option" onClick={() => setView("track")} data-testid="button-track">Track Your Application</button>
        </div>
      )}

      {view === "apply" && !formType && (
        <div className="dropdown-container" style={{ display: "block" }}>
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

      {view === "track" && (
        <>
          <button type="button" className="submit-btn" onClick={() => setView("options")} style={{ marginBottom: "20px", background: "#6c757d" }} data-testid="button-back-options-track">Back to Options</button>
          {isLoading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>Loading applications...</div>
          ) : applications.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>No applications found. Submit an application to get started.</div>
          ) : (
            <div className="tracking-container">
              {applications.map((app) => {
                const progress = getStageProgress(app.currentStage, app.status);
                const displayStatus = getDisplayStatus(app);
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
                        <div className={`stage-indicator ${app.status === "Pending" ? "in-progress" : app.status === "Approved" ? "completed" : "rejected"}`}></div>
                        <div className="stage-text">{progress.label}</div>
                      </div>
                      <div className="progress-container">
                        <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress.percent}%`, background: progress.color }}></div></div>
                        <div className="progress-text"><span>Submitted</span><span>{progress.percent}% Complete</span></div>
                      </div>
                    </div>
                    <div className="application-footer">
                      <div className={`status-badge ${statusClass}`}>
                        {displayStatus}
                      </div>
                      <button type="button" className="details-btn" onClick={() => setSelectedApp(app)} data-testid={`button-details-${app.id}`}>More Details →</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {selectedApp && <ApplicationDetailModal app={selectedApp} onClose={() => setSelectedApp(null)} />}
    </div>
  );
}
