import type { Express, Request, Response } from "express";
import { z } from "zod";
import { applicationService, extensionEligibilityService, scholarService } from "../services";

export function registerExtensionRoutes(
  app: Express,
  respondWithError: (
    req: Request,
    res: Response,
    error: unknown,
    fallbackStatus?: number,
  ) => Response,
) {
  app.get("/api/extensions/check-eligibility/:scholarId", async (req, res) => {
    try {
      const scholarIdParam = req.params.scholarId;
      let scholarId = scholarIdParam;

      const parsedId = Number(scholarIdParam);
      if (!Number.isNaN(parsedId)) {
        const scholar = await scholarService.getScholarById(parsedId);
        if (!scholar?.scholarId) {
          return res.status(404).json({ message: "Scholar not found" });
        }
        scholarId = scholar.scholarId;
      }

      const eligibility = await extensionEligibilityService.checkExtensionEligibility(
        scholarId,
      );
      const requiredDocs = await extensionEligibilityService.getRequiredDocumentsForExtension(
        scholarId,
      );

      res.json({
        eligibility,
        requiredDocuments: requiredDocs,
      });
    } catch (error: unknown) {
      respondWithError(req, res, error, 400);
    }
  });

  app.post("/api/extensions/create", async (req, res) => {
    try {
      const input = z
        .object({
          scholarId: z.number(),
          extensionPeriod: z.enum(["6_months", "1_year"]),
          reason: z.string().optional(),
        })
        .parse(req.body);

      const result = await applicationService.createExtensionApplication(
        input.scholarId,
        input.extensionPeriod,
        { reason: input.reason },
      );

      res.status(201).json(result);
    } catch (error: unknown) {
      respondWithError(req, res, error, 400);
    }
  });

  app.post("/api/extensions/:id/submit", async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id, 10);
      const appResult = await applicationService.submitExtensionApplication(applicationId);
      res.json(appResult);
    } catch (error: unknown) {
      respondWithError(req, res, error, 400);
    }
  });
}
