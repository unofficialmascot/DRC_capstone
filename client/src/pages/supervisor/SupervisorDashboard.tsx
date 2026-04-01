import { useEffect, useMemo, useState } from "react";
import { useApplications } from "@/hooks/use-applications";
import { useApplicationById, useSubmitReview } from "@/hooks/use-application-reviews";
import { useToast } from "@/hooks/use-toast";
import { useAssignedScholars, useSupervisorScholarCount } from "@/hooks/use-users";
import { useDrcMeetingsList } from "@/hooks/use-application-reviews";
import ApplicationDetailFormView from "@/components/applications/ApplicationDetailFormView";
import ScholarProfile from "@/pages/scholar/ScholarProfile";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormCard } from "@/components/ui/form-card";
import { FormTable } from "@/components/ui/form-table";
import { ActionButton } from "@/components/ui/action-button";
import type { Application } from "@shared/schema";
import type { PublicUser } from "@/lib/types";

type ApplicationDetailsPayload = Application;
export type SupervisorSection = "dashboard" | "profile" | "rac-reviews" | "application-requests" | "biometric" | "help-support";

const PAGE_SIZE = 8;

type SortBy = "newest" | "oldest" | "scholar" | "type";
type StatusFilter = "all" | "pending" | "approved" | "rejected" | "submitted";
type StageFilter = "all" | "supervisor" | "drc" | "irc" | "doaa" | "completed";

