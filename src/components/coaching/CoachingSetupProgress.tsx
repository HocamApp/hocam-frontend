"use client";

import Link from "next/link";
import { Check } from "@phosphor-icons/react";

import {
  COACHING_SETUP_CHIP_LABELS,
  COACHING_SETUP_STEPS,
  COACHING_SETUP_STEP_TITLES,
  type CoachingSetupStep,
} from "@/lib/coachingSetup";

const SEGMENT_CLASS = {
  done: "bg-gold",
  current: "bg-pink",
  todo: "bg-line",
} as const;

/**
 * Seven segments, one per step: gold once its data is saved, pink for the step
 * in progress, empty for the rest. Under them, one chip per finished step with
 * the value it saved, so a tutor can hop back to change one thing without
 * walking the whole sequence again.
 *
 * "Done" comes from the caller (saved data), never from position: a tutor who
 * reopens the first step of a finished setup still sees the others as done.
 * Plain class strings throughout: tailwind-merge would drop a named size next
 * to a text colour.
 */
export function CoachingSetupProgress({
  currentStep,
  doneSteps,
  unlockedSteps,
  chipValues = {},
}: {
  currentStep: CoachingSetupStep;
  doneSteps: readonly CoachingSetupStep[];
  unlockedSteps: readonly CoachingSetupStep[];
  chipValues?: Partial<Record<CoachingSetupStep, string>>;
}) {
  const stepNumber = COACHING_SETUP_STEPS.indexOf(currentStep) + 1;
  const total = COACHING_SETUP_STEPS.length;
  const position = `Adım ${stepNumber} / ${total}`;
  const chips = COACHING_SETUP_STEPS.filter(
    (step) => doneSteps.includes(step) && unlockedSteps.includes(step)
  );

  return (
    <nav
      aria-label="Koçluk kurulum adımları"
      className="rounded-card border border-line bg-surface p-4 sm:p-5"
    >
      <div
        role="progressbar"
        aria-label="Koçluk kurulumu"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={stepNumber}
        aria-valuetext={position}
        className="flex gap-1"
      >
        {COACHING_SETUP_STEPS.map((step) => {
          const state = step === currentStep ? "current" : doneSteps.includes(step) ? "done" : "todo";
          return (
            <span
              key={step}
              data-state={state}
              className={`h-2 flex-1 rounded-pill ${SEGMENT_CLASS[state]}`}
            />
          );
        })}
      </div>

      <p className="mt-4 text-label font-medium text-pink">{position}</p>
      <h2 className="mt-0.5 text-h3-m font-bold tracking-[-0.025em] md:text-h3 md:font-bold">
        {COACHING_SETUP_STEP_TITLES[currentStep]}
      </h2>

      {chips.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {chips.map((step) => {
            const value = chipValues[step];
            const current = step === currentStep;
            return (
              <li key={step}>
                <Link
                  href={`?step=${step}`}
                  aria-current={current ? "step" : undefined}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-pill border bg-surface px-3 text-small text-ink transition-colors duration-[var(--duration-state)] hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 ${
                    current ? "border-ink" : "border-line"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded-pill bg-gold text-gold-ink"
                  >
                    <Check className="h-3 w-3" weight="bold" />
                  </span>
                  {value
                    ? `${COACHING_SETUP_CHIP_LABELS[step]} · ${value}`
                    : COACHING_SETUP_CHIP_LABELS[step]}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </nav>
  );
}
