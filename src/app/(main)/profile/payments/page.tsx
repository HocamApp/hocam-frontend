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
import {
  computePackageExpiry,
  isPastPackage,
  PackagePurchaseCard,
} from "@/components/payments/PackagePurchaseCard";
import {
  fetchPackagePurchases,
  fetchPaymentHistory,
  fetchReferralInfo,
} from "@/lib/paymentsApi";
import {
  creditActivityLabel,
  isMonetaryPaymentEntry,
  isPackageCreditActivity,
} from "@/lib/paymentHistory";
import { formatDate, formatPrice } from "@/lib/utils";
import type { PaymentLedgerEntry } from "@/types";

const ENTRY_TYPE_LABELS: Record<string, string> = {
  package_purchase_paid: "Paket tutarı onaylandı",
  package_refund_processed: "Paket iade kaydı işlendi",
};

function entryLabel(entry: PaymentLedgerEntry): string {
  return ENTRY_TYPE_LABELS[entry.entry_type] || entry.description || entry.entry_type;
}

function formatActivityDate(value: string): string {
  return new Date(value).toLocaleString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PackageActivity({
  entries,
  isLoading,
  isError,
}: {
  entries: PaymentLedgerEntry[];
  isLoading: boolean;
  isError: boolean;
}) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Paket hareketleri yükleniyor…</p>;
  }
  if (isError) {
    return (
      <p className="text-sm text-destructive">
        Paket hareketleri yüklenemedi. Lütfen tekrar deneyin.
      </p>
    );
  }
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Bu pakette henüz ders hakkı hareketi yok.
      </p>
    );
  }

  return (
    <div>
      <h4 className="text-sm font-semibold">Ders hakkı hareketleri</h4>
      <div className="mt-2 divide-y">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex flex-col gap-1 py-2.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">{creditActivityLabel(entry)}</p>
              <p className="text-xs text-muted-foreground">
                {formatActivityDate(entry.created_at)}
              </p>
            </div>
            <span
              className={`w-fit rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                entry.credit_delta > 0
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {entry.credit_delta > 0 ? "+" : ""}
              {entry.credit_delta} hak
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PackagesSection() {
  const [expandedPackageId, setExpandedPackageId] = useState<string | null>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["package-purchases"],
    queryFn: fetchPackagePurchases,
  });
  const {
    data: history,
    isLoading: isHistoryLoading,
    isError: isHistoryError,
  } = useQuery({
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
            <PackagePurchaseCard
              key={purchase.id}
              purchase={purchase}
              isExpanded={expandedPackageId === purchase.id}
              onToggle={() =>
                setExpandedPackageId((current) =>
                  current === purchase.id ? null : purchase.id
                )
              }
              details={
                <PackageActivity
                  entries={(history ?? []).filter((entry) =>
                    isPackageCreditActivity(entry, purchase.id)
                  )}
                  isLoading={isHistoryLoading}
                  isError={isHistoryError}
                />
              }
            />
          ))
        )}
      </div>

      {past.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Geçmiş paketler
          </h3>
          {past.map(({ purchase }) => (
            <PackagePurchaseCard
              key={purchase.id}
              purchase={purchase}
              isExpanded={expandedPackageId === purchase.id}
              onToggle={() =>
                setExpandedPackageId((current) =>
                  current === purchase.id ? null : purchase.id
                )
              }
              details={
                <PackageActivity
                  entries={(history ?? []).filter((entry) =>
                    isPackageCreditActivity(entry, purchase.id)
                  )}
                  isLoading={isHistoryLoading}
                  isError={isHistoryError}
                />
              }
            />
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
  const monetaryEntries = (data ?? []).filter(isMonetaryPaymentEntry);

  if (monetaryEntries.length === 0) {
    return (
      <EmptyState
        title="Henüz ödeme geçmişi yok"
        description="Onaylanan paket tutarların ve iade kayıtların burada görünecek."
      />
    );
  }

  return (
    <div className="space-y-2">
      {monetaryEntries.map((entry) => (
        <div
          key={entry.id}
          className="flex flex-col items-start gap-2 rounded-lg border px-3 py-3 md:flex-row md:items-center md:justify-between md:py-2"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium">{entryLabel(entry)}</p>
            <p className="text-xs text-muted-foreground">{formatDate(entry.created_at)}</p>
          </div>
          <div className="text-left text-sm md:text-right">
            <p className="font-medium">{formatPrice(entry.amount)}</p>
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
