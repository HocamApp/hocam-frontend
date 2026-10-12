import type { ReactNode } from "react";

import { formatPrice } from "@/lib/utils";

export interface RefundFiguresProps {
  /** Null when the request carries no stored working (an older one). */
  paid: number | null;
  paidLabel: string;
  deduction: number;
  deductionLabel: string;
  /** "2 ders × 850 ₺" under the deduction. */
  deductionNote?: string;
  refund: number;
  refundLabel: string;
  /** Shown instead of the deduction row when nothing was used. */
  children?: ReactNode;
}

function Row({
  label,
  value,
  note,
  strong = false,
}: {
  label: string;
  value: string;
  note?: string;
  strong?: boolean;
}) {
  return (
    <div
      className={
        strong
          ? "flex items-baseline justify-between gap-4 border-t border-line pt-4"
          : "flex items-baseline justify-between gap-4"
      }
    >
      <dt className="min-w-0">
        <span className={strong ? "text-base font-bold text-ink" : "text-base text-ink"}>{label}</span>
        {note && <span className="mt-0.5 block text-sm text-ink-mid">{note}</span>}
      </dt>
      <dd
        className={
          strong
            ? "shrink-0 text-xl font-bold tabular-nums text-ink"
            : "shrink-0 text-base font-medium tabular-nums text-ink"
        }
      >
        {value}
      </dd>
    </div>
  );
}

/** Paid, minus what was used, is what comes back. */
export function RefundFigures({
  paid,
  paidLabel,
  deduction,
  deductionLabel,
  deductionNote,
  refund,
  refundLabel,
  children,
}: RefundFiguresProps) {
  return (
    <div>
      <dl className="space-y-3">
        {paid !== null && <Row label={paidLabel} value={formatPrice(paid)} />}
        {deduction > 0 && (
          <Row label={deductionLabel} value={`− ${formatPrice(deduction)}`} note={deductionNote} />
        )}
        <Row label={refundLabel} value={formatPrice(refund)} strong />
      </dl>
      {children}
    </div>
  );
}
