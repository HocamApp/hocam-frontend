/** Referral codes are printed uppercase from a no-confusables alphabet, and
 * people paste them with spaces, dashes and whatever casing they had. The
 * backend normalizes the same way, so a code never fails for its formatting. */
export function normalizeReferralCode(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.trim().toUpperCase().replace(/[\s-]/g, "").slice(0, 12);
}
