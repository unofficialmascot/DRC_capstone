import type { Express } from "express";
import { api } from "../../shared/routes.js";
import { storage } from "../storage";
import { submitApplicationReview } from "../services/review-workflow-service";
import { forbidden, handleRouteError, parseIdParam, unauthorized } from "./http";

export function registerReviewRoutes(app: Express): void {
  app.get(api.applications.reviews.path, async (req, res) => {
    try {
      const applicationId = parseIdParam(req.params.id, "application id");
      const reviews = await storage.getReviewsForApplication(applicationId);
      res.json(reviews);
    } catch (error) {
      return handleRouteError(res, error);
    }
  });

  app.post(api.applications.review.path, async (req, res) => {
    try {
      if (!req.session.userId) {
        throw unauthorized("Not authenticated");
      }

      const sessionUser = await storage.getUserWithScholar(req.session.userId);
      if (!sessionUser) {
        throw unauthorized("User session is invalid");
      }

      const hasRoleMethod = (storage as unknown as { userHasAnyRole?: unknown }).userHasAnyRole;
      let isChairman = sessionUser.role === "drc_chairman";
      if (typeof hasRoleMethod === "function") {
        try {
          isChairman = await storage.userHasAnyRole(sessionUser.id, ["drc_chairman"], sessionUser.role);
        } catch {
          isChairman = sessionUser.role === "drc_chairman";
        }
      }

      if (isChairman) {
        throw forbidden("This role cannot submit member reviews");
      }

      const reviewInput = api.applications.review.input.parse(req.body);

      const applicationId = parseIdParam(req.params.id, "application id");
      const result = await submitApplicationReview(applicationId, reviewInput);
      res.json(result);
    } catch (error) {
      return handleRouteError(res, error);
    }
  });
}
