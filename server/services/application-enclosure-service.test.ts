import test from "node:test";
import assert from "node:assert/strict";
import { buildApplicationEnclosureSnapshot } from "./application-enclosure-service";
import type { Document } from "@shared/schema";

function makeDocument(partial: Partial<Document>): Document {
  return {
    id: 1,
    scholarId: "GITAM-SCH-2020-118",
    documentType: "admission_letter",
    category: "research",
    fileName: "sample.pdf",
    filePath: "uploads/sample.pdf",
    fileSize: 1200,
    mimeType: "application/pdf",
    uploadedAt: new Date(),
    isVerified: false,
    verifiedBy: null,
    verifiedAt: null,
    ...partial,
  };
}

test("returns null for application types without enclosure requirements", () => {
  const snapshot = buildApplicationEnclosureSnapshot("Pre-Talk", []);
  assert.equal(snapshot, null);
});

test("builds extension enclosure snapshot with attached and missing statuses", () => {
  const documents: Document[] = [
    makeDocument({ id: 11, documentType: "admission_letter", fileName: "admission.pdf" }),
    makeDocument({ id: 12, documentType: "coursework_marks_memo", fileName: "cw.pdf" }),
    makeDocument({ id: 13, documentType: "progress_report", fileName: "progress.pdf" }),
  ];

  const snapshot = buildApplicationEnclosureSnapshot("Extension", documents);
  assert.ok(snapshot);
  assert.equal(snapshot.source, "dochub");
  assert.equal(snapshot.summary.requiredTotal, 6);
  assert.equal(snapshot.summary.requiredAttached, 3);
  assert.equal(snapshot.summary.requiredMissing, 3);

  const admissionRequirement = snapshot.requirements.find((item) => item.code === "admission_letter");
  assert.ok(admissionRequirement);
  assert.equal(admissionRequirement.status, "attached");
  assert.equal(admissionRequirement.matchedDocuments.length, 1);

  const journalRequirement = snapshot.requirements.find((item) => item.code === "journal_publication_proofs");
  assert.ok(journalRequirement);
  assert.equal(journalRequirement.status, "missing");
});