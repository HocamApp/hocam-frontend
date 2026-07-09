"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { ProfileScreen } from "@/components/profile/ProfileScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import StatusBadge from "@/components/shared/StatusBadge";
import {
  fetchPackagePurchases,
  fetchPaymentHistory,
  fetchReferralInfo,
} from "@/lib/paymentsApi";
import { formatDate, formatPrice } from "@/lib/utils";
import type { PackagePurchase, PaymentLedgerEntry } from "@/types";

const ENTRY_TYPE_LABELS: Record<string, string> = {
  package_purchase_created: "Paket talebi oluşturuldu",
  package_purchase_paid: "Paket ödemesi onaylandı",
};

function entryLabel(entry: PaymentLedgerEntry): string {
  return entry.description || ENTRY_TYPE_LABELS[entry.entry_type] || entry.entry_type;
}

// Mirrors backend apps/payments/services.py PACKAGE_GRACE_PERIOD_DAYS — a
// package stays bookable until paid_at + plan.duration_days + this grace
// window. Only weekly matrix plans carry a term (duration_days); one-off
// bundles (duration_days=null) have no expiry to compute.
const PACKAGE_GRACE_PERIOD_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

interface PackageExpiry {
  termEndDate: Date;
  hardExpiryDate: Date;
  isExpired: boolean;
  isInGrace: boolean;
  graceDaysLeft: number;
}

function computePackageExpiry(purchase: PackagePurchase): PackageExpiry | null {
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

function isPastPackage(purchase: PackagePurchase, expiry: PackageExpiry | null): boolean {
  if (purchase.status === "cancelled" || purchase.status === "refunded") return true;
  if (purchase.status === "paid" && expiry?.isExpired) return true;
  if (purchase.status === "paid" && purchase.remaining_credits <= 0) return true;
  return false;
}

function PackageCard({ purchase }: { purchase: PackagePurchase }) {
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

function PackagesSection() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["package-purchases"],
    queryFn: fetchPackagePurchases,
  });

  if (isLoading) {
    return (
      <div className="py-8">
        <LoadingSpinner />
      </div>
    );
  }
  if (isError) {
    return <ErrorMessage message="Paketlerin yüklenemedi. Lütfen tekrar deneyin." />;
  }
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="Henüz paketin yok"
        description="Bir hocanın profilinden 10 derslik avantajlı paket talebinde bulunabilirsin."
      />
    );
  }

  const withExpiry = data.map((purchase) => ({
    purchase,
    expiry: computePackageExpiry(purchase),
  }));
  const active = withExpiry.filter(
    ({ purchase, expiry }) => !isPastPackage(purchase, expiry)
  );
  const past = withExpiry.filter(({ purchase, expiry }) =>
    isPastPackage(purchase, expiry)
  );

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aktif paketin yok.</p>
        ) : (
          active.map(({ purchase }) => (
            <PackageCard key={purchase.id} purchase={purchase} />
          ))
        )}
      </div>

      {past.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Geçmiş paketler
          </h3>
          {past.map(({ purchase }) => (
            <PackageCard key={purchase.id} purchase={purchase} />
          ))}
        </div>
      )}
    </div>
  );
}

function PaymentHistorySection() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["payment-history"],
    queryFn: fetchPaymentHistory,
  });

  if (isLoading) {
    return (
      <div className="py-8">
        <LoadingSpinner />
      </div>
    );
  }
  if (isError) {
    return <ErrorMessage message="Ödeme geçmişi yüklenemedi. Lütfen tekrar deneyin." />;
  }
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="Henüz ödeme geçmişi yok"
        description="Paket talebinde bulunduğunda burada görünecek."
      />
    );
  }

  return (
    <div className="space-y-2">
      {data.map((entry) => (
        <div
          key={entry.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium">{entryLabel(entry)}</p>
            <p className="text-xs text-muted-foreground">{formatDate(entry.created_at)}</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-medium">{formatPrice(entry.amount)}</p>
            {entry.credit_delta !== 0 && (
              <p className="text-xs text-muted-foreground">
                {entry.credit_delta > 0 ? `+${entry.credit_delta}` : entry.credit_delta} ders hakkı
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ReferralSection() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["referral-info"],
    queryFn: fetchReferralInfo,
  });
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="py-8">
        <LoadingSpinner />
      </div>
    );
  }
  if (isError || !data) {
    return <ErrorMessage message="Referans bilgin yüklenemedi. Lütfen tekrar deneyin." />;
  }

  const handleCopy = async () => {
    try {
      let copied = false;
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(data.referral_url);
          copied = true;
        } catch {
          copied = false;
        }
      }
      if (!copied) {
        const textarea = document.createElement("textarea");
        textarea.value = data.referral_url;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.top = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        copied = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (!copied) {
          throw new Error("Clipboard fallback failed");
        }
      }
      setCopied(true);
      toast.success("Referans linki kopyalandı.");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Kopyalanamadı. Linki alandan elle kopyalayabilirsin.");
    }
  };

  return (
    <div className="rounded-lg border p-3 text-sm">
      <p className="text-muted-foreground">
        Arkadaşlarını Hocam&apos;a davet et. Referans ödülleri yakında aktif olacak.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <code className="rounded bg-muted px-2 py-1 font-medium">{data.referral_code}</code>
        <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
          {copied ? (
            <Check className="mr-1.5 h-3.5 w-3.5" />
          ) : (
            <Copy className="mr-1.5 h-3.5 w-3.5" />
          )}
          {copied ? "Kopyalandı" : "Linki kopyala"}
        </Button>
      </div>
      <Input
        value={data.referral_url}
        readOnly
        aria-label="Referans linki"
        className="mt-2 h-8 text-xs"
      />
    </div>
  );
}

function PaymentsContent() {
  return (
    <ProfileScreen
      title="Ödemeler"
      description="Paketlerin, ödeme geçmişin ve referans kodun."
    >
      <div className="space-y-8">
        <section>
          <h2 className="mb-3 text-lg font-semibold">Paketlerim</h2>
          <PackagesSection />
        </section>
        <section>
          <h2 className="mb-3 text-lg font-semibold">Ödeme geçmişi</h2>
          <PaymentHistorySection />
        </section>
        <section>
          <h2 className="mb-3 text-lg font-semibold">Referans kodu</h2>
          <ReferralSection />
        </section>
      </div>
    </ProfileScreen>
  );
}

export default function PaymentsPage() {
  return (
    <RouteGuard requireAuth>
      <PaymentsContent />
    </RouteGuard>
  );
}
