import { z } from "zod";
import settings from "../settings.json";

export type ApplicationSubmissionMode =
  | "unlimited"
  | "none"
  | "single-active-per-type";

export type ApplicationEligibilityMode = "advisory" | "enforced";

const appSettingsSchema = z.object({
  applicationSubmissionMode: z
    .enum(["unlimited", "none", "single-active-per-type"])
    .default("unlimited"),
  applicationEligibilityMode: z.enum(["advisory", "enforced"]).default("advisory"),
});

export const APP_SETTINGS = appSettingsSchema.parse(settings) as {
  applicationSubmissionMode: ApplicationSubmissionMode;
  applicationEligibilityMode: ApplicationEligibilityMode;
};
