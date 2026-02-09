import type { Express, Request, Response } from "express";
import express from "express";
import fs from "fs/promises";
import path from "path";
import { AppError } from "../errors";
import { documentStorageProvider } from "../services";

const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
]);

const UPLOAD_DIR = path.resolve("server", "uploads");

export function registerStorageRoutes(
  app: Express,
  respondWithError: (
    req: Request,
    res: Response,
    error: unknown,
    fallbackStatus?: number,
  ) => Response,
) {
  app.put(
    "/api/storage/upload/:objectKey",
    express.raw({ type: "*/*", limit: MAX_DOCUMENT_SIZE_BYTES }),
    async (req, res) => {
      try {
        const objectKey = req.params.objectKey;
        if (!documentStorageProvider.isValidObjectKey(objectKey)) {
          throw new AppError("Invalid storage object key", 400);
        }

        const signature = String(req.query.signature ?? "");
        const expires = Number(req.query.expires ?? 0);
        const contentType = String(req.query.contentType ?? "");
        const contentLength = Number(req.query.contentLength ?? 0);

        if (!signature || !expires || !contentType || !contentLength) {
          throw new AppError("Missing upload signature parameters", 400);
        }

        if (!Number.isFinite(contentLength) || contentLength <= 0) {
          throw new AppError("Invalid upload size", 400);
        }

        if (!ALLOWED_MIME_TYPES.has(contentType)) {
          throw new AppError("Unsupported file type", 400);
        }

        if (contentLength > MAX_DOCUMENT_SIZE_BYTES) {
          throw new AppError("File size exceeds limit", 400);
        }

        if (!documentStorageProvider.verifyUploadSignature({
          objectKey,
          expiresAt: expires,
          contentType,
          contentLength,
          signature,
        })) {
          throw new AppError("Invalid or expired upload signature", 401);
        }

        if (!Buffer.isBuffer(req.body)) {
          throw new AppError("Invalid upload payload", 400);
        }

        if (req.body.length !== contentLength) {
          throw new AppError("Uploaded file size mismatch", 400);
        }

        if (req.headers["content-type"] !== contentType) {
          throw new AppError("Content type mismatch", 400);
        }

        await fs.mkdir(UPLOAD_DIR, { recursive: true });
        const filePath = path.join(UPLOAD_DIR, objectKey);
        await fs.writeFile(filePath, req.body);

        res.status(201).json({ objectKey, size: req.body.length });
      } catch (error: unknown) {
        respondWithError(req, res, error, 400);
      }
    },
  );

  app.get("/api/storage/download/:objectKey", async (req, res) => {
    try {
      const objectKey = req.params.objectKey;
      if (!documentStorageProvider.isValidObjectKey(objectKey)) {
        throw new AppError("Invalid storage object key", 400);
      }

      const filePath = path.join(UPLOAD_DIR, objectKey);
      await fs.access(filePath);
      res.sendFile(filePath);
    } catch (error: unknown) {
      respondWithError(req, res, error, 404);
    }
  });
}
