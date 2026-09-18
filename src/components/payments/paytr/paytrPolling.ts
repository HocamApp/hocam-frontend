/**
 * How often the payment screen re-reads the purchase while an attempt is open.
 *
 * The window exists because polling every two seconds forever is rude to the
 * API, not because 45 seconds means anything about the payment. When it ends
 * the iframe stays, the student is offered a manual re-check, and nothing is
 * called failed — a bank challenge can easily outlast it.
 */

export const PAYTR_POLL_INTERVAL_MS = 2000;
export const PAYTR_FAST_POLL_WINDOW_MS = 45_000;

export function payTRPollIntervalMs({
  attemptActive,
  elapsedMs,
}: {
  attemptActive: boolean;
  elapsedMs: number;
}): number | false {
  if (!attemptActive) return false;
  // An unusable clock reading counts as "just started" rather than as an
  // expired window: polling a little longer is harmless, stopping early is not.
  const elapsed = Number.isFinite(elapsedMs) && elapsedMs > 0 ? elapsedMs : 0;
  if (elapsed >= PAYTR_FAST_POLL_WINDOW_MS) return false;
  return PAYTR_POLL_INTERVAL_MS;
}
