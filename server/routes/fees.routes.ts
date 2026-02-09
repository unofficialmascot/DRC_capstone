import type { Express, Request, Response } from "express";
import { api } from "../../shared/routes.js";
import { feeStructureService } from "../services";

export function registerFeeStructureRoutes(
  app: Express,
  respondWithError: (
    req: Request,
    res: Response,
    error: unknown,
    fallbackStatus?: number,
  ) => Response,
) {
  app.get(api.fees.list.path, async (req, res) => {
    try {
      const feeStructure = await feeStructureService.listFeeStructure();
      res.json(feeStructure);
    } catch (error: unknown) {
      respondWithError(req, res, error, 500);
    }
  });
}
