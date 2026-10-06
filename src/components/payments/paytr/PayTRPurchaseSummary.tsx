"use client";

import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatTryMinor } from "@/lib/money";
import { formatPrice } from "@/lib/utils";
import type { PackagePurchase, PayTRPaymentStatus } from "@/types";

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
  paymentStatus,
  includesCoaching = false,
  className,
}: {
  purchase: PackagePurchase | null | undefined;
  paymentStatus?: PayTRPaymentStatus | null;
  includesCoaching?: boolean;
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
  const combined = includesCoaching || (paymentStatus?.coaching_amount_minor ?? 0) > 0;
  const lessonMinor = paymentStatus?.lesson_amount_minor;
  const coachingMinor = paymentStatus?.coaching_amount_minor;
  const verifiedCombined = Boolean(
    facts && paymentStatus && paymentStatus.currency === "TL" &&
    Number.isSafeInteger(lessonMinor) && Number.isSafeInteger(coachingMinor) &&
    Number.isSafeInteger(paymentStatus.amount_minor) &&
    lessonMinor === facts.total * 100 && coachingMinor! >= 0 &&
    paymentStatus.amount_minor === lessonMinor! + coachingMinor! &&
    Number.isSafeInteger(paymentStatus.coaching_subtotal_minor) &&
    Number.isSafeInteger(paymentStatus.coaching_discount_minor) &&
    paymentStatus.coaching_subtotal_minor! - paymentStatus.coaching_discount_minor! === coachingMinor
  );
  if (!facts || (combined && !verifiedCombined)) {
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
    { label: combined ? "Ders ara toplam" : "Ara toplam", minor: facts.subtotal * 100, deduction: false },
    { label: "Paket indirimi", minor: facts.packageDiscount * 100, deduction: true },
    { label: "Promosyon indirimi", minor: facts.promoDiscount * 100, deduction: true },
    ...(combined ? [
      { label: "Koçluk ara toplam", minor: paymentStatus!.coaching_subtotal_minor!, deduction: false },
      { label: "Koçluk indirimi", minor: paymentStatus!.coaching_discount_minor!, deduction: true },
    ] : []),
  ].filter((row) => !row.deduction || row.minor > 0);

  return (
    <section aria-label="Paket özeti" className={wrapperClassName(className)}>
      <div className="flex items-center gap-3">
        <Avatar shape="circle" className="h-10 w-10 shrink-0">
          {facts.tutorAvatarUrl && <AvatarImage src={facts.tutorAvatarUrl} alt="" />}
          <AvatarFallback className="bg-[#fbf6f6] text-[#02171a]">{facts.tutorInitials}</AvatarFallback>
        </Avatar>
        <p className="min-w-0 break-words text-base font-medium">
          {facts.tutorName}
        </p>
      </div>

      <p className="mt-4 text-base font-medium">{facts.planName}</p>
      <p className="mt-1 text-sm text-[#5c6b6d]">
        {facts.totalCredits} ders · {facts.lessonDurationMinutes} dakika
      </p>
      {combined && <p className="mt-1 text-sm text-[#5c6b6d]">Koçluk paketi dahil</p>}

      <div className="mt-5 border-t border-[#e6dddd] pt-4">
        <p className="text-sm text-[#5c6b6d]">Toplam ödeme</p>
        <p className="mt-1 text-[1.75rem] font-semibold leading-9">
          {combined ? formatTryMinor(paymentStatus!.amount_minor) : formatPrice(facts.total)}
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
              {row.deduction ? "−" : ""}
              {combined ? formatTryMinor(row.minor) : formatPrice(row.minor / 100)}
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