export default function SupervisorDashboard({ user, activeSection = "dashboard" }: { user: PublicUser; activeSection?: SupervisorSection }) {
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [decision, setDecision] = useState<"approved" | "rejected">("approved");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const reviewerKey = user.employeeId || user.scholarId || user.username || user.email;
  const { data: assignedScholarCount = 0 } = useSupervisorScholarCount(user.employeeId);
  const { data: assignedScholars = [], isLoading: isAssignedScholarsLoading } = useAssignedScholars(user.employeeId);
  const { data: drcMeetings = [], isLoading: isRacMeetingsLoading } = useDrcMeetingsList(activeSection === "rac-reviews");

  const { data: applications = [], isLoading } = useApplications() as {
    data: Application[] | undefined;
    isLoading: boolean;
  };

  const isApplicationRequestsSection = activeSection === "application-requests";

  const pendingApplications = applications.filter(
    (app) => app.status === "Pending" && app.currentStage === "supervisor",
  );

  const approvedCount = applications.filter((app) => app.status === "Approved").length;
  const rejectedCount = applications.filter((app) => app.status === "Rejected").length;

  const reviewMutation = useSubmitReview(selectedApp?.id ?? 0);

  const { data: selectedApplicationDetail } = useApplicationById(selectedApp?.id ?? 0) as {
    data: ApplicationDetailsPayload | undefined;
  };

  const displayApplication = (selectedApplicationDetail ?? selectedApp) as ApplicationDetailsPayload | null;

  const getDisplayStatus = (app: Application) => {
    if (app.status === "Pending" && app.currentStage !== "supervisor") {
      return "Submitted";
    }
    return app.status;
  };

  const filteredAndSortedApplications = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const sectionBase = isApplicationRequestsSection
      ? pendingApplications
      : applications;

    const filtered = sectionBase.filter((app) => {
      const displayStatus = getDisplayStatus(app).toLowerCase();
      const appStage = (app.currentStage || "").toLowerCase();
      const matchesSearch = !term
        || app.scholarId.toLowerCase().includes(term)
        || app.type.toLowerCase().includes(term)
        || String(app.id).includes(term);
      const matchesStatus = statusFilter === "all" || displayStatus === statusFilter;
      const matchesStage = isApplicationRequestsSection
        ? true
        : stageFilter === "all" || appStage === stageFilter;

      return matchesSearch && matchesStatus && matchesStage;
    });

    return filtered.sort((a, b) => {
      const dateA = new Date(a.submissionDate as unknown as string).getTime();
      const dateB = new Date(b.submissionDate as unknown as string).getTime();

      if (sortBy === "newest") {
        return dateB - dateA;
      }
      if (sortBy === "oldest") {
        return dateA - dateB;
      }
      if (sortBy === "scholar") {
        return a.scholarId.localeCompare(b.scholarId);
      }
      return a.type.localeCompare(b.type);
    });
  }, [applications, isApplicationRequestsSection, pendingApplications, searchTerm, statusFilter, stageFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedApplications.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedApplications = filteredAndSortedApplications.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const sectionTitle =
    activeSection === "profile"
      ? "Profile"
      : activeSection === "rac-reviews"
        ? "RAC Reviews"
        : activeSection === "application-requests"
          ? "Application Requests"
          : activeSection === "biometric"
            ? "Biometric"
            : activeSection === "help-support"
              ? "Help and Support"
              : "Dashboard";

  if (activeSection === "profile") {
    return <ScholarProfile user={user} viewMode="supervisor" />;
  }

  if (activeSection === "biometric") {
    const biometricData = [
      ["Last Sync", "Not configured"],
      ["Device Status", "Not connected"],
      ["Verification Records", "0"],
      ["Attendance Rate", "N/A"],
      ["Active Sessions", "0"],
    ];

    return (
      <div style={{ padding: "20px" }}>
        <h2 style={{ color: "#0b6a55", marginBottom: "20px" }}>{sectionTitle}</h2>
        <FormCard title="Attendance Integration">
          <FormTable headers={["Metric", "Status"]} rows={biometricData} />
          <div style={{ marginTop: "16px", padding: "12px", background: "#f8f9fa", borderRadius: "6px", border: "1px solid #e9ecef" }}>
            <p style={{ margin: 0, color: "#495057", fontSize: "14px" }}>
              <strong>Note:</strong> Biometric attendance system integration is planned for future implementation.
              This will include real-time attendance tracking, automated reporting, and integration with scholar progress monitoring.
            </p>
          </div>
        </FormCard>
      </div>
    );
  }

  if (activeSection === "help-support") {
    const supportData = [
      ["Email", "drc-support@gitam.edu"],
      ["Phone", "+91-00000-00000"],
      ["Hours", "Mon-Fri, 9:00 AM - 5:00 PM"],
      ["Response Time", "Within 24 hours"],
    ];

    return (
      <div style={{ padding: "20px" }}>
        <h2 style={{ color: "#0b6a55", marginBottom: "20px" }}>{sectionTitle}</h2>
        <FormCard title="Support Channels">
          <FormTable headers={["Contact Method", "Details"]} rows={supportData} />
        </FormCard>
        <FormCard title="Application Review Guidance">
          <p style={{ color: "#555", margin: 0 }}>
            Use the Dashboard or Application Requests tab to view scholar applications and submit approvals or rejections with detailed remarks.
            All reviews are tracked and contribute to the scholar's research progress evaluation.
          </p>
        </FormCard>
      </div>
    );
  }

  if (activeSection === "rac-reviews") {
    const meetingHeaders = ["Meeting ID", "Date", "Status"];
    const meetingRows = drcMeetings.map((meeting) => [
      meeting.id,
      new Date(meeting.meetingDate as unknown as string).toLocaleString(),
      meeting.closedAt ? "Closed" : "Open",
    ]);

    return (
      <div style={{ padding: "20px" }}>
        <h2 style={{ color: "#0b6a55", marginBottom: "20px" }}>{sectionTitle}</h2>
        <FormCard title="RAC Review Process">
          <p style={{ color: "#555", margin: 0 }}>
            RAC reviews are conducted by RAC members with scholars in scheduled meetings. They are not part of supervisor application requests.
          </p>
        </FormCard>

        <FormCard title="DRC / RAC Meetings">
          {isRacMeetingsLoading ? (
            <div style={{ padding: "16px", color: "#666" }}>Loading meetings...</div>
          ) : drcMeetings.length === 0 ? (
            <div style={{ padding: "16px", color: "#666" }}>No meeting records available.</div>
          ) : (
            <FormTable headers={meetingHeaders} rows={meetingRows} />
          )}
        </FormCard>
      </div>
    );
  }

  const handleOpenDetails = (application: Application) => {
    setSelectedApp(application);
    setShowReviewForm(false);
    setRemarks("");
  };

  const handleCloseDetails = (open: boolean) => {
    if (open) {
      return;
    }

    setSelectedApp(null);
    setShowReviewForm(false);
    setRemarks("");
  };

  const handleSubmitReview = () => {
    if (!selectedApp) {
      return;
    }

    if (!remarks.trim()) {
      toast({
        title: "Action Required",
        description: "Please provide remarks for your decision.",
        variant: "destructive",
      });
      return;
    }

    if (!reviewerKey) {
      toast({
        title: "Action Required",
        description: "Employee ID is missing. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    reviewMutation.mutate(
      { reviewerId: reviewerKey, decision, remarks },
      {
        onSuccess: () => {
          setSelectedApp(null);
          setShowReviewForm(false);
          setRemarks("");
          toast({ title: "Success", description: "Review submitted successfully!" });
        },
        onError: (error: Error) => {
          toast({
            title: "Error",
            description: error.message || "Failed to submit review",
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ color: "#0b6a55", marginBottom: "20px" }}>{sectionTitle}</h2>

      <div className="stats-container" style={{ marginBottom: "30px" }}>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Pending Reviews</div>
            <div className="stat-value">{pendingApplications.length}</div>
          </div>
          <div className="stat-icon" style={{ color: "#f39c12" }}>📄</div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Total Applications</div>
            <div className="stat-value">{applications.length}</div>
          </div>
          <div className="stat-icon" style={{ color: "#0b6a55" }}>📋</div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Approved</div>
            <div className="stat-value">{approvedCount}</div>
          </div>
          <div className="stat-icon" style={{ color: "#27ae60" }}>✓</div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Rejected</div>
            <div className="stat-value">{rejectedCount}</div>
          </div>
          <div className="stat-icon" style={{ color: "#e74c3c" }}>✗</div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Scholars Assigned</div>
            <div className="stat-value">{assignedScholarCount}</div>
          </div>
          <div className="stat-icon" style={{ color: "#1d4ed8" }}>🎓</div>
        </div>
      </div>

      <h3 style={{ color: "#0b6a55", marginBottom: "15px" }}>
        {activeSection === "application-requests"
          ? "Pending Supervisor Application Requests"
          : "Scholar Applications"}
      </h3>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>Loading applications...</div>
      ) : filteredAndSortedApplications.length === 0 ? (
        <div style={{ background: "#fff", padding: "40px", borderRadius: "10px", border: "1px solid #e6e6e6", textAlign: "center", color: "#666" }}>
          No applications available for this section yet
        </div>
      ) : (
        <div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
              gap: "10px",
              marginBottom: "12px",
            }}
          >
            <input
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPage(1);
              }}
              placeholder="Search by scholar ID, type, or app ID"
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "9px 12px",
                minWidth: "180px",
              }}
            />

            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as StatusFilter);
                setPage(1);
              }}
              style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "9px 10px", background: "#fff" }}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={stageFilter}
              onChange={(event) => {
                setStageFilter(event.target.value as StageFilter);
                setPage(1);
              }}
              style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "9px 10px", background: "#fff" }}
              disabled={isApplicationRequestsSection}
            >
              <option value="all">All Stages</option>
              <option value="supervisor">Supervisor</option>
              <option value="drc">DRC</option>
              <option value="irc">IRC</option>
              <option value="doaa">DoAA</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortBy)}
              style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "9px 10px", background: "#fff" }}
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="scholar">Sort: Scholar ID</option>
              <option value="type">Sort: Application Type</option>
            </select>

            <ActionButton
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setStageFilter("all");
                setSortBy("newest");
                setPage(1);
              }}
              style={{ background: "#555" }}
            >
              Reset Filters
            </ActionButton>
          </div>

          <div style={{ color: "#666", fontSize: "13px", marginBottom: "8px" }}>
            Showing {filteredAndSortedApplications.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
            -{Math.min(page * PAGE_SIZE, filteredAndSortedApplications.length)} of {filteredAndSortedApplications.length} matching applications
          </div>

          <FormCard title={activeSection === "application-requests" ? "Pending Supervisor Application Requests" : "Scholar Applications"}>
            {filteredAndSortedApplications.length === 0 ? (
              <div style={{ padding: "28px", textAlign: "center", color: "#666" }}>
                No applications matched your search/filter criteria.
              </div>
            ) : (
              <FormTable
                headers={["Scholar ID", "Type", "Submitted", "Status", "Stage", "Actions"]}
                rows={paginatedApplications.map((app) => [
                  app.scholarId,
                  app.type,
                  new Date(app.submissionDate as unknown as string).toLocaleDateString(),
                  <span
                    key={`status-${app.id}`}
                    className="pill"
                    style={{
                      background: getDisplayStatus(app) === "Submitted"
                        ? "#27ae60"
                        : app.status === "Approved"
                          ? "#27ae60"
                          : app.status === "Rejected"
                            ? "#e74c3c"
                            : "#f39c12",
                      color: "white",
                      padding: "4px 10px",
                      borderRadius: "15px",
                      fontSize: "13px",
                    }}
                  >
                    {getDisplayStatus(app)}
                  </span>,
                  <span key={`stage-${app.id}`} style={{ textTransform: "capitalize" }}>{app.currentStage}</span>,
                  <ActionButton
                    key={`action-${app.id}`}
                    onClick={() => handleOpenDetails(app)}
                    style={{ padding: "6px 12px", fontSize: "13px" }}
                  >
                    View Details
                  </ActionButton>,
                ])}
              />
            )}
          </FormCard>

          {filteredAndSortedApplications.length > PAGE_SIZE && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
              <ActionButton
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                style={{ background: page === 1 ? "#b3b3b3" : "#0b6a55" }}
              >
                Previous
              </ActionButton>

              <div style={{ color: "#444", fontWeight: 600 }}>Page {page} of {totalPages}</div>

              <ActionButton
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                style={{ background: page === totalPages ? "#b3b3b3" : "#0b6a55" }}
              >
                Next
              </ActionButton>
            </div>
          )}
        </div>
      )}

      <Dialog open={Boolean(selectedApp && displayApplication)} onOpenChange={handleCloseDetails}>
        <DialogContent
          style={{
            maxWidth: "980px",
            width: "calc(100vw - 2rem)",
            maxHeight: "90vh",
            overflowY: "auto",
          }}
        >
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>

          {displayApplication && (
            <>
              <ApplicationDetailFormView
                application={displayApplication}
                scholarDisplayName={displayApplication.scholarId}
              />

              {selectedApp?.status === "Pending" && selectedApp.currentStage === "supervisor" && (
                <div style={{ marginTop: "16px", borderTop: "1px solid #e6e6e6", paddingTop: "16px" }}>
                  <h4 style={{ color: "#0b6a55", marginBottom: "12px" }}>Review Application</h4>

                  {!showReviewForm ? (
                    <div style={{ display: "flex", gap: "10px" }}>
                      <ActionButton
                        onClick={() => {
                          setDecision("approved");
                          setShowReviewForm(true);
                        }}
                        style={{ background: "#27ae60" }}
                      >
                        ✓ Approve
                      </ActionButton>
                      <ActionButton
                        onClick={() => {
                          setDecision("rejected");
                          setShowReviewForm(true);
                        }}
                        style={{ background: "#e74c3c" }}
                      >
                        ✗ Reject
                      </ActionButton>
                    </div>
                  ) : (
                    <div>
                      <div style={{ marginBottom: "12px" }}>
                        <strong style={{ color: decision === "approved" ? "#27ae60" : "#e74c3c" }}>
                          Decision: {decision === "approved" ? "Approve" : "Reject"}
                        </strong>
                      </div>
                      <textarea
                        value={remarks}
                        onChange={(event) => setRemarks(event.target.value)}
                        placeholder="Provide your remarks for this decision..."
                        rows={4}
                        style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px" }}
                      />
                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          marginTop: "12px",
                          position: "sticky",
                          bottom: 0,
                          background: "#fff",
                          paddingTop: "12px",
                          borderTop: "1px solid #eee",
                        }}
                      >
                        <ActionButton
                          onClick={handleSubmitReview}
                          disabled={reviewMutation.isPending}
                          style={{ background: decision === "approved" ? "#27ae60" : "#e74c3c" }}
                        >
                          {reviewMutation.isPending ? "Submitting..." : "Submit Review"}
                        </ActionButton>
                        <ActionButton
                          onClick={() => {
                            setShowReviewForm(false);
                            setRemarks("");
                          }}
                          style={{ background: "#666" }}
                          disabled={reviewMutation.isPending}
                        >
                          Cancel
                        </ActionButton>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
