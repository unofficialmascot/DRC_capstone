export const LOGGING_CONFIG = {
  responsePreviewMaxLength: 500,
  /**
   * Best-effort key-based redaction only; this is not full PII detection.
   */
  defaultRedactedKeys: new Set([
    "password",
    "token",
    "email",
    "accesstoken",
    "refreshtoken",
    "authorization",
    "secret",
  ]),
} as const;
