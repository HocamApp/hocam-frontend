/**
 * The key that makes a retried purchase the same purchase.
 *
 * `POST /payments/package-purchases/` takes an `Idempotency-Key`: sent again
 * with the same key (and the same tutor and plan), the server returns the
 * purchase it already made instead of making a second one. That is what makes
 * "the answer never arrived, press the button again" safe.
 *
 * So the key lives exactly as long as the uncertainty does. It is created on
 * the first attempt for a choice (tutor, plan, hours), kept while the outcome
 * is unknown (a lost answer), and forgotten the moment the server gives a
 * definite answer, success or refusal: a purchase the student cancels and then
 * buys again must be a new one, not the old one handed back.
 *
 * Kept in session storage so a reload in the middle of a lost answer still
 * retries safely, and lost with the tab, which is when the choice is lost too.
 */
import type { StorageLike } from "./safeStorage";

const PREFIX = "hocam:purchase-key:v1:";

function randomKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Only reached where randomUUID does not exist; the key needs to be unlikely
  // to repeat, not unguessable.
  return `k${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

/** What identifies "the same attempt": the tutor, the plan and the chosen hours. */
export function purchaseAttemptScope(parts: {
  tutorId: string;
  planId: string;
  schedule: string;
}): string {
  return `${parts.tutorId}:${parts.planId}:${parts.schedule}`;
}

/** The key for this attempt: the one already made for it, or a new one. */
export function purchaseAttemptKey(
  storage: StorageLike | null,
  scope: string,
  make: () => string = randomKey
): string {
  try {
    const existing = storage?.getItem(PREFIX + scope);
    if (existing) return existing;
  } catch {
    // unreadable storage: fall through to a fresh key
  }
  const key = make();
  try {
    storage?.setItem(PREFIX + scope, key);
  } catch {
    // unwritable storage: the key still works for this attempt, only a reload loses it
  }
  return key;
}

export function clearPurchaseAttemptKey(storage: StorageLike | null, scope: string): void {
  try {
    storage?.removeItem(PREFIX + scope);
  } catch {
    // nothing to clear
  }
}
