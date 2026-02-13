import type { Express } from "express";
import { api } from "../../shared/routes.js";
import { storage } from "../storage";
import { handleRouteError } from "./http";

export function registerStatsRoutes(app: Express): void {
  app.get(api.stats.get.path, async (req, res) => {
    try {
      const stats = await storage.getResearchProgress(String(req.params.scholarId));
      if (!stats) {
        return res.json({
          completedReviews: 0,
          pendingReports: 0,
          publications: 0,
        });
      }
      res.json(stats);
    } catch (error) {
      return handleRouteError(res, error);
    }
  });
}
