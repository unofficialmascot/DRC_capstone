import { storage } from "../storage";
import {
  evaluateWorkflowDecision,
  getWorkflowDefinition,
  type WorkflowStage,
} from "../workflow";
import { badRequest, forbidden, notFound } from "../routes/http";
import { emitRoleNotification } from "./notification-service";

export interface SubmitReviewInput {
  reviewerId: string;
  decision: "approved" | "rejected";
  remarks: string;
}

export async function submitApplicationReview(
  applicationId: number,
  input: SubmitReviewInput,
) {
  const application = await storage.getApplicationById(applicationId);
  if (!application) {
    throw notFound("Application not found");
  }

  if (application.status !== "Pending") {
    throw badRequest("Application is no longer pending");
  }

  const reviewer = await storage.getEmployee(input.reviewerId);
  if (!reviewer) {
    throw notFound("Reviewer not found");
  }

  let reviewerProfile: {
    name?: string | null;
    role?: string | null;
    avatarUrl?: string | null;
  } = {};

  const profileGetter = (storage as unknown as { getUserByEmployeeId?: unknown }).getUserByEmployeeId;
  if (typeof profileGetter === "function") {
    try {
      const userRecord = await storage.getUserByEmployeeId(input.reviewerId);
      if (userRecord) {
        reviewerProfile = {
          name: userRecord.name,
          role: userRecord.role,
          avatarUrl: userRecord.avatarUrl,
        };
      }
    } catch {
      reviewerProfile = {};
    }
  }

  const workflow = getWorkflowDefinition(application.type);
  const currentStage = application.currentStage as WorkflowStage;
  if (!workflow.stages.includes(currentStage)) {
    throw badRequest("Invalid workflow stage");
  }

  if (currentStage === "supervisor") {
    const isAssigned = await storage.isSupervisorForScholar(
      input.reviewerId,
      application.scholarId,
    );
    if (!isAssigned) {
      throw forbidden("Supervisor not assigned to this scholar");
    }
  }

  const review = await storage.createReview({
    applicationId,
    reviewerId: input.reviewerId,
    stage: application.currentStage,
    decision: input.decision,
    remarks: input.remarks,
  });

  try {
    await recordApprovalSignature(applicationId, application.details, {
      stage: application.currentStage,
      reviewerId: input.reviewerId,
      reviewerName: reviewerProfile.name ?? input.reviewerId,
      reviewerRole: reviewerProfile.role ?? application.currentStage,
      signatureImageUrl: reviewerProfile.avatarUrl ?? null,
      signedAt: review.reviewDate,
    });
  } catch {
    // Signature capture is best-effort. Approval workflow must continue even when
    // a profile image/signature cannot be resolved or persisted.
  }

  if (currentStage === "drc") {
    return { review, application };
  }

  const workflowResult = evaluateWorkflowDecision(workflow, {
    currentStage,
    decision: input.decision,
  });

  if (workflowResult.isTerminal && workflowResult.finalOutcome === "Approved") {
    await applyApprovedChanges(application);
  }

  const updatedApp = await storage.updateApplication(applicationId, {
    currentStage: workflowResult.nextStage,
    status: workflowResult.status,
    finalOutcome: workflowResult.finalOutcome,
  });

  await emitReviewNotifications({
    application,
    reviewerId: input.reviewerId,
    decision: input.decision,
    currentStage,
    nextStage: workflowResult.nextStage,
    finalOutcome: workflowResult.finalOutcome,
  });

  return { review, application: updatedApp };
}

