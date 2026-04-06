import type { Express } from "express";
import { api } from "../../shared/routes.js";
import { APP_SETTINGS } from "../../shared/app-settings.js";
import { storage } from "../storage";
import { buildApplicationEnclosureSnapshot } from "../services/application-enclosure-service";
import {
  evaluateScholarApplicationEligibility,
  getEligibilityForApplicationType,
} from "../services/application-eligibility-service";
import { badRequest, forbidden, handleRouteError, notFound, parseIdParam, unauthorized } from "./http";

export function registerApplicationRoutes(app: Express): void {
  app.get(api.applications.list.path, async (req, res) => {
    try {
      if (req.session.userId) {
        const sessionUser = await storage.getUserWithScholar(req.session.userId);
        if (sessionUser?.role === "supervisor" && sessionUser.employeeId) {
          const apps = await storage.getApplicationsBySupervision(sessionUser.employeeId);
          return res.json(apps);
        }
      }

      const scholarId = req.query.scholarId ? String(req.query.scholarId) : undefined;
      const apps = await storage.getApplications(scholarId);
      res.json(apps);
    } catch (error) {
      return handleRouteError(res, error);
    }
  });

  app.get(api.applications.getByStage.path, async (req, res) => {
    try {
      const stage = Array.isArray(req.params.stage) ? req.params.stage[0] : req.params.stage;

      if (stage === "supervisor") {
        if (!req.session.userId) {
          throw unauthorized("Not authenticated");
        }

        const user = await storage.getUser(req.session.userId);
        if (!user) {
          throw notFound("User not found");
        }

        if (user.role === "supervisor") {
          return res.json([]);
        }
      }

      const apps = await storage.getApplicationsByStage(stage);
      res.json(apps);
    } catch (error) {
      return handleRouteError(res, error);
    }
  });

  app.get(api.applications.eligibility.path, async (req, res) => {
    try {
      if (!req.session.userId) {
        throw unauthorized("Not authenticated");
      }

      const sessionUser = await storage.getUserWithScholar(req.session.userId);
      if (!sessionUser) {
        throw notFound("User not found");
      }

      if (sessionUser.role !== "scholar") {
        throw forbidden("Only scholars can view application eligibility");
      }

      if (!sessionUser.scholarId) {
        throw badRequest("Scholar profile not found for current user");
      }

      const eligibility = await evaluateScholarApplicationEligibility({
        scholarId: sessionUser.scholarId,
        mode: APP_SETTINGS.applicationEligibilityMode,
      });

      return res.json(eligibility);
    } catch (error) {
      return handleRouteError(res, error);
    }
  });

  app.get(api.applications.get.path, async (req, res) => {
    try {
      const applicationId = parseIdParam(req.params.id, "application id");
      const appById = await storage.getApplicationById(applicationId);
      if (!appById) {
        throw notFound("Application not found");
      }
      res.json(appById);
    } catch (error) {
      return handleRouteError(res, error);
    }
  });

  app.post(api.applications.create.path, async (req, res) => {
    try {
      const input = api.applications.create.input.parse(req.body);
      const { attachmentDocumentIds = [], ...applicationInput } = input;

      const eligibility = await evaluateScholarApplicationEligibility({
        scholarId: applicationInput.scholarId,
        mode: APP_SETTINGS.applicationEligibilityMode,
      });
      const selectedEligibility = getEligibilityForApplicationType(eligibility, applicationInput.type);

      if (selectedEligibility && !selectedEligibility.eligible && eligibility.mode === "enforced") {
        throw badRequest(
          `You are not eligible to submit ${applicationInput.type} at this time`,
          selectedEligibility.reasons,
        );
      }

      if (APP_SETTINGS.applicationSubmissionMode === "none") {
        throw badRequest("Application submissions are currently disabled by settings");
      }

      if (APP_SETTINGS.applicationSubmissionMode === "single-active-per-type") {
        const scholarApplications = await storage.getApplications(applicationInput.scholarId);
        const hasActiveSameType = scholarApplications.some(
          (application) =>
            application.type === applicationInput.type &&
            application.status !== "Approved" &&
            application.status !== "Rejected",
        );

        if (hasActiveSameType) {
          throw badRequest(
            `An active ${applicationInput.type} application already exists for this scholar`,
          );
        }
      }

      const selectedDocuments = attachmentDocumentIds.length > 0
        ? await storage.getDocumentsByIds(attachmentDocumentIds)
        : [];

      if (selectedDocuments.length !== attachmentDocumentIds.length) {
        throw badRequest("One or more selected documents could not be found");
      }

      const hasForeignDocument = selectedDocuments.some(
        (document) => document.scholarId !== applicationInput.scholarId,
      );
      if (hasForeignDocument) {
        throw forbidden("You can only attach documents from your own Doc Hub");
      }

      const scholarDocuments = attachmentDocumentIds.length > 0
        ? selectedDocuments
        : await storage.getDocuments(applicationInput.scholarId);

      const enclosureSnapshot = buildApplicationEnclosureSnapshot(applicationInput.type, scholarDocuments);
      const baseDetails =
        applicationInput.details && typeof applicationInput.details === "object" && !Array.isArray(applicationInput.details)
          ? applicationInput.details
          : {};

      const newApp = await storage.createApplication({
        ...applicationInput,
        details: enclosureSnapshot
          ? {
              ...baseDetails,
              enclosures: enclosureSnapshot,
            }
          : baseDetails,
        currentStage: "supervisor",
        status: "Pending",
      });

      if (selectedDocuments.length > 0) {
        await storage.attachDocumentsToApplication(
          newApp.id,
          selectedDocuments.map((document) => ({
            documentId: document.id,
            attachedBy: "scholar",
            requirementCode: null,
          })),
        );
      }

      res.status(201).json(newApp);
    } catch (error) {
      return handleRouteError(res, error, "Invalid input");
    }
  });

  app.delete(api.applications.delete.path, async (req, res) => {
    try {
      if (!req.session.userId) {
        throw unauthorized("Not authenticated");
      }

      const sessionUser = await storage.getUserWithScholar(req.session.userId);
      if (!sessionUser) {
        throw notFound("User not found");
      }

      if (sessionUser.role !== "scholar") {
        throw forbidden("Only scholars can delete applications");
      }

      if (!sessionUser.scholarId) {
        throw forbidden("Scholar profile not found for current user");
      }

      const rawApplicationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const applicationId = parseIdParam(rawApplicationId, "application id");
      const application = await storage.getApplicationById(applicationId);
      if (!application) {
        throw notFound("Application not found");
      }

      if (application.scholarId !== sessionUser.scholarId) {
        throw forbidden("You can only delete your own applications");
      }

      if (application.status !== "Pending" && application.status !== "Awaiting") {
        throw badRequest("Only awaiting applications can be deleted");
      }

      await storage.deleteApplication(applicationId);
      return res.json({ message: "Application deleted successfully" });
    } catch (error) {
      return handleRouteError(res, error);
    }
  });

}
