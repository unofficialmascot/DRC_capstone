import type { Express } from "express";
import type { Server } from "http";
import { api } from "../shared/routes.js";
import { z } from "zod";
import { authService } from "./services/authService";
import { userService } from "./services/userService";
import { applicationService } from "./services/applicationService";
import { reviewService } from "./services/reviewService";
import { researchProgressService } from "./services/researchProgressService";
import { seedService } from "./services/seedService";
import { extensionEligibilityService } from "./services/extensionEligibilityService";
import { applicationDocumentService } from "./services/applicationDocumentService";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
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
    } catch (error: any) {
      res.status(401).json({ message: error.message || "Invalid input" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const user = await authService.getCurrentUser(req.session.userId);
      res.json(user);
    } catch (error: any) {
      res.status(401).json({ message: error.message || "User not found" });
    }
  });

  // === USERS ===
  app.get(api.users.get.path, async (req, res) => {
    try {
      const user = await userService.getUserById(Number(req.params.id));
      res.json(user);
    } catch (error: any) {
      res.status(404).json({ message: error.message || "User not found" });
    }
  });

  app.get("/api/users", async (req, res) => {
    try {
      const users = await userService.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch users" });
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
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Invalid input" });
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
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch applications" });
    }
  });

  app.get("/api/applications/stage/:stage", async (req, res) => {
    try {
      const stage = req.params.stage;

      if (stage === "supervisor") {
        if (!req.session.userId) {
          return res.status(401).json({ message: "Not authenticated" });
        }

        const user = await userService.getUserById(req.session.userId);
        if (user.role === "supervisor") {
          // TODO: Get employee ID for this supervisor user
          // For now, we'll return empty array until employee mapping is set up
          return res.json([]);
        }
      }

      const apps = await applicationService.getApplicationsByStage(stage);
      res.json(apps);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch applications" });
    }
  });

  app.get("/api/applications/:id", async (req, res) => {
    try {
      const app = await applicationService.getApplicationById(
        Number(req.params.id),
      );
      res.json(app);
    } catch (error: any) {
      res.status(404).json({ message: error.message || "Application not found" });
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
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Invalid input" });
    }
  });

  // === APPLICATION REVIEWS ===
  app.get("/api/applications/:id/reviews", async (req, res) => {
    try {
      const reviews = await reviewService.getReviewsForApplication(
        Number(req.params.id),
      );
      res.json(reviews);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch reviews" });
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
    } catch (error: any) {
      res.status(error.message.includes("not found") ? 404 : error.message.includes("not authorized") || error.message.includes("not assigned") ? 403 : 400).json({
        message: error.message || "Invalid input",
      });
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
        const scholar = await storage.getScholarById(parsedId);
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
    } catch (error: any) {
      res
        .status(error.message.includes("not found") ? 404 : 400)
        .json({ message: error.message || "Failed to check eligibility" });
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
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create extension application" });
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
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to upload document" });
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
    } catch (error: any) {
      res
        .status(error.message.includes("cannot be submitted") ? 400 : 500)
        .json({ message: error.message || "Failed to submit application" });
    }
  });

  // === STATS ===
  app.get(api.stats.get.path, async (req, res) => {
    try {
      const stats = await researchProgressService.getResearchProgress(
        String(req.params.scholarId),
      );
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch stats" });
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

      const scholars = await storage.getScholarsBySupervisor(user.id);
      res.json(scholars);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch scholars" });
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
        const apps = await storage.getApplicationsForSupervisor(String(user.id));
        res.json(apps);
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch applications" });
    }
  });

  // === SEED DATA ===
  await seedService.seedDatabase();

  return httpServer;
}
