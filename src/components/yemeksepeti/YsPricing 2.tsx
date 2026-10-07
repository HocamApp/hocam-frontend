"use client";

import { Check } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Children, type ReactNode } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import {
  calculatePackagePricing,
  formatPlanDuration,
  MOST_POPULAR_DURATION_DAYS,
} from "@/lib/lessonPricing";
import { fetchTutorOfferedPlans, filterMatrixPlans } from "@/lib/paymentsApi";
import { fetchTutors } from "@/lib/tutorsApi";
import { cn, formatPrice } from "@/lib/utils";
import type { PackagePlan, TutorProfile } from "@/types/api";

import { YsFact, YsTodoGate } from "./YsFact";
import { YsPillHeading } from "./YsPillHeading";
import { pricing as copy } from "./ysHomeCopy";
import {
  COMMISSION_PERCENT,
  isTodo,
  LESSON_MINUTES,
  LESSONS_PER_WEEK,
  MONTHLY_TRIAL_LIMIT,
  PRICE_RANGE_TL,
  TRIAL_MINUTES,
} from "./ysHomeFacts";

/* The example box shows one tutor at two lessons a week, the lightest
   package, and opens on the one-month plan. */
const EXAMPLE_LESSONS_PER_WEEK = 2;
const EXAMPLE_SELECTED_DAYS = 30;

/** The example tutor's 2-lessons-a-week plans, shortest first. */
export function examplePlans(plans: PackagePlan[] | undefined): PackagePlan[] {
  return filterMatrixPlans(plans)
    .filter((plan) => plan.lessons_per_week === EXAMPLE_LESSONS_PER_WEEK)
    .sort((a, b) => (a.duration_days ?? 0) - (b.duration_days ?? 0));
}

function priceRangeLabel() {
  if (isTodo(PRICE_RANGE_TL)) return <YsFact value={PRICE_RANGE_TL} label="MIN – MAX ₺" />;
  const min = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(PRICE_RANGE_TL.min);
  return `${min} – ${formatPrice(PRICE_RANGE_TL.max)}`;
}

function FactCard({ label, value, body }: { label: string; value: ReactNode; body?: ReactNode }) {
  return (
    <div className="rounded-card border border-line bg-surface px-6 py-[22px]">
      <p className="text-[13px] font-medium text-ink-mid">{label}</p>
      <p className="mt-1 text-[28px] font-bold leading-[34px] tracking-[-0.4px]">{value}</p>
      {body && <p className="mt-1.5 text-small leading-[21px] text-ink-mid">{body}</p>}
    </div>
  );
}

/**
 * The package example: the checkout's duration cards, drawn for one real
 * tutor with that tutor's own plans and discounts, as an illustration.
 *
 * It mirrors the checkout's radio card rather than importing it: that one is
 * an interactive radio with checkout-scoped colours, and nothing here is
 * clickable except the box as a whole, which opens the tutor's profile.
 *
 * Plans come from `/payments/tutors/{id}/offered-plans/`, which needs a
 * signed-in user, so `YsPricing` only asks for one. If the call fails the box
 * is hidden; there is no hard-coded fallback.
 */
