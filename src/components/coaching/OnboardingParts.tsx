"use client";

import Link from "next/link";
import { Check } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import type { CoachingCarouselSlide, CoachingContract } from "@/lib/coachingApi";
import { ONBOARDING_NEXT_LABELS, type OnboardingStepperStep } from "@/lib/coachingOnboarding";

/**
 * The parts of the coaching introduction. Plain class strings: tailwind-merge
 * would drop a named size next to a colour.
 */

const CARD = "rounded-card border border-line bg-surface";
const STATE_WORD: Record<OnboardingStepperStep["state"], string> = {
  done: ", tamam",
  current: ", şu an burada",
  todo: ", bekliyor",
};

/** Three numbered circles: pink once reached, a check for what is behind, grey for what is ahead. */
export function OnboardingStepper({ steps }: { steps: OnboardingStepperStep[] }) {
  return (
    <div className={`${CARD} px-4 py-3 sm:px-5`}>
      <ol aria-label="Koçluk tanıtım adımları" className="flex flex-wrap items-center gap-x-3 gap-y-2 text-small">
        {steps.map((step, index) => (
          <li
            key={step.key}
            aria-current={step.state === "current" ? "step" : undefined}
            className="flex items-center gap-x-3"
          >
            <span className="flex items-center gap-2">
              <span
                aria-hidden={step.state === "done" ? true : undefined}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-pill text-label font-bold ${
                  step.state === "todo" ? "border border-line bg-surface text-ink-mid" : "bg-pink text-white"
                }`}
              >
                {step.state === "done" ? <Check className="h-3.5 w-3.5" weight="bold" aria-hidden="true" /> : step.number}
              </span>
              <span className={step.state === "current" ? "font-bold text-ink" : step.state === "done" ? "font-medium text-ink" : "text-ink-mid"}>
                {step.state === "done" ? <span className="sr-only">{step.number}</span> : null}
                {step.label}
              </span>
              <span className="sr-only">{STATE_WORD[step.state]}</span>
            </span>
            {index < steps.length - 1 ? (
              <span aria-hidden="true" className="text-ink-mid">
                —
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Everything the server says about the service, all of it on the page: nothing hides behind a "next". */
export function OnboardingIntro({ slides }: { slides: CoachingCarouselSlide[] }) {
  return (
    <section className={`${CARD} px-5 py-2 sm:px-6`}>
      <h2 className="sr-only">Tanıtım</h2>
      <ol aria-label="Koçlukta seni neler bekliyor">
        {slides.map((slide, index) => (
          <li key={slide.id} className="flex gap-4 border-t border-line py-4 first:border-t-0">
            <span aria-hidden="true" className="w-5 shrink-0 pt-0.5 text-small tabular-nums text-ink-mid">
              {index + 1}
            </span>
            <div className="min-w-0">
              <h3 className="text-body font-bold text-ink">{slide.title}</h3>
              <p className="mt-1 max-w-[70ch] whitespace-pre-wrap text-small leading-[1.6] text-ink-mid">{slide.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** The contract, as the server wrote it, in a scrolling box that can be read at a normal size. */
export function OnboardingContract({ contract }: { contract: CoachingContract | undefined }) {
  return (
    <section aria-labelledby="onboarding-contract-title" className={`${CARD} space-y-3 p-5 sm:p-6`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h2 id="onboarding-contract-title" className="text-body font-bold text-ink">
          Koçluk sözleşmesi
        </h2>
        {contract ? <span className="text-small tabular-nums text-ink-mid">{`Sürüm ${contract.version}`}</span> : null}
      </div>
      <div
        role="region"
        aria-label="Sözleşme metni"
        tabIndex={0}
        className="max-h-[28rem] overflow-y-auto rounded-input border border-line bg-paper p-4 focus-visible:border-ink focus-visible:outline-none"
      >
        <pre className="whitespace-pre-wrap font-sans text-small leading-[1.6] text-ink">{contract?.text}</pre>
      </div>
    </section>
  );
}

/** The end: what was done, and what the tutor sets up next, in the order of the setup. */
export function OnboardingDone() {
  return (
    <section className={`${CARD} space-y-3 p-6 sm:p-8`}>
      <Check className="h-8 w-8 text-success" weight="bold" aria-hidden="true" />
      <h2 className="text-h3-m font-bold text-ink md:text-h3 md:font-bold">Koçluk tanıtımı tamamlandı</h2>
      <p className="max-w-[60ch] text-body text-ink-mid">Sırada koçluk teklifini kurmak var:</p>
      <p className="text-small font-medium text-ink">{ONBOARDING_NEXT_LABELS.join(" · ")}</p>
      <div className="pt-1">
        <Button asChild size="sm" variant="gold" className="min-h-11">
          <Link href="/dashboard/tutor/coaching/plan?step=frequency">Teklifini oluştur</Link>
        </Button>
      </div>
    </section>
  );
}
