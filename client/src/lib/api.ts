import { buildUrl } from "@shared/routes";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  includeCredentials?: boolean;
};

async function parseError(res: Response) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const payload = await res.json();
    const message =
      typeof payload?.message === "string"
        ? payload.message
        : `${res.status}: ${res.statusText || "Request failed"}`;

    throw new ApiError(message, res.status, payload);
  }

  const text = await res.text();
  throw new ApiError(text || `${res.status}: ${res.statusText || "Request failed"}`, res.status);
}

export async function apiRequest(path: string, options: ApiRequestOptions = {}): Promise<Response> {
  const { body, headers, includeCredentials = true, ...rest } = options;

  const finalHeaders = new Headers(headers || {});
  const hasBody = body !== undefined;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  if (hasBody && !isFormData && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }

  const res = await fetch(path, {
    ...rest,
    headers: finalHeaders,
    body: hasBody ? (isFormData ? (body as BodyInit) : JSON.stringify(body)) : undefined,
    credentials: includeCredentials ? "include" : "omit",
  });

  if (!res.ok) {
    await parseError(res);
  }

  return res;
}

export async function apiJson<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const res = await apiRequest(path, options);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function buildApiPath(path: string, params?: Record<string, string | number>) {
  return buildUrl(path, params);
}
