import { useState } from "react";
import {
  useChairmanDecision,
  useChairmanMinutesDetails,
  useChairmanMinutesMeetings,
} from "@/hooks/use-application-reviews";
import type { ChairmanMinuteItem } from "@/hooks/use-application-reviews";
import { useToast } from "@/hooks/use-toast";
import { api } from "@shared/routes";
import type { Application } from "@shared/schema";
import ApplicationDetailFormView from "@/components/applications/ApplicationDetailFormView";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MemberVote {
  reviewerId: string;
  reviewerName: string;
  decision: string;
  remarks: string | null;
  reviewDate: string | null;
  isAutoApproved: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(value: unknown): string {
  if (!value) return "-";
  return new Date(String(value)).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getScholarName(item: ChairmanMinuteItem): string {
  return (item.application as any)?.scholar?.name?.trim()
    || item.application?.scholarId
    || "Unknown Scholar";
}

function countPendingDecisions(items: ChairmanMinuteItem[]): number {
  return items.filter((i) => !i.chairmanDecision).length;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DecisionBadge({ decision, isAutoApproved }: { decision: string; isAutoApproved: boolean }) {
  if (isAutoApproved) {
    return (
      <span style={{
        display: "inline-block", padding: "2px 8px", borderRadius: "12px",
        fontSize: "11px", fontWeight: 600, background: "#e0e0e0", color: "#555",
      }}>AUTO-APPROVED</span>
    );
  }
  const isApproved = decision.toLowerCase() === "approved";
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: "12px",
      fontSize: "11px", fontWeight: 600,
      background: isApproved ? "#d4edda" : "#f8d7da",
      color: isApproved ? "#155724" : "#721c24",
    }}>
      {decision.toUpperCase()}
    </span>
  );
}

