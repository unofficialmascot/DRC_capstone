import { storage } from "../storage";
import {
  evaluateWorkflowDecision,
  getWorkflowDefinition,
  type WorkflowStage,
} from "../workflow";

export interface ReviewInput {
  reviewerId: string;
  decision: "approved" | "rejected";
  remarks: string;
}

export class ReviewService {
  async getReviewsForApplication(applicationId: number) {
    return storage.getReviewsForApplication(applicationId);
  }

  async submitReview(applicationId: number, input: ReviewInput) {
    // Validate application exists
    const application = await storage.getApplicationById(applicationId);
    if (!application) {
      throw new Error("Application not found");
    }

    if (application.status !== "Pending") {
      throw new Error("Application is no longer pending");
    }

    // Validate reviewer exists
    const reviewer = await storage.getEmployee(input.reviewerId);
    if (!reviewer) {
      throw new Error("Reviewer not found");
    }

    // Validate remarks
    if (!input.remarks || input.remarks.trim().length === 0) {
      throw new Error("Remarks are required");
    }

    // Check authorization for current stage
    await this.validateReviewerAuthorization(
      input.reviewerId,
      application.currentStage as WorkflowStage,
      application.userId,
    );

    // Create review record
    const review = await storage.createReview({
      applicationId,
      reviewerId: input.reviewerId,
      stage: application.currentStage,
      decision: input.decision,
      remarks: input.remarks,
    });

    // Evaluate workflow
    const workflow = getWorkflowDefinition(application.type);
    const currentStage = application.currentStage as WorkflowStage;

    const workflowResult = evaluateWorkflowDecision(workflow, {
      currentStage,
      decision: input.decision,
    });

    // Apply approved changes if terminal and approved
    if (
      workflowResult.isTerminal &&
      workflowResult.finalOutcome === "Approved"
    ) {
      await this.applyApprovedChanges(application);
    }

    // Update application with new state
    const updatedApp = await storage.updateApplication(applicationId, {
      currentStage: workflowResult.nextStage,
      status: workflowResult.status,
      finalOutcome: workflowResult.finalOutcome,
    });

    return { review, application: updatedApp };
  }

  private async validateReviewerAuthorization(
    reviewerId: string,
    stage: WorkflowStage,
    userId: string,
  ) {
    // Special validation for supervisor stage
    if (stage === "supervisor") {
      const isAssigned = await storage.isSupervisorForScholar(
        reviewerId,
        userId,
      );
      if (!isAssigned) {
        throw new Error("Supervisor not assigned to this scholar");
      }
    }

    // TODO: Implement proper role-based authorization for other stages
    // when the schema is updated with proper employee roles
  }

  private async applyApprovedChanges(application: {
    userId: string;
    type: string;
    details: unknown;
  }) {
    const details = application.details as Record<string, unknown>;

    if (
      application.type === "Supervisor Change" &&
      details?.proposedSupervisor
    ) {
      console.log(
        `Supervisor change approved: ${details.proposedSupervisor}`,
      );
      // Update supervisor assignments in database
    }

    if (application.type === "Extension" && details?.extensionDuration) {
      console.log(
        `Extension approved for scholar ${application.userId}: ${details.extensionDuration}`,
      );
      // Update phase or other timeline fields
    }
  }
}

export const reviewService = new ReviewService();
