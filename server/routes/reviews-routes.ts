import type { Express } from "express";
import { api } from "../../shared/routes.js";
import { storage } from "../storage";
import { submitApplicationReview } from "../services/review-workflow-service";
import { forbidden, handleRouteError, parsePositiveIntParam, unauthorized } from "./http";

export function registerReviewRoutes(app: Express): void {
  app.get(api.applications.reviews.path, async (req, res) => {
    try {
<<<<<<< HEAD
      const applicationId = parsePositiveIntParam(req.params.id, "application id");
=======
      const rawApplicationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const applicationId = parseIdParam(rawApplicationId, "application id");
>>>>>>> bde5261 (Notifications for drc meetings and generalized notification system for other events. Refactor of the application review workflow to support multiple stages and more complex logic. Various UI improvements and bug fixes.)
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

      if (sessionUser.role === "drc_convener" || sessionUser.role === "drc_chairman") {
        throw forbidden("This role cannot submit member reviews");
      }

      const reviewInput = api.applications.review.input.parse(req.body);

<<<<<<< HEAD
      const applicationId = parsePositiveIntParam(req.params.id, "application id");
=======
      const rawApplicationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const applicationId = parseIdParam(rawApplicationId, "application id");
>>>>>>> bde5261 (Notifications for drc meetings and generalized notification system for other events. Refactor of the application review workflow to support multiple stages and more complex logic. Various UI improvements and bug fixes.)
      const result = await submitApplicationReview(applicationId, reviewInput);
      res.json(result);
    } catch (error) {
      return handleRouteError(res, error);
    }
  });
}
