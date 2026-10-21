"use client";

import { Check } from "@phosphor-icons/react";

import {
  REPORT_STEPS,
  type ReportStepKey,
  type ReportStepState,
} from "@/lib/coachingReportDraft";

const STATE_TEXT: Record<ReportStepState, string> = {
  done: "Tamamlandı.",
  current: "Sıradaki adım.",
  todo: "Bekliyor.",
};

/** A shape as well as a colour, so the state is never colour alone. */
function Marker({ state }: { state: ReportStepState }) {
  if (state === "done") {
    return (
      <span
        aria-hidden="true"
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-pill bg-gold text-gold-ink"
      >
        <Check className="h-3 w-3" weight="bold" />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`h-5 w-5 shrink-0 rounded-pill border-2 ${state === "current" ? "border-pink" : "border-line"}`}
    />
  );
}

/**
 * The steps of the report, side by side with the one that is open: a ticked
 * disc for what is written, a pink ring for where the tutor is, a grey ring for
 * what waits. Any step can be opened from here.
 */
export function ReportStepRail({
  states,
  onSelect,
}: {
  states: Record<ReportStepKey, ReportStepState>;
  onSelect: (step: ReportStepKey) => void;
}) {
  return (
    <nav aria-label="Rapor adımları" className="overflow-hidden rounded-card border border-line bg-surface">
      <p className="bg-ink px-4 py-3 text-small font-medium text-paper">Adımlar</p>
      <ol className="py-1.5">
        {REPORT_STEPS.map((step) => {
          const state = states[step.key];
          return (
            <li key={step.key}>
              <button
                type="button"
                aria-current={state === "current" ? "step" : undefined}
                onClick={() => onSelect(step.key)}
                className={`flex min-h-11 w-full items-center gap-3 px-4 py-2 text-left text-small text-ink transition-colors duration-[--duration-state] hover:bg-paper ${
                  state === "current" ? "bg-paper font-medium" : ""
                }`}
              >
                <Marker state={state} />
                <span>
                  <span className="sr-only">{STATE_TEXT[state]}</span>{" "}
                  <span>{step.label}</span>
                  {step.optional ? (
                    <>
                      {" "}
                      <span className="block text-label text-ink-mid">isteğe bağlı</span>
                    </>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** On a phone the list is hidden; this thin bar says how far along the form is. */
export function ReportStepProgress({
  states,
  current,
}: {
  states: Record<ReportStepKey, ReportStepState>;
  current: ReportStepKey;
}) {
  const index = REPORT_STEPS.findIndex((step) => step.key === current);
  return (
    <div
      role="progressbar"
      aria-label="Rapor adımları"
      aria-valuemin={1}
      aria-valuemax={REPORT_STEPS.length}
      aria-valuenow={index + 1}
      aria-valuetext={`Adım ${index + 1} / ${REPORT_STEPS.length}`}
      className="flex gap-1 lg:hidden"
    >
      {REPORT_STEPS.map((step) => (
        <span
          key={step.key}
          className={`h-1.5 flex-1 rounded-pill ${
            states[step.key] === "current" ? "bg-pink" : states[step.key] === "done" ? "bg-gold" : "bg-line"
          }`}
        />
      ))}
    </div>
  );
}
