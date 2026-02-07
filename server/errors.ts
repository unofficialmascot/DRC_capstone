export class AppError extends Error {
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    status = 500,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function toErrorResponse(error: unknown, fallbackStatus = 500) {
  if (error instanceof AppError) {
    return {
      status: error.status,
      body: error.details
        ? { message: error.message, details: error.details }
        : { message: error.message },
    };
  }

  const normalized = normalizeUnknownError(error, fallbackStatus);
  return {
    status: normalized.status,
    body: normalized.details
      ? { message: normalized.message, details: normalized.details }
      : { message: normalized.message },
  };
}

type NormalizedError = {
  status: number;
  message: string;
  details?: Record<string, unknown>;
};

function normalizeUnknownError(
  error: unknown,
  fallbackStatus: number,
): NormalizedError {
  if (!isRecord(error)) {
    return {
      status: fallbackStatus,
      message: "Unknown error",
    };
  }

  const details: Record<string, unknown> = {};
  const status =
    resolveStatus(error.statusCode) ??
    resolveStatus(error.code) ??
    fallbackStatus;

  if (typeof error.statusCode === "number") {
    details.statusCode = error.statusCode;
  }

  if (typeof error.code === "string" || typeof error.code === "number") {
    details.code = error.code;
  }

  if (Array.isArray(error.issues)) {
    const validationIssues = error.issues
      .filter((issue) => isRecord(issue))
      .map((issue) => ({
        code: typeof issue.code === "string" ? issue.code : undefined,
        message: typeof issue.message === "string" ? issue.message : undefined,
        path: Array.isArray(issue.path)
          ? issue.path.filter(
              (segment) =>
                typeof segment === "string" || typeof segment === "number",
            )
          : undefined,
      }))
      .map((issue) =>
        Object.fromEntries(
          Object.entries(issue).filter(([, value]) => value !== undefined),
        ),
      )
      .filter((issue) => Object.keys(issue).length > 0);

    if (validationIssues.length > 0) {
      details.validationIssues = validationIssues;
    }
  }

  const message = typeof error.message === "string" ? error.message : "Unknown error";
  return Object.keys(details).length > 0
    ? { status, message, details }
    : { status, message };
}

function resolveStatus(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value >= 100 && value <= 599 ? value : undefined;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed >= 100 && parsed <= 599) {
      return parsed;
    }
  }

  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
