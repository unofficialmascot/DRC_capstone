import type { Express } from "express";
import type { Server } from "http";
import { registerAuthRoutes } from "./routes/auth-routes";
import { registerUserRoutes } from "./routes/users-routes";
import { registerApplicationRoutes } from "./routes/applications-routes";
import { registerReviewRoutes } from "./routes/reviews-routes";
import { registerStatsRoutes } from "./routes/stats-routes";
import { registerDocumentRoutes } from "./routes/documents-routes";
import { registerDrcMeetingRoutes } from "./routes/drc-meetings-routes";
import { registerNotificationRoutes } from "./routes/notifications-routes";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  registerAuthRoutes(app);
  registerUserRoutes(app);
  registerApplicationRoutes(app);
  registerReviewRoutes(app);
  registerDrcMeetingRoutes(app);
  registerNotificationRoutes(app);
  registerStatsRoutes(app);
  await registerDocumentRoutes(app);

  return httpServer;
}