function VotesSection({ memberSummary }: { memberSummary: MemberVote[] }) {
  if (!memberSummary || memberSummary.length === 0) {
    return (
      <p style={{ color: "#888", fontSize: "13px", fontStyle: "italic" }}>
        No member votes recorded.
      </p>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {memberSummary.map((vote, idx) => (
        <div key={idx} style={{
          background: "#f8f9fa", borderRadius: "6px", padding: "10px 12px",
          border: "1px solid #e9ecef",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <span style={{ fontWeight: 600, fontSize: "13px" }}>{vote.reviewerName}</span>
            <DecisionBadge decision={vote.decision} isAutoApproved={vote.isAutoApproved} />
          </div>
          {vote.remarks && (
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#555" }}>
              {vote.remarks}
            </p>
          )}
          <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#999" }}>
            {formatDate(vote.reviewDate)}
          </p>
        </div>
      ))}
    </div>
  );
}

function ChairmanDecisionSection({
  item,
  remarksByApp,
  onRemarksChange,
  onSubmit,
  isPending,
}: {
  item: ChairmanMinuteItem;
  remarksByApp: Record<number, string>;
  onRemarksChange: (appId: number, val: string) => void;
  onSubmit: (appId: number, decision: "approved" | "rejected") => void;
  isPending: boolean;
}) {
  if (item.chairmanDecision) {
    const isApproved = item.chairmanDecision.decision === "approved";
    return (
      <div style={{
        background: isApproved ? "#d4edda" : "#f8d7da",
        border: `1px solid ${isApproved ? "#c3e6cb" : "#f5c6cb"}`,
        borderRadius: "6px", padding: "12px",
      }}>
        <div style={{ fontWeight: 600, color: isApproved ? "#155724" : "#721c24", marginBottom: "4px" }}>
          Chairman: {item.chairmanDecision.decision.toUpperCase()}
        </div>
        <p style={{ margin: 0, fontSize: "13px", color: "#333" }}>{item.chairmanDecision.remarks}</p>
        <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#888" }}>
          {formatDate(item.chairmanDecision.decidedAt)}
        </p>
      </div>
    );
  }

  return (
    <div>
      <textarea
        value={remarksByApp[item.applicationId] ?? ""}
        onChange={(e) => onRemarksChange(item.applicationId, e.target.value)}
        placeholder="Enter chairman remarks before deciding…"
        rows={3}
        style={{
          width: "100%", padding: "10px", borderRadius: "6px",
          border: "1px solid #ddd", resize: "vertical", marginBottom: "10px",
          fontFamily: "inherit", fontSize: "13px",
        }}
        data-testid={`input-chairman-remarks-${item.applicationId}`}
      />
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          type="button"
          className="submit-btn"
          style={{ background: "#27ae60" }}
          onClick={() => onSubmit(item.applicationId, "approved")}
          disabled={isPending}
          data-testid={`button-chairman-approve-${item.applicationId}`}
        >
          Approve to Next Stage
        </button>
        <button
          type="button"
          className="submit-btn"
          style={{ background: "#e74c3c" }}
          onClick={() => onSubmit(item.applicationId, "rejected")}
          disabled={isPending}
          data-testid={`button-chairman-reject-${item.applicationId}`}
        >
          Reject Application
        </button>
      </div>
    </div>
  );
}

function ApplicationFormSection({ application }: { application: Application | null }) {
  const [expanded, setExpanded] = useState(false);
  if (!application) return null;
  return (
    <div style={{ marginTop: "4px" }}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{
          background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: "6px",
          color: "#0b6a55", fontWeight: 600, fontSize: "13px", padding: "4px 0",
        }}
      >
        <span style={{ fontSize: "11px" }}>{expanded ? "▲" : "▼"}</span>
        {expanded ? "Hide Application Form" : "View Application Form"}
      </button>
      {expanded && (
        <div style={{ marginTop: "10px", border: "1px solid #e6e6e6", borderRadius: "6px", padding: "12px" }}>
          <ApplicationDetailFormView
            application={application}
            scholarDisplayName={(application as any)?.scholar?.name ?? undefined}
          />
        </div>
      )}
    </div>
  );
}

// ─── Meeting Modal ─────────────────────────────────────────────────────────────

function MeetingMinutesModal({
  meetingId,
  onClose,
}: {
  meetingId: number;
  onClose: () => void;
}) {
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [remarksByApp, setRemarksByApp] = useState<Record<number, string>>({});
  const { toast } = useToast();

  const { data: details, isLoading } = useChairmanMinutesDetails(meetingId, true);
  const decisionMutation = useChairmanDecision();

  const items = details?.items ?? [];
  const selectedItem = items.find((i) => i.applicationId === selectedAppId) ?? items[0] ?? null;

  const submitDecision = (appId: number, decision: "approved" | "rejected") => {
    const remarks = remarksByApp[appId]?.trim();
    if (!remarks) {
      toast({ title: "Remarks required", description: "Add remarks before submitting.", variant: "destructive" });
      return;
    }
    decisionMutation.mutate(
      { meetingId, applicationId: appId, decision, remarks },
      {
        onSuccess: () => {
          toast({ title: "Saved", description: `Application ${decision}.` });
          setRemarksByApp((prev) => { const next = { ...prev }; delete next[appId]; return next; });
        },
        onError: (err: Error) => {
          toast({ title: "Error", description: err.message || "Failed to submit", variant: "destructive" });
        },
      },
    );
  };

  const pdfUrl = details
    ? api.drcChairman.minutesPdf.path.replace(":meetingId", String(meetingId))
    : null;

  return (
    <div
      className="modal-overlay active"
      onClick={onClose}
      style={{ zIndex: 1000 }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "1100px", width: "95vw", height: "88vh",
          display: "flex", flexDirection: "column",
          borderRadius: "10px", overflow: "hidden",
        }}
      >
        {/* ── Header ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px", borderBottom: "1px solid #e6e6e6",
          background: "#fff", flexShrink: 0,
        }}>
          <div>
            <h3 style={{ margin: 0, color: "#0b6a55", fontSize: "16px" }}>
              Meeting #{meetingId} — Minutes
            </h3>
            {details && (
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#888" }}>
                {formatDate(details.meeting.meetingDate)} &nbsp;·&nbsp; Generated {formatDate(details.minutes.minutesGeneratedAt)}
              </p>
            )}
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {pdfUrl && (
              <button
                type="button"
                className="submit-btn"
                style={{ background: "#0b6a55", fontSize: "13px", padding: "6px 14px" }}
                onClick={() => window.open(pdfUrl, "_blank")}
              >
                ⬇ Download Minutes PDF
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: "20px", color: "#888", lineHeight: 1, padding: "2px 6px",
              }}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        {isLoading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>Loading minutes…</div>
        ) : !details || items.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>No minute items found.</div>
        ) : (
          <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
            {/* ── Left sidebar ── */}
            <div style={{
              width: "280px", minWidth: "220px", borderRight: "1px solid #e6e6e6",
              overflowY: "auto", background: "#fafafa", flexShrink: 0,
            }}>
              {items.map((item) => {
                const isSelected = item.applicationId === (selectedItem?.applicationId ?? null);
                const decided = Boolean(item.chairmanDecision);
                const approved = item.approvalCount;
                const rejected = item.rejectionCount;
                return (
                  <button
                    key={item.applicationId}
                    type="button"
                    onClick={() => setSelectedAppId(item.applicationId)}
                    style={{
                      width: "100%", textAlign: "left", padding: "12px 14px",
                      border: "none", borderBottom: "1px solid #e6e6e6",
                      background: isSelected ? "#e8f4f1" : "transparent",
                      borderLeft: isSelected ? "3px solid #0b6a55" : "3px solid transparent",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: "13px", color: "#222", marginBottom: "3px" }}>
                      {getScholarName(item)}
                    </div>
                    <div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>
                      {item.application?.type ?? "Application"}
                    </div>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <span style={{
                        fontSize: "11px", padding: "1px 6px", borderRadius: "10px",
                        background: "#d4edda", color: "#155724",
                      }}>✓ {approved}</span>
                      <span style={{
                        fontSize: "11px", padding: "1px 6px", borderRadius: "10px",
                        background: "#f8d7da", color: "#721c24",
                      }}>✗ {rejected}</span>
                      {decided && (
                        <span style={{
                          fontSize: "11px", padding: "1px 6px", borderRadius: "10px",
                          background: "#cce5ff", color: "#004085",
                        }}>✔ Decided</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ── Right panel ── */}
            {selectedItem ? (
              <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
                {/* Scholar & application header */}
                <div style={{ marginBottom: "18px" }}>
                  <h4 style={{ margin: "0 0 4px", color: "#0b6a55", fontSize: "15px" }}>
                    {getScholarName(selectedItem)}
                  </h4>
                  <p style={{ margin: 0, fontSize: "13px", color: "#555" }}>
                    {selectedItem.application?.type ?? "Application"}{" "}
                    · Reg No: {selectedItem.application?.scholarId ?? "-"}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#888" }}>
                    DRC votes: {selectedItem.approvalCount} approved / {selectedItem.rejectionCount} rejected
                  </p>
                </div>

                {/* Member votes */}
                <div style={{ marginBottom: "20px" }}>
                  <h5 style={{
                    margin: "0 0 10px", fontSize: "13px", fontWeight: 700,
                    textTransform: "uppercase", color: "#444", letterSpacing: "0.05em",
                  }}>DRC Member Votes</h5>
                  <VotesSection
                    memberSummary={(selectedItem.memberSummary as unknown as MemberVote[]) ?? []}
                  />
                </div>

                <hr style={{ border: "none", borderTop: "1px solid #e6e6e6", margin: "0 0 18px" }} />

                {/* Chairman decision */}
                <div style={{ marginBottom: "20px" }}>
                  <h5 style={{
                    margin: "0 0 10px", fontSize: "13px", fontWeight: 700,
                    textTransform: "uppercase", color: "#444", letterSpacing: "0.05em",
                  }}>Chairman's Decision</h5>
                  <ChairmanDecisionSection
                    item={selectedItem}
                    remarksByApp={remarksByApp}
                    onRemarksChange={(appId, val) =>
                      setRemarksByApp((prev) => ({ ...prev, [appId]: val }))
                    }
                    onSubmit={submitDecision}
                    isPending={decisionMutation.isPending}
                  />
                </div>

                <hr style={{ border: "none", borderTop: "1px solid #e6e6e6", margin: "0 0 18px" }} />

                {/* Application form */}
                <div>
                  <h5 style={{
                    margin: "0 0 6px", fontSize: "13px", fontWeight: 700,
                    textTransform: "uppercase", color: "#444", letterSpacing: "0.05em",
                  }}>Application Form</h5>
                  <ApplicationFormSection application={selectedItem.application as Application | null} />
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, padding: "40px", textAlign: "center", color: "#888" }}>
                Select an application from the list.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function ChairmanMinutes() {
  const [openMeetingId, setOpenMeetingId] = useState<number | null>(null);

  const { data: meetings = [], isLoading } = useChairmanMinutesMeetings(true);

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ color: "#0b6a55", marginBottom: "4px" }}>DRC Meeting Minutes</h2>
      <p style={{ color: "#666", fontSize: "13px", marginBottom: "20px" }}>
        Click a meeting to review member votes, make chairman decisions, and download the minutes PDF.
      </p>

      <div style={{
        background: "#fff", borderRadius: "10px",
        border: "1px solid #e6e6e6", overflow: "hidden",
      }}>
        {isLoading ? (
          <div style={{ padding: "30px", color: "#666", textAlign: "center" }}>Loading meetings…</div>
        ) : meetings.length === 0 ? (
          <div style={{ padding: "30px", color: "#666", textAlign: "center" }}>
            No minutes available yet. They are generated automatically when a meeting is closed.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#f3f4f6", borderBottom: "2px solid #e6e6e6" }}>
                <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 700, color: "#333" }}>Meeting</th>
                <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 700, color: "#333" }}>Date</th>
                <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 700, color: "#333" }}>Generated</th>
                <th style={{ padding: "10px 16px", textAlign: "center", fontWeight: 700, color: "#333" }}>Status</th>
                <th style={{ padding: "10px 16px", textAlign: "center", fontWeight: 700, color: "#333" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {meetings.map((entry, idx) => {
                const isAlt = idx % 2 === 1;
                return (
                  <tr
                    key={entry.meeting.id}
                    style={{ background: isAlt ? "#fafafa" : "#fff", borderBottom: "1px solid #e6e6e6" }}
                  >
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "#0b6a55" }}>
                      Meeting #{entry.meeting.id}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#444" }}>
                      {formatDate(entry.meeting.meetingDate)}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#666" }}>
                      {formatDate(entry.minutes.minutesGeneratedAt)}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      {/* We can't know pending count without loading details;
                          show "Closed" badge which is always true for meetings with minutes */}
                      <span style={{
                        padding: "3px 10px", borderRadius: "12px", fontSize: "11px",
                        fontWeight: 600, background: "#cce5ff", color: "#004085",
                      }}>Closed</span>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      <button
                        type="button"
                        className="submit-btn"
                        style={{ background: "#0b6a55", fontSize: "12px", padding: "6px 14px" }}
                        onClick={() => setOpenMeetingId(entry.meeting.id)}
                        data-testid={`button-view-minutes-${entry.meeting.id}`}
                      >
                        View Minutes
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {openMeetingId !== null && (
        <MeetingMinutesModal
          meetingId={openMeetingId}
          onClose={() => setOpenMeetingId(null)}
        />
      )}
    </div>
  );
}
