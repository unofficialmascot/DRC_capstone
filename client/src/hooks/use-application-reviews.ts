import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type {
  Application,
  DrcAgendaPoint,
  DrcChairmanDecision,
  DrcMeeting,
  DrcMeetingMinutes,
  DrcMinuteItem,
  Notice,
} from "@shared/schema";

export interface ReviewInput {
  reviewerId: string;
  decision: "approved" | "rejected";
  remarks: string;
}

export interface ScheduleMeetingInput {
  meetingDate: string;
  extraPoints?: string[];
}

export interface DrcMeetingAgenda {
  meeting: DrcMeeting;
  applications: Application[];
  extraPoints: DrcAgendaPoint[];
}

export interface ChairmanMinutesMeeting {
  meeting: DrcMeeting;
  minutes: DrcMeetingMinutes;
}

export interface ChairmanMinuteItem extends DrcMinuteItem {
  application: Application | null;
  chairmanDecision: DrcChairmanDecision | null;
}

export interface ChairmanMinutesDetails {
  meeting: DrcMeeting;
  minutes: DrcMeetingMinutes;
  items: ChairmanMinuteItem[];
}

export type ChairmanDashboardCategory =
  | "total"
  | "awarded"
  | "thesis_submitted"
  | "deregistered"
  | "terminated"
  | "re_registered"
  | "pre_talk_pending"
  | "extension_requests";

export interface ChairmanDashboardRow {
  scholarId: string;
  scholarName: string;
  department: string | null;
  status: string;
}

export interface ChairmanDashboardMetrics {
  total: number;
  awarded: number;
  thesisSubmitted: number;
  deregistered: number;
  terminated: number;
  reRegistered: number;
  preTalkPending: number;
  extensionRequests: number;
}

export interface ChairmanDashboardResponse {
  activeCategory: ChairmanDashboardCategory;
  metrics: ChairmanDashboardMetrics;
  rows: ChairmanDashboardRow[];
}

export function getReviewStageForRole(role: string): string {
  if (role === "drc_convener") {
    return "drc";
  }

  return role;
}

export function useApplicationReviews(applicationId: number) {
  return useQuery({
    queryKey: ["application-reviews", applicationId],
    queryFn: async () => {
      const path = buildUrl(api.applications.reviews.path, { id: applicationId });
      const res = await fetch(path, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch reviews");
      return api.applications.reviews.responses[200].parse(await res.json());
    },
  });
}

export function useSubmitReview(applicationId: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: ReviewInput) => {
      const path = buildUrl(api.applications.review.path, { id: applicationId });
      const validatedInput = api.applications.review.input.parse(input);
      const res = await fetch(path, {
        method: api.applications.review.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validatedInput),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to submit review");
      }
      
      return api.applications.review.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["application-reviews", applicationId] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}

export function useApplicationById(applicationId: number) {
  return useQuery({
    queryKey: ["application", applicationId],
    queryFn: async () => {
      const path = buildUrl(api.applications.get.path, { id: applicationId });
      const res = await fetch(path, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch application");
      return api.applications.get.responses[200].parse(await res.json());
    },
    enabled: applicationId > 0,
  });
}

export function useApplicationsByStage(stage: string, enabled = true) {
  const normalizedStage = getReviewStageForRole(stage);

  return useQuery({
    queryKey: ["applications", "stage", normalizedStage],
    queryFn: async () => {
      const path = buildUrl(api.applications.getByStage.path, { stage: normalizedStage });
      const res = await fetch(path, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch applications");
      return api.applications.getByStage.responses[200].parse(await res.json());
    },
    enabled: !!normalizedStage && enabled, // Only fetch if stage is provided and query is enabled
  });
}

export function useScheduleDrcMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ScheduleMeetingInput): Promise<DrcMeetingAgenda> => {
      const res = await fetch(api.drcMeetings.schedule.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to schedule DRC meeting");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications", "stage", "drc"] });
      queryClient.invalidateQueries({ queryKey: ["drc-meetings", "open"] });
    },
  });
}

