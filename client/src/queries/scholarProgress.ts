import type {
  AuditLogEntry,
  DocumentRecord,
  ProgressionSummaryEntry,
  ReviewCycle,
} from "@/types/gscholar";
import {
  auditTimelineFixture,
  documentRecordsFixture,
  progressionSummaryFixture,
  reviewCyclesFixture,
} from "@/fixtures/scholarProgress";

const simulateFetch = async <T,>(data: T): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), 200);
  });
};

export const fetchProgressionSummary = async (): Promise<ProgressionSummaryEntry[]> => {
  return simulateFetch(progressionSummaryFixture);
};

export const fetchReviewCycles = async (): Promise<ReviewCycle[]> => {
  return simulateFetch(reviewCyclesFixture);
};

export const fetchDocumentRecords = async (): Promise<DocumentRecord[]> => {
  return simulateFetch(documentRecordsFixture);
};

export const fetchAuditTimeline = async (): Promise<AuditLogEntry[]> => {
  return simulateFetch(auditTimelineFixture);
};
