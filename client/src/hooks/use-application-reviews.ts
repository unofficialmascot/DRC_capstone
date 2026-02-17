import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
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
      const res = await fetch(`/api/applications/${applicationId}/reviews`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch reviews");
      return res.json();
    },
  });
}

export function useSubmitReview(applicationId: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: ReviewInput) => {
      const res = await fetch(`/api/applications/${applicationId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to submit review");
      }
      
      return res.json();
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
      const res = await fetch(`/api/applications/${applicationId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch application");
      return res.json();
    },
    enabled: applicationId > 0,
  });
}

export function useApplicationsByStage(stage: string) {
  const normalizedStage = getReviewStageForRole(stage);

  return useQuery({
    queryKey: ["applications", "stage", normalizedStage],
    queryFn: async () => {
      const res = await fetch(`/api/applications/stage/${normalizedStage}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch applications");
      return res.json();
    },
    enabled: !!normalizedStage, // Only fetch if stage is provided
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
        throw new Error("Failed to fetch open DRC meeting");
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
        throw new Error("Failed to fetch DRC meetings");
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
