import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { apiRequest } from "@/lib/queryClient";
import type { InsertApplication } from "@shared/schema";

export function useApplications(scholarId?: string) {
  return useQuery({
    queryKey: [api.applications.list.path, scholarId],
    queryFn: async () => {
      const url = scholarId
        ? `${api.applications.list.path}?${new URLSearchParams({ scholarId }).toString()}`
        : api.applications.list.path;
      const res = await apiRequest({ method: api.applications.list.method, url });
      return api.applications.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertApplication) => {
      const validated = api.applications.create.input.parse(data);
      const res = await apiRequest({
        method: api.applications.create.method,
        url: api.applications.create.path,
        body: validated,
      });
      return api.applications.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.applications.list.path] });
    },
  });
}
