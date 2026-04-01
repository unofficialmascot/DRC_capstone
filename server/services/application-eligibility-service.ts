import type { Application, Document, Scholar } from "@shared/schema";
import { storage } from "../storage";

export type EligibilityMode = "advisory" | "enforced";

export interface EligibilityReason {
  code: string;
  message: string;
}

export interface ApplicationEligibilityItem {
  applicationType: string;
  eligible: boolean;
  mode: EligibilityMode;
  reasons: EligibilityReason[];
}

export interface ApplicationEligibilityResult {
  mode: EligibilityMode;
  items: ApplicationEligibilityItem[];
  generatedAt: string;
}

export const SUPPORTED_APPLICATION_TYPES = [
  "Supervisor Change",
  "Pre-Talk",
  "Extension",
  "Re-Registration",
  "Thesis Submission",
] as const;

const DEFAULT_MODE: EligibilityMode = "advisory";

export interface ScholarEligibilityData {
  profile?: Partial<Scholar>;
  progress?: {
    completedReviews?: number | null;
    pendingReports?: number | null;
    publications?: number | null;
    lastReviewDate?: Date | null;
  };
  documents: Document[];
  priorApplications: Application[];
}

interface RuleEvaluationContext {
  scholarId: string;
  applicationType: string;
  data: ScholarEligibilityData;
}

type EligibilityRule = (context: RuleEvaluationContext) => EligibilityReason | null;

type EligibilityDataLoader = (scholarId: string) => Promise<ScholarEligibilityData>;

const MAX_TOTAL_EXTENSION_MONTHS = 24;
const ACTIVE_APPLICATION_STATUSES = new Set(["Pending", "Awaiting"]);

const hasVerifiedDocument = (documentTypes: string[]): EligibilityRule => ({ data }) => {
  const hasVerified = data.documents.some(
    (document) => documentTypes.includes(document.documentType) && Boolean(document.isVerified),
  );

  if (hasVerified) {
    return null;
  }

  return {
    code: "MISSING_VERIFIED_DOCUMENTS",
    message: "At least one verified document is required before submitting this application.",
  };
};

const mustNotHaveActiveSameTypeApplication: EligibilityRule = ({ data, scholarId, applicationType }) => {
  const hasActiveSameType = data.priorApplications.some(
    (application) =>
      application.scholarId === scholarId &&
      application.type === applicationType &&
      ACTIVE_APPLICATION_STATUSES.has(application.status),
  );

  if (!hasActiveSameType) {
    return null;
  }

  return {
    code: "ACTIVE_APPLICATION_EXISTS",
    message: "You already have an active application of this type.",
  };
};

const mustHaveMinimumReviews: EligibilityRule = ({ data }) => {
  const completedReviews = Number(data.progress?.completedReviews ?? 0);
  if (completedReviews >= 1) {
    return null;
  }

  return {
    code: "INSUFFICIENT_REVIEWS",
    message: "At least one completed review is required.",
  };
};

const mustHaveNoPendingReports: EligibilityRule = ({ data }) => {
  const pendingReports = Number(data.progress?.pendingReports ?? 0);
  if (pendingReports === 0) {
    return null;
  }

  return {
    code: "PENDING_REPORTS_EXIST",
    message: "All pending reports must be cleared before applying.",
  };
};

const mustHavePublication: EligibilityRule = ({ data }) => {
  const publications = Number(data.progress?.publications ?? 0);
  if (publications >= 1) {
    return null;
  }

  return {
    code: "PUBLICATION_REQUIRED",
    message: "At least one publication is required for this application.",
  };
};

const mustBeActiveScholar: EligibilityRule = ({ data }) => {
  if (data.profile?.lifecycleStatus === "Active") {
    return null;
  }

  return {
    code: "SCHOLAR_NOT_ACTIVE",
    message: "Only active scholars are eligible for this application type.",
  };
};

const mustNotExceedExtensionLimit: EligibilityRule = ({ data }) => {
  const extensionMonthsGranted = Number(data.profile?.extensionMonthsGranted ?? 0);
  if (extensionMonthsGranted < MAX_TOTAL_EXTENSION_MONTHS) {
    return null;
  }

  return {
    code: "MAX_EXTENSION_REACHED",
    message: `Maximum extension limit of ${MAX_TOTAL_EXTENSION_MONTHS} months has been reached.`,
  };
};

const RULE_SETS: Record<string, EligibilityRule[]> = {
  "Supervisor Change": [mustBeActiveScholar, hasVerifiedDocument(["resume"])],
  "Pre-Talk": [
    mustBeActiveScholar,
    mustHaveMinimumReviews,
    mustHaveNoPendingReports,
    hasVerifiedDocument(["progress_report", "coursework_marks_memo"]),
    mustNotHaveActiveSameTypeApplication,
  ],
  Extension: [
    mustBeActiveScholar,
    mustNotExceedExtensionLimit,
    hasVerifiedDocument(["progress_report", "journal_publication_proofs"]),
    mustNotHaveActiveSameTypeApplication,
  ],
  "Re-Registration": [mustBeActiveScholar, mustHaveNoPendingReports, mustNotHaveActiveSameTypeApplication],
  "Thesis Submission": [
    mustBeActiveScholar,
    mustHavePublication,
    hasVerifiedDocument(["thesis_draft", "plagiarism_report"]),
    mustNotHaveActiveSameTypeApplication,
  ],
};

async function loadScholarEligibilityData(scholarId: string): Promise<ScholarEligibilityData> {
  const [profile, progress, documents, priorApplications] = await Promise.all([
    storage.getUserByScholarId(scholarId),
    storage.getResearchProgress(scholarId),
    storage.getDocuments(scholarId),
    storage.getApplications(scholarId),
  ]);

  return {
    profile,
    progress,
    documents,
    priorApplications,
  };
}

function evaluateRulesForType(
  applicationType: string,
  context: RuleEvaluationContext,
): EligibilityReason[] {
  const rules = RULE_SETS[applicationType] ?? [];
  return rules.map((rule) => rule(context)).filter((reason): reason is EligibilityReason => Boolean(reason));
}

function resolveItemEligibility(mode: EligibilityMode, reasons: EligibilityReason[]): boolean {
  if (mode === "advisory") {
    return true;
  }

  return reasons.length === 0;
}

export async function evaluateScholarApplicationEligibility(input: {
  scholarId: string;
  mode?: EligibilityMode;
  dataLoader?: EligibilityDataLoader;
}): Promise<ApplicationEligibilityResult> {
  const mode = input.mode ?? DEFAULT_MODE;
  const data = await (input.dataLoader ?? loadScholarEligibilityData)(input.scholarId);

  const items: ApplicationEligibilityItem[] = SUPPORTED_APPLICATION_TYPES.map(
    (applicationType) => {
      const reasons = evaluateRulesForType(applicationType, {
        scholarId: input.scholarId,
        applicationType,
        data,
      });

      return {
        applicationType,
        eligible: resolveItemEligibility(mode, reasons),
        mode,
        reasons,
      };
    },
  );

  return {
    mode,
    items,
    generatedAt: new Date().toISOString(),
  };
}

export function getEligibilityForApplicationType(
  eligibility: ApplicationEligibilityResult,
  applicationType: string,
): ApplicationEligibilityItem | undefined {
  return eligibility.items.find((item) => item.applicationType === applicationType);
}
