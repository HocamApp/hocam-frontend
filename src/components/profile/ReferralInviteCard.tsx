"use client";

import { useState } from "react";
import { Check, Copy, Gift } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { fetchReferralInfo } from "@/lib/paymentsApi";

export function ReferralInviteCard() {
  const [copied, setCopied] = useState(false);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["referral-info"],
    queryFn: fetchReferralInfo,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-36 items-center justify-center rounded-[var(--radius-card)] border border-[var(--gold-ink)]/15 bg-[var(--gold)]">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError || !data) {
    return <ErrorMessage message="Davet bilgin yüklenemedi. Lütfen tekrar deneyin." />;
  }

  const handleCopy = async () => {
    try {
      let didCopy = false;
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(data.referral_url);
          didCopy = true;
        } catch {
          didCopy = false;
        }
      }

      if (!didCopy) {
        const textarea = document.createElement("textarea");
        textarea.value = data.referral_url;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.top = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        didCopy = document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      if (!didCopy) throw new Error("Clipboard fallback failed");

      setCopied(true);
      toast.success("Davet linki kopyalandı.");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Kopyalanamadı. Linki alandan elle kopyalayabilirsin.");
    }
  };

  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--gold-ink)]/20 bg-[var(--gold)] p-5 text-[var(--gold-ink)] sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--gold-ink)]/25 bg-[var(--surface)]">
            <Gift aria-hidden size={22} weight="regular" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-75">
              Arkadaşını davet et
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight">
              Hocam&apos;ı birlikte keşfedin
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-6 opacity-80">
              Davet linkini paylaş. Referans ödülleri aktif olduğunda bu kod üzerinden takip edilecek.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          <code className="rounded-[var(--radius-input)] border border-[var(--gold-ink)]/25 bg-[var(--surface)] px-3 py-2 text-sm font-bold tracking-[0.12em] text-[var(--gold-ink)]">
            {data.referral_code}
          </code>
          <Button
            type="button"
            onClick={handleCopy}
            className="min-h-11 rounded-[var(--radius-pill)] border border-[var(--gold-ink)] bg-[var(--gold-ink)] px-5 text-[var(--surface)] hover:bg-[var(--gold-ink)]/90 hover:text-[var(--surface)]"
          >
            {copied ? <Check aria-hidden size={18} /> : <Copy aria-hidden size={18} />}
            {copied ? "Kopyalandı" : "Linki kopyala"}
          </Button>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {copied ? "Davet linki kopyalandı" : ""}
      </p>
    </section>
  );
}
