import type { Express, Request, Response } from "express";

export function registerThesisSubmissionRoutes(
  app: Express,
  respondWithError: (
    req: Request,
    res: Response,
    error: unknown,
    fallbackStatus?: number,
  ) => Response,
) {
  app.get("/api/thesis-submissions", async (req, res) => {
    try {
      res.status(200).json([]);
    } catch (error: unknown) {
      respondWithError(req, res, error, 500);
    }
  });

  app.post("/api/thesis-submissions", async (req, res) => {
    try {
      res.status(201).json({
        message: "Thesis submission endpoint is ready. Implementation will follow.",
      });
    } catch (error: unknown) {
      respondWithError(req, res, error, 500);
    }
  });
}
