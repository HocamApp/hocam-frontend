"use client";

import { ClockCountdown, Prohibit } from "@phosphor-icons/react";

import {
  bookingStatusLabel,
  isAttentionStatus,
} from "@/lib/bookingStatusCopy";
import type { Booking } from "@/types";

/**
 * The dashboard's own status chip.
 *
 * Deliberately not `components/shared/StatusBadge`: that one paints with raw
 * Tailwind palette steps (amber-500, sky-700, slate-400) which the dashboard's
 * design contract rules out, and it carries labels for two other record types
 * this surface never shows. Two states are enough here — something is waiting
 * on someone, or it is not.
 *
 * A cancellation also carries a mark, so the list of dozens of them is told
 * apart from a list of finished lessons by shape and not by one grey word.
 */
export function LessonStatusChip({
  status,
  className,
}: {
  status: Booking["status"];
  className?: string;
}) {
  const label = bookingStatusLabel(status);
  if (!label) return null;
  const Mark =
    status === "cancelled" ? Prohibit : status === "expired" ? ClockCountdown : null;

  const tone = isAttentionStatus(status)
    ? "border-ink bg-ink text-white"
    : "border-line bg-paper text-ink-mid";

  // A template string, not cn(): tailwind-merge reads the custom size
  // `text-label` as a colour and would drop it for `text-white` / `text-ink-mid`,
  // which left every chip at the inherited 16px and wrapping inside its pill
  // on a phone.
  return (
    <span
      className={`inline-flex max-w-full shrink-0 items-center gap-1 rounded-pill border px-2 py-0.5 text-label sm:px-2.5 ${tone} ${className ?? ""}`}
    >
      {Mark && <Mark className="size-4 shrink-0" weight="regular" aria-hidden="true" />}
      {label}
    </span>
  );
}
