import type { Express } from "express";
import { api } from "../../shared/routes.js";
import { storage, verifyPassword } from "../storage";
import { handleRouteError, notFound, unauthorized, badRequest } from "./http";
import { buildGoogleAuthState, buildGoogleAuthUrl, exchangeGoogleCodeForToken, verifyGoogleUserInfo } from "../auth/google-oauth.js";

interface AuthIdentity {
  id: number;
  email: string;
  password: string;
  scholarId?: string | null;
  employeeId?: string | null;
}

function getUsername(user: Pick<AuthIdentity, "employeeId" | "scholarId" | "email">): string {
  return user.employeeId ?? user.scholarId ?? user.email;
}

async function verifyAndMigrateLegacyPassword(
  user: Pick<AuthIdentity, "id" | "password">,
  inputPassword: string,
): Promise<boolean> {
  const isValid = await verifyPassword(inputPassword, user.password);
  if (isValid) {
    return true;
  }

  if (user.password !== inputPassword) {
    return false;
  }

  await storage.updateUser(user.id, { password: inputPassword });
  return true;
}

export function registerAuthRoutes(app: Express): void {
  app.get(api.auth.google.start.path, (req, res) => {
    try {
      const state = buildGoogleAuthState();
      req.session.oauthState = state;
      const authUrl = buildGoogleAuthUrl(state);
      return res.redirect(authUrl);
    } catch (error) {
      return handleRouteError(res, error);
    }
  });

  app.get(api.auth.google.callback.path, async (req, res) => {
    try {
      const state = String(req.query.state ?? "");
      const code = String(req.query.code ?? "");

      if (!state || !code) {
        throw badRequest("Missing Google OAuth state or authorization code.");
      }

      if (state !== req.session.oauthState) {
        throw unauthorized("Invalid OAuth state.");
      }

      req.session.oauthState = undefined;
      const tokenData = await exchangeGoogleCodeForToken(code);
      const googleUser = await verifyGoogleUserInfo(tokenData.access_token);
      const user = await storage.getUserByEmail(googleUser.email);

      if (!user) {
        throw unauthorized("No application account is associated with this Google account.");
      }

      req.session.userId = user.id;
      return res.redirect("/");
    } catch (error) {
      return handleRouteError(res, error);
    }
  });

  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);

      let user;
      if (input.scholarId) {
        user = await storage.getUserByScholarId(input.scholarId);
      } else if (input.employeeId) {
        user = await storage.getUserByEmployeeId(input.employeeId);
      } else if (input.email) {
        user = await storage.getUserByEmail(input.email);
      }

      if (!user) {
        throw unauthorized("Invalid credentials");
      }

      const passwordValid = await verifyAndMigrateLegacyPassword(user, input.password);

      if (!passwordValid) {
        throw unauthorized("Invalid ID or password");
      }

      req.session.userId = user.id;
      const { password: _, ...userWithoutPassword } = user;
      const userWithUsername = {
        ...userWithoutPassword,
        username: getUsername(user),
      };
      res.json(userWithUsername);
    } catch (error) {
      return handleRouteError(res, error, "Invalid input");
    }
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get(api.auth.me.path, async (req, res) => {
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
        username: getUsername(user),
      };
      res.json(userWithUsername);
    } catch (error) {
      return handleRouteError(res, error);
    }
  });
}
