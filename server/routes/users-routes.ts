import type { Express } from "express";
import { api } from "../../shared/routes.js";
import { storage } from "../storage";
import { handleRouteError, notFound, parseIdParam } from "./http";

export function registerUserRoutes(app: Express): void {
  app.get("/api/users/supervisors", async (_req, res) => {
    try {
      const supervisors = await storage.listSupervisors();
      res.json(supervisors);
    } catch (error) {
      return handleRouteError(res, error);
    }
  });

  app.get(api.users.get.path, async (req, res) => {
    try {
      const rawUserId = String(req.params.id);
      if (!/^\d+$/.test(rawUserId)) {
        throw notFound("User not found");
      }
      const userId = parseIdParam(rawUserId, "user id");
      const user = await storage.getUserWithScholar(userId);
      if (!user) {
        throw notFound("User not found");
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      return handleRouteError(res, error);
    }
  });

  app.get("/api/users", async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(
        users.map((user) => {
          const { password: _, ...rest } = user;
          return rest;
        }),
      );
    } catch (error) {
      return handleRouteError(res, error);
    }
  });

  app.put(api.users.update.path, async (req, res) => {
    try {
      const updates = api.users.update.input.parse(req.body);
      const rawUserId = String(req.params.id);
      if (!/^\d+$/.test(rawUserId)) {
        throw notFound("User not found");
      }
      const userId = parseIdParam(rawUserId, "user id");
      const updatedUser = await storage.updateUser(userId, updates);
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      return handleRouteError(res, error, "Invalid input");
    }
  });
}
