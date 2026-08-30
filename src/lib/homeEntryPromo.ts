import { readJson, writeJson, type StorageLike } from "@/lib/safeStorage";

/**
 * Whether the homepage entry promo should open.
 *
 * Kept as pure functions over an injected `StorageLike` so the policy can be
 * tested without a browser — the same shape `hocaBulEntryState` uses.
 *
 * Two deliberate choices:
 *
 * - **localStorage, not sessionStorage.** A promo that returns in every new tab
 *   is the classic annoyance. The retention offer uses sessionStorage because
 *   it interrupts a flow in progress; this one greets a visit.
 * - **It comes back after a month.** Someone still browsing anonymously in
 *   thirty days is exactly who the offer is for, and a permanent dismissal
 *   would quietly retire the surface after one impression.
 *
 * When storage is unreadable (Safari private mode) the answer is "show". The
 * worst case is one appearance per page load, not a loop: once shown, the
 * decision lives in React state for the life of the page.
 */

/**
 * Versioned, and the version was stepped when the promo was redrawn and its
 * trigger changed. Everyone carrying a v1 dismissal is holding a decision they
 * made about a different dialog that opened at a different moment, and leaving
 * them on it would have hidden the new one for the rest of the month.
 */
export const HOME_ENTRY_PROMO_KEY = "hocam:home-entry-promo:v2";
export const HOME_ENTRY_PROMO_TTL_DAYS = 30;

/**
 * When the promo is allowed to open.
 *
 * It used to be 700ms after paint, which is an interstitial: it lands before
 * the visitor has seen the page it is interrupting, so the only thing they can
 * do with it is close it. The three signals below are the conventional ones,
 * and the promo opens on whichever arrives first.
 *
 * - **Dwell.** Twelve seconds is long enough to have read the headline and
 *   started on the first tutor cards.
 * - **Scroll depth.** A quarter of the page says the same thing sooner for
 *   someone who scrolls straight down.
 * - **Exit intent.** The pointer leaving through the top of the window is the
 *   classic "about to close the tab" tell. Desktop only: there is no such
 *   gesture on a touch screen, and the mobile imitations fire on scroll-up,
 *   which is just scrolling.
 */
export const HOME_ENTRY_PROMO_DWELL_MS = 12_000;
export const HOME_ENTRY_PROMO_SCROLL_RATIO = 0.25;

/**
 * How long the promo defers to the privacy card before opening anyway.
 *
 * Deference cannot be unconditional: the privacy card is a corner card with no
 * scrim, so a visitor can read the whole page without ever answering it, and
 * an unbounded wait means the promo simply never appears for them. They do not
 * overlap on screen either — one is a centred dialog, the other sits in the
 * bottom corner — so the only thing being protected is attention, and eight
 * seconds is enough of that.
 */
export const HOME_ENTRY_PROMO_CONSENT_GRACE_MS = 8_000;

const DAY_MS = 24 * 60 * 60 * 1000;

type DismissalRecord = { dismissedAt: number };

function readDismissal(storage: StorageLike | null): DismissalRecord | null {
  const raw = readJson(storage, HOME_ENTRY_PROMO_KEY);
  if (!raw || typeof raw !== "object") return null;

  const dismissedAt = (raw as { dismissedAt?: unknown }).dismissedAt;
  if (typeof dismissedAt !== "number" || !Number.isFinite(dismissedAt)) return null;

  return { dismissedAt };
}

export function shouldShowEntryPromo(
  storage: StorageLike | null,
  now: number = Date.now(),
): boolean {
  const record = readDismissal(storage);
  if (!record) return true;

  const age = now - record.dismissedAt;
  // A clock that moved backwards leaves a future timestamp; treat that as a
  // fresh dismissal rather than showing the promo on every load.
  if (age < 0) return false;

  return age >= HOME_ENTRY_PROMO_TTL_DAYS * DAY_MS;
}

export function markEntryPromoSeen(
  storage: StorageLike | null,
  now: number = Date.now(),
): void {
  writeJson(storage, HOME_ENTRY_PROMO_KEY, { dismissedAt: now } satisfies DismissalRecord);
}
