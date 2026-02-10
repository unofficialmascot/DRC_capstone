import { useQuery } from "@tanstack/react-query";
import type {
  AuditLogEntry,
  DocumentRecord,
  ProgressionSummaryEntry,
  ReviewCycle,
} from "@/types/gscholar";
import {
  fetchAuditTimeline,
  fetchDocumentRecords,
  fetchProgressionSummary,
  fetchReviewCycles,
} from "@/queries/scholarProgress";

export const useProgressionSummary = () =>
  useQuery<ProgressionSummaryEntry[]>({
    queryKey: ["/api/scholars/progression"],
    queryFn: fetchProgressionSummary,
  });

export const useReviewCycles = () =>
  useQuery<ReviewCycle[]>({
    queryKey: ["/api/scholars/reviews"],
    queryFn: fetchReviewCycles,
  });

export const useDocumentRecords = () =>
  useQuery<DocumentRecord[]>({
    queryKey: ["/api/scholars/documents"],
    queryFn: fetchDocumentRecords,
  });

export const useAuditTimeline = () =>
  useQuery<AuditLogEntry[]>({
    queryKey: ["/api/scholars/audit"],
    queryFn: fetchAuditTimeline,
  });
