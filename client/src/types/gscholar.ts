export type ScholarPage =
  | "profile"
  | "application-supervisor"
  | "application-pretalk"
  | "application-extension"
  | "application-reregistration"
  | "application-track"
  | "application-thesis"
  | "research"
  | "fees"
  | "dochub"
  | "noticeboard";

export type ReviewerPage = "dashboard" | "reviews";

export interface User {
  id: number;
  username: string;
  role: string;
  name: string;
  email: string;
  phone?: string;
  scholarId?: string;
  location?: string;
  batch?: string;
  status?: string;
  department?: string;
  supervisor?: string;
  coSupervisor?: string;
  researchArea?: string;
  researchTitle?: string;
  joiningDate?: string;
  phase?: string;
  programme?: string;
  fatherName?: string;
  parentMobile?: string;
  nationality?: string;
  address?: string;
}

export interface Application {
  id: number;
  userId: number;
  type: string;
  status: string;
  currentStage: string;
  submissionDate: string;
  details: Record<string, unknown>;
  finalOutcome: string | null;
}

export interface ApplicationReview {
  id: number;
  applicationId: number;
  reviewerId: number;
  stage: string;
  decision: string;
  remarks: string;
  reviewDate: string;
}

export interface FeeStructureRow {
  feeId: number;
  academicYear: string;
  phase: string;
  batch: string;
  year1Fee?: number | string | null;
  year2Fee?: number | string | null;
  year3Fee?: number | string | null;
  year4Fee?: number | string | null;
}

export interface ProgressionSummaryEntry {
  number: string;
  title: string;
  conductedOn: string;
  rac1: { id: string; name: string };
  rac2: { id: string; name: string };
  documentLabel: string;
  supervisorUploadedOn: string;
  drcApprovalOn: string;
  finalResult: string;
}

export interface ReviewCycle {
  reviewMonthYear: string;
  reviewType: string;
  scholarStatus: string;
  scholarSubmittedOn: string;
  scholarAbsent: string;
  supervisorStatus: string;
  supervisorSubmittedOn: string;
  rac1Status: string;
  rac1SubmittedOn: string;
  rac2Status: string;
  rac2SubmittedOn: string;
  drcStatus: string;
  drcReviewedOn: string;
  outcome: string;
}

export interface DocumentRecord {
  type: string;
  file: string;
  uploadedBy: string;
  uploadedOn: string;
  version: string;
  locked: string;
  visibility: string;
}

export interface AuditLogEntry {
  reviewCycleId: string;
  reviewerRole: string;
  actionTimestamp: string;
  actionPerformed: string;
  remarks: string;
  auditRef: string;
}

export interface EligibilityStatus {
  isEligible: boolean;
  issues: string[];
  warnings: string[];
  details: {
    yearsCompleted: number;
    racMeetingsCount: number;
    hasPreTalk: boolean;
    coursesCompleted: boolean;
    feeArrears: number;
    currentExtensions: number;
    maxAllowedExtensions: number;
  };
}

export type ApplicationFormType = "extension" | "supervisor" | "pretalk" | "reregistration";
