import type { Express, Request, Response } from "express";
import { api } from "../../shared/routes.js";
import { userService } from "../services";

export function registerUserRoutes(
  app: Express,
  respondWithError: (
    req: Request,
    res: Response,
    error: unknown,
    fallbackStatus?: number,
  ) => Response,
) {
  app.get(api.users.get.path, async (req, res) => {
    try {
      const user = await userService.getUserById(Number(req.params.id));
      res.json(user);
    } catch (error: unknown) {
      respondWithError(req, res, error, 404);
    }
  });

  app.get("/api/users", async (req, res) => {
    try {
      const users = await userService.getAllUsers();
      res.json(users);
    } catch (error: unknown) {
      respondWithError(req, res, error, 500);
    }
  });

  app.put(api.users.update.path, async (req, res) => {
    try {
      const updates = api.users.update.input.parse(req.body);
      const updatedUser = await userService.updateUser(
        Number(req.params.id),
        updates,
      );
      res.json(updatedUser);
    } catch (error: unknown) {
      respondWithError(req, res, error, 400);
    }
  });
}
