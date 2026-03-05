import type { Express } from "express";
import { clearNotification, clearNotifications, listNotifications } from "../services/notification-service";
import { handleRouteError, parseIdParam, unauthorized } from "./http";

export function registerNotificationRoutes(app: Express): void {
  app.get("/api/notifications", async (req, res) => {
    try {
      if (!req.session.userId) {
        throw unauthorized("Not authenticated");
      }

      const notifications = await listNotifications(req.session.userId);
      res.json(notifications);
    } catch (error) {
      return handleRouteError(res, error);
    }
  });

  app.post("/api/notifications/clear", async (req, res) => {
    try {
      if (!req.session.userId) {
        throw unauthorized("Not authenticated");
      }

      const result = await clearNotifications(req.session.userId);
      res.json(result);
    } catch (error) {
      return handleRouteError(res, error);
    }
  });

  app.post("/api/notifications/:id/clear", async (req, res) => {
    try {
      if (!req.session.userId) {
        throw unauthorized("Not authenticated");
      }

      const notificationId = parseIdParam(req.params.id, "notification id");
      const result = await clearNotification(req.session.userId, notificationId);
      res.json(result);
    } catch (error) {
      return handleRouteError(res, error);
    }
  });
}
