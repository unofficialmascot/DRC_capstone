import test from "node:test";
import assert from "node:assert/strict";
import type { Application, Document } from "@shared/schema";

process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgres://test:test@127.0.0.1:5432/testdb";

function makeApplication(partial: Partial<Application>): Application {
  return {
    id: 1,
    scholarId: "GITAM-SCH-2020-118",
    type: "Pre-Talk",
    status: "Pending",
    currentStage: "supervisor",
    submissionDate: new Date(),
    details: {},
    finalOutcome: null,
    ...partial,
  };
}

function makeDocument(partial: Partial<Document>): Document {
  return {
    id: 1,
    scholarId: "GITAM-SCH-2020-118",
    documentType: "progress_report",
    category: "research",
    fileName: "report.pdf",
    filePath: "uploads/report.pdf",
    fileSize: 1200,
    mimeType: "application/pdf",
    uploadedAt: new Date(),
    isVerified: true,
    verifiedBy: "EMP-SUP-001",
    verifiedAt: new Date(),
    ...partial,
  };
}

test("eligibility engine loads scholar data once and reports advisory reasons without blocking", async () => {
  const { evaluateScholarApplicationEligibility } = await import("./application-eligibility-service");
  let loadCount = 0;

  const result = await evaluateScholarApplicationEligibility({
    scholarId: "GITAM-SCH-2020-118",
    mode: "advisory",
    dataLoader: async () => {
      loadCount += 1;

      return {
        profile: {
          lifecycleStatus: "Active",
        },
        progress: {
          completedReviews: 0,
          pendingReports: 1,
          publications: 0,
        },
        documents: [],
        priorApplications: [makeApplication({ type: "Pre-Talk", status: "Pending" })],
      };
    },
  });

  assert.equal(loadCount, 1);
  assert.equal(result.mode, "advisory");

  const preTalk = result.items.find((item) => item.applicationType === "Pre-Talk");
  assert.ok(preTalk);
  assert.equal(preTalk.eligible, true);
  assert.ok(preTalk.reasons.length >= 1);
});

test("eligibility engine enforces blocking rules when mode is enforced", async () => {
  const { evaluateScholarApplicationEligibility } = await import("./application-eligibility-service");
  const result = await evaluateScholarApplicationEligibility({
    scholarId: "GITAM-SCH-2020-118",
    mode: "enforced",
    dataLoader: async () => ({
      profile: {
        lifecycleStatus: "Active",
      },
      progress: {
        completedReviews: 2,
        pendingReports: 0,
        publications: 3,
      },
      documents: [makeDocument({ documentType: "progress_report", isVerified: false })],
      priorApplications: [],
    }),
  });

  const extension = result.items.find((item) => item.applicationType === "Extension");
  assert.ok(extension);
  assert.equal(extension.eligible, false);
  assert.ok(extension.reasons.some((reason) => reason.code === "MISSING_VERIFIED_DOCUMENTS"));
});
