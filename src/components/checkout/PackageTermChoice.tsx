"use client";

import type { KeyboardEvent } from "react";

import { Badge } from "@/components/ui/badge";
import {
  MOST_POPULAR_DURATION_DAYS,
  calculatePackagePricing,
  formatPlanDuration,
} from "@/lib/lessonPricing";
import { cn, formatPrice } from "@/lib/utils";
import type { PackagePlan } from "@/types";

interface PackageTermChoiceProps {
  /** The tutor's offers for the chosen weekly lesson count, one per term. */
  plans: PackagePlan[];
  /** The tutor's undiscounted 40-minute lesson price. */
  hourlyPrice: number;
  /** The chosen term in days, or null when none is chosen yet. */
  value: number | null;
  onChange: (durationDays: number) => void;
}

/**
 * How long the package runs, chosen before the hours.
 *
 * The hours the student can pick depend on the term: a Thursday that is free
 * for a month may be taken in the fifth week of a six-month package, and the
 * purchase holds exactly the lessons the package becomes. Asking the term first
 * means the hours offered next are the ones that are free for all of it.
 *
 * Prices are the plan catalog's arithmetic shown live (the server recomputes
 * and stays the source of truth); promo codes are applied on the last step.
 */
export function PackageTermChoice({
  plans,
  hourlyPrice,
  value,
  onChange,
}: PackageTermChoiceProps) {
  const options = plans
    .filter((plan) => plan.duration_days != null)
    .sort((a, b) => (a.duration_days ?? 0) - (b.duration_days ?? 0));

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = options.length - 1;
    let next: number | null = null;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    if (next === null) return;
    const days = options[next]?.duration_days;
    if (days == null) return;
    event.preventDefault();
    onChange(days);
    event.currentTarget
      .closest('[role="radiogroup"]')
      ?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
      [next]?.focus();
  }

  if (options.length === 0) {
    return (
      <p className="text-[0.875rem] text-ink-mid">
        Bu haftalık ders sayısı için sunulan bir paket süresi yok.
      </p>
    );
  }

  const selectedIndex = options.findIndex((plan) => plan.duration_days === value);

  return (
    <div role="radiogroup" aria-label="Paket süresi" className="space-y-2">
      {options.map((plan, index) => {
        const days = plan.duration_days as number;
        const selected = days === value;
        const pricing = calculatePackagePricing(hourlyPrice, plan.lesson_count, plan.discount_percent);
        // With nothing chosen the group is still reachable by keyboard.
        const focusable = selected || (selectedIndex === -1 && index === 0);
        return (
          <button
            key={plan.id}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={focusable ? 0 : -1}
            onClick={() => onChange(days)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              "flex w-full min-w-0 items-center gap-3 rounded-input border bg-surface px-4 py-3 text-left transition-colors duration-[120ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2",
              selected ? "border-ink" : "border-line hover:border-ink"
            )}
          >
            <span
              aria-hidden
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-pill border-2",
                selected ? "border-ink" : "border-line"
              )}
            >
              {selected && <span className="size-2 rounded-pill bg-ink" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-[1rem] font-bold text-ink">{formatPlanDuration(days)}</span>
                {days === MOST_POPULAR_DURATION_DAYS && <Badge>En popüler</Badge>}
                {pricing.discountPercent > 0 && (
                  <Badge variant="outline">%{pricing.discountPercent} avantaj</Badge>
                )}
              </span>
              <span className="mt-0.5 block text-[0.8125rem] text-ink-mid">
                {plan.lesson_count} ders
              </span>
            </span>
            <span className="shrink-0 text-right tabular-nums">
              <span className="block text-[1rem] font-bold text-ink">{formatPrice(pricing.total)}</span>
              <span className="block text-[0.75rem] text-ink-mid">
                ders başına {formatPrice(pricing.discountedPerLesson)}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
