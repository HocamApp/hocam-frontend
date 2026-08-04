/**
 * Presentation-only masking for a connected Google account address.
 *
 * The API keeps returning the full `account_email` — nothing about the
 * payload, the stored connection, or the OAuth flow changes. Only what the
 * connection card prints is shortened, so a shared screen or a screenshot
 * never carries the whole address.
 *
 * Shape: the first three characters of the local part survive, the rest
 * collapses to `***`, and the domain stays intact.
 *
 *   officialardaguner@gmail.com -> off***@gmail.com
 *   ab@gmail.com                -> ab***@gmail.com
 *   a@gmail.com                 -> a***@gmail.com
 *
 * Anything that is not a usable address — empty, whitespace, no `@`, no
 * local part, no domain — returns `null` so the caller falls back to the
 * same output it already uses when the API sends no address at all.
 */
export function maskAccountEmail(email: string | null | undefined): string | null {
  if (!email) return null;

  const parts = email.trim().split("@");
  // Exactly one separator, with something on either side of it.
  if (parts.length !== 2) return null;

  const [localPart, domain] = parts;
  if (!localPart || !domain) return null;

  // Shorter local parts keep whatever they have — always at least one
  // character, since `localPart` is non-empty here.
  return `${localPart.slice(0, 3)}***@${domain}`;
}
