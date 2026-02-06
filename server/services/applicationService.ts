import { storage } from "../storage";
import type { InsertApplication } from "@shared/schema";
import { extensionEligibilityService } from "./extensionEligibilityService";
import { applicationDocumentService } from "./applicationDocumentService";

export class ApplicationService {
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
          const scholar = await storage.getScholarByScholarId(scholarId);
          numericScholarId = scholar?.id;
        }
      } else {
        numericScholarId = scholarId;
      }
    }
    
    return storage.getApplications(numericScholarId);
  }

  async getApplicationById(id: number) {
    const app = await storage.getApplicationById(id);
    if (!app) {
      throw new Error("Application not found");
    }
    return app;
  }

  async getApplicationsByStage(stage: string) {
    return storage.getApplicationsByStage(stage);
  }

  async getApplicationsForSupervisor(employeeId: string) {
    return storage.getApplicationsForSupervisor(employeeId);
  }

  async createApplication(
    scholarId: number,
    type: string,
    details: unknown,
  ) {
    const application = await storage.createApplication({
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
    const scholar = await storage.getScholarById(scholarId);
    if (!scholar?.scholarId) {
      throw new Error("Scholar not found");
    }

    // Check eligibility using scholar ID string
    const eligibility = await extensionEligibilityService.checkExtensionEligibility(
      scholar.scholarId,
    );

    if (!eligibility.isEligible) {
      throw new Error(`Extension not eligible: ${eligibility.issues.join("; ")}`);
    }

    // Create application
    const application = await storage.createApplication({
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
      requiredDocuments: await extensionEligibilityService.getRequiredDocumentsForExtension(
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
      throw new Error("Application is not an extension application");
    }
    // For now we do not require document uploads during submission
    // (document storage/fetching will be implemented later).
    // Re-check eligibility to ensure scholar still meets criteria.
    try {
      const scholar = await storage.getScholarById(app.scholarId);
      if (!scholar?.scholarId) {
        throw new Error("Scholar not found");
      }
      const eligibility = await extensionEligibilityService.checkExtensionEligibility(scholar.scholarId);
      if (!eligibility.isEligible) {
        return { valid: false, errors: [`Scholar no longer eligible: ${eligibility.issues.join('; ')}`], warnings: [] };
      }
    } catch (err) {
      return { valid: false, errors: ["Failed to validate eligibility before submission"], warnings: [] };
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
      throw new Error(`Extension cannot be submitted: ${validation.errors.join("; ")}`);
    }

    const app = await storage.updateApplication(applicationId, {
      status: "Pending",
      currentStage: "supervisor",
    });

    // Create reviewer checklist entry
    const docChecklist = await applicationDocumentService.getDocumentChecklistStatus(
      applicationId,
      "Extension",
    );

    // Initialize reviewer checklist for supervisor stage
    // This will be updated as each reviewer reviews

    return app;
  }

  async updateApplication(
    id: number,
    updates: Partial<InsertApplication>,
  ) {
    const updated = await storage.updateApplication(id, updates);
    return updated;
  }
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export const applicationService = new ApplicationService();
