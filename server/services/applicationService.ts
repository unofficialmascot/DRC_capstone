import type { IStorage } from "../storage";
import type { UpdateApplicationInput } from "../domain/types";
import type { ExtensionEligibilityService } from "./extensionEligibilityService";
import type { ApplicationDocumentService } from "./applicationDocumentService";
import { AppError } from "../errors";

export class ApplicationService {
  constructor(
    private readonly storage: IStorage,
    private readonly extensionEligibilityService: ExtensionEligibilityService,
    private readonly applicationDocumentService: ApplicationDocumentService,
  ) {}

  async getApplications(scholarId?: string | number) {
    let numericScholarId: number | undefined;
    
    if (scholarId) {
      // If it's a string, try to parse as number first, otherwise look up by scholar code
      if (typeof scholarId === "string") {
        const parsed = parseInt(scholarId, 10);
        if (!isNaN(parsed)) {
          numericScholarId = parsed;
        } else {
          // It's a scholar code string, look it up
          const scholar = await this.storage.getScholarByScholarId(scholarId);
          if (!scholar?.id) {
            throw new AppError(`Scholar not found for ID: ${scholarId}`, 404);
          }
          numericScholarId = scholar.id;
        }
      } else {
        numericScholarId = scholarId;
      }
    }
    
    return this.storage.getApplications(numericScholarId);
  }

  async getApplicationById(id: number) {
    const app = await this.storage.getApplicationById(id);
    if (!app) {
      throw new AppError("Application not found", 404);
    }
    return app;
  }

  async getApplicationsByStage(stage: string) {
    return this.storage.getApplicationsByStage(stage);
  }

  async getApplicationsForSupervisor(employeeId: string) {
    return this.storage.getApplicationsForSupervisor(employeeId);
  }

  async createApplication(
    scholarId: number,
    type: string,
    details: unknown,
  ) {
    const application = await this.storage.createApplication({
      scholarId,
      type,
      status: "Pending",
      currentStage: "supervisor",
      details: details as Record<string, unknown>,
    });
    return application;
  }

  /**
   * Create an extension application with eligibility checks
   */
  async createExtensionApplication(
    scholarId: number,
    extensionPeriod: "6_months" | "1_year",
    details?: Record<string, unknown>,
  ) {
    // Get scholar info first to get their scholarId string
    const scholar = await this.storage.getScholarById(scholarId);
    if (!scholar?.scholarId) {
      throw new AppError("Scholar not found", 404);
    }

    // Check eligibility using scholar ID string
    const eligibility = await this.extensionEligibilityService.checkExtensionEligibility(
      scholar.scholarId,
    );

    if (!eligibility.isEligible) {
      throw new AppError(
        `Extension not eligible: ${eligibility.issues.join("; ")}`,
        400,
      );
    }

    // Create application
    const application = await this.storage.createApplication({
      scholarId: scholarId,
      type: "Extension",
      status: "Pending",
      currentStage: "supervisor",
      details: {
        ...details,
        extensionPeriod,
        extensionReason: details?.reason || "",
        eligibilityDetails: eligibility.details,
        appliedOn: new Date().toISOString(),
      },
    });

    return {
      application,
      eligibility,
      requiredDocuments: await this.extensionEligibilityService.getRequiredDocumentsForExtension(
        scholar.scholarId,
      ),
    };
  }

  /**
   * Pre-submission validation for extension
   */
  async validateExtensionBeforeSubmission(applicationId: number): Promise<ValidationResult> {
    const app = await this.getApplicationById(applicationId);

    if (app.type !== "Extension") {
      throw new AppError("Application is not an extension application", 400);
    }
    // For now we do not require document uploads during submission
    // (document storage/fetching will be implemented later).
    // Re-check eligibility to ensure scholar still meets criteria.
    try {
      const resolvedScholarId = app.scholarId ?? Number(app.userId);
      if (Number.isNaN(resolvedScholarId)) {
        throw new AppError("Scholar not found", 404);
      }
      const scholar = await this.storage.getScholarById(resolvedScholarId);
      if (!scholar?.scholarId) {
        throw new AppError("Scholar not found", 404);
      }
      const eligibility = await this.extensionEligibilityService.checkExtensionEligibility(scholar.scholarId);
      if (!eligibility.isEligible) {
        return { valid: false, errors: [`Scholar no longer eligible: ${eligibility.issues.join('; ')}`], warnings: [] };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return {
        valid: false,
        errors: [`Failed to validate eligibility before submission: ${message}`],
        warnings: [],
      };
    }

    // Check current status
    if (app.status !== "Pending" || app.currentStage !== "supervisor") {
      return {
        valid: false,
        errors: ["Application cannot be submitted at current stage"],
        warnings: [],
      };
    }

    return {
      valid: true,
      errors: [],
      warnings: [],
    };
  }

  /**
   * Submit extension application (move to supervisor review)
   */
  async submitExtensionApplication(applicationId: number) {
    const validation = await this.validateExtensionBeforeSubmission(applicationId);

    if (!validation.valid) {
      throw new AppError(
        `Extension cannot be submitted: ${validation.errors.join("; ")}`,
        400,
      );
    }

    const app = await this.storage.updateApplication(applicationId, {
      status: "Pending",
      currentStage: "supervisor",
    });

    // Create reviewer checklist entry
    const docChecklist = await this.applicationDocumentService.getDocumentChecklistStatus(
      applicationId,
      "Extension",
    );

    // Initialize reviewer checklist for supervisor stage
    // This will be updated as each reviewer reviews

    return app;
  }

  async updateApplication(
    id: number,
    updates: UpdateApplicationInput,
  ) {
    const updated = await this.storage.updateApplication(id, updates);
    return updated;
  }
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
