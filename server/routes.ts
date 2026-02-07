import type { Express, Response } from "express";
import type { Server } from "http";
import { api } from "../shared/routes.js";
import { z } from "zod";
import { AppError, toErrorResponse } from "./errors";
import {
  applicationDocumentService,
  applicationService,
  authService,
  extensionEligibilityService,
  researchProgressService,
  reviewService,
  scholarService,
  seedService,
  userService,
} from "./services";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  const respondWithError = (
    res: Response,
    error: unknown,
    fallbackStatus = 500,
  ) => {
    const { status, body } = toErrorResponse(error, fallbackStatus);
    return res.status(status).json(body);
  };
  // === AUTH ===
  app.post("/api/auth/login", async (req, res) => {
    try {
      const input = z
        .object({
          scholarId: z.string().optional(),
          employeeId: z.string().optional(),
          password: z.string(),
        })
        .refine((data) => data.scholarId || data.employeeId, {
          message: "Either scholarId or employeeId is required",
        })
        .parse(req.body);

      const user = await authService.login(input);
      req.session.userId = user.id;
      res.json(user);
    } catch (error: unknown) {
      respondWithError(res, error, 401);
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return respondWithError(res, new AppError("Failed to logout", 500), 500);
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      if (!req.session.userId) {
        throw new AppError("Not authenticated", 401);
      }
      const user = await authService.getCurrentUser(req.session.userId);
      res.json(user);
    } catch (error: unknown) {
      respondWithError(res, error, 401);
    }
  });

  // === USERS ===
  app.get(api.users.get.path, async (req, res) => {
    try {
      const user = await userService.getUserById(Number(req.params.id));
      res.json(user);
    } catch (error: unknown) {
      respondWithError(res, error, 404);
    }
  });

  app.get("/api/users", async (req, res) => {
    try {
      const users = await userService.getAllUsers();
      res.json(users);
    } catch (error: unknown) {
      respondWithError(res, error, 500);
    }
  });

  app.put(api.users.update.path, async (req, res) => {
    try {
      const updates = api.users.update.input.parse(req.body);
      const updatedUser = await userService.updateUser(
        Number(req.params.id),
        updates,
      );
      res.json(updatedUser);
    } catch (error: unknown) {
      respondWithError(res, error, 400);
    }
  });

  // === APPLICATIONS ===
  app.get(api.applications.list.path, async (req, res) => {
    try {
      const scholarId = req.query.scholarId
        ? String(req.query.scholarId)
        : undefined;
      const apps = await applicationService.getApplications(scholarId);
      res.json(apps);
    } catch (error: unknown) {
      respondWithError(res, error, 500);
    }
  });

  app.get("/api/applications/stage/:stage", async (req, res) => {
    try {
      const stage = req.params.stage;

      if (stage === "supervisor") {
        if (!req.session.userId) {
          throw new AppError("Not authenticated", 401);
        }

        const user = await userService.getUserById(req.session.userId);
        if (user.role === "supervisor") {
          const employee = await userService.getEmployeeByUserId(user.id);
          if (!employee?.employeeId) {
            throw new AppError(
              "No employee record mapped to this supervisor user.",
              404,
            );
          }

          const apps = await applicationService.getApplicationsForSupervisor(
            employee.employeeId,
          );
          return res.json(apps);
        }
      }

      const apps = await applicationService.getApplicationsByStage(stage);
      res.json(apps);
    } catch (error: unknown) {
      respondWithError(res, error, 500);
    }
  });

  app.get("/api/applications/:id", async (req, res) => {
    try {
      const app = await applicationService.getApplicationById(
        Number(req.params.id),
      );
      res.json(app);
    } catch (error: unknown) {
      respondWithError(res, error, 404);
    }
  });

  app.post(api.applications.create.path, async (req, res) => {
    try {
      const input = api.applications.create.input.parse(req.body);
      const newApp = await applicationService.createApplication(
        input.scholarId,
        input.type,
        input.details,
      );
      res.status(201).json(newApp);
    } catch (error: unknown) {
      respondWithError(res, error, 400);
    }
  });

  // === APPLICATION REVIEWS ===
  app.get("/api/applications/:id/reviews", async (req, res) => {
    try {
      const reviews = await reviewService.getReviewsForApplication(
        Number(req.params.id),
      );
      res.json(reviews);
    } catch (error: unknown) {
      respondWithError(res, error, 500);
    }
  });

  app.post("/api/applications/:id/review", async (req, res) => {
    try {
      const reviewInput = z
        .object({
          reviewerId: z.string(),
          decision: z.enum(["approved", "rejected"]),
          remarks: z.string().min(1, "Remarks are required"),
        })
        .parse(req.body);

      const result = await reviewService.submitReview(
        Number(req.params.id),
        reviewInput,
      );

      res.json(result);
    } catch (error: unknown) {
      respondWithError(res, error, 400);
    }
  });

  // === EXTENSION APPLICATIONS ===

  // Check extension eligibility for a scholar
  app.get("/api/extensions/check-eligibility/:scholarId", async (req, res) => {
    try {
      const scholarIdParam = req.params.scholarId;
      let scholarId = scholarIdParam;

      const parsedId = Number(scholarIdParam);
      if (!Number.isNaN(parsedId)) {
        const scholar = await scholarService.getScholarById(parsedId);
        if (!scholar?.scholarId) {
          return res.status(404).json({ message: "Scholar not found" });
        }
        scholarId = scholar.scholarId;
      }

      const eligibility = await extensionEligibilityService.checkExtensionEligibility(
        scholarId,
      );
      const requiredDocs = await extensionEligibilityService.getRequiredDocumentsForExtension(
        scholarId,
      );

      res.json({
        eligibility,
        requiredDocuments: requiredDocs,
      });
    } catch (error: unknown) {
      respondWithError(res, error, 400);
    }
  });

  // Create an extension application
  app.post("/api/extensions/create", async (req, res) => {
    try {
      const input = z
        .object({
          scholarId: z.number(),
          extensionPeriod: z.enum(["6_months", "1_year"]),
          reason: z.string().optional(),
        })
        .parse(req.body);

      const result = await applicationService.createExtensionApplication(
        input.scholarId,
        input.extensionPeriod,
        { reason: input.reason },
      );

      res.status(201).json(result);
    } catch (error: unknown) {
      respondWithError(res, error, 400);
    }
  });

  // Upload document for application
  app.post("/api/applications/:id/upload-document", async (req, res) => {
    try {
      const input = z
        .object({
          documentType: z.string(),
          fileName: z.string(),
          fileUrl: z.string(),
          fileSize: z.number().optional(),
          mimeType: z.string().optional(),
          uploadedBy: z.number(),
        })
        .parse(req.body);

      const document = await applicationDocumentService.uploadDocument({
        applicationId: parseInt(req.params.id, 10),
        ...input,
      });

      res.status(201).json(document);
    } catch (error: unknown) {
      respondWithError(res, error, 400);
    }
  });

  // Get all documents for an application
  app.get("/api/applications/:id/documents", async (req, res) => {
    // Document storage is handled by external document database; endpoint deprecated for now
    res.status(501).json({ message: "Document endpoints are disabled. Document store will be integrated later." });
  });

  // Get document checklist status
  app.get("/api/applications/:id/document-checklist", async (req, res) => {
    res.status(501).json({ message: "Document endpoints are disabled. Document store will be integrated later." });
  });

  // Get documents for reviewer
  app.get("/api/applications/:id/documents-for-review", async (req, res) => {
    res.status(501).json({ message: "Document endpoints are disabled. Document store will be integrated later." });
  });

  // Verify a document
  app.post("/api/applications/:appId/verify-document/:docId", async (req, res) => {
    res.status(501).json({ message: "Document endpoints are disabled. Document store will be integrated later." });
  });

  // Submit extension application for review
  app.post("/api/extensions/:id/submit", async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id, 10);
      const app = await applicationService.submitExtensionApplication(applicationId);
      res.json(app);
    } catch (error: unknown) {
      respondWithError(res, error, 400);
    }
  });

  // === STATS ===
  app.get(api.stats.get.path, async (req, res) => {
    try {
      const stats = await researchProgressService.getResearchProgress(
        String(req.params.scholarId),
      );
      res.json(stats);
    } catch (error: unknown) {
      respondWithError(res, error, 500);
    }
  });

  // === SUPERVISOR ENDPOINTS ===
  // Get scholars under a supervisor
  app.get("/api/supervisors/scholars", async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user || !user.id) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const scholars = await scholarService.getScholarsBySupervisor(user.id);
      res.json(scholars);
    } catch (error: unknown) {
      respondWithError(res, error, 500);
    }
  });

  // Get applications for scholars under this supervisor
  app.get("/api/supervisors/applications", async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user || !user.id) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const scholarIdParam = req.query.scholarId as string | undefined;

      if (scholarIdParam) {
        // Get applications for a specific scholar
        const apps = await applicationService.getApplications(scholarIdParam);
        res.json(apps);
      } else {
        // Get all applications for scholars under this supervisor
        const apps = await applicationService.getApplicationsForSupervisor(String(user.id));
        res.json(apps);
      }
    } catch (error: unknown) {
      respondWithError(res, error, 500);
    }
  });

  // === SEED DATA ===
  await seedService.seedDatabase();

  return httpServer;
}
