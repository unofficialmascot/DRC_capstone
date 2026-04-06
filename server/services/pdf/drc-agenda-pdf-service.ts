import PDFDocument from "pdfkit";
import { readFile } from "node:fs/promises";
import path from "node:path";

interface AgendaApplication {
  id: number;
  type: string;
  scholarId: string;
  scholar?: {
    name?: string;
  };
}

interface AgendaPoint {
  point: string;
  createdAt?: string; // ISO timestamp (optional, for consolidated format)
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
}

interface AgendaSignatureInfo {
  convenerName?: string;
  convenerSignatureImageUrl?: string | null;
}

export async function buildDrcAgendaPdf(
  agenda: MeetingAgendaPayload,
  signatureInfo?: AgendaSignatureInfo,
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

    doc.moveDown(2);

    const lineY = doc.y;
    doc
      .moveTo(360, lineY + 36)
      .lineTo(540, lineY + 36)
      .strokeColor("#333")
      .stroke();

    loadSignatureImage(signatureInfo?.convenerSignatureImageUrl)
      .then((imageBuffer) => {
        if (imageBuffer) {
          doc.image(imageBuffer, 365, lineY + 2, {
            fit: [170, 30],
          });
        }
      })
      .catch(() => {
        // Ignore image load issues and keep plain signature line fallback.
      })
      .finally(() => {
        doc
          .fontSize(10)
          .fillColor("#222")
          .text(`Signature of DRC Convener${signatureInfo?.convenerName ? ` (${signatureInfo.convenerName})` : ""}`, 360, lineY + 42, {
            width: 180,
            align: "center",
          });

        doc.end();
      });
  });
}

async function loadSignatureImage(signatureUrl?: string | null): Promise<Buffer | null> {
  if (!signatureUrl || !signatureUrl.trim()) {
    return null;
  }

  const source = signatureUrl.trim();

  if (source.startsWith("http://") || source.startsWith("https://")) {
    const response = await fetch(source);
    if (!response.ok) {
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  const normalized = source.startsWith("/") ? source.slice(1) : source;
  const relative = normalized.startsWith("uploads/") ? normalized : `uploads/${normalized}`;
  const absolute = path.resolve(process.cwd(), relative);

  try {
    return await readFile(absolute);
  } catch {
    return null;
  }
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
