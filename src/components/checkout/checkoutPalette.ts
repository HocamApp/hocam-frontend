export const CHECKOUT_PALETTES = [
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
] as const;

export type CheckoutPalette = (typeof CHECKOUT_PALETTES)[number];

export const CHECKOUT_PALETTE_NAMES: Record<CheckoutPalette, string> = {
  "01": "Hocam Design",
  "02": "Cyan Studio",
  "03": "Mint Ledger",
  "04": "Charcoal Frame",
  "05": "Sunlit Fields",
  "06": "Blue Workshop",
  "07": "Taupe Editorial",
  "08": "Monochrome Signal",
  "09": "Mint Commerce",
  "10": "Reverse Orchard",
};

export function normalizeCheckoutPalette(value: string | null): CheckoutPalette {
  return CHECKOUT_PALETTES.includes(value as CheckoutPalette)
    ? (value as CheckoutPalette)
    : "01";
}
