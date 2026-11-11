/**
 * E-mails are compared case-insensitively and ignoring surrounding spaces, so
 * the users module stores and looks them up trimmed and lower-cased. It does
 * this itself instead of trusting its callers, because uniqueness depends on it.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
