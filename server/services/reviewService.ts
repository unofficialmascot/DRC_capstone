import type { IStorage } from "../storage";
import {
  evaluateWorkflowDecision,
  getWorkflowDefinition,
  type WorkflowStage,
} from "../workflow";
import { AppError } from "../errors";

export interface ReviewInput {
  reviewerId: number;
  decision: "approved" | "rejected";
  remarks: string;
}

export class ReviewService {
  constructor(private readonly storage: IStorage) {}

  async getReviewsForApplication(applicationId: number) {
    return this.storage.getReviewsForApplication(applicationId);
  }

  async submitReview(applicationId: number, input: ReviewInput) {
    // Validate application exists
    const application = await this.storage.getApplicationById(applicationId);
    if (!application) {
      throw new AppError("Application not found", 404);
    }

    if (application.status !== "Pending") {
      throw new AppError("Application is no longer pending", 409);
    }

    // Validate reviewer exists
    const reviewer = await this.storage.getEmployeeByUserId(input.reviewerId);
    if (!reviewer) {
      throw new AppError("Reviewer not found", 404);
    }

    // Validate remarks
    if (!input.remarks || input.remarks.trim().length === 0) {
      throw new AppError("Remarks are required", 400);
    }

    // Check authorization for current stage
    await this.validateReviewerAuthorization(
      input.reviewerId,
      application.currentStage as WorkflowStage,
      application.userId,
    );

    // Create review record
    const review = await this.storage.createReview({
      applicationId,
      reviewerId: reviewer.userId,
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
    const updatedApp = await this.storage.updateApplication(applicationId, {
      currentStage: workflowResult.nextStage,
      status: workflowResult.status,
      finalOutcome: workflowResult.finalOutcome,
    });

    return { review, application: updatedApp };
  }

  private async validateReviewerAuthorization(
    reviewerId: number,
    stage: WorkflowStage,
    userId: string | number,
  ) {
    // Special validation for supervisor stage
    if (stage === "supervisor") {
      const isAssigned = await this.storage.isSupervisorForScholar(
        reviewerId,
        String(userId),
      );
      if (!isAssigned) {
        throw new AppError("Supervisor not assigned to this scholar", 403);
      }
    }

    // TODO: Implement proper role-based authorization for other stages
    // when the schema is updated with proper employee roles
  }

  private async applyApprovedChanges(application: {
    userId: number;
    type: string;
    details: unknown;
  }) {
    const details = application.details as Record<string, unknown>;
    const scholarUserId = application.userId;

    if (application.type === "Supervisor Change") {
      const supervisorUserId = await this.resolveSupervisorUserId(details);
      await this.storage.updateScholarSupervisorAssignment(
        scholarUserId,
        supervisorUserId,
      );
    }

    if (
      application.type === "Extension" &&
      (details?.extensionDuration ||
        details?.extensionPeriod ||
        details?.phase)
    ) {
      const extensionDuration =
        (details.extensionDuration as string | undefined) ??
        (details.extensionPeriod as string | undefined);
      const explicitPhase = details.phase as string | undefined;
      const scholar = await this.storage.getScholarById(scholarUserId);
      const basePhase = scholar?.phase?.toString();
      const updatedPhase =
        explicitPhase ??
        (extensionDuration
          ? basePhase
            ? `${basePhase} (Extension ${extensionDuration})`
            : `Extension ${extensionDuration}`
          : basePhase);

      if (updatedPhase && updatedPhase !== basePhase) {
        await this.storage.updateScholarPhase(scholarUserId, updatedPhase);
      }
    }
  }

  private async resolveSupervisorUserId(
    details: Record<string, unknown>,
  ): Promise<number> {
    const explicitSupervisorId =
      (details.proposedSupervisorId as number | string | undefined) ??
      (details.proposedSupervisorUserId as number | string | undefined);

    if (explicitSupervisorId !== undefined) {
      const numericId =
        typeof explicitSupervisorId === "string"
          ? Number.parseInt(explicitSupervisorId, 10)
          : explicitSupervisorId;
      if (!Number.isNaN(numericId)) {
        return numericId;
      }
    }

    const proposedSupervisorEmployeeId = details
      .proposedSupervisorEmployeeId as string | undefined;
    if (proposedSupervisorEmployeeId) {
      const employee = await this.storage.getEmployee(
        proposedSupervisorEmployeeId,
      );
      if (employee) {
        return employee.userId;
      }
    }

    const proposedSupervisorName = details.proposedSupervisor as
      | string
      | undefined;
    if (proposedSupervisorName) {
      const user = await this.storage.getUserByName(proposedSupervisorName);
      if (user) {
        return user.id;
      }
    }

    throw new AppError(
      "Unable to resolve proposed supervisor for approved change",
      400,
    );
  }
}
