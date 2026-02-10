import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertUser } from "@shared/schema";
import { ApiError, apiJson } from "@/lib/api";

// GET /api/users/:id
export function useUser(id?: number | string) {
  return useQuery({
    queryKey: [api.users.get.path, id],
    queryFn: async () => {
      if (id === undefined || id === null) {
        throw new Error("Cannot fetch user profile without an authenticated user id.");
      }

      const url = buildUrl(api.users.get.path, { id });
      try {
        const data = await apiJson(url, { method: api.users.get.method });
        return api.users.get.responses[200].parse(data);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: id !== undefined && id !== null,
  });
}

// PUT /api/users/:id
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertUser>) => {
      const url = buildUrl(api.users.update.path, { id });
      const validated = api.users.update.input.parse(updates);
      const data = await apiJson(url, {
        method: api.users.update.method,
        body: validated,
      });

      return api.users.update.responses[200].parse(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.users.get.path] });
      queryClient.invalidateQueries({ queryKey: [api.users.get.path, data.id] });
    },
  });
}
