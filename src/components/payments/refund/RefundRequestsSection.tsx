"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { instantDateLabel } from "@/lib/instantTime";
import { REFUND_LIST, refundReasonLabel } from "@/lib/refundCopy";
import { newestFirst } from "@/lib/refundPresentation";
import { refundStatusHref } from "@/lib/refundRoutes";
import { fetchRefundRequests } from "@/lib/refundsApi";
import { formatPrice } from "@/lib/utils";

import { RefundStatusBadge } from "./RefundStatusBadge";

/**
 * The student's refund requests, on the payments page. It shows nothing until
 * there is a request, and nothing if the list cannot be read: this section is
 * a way back to a request, and the entry on each package still works without
 * it (the server refuses a second open request on its own).
 */
export function RefundRequestsSection() {
  const { data } = useQuery({ queryKey: ["refund-requests"], queryFn: fetchRefundRequests });
  if (!data || data.length === 0) return null;

  return (
    <section aria-labelledby="refund-requests-title">
      <div className="mb-5">
        <h2 id="refund-requests-title" className="text-xl font-bold text-[var(--ink)]">
          {REFUND_LIST.title}
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-mid)]">{REFUND_LIST.description}</p>
      </div>
      <ul className="space-y-3">
        {newestFirst(data).map((refund) => (
          <li key={refund.id}>
            <Link
              href={refundStatusHref(refund.id)}
              className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-5 transition-colors duration-[--duration-state] hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="min-w-0">
                <span className="block text-base font-bold text-ink">
                  {refund.purchase_summary.tutor.name} {refund.purchase_summary.tutor.surname}
                </span>
                <span className="mt-0.5 block text-sm text-ink-mid">
                  {refundReasonLabel(refund.reason)}
                  {" · "}
                  <span className="tabular-nums">{instantDateLabel(refund.created_at)}</span>
                </span>
              </span>
              <span className="flex items-center gap-3">
                {refund.status !== "rejected" && (
                  <span className="text-base font-semibold tabular-nums text-ink">
                    {formatPrice(refund.refund_amount)}
                  </span>
                )}
                <RefundStatusBadge status={refund.status} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
