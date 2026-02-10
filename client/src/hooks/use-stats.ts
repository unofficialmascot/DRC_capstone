import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { apiJson } from "@/lib/api";

export function useStats(userId: number) {
  return useQuery({
    queryKey: [api.stats.get.path, userId],
    queryFn: async () => {
      const url = buildUrl(api.stats.get.path, { userId });
      const data = await apiJson(url, { method: api.stats.get.method });
      return api.stats.get.responses[200].parse(data);
    },
    enabled: !!userId,
  });
}
