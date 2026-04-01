import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import {
  useApplicationById,
  useApplicationsByStage,
  useCloseDrcMeeting,
  useOpenDrcMeeting,
  useSubmitReview,
  useScheduleDrcMeeting,
  type DrcMeetingAgenda,
} from "@/hooks/use-application-reviews";
import ApplicationDetailFormView from "@/components/applications/ApplicationDetailFormView";
import { useToast } from "@/hooks/use-toast";
import type { Application } from "@shared/schema";
import type { PublicUser } from "@/lib/types";

export default function ReviewerApplications({ user }: { user: PublicUser }) {
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [remarks, setRemarks] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("10:00");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [agendaPointInput, setAgendaPointInput] = useState("");
  const [extraPoints, setExtraPoints] = useState<string[]>([]);
  const [latestAgenda, setLatestAgenda] = useState<DrcMeetingAgenda | null>(null);
  const { toast } = useToast();

  const isConvener = user.role === "drc_convener" || user.role === "irc_convener";
  const committee = user.role === "irc_convener" ? "IRC" : "DRC";
  const roleLabel = isConvener ? `${committee} Convener` : user.role.toUpperCase();
  const reviewerKey = user.employeeId || user.scholarId || user.username || user.email;

  const { data: pendingApps = [], isLoading } = useApplicationsByStage(isConvener ? "" : user.role) as {
    data: Application[] | undefined;
    isLoading: boolean;
  };
  const { data: committeePendingApps = [] } = useApplicationsByStage(committee.toLowerCase()) as {
    data: Application[] | undefined;
  };

  const { data: allUsers = [] } = useQuery<PublicUser[]>({
    queryKey: ["/api/users"],
    queryFn: () => fetch("/api/users").then((res) => res.json()),
  });

  const getScholarName = (scholarId: string) => {
    const scholar = allUsers.find((u) => u.scholarId === scholarId);
    return scholar?.name || scholarId;
  };

  const getScholarLabel = (scholarId: string) => {
    const scholar = allUsers.find((u) => u.scholarId === scholarId);
    if (!scholar?.name) {
      return scholarId;
    }

    return `${scholar.name} (${scholarId})`;
  };

  const reviewMutation = useSubmitReview(selectedApp?.id ?? 0);
  const { data: selectedApplicationDetail } = useApplicationById(selectedApp?.id ?? 0) as {
    data: Application | undefined;
  };
  const scheduleMeetingMutation = useScheduleDrcMeeting();
  const closeMeetingMutation = useCloseDrcMeeting();
  const { data: openMeetingAgenda, isLoading: isOpenMeetingLoading } = useOpenDrcMeeting(user.role === "drc_convener");
  const displayApplication = (selectedApplicationDetail ?? selectedApp) as Application | null;

  useEffect(() => {
    if (openMeetingAgenda) {
      setLatestAgenda(openMeetingAgenda);
    } else {
      setLatestAgenda(null);
    }
  }, [openMeetingAgenda]);

  const hasOpenMeeting = Boolean(latestAgenda && !latestAgenda.meeting.closedAt);

  const handleReview = (decision: "approved" | "rejected") => {
    if (!selectedApp) return;
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
    reviewMutation.mutate({ reviewerId: reviewerKey, decision, remarks }, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: `Application ${decision === "approved" ? "approved" : "rejected"} successfully!`,
        });
        setSelectedApp(null);
        setRemarks("");
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to submit review.",
          variant: "destructive",
        });
      },
    });
  };

  const addAgendaPoint = () => {
    const point = agendaPointInput.trim();
    if (!point) {
      return;
    }

    setExtraPoints((existingPoints) => [...existingPoints, point]);
    setAgendaPointInput("");
  };

  const removeAgendaPoint = (index: number) => {
    setExtraPoints((existingPoints) => existingPoints.filter((_, i) => i !== index));
  };

  const handleScheduleMeeting = () => {
    if (hasOpenMeeting) {
      toast({
        title: "Action Required",
        description: "An active meeting already exists. Please close it before scheduling a new meeting.",
        variant: "destructive",
      });
      return;
    }

    if (!meetingDate) {
      toast({
        title: "Action Required",
        description: "Please select a meeting date.",
        variant: "destructive",
      });
      return;
    }

    if (!meetingLocation.trim()) {
      toast({
        title: "Action Required",
        description: "Please provide meeting location.",
        variant: "destructive",
      });
      return;
    }

    const dateTime = new Date(`${meetingDate}T${meetingTime}:00`);
    if (Number.isNaN(dateTime.getTime())) {
      toast({
        title: "Action Required",
        description: "Please enter valid meeting date and time.",
        variant: "destructive",
      });
      return;
    }

    const meetingMetaPoint = `Location: ${meetingLocation.trim()}`;
    const agendaPoints = [meetingMetaPoint, ...extraPoints];

    scheduleMeetingMutation.mutate(
      {
        meetingDate: dateTime.toISOString(),
        extraPoints: agendaPoints,
      },
      {
        onSuccess: (agenda) => {
          setLatestAgenda(agenda);
          setExtraPoints([]);
          setAgendaPointInput("");
          setMeetingLocation("");
          setMeetingDate("");
          toast({
            title: "Success",
            description: "Meeting scheduled and agenda created successfully.",
          });
        },
        onError: (error: Error) => {
          toast({
            title: "Error",
            description: error.message || "Failed to schedule meeting.",
            variant: "destructive",
          });
        },
      },
    );
  };

  const handleCloseMeeting = () => {
    if (!latestAgenda) {
      return;
    }

    closeMeetingMutation.mutate(latestAgenda.meeting.id, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Meeting closed. You can schedule a new meeting now.",
        });
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to close meeting.",
          variant: "destructive",
        });
      },
    });
  };

  const handleDownloadAgendaPdf = (meetingId: number) => {
    const pdfUrl = buildUrl(api.drcMeetings.downloadAgendaPdf.path, { id: meetingId });
    window.open(pdfUrl, "_blank");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ color: "#0b6a55", marginBottom: "20px" }}>{isConvener ? `Meeting Agenda - ${roleLabel}` : `Pending Reviews - ${roleLabel}`}</h2>
      {isConvener && (
        <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", border: "1px solid #e6e6e6", marginBottom: "20px" }}>
          <h3 style={{ marginTop: 0, marginBottom: "12px", color: "#0b6a55" }}>Schedule {committee} Meeting</h3>
          <div style={{ fontSize: "13px", color: "#666", marginBottom: "12px" }}>
            Agenda snapshot includes all currently pending {committee}-stage applications at scheduling time.
          </div>
          {user.role === "irc_convener" && (
            <div style={{ background: "#fff6e5", border: "1px solid #f4d28a", color: "#8a5a00", borderRadius: "6px", padding: "10px", marginBottom: "12px" }}>
              IRC meeting scheduling backend endpoints are pending; this page mirrors the DRC convener layout.
            </div>
          )}
          {hasOpenMeeting && (
            <div style={{ background: "#fff6e5", border: "1px solid #f4d28a", color: "#8a5a00", borderRadius: "6px", padding: "10px", marginBottom: "12px" }}>
              Active meeting #{latestAgenda?.meeting.id} is open. Close it before scheduling another meeting.
            </div>
          )}

          <div style={{ marginBottom: "12px" }}>
            <div style={{ fontWeight: 600, marginBottom: "6px", color: "#0b6a55" }}>
              Pending {committee} Applications ({committeePendingApps.length})
            </div>
            {committeePendingApps.length === 0 ? (
              <div style={{ fontSize: "13px", color: "#666" }}>No pending applications currently in {committee} stage.</div>
            ) : (
              <ul style={{ margin: "0 0 0 18px", padding: 0, maxHeight: "150px", overflowY: "auto" }}>
                {committeePendingApps.map((application) => (
                  <li key={application.id} style={{ marginBottom: "6px", fontSize: "13px" }}>
                    {application.type} — {getScholarLabel(application.scholarId)}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr", gap: "10px" }}>
              <div>
                <label style={{ fontWeight: "600", display: "block", marginBottom: "6px" }}>Meeting Date</label>
                <input
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ddd" }}
                  data-testid="input-meeting-date"
                />
              </div>
              <div>
                <label style={{ fontWeight: "600", display: "block", marginBottom: "6px" }}>Meeting Time</label>
                <input
                  type="time"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ddd" }}
                  data-testid="input-meeting-time"
                />
              </div>
              <div>
                <label style={{ fontWeight: "600", display: "block", marginBottom: "6px" }}>Location</label>
                <input
                  type="text"
                  value={meetingLocation}
                  onChange={(e) => setMeetingLocation(e.target.value)}
                  placeholder="Seminar Hall / Meeting Room"
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ddd" }}
                  data-testid="input-meeting-location"
                />
              </div>
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: "12px" }}>
            <label style={{ fontWeight: "600" }}>Extra Agenda Points</label>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                value={agendaPointInput}
                onChange={(e) => setAgendaPointInput(e.target.value)}
                placeholder="Add custom agenda point"
                style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #ddd" }}
                data-testid="input-agenda-point"
              />
              <button type="button" className="submit-btn" onClick={addAgendaPoint} data-testid="button-add-agenda-point">Add</button>
            </div>
          </div>
          {extraPoints.length > 0 && (
            <div style={{ marginBottom: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {extraPoints.map((point, index) => (
                <div key={`${point}-${index}`} style={{ display: "flex", justifyContent: "space-between", gap: "10px", background: "#f8f9fa", borderRadius: "6px", padding: "8px 10px" }}>
                  <span style={{ fontSize: "14px" }}>{point}</span>
                  <button type="button" onClick={() => removeAgendaPoint(index)} style={{ border: "none", background: "transparent", color: "#e74c3c", cursor: "pointer" }} data-testid={`button-remove-agenda-point-${index}`}>Remove</button>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            className="submit-btn"
            onClick={handleScheduleMeeting}
            disabled={user.role !== "drc_convener" || scheduleMeetingMutation.isPending || hasOpenMeeting || isOpenMeetingLoading}
            data-testid="button-schedule-meeting"
          >
            {user.role === "irc_convener" ? "Schedule Meeting (Coming Soon)" : scheduleMeetingMutation.isPending ? "Scheduling..." : "Schedule Meeting"}
          </button>
        </div>
      )}

      {user.role === "drc_convener" && latestAgenda && (
        <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", border: "1px solid #e6e6e6", marginBottom: "20px" }}>
          <h3 style={{ marginTop: 0, marginBottom: "10px", color: "#0b6a55" }}>Latest Scheduled Agenda</h3>
          <div style={{ fontSize: "13px", color: "#666", marginBottom: "12px" }}>
            Meeting Date: {new Date(latestAgenda.meeting.meetingDate as unknown as string).toLocaleString()}
          </div>
          <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
            <button
              type="button"
              className="submit-btn"
              onClick={() => handleDownloadAgendaPdf(latestAgenda.meeting.id)}
              data-testid="button-download-agenda-pdf"
            >
              Download Agenda PDF
            </button>
            {!latestAgenda.meeting.closedAt && (
              <button
                type="button"
                className="submit-btn"
                style={{ background: "#e67e22" }}
                onClick={handleCloseMeeting}
                disabled={closeMeetingMutation.isPending}
                data-testid="button-close-meeting"
              >
                {closeMeetingMutation.isPending ? "Closing..." : "Close Meeting"}
              </button>
            )}
          </div>
          {latestAgenda.meeting.closedAt && (
            <div style={{ fontSize: "13px", color: "#666", marginBottom: "12px" }}>
              Status: Closed on {new Date(latestAgenda.meeting.closedAt as unknown as string).toLocaleString()}
            </div>
          )}
          <div style={{ marginBottom: "10px" }}><strong>Pending Applications Included:</strong> {latestAgenda.applications.length}</div>
          <ul style={{ margin: "0 0 12px 18px", padding: 0 }}>
            {latestAgenda.applications.map((application) => (
              <li key={application.id} style={{ marginBottom: "6px" }}>
                {application.type} — {getScholarName(application.scholarId)}
              </li>
            ))}
          </ul>
          {latestAgenda.extraPoints.length > 0 && (
            <>
              <div style={{ marginBottom: "8px" }}><strong>Extra Agenda Points:</strong></div>
              <ul style={{ margin: "0 0 0 18px", padding: 0 }}>
                {latestAgenda.extraPoints.map((point) => (
                  <li key={point.id} style={{ marginBottom: "6px" }}>{point.point}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {!isConvener && (
        isLoading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>Loading...</div>
        ) : pendingApps.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#666", background: "#fff", borderRadius: "10px", border: "1px solid #e6e6e6" }}>
            No applications pending at {roleLabel} stage.
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #e6e6e6", overflow: "hidden" }}>
            <table className="info-table">
              <thead>
                <tr>
                  <th>Scholar</th>
                  <th>Type</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Stage</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingApps.map((app) => (
                  <tr key={app.id}>
                    <td>{getScholarLabel(app.scholarId)}</td>
                    <td>{app.type}</td>
                    <td>{new Date(app.submissionDate as unknown as string).toLocaleDateString()}</td>
                    <td>
                      <span
                        className="pill"
                        style={{
                          background: "#f39c12",
                          color: "white",
                          padding: "4px 10px",
                          borderRadius: "15px",
                          fontSize: "13px",
                        }}
                      >
                        Awaiting Review
                      </span>
                    </td>
                    <td style={{ textTransform: "capitalize" }}>{app.currentStage}</td>
                    <td>
                      <button
                        type="button"
                        className="submit-btn"
                        onClick={() => setSelectedApp(app)}
                        style={{ padding: "6px 12px", fontSize: "13px" }}
                        data-testid={`button-review-${app.id}`}
                      >
                        Review Application
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {!isConvener && selectedApp && (
        <div className="modal-overlay active" onClick={() => setSelectedApp(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "980px",
              width: "calc(100vw - 2rem)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div className="modal-header">
              <div className="modal-title">Review: {selectedApp.type}</div>
              <button type="button" className="close-btn" onClick={() => setSelectedApp(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: "20px" }}>
                <strong>Scholar:</strong> {getScholarName(selectedApp.scholarId)}<br />
                <strong>Type:</strong> {selectedApp.type}<br />
                <strong>Submitted:</strong> {new Date(selectedApp.submissionDate as unknown as string).toLocaleDateString()}
              </div>
              <ApplicationDetailFormView
                application={displayApplication ?? selectedApp}
                scholarDisplayName={getScholarName((displayApplication ?? selectedApp).scholarId)}
              />
              <div className="form-group">
                <label style={{ fontWeight: "600" }}>Your Remarks (Required)</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Provide your remarks and reasoning for the decision..."
                  style={{ height: "100px", width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ddd" }}
                  data-testid="input-remarks"
                />
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "20px",
                  position: "sticky",
                  bottom: 0,
                  background: "#fff",
                  paddingTop: "12px",
                  borderTop: "1px solid #eee",
                }}
              >
                <button type="button" className="submit-btn" style={{ background: "#27ae60", flex: 1 }} onClick={() => handleReview("approved")} disabled={reviewMutation.isPending} data-testid="button-approve">
                  {reviewMutation.isPending ? "Processing..." : "Approve"}
                </button>
                <button type="button" className="submit-btn" style={{ background: "#e74c3c", flex: 1 }} onClick={() => handleReview("rejected")} disabled={reviewMutation.isPending} data-testid="button-reject">
                  {reviewMutation.isPending ? "Processing..." : "Reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
