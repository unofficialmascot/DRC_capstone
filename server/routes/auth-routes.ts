import type { Express } from "express";
import { z } from "zod";
import { storage, verifyPassword } from "../storage";
import { handleRouteError, notFound, unauthorized } from "./http";

export function registerAuthRoutes(app: Express): void {
  app.post("/api/auth/login", async (req, res) => {
    try {
      const input = z
        .object({
          scholarId: z.string().optional(),
          employeeId: z.string().optional(),
          password: z.string(),
        })
        .refine((data) => data.scholarId || data.employeeId, {
          message: "Either scholarId or employeeId is required",
        })
        .parse(req.body);

      let user;
      if (input.scholarId) {
        user = await storage.getUserByScholarId(input.scholarId);
      } else if (input.employeeId) {
        user = await storage.getUserByEmployeeId(input.employeeId);
      }

      if (!user) {
        throw unauthorized("Invalid ID or password");
      }

      let passwordValid = await verifyPassword(input.password, user.password);
      if (!passwordValid && user.password === input.password) {
        await storage.updateUser(user.id, { password: input.password });
        passwordValid = true;
      }

      if (!passwordValid) {
        throw unauthorized("Invalid ID or password");
      }

      req.session.userId = user.id;
      const { password: _, ...userWithoutPassword } = user;
      const userWithUsername = {
        ...userWithoutPassword,
        username:
          (user as any).employeeId || (user as any).scholarId || user.email,
      };
      res.json(userWithUsername);
    } catch (error) {
      return handleRouteError(res, error, "Invalid input");
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      if (!req.session.userId) {
        throw unauthorized("Not authenticated");
      }
      const user = await storage.getUserWithScholar(req.session.userId);
      if (!user) {
        throw notFound("User not found");
      }
      const { password: _, ...userWithoutPassword } = user;
      const userWithUsername = {
        ...userWithoutPassword,
        username: (user as any).employeeId || (user as any).scholarId || user.email,
      };
      res.json(userWithUsername);
    } catch (error) {
      return handleRouteError(res, error);
    }
  });
}
