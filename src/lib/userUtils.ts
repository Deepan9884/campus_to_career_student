/**
 * Safely format and sanitize a user's display name.
 * Shields against accidental encrypted PII ciphertext (e.g., v1:salt:iv:... or long hex hashes)
 * or missing names, gracefully falling back to email handle or "Student".
 */
export function sanitizeDisplayName(name?: string | null, email?: string | null): string {
  if (!name || typeof name !== "string") {
    return email ? email.split("@")[0] : "Student";
  }
  const trimmed = name.trim();
  // Detect encrypted PII format: "v1:...", "v0:...", colon-separated hex segments, or long hash strings
  if (
    trimmed.startsWith("v1:") ||
    trimmed.startsWith("v0:") ||
    (trimmed.includes(":") && trimmed.length > 35) ||
    (trimmed.length > 50 && /^[a-f0-9]+$/i.test(trimmed))
  ) {
    return email ? email.split("@")[0] : "Student";
  }
  return trimmed;
}
