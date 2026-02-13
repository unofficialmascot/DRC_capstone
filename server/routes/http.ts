import type { Response } from "express";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function badRequest(message: string, details?: unknown): ApiError {
  return new ApiError(400, message, details);
}

export function unauthorized(message: string): ApiError {
  return new ApiError(401, message);
}

export function forbidden(message: string): ApiError {
  return new ApiError(403, message);
}

export function notFound(message: string): ApiError {
  return new ApiError(404, message);
}

export function parseIdParam(value: string, fieldName = "id"): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw badRequest(`Invalid ${fieldName}`);
  }
  return parsed;
}

export function handleRouteError(
  res: Response,
  error: unknown,
  fallbackMessage = "Internal Server Error",
) {
  if (error instanceof ApiError) {
    const responseBody: Record<string, unknown> = { message: error.message };
    if (error.details !== undefined) {
      responseBody.errors = error.details;
    }
    return res.status(error.status).json(responseBody);
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      message: error.issues[0]?.message ?? "Invalid input",
      errors: error.issues,
    });
  }

  const message = error instanceof Error ? error.message : fallbackMessage;
  return res.status(500).json({ message });
}
