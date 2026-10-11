import type { PackagePurchase } from "@/types";
import { serverNow } from "@/lib/serverClock";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface PackageExpiry {
  termEndDate: Date;
  hardExpiryDate: Date;
  isExpired: boolean;
  isInGrace: boolean;
  graceDaysLeft: number;
}

/**
 * When a paid package stops being bookable.
 *
 * The server decides (`package_expires_at` in apps/payments/services.py) and
 * sends `expires_at`; this only reads it. The old client guessed a 14-day grace
 * window the backend had retired, so a package the server already refused to
 * book was shown as usable for two more weeks. If an older response lacks the
 * field, the fallback is the same formula the server uses, with the grace the
 * purchase was actually sold with (`grace_period_days`, default none).
 *
 * `nowMs` is a parameter so the answer can be checked at a chosen instant; it
 * defaults to the server-corrected clock.
 */
export function computePackageExpiry(
  purchase: PackagePurchase,
  nowMs: number = serverNow()
): PackageExpiry | null {
  const durationDays = purchase.plan.duration_days;
  if (!purchase.paid_at || !durationDays) return null;

  const graceDays = purchase.grace_period_days ?? 0;
  const hardExpiryMs = purchase.expires_at
    ? Date.parse(purchase.expires_at)
    : Date.parse(purchase.paid_at) + (durationDays + graceDays) * DAY_MS;
  if (!Number.isFinite(hardExpiryMs)) return null;

  const termEndMs = hardExpiryMs - graceDays * DAY_MS;
  return {
    termEndDate: new Date(termEndMs),
    hardExpiryDate: new Date(hardExpiryMs),
    isExpired: nowMs > hardExpiryMs,
    isInGrace: nowMs > termEndMs && nowMs <= hardExpiryMs,
    graceDaysLeft: Math.max(0, Math.ceil((hardExpiryMs - nowMs) / DAY_MS)),
  };
}

export function isPastPackage(purchase: PackagePurchase, expiry: PackageExpiry | null): boolean {
  if (purchase.status === "cancelled" || purchase.status === "refunded") return true;
  if (purchase.status === "paid" && expiry?.isExpired) return true;
  if (purchase.status === "paid" && purchase.remaining_credits <= 0) return true;
  return false;
}
