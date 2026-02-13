import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertUser } from "@shared/schema";

export interface SupervisorOption {
  employeeId: string;
  name: string;
  department?: string | null;
  designation?: string | null;
}

// GET /api/users/:id
export function useUser(id?: number | string) {
  return useQuery({
    queryKey: [api.users.get.path, id],
    queryFn: async () => {
      // If no ID provided, we might want to fetch "me" or handle it in a real auth system
      // For now, we'll assume ID 1 is the demo user if undefined, or fail gracefully
      const targetId = id || 1; 
      const url = buildUrl(api.users.get.path, { id: targetId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Failed to fetch user");
      }
      return api.users.get.responses[200].parse(await res.json());
    },
    enabled: !!id || id === undefined, // Allow fetching default if no ID
  });
}

// PUT /api/users/:id
export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertUser>) => {
      const url = buildUrl(api.users.update.path, { id });
      const validated = api.users.update.input.parse(updates);
      
      const res = await fetch(url, {
        method: api.users.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update user");
      return api.users.update.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.users.get.path] });
      queryClient.invalidateQueries({ queryKey: [api.users.get.path, data.id] });
    },
  });
}

export function useSupervisors() {
  return useQuery({
    queryKey: ["users", "supervisors"],
    queryFn: async (): Promise<SupervisorOption[]> => {
      const res = await fetch("/api/users/supervisors", { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to fetch supervisors");
      }
      return res.json();
    },
  });
}
