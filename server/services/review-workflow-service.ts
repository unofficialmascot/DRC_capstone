import { storage } from "../storage";
import {
  evaluateWorkflowDecision,
  getWorkflowDefinition,
  type WorkflowStage,
} from "../workflow";
import { badRequest, forbidden, notFound } from "../routes/http";

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

  return { review, application: updatedApp };
}

async function applyApprovedChanges(application: {
  scholarId: string;
  type: string;
  details: unknown;
}) {
  const details = application.details as Record<string, unknown>;

  if (application.type === "Supervisor Change" && details?.proposedSupervisor) {
    console.log(`Supervisor change approved: ${details.proposedSupervisor}`);
  }

  if (application.type === "Extension" && details?.extensionDuration) {
    console.log(
      `Extension approved for scholar ${application.scholarId}: ${details.extensionDuration}`,
    );
  }
}
