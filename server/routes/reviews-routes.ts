import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { submitApplicationReview } from "../services/review-workflow-service";
import { forbidden, handleRouteError, parsePositiveIntParam, unauthorized } from "./http";

export function registerReviewRoutes(app: Express): void {
  app.get("/api/applications/:id/reviews", async (req, res) => {
    try {
      const applicationId = parsePositiveIntParam(req.params.id, "application id");
      const reviews = await storage.getReviewsForApplication(applicationId);
      res.json(reviews);
    } catch (error) {
      return handleRouteError(res, error);
    }
  });

  app.post("/api/applications/:id/review", async (req, res) => {
    try {
      if (!req.session.userId) {
        throw unauthorized("Not authenticated");
      }

      const sessionUser = await storage.getUserWithScholar(req.session.userId);
      if (!sessionUser) {
        throw unauthorized("User session is invalid");
      }

      if (sessionUser.role === "drc_convener" || sessionUser.role === "drc_chairman") {
        throw forbidden("This role cannot submit member reviews");
      }

      const reviewInput = z
        .object({
          reviewerId: z.string(),
          decision: z.enum(["approved", "rejected"]),
          remarks: z.string().min(1, "Remarks are required"),
        })
        .parse(req.body);

      const applicationId = parsePositiveIntParam(req.params.id, "application id");
      const result = await submitApplicationReview(applicationId, reviewInput);
      res.json(result);
    } catch (error) {
      return handleRouteError(res, error);
    }
  });
}
