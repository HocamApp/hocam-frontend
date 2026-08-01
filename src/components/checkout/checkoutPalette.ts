export const CHECKOUT_PALETTES = ["a", "b", "c", "d", "e"] as const;

export type CheckoutPalette = (typeof CHECKOUT_PALETTES)[number];

export function normalizeCheckoutPalette(value: string | null): CheckoutPalette {
  return CHECKOUT_PALETTES.includes(value as CheckoutPalette)
    ? (value as CheckoutPalette)
    : "a";
}
