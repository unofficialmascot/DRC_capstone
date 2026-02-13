import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export interface ReviewInput {
  reviewerId: string;
  decision: "approved" | "rejected";
  remarks: string;
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
  return useQuery({
    queryKey: ["applications", "stage", stage],
    queryFn: async () => {
      const res = await fetch(`/api/applications/stage/${stage}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch applications");
      return res.json();
    },
    enabled: !!stage, // Only fetch if stage is provided
  });
}
