import { Check, X } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";
import type { TimelineState, TimelineStep } from "@/lib/refundPresentation";

const STATE_TEXT: Record<TimelineState, string> = {
  done: "tamamlandı",
  current: "şu an bu aşamada",
  upcoming: "sırada",
  stopped: "sonuçlandı",
};

/**
 * The marker says the state by its shape, not only its colour: a check for
 * done, a ring with a dot for where the request is, an empty ring for what is
 * still to come, a cross for a request that ended without a refund. The state
 * is also in the text for a screen reader.
 */
function Marker({ state }: { state: TimelineState }) {
  const base = "relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-pill";
  if (state === "done") {
    return (
      <span aria-hidden className={cn(base, "bg-ink text-paper")}>
        <Check size={14} weight="bold" />
      </span>
    );
  }
  if (state === "stopped") {
    return (
      <span aria-hidden className={cn(base, "bg-error text-white")}>
        <X size={14} weight="bold" />
      </span>
    );
  }
  if (state === "current") {
    return (
      <span aria-hidden className={cn(base, "border-2 border-ink bg-surface")}>
        <span className="h-2 w-2 rounded-pill bg-ink" />
      </span>
    );
  }
  return <span aria-hidden className={cn(base, "border-2 border-line bg-surface")} />;
}

export function RefundTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol aria-label="İade sürecinin aşamaları">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        return (
          <li
            key={step.key}
            className={cn("relative flex gap-4", !isLast && "pb-6")}
            aria-current={step.state === "current" ? "step" : undefined}
          >
            {!isLast && (
              <span
                aria-hidden
                className={cn(
                  "absolute bottom-0 left-[11px] top-7 w-0.5",
                  step.state === "done" ? "bg-ink" : "bg-line"
                )}
              />
            )}
            <Marker state={step.state} />
            <div className="min-w-0">
              <p
                className={cn(
                  "text-base font-medium",
                  step.state === "upcoming" ? "text-ink-mid" : "text-ink"
                )}
              >
                {step.title}
                <span className="sr-only">{`, ${STATE_TEXT[step.state]}`}</span>
              </p>
              <p className="mt-1 text-sm leading-6 text-ink-mid">{step.detail}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
