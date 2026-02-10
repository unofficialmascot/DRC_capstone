import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, appendQuery } from "@shared/routes";
import type { InsertApplication } from "@shared/schema";
import { apiJson } from "@/lib/api";

export function useApplications(userId?: string) {
  return useQuery({
    queryKey: [api.applications.list.path, userId],
    queryFn: async () => {
      const validatedQuery = api.applications.list.input?.parse({ userId });
      const url = appendQuery(api.applications.list.path, validatedQuery);
      const data = await apiJson(url, { method: api.applications.list.method });
      return api.applications.list.responses[200].parse(data);
    },
    enabled: !!userId,
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InsertApplication) => {
      const validated = api.applications.create.input.parse(data);
      const responseData = await apiJson(api.applications.create.path, {
        method: api.applications.create.method,
        body: validated,
      });

      return api.applications.create.responses[201].parse(responseData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.applications.list.path] });
    },
  });
}
