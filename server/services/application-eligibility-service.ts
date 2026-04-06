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

/**
 * A rule entry in a per-application-type rule set. Three forms:
 *
 *   1. `"ruleName"` — looks up the rule by key in RULE_REGISTRY.
 *   2. `EligibilityRule` — an inline function or factory call, e.g.
 *      `minimumRacMeetings(4)` or `requireVerifiedDocs(["thesis_draft"])`.
 *   3. `{ rule, alwaysEnforced: true }` — wraps form 1 or 2 and blocks the
 *      application even when the global mode is "advisory".
 *
 * @example Adding a new application type with zero boilerplate:
 *   "Oral Defense": [
 *     "activeScholar",
 *     minimumRacMeetings(4),
 *     requireVerifiedDocs(["ethics_clearance", "thesis_final"]),
 *     "noActiveSameTypeApplication",
 *   ],
 */
export type RuleEntry =
  | string
  | EligibilityRule
  | { rule: string | EligibilityRule; alwaysEnforced: true };

const DEFAULT_MODE: EligibilityMode = "advisory";

type ScholarPercentageField = "tenthPercentage" | "interPercentage";

/**
 * Central eligibility policy configuration.
 *
 * ### How to add a new rule
 * 1. Write the rule function or use a factory (see exported factories below).
 * 2. Either add it to RULE_REGISTRY under a string key, OR use it as an
 *    inline factory call directly in the rule set. No type union to edit.
 * 3. Reference it in applicationRuleSets.
 *
 * ### How to add a new application type
 * Add one key -> RuleEntry[] entry to applicationRuleSets. Nothing else
 * needs changing — SUPPORTED_APPLICATION_TYPES is derived automatically.
 *
 * ### How to change a threshold
 * Edit thresholds. Factory-based rules with no explicit argument pick up
 * the new value at evaluation time.
 */
export const ELIGIBILITY_POLICY: {
  thresholds: {
    maxTotalExtensionMonths: number;
    minimumRacMeetings: number;
    minimumAcademicPercentage: number;
  };
  activeApplicationStatuses: readonly string[];
  academicPercentageFields: ReadonlyArray<{
    key: "tenthPercentage" | "interPercentage";
    label: string;
  }>;
  /** Rule sets keyed by application type name. Extend freely. */
  applicationRuleSets: Record<string, RuleEntry[]>;
} = {
  thresholds: {
    maxTotalExtensionMonths: 24,
    minimumRacMeetings: 2,
    minimumAcademicPercentage: 70,
  },
  activeApplicationStatuses: ["Pending", "Awaiting"],
  academicPercentageFields: [
    { key: "tenthPercentage", label: "10th percentage" },
    { key: "interPercentage", label: "Intermediate percentage" },
  ],
  applicationRuleSets: {
    "Supervisor Change": [
      "activeScholar",
      "noFeeDues",
      "minimumRacMeetings",
    ],
    "Pre-Talk": [
      "activeScholar",
      "noFeeDues",
      "minimumAcademicPercentage",
      "minimumRacMeetings",
      "minimumReviews",
      "noPendingReports",
      requireVerifiedDocs(["progress_report", "coursework_marks_memo"]),
      "noActiveSameTypeApplication",
    ],
    Extension: [
      "activeScholar",
      "noFeeDues",
      "minimumAcademicPercentage",
      "minimumRacMeetings",
      "extensionLimit",
      requireVerifiedDocs(["progress_report", "journal_publication_proofs"]),
      "noActiveSameTypeApplication",
    ],
    "Re-Registration": [
      "activeScholar",
      "noFeeDues",
      "minimumAcademicPercentage",
      "minimumRacMeetings",
      "noPendingReports",
      "noActiveSameTypeApplication",
    ],
    "Thesis Submission": [
      "activeScholar",
      "noFeeDues",
      "minimumAcademicPercentage",
      "minimumRacMeetings",
      "minimumPublication",
      requireVerifiedDocs(["thesis_draft", "plagiarism_report"]),
      "noActiveSameTypeApplication",
    ],
  },
};

/**
 * All known application types, derived from ELIGIBILITY_POLICY.applicationRuleSets.
 * Add a new type to the rule sets and it appears here automatically.
 */
export const SUPPORTED_APPLICATION_TYPES: string[] = Object.keys(
  ELIGIBILITY_POLICY.applicationRuleSets,
);

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
  racMeetingsCount: number;
}

interface RuleEvaluationContext {
  scholarId: string;
  applicationType: string;
  data: ScholarEligibilityData;
}

export type EligibilityRule = (context: RuleEvaluationContext) => EligibilityReason | null;

type EligibilityDataLoader = (scholarId: string) => Promise<ScholarEligibilityData>;

function parsePercentageValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.replace(/[^0-9.]/g, "").trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function getRecordedAcademicPercentages(profile?: Partial<Scholar>) {
  if (!profile) {
    return [] as Array<{ label: string; value: number }>;
  }

  return ELIGIBILITY_POLICY.academicPercentageFields.flatMap(({ key, label }) => {
    const parsed = parsePercentageValue(profile[key as ScholarPercentageField]);
    return parsed === null ? [] : [{ label, value: parsed }];
  });
}

/**
 * Passes when at least one document whose type is in `documentTypes` is verified.
 * Use inline in rule sets: `requireVerifiedDocs(["thesis_draft", "plagiarism_report"])`.
 */
export function requireVerifiedDocs(documentTypes: string[]): EligibilityRule {
  return ({ data }) => {
    const hasVerified = data.documents.some(
      (document) => documentTypes.includes(document.documentType) && Boolean(document.isVerified),
    );
    if (hasVerified) return null;
    return {
      code: "MISSING_VERIFIED_DOCUMENTS",
      message: "At least one verified document is required before submitting this application.",
    };
  };
}

const mustNotHaveActiveSameTypeApplication: EligibilityRule = ({ data, scholarId, applicationType }) => {
  const activeStatuses = new Set<string>(ELIGIBILITY_POLICY.activeApplicationStatuses);
  const hasActiveSameType = data.priorApplications.some(
    (application) =>
      application.scholarId === scholarId &&
      application.type === applicationType &&
      activeStatuses.has(application.status),
  );

  if (!hasActiveSameType) {
    return null;
  }

  return {
    code: "ACTIVE_APPLICATION_EXISTS",
    message: "You already have an active application of this type.",
  };
};

/**
 * Passes when `completedReviews >= n` (default: 1).
 */
export function minimumReviews(n = 1): EligibilityRule {
  return ({ data }) => {
    const completedReviews = Number(data.progress?.completedReviews ?? 0);
    if (completedReviews >= n) return null;
    return {
      code: "INSUFFICIENT_REVIEWS",
      message: `At least ${n} completed review${n > 1 ? "s are" : " is"} required.`,
    };
  };
}

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

/**
 * Passes when `publications >= n` (default: 1).
 */
export function minimumPublications(n = 1): EligibilityRule {
  return ({ data }) => {
    const publications = Number(data.progress?.publications ?? 0);
    if (publications >= n) return null;
    return {
      code: "PUBLICATION_REQUIRED",
      message: `At least ${n} publication${n > 1 ? "s are" : " is"} required for this application.`,
    };
  };
}

const mustBeActiveScholar: EligibilityRule = ({ data }) => {
  if (data.profile?.lifecycleStatus === "Active") {
    return null;
  }

  return {
    code: "SCHOLAR_NOT_ACTIVE",
    message: "Only active scholars are eligible for this application type.",
  };
};

/**
 * Passes when `extensionMonthsGranted < max`.
 * When `max` is omitted, reads from ELIGIBILITY_POLICY.thresholds at evaluation time.
 */
export function extensionLimit(max?: number): EligibilityRule {
  return ({ data }) => {
    const limit = max ?? ELIGIBILITY_POLICY.thresholds.maxTotalExtensionMonths;
    const extensionMonthsGranted = Number(data.profile?.extensionMonthsGranted ?? 0);
    if (extensionMonthsGranted < limit) return null;
    return {
      code: "MAX_EXTENSION_REACHED",
      message: `Maximum extension limit of ${limit} months has been reached.`,
    };
  };
}

const mustHaveNoFeeDues: EligibilityRule = ({ data }) => {
  if (!data.profile?.hasFeesDue) {
    return null;
  }

  return {
    code: "FEE_DUES_OUTSTANDING",
    message: "All outstanding fee dues must be cleared before applying.",
  };
};

/**
 * Passes when the average of recorded academic percentages >= `threshold`.
 * When `threshold` is omitted, reads from ELIGIBILITY_POLICY.thresholds at evaluation time.
 */
export function minimumAcademicPercentage(threshold?: number): EligibilityRule {
  return ({ data }) => {
    const required = threshold ?? ELIGIBILITY_POLICY.thresholds.minimumAcademicPercentage;
    const recordedPercentages = getRecordedAcademicPercentages(data.profile);
    if (recordedPercentages.length === 0) {
      return {
        code: "ACADEMIC_PERCENTAGE_UNAVAILABLE",
        message: `Academic percentage records are incomplete. A minimum average of ${required}% is required.`,
      };
    }
    const total = recordedPercentages.reduce((sum, item) => sum + item.value, 0);
    const average = total / recordedPercentages.length;
    if (average >= required) return null;
    return {
      code: "ACADEMIC_PERCENTAGE_TOO_LOW",
      message: `A minimum average of ${required}% across recorded academic percentages is required. Current average: ${average.toFixed(1)}%.`,
    };
  };
}

