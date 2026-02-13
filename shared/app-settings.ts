export type ApplicationSubmissionMode =
  | "unlimited"
  | "none"
  | "single-active-per-type";

export const APP_SETTINGS = {
  applicationSubmissionMode: "unlimited" as ApplicationSubmissionMode,
} as const;
