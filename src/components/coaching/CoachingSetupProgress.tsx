"use client";

import { useState } from "react";
import Link from "next/link";
import { CaretDown, Check, LockKey } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";
import { COACHING_SETUP_STEPS, type CoachingSetupStep } from "@/lib/coachingSetup";

const STEP_LABELS: Record<CoachingSetupStep, string> = {
  frequency: "Görüşme düzeni",
  price: "Koçluk fiyatı",
  exams: "Koçluk verdiğin sınavlar",
  description: "Kısa açıklama",
  availability: "Koçluk müsaitliği",
  capacity: "Kapasite",
  preview: "Öğrenci görünümü",
  publish: "Yayınlama",
};

export function CoachingSetupProgress({
  currentStep,
  unlockedSteps,
}: {
  currentStep: CoachingSetupStep;
  unlockedSteps: readonly CoachingSetupStep[];
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentIndex = COACHING_SETUP_STEPS.indexOf(currentStep);
  const nextStep = COACHING_SETUP_STEPS[currentIndex + 1];
  const stepNumber = currentIndex + 1;

  return (
    <nav
      aria-label="Koçluk kurulum adımları"
      className="rounded-card border border-line bg-surface p-3 sm:p-5"
    >
      <div className="md:hidden">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-label font-medium text-pink">
              Adım {stepNumber} / {COACHING_SETUP_STEPS.length}
            </p>
            <h2 className="mt-0.5 text-lg font-semibold tracking-[-0.025em]">
              {STEP_LABELS[currentStep]}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {nextStep ? `Sırada: ${STEP_LABELS[nextStep]}` : "Son adım: teklifini kontrol et"}
            </p>
          </div>
          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-controls="coaching-setup-stage-list"
            aria-label={mobileOpen ? "Kurulum adımlarını gizle" : "Kurulum adımlarını göster"}
            onClick={() => setMobileOpen((open) => !open)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-pill border border-ink bg-transparent text-ink transition-colors duration-[var(--duration-state)] hover:bg-ink hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
          >
            <CaretDown aria-hidden="true" className={cn("h-4 w-4 transition-transform", mobileOpen && "rotate-180")} />
          </button>
        </div>
        <div
          role="progressbar"
          aria-label="Koçluk kurulumu"
          aria-valuemin={1}
          aria-valuemax={COACHING_SETUP_STEPS.length}
          aria-valuenow={stepNumber}
          className="mt-3 h-1.5 overflow-hidden rounded-pill bg-line"
        >
          <span
            aria-hidden="true"
            className="block h-full rounded-pill bg-pink transition-[width] duration-[var(--duration-state)] motion-reduce:transition-none"
            style={{ width: `${(stepNumber / COACHING_SETUP_STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <ol
        id="coaching-setup-stage-list"
        className={cn(
          "relative mt-4 gap-2 md:mt-0 md:grid md:grid-cols-8",
          mobileOpen ? "grid" : "hidden"
        )}
      >
        {COACHING_SETUP_STEPS.map((step, index) => {
          const unlocked = unlockedSteps.includes(step);
          const current = step === currentStep;
          const complete = index < currentIndex;
          const content = (
            <>
              <span
                className={cn(
                    "relative z-10 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-pill border bg-surface text-xs font-semibold transition-colors duration-[var(--duration-state)]",
                  current && "border-pink bg-pink text-white",
                  complete && !current && "border-success bg-success-soft text-success",
                  !complete && !current && unlocked && "border-line text-ink-mid",
                  !unlocked && "border-line bg-paper text-ink-mid"
                )}
              >
                {complete ? <Check aria-hidden="true" className="h-4 w-4" /> : index + 1}
              </span>
              <span className="min-w-0 flex-1 md:text-center">
                <span className={cn("block text-xs font-semibold leading-4", !unlocked && "text-muted-foreground")}>
                  {STEP_LABELS[step]}
                </span>
                <span className="mt-0.5 block text-[10px] text-muted-foreground">
                  {current ? "Şu an buradasın" : complete ? "Tamamlandı" : unlocked ? "Hazır" : "Sırayla açılır"}
                </span>
              </span>
              {!unlocked ? <LockKey aria-hidden="true" className="h-3.5 w-3.5 text-ink-mid md:hidden" /> : null}
            </>
          );

          return (
            <li key={step} className="relative md:min-w-0">
              {index < COACHING_SETUP_STEPS.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-4 top-8 h-[calc(100%+0.5rem)] w-px bg-border md:left-[calc(50%+1rem)] md:right-[calc(-50%+1rem)] md:top-4 md:h-0.5 md:w-auto",
                    complete && "bg-success"
                  )}
                />
              ) : null}
              {unlocked ? (
                <Link
                  href={`?step=${step}`}
                  aria-label={STEP_LABELS[step]}
                  aria-current={current ? "step" : undefined}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "relative flex min-h-14 items-center gap-3 rounded-input px-2 py-2 transition-colors duration-[var(--duration-state)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 md:min-h-24 md:flex-col md:justify-start md:gap-2 md:px-1 md:pt-0",
                    current ? "bg-paper md:bg-transparent" : "hover:bg-paper md:hover:bg-transparent"
                  )}
                >
                  {content}
                </Link>
              ) : (
                <div
                  aria-disabled="true"
                  className="relative flex min-h-14 items-center gap-3 rounded-input px-2 py-2 md:min-h-24 md:flex-col md:justify-start md:gap-2 md:px-1 md:pt-0"
                >
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
