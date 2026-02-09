import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useStats(userId: number) {
  return useQuery({
    queryKey: [api.stats.get.path, userId],
    queryFn: async () => {
      const url = buildUrl(api.stats.get.path, { userId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return api.stats.get.responses[200].parse(await res.json());
    },
    enabled: !!userId,
  });
}
