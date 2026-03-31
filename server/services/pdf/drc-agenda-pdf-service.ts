import PDFDocument from "pdfkit";
import type { NormalizedSignature } from "../signature-resolver-service";

interface AgendaApplication {
  id: number;
  type: string;
  scholarId: string;
  scholar?: {
    name?: string;
  };
}

interface AgendaPoint {
  id: number;
  point: string;
}

interface MeetingAgendaPayload {
  meeting: {
    id: number;
    meetingDate: Date | string;
    scheduledBy: string;
    scheduledAt: Date | string | null;
  };
  applications: AgendaApplication[];
  extraPoints: AgendaPoint[];
  signatures?: NormalizedSignature[];
}

export async function buildDrcAgendaPdf(
  agenda: MeetingAgendaPayload,
): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
  });

  const chunks: Buffer[] = [];

  return new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("error", (error) => reject(error));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    const meetingDate = new Date(agenda.meeting.meetingDate);

    doc.fontSize(16).text("GITAM University", { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(14).text("DRC Meeting Agenda", { align: "center" });
    doc.moveDown(1);

    doc.fontSize(11);
    doc.text(`Meeting ID: ${agenda.meeting.id}`);
    doc.text(`Meeting Date: ${formatDateTime(meetingDate)}`);
    doc.text(`Convener: ${agenda.meeting.scheduledBy}`);
    doc.moveDown(1);

    doc.fontSize(12).text("Pending Applications", { underline: true });
    doc.moveDown(0.5);

    if (agenda.applications.length === 0) {
      doc.fontSize(11).text("No pending applications captured for this agenda.");
    } else {
      agenda.applications.forEach((application, index) => {
        const scholarName = application.scholar?.name?.trim() || "Unknown Scholar";
        const registrationNo = application.scholarId;
        doc
          .fontSize(11)
          .text(
            `${index + 1}. Scholar ${scholarName} (${registrationNo}) is applying for ${application.type}.`,
          );
      });
    }

    doc.moveDown(1);
    doc.fontSize(12).text("Extra Agenda Points", { underline: true });
    doc.moveDown(0.5);

    if (agenda.extraPoints.length === 0) {
      doc.fontSize(11).text("No extra agenda points.");
    } else {
      agenda.extraPoints.forEach((point, index) => {
        doc.fontSize(11).text(`${index + 1}. ${point.point}`);
      });
    }

    renderSignaturesSection(doc, agenda.signatures ?? []);

    doc.end();
  });
}

export function renderSignaturesSection(
  doc: PDFKit.PDFDocument,
  signatures: NormalizedSignature[],
): void {
  doc.moveDown(2);
  doc.fontSize(12).text("Signatures", { underline: true });
  doc.moveDown(0.8);

  if (signatures.length === 0) {
    doc.fontSize(11).text("Pending signature");
    return;
  }

  signatures.forEach((signature, index) => {
    const statusLine = signature.signedAt
      ? `${signature.signerName} (${signature.signerRole}) — ${formatDateTime(new Date(signature.signedAt))}`
      : "Pending signature";

    doc
      .fontSize(11)
      .text(`${index + 1}. ${signature.label}: ${statusLine}`);
  });
}

export function buildDrcAgendaPdfFilename(meetingId: number, meetingDate: Date): string {
  const yyyy = meetingDate.getFullYear();
  const mm = `${meetingDate.getMonth() + 1}`.padStart(2, "0");
  const dd = `${meetingDate.getDate()}`.padStart(2, "0");
  return `DRC_Agenda_Meeting-${meetingId}_${yyyy}-${mm}-${dd}.pdf`;
}

function formatDateTime(date: Date): string {
  return date.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}
