import { useMemo, useState } from "react";
import {
  useChairmanDecision,
  useChairmanMinutesDetails,
  useChairmanMinutesMeetings,
} from "@/hooks/use-application-reviews";
import { useToast } from "@/hooks/use-toast";

function formatDateTime(value: unknown): string {
  if (!value) {
    return "-";
  }

  return new Date(String(value)).toLocaleString();
}

export default function ChairmanMinutes() {
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null);
  const [remarksByApp, setRemarksByApp] = useState<Record<number, string>>({});
  const { toast } = useToast();

  const { data: meetings = [], isLoading: isMeetingsLoading } = useChairmanMinutesMeetings(true);

  const effectiveMeetingId = useMemo(() => {
    if (selectedMeetingId !== null) {
      return selectedMeetingId;
    }

    return meetings[0]?.meeting.id ?? null;
  }, [meetings, selectedMeetingId]);

  const { data: details, isLoading: isDetailsLoading } = useChairmanMinutesDetails(
    effectiveMeetingId,
    Boolean(effectiveMeetingId),
  );

  const decisionMutation = useChairmanDecision();

  const submitDecision = (
    applicationId: number,
    decision: "approved" | "rejected",
  ) => {
    if (!effectiveMeetingId) {
      return;
    }

    const remarks = remarksByApp[applicationId]?.trim();
    if (!remarks) {
      toast({
        title: "Action Required",
        description: "Please add remarks before submitting chairman decision.",
        variant: "destructive",
      });
      return;
    }

    decisionMutation.mutate({
      meetingId: effectiveMeetingId,
      applicationId,
      decision,
      remarks,
    }, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: `Application ${decision === "approved" ? "approved" : "rejected"} successfully to next stage!`,
        });
        setRemarksByApp((current) => {
          const updated = { ...current };
          delete updated[applicationId];
          return updated;
        });
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to submit chairman decision",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ color: "#0b6a55", marginBottom: "20px" }}>DRC Chairman Minutes</h2>

      <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", border: "1px solid #e6e6e6", marginBottom: "20px" }}>
        <h3 style={{ marginTop: 0, marginBottom: "12px", color: "#0b6a55" }}>Meetings With Minutes</h3>
        {isMeetingsLoading ? (
          <div style={{ color: "#666" }}>Loading meetings...</div>
        ) : meetings.length === 0 ? (
          <div style={{ color: "#666" }}>No minutes available yet. Minutes are generated when a meeting is closed.</div>
        ) : (
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {meetings.map((entry) => (
              <button
                key={entry.meeting.id}
                type="button"
                className="submit-btn"
                style={{ background: effectiveMeetingId === entry.meeting.id ? "#0b6a55" : "#4f6f67" }}
                onClick={() => setSelectedMeetingId(entry.meeting.id)}
                data-testid={`button-select-minutes-${entry.meeting.id}`}
              >
                Meeting #{entry.meeting.id}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", border: "1px solid #e6e6e6" }}>
        <h3 style={{ marginTop: 0, marginBottom: "12px", color: "#0b6a55" }}>Minutes Details</h3>
        {!effectiveMeetingId ? (
          <div style={{ color: "#666" }}>Select a meeting to view minutes.</div>
        ) : isDetailsLoading ? (
          <div style={{ color: "#666" }}>Loading minutes details...</div>
        ) : !details ? (
          <div style={{ color: "#666" }}>Minutes details not found.</div>
        ) : (
          <>
            <div style={{ fontSize: "13px", color: "#555", marginBottom: "14px" }}>
              Meeting Date: {formatDateTime(details.meeting.meetingDate)} | Generated: {formatDateTime(details.minutes.generatedAt)}
            </div>

            {details.items.length === 0 ? (
              <div style={{ color: "#666" }}>No minute items found for this meeting.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {details.items.map((item) => (
                  <div key={item.id} style={{ border: "1px solid #e6e6e6", borderRadius: "8px", padding: "12px" }}>
                    {(() => {
                      const scholarName =
                        (item.application as any)?.scholar?.name ??
                        item.application?.scholarId ??
                        "Unknown Scholar";

                      return (
                    <div style={{ fontWeight: 600, marginBottom: "6px" }}>
                      {item.application?.type ?? "Application"} - {scholarName}
                    </div>
                      );
                    })()}
                    <div style={{ fontSize: "13px", color: "#555", marginBottom: "6px" }}>
                      DRC member decisions: {item.approvalCount} approved / {item.rejectionCount} rejected
                    </div>

                    {item.chairmanDecision ? (
                      <div style={{ background: "#f8f9fa", borderRadius: "6px", padding: "10px", fontSize: "13px" }}>
                        Chairman decision: <strong>{item.chairmanDecision.decision.toUpperCase()}</strong><br />
                        Remarks: {item.chairmanDecision.remarks}
                      </div>
                    ) : (
                      <>
                        <textarea
                          value={remarksByApp[item.applicationId] ?? ""}
                          onChange={(event) =>
                            setRemarksByApp((current) => ({
                              ...current,
                              [item.applicationId]: event.target.value,
                            }))
                          }
                          placeholder="Chairman remarks"
                          style={{ height: "90px", width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ddd", marginBottom: "10px" }}
                          data-testid={`input-chairman-remarks-${item.applicationId}`}
                        />
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            type="button"
                            className="submit-btn"
                            style={{ background: "#27ae60" }}
                            onClick={() => submitDecision(item.applicationId, "approved")}
                            disabled={decisionMutation.isPending}
                            data-testid={`button-chairman-approve-${item.applicationId}`}
                          >
                            Approve to Next Stage
                          </button>
                          <button
                            type="button"
                            className="submit-btn"
                            style={{ background: "#e74c3c" }}
                            onClick={() => submitDecision(item.applicationId, "rejected")}
                            disabled={decisionMutation.isPending}
                            data-testid={`button-chairman-reject-${item.applicationId}`}
                          >
                            Reject Application
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
