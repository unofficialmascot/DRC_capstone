import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import {
  useApplicationsByStage,
  useCloseDrcMeeting,
  useOpenDrcMeeting,
  useSubmitReview,
  useScheduleDrcMeeting,
  type DrcMeetingAgenda,
} from "@/hooks/use-application-reviews";
import { Calendar } from "@/components/ui/calendar";
import type { Application } from "@shared/schema";
import type { PublicUser } from "@/lib/types";

export default function ReviewerApplications({ user }: { user: PublicUser }) {
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [remarks, setRemarks] = useState("");
  const [meetingDate, setMeetingDate] = useState<Date | undefined>(undefined);
  const [meetingTime, setMeetingTime] = useState("10:00");
  const [agendaPointInput, setAgendaPointInput] = useState("");
  const [extraPoints, setExtraPoints] = useState<string[]>([]);
  const [latestAgenda, setLatestAgenda] = useState<DrcMeetingAgenda | null>(null);

  const isDrcConvener = user.role === "drc_convener";
  const roleLabel = isDrcConvener ? "DRC Convener" : user.role.toUpperCase();

  const { data: pendingApps = [], isLoading } = useApplicationsByStage(isDrcConvener ? "" : user.role) as {
    data: Application[] | undefined;
    isLoading: boolean;
  };

  const { data: allUsers = [] } = useQuery<PublicUser[]>({
    queryKey: ["/api/users"],
    queryFn: () => fetch("/api/users").then((res) => res.json()),
  });

  const getScholarName = (scholarId: string) => {
    const scholar = allUsers.find((u) => u.scholarId === scholarId);
    return scholar?.name || scholarId;
  };

  const reviewMutation = useSubmitReview(selectedApp?.id ?? 0);
  const scheduleMeetingMutation = useScheduleDrcMeeting();
  const closeMeetingMutation = useCloseDrcMeeting();
  const { data: openMeetingAgenda, isLoading: isOpenMeetingLoading } = useOpenDrcMeeting(isDrcConvener);

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
      alert("Please provide remarks for your decision.");
      return;
    }
    if (!user.username) {
      alert("Employee ID is missing. Please log in again.");
      return;
    }
    reviewMutation.mutate({ reviewerId: user.username, decision, remarks }, {
      onSuccess: () => {
        alert(`Application ${decision === "approved" ? "approved" : "rejected"} successfully!`);
        setSelectedApp(null);
        setRemarks("");
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
      alert("An active meeting already exists. Please close it before scheduling a new meeting.");
      return;
    }

    if (!meetingDate) {
      alert("Please select a meeting date from the calendar.");
      return;
    }

    const [hours, minutes] = meetingTime.split(":").map((value) => Number(value));
    const dateTime = new Date(meetingDate);
    dateTime.setHours(Number.isFinite(hours) ? hours : 10);
    dateTime.setMinutes(Number.isFinite(minutes) ? minutes : 0);
    dateTime.setSeconds(0, 0);

    scheduleMeetingMutation.mutate(
      {
        meetingDate: dateTime.toISOString(),
        extraPoints,
      },
      {
        onSuccess: (agenda) => {
          setLatestAgenda(agenda);
          setExtraPoints([]);
          setAgendaPointInput("");
          alert("Meeting scheduled and agenda created successfully.");
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
        alert("Meeting closed. You can schedule a new meeting now.");
      },
    });
  };

  const handleDownloadAgendaPdf = (meetingId: number) => {
    const pdfUrl = buildUrl(api.drcMeetings.downloadAgendaPdf.path, { id: meetingId });
    window.open(pdfUrl, "_blank");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ color: "#0b6a55", marginBottom: "20px" }}>{isDrcConvener ? `Meeting Agenda - ${roleLabel}` : `Pending Reviews - ${roleLabel}`}</h2>
      {isDrcConvener && (
        <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", border: "1px solid #e6e6e6", marginBottom: "20px" }}>
          <h3 style={{ marginTop: 0, marginBottom: "12px", color: "#0b6a55" }}>Schedule DRC Meeting</h3>
          <div style={{ fontSize: "13px", color: "#666", marginBottom: "12px" }}>
            Agenda snapshot includes all currently pending DRC-stage applications at scheduling time.
          </div>
          {hasOpenMeeting && (
            <div style={{ background: "#fff6e5", border: "1px solid #f4d28a", color: "#8a5a00", borderRadius: "6px", padding: "10px", marginBottom: "12px" }}>
              Active meeting #{latestAgenda?.meeting.id} is open. Close it before scheduling another meeting.
            </div>
          )}
          <div className="form-group" style={{ marginBottom: "12px" }}>
            <label style={{ fontWeight: "600", display: "block", marginBottom: "8px" }}>Meeting Date</label>
            <div style={{ border: "1px solid #ddd", borderRadius: "8px", display: "inline-block" }}>
              <Calendar
                mode="single"
                selected={meetingDate}
                onSelect={setMeetingDate}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                data-testid="calendar-meeting-date"
              />
            </div>
            <label style={{ fontWeight: "600", display: "block", marginTop: "10px", marginBottom: "6px" }}>Meeting Time</label>
            <input
              type="time"
              value={meetingTime}
              onChange={(e) => setMeetingTime(e.target.value)}
              style={{ width: "220px", padding: "10px", borderRadius: "6px", border: "1px solid #ddd" }}
              data-testid="input-meeting-time"
            />
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
            disabled={scheduleMeetingMutation.isPending || hasOpenMeeting || isOpenMeetingLoading}
            data-testid="button-schedule-meeting"
          >
            {scheduleMeetingMutation.isPending ? "Scheduling..." : "Schedule Meeting"}
          </button>
        </div>
      )}

      {isDrcConvener && latestAgenda && (
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

      {!isDrcConvener && (
        isLoading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>Loading...</div>
        ) : pendingApps.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#666", background: "#fff", borderRadius: "10px", border: "1px solid #e6e6e6" }}>
            No applications pending at {roleLabel} stage.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {pendingApps.map((app) => (
              <div key={app.id} style={{ background: "#fff", padding: "20px", borderRadius: "10px", border: "1px solid #e6e6e6" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                  <div>
                    <div style={{ fontWeight: "600", fontSize: "16px" }}>{app.type}</div>
                    <div style={{ fontSize: "13px", color: "#666" }}>Scholar: {getScholarName(app.scholarId)} | Submitted: {new Date(app.submissionDate as unknown as string).toLocaleDateString()}</div>
                  </div>
                  <div className="status-badge in-progress">Awaiting Review</div>
                </div>
                {Boolean(app.details) && (
                  <div style={{ background: "#f8f9fa", padding: "15px", borderRadius: "6px", marginBottom: "15px" }}>
                    <strong>Application Details:</strong>
                    <pre style={{ fontSize: "13px", whiteSpace: "pre-wrap", marginTop: "10px" }}>{JSON.stringify(app.details as Record<string, unknown>, null, 2)}</pre>
                  </div>
                )}
                <button type="button" className="submit-btn" onClick={() => setSelectedApp(app)} style={{ marginRight: "10px" }} data-testid={`button-review-${app.id}`}>Review Application</button>
              </div>
            ))}
          </div>
        )
      )}

      {!isDrcConvener && selectedApp && (
        <div className="modal-overlay active" onClick={() => setSelectedApp(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
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
              {Boolean(selectedApp.details) && (
                <div style={{ background: "#f8f9fa", padding: "15px", borderRadius: "6px", marginBottom: "20px" }}>
                  <strong>Details:</strong>
                  <pre style={{ fontSize: "13px", whiteSpace: "pre-wrap", marginTop: "10px" }}>{JSON.stringify(selectedApp.details as Record<string, unknown>, null, 2)}</pre>
                </div>
              )}
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
              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
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
