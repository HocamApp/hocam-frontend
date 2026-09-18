"use client";

import { CheckCircle, Clock, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";

import { payTRStateCopy, type PayTRCopyTone, type PayTRStateCopyInput } from "./paytrStateCopy";

/**
 * Every settled or blocked outcome, in one card.
 *
 * The heading and the sentence carry the meaning; the icon and colour only
 * reinforce it. Which action appears comes from the approved copy map, so an
 * unresolved payment can offer a re-check and a verified failure can offer one
 * retry, while a purchase under review offers neither.
 */

export const PAYTR_PACKAGES_HREF = "/profile/payments";

const ICONS: Record<PayTRCopyTone, typeof CheckCircle> = {
  success: CheckCircle,
  error: WarningCircle,
  neutral: Clock,
  busy: Clock,
};

const ICON_COLORS: Record<PayTRCopyTone, string> = {
  success: "text-[#1c7a55]",
  error: "text-[#b33a24]",
  neutral: "text-[#5c6b6d]",
  busy: "text-[#5c6b6d]",
};

export function PayTRResultState({
  state,
  onRecheck,
  onRetry,
  className,
}: {
  state: PayTRStateCopyInput;
  /** Re-reads the server state. Never starts a payment. */
  onRecheck?: () => void;
  /** Only wired where the backend verified the attempt failed. */
  onRetry?: () => void;
  className?: string;
}) {
  const copy = payTRStateCopy(state);
  const Icon = ICONS[copy.tone];
  const showRetry = copy.action === "retry" && Boolean(onRetry);
  const showRecheck = copy.action === "recheck" && Boolean(onRecheck);

  return (
    <section
      className={`rounded-[20px] border border-[#e6dddd] bg-white p-4 text-[#02171a] sm:p-6 ${className ?? ""}`}
    >
      <Icon
        size={48}
        weight="regular"
        aria-hidden="true"
        className={`${ICON_COLORS[copy.tone]}`}
      />
      <h2 className="mt-3 text-[1.375rem] font-semibold leading-8">{copy.title}</h2>
      <p className="mt-2 text-sm text-[#5c6b6d]">{copy.description}</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {showRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex min-h-[3rem] items-center justify-center rounded-full bg-[var(--pink-deep)] px-5 text-base font-medium text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02171a] focus-visible:ring-offset-2"
          >
            Yeniden ödeme başlat
          </button>
        )}
        {showRecheck && (
          <button
            type="button"
            onClick={onRecheck}
            className="flex min-h-[3rem] items-center justify-center rounded-full border border-[#02171a] px-5 text-base font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02171a] focus-visible:ring-offset-2"
          >
            Durumu kontrol et
          </button>
        )}
        <Link
          href={PAYTR_PACKAGES_HREF}
          className="inline-flex min-h-[2.75rem] items-center text-base underline underline-offset-4 hover:text-[var(--pink-deep)]"
        >
          Paketlerime git
        </Link>
      </div>
    </section>
  );
}
