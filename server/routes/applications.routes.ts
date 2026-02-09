import type { Express, Request, Response } from "express";
import { api } from "../../shared/routes.js";
import { z } from "zod";
import { AppError } from "../errors";
import {
  applicationDocumentService,
  applicationService,
  documentStorageProvider,
  reviewService,
  userService,
} from "../services";

const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
]);

export function registerApplicationRoutes(
  app: Express,
  respondWithError: (
    req: Request,
    res: Response,
    error: unknown,
    fallbackStatus?: number,
  ) => Response,
) {
  const requireAuthUserId = (req: Request) => {
    if (!req.session.userId) {
      throw new AppError("Not authenticated", 401);
    }
    return req.session.userId;
  };

  const validateFileMetadata = (input: { mimeType?: string; fileSize?: number }) => {
    if (input.mimeType && !ALLOWED_MIME_TYPES.has(input.mimeType)) {
      throw new AppError("Unsupported file type", 400);
    }
    if (input.fileSize && input.fileSize > MAX_DOCUMENT_SIZE_BYTES) {
      throw new AppError("File size exceeds limit", 400);
    }
  };

  app.get(api.applications.list.path, async (req, res) => {
    try {
      const userId = req.query.userId
        ? String(req.query.userId)
        : undefined;
      const apps = await applicationService.getApplications(userId);
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
        input.userId,
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
          reviewerId: z.number(),
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
          documentType: z.string().min(1),
          fileName: z.string().min(1),
          fileUrl: z.string().optional(),
          fileSize: z.number().int().positive(),
          mimeType: z.string(),
          uploadedBy: z.number().optional(),
          objectKey: z.string().optional(),
        })
        .parse(req.body);

      const userId = requireAuthUserId(req);
      await applicationDocumentService.assertDocumentAccess(
        parseInt(req.params.id, 10),
        userId,
        { requireUploader: true },
      );
      validateFileMetadata(input);

      if (!input.fileUrl && !input.objectKey) {
        throw new AppError("fileUrl or objectKey is required", 400);
      }

      const resolvedFileUrl = input.objectKey
        ? documentStorageProvider.resolveDownloadUrl(input.objectKey)
        : input.fileUrl;

      const document = await applicationDocumentService.uploadDocument({
        applicationId: parseInt(req.params.id, 10),
        ...input,
        fileUrl: resolvedFileUrl,
        uploadedBy: userId,
      });

      res.status(201).json(document);
    } catch (error: unknown) {
      respondWithError(req, res, error, 400);
    }
  });

  app.post("/api/applications/:id/upload-url", async (req, res) => {
    try {
      const input = z
        .object({
          documentType: z.string().min(1),
          fileName: z.string().min(1),
          mimeType: z.string(),
          fileSize: z.number().int().positive(),
        })
        .parse(req.body);

      const userId = requireAuthUserId(req);
      const applicationId = parseInt(req.params.id, 10);

      await applicationDocumentService.assertDocumentAccess(applicationId, userId, {
        requireUploader: true,
      });
      validateFileMetadata(input);

      const uploadResult = documentStorageProvider.generateUploadUrl({
        applicationId,
        uploadedBy: userId,
        ...input,
      });

      res.json(uploadResult);
    } catch (error: unknown) {
      respondWithError(req, res, error, 400);
    }
  });

  app.get("/api/applications/:id/documents", async (req, res) => {
    try {
      const userId = requireAuthUserId(req);
      const applicationId = parseInt(req.params.id, 10);
      await applicationDocumentService.assertDocumentAccess(applicationId, userId);
      const documents = await applicationDocumentService.getApplicationDocuments(applicationId);
      res.json(documents);
    } catch (error: unknown) {
      respondWithError(req, res, error, 400);
    }
  });

  app.get("/api/applications/:id/document-checklist", async (req, res) => {
    try {
      const userId = requireAuthUserId(req);
      const applicationId = parseInt(req.params.id, 10);
      const { application } = await applicationDocumentService.assertDocumentAccess(
        applicationId,
        userId,
      );
      const checklist = await applicationDocumentService.getDocumentChecklistStatus(
        applicationId,
        application.type,
      );
      res.json(checklist);
    } catch (error: unknown) {
      respondWithError(req, res, error, 400);
    }
  });

  app.get("/api/applications/:id/documents-for-review", async (req, res) => {
    try {
      const userId = requireAuthUserId(req);
      const applicationId = parseInt(req.params.id, 10);
      await applicationDocumentService.assertDocumentAccess(applicationId, userId, {
        requireReviewer: true,
        requireStageMatch: true,
      });
      const documents = await applicationDocumentService.getDocumentsForReview(applicationId);
      res.json(documents);
    } catch (error: unknown) {
      respondWithError(req, res, error, 403);
    }
  });

  app.post("/api/applications/:appId/verify-document/:docId", async (req, res) => {
    try {
      const userId = requireAuthUserId(req);
      const applicationId = parseInt(req.params.appId, 10);
      const documentId = parseInt(req.params.docId, 10);
      const input = z
        .object({
          isVerified: z.boolean(),
          verificationNotes: z.string().optional(),
        })
        .parse(req.body);

      await applicationDocumentService.assertDocumentAccess(applicationId, userId, {
        requireReviewer: true,
        requireStageMatch: true,
      });

      const documents = await applicationDocumentService.getApplicationDocuments(applicationId);
      if (!documents.some((doc) => doc.id === documentId)) {
        throw new AppError("Document not found for this application", 404);
      }

      const verified = await applicationDocumentService.verifyDocument({
        attachmentId: documentId,
        verifiedBy: userId,
        isVerified: input.isVerified,
        verificationNotes: input.verificationNotes,
      });

      res.json(verified);
    } catch (error: unknown) {
      respondWithError(req, res, error, 400);
    }
  });
}
