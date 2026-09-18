"use client";

import { CircleNotch } from "@phosphor-icons/react";
import { useReducedMotion } from "motion/react";

import { payTRStateCopy, type PayTRStateCopyInput } from "./paytrStateCopy";

/**
 * The waiting card: a token request in flight, a purchase still loading, a
 * result the server has not settled yet.
 *
 * One polite live region, so a screen reader hears the change once rather than
 * on every poll, and no payment control of any kind — a wait is not an
 * invitation to start a second attempt.
 */
export function PayTRProcessingState({
  state,
  className,
}: {
  state: PayTRStateCopyInput;
  className?: string;
}) {
  const copy = payTRStateCopy(state);
  const reduceMotion = useReducedMotion();

  return (
    <section
      role="status"
      aria-busy={copy.tone === "busy"}
      className={`rounded-[20px] border border-[#e6dddd] bg-white p-4 text-[#02171a] sm:p-6 ${className ?? ""}`}
    >
      <div className="flex items-start gap-3">
        <CircleNotch
          size={24}
          aria-hidden="true"
          className={`mt-0.5 shrink-0 text-[#5c6b6d] ${reduceMotion ? "" : "animate-spin"}`}
        />
        <div className="min-w-0">
          <h2 className="text-[1.375rem] font-semibold leading-8">{copy.title}</h2>
          <p className="mt-2 text-sm text-[#5c6b6d]">{copy.description}</p>
        </div>
      </div>
    </section>
  );
}
