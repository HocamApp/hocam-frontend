"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { ProfileScreen } from "@/components/profile/ProfileScreen";
import { EmptyState } from "@/components/shared/EmptyState";
import { PACKAGE_HISTORY_EMPTY_DESCRIPTION } from "@/lib/paymentHistoryCopy";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  computePackageExpiry,
  isPastPackage,
  PackagePurchaseCard,
} from "@/components/payments/PackagePurchaseCard";
import { fetchPackagePurchases, fetchPaymentHistory } from "@/lib/paymentsApi";
import {
  creditActivityLabel,
  isMonetaryPaymentEntry,
  isPackageCreditActivity,
} from "@/lib/paymentHistory";
import { formatDate, formatPrice } from "@/lib/utils";
import type { PaymentLedgerEntry } from "@/types";

const ENTRY_TYPE_LABELS: Record<string, string> = {
  package_purchase_paid: "Paket tahsilatı doğrulandı",
  package_refund_processed: "İade yükümlülüğü kaydı işlendi",
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
                  ? "text-[var(--success)]"
                  : "text-[var(--ink-mid)]"
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
        description={PACKAGE_HISTORY_EMPTY_DESCRIPTION}
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
        description="Ödeme sağlayıcısı doğrulamalı tahsilat ve iade sonuçların burada görünecek."
      />
    );
  }

  return (
    <div className="space-y-2">
      {monetaryEntries.map((entry) => (
        <div
          key={entry.id}
          className="flex flex-col items-start gap-3 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] p-5 md:flex-row md:items-center md:justify-between"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium">{entryLabel(entry)}</p>
            <p className="text-xs text-muted-foreground">{formatDate(entry.created_at)}</p>
          </div>
          <div className="text-left text-sm md:text-right">
            <p className="font-semibold tabular-nums text-[var(--ink)]">{formatPrice(entry.amount)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function PaymentsContent() {
  return (
    <ProfileScreen
      title="Ödemeler"
      description="Paketlerini ve ödeme hareketlerini tek yerde incele."
    >
      <div className="space-y-12">
        <section>
          <div className="mb-5">
            <h2 className="text-xl font-bold text-[var(--ink)]">Paketlerim</h2>
            <p className="mt-1 text-sm text-[var(--ink-mid)]">Ders haklarını, tutarları ve paket durumlarını takip et.</p>
          </div>
          <PackagesSection />
        </section>
        <section>
          <div className="mb-5">
            <h2 className="text-xl font-bold text-[var(--ink)]">Ödeme geçmişi</h2>
            <p className="mt-1 text-sm text-[var(--ink-mid)]">Yalnız ödeme sağlayıcısının doğruladığı tahsilat ve iade sonuçları burada görünür.</p>
          </div>
          <PaymentHistorySection />
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
