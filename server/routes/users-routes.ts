import type { Express } from "express";
import { api } from "../../shared/routes.js";
import { storage } from "../storage";
import { handleRouteError, notFound, parsePositiveIntParam } from "./http";

export function registerUserRoutes(app: Express): void {
  app.get("/api/users/supervisors/:employeeId/scholars", async (req, res) => {
    try {
      const employeeId = String(req.params.employeeId || "").trim();
      if (!employeeId) {
        return res.status(400).json({ message: "Employee ID is required" });
      }

      const scholars = await storage.listAssignedScholars(employeeId);
      res.json(scholars);
    } catch (error) {
      return handleRouteError(res, error);
    }
  });

  app.get("/api/users/supervisors/:employeeId/scholars-count", async (req, res) => {
    try {
      const employeeId = String(req.params.employeeId || "").trim();
      if (!employeeId) {
        return res.status(400).json({ message: "Employee ID is required" });
      }

      const count = await storage.countAssignedScholars(employeeId);
      res.json({ count });
    } catch (error) {
      return handleRouteError(res, error);
    }
  });

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
      const userId = parsePositiveIntParam(String(req.params.id), "user id");
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
      const userId = parsePositiveIntParam(String(req.params.id), "user id");
      const updatedUser = await storage.updateUser(userId, updates);
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      return handleRouteError(res, error, "Invalid input");
    }
  });
}
