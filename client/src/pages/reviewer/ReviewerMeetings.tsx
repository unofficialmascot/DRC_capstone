import { api, buildUrl } from "@shared/routes";
import {
  useDrcMeetingsList,
} from "@/hooks/use-application-reviews";

export default function ReviewerMeetings({ role }: { role: string }) {
  const canViewMeetings = role === "drc" || role === "drc_convener";

  const { data: meetings = [], isLoading: isMeetingsLoading } = useDrcMeetingsList(canViewMeetings);

  const handleDownloadAgendaPdf = (meetingId: number) => {
    const pdfUrl = buildUrl(api.drcMeetings.downloadAgendaPdf.path, { id: meetingId });
    window.open(pdfUrl, "_blank");
  };

  if (!canViewMeetings) {
    return (
      <div style={{ padding: "20px" }}>
        <div style={{ textAlign: "center", padding: "40px", color: "#666", background: "#fff", borderRadius: "10px", border: "1px solid #e6e6e6" }}>
          Meetings are available only for DRC roles.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ color: "#0b6a55", marginBottom: "20px" }}>DRC Meetings</h2>

      <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", border: "1px solid #e6e6e6" }}>
        <h3 style={{ marginTop: 0, marginBottom: "12px", color: "#0b6a55" }}>Meeting Agendas</h3>
        {isMeetingsLoading ? (
          <div style={{ color: "#666" }}>Loading meetings...</div>
        ) : meetings.length === 0 ? (
          <div style={{ color: "#666" }}>No meetings available yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {meetings.map((meeting) => (
              <div key={meeting.id} style={{ border: "1px solid #e6e6e6", borderRadius: "8px", padding: "12px" }}>
                <div style={{ fontWeight: "600", marginBottom: "6px" }}>Meeting #{meeting.id}</div>
                <div style={{ fontSize: "13px", color: "#555", marginBottom: "8px" }}>
                  Date: {new Date(meeting.meetingDate as unknown as string).toLocaleString()} | Status: {meeting.closedAt ? "Closed" : "Open"}
                </div>
                <button
                  type="button"
                  className="submit-btn"
                  onClick={() => handleDownloadAgendaPdf(meeting.id)}
                  data-testid={`button-download-meeting-pdf-${meeting.id}`}
                >
                  Download Agenda PDF
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