/**
 * Passes when `racMeetingsCount >= n`.
 * When `n` is omitted, reads from ELIGIBILITY_POLICY.thresholds at evaluation time.
 */
export function minimumRacMeetings(n?: number): EligibilityRule {
  return ({ data }) => {
    const required = n ?? ELIGIBILITY_POLICY.thresholds.minimumRacMeetings;
    if (data.racMeetingsCount >= required) return null;
    return {
      code: "INSUFFICIENT_RAC_MEETINGS",
      message: `At least ${required} RAC meeting${required !== 1 ? "s" : ""} must have been attended before applying.`,
    };
  };
}

/**
 * Named rule registry. Keys are referenced by string in applicationRuleSets.
 * The registry is intentionally open (Record<string, EligibilityRule>) —
 * add a new rule here without editing any type unions.
 *
 * Parameterised entries are registered with no explicit arguments so they
 * lazily default to ELIGIBILITY_POLICY.thresholds at evaluation time.
 */
export const RULE_REGISTRY: Record<string, EligibilityRule> = {
  // Atomic rules
  activeScholar: mustBeActiveScholar,
  noFeeDues: mustHaveNoFeeDues,
  noPendingReports: mustHaveNoPendingReports,
  noActiveSameTypeApplication: mustNotHaveActiveSameTypeApplication,
  // Parameterised — no args so they read from ELIGIBILITY_POLICY.thresholds
  minimumAcademicPercentage: minimumAcademicPercentage(),
  minimumRacMeetings: minimumRacMeetings(),
  minimumReviews: minimumReviews(),
  minimumPublication: minimumPublications(),
  extensionLimit: extensionLimit(),
};

async function loadScholarEligibilityData(scholarId: string): Promise<ScholarEligibilityData> {
  const [profile, progress, documents, priorApplications, racMeetingsCount] = await Promise.all([
    storage.getUserByScholarId(scholarId),
    storage.getResearchProgress(scholarId),
    storage.getDocuments(scholarId),
    storage.getApplications(scholarId),
    storage.countRacMeetingsForScholar(scholarId),
  ]);

  return {
    profile,
    progress,
    documents,
    priorApplications,
    racMeetingsCount,
  };
}

interface ResolvedEntry {
  rule: EligibilityRule;
  alwaysEnforced: boolean;
}

function resolveRuleEntry(entry: RuleEntry): ResolvedEntry {
  if (typeof entry === "string") {
    const rule = RULE_REGISTRY[entry];
    if (!rule) {
      throw new Error(
        `Unknown eligibility rule: "${entry}". ` +
          "Add it to RULE_REGISTRY or use an inline factory call in the rule set.",
      );
    }
    return { rule, alwaysEnforced: false };
  }

  if (typeof entry === "function") {
    return { rule: entry, alwaysEnforced: false };
  }

  // Descriptor form: { rule, alwaysEnforced: true }
  const { rule, alwaysEnforced } = entry;
  if (typeof rule === "string") {
    const resolved = RULE_REGISTRY[rule];
    if (!resolved) {
      throw new Error(
        `Unknown eligibility rule: "${rule}". ` +
          "Add it to RULE_REGISTRY or use an inline factory call in the rule set.",
      );
    }
    return { rule: resolved, alwaysEnforced: Boolean(alwaysEnforced) };
  }
  return { rule, alwaysEnforced: Boolean(alwaysEnforced) };
}

interface RuleSetResult {
  reasons: EligibilityReason[];
  /** Codes from rules marked alwaysEnforced that fired — block even in advisory mode. */
  alwaysEnforcedFailureCodes: Set<string>;
}

function evaluateRulesForType(
  applicationType: string,
  context: RuleEvaluationContext,
): RuleSetResult {
  const entries = ELIGIBILITY_POLICY.applicationRuleSets[applicationType] ?? [];
  const reasons: EligibilityReason[] = [];
  const alwaysEnforcedFailureCodes = new Set<string>();

  for (const entry of entries) {
    const { rule, alwaysEnforced } = resolveRuleEntry(entry);
    const reason = rule(context);
    if (reason) {
      reasons.push(reason);
      if (alwaysEnforced) {
        alwaysEnforcedFailureCodes.add(reason.code);
      }
    }
  }

  return { reasons, alwaysEnforcedFailureCodes };
}

function resolveItemEligibility(
  mode: EligibilityMode,
  reasons: EligibilityReason[],
  alwaysEnforcedFailureCodes: Set<string>,
): boolean {
  if (alwaysEnforcedFailureCodes.size > 0) return false; // blocked regardless of mode
  if (mode === "advisory") return true;
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
      const { reasons, alwaysEnforcedFailureCodes } = evaluateRulesForType(applicationType, {
        scholarId: input.scholarId,
        applicationType,
        data,
      });

      return {
        applicationType,
        eligible: resolveItemEligibility(mode, reasons, alwaysEnforcedFailureCodes),
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
