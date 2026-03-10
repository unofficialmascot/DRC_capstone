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

export function evaluateScholarApplicationEligibility(input: {
  scholarId: string;
  mode?: EligibilityMode;
}): ApplicationEligibilityResult {
  const mode = input.mode ?? DEFAULT_MODE;

  const items: ApplicationEligibilityItem[] = SUPPORTED_APPLICATION_TYPES.map(
    (applicationType) => ({
      applicationType,
      eligible: true,
      mode,
      reasons: [],
    }),
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
