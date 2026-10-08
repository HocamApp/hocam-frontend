"use client";

import { Check } from "@phosphor-icons/react";
import Link from "next/link";
import { Children } from "react";

import { useCoachingFlag } from "@/hooks/useCoachingFlag";
import { TUTOR_EARNINGS_PREVIEW_ENABLED } from "@/lib/featureFlags";
import { formatPercent } from "@/lib/money";
import { cn } from "@/lib/utils";

import { YsEarningsCalculator } from "./YsEarningsCalculator";
import { YsFact } from "./YsFact";
import { YsStepList, type YsStep } from "./YsStepList";
import { YsTestimonialCard } from "./YsTestimonials";
import { tutors as copy } from "./ysHomeCopy";
import {
  AUTO_CONFIRM_HOURS,
  COACHING_TUTOR_TEXT,
  COMMISSION_PERCENT,
  isTodo,
  MAX_TUTOR_YKS_RANK,
  PRICE_RANGE_TL,
  TRIAL_MINUTES,
  TRIAL_PAID_TO_TUTOR,
  TUTOR_MIN_WEEKLY_HOURS,
  TUTOR_PAYOUT_TEXT,
  TUTOR_SIGNUP_MINUTES,
  VERIFICATION_REVIEW_DAYS,
} from "./ysHomeFacts";
import { approvedTestimonials } from "./ysTestimonialData";

/**
 * The tutors band (#hocalar), NEXT_PUBLIC_HOME_V2 only.
 *
 * Full bleed on ink with the pink band's cut mirrored (`.ys-band-ink`). Ink
 * and paper swap in dark mode together, so text here is `text-paper` and its
 * fractions, never white.
 *
 * Three rows: the pitch and who can apply; the seven steps from applying to
 * being paid, with the earnings calculator beside them; and approved tutor
 * quotes. Two parts are guarded:
 *
 * - The calculator promises income while no payment provider pays tutors, so
 *   it renders only with NEXT_PUBLIC_TUTOR_EARNINGS_PREVIEW on and the
 *   commission and price range decided. Without it the steps keep their
 *   column and the other one stays empty.
 * - Coaching (the step 7 chip and sentence, and the word in its title) shows
 *   only while the coaching flag is on.
 *
 * `className` lets /hoca-ol use the band as its hero without the homepage's
 * 120px lead-in.
 */
/**
 * The seven tutor steps, with their facts filled in and the coaching parts
 * following the coaching flag. Shared with /nasil-calisir.
 */
export function useTutorSteps(): YsStep[] {
  const { enabled: coaching } = useCoachingFlag();
  const stepFacts = {
    signupMinutes: TUTOR_SIGNUP_MINUTES,
    reviewDays: <YsFact value={VERIFICATION_REVIEW_DAYS} label="X" />,
    trialMinutes: TRIAL_MINUTES,
    trialPaid: <YsFact value={TRIAL_PAID_TO_TUTOR} label="Deneme dersi hocaya ücretli mi: D5" />,
    autoConfirmHours: AUTO_CONFIRM_HOURS,
    payout: <YsFact value={TUTOR_PAYOUT_TEXT} label="Ödeme ne zaman, nasıl: ödeme sağlayıcısı canlıya alınınca" />,
    commission: (
      <YsFact
        value={isTodo(COMMISSION_PERCENT) ? COMMISSION_PERCENT : formatPercent(COMMISSION_PERCENT)}
        label="X"
      />
    ),
    coaching,
    coachingText: <YsFact value={COACHING_TUTOR_TEXT} label="D11: koçluk nasıl çalışıyor" />,
  };

  const steps = copy.steps.map((step) => {
    const isCoachingStep = "chip" in step;
    return {
      title: isCoachingStep ? (
        coaching ? (
          <>
            {step.title}
            <span className="ml-2 inline-flex rounded-pill bg-paper px-3 py-0.5 align-[3px] text-xs font-medium leading-4 text-ink">
              {step.chip}
            </span>
          </>
        ) : (
          step.titleWithoutCoaching
        )
      ) : (
        step.title
      ),
      body: step.body(stepFacts),
    };
  });
  return steps;
}

