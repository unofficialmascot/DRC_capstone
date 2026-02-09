import type { Express, Request, Response } from "express";
import { api } from "../../shared/routes.js";
import { researchProgressService } from "../services";

export function registerStatsRoutes(
  app: Express,
  respondWithError: (
    req: Request,
    res: Response,
    error: unknown,
    fallbackStatus?: number,
  ) => Response,
) {
  app.get(api.stats.get.path, async (req, res) => {
    try {
      const stats = await researchProgressService.getResearchProgress(
        Number(req.params.userId),
      );
      res.json(stats);
    } catch (error: unknown) {
      respondWithError(req, res, error, 500);
    }
  });
}
