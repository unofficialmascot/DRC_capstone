import type { Express, Request, Response } from "express";
import { applicationService, scholarService } from "../services";

export function registerSupervisorRoutes(
  app: Express,
  respondWithError: (
    req: Request,
    res: Response,
    error: unknown,
    fallbackStatus?: number,
  ) => Response,
) {
  app.get("/api/supervisors/scholars", async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user || !user.id) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const scholars = await scholarService.getScholarsBySupervisor(user.id);
      res.json(scholars);
    } catch (error: unknown) {
      respondWithError(req, res, error, 500);
    }
  });

  app.get("/api/supervisors/applications", async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user || !user.id) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const scholarIdParam = req.query.scholarId as string | undefined;

      if (scholarIdParam) {
        const apps = await applicationService.getApplications(scholarIdParam);
        res.json(apps);
      } else {
        const apps = await applicationService.getApplicationsForSupervisor(String(user.id));
        res.json(apps);
      }
    } catch (error: unknown) {
      respondWithError(req, res, error, 500);
    }
  });
}