async function recordApprovalSignature(
  applicationId: number,
  details: unknown,
  input: {
    stage: string;
    reviewerId: string;
    reviewerName?: string | null;
    reviewerRole?: string | null;
    signatureImageUrl?: string | null;
    signedAt?: Date | string | null;
  },
) {
  const baseDetails = details && typeof details === "object" && !Array.isArray(details)
    ? (details as Record<string, unknown>)
    : {};

  const existingSignatures = Array.isArray(baseDetails.approvalSignatures)
    ? (baseDetails.approvalSignatures as Array<Record<string, unknown>>)
    : [];

  const filtered = existingSignatures.filter((entry) => {
    if (!entry || typeof entry !== "object") {
      return false;
    }

    return !(
      String(entry.stage ?? "") === input.stage &&
      String(entry.reviewerId ?? "") === input.reviewerId
    );
  });

  const stageLabel = input.stage === "supervisor"
    ? "Research Supervisor"
    : input.stage === "drc"
    ? "DRC Reviewer"
    : input.stage === "irc"
    ? "IRC Reviewer"
    : input.stage === "doaa"
    ? "DoAA Reviewer"
    : `${input.stage.toUpperCase()} Reviewer`;

  filtered.push({
    stage: input.stage,
    reviewerId: input.reviewerId,
    label: stageLabel,
    signerName: input.reviewerName ?? input.reviewerId,
    signerRole: input.reviewerRole ?? "Reviewer",
    signatureImageUrl: input.signatureImageUrl ?? null,
    signedAt: input.signedAt ?? new Date().toISOString(),
  });

  await storage.updateApplication(applicationId, {
    details: {
      ...baseDetails,
      approvalSignatures: filtered,
    },
  });
}

async function emitReviewNotifications(input: {
  application: { id: number; scholarId: string; type: string };
  reviewerId: string;
  decision: "approved" | "rejected";
  currentStage: WorkflowStage;
  nextStage: string | null;
  finalOutcome: string | null;
}) {
  const stageLabel = input.currentStage.toUpperCase();

  await emitRoleNotification({
    title: `${input.application.type} ${input.decision === "approved" ? "approved" : "rejected"}`,
    content: `Application #${input.application.id} for scholar ${input.application.scholarId} was ${input.decision} at ${stageLabel} by ${input.reviewerId}.`,
    targetRoles: ["scholar"],
    notificationType: "review_decision",
    relatedApplicationId: input.application.id,
  });

  if (input.finalOutcome) {
    return;
  }

  const nextRoles = getReviewerRolesForStage(input.nextStage);
  if (nextRoles.length === 0) {
    return;
  }

  await emitRoleNotification({
    title: `Review Pending: ${input.application.type}`,
    content: `Application #${input.application.id} is awaiting ${input.nextStage?.toUpperCase()} review for scholar ${input.application.scholarId}.`,
    targetRoles: nextRoles,
    notificationType: "review_pending",
    relatedApplicationId: input.application.id,
  });
}

function getReviewerRolesForStage(stage: string | null): string[] {
  if (!stage) {
    return [];
  }

  if (stage === "supervisor") {
    return ["supervisor"];
  }

  if (stage === "drc") {
    return ["drc", "drc_convener", "drc_chairman"];
  }

  if (stage === "irc") {
    return ["irc"];
  }

  if (stage === "doaa") {
    return ["doaa"];
  }

  return [];
}

export async function applyApprovedChanges(application: {
  id: number;
  scholarId: string;
  type: string;
  details: unknown;
}) {
  const details = application.details as Record<string, unknown>;

  if (application.type === "Supervisor Change") {
    await applySupervisorChangeApproval(application, details);
  }

  if (application.type === "Extension") {
    await applyExtensionApproval(application, details);
  }

  if (application.type === "Re-Registration") {
    await applyReRegistrationApproval(application);
  }

  if (application.type === "Deregistration") {
    await applyDeregistrationApproval(application);
  }

  if (application.type === "Termination") {
    await applyTerminationApproval(application);
  }

  if (application.type === "Thesis Submission") {
    await applyThesisSubmissionApproval(application, details);
  }
}

