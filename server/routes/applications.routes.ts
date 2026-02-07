import type { Express, Request, Response } from "express";
import { api } from "../../shared/routes.js";
import { z } from "zod";
import { AppError } from "../errors";
import { applicationDocumentService, applicationService, reviewService, userService } from "../services";

export function registerApplicationRoutes(
  app: Express,
  respondWithError: (
    req: Request,
    res: Response,
    error: unknown,
    fallbackStatus?: number,
  ) => Response,
) {
  app.get(api.applications.list.path, async (req, res) => {
    try {
      const scholarId = req.query.scholarId
        ? String(req.query.scholarId)
        : undefined;
      const apps = await applicationService.getApplications(scholarId);
      res.json(apps);
    } catch (error: unknown) {
      respondWithError(req, res, error, 500);
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
      respondWithError(req, res, error, 500);
    }
  });

  app.get("/api/applications/:id", async (req, res) => {
    try {
      const appResult = await applicationService.getApplicationById(
        Number(req.params.id),
      );
      res.json(appResult);
    } catch (error: unknown) {
      respondWithError(req, res, error, 404);
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
      respondWithError(req, res, error, 400);
    }
  });

  app.get("/api/applications/:id/reviews", async (req, res) => {
    try {
      const reviews = await reviewService.getReviewsForApplication(
        Number(req.params.id),
      );
      res.json(reviews);
    } catch (error: unknown) {
      respondWithError(req, res, error, 500);
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
      respondWithError(req, res, error, 400);
    }
  });

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
      respondWithError(req, res, error, 400);
    }
  });

  app.get("/api/applications/:id/documents", async (_req, res) => {
    res.status(501).json({
      message: "Document endpoints are disabled. Document store will be integrated later.",
    });
  });

  app.get("/api/applications/:id/document-checklist", async (_req, res) => {
    res.status(501).json({
      message: "Document endpoints are disabled. Document store will be integrated later.",
    });
  });

  app.get("/api/applications/:id/documents-for-review", async (_req, res) => {
    res.status(501).json({
      message: "Document endpoints are disabled. Document store will be integrated later.",
    });
  });

  app.post("/api/applications/:appId/verify-document/:docId", async (_req, res) => {
    res.status(501).json({
      message: "Document endpoints are disabled. Document store will be integrated later.",
    });
  });
}
