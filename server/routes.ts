import type { Express, Request, Response } from "express";
import type { Server } from "http";
import { toErrorResponse } from "./errors";
import { seedService } from "./services";
import { registerApplicationRoutes } from "./routes/applications.routes";
import { registerAuthRoutes } from "./routes/auth.routes";
import { registerExtensionRoutes } from "./routes/extensions.routes";
import { registerFeeStructureRoutes } from "./routes/fees.routes";
import { registerStatsRoutes } from "./routes/stats.routes";
import { registerSupervisorRoutes } from "./routes/supervisors.routes";
import { registerThesisSubmissionRoutes } from "./routes/thesis-submissions.routes";
import { registerUserRoutes } from "./routes/users.routes";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  const respondWithError = (
    req: Request,
    res: Response,
    error: unknown,
    fallbackStatus = 500,
  ) => {
    const { status, body } = toErrorResponse(error, fallbackStatus);
    const detailsSuffix = body.details ? ` ${JSON.stringify(body.details)}` : "";
    const message = body.message ?? "Unknown error";
    const logLine = `${req.method} ${req.path} ${status} ${message}${detailsSuffix}`;
    console.warn(logLine);
    return res.status(status).json(body);
  };

  registerAuthRoutes(app, respondWithError);
  registerUserRoutes(app, respondWithError);
  registerApplicationRoutes(app, respondWithError);
  registerExtensionRoutes(app, respondWithError);
  registerFeeStructureRoutes(app, respondWithError);
  registerStatsRoutes(app, respondWithError);
  registerSupervisorRoutes(app, respondWithError);
  registerThesisSubmissionRoutes(app, respondWithError);

  try {
    await seedService.seedDatabase();
  } catch (error: unknown) {
    console.warn("Seed skipped due to startup error:", error);
  }

  return httpServer;
}
