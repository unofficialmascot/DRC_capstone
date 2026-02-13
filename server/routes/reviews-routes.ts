import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { submitApplicationReview } from "../services/review-workflow-service";
import { handleRouteError, parseIdParam } from "./http";

export function registerReviewRoutes(app: Express): void {
  app.get("/api/applications/:id/reviews", async (req, res) => {
    try {
      const applicationId = parseIdParam(req.params.id, "application id");
      const reviews = await storage.getReviewsForApplication(applicationId);
      res.json(reviews);
    } catch (error) {
      return handleRouteError(res, error);
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

      const applicationId = parseIdParam(req.params.id, "application id");
      const result = await submitApplicationReview(applicationId, reviewInput);
      res.json(result);
    } catch (error) {
      return handleRouteError(res, error);
    }
  });
}
