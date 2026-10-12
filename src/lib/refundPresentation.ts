/**
 * What a refund request shows, worked out from the request alone.
 *
 * Pure functions, no React, so each rule can be pinned by a test: which step of
 * the process a request is at, what each step says, and which request is the
 * one that blocks asking again.
 */
import type { RefundCalculation, RefundRequest, RefundStatus } from "@/types";
import { instantDateLabel } from "./instantTime";
import { serverNow } from "./serverClock";

/** The requests that count as "open": the package cannot be refunded again,
 * and cannot take new lessons, until one of them ends. */
const OPEN_STATUSES: readonly RefundStatus[] = ["requested", "approved"];

export function isOpenRefund(refund: Pick<RefundRequest, "status">): boolean {
  return OPEN_STATUSES.includes(refund.status);
}

/** The open request for a package, if there is one. */
export function openRefundFor(
  purchaseId: string,
  refunds: readonly RefundRequest[] | undefined
): RefundRequest | null {
  return (
    (refunds ?? []).find((refund) => refund.purchase === purchaseId && isOpenRefund(refund)) ?? null
  );
}

/** Newest first, whatever order the server sent them in. */
export function newestFirst(refunds: readonly RefundRequest[]): RefundRequest[] {
  return [...refunds].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

export type TimelineKey = "received" | "review" | "approved" | "refunded" | "rejected";
export type TimelineState = "done" | "current" | "upcoming" | "stopped";

export interface TimelineStep {
  key: TimelineKey;
  title: string;
  detail: string;
  state: TimelineState;
}

const BANK_NOTE = "Tutarın hesabına yansıma süresi bankana göre değişir.";

/**
 * The steps of a request, in order, each with the state it is in.
 *
 * A refused request ends at "Reddedildi": there is no approved or refunded step
 * to show as upcoming for something that will not happen. No step promises a
 * day the money arrives on; the provider's real timings are not known yet.
 */
export function refundTimeline(refund: RefundRequest, now: number = serverNow()): TimelineStep[] {
  const asked = instantDateLabel(refund.created_at);
  const received: TimelineStep = {
    key: "received",
    title: "Talep alındı",
    detail:
      refund.initiated_by === "platform"
        ? `${asked} tarihinde iade talebini senin adına açtık.`
        : `${asked} tarihinde iade talebini aldık.`,
    state: "done",
  };

  const decided = refund.decided_at ? instantDateLabel(refund.decided_at) : null;
  const dueAt = refund.due_at ? Date.parse(refund.due_at) : NaN;
  const overdue = Number.isFinite(dueAt) && now > dueAt;

  if (refund.status === "rejected") {
    return [
      received,
      {
        key: "review",
        title: "İnceleme",
        detail: decided
          ? `Talebin ${decided} tarihinde karara bağlandı.`
          : "Talebin karara bağlandı.",
        state: "done",
      },
      {
        key: "rejected",
        title: "Reddedildi",
        detail: "Talebin kabul edilmedi.",
        state: "stopped",
      },
    ];
  }

  const requested = refund.status === "requested";
  const processed = refund.status === "processed";

  const reviewDetail = requested
    ? overdue
      ? "Yanıt için belirtilen tarih geçti. Destek ekibine yazabilirsin."
      : refund.due_at
        ? `Destek ekibimiz talebini inceliyor. En geç ${instantDateLabel(refund.due_at)} tarihine kadar yanıt alırsın.`
        : "Destek ekibimiz talebini inceliyor."
    : decided
      ? `Talebin ${decided} tarihinde karara bağlandı.`
      : "Talebin karara bağlandı.";

  const cancelled = refund.calculation?.cancelled_lessons.length ?? 0;
  const approvedDetail = requested
    ? "Talebin onaylanırsa planlı derslerin iptal edilir."
    : cancelled > 0
      ? "Talebin onaylandı ve planlı derslerin iptal edildi."
      : "Talebin onaylandı.";

  const sentAt = refund.provider_refunded_at ?? refund.processed_at;
  const refundedDetail = processed
    ? `${sentAt ? `${instantDateLabel(sentAt)} tarihinde iade ödeme yöntemine gönderildi.` : "İade ödeme yöntemine gönderildi."} ${BANK_NOTE}`
    : requested
      ? "Onaydan sonra tutar ödeme yöntemine gönderilir."
      : `İade ödeme yöntemine gönderilecek. ${BANK_NOTE}`;

  return [
    received,
    {
      key: "review",
      title: "İnceleniyor",
      detail: reviewDetail,
      state: requested ? "current" : "done",
    },
    {
      key: "approved",
      title: "Onaylandı",
      detail: approvedDetail,
      state: requested ? "upcoming" : "done",
    },
    {
      key: "refunded",
      title: "İade edildi",
      detail: refundedDetail,
      state: processed ? "done" : requested ? "upcoming" : "current",
    },
  ];
}

/** The figures a request shows. The stored working is preferred; a request
 * from before it was stored still has the five numbers on the row itself. */
export interface RefundFigures {
  paid: number | null;
  deduction: number;
  refund: number;
  usedCredits: number;
  unitPrice: number;
}

export function refundFigures(refund: RefundRequest): RefundFigures {
  const calculation: RefundCalculation | null = refund.calculation;
  return {
    paid: calculation ? calculation.total_paid : null,
    deduction: refund.deduction_amount,
    refund: refund.refund_amount,
    usedCredits: refund.used_credits,
    unitPrice: refund.deduction_unit_price,
  };
}
