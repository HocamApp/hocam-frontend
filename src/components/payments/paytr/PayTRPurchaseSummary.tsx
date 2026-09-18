"use client";

import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatPrice } from "@/lib/utils";
import type { PackagePurchase } from "@/types";

import { readPayTRPurchaseFacts } from "./paytrPurchaseFacts";

/**
 * What the student is about to pay for, read from the created purchase.
 *
 * The total is the server's `total_price`, never a sum this component works
 * out: if the rows and the total disagree, the total is still what PayTR will
 * collect, and showing anything else would be a lie about the charge. When an
 * amount cannot be trusted the summary says so instead of printing 0 ₺.
 *
 * The purchase carries no confirmed lesson schedule, so none is claimed here,
 * and the customer's own address and phone are never echoed back.
 */
export function PayTRPurchaseSummary({
  purchase,
  className,
}: {
  purchase: PackagePurchase | null | undefined;
  className?: string;
}) {
  const detailsId = React.useId();
  const [expanded, setExpanded] = React.useState(false);

  if (purchase === undefined) {
    return (
      <section
        aria-label="Paket özeti"
        className={wrapperClassName(className)}
        role="status"
      >
        <p className="text-sm text-[#5c6b6d]">Paket bilgileri yükleniyor</p>
        <div aria-hidden="true" className="mt-4 space-y-3">
          <div className="h-10 rounded-[10px] bg-white/60" />
          <div className="h-6 w-2/3 rounded bg-white/60" />
          <div className="h-8 w-1/2 rounded bg-white/60" />
        </div>
      </section>
    );
  }

  const facts = readPayTRPurchaseFacts(purchase);
  if (!facts) {
    return (
      <section aria-label="Paket özeti" className={wrapperClassName(className)}>
        <p className="text-sm text-[#02171a]">Paket tutarı görüntülenemiyor.</p>
        <p className="mt-2 text-[0.8125rem] text-[#5c6b6d]">
          Güncel bilgileri Paketlerim alanından kontrol edebilirsin.
        </p>
      </section>
    );
  }

  const rows = [
    { label: "Ara toplam", value: facts.subtotal },
    { label: "Paket indirimi", value: facts.packageDiscount },
    { label: "Promosyon indirimi", value: facts.promoDiscount },
  ].filter((row) => row.label === "Ara toplam" || row.value > 0);

  return (
    <section aria-label="Paket özeti" className={wrapperClassName(className)}>
      <div className="flex items-center gap-3">
        <Avatar shape="circle" className="h-10 w-10 shrink-0">
          {facts.tutorAvatarUrl && <AvatarImage src={facts.tutorAvatarUrl} alt="" />}
          <AvatarFallback>{facts.tutorInitials}</AvatarFallback>
        </Avatar>
        <p className="min-w-0 break-words text-base font-medium">
          {facts.tutorName}
        </p>
      </div>

      <p className="mt-4 text-base font-medium">{facts.planName}</p>
      <p className="mt-1 text-sm text-[#5c6b6d]">
        {facts.totalCredits} ders · {facts.lessonDurationMinutes} dakika
      </p>

      <div className="mt-5 border-t border-[#e6dddd] pt-4">
        <p className="text-sm text-[#5c6b6d]">Toplam ödeme</p>
        <p className="mt-1 text-[1.75rem] font-semibold leading-9">
          {formatPrice(facts.total)}
        </p>
        <p className="mt-2 text-sm text-[#5c6b6d]">
          Tek seferlik ödeme. Otomatik yenilenmez.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        aria-controls={detailsId}
        className="mt-4 flex min-h-[2.75rem] w-full items-center justify-between rounded-[10px] border border-[#e6dddd] bg-white px-3 text-sm font-medium lg:hidden"
      >
        Fiyat ayrıntıları
        <span aria-hidden="true">{expanded ? "−" : "+"}</span>
      </button>

      <dl
        id={detailsId}
        className={`mt-4 space-y-2 text-sm ${expanded ? "block" : "hidden lg:block"}`}
      >
        {rows.map((row) => (
          <div key={row.label} className="flex flex-wrap justify-between gap-x-4">
            <dt className="text-[#5c6b6d]">{row.label}</dt>
            <dd className="font-medium">
              {row.label === "Ara toplam" ? "" : "−"}
              {formatPrice(row.value)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function wrapperClassName(className?: string) {
  return `rounded-[20px] bg-[var(--checkout-right-surface,#fce5f1)] p-4 text-[#02171a] sm:p-6 ${className ?? ""}`;
}