export function useOpenDrcMeeting(enabled = true) {
  return useQuery({
    queryKey: ["drc-meetings", "open"],
    queryFn: async (): Promise<DrcMeetingAgenda | null> => {
      const res = await fetch(api.drcMeetings.getOpen.path, {
        credentials: "include",
      });

      if (!res.ok) {
        let message = "Failed to fetch open DRC meeting";
        try {
          const body = await res.json();
          if (body && typeof body.message === "string") {
            message = body.message;
          }
        } catch {
          // Keep default message if response payload is not parseable JSON.
        }
        throw new Error(message);
      }

      return res.json();
    },
    enabled,
  });
}

export function useCloseDrcMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (meetingId: number): Promise<DrcMeetingAgenda> => {
      const path = api.drcMeetings.close.path.replace(":id", String(meetingId));
      const res = await fetch(path, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to close DRC meeting");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drc-meetings", "open"] });
    },
  });
}

export function useDrcMeetingsList(enabled = true) {
  return useQuery({
    queryKey: ["drc-meetings", "list"],
    queryFn: async (): Promise<DrcMeeting[]> => {
      const res = await fetch(api.drcMeetings.list.path, {
        credentials: "include",
      });

      if (!res.ok) {
        let message = "Failed to fetch DRC meetings";
        try {
          const body = await res.json();
          if (body && typeof body.message === "string") {
            message = body.message;
          }
        } catch {
          // Keep default message if response payload is not parseable JSON.
        }
        throw new Error(message);
      }

      return res.json();
    },
    enabled,
  });
}

export function useDrcMeetingNotifications(enabled = true) {
  return useQuery({
    queryKey: ["drc-meetings", "notifications"],
    queryFn: async (): Promise<Notice[]> => {
      const res = await fetch(api.drcMeetings.notifications.path, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch meeting notifications");
      }

      return res.json();
    },
    enabled,
  });
}

export function useClearDrcMeetingNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<{ cleared: number }> => {
      const res = await fetch(api.drcMeetings.clearNotifications.path, {
        method: api.drcMeetings.clearNotifications.method,
        credentials: "include",
      });

      const contentType = res.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        throw new Error(
          "Notification clear endpoint is unavailable. Restart the dev server and try again.",
        );
      }

      if (!res.ok) {
        let message = "Failed to clear meeting notifications";
        try {
          const body = await res.json();
          if (body && typeof body.message === "string") {
            message = body.message;
          }
        } catch {
          // Keep default message when the error payload is not JSON.
        }

        throw new Error(message);
      }

      return api.drcMeetings.clearNotifications.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drc-meetings", "notifications"] });
    },
  });
}

export function useChairmanMinutesMeetings(enabled = true) {
  return useQuery({
    queryKey: ["drc-chairman", "minutes"],
    queryFn: async (): Promise<ChairmanMinutesMeeting[]> => {
      const res = await fetch(api.drcChairman.listMinutes.path, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch chairman minutes list");
      }

      return res.json();
    },
    enabled,
  });
}

export function useChairmanDashboard(
  category: ChairmanDashboardCategory,
  enabled = true,
) {
  return useQuery({
    queryKey: ["drc-chairman", "dashboard", category],
    queryFn: async (): Promise<ChairmanDashboardResponse> => {
      const params = new URLSearchParams({ category });
      const url = `${api.drcChairman.dashboard.path}?${params.toString()}`;
      const res = await fetch(url, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch chairman dashboard");
      }

      return api.drcChairman.dashboard.responses[200].parse(await res.json());
    },
    enabled,
  });
}

export function useChairmanMinutesDetails(meetingId: number | null, enabled = true) {
  return useQuery({
    queryKey: ["drc-chairman", "minutes", meetingId],
    queryFn: async (): Promise<ChairmanMinutesDetails> => {
      const path = api.drcChairman.getMinutes.path.replace(":meetingId", String(meetingId));
      const res = await fetch(path, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch chairman minutes details");
      }

      return res.json();
    },
    enabled: enabled && Boolean(meetingId),
  });
}

export function useChairmanDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      meetingId: number;
      applicationId: number;
      decision: "approved" | "rejected";
      remarks: string;
    }) => {
      const path = api.drcChairman.decide.path
        .replace(":meetingId", String(input.meetingId))
        .replace(":applicationId", String(input.applicationId));

      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          decision: input.decision,
          remarks: input.remarks,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to submit chairman decision");
      }

      return res.json();
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["drc-chairman", "minutes", variables.meetingId] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["applications", "stage", "drc"] });
      queryClient.invalidateQueries({ queryKey: ["applications", "stage", "irc"] });
    },
  });
}
