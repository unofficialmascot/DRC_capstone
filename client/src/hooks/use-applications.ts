import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertApplication } from "@shared/schema";

export function useApplications(scholarId?: string) {
  return useQuery({
    queryKey: [api.applications.list.path, scholarId],
    queryFn: async () => {
      let url = api.applications.list.path;
      if (scholarId) {
        url += `?scholarId=${scholarId}`;
      }
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch applications");
      return api.applications.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertApplication) => {
      console.log("Creating application with data:", data);
      const validated = api.applications.create.input.parse(data);
      console.log("Validated data:", validated);
      const res = await fetch(api.applications.create.path, {
        method: api.applications.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Failed to create application" }));
        console.error("Server error response:", error);
        if (error.errors && Array.isArray(error.errors)) {
          const errorMessages = error.errors.map((e: any) => `${e.path?.join('.')}: ${e.message}`).join(', ');
          throw new Error(errorMessages || error.message);
        }
        throw new Error(error.message || "Failed to create application");
      }
      return api.applications.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.applications.list.path] });
    },
  });
}
