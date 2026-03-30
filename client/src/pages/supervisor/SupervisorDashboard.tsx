import { useEffect, useMemo, useState } from "react";
import { useApplications } from "@/hooks/use-applications";
import { useApplicationById, useSubmitReview } from "@/hooks/use-application-reviews";
import { useToast } from "@/hooks/use-toast";
import { useAssignedScholars, useSupervisorScholarCount } from "@/hooks/use-users";
import { useDrcMeetingsList } from "@/hooks/use-application-reviews";
import ApplicationDetailFormView from "@/components/applications/ApplicationDetailFormView";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
    return (
      <div style={{ padding: "20px" }}>
        <h2 style={{ color: "#0b6a55", marginBottom: "20px" }}>{sectionTitle}</h2>
        <div style={{ background: "#fff", border: "1px solid #e6e6e6", borderRadius: "10px", padding: "20px", maxWidth: "700px", marginBottom: "14px" }}>
          <div style={{ marginBottom: "8px" }}><strong>User ID:</strong> {user.id}</div>
          <div style={{ marginBottom: "8px" }}><strong>Name:</strong> {user.name || "Not available"}</div>
          <div style={{ marginBottom: "8px" }}><strong>Email:</strong> {user.email || "Not available"}</div>
          <div style={{ marginBottom: "8px" }}><strong>Phone:</strong> {user.phone || "Not available"}</div>
          <div style={{ marginBottom: "8px" }}><strong>Employee ID:</strong> {user.employeeId || "Not available"}</div>
          <div style={{ marginBottom: "8px" }}><strong>Department:</strong> {(user as Record<string, unknown>).department as string || "Not available"}</div>
          <div style={{ marginBottom: "8px" }}><strong>Designation:</strong> {(user as Record<string, unknown>).designation as string || "Not available"}</div>
          <div style={{ marginBottom: "8px" }}><strong>Role:</strong> {user.role || "supervisor"}</div>
          <div style={{ marginBottom: "8px" }}><strong>Username:</strong> {user.username || "Not available"}</div>
          <div style={{ marginBottom: "8px" }}><strong>Assigned Scholars:</strong> {assignedScholarCount}</div>
          <div style={{ marginBottom: "8px" }}><strong>Created At:</strong> {user.createdAt ? new Date(String(user.createdAt)).toLocaleString() : "Not available"}</div>
          <div style={{ marginBottom: "0" }}><strong>Updated At:</strong> {user.updatedAt ? new Date(String(user.updatedAt)).toLocaleString() : "Not available"}</div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e6e6e6", borderRadius: "10px", overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #eee", color: "#0b6a55", fontWeight: 700 }}>
            Assigned Scholars
          </div>

          {isAssignedScholarsLoading ? (
            <div style={{ padding: "16px", color: "#666" }}>Loading assigned scholars...</div>
          ) : assignedScholars.length === 0 ? (
            <div style={{ padding: "16px", color: "#666" }}>No scholars are currently assigned to this supervisor.</div>
          ) : (
            <table className="info-table">
              <thead>
                <tr>
                  <th>Scholar ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Research Area</th>
                  <th>Phase</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {assignedScholars.map((scholar) => (
                  <tr key={scholar.scholarId}>
                    <td>{scholar.scholarId}</td>
                    <td>{scholar.name || "-"}</td>
                    <td>{scholar.department || "-"}</td>
                    <td>{scholar.researchArea || "-"}</td>
                    <td>{scholar.phase || "-"}</td>
                    <td>{scholar.status || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  if (activeSection === "biometric") {
    return (
      <div style={{ padding: "20px" }}>
        <h2 style={{ color: "#0b6a55", marginBottom: "20px" }}>{sectionTitle}</h2>
        <div style={{ background: "#fff", border: "1px solid #e6e6e6", borderRadius: "10px", padding: "20px" }}>
          <h4 style={{ color: "#0b6a55", marginBottom: "8px" }}>Attendance Integration</h4>
          <p style={{ color: "#555", marginBottom: "10px" }}>This section is ready for biometric attendance sync and verification logs.</p>
          <ul style={{ margin: 0, paddingLeft: "20px", color: "#555" }}>
            <li>Last Sync: Not configured</li>
            <li>Device Status: Not connected</li>
            <li>Verification Records: 0</li>
          </ul>
        </div>
      </div>
    );
  }

  if (activeSection === "help-support") {
    return (
      <div style={{ padding: "20px" }}>
        <h2 style={{ color: "#0b6a55", marginBottom: "20px" }}>{sectionTitle}</h2>
        <div style={{ background: "#fff", border: "1px solid #e6e6e6", borderRadius: "10px", padding: "20px", marginBottom: "12px" }}>
          <h4 style={{ color: "#0b6a55", marginBottom: "8px" }}>Support Channels</h4>
          <p style={{ color: "#555", marginBottom: "6px" }}><strong>Email:</strong> drc-support@gitam.edu</p>
          <p style={{ color: "#555", marginBottom: "6px" }}><strong>Phone:</strong> +91-00000-00000</p>
          <p style={{ color: "#555", marginBottom: "0" }}><strong>Hours:</strong> Mon-Fri, 9:00 AM - 5:00 PM</p>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e6e6e6", borderRadius: "10px", padding: "20px" }}>
          <h4 style={{ color: "#0b6a55", marginBottom: "8px" }}>Need Help Reviewing Applications?</h4>
          <p style={{ color: "#555", margin: 0 }}>Use the Dashboard or Separate Application Requests tab to view details and submit approvals or rejections with remarks.</p>
        </div>
      </div>
    );
  }

  if (activeSection === "rac-reviews") {
    return (
      <div style={{ padding: "20px" }}>
        <h2 style={{ color: "#0b6a55", marginBottom: "20px" }}>{sectionTitle}</h2>
        <div style={{ background: "#fff", border: "1px solid #e6e6e6", borderRadius: "10px", padding: "20px", marginBottom: "12px" }}>
          <h4 style={{ color: "#0b6a55", marginBottom: "8px" }}>RAC Reviews Are Meeting-Based</h4>
          <p style={{ color: "#555", margin: 0 }}>
            RAC reviews are conducted by RAC members with the scholar in scheduled meetings. They are not part of supervisor application requests.
          </p>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e6e6e6", borderRadius: "10px", overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #eee", color: "#0b6a55", fontWeight: 700 }}>
            RAC / DRC Meetings
          </div>

          {isRacMeetingsLoading ? (
            <div style={{ padding: "16px", color: "#666" }}>Loading meetings...</div>
          ) : drcMeetings.length === 0 ? (
            <div style={{ padding: "16px", color: "#666" }}>No meeting records available.</div>
          ) : (
            <table className="info-table">
              <thead>
                <tr>
                  <th>Meeting ID</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {drcMeetings.map((meeting) => (
                  <tr key={meeting.id}>
                    <td>{meeting.id}</td>
                    <td>{new Date(meeting.meetingDate as unknown as string).toLocaleString()}</td>
                    <td>{meeting.closedAt ? "Closed" : "Open"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
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

            <button
              type="button"
              className="submit-btn"
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
            </button>
          </div>

          <div style={{ color: "#666", fontSize: "13px", marginBottom: "8px" }}>
            Showing {filteredAndSortedApplications.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
            -{Math.min(page * PAGE_SIZE, filteredAndSortedApplications.length)} of {filteredAndSortedApplications.length} matching applications
          </div>

          <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #e6e6e6", overflow: "hidden" }}>
            {filteredAndSortedApplications.length === 0 ? (
              <div style={{ padding: "28px", textAlign: "center", color: "#666" }}>
                No applications matched your search/filter criteria.
              </div>
            ) : (
              <table className="info-table">
                <thead>
                  <tr>
                    <th>Scholar ID</th>
                    <th>Type</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Stage</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedApplications.map((app) => (
                    <tr key={app.id}>
                      <td>{app.scholarId}</td>
                      <td>{app.type}</td>
                      <td>{new Date(app.submissionDate as unknown as string).toLocaleDateString()}</td>
                      <td>
                        <span
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
                        </span>
                      </td>
                      <td style={{ textTransform: "capitalize" }}>{app.currentStage}</td>
                      <td>
                        <button
                          type="button"
                          className="submit-btn"
                          onClick={() => handleOpenDetails(app)}
                          style={{ padding: "6px 12px", fontSize: "13px" }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {filteredAndSortedApplications.length > PAGE_SIZE && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
              <button
                type="button"
                className="submit-btn"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                style={{ background: page === 1 ? "#b3b3b3" : "#0b6a55" }}
              >
                Previous
              </button>

              <div style={{ color: "#444", fontWeight: 600 }}>Page {page} of {totalPages}</div>

              <button
                type="button"
                className="submit-btn"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                style={{ background: page === totalPages ? "#b3b3b3" : "#0b6a55" }}
              >
                Next
              </button>
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
                      <button
                        type="button"
                        className="submit-btn"
                        onClick={() => {
                          setDecision("approved");
                          setShowReviewForm(true);
                        }}
                        style={{ background: "#27ae60" }}
                      >
                        ✓ Approve
                      </button>
                      <button
                        type="button"
                        className="submit-btn"
                        onClick={() => {
                          setDecision("rejected");
                          setShowReviewForm(true);
                        }}
                        style={{ background: "#e74c3c" }}
                      >
                        ✗ Reject
                      </button>
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
                        <button
                          type="button"
                          className="submit-btn"
                          onClick={handleSubmitReview}
                          disabled={reviewMutation.isPending}
                          style={{ background: decision === "approved" ? "#27ae60" : "#e74c3c" }}
                        >
                          {reviewMutation.isPending ? "Submitting..." : "Submit Review"}
                        </button>
                        <button
                          type="button"
                          className="submit-btn"
                          onClick={() => {
                            setShowReviewForm(false);
                            setRemarks("");
                          }}
                          style={{ background: "#666" }}
                          disabled={reviewMutation.isPending}
                        >
                          Cancel
                        </button>
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