export function YsTutorBand({ className }: { className?: string }) {
  const quotes = approvedTestimonials("tutor");

  const calculator =
    TUTOR_EARNINGS_PREVIEW_ENABLED && !isTodo(COMMISSION_PERCENT) && !isTodo(PRICE_RANGE_TL)
      ? { commissionPercent: COMMISSION_PERCENT, defaultPrice: PRICE_RANGE_TL.min }
      : null;

  const steps = useTutorSteps();

  return (
    <section
      id="hocalar"
      aria-labelledby="ys-tutors-title"
      className={cn(
        "ys-band-ink scroll-mt-[calc(var(--app-header-h)+24px)] bg-ink pb-[112px] pt-[100px] text-paper lg:pb-[150px] lg:pt-[136px]",
        className,
      )}
    >
      <div className="ys-shell">
        <div className="grid grid-cols-1 items-start gap-x-16 gap-y-10 lg:grid-cols-2">
          <div className="min-w-0">
            <h2
              id="ys-tutors-title"
              className="text-[32px] font-bold leading-9 tracking-[-0.88px] md:text-[44px] md:leading-[46px]"
            >
              {copy.title}
            </h2>
            <p className="mt-4 max-w-[40ch] text-[20px] leading-[31px] text-paper/80">{copy.lead}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/hoca-ol"
                className="inline-flex h-[50px] items-center rounded-pill bg-pink px-[22px] text-[15px] font-semibold text-white transition-colors duration-[--duration-state] hover:bg-pink-deep sm:px-8 sm:text-body"
              >
                {copy.ctaApply}
              </Link>
              <Link
                href="/hoca-ol"
                className="inline-flex h-[50px] items-center rounded-pill border border-paper/70 px-[22px] text-[15px] font-semibold text-paper transition-colors duration-[--duration-state] hover:bg-paper hover:text-ink sm:px-8 sm:text-body"
              >
                {copy.ctaLearnMore}
              </Link>
            </div>
          </div>

          <div className="min-w-0 rounded-card border border-paper/20 p-7">
            <h3 className="text-[18px] font-bold leading-6">{copy.eligibilityTitle}</h3>
            <ul className="mt-3.5 flex flex-col gap-3">
              {copy
                .eligibility({
                  maxRank: MAX_TUTOR_YKS_RANK,
                  minWeeklyHours: <YsFact value={TUTOR_MIN_WEEKLY_HOURS} label="X" />,
                })
                .map((line, index) => (
                  <li key={index} className="flex items-start gap-3 text-[15px] leading-[23px] text-paper/[0.88]">
                    <Check className="mt-px size-5 flex-none text-paper" aria-hidden />
                    <span>{Children.toArray(line)}</span>
                  </li>
                ))}
            </ul>
          </div>
        </div>

        {/* The steps keep the mockup's 6/12 column with or without the
            calculator: run across the full band, their rules and lines were
            far wider than anything else on the page. */}
        <div className="mt-[88px] grid grid-cols-1 items-start gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
          <div className="min-w-0">
            <h3 className="mb-7 text-[28px] font-bold leading-[34px] tracking-[-0.5px]">{copy.stepsTitle}</h3>
            <YsStepList tone="ink" steps={steps} />
          </div>
          {calculator && <YsEarningsCalculator {...calculator} />}
        </div>

        {quotes.length > 0 && (
          <div className="mt-[88px]">
            <h3 className="mb-7 text-[28px] font-bold leading-[34px] tracking-[-0.5px]">{copy.quotesTitle}</h3>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {quotes.map((entry) => (
                <YsTestimonialCard
                  key={entry.id}
                  entry={entry}
                  footer={
                    entry.tutorProfileId ? (
                      <Link
                        href={`/tutors/${entry.tutorProfileId}`}
                        className="mt-auto text-small font-medium text-pink hover:underline"
                      >
                        {copy.profileLink}
                      </Link>
                    ) : undefined
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
