import type { Express } from "express";
import { api } from "../../shared/routes.js";
import { storage } from "../storage";
import { handleRouteError, notFound, parseIdParam, unauthorized } from "./http";

export function registerApplicationRoutes(app: Express): void {
  app.get(api.applications.list.path, async (req, res) => {
    try {
      const scholarId = req.query.scholarId ? String(req.query.scholarId) : undefined;
      const apps = await storage.getApplications(scholarId);
      res.json(apps);
    } catch (error) {
      return handleRouteError(res, error);
    }
  });

  app.get("/api/applications/stage/:stage", async (req, res) => {
    try {
      const stage = req.params.stage;

      if (stage === "supervisor") {
        if (!req.session.userId) {
          throw unauthorized("Not authenticated");
        }

        const user = await storage.getUser(req.session.userId);
        if (!user) {
          throw notFound("User not found");
        }

        if (user.role === "supervisor") {
          return res.json([]);
        }
      }

      const apps = await storage.getApplicationsByStage(stage);
      res.json(apps);
    } catch (error) {
      return handleRouteError(res, error);
    }
  });

  app.get("/api/applications/:id", async (req, res) => {
    try {
      const applicationId = parseIdParam(req.params.id, "application id");
      const appById = await storage.getApplicationById(applicationId);
      if (!appById) {
        throw notFound("Application not found");
      }
      res.json(appById);
    } catch (error) {
      return handleRouteError(res, error);
    }
  });

  app.post(api.applications.create.path, async (req, res) => {
    try {
      const input = api.applications.create.input.parse(req.body);
      const newApp = await storage.createApplication({
        ...input,
        currentStage: "supervisor",
        status: "Pending",
      });
      res.status(201).json(newApp);
    } catch (error) {
      return handleRouteError(res, error, "Invalid input");
    }
  });
}
