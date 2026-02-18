import { QueryClient, QueryFunction } from "@tanstack/react-query";

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

type ApiRequestOptions = {
  method: string;
  url: string;
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
  credentials?: RequestCredentials;
};

async function throwIfResNotOk(res: Response) {
  if (res.ok) {
    return;
  }

  const contentType = res.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const json = await res.json().catch(() => null);
    if (json && typeof json === "object") {
      const payload = json as Record<string, unknown>;
      const message =
        typeof payload.message === "string"
          ? payload.message
          : `${res.status}: ${res.statusText}`;
      throw new ApiClientError(res.status, message, payload);
    }
  }

  const text = (await res.text()) || res.statusText;
  throw new ApiClientError(res.status, `${res.status}: ${text}`);
}

export async function apiRequest({
  method,
  url,
  body,
  headers,
  signal,
  credentials = "include",
}: ApiRequestOptions): Promise<Response> {
  const requestHeaders: HeadersInit = {
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(headers ?? {}),
  };

  const res = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials,
    signal,
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
