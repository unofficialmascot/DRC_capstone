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

  if (error instanceof Error) {
    return {
      status: fallbackStatus,
      body: { message: error.message },
    };
  }

  return {
    status: fallbackStatus,
    body: { message: "Unknown error" },
  };
}