function PackageExample({ tutor, options }: { tutor: TutorProfile; options: PackagePlan[] }) {
  const price = formatPrice(tutor.hourly_price);
  return (
    <Link
      href={`/tutors/${tutor.id}`}
      className="block min-w-0 rounded-card bg-pink-pale p-7 text-[var(--ink-on-light)] transition-colors duration-[--duration-state]"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-bold uppercase tracking-[0.12em]">{copy.exampleTitle}</p>
          <p className="mt-0.5 text-small text-[var(--ink-mid-on-light)]">
            {copy.exampleSub(EXAMPLE_LESSONS_PER_WEEK, price)}
          </p>
        </div>
        <div className="flex items-center gap-2.5 text-right">
          <div>
            <b className="block text-[15px] leading-5">
              {tutor.name} {tutor.surname}
            </b>
            <span className="text-[13px] text-[var(--ink-mid-on-light)]">
              {copy.examplePrice(price, LESSON_MINUTES)}
            </span>
          </div>
          <Avatar className="size-10 rounded-[10px]">
            <AvatarImage src={tutor.profile_picture || undefined} alt="" />
            <AvatarFallback className="rounded-[10px] bg-ink text-xs font-bold text-paper">
              {tutor.name.charAt(0)}
              {tutor.surname.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2.5" aria-hidden>
        {options.map((plan) => {
          const days = plan.duration_days as number;
          const selected = days === EXAMPLE_SELECTED_DAYS;
          const planPricing = calculatePackagePricing(
            Number(tutor.hourly_price),
            plan.lesson_count,
            plan.discount_percent,
          );
          return (
            <div
              key={plan.id}
              className={cn(
                "flex items-center gap-3.5 rounded-[14px] bg-white px-[18px] py-3.5",
                selected ? "border-[1.5px] border-[var(--ink-on-light)]" : "border border-[var(--line-on-light)]",
              )}
            >
              <span
                className={cn(
                  "grid size-5 flex-none place-items-center rounded-full border-[1.5px]",
                  selected ? "border-[var(--ink-on-light)]" : "border-[var(--ink-mid-on-light)]",
                )}
              >
                {selected && <span className="size-2.5 rounded-full bg-[var(--ink-on-light)]" />}
              </span>
              <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
                <b className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[17px] font-bold leading-[22px]">
                  {formatPlanDuration(days)}
                  {days === MOST_POPULAR_DURATION_DAYS && (
                    <span className="whitespace-nowrap rounded-pill bg-[var(--ink-on-light)] px-2 text-[11px] font-semibold leading-[18px] text-white">
                      {copy.planMostPopular}
                    </span>
                  )}
                </b>
                {planPricing.discountPercent > 0 && (
                  <span className="inline-flex rounded-[6px] bg-gold px-2 text-xs font-semibold leading-5 text-gold-ink">
                    {copy.planAdvantage(planPricing.discountPercent)}
                  </span>
                )}
              </span>
              <span className="text-right tabular-nums">
                <b className="block text-[18px] font-bold leading-[22px]">
                  {formatPrice(planPricing.discountedPerLesson)}
                </b>
                <span className="text-xs text-[var(--ink-mid-on-light)]">
                  {copy.planPerLesson(plan.lesson_count)}
                </span>
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col gap-1.5 text-[13px] leading-[19px] text-[var(--ink-mid-on-light)]">
        <PricingNote>{copy.noteOneTime}</PricingNote>
        <PricingNote>{copy.noteNoCharge}</PricingNote>
        <YsTodoGate value={COMMISSION_PERCENT} label="D3 onayı">
          <PricingNote>{copy.noteNoExtraFee}</PricingNote>
        </YsTodoGate>
      </div>
    </Link>
  );
}

function PricingNote({ children }: { children: ReactNode }) {
  return (
    <span className="flex items-start gap-2">
      <Check className="mt-0.5 size-4 flex-none text-success" aria-hidden />
      <span>{children}</span>
    </span>
  );
}

/**
 * "Ne kadar ödersin?" (#fiyatlar), NEXT_PUBLIC_HOME_V2 only.
 *
 * Three fact cards on the left, every number from `ysHomeFacts.ts`; on the
 * right a worked package example for the top-rated tutor in the directory's
 * own prefetched first page.
 */
export function YsPricing() {
  const { isAuthenticated } = useAuth();
  const { data: tutors } = useQuery({
    queryKey: ["tutors", { ordering: "rating" }, 1],
    queryFn: () => fetchTutors({ ordering: "rating" }, 1, 12),
  });
  const exampleTutor = tutors?.results?.[0];
  const { data: plans, isError } = useQuery({
    queryKey: ["tutor-offered-plans", exampleTutor?.id],
    queryFn: () => fetchTutorOfferedPlans(exampleTutor!.id),
    enabled: isAuthenticated && Boolean(exampleTutor),
    retry: false,
  });
  const options = isError ? [] : examplePlans(plans);
  const showExample = Boolean(exampleTutor) && options.length > 0;

  return (
    <section
      id="fiyatlar"
      aria-labelledby="ys-pricing-title"
      className="ys-shell scroll-mt-[calc(var(--app-header-h)+24px)] pt-[88px] md:pt-[120px]"
    >
      <YsPillHeading id="ys-pricing-title" lead={copy.titleLead} pill={copy.titlePill} />
      <p className="mx-auto mt-5 max-w-[52ch] text-center text-body-l text-ink-mid">{copy.sub}</p>

      {/* Without the example box the three cards take the full row rather
          than leaving an empty column beside them. */}
      <div
        className={cn(
          "mt-14 grid grid-cols-1 items-start gap-x-12 gap-y-8",
          showExample && "lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]",
        )}
      >
        <div className={cn("grid min-w-0 gap-3.5", !showExample && "md:grid-cols-3")}>
          <FactCard
            label={copy.lessonKey}
            value={copy.lessonValue(LESSON_MINUTES)}
            body={copy.lessonBody(LESSONS_PER_WEEK.min, LESSONS_PER_WEEK.max)}
          />
          <FactCard label={copy.rangeKey} value={Children.toArray([priceRangeLabel()])} />
          <FactCard
            label={copy.trialKey}
            value={copy.trialValue}
            body={copy.trialBody(TRIAL_MINUTES, MONTHLY_TRIAL_LIMIT)}
          />
        </div>

        {showExample && exampleTutor && <PackageExample tutor={exampleTutor} options={options} />}
      </div>
    </section>
  );
}
