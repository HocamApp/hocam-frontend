"use client";

import { Sparkles, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatPrice } from "@/lib/utils";
import {
  MOST_POPULAR_DURATION_DAYS,
  PLAN_DURATION_DAYS,
  WEEKLY_LESSON_OPTIONS,
  calculatePackagePricing,
  formatPlanDuration,
  type WeeklyLessonOption,
} from "@/lib/lessonPricing";
import type { PackagePlan } from "@/types";

interface CheckoutProductPickerProps {
  basePrice: number;
  /** Active matrix plans from the catalog; combos without a plan render disabled. */
  weeklyPlans: PackagePlan[];
  lessonsPerWeek: WeeklyLessonOption;
  durationDays: number;
  onLessonsPerWeekChange: (count: WeeklyLessonOption) => void;
  onDurationDaysChange: (days: number) => void;
}

function findPlan(
  weeklyPlans: PackagePlan[],
  perWeek: number,
  days: number
): PackagePlan | undefined {
  return weeklyPlans.find(
    (p) => p.lessons_per_week === perWeek && p.duration_days === days
  );
}

/** Duration axis for the cards: the canonical order, extended with any
 * extra durations the catalog happens to serve (never hardcode it away). */
function durationAxis(weeklyPlans: PackagePlan[]): number[] {
  const days = new Set<number>(PLAN_DURATION_DAYS);
  for (const p of weeklyPlans) {
    if (p.duration_days != null) days.add(p.duration_days);
  }
  return Array.from(days).sort((a, b) => a - b);
}

export function CheckoutProductPicker({
  basePrice,
  weeklyPlans,
  lessonsPerWeek,
  durationDays,
  onLessonsPerWeekChange,
  onDurationDaysChange,
}: CheckoutProductPickerProps) {
  const durations = durationAxis(weeklyPlans);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-primary bg-card p-4 shadow-sm ring-1 ring-primary sm:p-5">
        <div>
          <p className="text-sm font-medium">Haftada ders sayısı</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Dersler 40 dakikadır.
          </p>
          <div
            className="mt-2 flex flex-wrap gap-2"
            role="group"
            aria-label="Haftada ders sayısı"
          >
            {WEEKLY_LESSON_OPTIONS.map((count) => {
              const enabled = weeklyPlans.some(
                (p) => p.lessons_per_week === count
              );
              return (
                <button
                  key={count}
                  type="button"
                  aria-pressed={lessonsPerWeek === count}
                  disabled={!enabled}
                  onClick={() => onLessonsPerWeekChange(count)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    lessonsPerWeek === count &&
                      "border-primary bg-primary text-primary-foreground hover:bg-primary"
                  )}
                >
                  {count} ders
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5">
          <p className="text-sm font-medium">Paket süresi</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Tek seferlik ödeme — otomatik yenilenmez.
          </p>
          <div
            className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4"
            role="group"
            aria-label="Paket süresi"
          >
            {durations.map((days) => {
              const plan = findPlan(weeklyPlans, lessonsPerWeek, days);
              const pricing = plan
                ? calculatePackagePricing(
                    basePrice,
                    plan.lesson_count,
                    plan.discount_percent
                  )
                : null;
              return (
                <button
                  key={days}
                  type="button"
                  aria-pressed={durationDays === days}
                  disabled={!plan}
                  onClick={() => onDurationDaysChange(days)}
                  className={cn(
                    "relative rounded-lg border p-3 pt-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    durationDays === days &&
                      "border-primary bg-primary/5 ring-1 ring-primary"
                  )}
                >
                  {days === MOST_POPULAR_DURATION_DAYS && (
                    <Badge className="absolute -top-2.5 right-3">
                      En popüler
                    </Badge>
                  )}
                  <p className="font-medium">{formatPlanDuration(days)}</p>
                  {pricing && pricing.discountPercent > 0 && (
                    <Badge variant="secondary" className="mt-1">
                      %{pricing.discountPercent} avantaj
                    </Badge>
                  )}
                  {pricing ? (
                    <>
                      <p className="mt-2 text-sm font-semibold">
                        {formatPrice(pricing.discountedPerLesson)}
                        <span className="font-normal text-muted-foreground">
                          {" "}
                          / ders
                        </span>
                        {pricing.discountPercent > 0 && (
                          <span className="ml-1.5 text-xs font-normal text-muted-foreground line-through">
                            {formatPrice(pricing.basePerLesson)}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pricing.lessonCount} ders
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Şu anda satışta değil
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Derslerini seçtiğin hocayla planlayabilir, paket bitince yeniden
          paket alabilirsin.
        </p>
      </section>

      {/* ——— Yakında ——— */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div
          className="pointer-events-none flex items-center gap-3 rounded-xl border bg-card p-4 opacity-60"
          aria-disabled
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Users className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Küçük grup dersleri</p>
            <p className="text-xs text-muted-foreground">2–4 kişilik gruplar</p>
          </div>
          <Badge variant="secondary">Yakında</Badge>
        </div>
        <div
          className="pointer-events-none flex items-center gap-3 rounded-xl border bg-card p-4 opacity-60"
          aria-disabled
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Pro / Koçluk</p>
            <p className="text-xs text-muted-foreground">
              Birebir koçluk ve takip
            </p>
          </div>
          <Badge variant="secondary">Yakında</Badge>
        </div>
      </div>
    </div>
  );
}
