import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertUser } from "@shared/schema";

export interface SupervisorOption {
  employeeId: string;
  name: string;
  department?: string | null;
  designation?: string | null;
}

export interface AssignedScholarSummary {
  scholarId: string;
  name: string;
  department?: string | null;
  researchArea?: string | null;
  phase?: string | null;
  status?: string | null;
}

// GET /api/users/:id
export function useUser(id: number | string) {
  return useQuery({
    queryKey: [api.users.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.users.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Failed to fetch user");
      }
      return api.users.get.responses[200].parse(await res.json());
    },
    enabled: true,
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

export function useSupervisorScholarCount(employeeId?: string | null) {
  return useQuery({
    queryKey: ["users", "supervisors", employeeId, "scholars-count"],
    queryFn: async (): Promise<number> => {
      const res = await fetch(`/api/users/supervisors/${employeeId}/scholars-count`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch assigned scholar count");
      }
      const data = (await res.json()) as { count: number };
      return Number(data.count || 0);
    },
    enabled: Boolean(employeeId),
  });
}

export function useAssignedScholars(employeeId?: string | null) {
  return useQuery({
    queryKey: ["users", "supervisors", employeeId, "scholars"],
    queryFn: async (): Promise<AssignedScholarSummary[]> => {
      const res = await fetch(`/api/users/supervisors/${employeeId}/scholars`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch assigned scholars");
      }
      return res.json();
    },
    enabled: Boolean(employeeId),
  });
}
