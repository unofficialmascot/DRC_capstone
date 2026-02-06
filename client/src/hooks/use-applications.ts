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
    enabled: !!scholarId, // Only fetch when we have a scholarId
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertApplication) => {
      try {
        const validated = api.applications.create.input.parse(data);
        console.log("Submitting application:", validated);
        
        const res = await fetch(api.applications.create.path, {
          method: api.applications.create.method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validated),
          credentials: "include",
        });

        const responseData = await res.json();
        
        if (!res.ok) {
          console.error("Server error:", responseData);
          throw new Error(responseData.message || `Failed: ${res.status}`);
        }
        
        console.log("Application created:", responseData);
        return api.applications.create.responses[201].parse(responseData);
      } catch (error: any) {
        console.error("Application mutation error:", error.message || error);
        throw error;
      }
    },
    onSuccess: (newApp) => {
      console.log("Application saved, invalidating queries");
      // Invalidate both generic and specific scholar queries
      queryClient.invalidateQueries({ queryKey: [api.applications.list.path] });
    },
  });
}
