import test from "node:test";
import assert from "node:assert/strict";
import { renderSignaturesSection } from "./drc-agenda-pdf-service";

class FakePdf {
  public lines: string[] = [];
  moveDown(): this { return this; }
  fontSize(): this { return this; }
  text(value: string): this { this.lines.push(value); return this; }
}

test("renderSignaturesSection renders signed and pending entries", () => {
  const doc = new FakePdf();

  renderSignaturesSection(doc as unknown as PDFKit.PDFDocument, [
    {
      signerId: "EMP-1",
      signerName: "Dr. Convener",
      signerRole: "DRC Convener",
      label: "Agenda Prepared By",
      signedAt: new Date("2026-03-29T09:30:00.000Z"),
      assetPath: null,
      metadata: null,
      isPending: false,
    },
    {
      signerId: "pending:chair",
      signerName: "Pending signature",
      signerRole: "DRC Chairman",
      label: "Agenda Approved By",
      signedAt: null,
      assetPath: null,
      metadata: null,
      isPending: true,
    },
  ]);

  assert.equal(doc.lines.some((line) => line.includes("Agenda Prepared By")), true);
  assert.equal(doc.lines.some((line) => line.includes("Pending signature")), true);
});
