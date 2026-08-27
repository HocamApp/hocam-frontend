/**
 * Display formatting for minor-unit (kuruş) money amounts.
 *
 * Formatting only — never pricing. Coaching amounts are computed on the
 * backend and returned as raw `*_minor` integers (plus, for convenience,
 * a preformatted `*_display` string). This helper exists so a client that
 * wants to localise the number itself has one place to do it, rather than
 * every component reinventing separator rules.
 */

/* Decimal, not `style: "currency"`. Intl puts the symbol in front for tr-TR
   ("₺1.234,56"), and DESIGN.md is explicit that Turkish convention places it
   after the number. Formatting the digits and appending the symbol is the only
   way to get both the tr-TR separators and the correct symbol position.
   Plain space, matching formatPrice in lib/utils: two spellings of the same
   amount is a difference a reader notices and cannot explain. */
const formatter = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 123456 -> "1.234,56 ₺" */
export function formatTryMinor(minor: number): string {
  return `${formatter.format(minor / 100)} ₺`;
}

/** True when the amount is exactly zero — used for the "free" label. */
export function isFreeMinor(minor: number): boolean {
  return minor === 0;
}
