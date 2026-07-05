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
import type { PaymentLedgerEntry } from "@/types";

const ENTRY_TYPE_LABELS: Record<string, string> = {
  package_purchase_created: "Paket talebi oluşturuldu",
  package_purchase_paid: "Paket ödemesi onaylandı",
};

function entryLabel(entry: PaymentLedgerEntry): string {
  return entry.description || ENTRY_TYPE_LABELS[entry.entry_type] || entry.entry_type;
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

  return (
    <div className="space-y-3">
      {data.map((purchase) => (
        <div key={purchase.id} className="rounded-lg border p-3">
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
              <p className="text-xs text-muted-foreground">Onay tarihi</p>
              <p className="font-medium">
                {purchase.paid_at ? formatDate(purchase.paid_at) : "—"}
              </p>
            </div>
          </div>
        </div>
      ))}
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
