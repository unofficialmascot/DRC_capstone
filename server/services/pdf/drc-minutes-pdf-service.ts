import PDFDocument from "pdfkit";

interface MemberVote {
  reviewerId: string;
  reviewerName: string;
  decision: string;
  remarks: string | null;
  reviewDate: string | Date | null;
  isAutoApproved: boolean;
}

interface MinutesApplication {
  applicationId: number;
  approvalCount: number;
  rejectionCount: number;
  memberSummary: MemberVote[];
  application: {
    id: number;
    type: string;
    scholarId: string;
    scholar?: { name?: string | null } | null;
  } | null;
  chairmanDecision: {
    decision: string;
    remarks: string;
    decidedAt: string | Date | null;
    chairmanId: string;
  } | null;
}

interface MeetingMinutesPayload {
  meeting: {
    id: number;
    meetingDate: Date | string;
    scheduledBy: string;
    closedAt: Date | string | null;
  };
  minutes: {
    generatedBy: string;
    generatedAt: Date | string | null;
  };
  items: MinutesApplication[];
  chairmanName?: string;
}

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

function decisionLabel(decision: string, isAutoApproved: boolean): string {
  if (isAutoApproved) return "AUTO-APPROVED";
  return decision.toUpperCase();
}

export async function generateMeetingMinutesPdf(
  payload: MeetingMinutesPayload,
): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const chunks: Buffer[] = [];

  return new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    // ── Header ──────────────────────────────────────────────────────────────
    doc.fontSize(16).font("Helvetica-Bold").text("GITAM University", { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(13).font("Helvetica-Bold").text("DRC Meeting Minutes", { align: "center" });
    doc.moveDown(0.5);
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor("#0b6a55")
      .lineWidth(1.5)
      .stroke();
    doc.moveDown(0.8);

    // ── Meeting Metadata ────────────────────────────────────────────────────
    doc.fontSize(10).font("Helvetica");
    doc.text(`Meeting ID:       ${payload.meeting.id}`);
    doc.text(`Meeting Date:     ${formatDate(payload.meeting.meetingDate)}`);
    doc.text(`Closed:           ${formatDate(payload.meeting.closedAt)}`);
    doc.text(`Convener:         ${payload.meeting.scheduledBy}`);
    doc.text(`Minutes By:       ${payload.minutes.generatedBy}`);
    doc.text(`Generated At:     ${formatDate(payload.minutes.generatedAt)}`);
    if (payload.chairmanName) {
      doc.text(`Chairman:         ${payload.chairmanName}`);
    }
    doc.moveDown(1.2);

    // ── Applications ────────────────────────────────────────────────────────
    if (payload.items.length === 0) {
      doc.fontSize(11).text("No applications were included in this meeting.");
    } else {
      payload.items.forEach((item, idx) => {
        const app = item.application;
        const scholarName =
          (app?.scholar?.name?.trim()) || app?.scholarId || "Unknown Scholar";
        const regNo = app?.scholarId ?? "-";
        const appType = app?.type ?? "Application";

        // Application header
        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .text(`${idx + 1}.  ${appType}`, { continued: false });
        doc.fontSize(10).font("Helvetica");
        doc.text(`    Scholar:     ${scholarName}  (Reg No: ${regNo})`);
        doc.text(
          `    DRC Votes:   ${item.approvalCount} approved / ${item.rejectionCount} rejected`,
        );
        doc.moveDown(0.4);

        // Member votes
        if (item.memberSummary.length > 0) {
          doc.fontSize(9.5).font("Helvetica-Bold").text("    DRC Member Votes:", {
            underline: false,
          });
          doc.font("Helvetica");

          item.memberSummary.forEach((vote) => {
            const label = decisionLabel(vote.decision, vote.isAutoApproved);
            const name = vote.reviewerName || vote.reviewerId;
            const dateStr = formatDate(vote.reviewDate);
            const remarks = vote.remarks?.trim() || "(no remarks)";

            doc.fontSize(9).text(
              `      • ${name} — ${label}  [${dateStr}]`,
            );
            doc.text(`        Remarks: ${remarks}`, { indent: 0 });
          });
        } else {
          doc.fontSize(9).text("    (No member votes recorded)");
        }

        doc.moveDown(0.5);

        // Chairman decision
        doc.fontSize(9.5).font("Helvetica-Bold").text("    Chairman's Decision:");
        doc.font("Helvetica").fontSize(9);
        if (item.chairmanDecision) {
          doc.text(
            `      Verdict: ${item.chairmanDecision.decision.toUpperCase()}  [${formatDate(item.chairmanDecision.decidedAt)}]`,
          );
          doc.text(`      Remarks: ${item.chairmanDecision.remarks}`);
        } else {
          doc.text("      Pending — no chairman decision recorded yet.");
        }

        doc.moveDown(1);

        // Divider between applications
        if (idx < payload.items.length - 1) {
          doc
            .moveTo(50, doc.y)
            .lineTo(545, doc.y)
            .strokeColor("#cccccc")
            .lineWidth(0.5)
            .stroke();
          doc.moveDown(0.5);
        }
      });
    }

    // ── Footer signature line ────────────────────────────────────────────────
    doc.moveDown(2);
    doc
      .moveTo(350, doc.y)
      .lineTo(545, doc.y)
      .strokeColor("#000000")
      .lineWidth(0.8)
      .stroke();
    doc.moveDown(0.3);
    doc.fontSize(9).font("Helvetica").text(
      `Signature of DRC Chairman${payload.chairmanName ? ` (${payload.chairmanName})` : ""}`,
      { align: "right" },
    );

    doc.end();
  });
}

export function buildMeetingMinutesPdfFilename(
  meetingId: number,
  meetingDate: Date | string,
): string {
  const date = new Date(meetingDate);
  const ymd = date.toISOString().slice(0, 10);
  return `drc-minutes-meeting-${meetingId}-${ymd}.pdf`;
}
