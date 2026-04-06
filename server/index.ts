import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { LOGGING_CONFIG } from "./logging-config";
import { seedData } from "./bootstrap/seed-data";

const app = express();
const httpServer = createServer(app);
const isProduction = process.env.NODE_ENV === "production";

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

declare module "express-session" {
  interface SessionData {
    userId: number;
    oauthState?: string;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

if (isProduction) {
  app.set("trust proxy", 1);
}

function resolveSessionSecret(): string {
  if (process.env.SESSION_SECRET) {
    return process.env.SESSION_SECRET;
  }

  if (isProduction) {
    throw new Error("SESSION_SECRET must be set in production");
  }

  return "gscholar-hub-secret-key-2024";
}

const SessionStore = MemoryStore(session);

app.use(
  session({
    secret: resolveSessionSecret(),
    resave: false,
    saveUninitialized: false,
    store: new SessionStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    cookie: {
      secure: isProduction,
      sameSite: "lax",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

function redactForLogging(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactForLogging);
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => {
      if (LOGGING_CONFIG.defaultRedactedKeys.has(key.toLowerCase())) {
        return [key, "[REDACTED]"];
      }
      return [key, redactForLogging(nestedValue)];
    });

    return Object.fromEntries(entries);
  }

  return value;
}

const shouldCaptureResponsePreview = process.env.NODE_ENV !== "production";

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: unknown = undefined;

  if (shouldCaptureResponsePreview) {
    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
  }

  res.on("finish", () => {
    if (!path.startsWith("/api")) {
      return;
    }

    const duration = Date.now() - start;
    let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;

    if (shouldCaptureResponsePreview && capturedJsonResponse !== undefined) {
      const preview = JSON.stringify(redactForLogging(capturedJsonResponse));
      if (preview) {
        const truncated =
          preview.length > LOGGING_CONFIG.responsePreviewMaxLength
            ? `${preview.slice(0, LOGGING_CONFIG.responsePreviewMaxLength)}...`
            : preview;
        logLine += ` :: ${truncated}`;
      }
    }

    log(logLine);
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);
  await seedData();

  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    const typedError = err as { status?: number; statusCode?: number; message?: string };
    const status = typedError.status || typedError.statusCode || 500;
    const message = typedError.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
