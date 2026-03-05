zimport type { Express } from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { api } from "../../shared/routes.js";
import { storage } from "../storage";
import { badRequest, handleRouteError, notFound, parsePositiveIntParam } from "./http";

export async function registerDocumentRoutes(app: Express): Promise<void> {
  const uploadsDir = path.join(process.cwd(), "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });

  const upload = multer({
    storage: multer.diskStorage({
      destination: async (_req, _file, cb) => {
        cb(null, uploadsDir);
      },
      filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + "-" + file.originalname);
      },
    }),
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Invalid file type. Only PDF and images are allowed."));
      }
    },
  });

  app.post(api.documents.upload.path, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { scholarId, documentType, category } = req.body;
      if (!scholarId || !documentType || !category) {
        await fs.unlink(req.file.path);
        throw badRequest("Missing required fields");
      }

      const document = await storage.createDocument({
        scholarId,
        documentType,
        category,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      });

      res.status(201).json(document);
    } catch (error: unknown) {
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      return handleRouteError(res, error, "Failed to upload document");
    }
  });

  app.get(api.documents.list.path, async (req, res) => {
    try {
      const scholarId = req.query.scholarId as string;
      if (!scholarId) {
        throw badRequest("scholarId is required");
      }
      const docs = await storage.getDocuments(scholarId);
      res.json(docs);
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to fetch documents");
    }
  });

  app.get(api.documents.view.path, async (req, res) => {
    try {
<<<<<<< HEAD
      const documentId = parsePositiveIntParam(req.params.id, "document id");
=======
      const rawDocumentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const documentId = parseIdParam(rawDocumentId, "document id");
>>>>>>> bde5261 (Notifications for drc meetings and generalized notification system for other events. Refactor of the application review workflow to support multiple stages and more complex logic. Various UI improvements and bug fixes.)
      const doc = await storage.getDocumentById(documentId);
      if (!doc) {
        throw notFound("Document not found");
      }

      const absolutePath = path.isAbsolute(doc.filePath)
        ? doc.filePath
        : path.resolve(doc.filePath);

      res.setHeader("Content-Type", doc.mimeType);
      res.setHeader("Content-Disposition", `inline; filename="${doc.fileName}"`);
      res.sendFile(absolutePath);
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to view document");
    }
  });

  app.get(api.documents.download.path, async (req, res) => {
    try {
<<<<<<< HEAD
      const documentId = parsePositiveIntParam(req.params.id, "document id");
=======
      const rawDocumentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const documentId = parseIdParam(rawDocumentId, "document id");
>>>>>>> bde5261 (Notifications for drc meetings and generalized notification system for other events. Refactor of the application review workflow to support multiple stages and more complex logic. Various UI improvements and bug fixes.)
      const doc = await storage.getDocumentById(documentId);
      if (!doc) {
        throw notFound("Document not found");
      }

      res.download(doc.filePath, doc.fileName);
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to download document");
    }
  });

  app.delete(api.documents.delete.path, async (req, res) => {
    try {
<<<<<<< HEAD
      const documentId = parsePositiveIntParam(req.params.id, "document id");
=======
      const rawDocumentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const documentId = parseIdParam(rawDocumentId, "document id");
>>>>>>> bde5261 (Notifications for drc meetings and generalized notification system for other events. Refactor of the application review workflow to support multiple stages and more complex logic. Various UI improvements and bug fixes.)
      const doc = await storage.getDocumentById(documentId);
      if (!doc) {
        throw notFound("Document not found");
      }

      await fs.unlink(doc.filePath).catch(() => {});
      await storage.deleteDocument(documentId);

      res.json({ message: "Document deleted successfully" });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to delete document");
    }
  });

  app.patch(api.documents.verify.path, async (req, res) => {
    try {
      const { verifiedBy } = req.body;
      if (!verifiedBy) {
        throw badRequest("verifiedBy is required");
      }

<<<<<<< HEAD
      const documentId = parsePositiveIntParam(req.params.id, "document id");
=======
      const rawDocumentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const documentId = parseIdParam(rawDocumentId, "document id");
>>>>>>> bde5261 (Notifications for drc meetings and generalized notification system for other events. Refactor of the application review workflow to support multiple stages and more complex logic. Various UI improvements and bug fixes.)

      const updated = await storage.updateDocument(documentId, {
        isVerified: true,
        verifiedBy,
        verifiedAt: new Date(),
      });

      res.json(updated);
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to verify document");
    }
  });
}
