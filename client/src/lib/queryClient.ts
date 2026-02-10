import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { apiJson, apiRequest as coreApiRequest } from "@/lib/api";

type UnauthorizedBehavior = "returnNull" | "throw";

// Backward-compatible wrapper for existing call sites.
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  return coreApiRequest(url, {
    method,
    body: data,
  });
}

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      return await apiJson<T>(queryKey.join("/") as string);
    } catch (error: any) {
      if (unauthorizedBehavior === "returnNull" && error?.status === 401) {
        return null;
      }
      throw error;
    }
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
