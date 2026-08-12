/**
 * Presentation-only helpers for Coaching surfaces.
 *
 * These values never determine pricing, capacity, lifecycle, or availability.
 * They only turn API-owned values into stable visual primitives.
 */

export function buildMetricShare(
  values: ReadonlyArray<number | null>
): Array<number | null> {
  const knownTotal = values.reduce<number>(
    (sum, value) => sum + (value === null ? 0 : Math.max(0, value)),
    0
  );

  return values.map((value) => {
    if (value === null) return null;
    if (knownTotal === 0) return 0;
    return (Math.max(0, value) / knownTotal) * 100;
  });
}

export const COACHING_TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hours = Math.floor(index / 2);
  const minutes = index % 2 === 0 ? "00" : "30";
  return `${String(hours).padStart(2, "0")}:${minutes}`;
});
