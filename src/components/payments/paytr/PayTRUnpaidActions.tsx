"use client";

import { useState } from "react";

import { InlineError } from "@/components/shared/InlineError";

type Intent = "cancel" | "change";

const COPY: Record<Intent, { open: string; confirm: string; body: string }> = {
  change: {
    open: "Planı değiştir",
    confirm: "Planı değiştir",
    body: "Planını değiştirmek için bu satın alma iptal edilir ve ayırdığımız saatler serbest kalır. Ardından yeni bir plan ve ders saatleri seçersin.",
  },
  cancel: {
    open: "Satın almayı iptal et",
    confirm: "Satın almayı iptal et",
    body: "Bu satın alma iptal edilir ve ayırdığımız saatler yeniden herkese açılır. İstersen sonra baştan başlayabilirsin.",
  },
};

/**
 * The two ways out of a purchase that has not been paid for: change the plan,
 * or give it up. Both end the purchase and free its hours, so both ask first
 * and say what happens. Neither is offered while a payment may be in flight
 * (the page decides that from the server's status, not from this component).
 */
export function PayTRUnpaidActions({
  onConfirm,
  pending,
  error,
  className,
}: {
  onConfirm: (intent: Intent) => void;
  /** Which of the two is being sent now, if either. */
  pending: Intent | null;
  error: string | null;
  className?: string;
}) {
  const [confirming, setConfirming] = useState<Intent | null>(null);
  const open = confirming ?? pending;

  return (
    <section aria-label="Satın almayı değiştir ya da iptal et" className={className}>
      {open === null ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
          {(["change", "cancel"] as const).map((intent) => (
            <button
              key={intent}
              type="button"
              onClick={() => setConfirming(intent)}
              className="inline-flex min-h-[2.75rem] items-center text-sm underline underline-offset-4 hover:text-[var(--pink-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02171a] focus-visible:ring-offset-2"
            >
              {COPY[intent].open}
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-[20px] border border-[#e6dddd] bg-white p-4 sm:p-6">
          <p className="text-sm leading-6 text-[#02171a]">{COPY[open].body}</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={pending !== null}
              onClick={() => onConfirm(open)}
              aria-busy={pending !== null}
              className="inline-flex min-h-[3rem] items-center justify-center rounded-full bg-[#b33a24] px-6 text-base font-medium text-white hover:brightness-95 disabled:bg-[#e6dddd] disabled:text-[#5c6b6d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02171a] focus-visible:ring-offset-2"
            >
              {pending !== null ? "İşleniyor" : COPY[open].confirm}
            </button>
            <button
              type="button"
              disabled={pending !== null}
              onClick={() => setConfirming(null)}
              className="inline-flex min-h-[3rem] items-center justify-center rounded-full border border-[#02171a] px-6 text-base font-medium disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02171a] focus-visible:ring-offset-2"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}
      <InlineError message={error} className="mt-3" />
    </section>
  );
}