async function applySupervisorChangeApproval(
  application: { id: number; scholarId: string },
  details: Record<string, unknown>,
) {
  const proposedSupervisorId =
    getStringValue(details.proposedSupervisorEmployeeId) ||
    getStringValue(details.proposedSupervisorId);

  if (!proposedSupervisorId) {
    throw badRequest("Approved supervisor change is missing proposed supervisor employee ID");
  }

  const proposedSupervisor = await storage.getUserByEmployeeId(proposedSupervisorId);
  if (!proposedSupervisor) {
    throw badRequest("Proposed supervisor is invalid");
  }

  const isSupervisor = await storage.userHasAnyRole(
    proposedSupervisor.id,
    ["supervisor"],
    proposedSupervisor.role,
  );

  if (!isSupervisor) {
    throw badRequest("Proposed supervisor is invalid");
  }

  const scholar = await storage.getUserByScholarId(application.scholarId);
  if (!scholar) {
    throw notFound("Scholar not found for approved supervisor change");
  }

  const previousSupervisorId = scholar.supervisorId ?? null;
  await storage.updateScholarProfile(application.scholarId, {
    supervisorId: proposedSupervisorId,
  });

  await storage.createSupervisorChangeHistory({
    scholarId: application.scholarId,
    applicationId: application.id,
    previousSupervisorId,
    newSupervisorId: proposedSupervisorId,
  });
}

async function applyExtensionApproval(
  application: { scholarId: string },
  details: Record<string, unknown>,
) {
  const extensionMonths = extractExtensionMonths(details.extensionDuration);
  if (!extensionMonths || extensionMonths < 1) {
    throw badRequest("Approved extension is missing a valid extension duration");
  }

  const scholar = await storage.getUserByScholarId(application.scholarId);
  if (!scholar) {
    throw notFound("Scholar not found for approved extension");
  }

  const existingMonths = Number(scholar.extensionMonthsGranted ?? 0);
  await storage.updateScholarProfile(application.scholarId, {
    extensionMonthsGranted: existingMonths + extensionMonths,
    lastExtensionApprovedAt: new Date(),
  });
}

async function applyThesisSubmissionApproval(
  application: { scholarId: string },
  details: Record<string, unknown>,
) {
  const scholar = await storage.getUserByScholarId(application.scholarId);
  if (!scholar) {
    throw notFound("Scholar not found for approved thesis submission");
  }

  const thesisTitle = getStringValue(details.thesisTitle);
  const currentResearchTitle = getStringValue(scholar.researchTitle);

  await storage.updateScholarProfile(application.scholarId, {
    phase: "Thesis Submission",
    status: "Graduated",
    lifecycleStatus: "Awarded",
    ...(thesisTitle ? { researchTitle: thesisTitle } : currentResearchTitle ? { researchTitle: currentResearchTitle } : {}),
  });
}

async function applyReRegistrationApproval(application: { scholarId: string }) {
  const scholar = await storage.getUserByScholarId(application.scholarId);
  if (!scholar) {
    throw notFound("Scholar not found for approved re-registration");
  }

  await storage.updateScholarProfile(application.scholarId, {
    status: "Active",
    lifecycleStatus: "Re-registered",
  });
}

async function applyDeregistrationApproval(application: { scholarId: string }) {
  const scholar = await storage.getUserByScholarId(application.scholarId);
  if (!scholar) {
    throw notFound("Scholar not found for approved deregistration");
  }

  await storage.updateScholarProfile(application.scholarId, {
    status: "Inactive",
    lifecycleStatus: "Deregistered",
  });
}

async function applyTerminationApproval(application: { scholarId: string }) {
  const scholar = await storage.getUserByScholarId(application.scholarId);
  if (!scholar) {
    throw notFound("Scholar not found for approved termination");
  }

  await storage.updateScholarProfile(application.scholarId, {
    status: "Inactive",
    lifecycleStatus: "Terminated",
  });
}

function getStringValue(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function extractExtensionMonths(duration: unknown): number | null {
  if (typeof duration === "number" && Number.isFinite(duration)) {
    return Math.max(0, Math.round(duration));
  }

  if (typeof duration !== "string") {
    return null;
  }

  const match = duration.match(/\d+/);
  if (!match) {
    return null;
  }

  const value = Number(match[0]);
  return Number.isFinite(value) ? value : null;
}
