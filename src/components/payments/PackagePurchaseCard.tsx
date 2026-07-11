import { formatDate, formatPrice } from "@/lib/utils";
import StatusBadge from "@/components/shared/StatusBadge";
import type { PackagePurchase } from "@/types";

// Mirrors backend apps/payments/services.py PACKAGE_GRACE_PERIOD_DAYS — a
// package stays bookable until paid_at + plan.duration_days + this grace
// window. One-off legacy bundles have no expiry to compute.
const PACKAGE_GRACE_PERIOD_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface PackageExpiry {
  termEndDate: Date;
  hardExpiryDate: Date;
  isExpired: boolean;
  isInGrace: boolean;
  graceDaysLeft: number;
}

export function computePackageExpiry(purchase: PackagePurchase): PackageExpiry | null {
  const durationDays = purchase.plan.duration_days;
  if (!purchase.paid_at || !durationDays) return null;

  const paidAt = new Date(purchase.paid_at).getTime();
  const termEndDate = new Date(paidAt + durationDays * DAY_MS);
  const hardExpiryDate = new Date(termEndDate.getTime() + PACKAGE_GRACE_PERIOD_DAYS * DAY_MS);
  const now = Date.now();

  return {
    termEndDate,
    hardExpiryDate,
    isExpired: now > hardExpiryDate.getTime(),
    isInGrace: now > termEndDate.getTime() && now <= hardExpiryDate.getTime(),
    graceDaysLeft: Math.max(0, Math.ceil((hardExpiryDate.getTime() - now) / DAY_MS)),
  };
}

export function isPastPackage(purchase: PackagePurchase, expiry: PackageExpiry | null): boolean {
  if (purchase.status === "cancelled" || purchase.status === "refunded") return true;
  if (purchase.status === "paid" && expiry?.isExpired) return true;
  if (purchase.status === "paid" && purchase.remaining_credits <= 0) return true;
  return false;
}

export function PackagePurchaseCard({ purchase }: { purchase: PackagePurchase }) {
  const expiry = computePackageExpiry(purchase);

  return (
    <div className="rounded-lg border p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium">
            {purchase.tutor.name} {purchase.tutor.surname}
          </p>
          <p className="text-sm text-muted-foreground">{purchase.plan.name}</p>
        </div>
        <StatusBadge status={purchase.status} type="packagePurchase" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">Ders hakkı</p>
          <p className="font-medium">
            {purchase.remaining_credits} / {purchase.total_credits}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Toplam tutar</p>
          <p className="font-medium">{formatPrice(purchase.total_price)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Talep tarihi</p>
          <p className="font-medium">{formatDate(purchase.created_at)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">
            {expiry ? "Süre sonu" : "Onay tarihi"}
          </p>
          <p className="font-medium">
            {expiry
              ? formatDate(expiry.termEndDate.toISOString())
              : purchase.paid_at
                ? formatDate(purchase.paid_at)
                : "—"}
          </p>
        </div>
      </div>
      {expiry?.isInGrace && (
        <p className="mt-2.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
          Paket süren doldu. Kalan derslerini kullanmak için son{" "}
          <span className="font-medium">{expiry.graceDaysLeft} gün</span>.
        </p>
      )}
    </div>
  );
}
