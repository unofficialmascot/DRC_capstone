import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { Notice } from "@shared/schema";

export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async (): Promise<Notice[]> => {
      const res = await fetch(api.notifications.list.path, {
        credentials: "include",
      });

      const contentType = res.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        throw new Error(
          "Notifications endpoint is unavailable. Restart the dev server and try again.",
        );
      }

      if (!res.ok) {
        let message = "Failed to fetch notifications";
        try {
          const body = await res.json();
          if (body && typeof body.message === "string") {
            message = body.message;
          }
        } catch {
          // Keep default message when response body is not valid JSON.
        }

        throw new Error(message);
      }

      return res.json();
    },
    enabled,
  });
}

export function useClearNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<{ cleared: number }> => {
      const res = await fetch(api.notifications.clearAll.path, {
        method: api.notifications.clearAll.method,
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to clear notifications");
      }

      return api.notifications.clearAll.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useClearNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: number): Promise<{ cleared: boolean }> => {
      const path = buildUrl(api.notifications.clearOne.path, { id: notificationId });
      const res = await fetch(path, {
        method: api.notifications.clearOne.method,
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to clear notification");
      }

      return api.notifications.clearOne.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
