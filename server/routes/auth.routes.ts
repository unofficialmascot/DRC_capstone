import type { Express, Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../errors";
import { authService } from "../services";

export function registerAuthRoutes(
  app: Express,
  respondWithError: (
    req: Request,
    res: Response,
    error: unknown,
    fallbackStatus?: number,
  ) => Response,
) {
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

      const user = await authService.login(input);
      req.session.userId = user.id;
      res.json(user);
    } catch (error: unknown) {
      respondWithError(req, res, error, 401);
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return respondWithError(req, res, new AppError("Failed to logout", 500), 500);
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      if (!req.session.userId) {
        throw new AppError("Not authenticated", 401);
      }
      const user = await authService.getCurrentUser(req.session.userId);
      res.json(user);
    } catch (error: unknown) {
      respondWithError(req, res, error, 401);
    }
  });
}
