/**
 * Display formatting for minor-unit (kuruş) money amounts.
 *
 * Formatting only — never pricing. Coaching amounts are computed on the
 * backend and returned as raw `*_minor` integers (plus, for convenience,
 * a preformatted `*_display` string). This helper exists so a client that
 * wants to localise the number itself has one place to do it, rather than
 * every component reinventing separator rules.
 */

const formatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 123456 -> "₺1.234,56" */
export function formatTryMinor(minor: number): string {
  return formatter.format(minor / 100);
}

/** True when the amount is exactly zero — used for the "free" label. */
export function isFreeMinor(minor: number): boolean {
  return minor === 0;
}
