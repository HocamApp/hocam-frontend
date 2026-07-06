"use client";

import { CalendarDays, Gift, GraduationCap, Sparkles, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatPrice } from "@/lib/utils";
import {
  WEEKLY_LESSON_OPTIONS,
  WEEKLY_TERM_DISCOUNT_PERCENT,
  WEEKLY_TERM_OPTIONS,
  getTenLessonPackagePrice,
  getWeeklyPackagePrice,
  type WeeklyLessonOption,
  type WeeklyTermOption,
} from "@/lib/lessonPricing";
import type { PackagePlan } from "@/types";

export type CheckoutPackageType = "single" | "ten_pack" | "weekly";

interface CheckoutProductPickerProps {
  basePrice: number;
  tenPackPlan: PackagePlan | undefined;
  /** Active weekly plans from the catalog; combos without a plan render disabled. */
  weeklyPlans: PackagePlan[];
  packageType: CheckoutPackageType;
  lessonsPerWeek: WeeklyLessonOption;
  termMonths: WeeklyTermOption;
  onPackageTypeChange: (type: CheckoutPackageType) => void;
  onLessonsPerWeekChange: (count: WeeklyLessonOption) => void;
  onTermMonthsChange: (term: WeeklyTermOption) => void;
}

function hasWeeklyPlan(
  weeklyPlans: PackagePlan[],
  perWeek: number,
  term: number
): boolean {
  return weeklyPlans.some(
    (p) => p.lessons_per_week === perWeek && p.term_months === term
  );
}

export function CheckoutProductPicker({
  basePrice,
  tenPackPlan,
  weeklyPlans,
  packageType,
  lessonsPerWeek,
  termMonths,
  onPackageTypeChange,
  onLessonsPerWeekChange,
  onTermMonthsChange,
}: CheckoutProductPickerProps) {
  const isSingleSection = packageType === "single" || packageType === "ten_pack";
  const tenPackPricing = getTenLessonPackagePrice(basePrice);
  const hasAnyWeeklyPlan = weeklyPlans.length > 0;

  return (
    <div className="space-y-4">
      {/* ——— Tekli alım ——— */}
      <section
        className={cn(
          "rounded-xl border bg-card p-4 shadow-sm transition-colors sm:p-5",
          isSingleSection && "border-primary ring-1 ring-primary"
        )}
      >
        <button
          type="button"
          className="flex w-full items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-pressed={isSingleSection}
          onClick={() => {
            if (!isSingleSection) onPackageTypeChange("single");
          }}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-semibold">Tekli alım</span>
            <span className="block text-sm text-muted-foreground">
              Tek seferlik ödeme · Paket otomatik yenilenmez
            </span>
          </span>
          <span
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
              isSingleSection ? "border-primary" : "border-muted-foreground/40"
            )}
            aria-hidden
          >
            {isSingleSection && (
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            )}
          </span>
        </button>

        {isSingleSection && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              aria-pressed={packageType === "single"}
              onClick={() => onPackageTypeChange("single")}
              className={cn(
                "rounded-lg border p-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                packageType === "single" &&
                  "border-primary bg-primary/5 ring-1 ring-primary"
              )}
            >
              <p className="font-medium">1 ders</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Süreyi ve saati sen seç · 40–60 dk
              </p>
              <p className="mt-2 text-sm font-semibold">
                {formatPrice(basePrice)}
                <span className="font-normal text-muted-foreground"> / 40 dk</span>
              </p>
            </button>

            <button
              type="button"
              aria-pressed={packageType === "ten_pack"}
              disabled={!tenPackPlan}
              onClick={() => tenPackPlan && onPackageTypeChange("ten_pack")}
              className={cn(
                "rounded-lg border p-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
                packageType === "ten_pack" &&
                  "border-primary bg-primary/5 ring-1 ring-primary"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 font-medium">
                  <Gift className="h-4 w-4 text-primary" />
                  10 derslik avantajlı paket
                </p>
                <Badge className="shrink-0">%10 avantaj</Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Tek seferlik ödeme · 40 dk/ders
              </p>
              <p className="mt-2 text-sm font-semibold">
                {formatPrice(tenPackPricing.discountedPerLesson)}
                <span className="font-normal text-muted-foreground"> / ders</span>
                <span className="ml-1.5 text-xs font-normal text-muted-foreground line-through">
                  {formatPrice(basePrice)}
                </span>
              </p>
            </button>
          </div>
        )}
      </section>

      {/* ——— Haftalık ders paketi ——— */}
      <section
        className={cn(
          "rounded-xl border bg-card p-4 shadow-sm transition-colors sm:p-5",
          packageType === "weekly" && "border-primary ring-1 ring-primary",
          !hasAnyWeeklyPlan && "opacity-60"
        )}
      >
        <button
          type="button"
          className="flex w-full items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed"
          aria-pressed={packageType === "weekly"}
          disabled={!hasAnyWeeklyPlan}
          onClick={() => onPackageTypeChange("weekly")}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CalendarDays className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-semibold">
              Haftalık ders paketi
            </span>
            <span className="block text-sm text-muted-foreground">
              Düzenli çalışmak isteyenler için peşin ders paketi
            </span>
          </span>
          <span
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
              packageType === "weekly"
                ? "border-primary"
                : "border-muted-foreground/40"
            )}
            aria-hidden
          >
            {packageType === "weekly" && (
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            )}
          </span>
        </button>

        {packageType === "weekly" && (
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-sm font-medium">Haftada ders sayısı</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Dersler 40 dakikadır.
              </p>
              <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Haftada ders sayısı">
                {WEEKLY_LESSON_OPTIONS.map((count) => {
                  const enabled = WEEKLY_TERM_OPTIONS.some((t) =>
                    hasWeeklyPlan(weeklyPlans, count, t)
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

            <div>
              <p className="text-sm font-medium">Plan süresi</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Tek seferlik ödeme — paket otomatik yenilenmez.
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3" role="group" aria-label="Plan süresi">
                {WEEKLY_TERM_OPTIONS.map((term) => {
                  const enabled = hasWeeklyPlan(weeklyPlans, lessonsPerWeek, term);
                  const pricing = getWeeklyPackagePrice(
                    basePrice,
                    lessonsPerWeek,
                    term
                  );
                  return (
                    <button
                      key={term}
                      type="button"
                      aria-pressed={termMonths === term}
                      disabled={!enabled}
                      onClick={() => onTermMonthsChange(term)}
                      className={cn(
                        "relative rounded-lg border p-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                        termMonths === term &&
                          "border-primary bg-primary/5 ring-1 ring-primary"
                      )}
                    >
                      {term === 3 && (
                        <Badge className="absolute -top-2.5 right-3">
                          En popüler
                        </Badge>
                      )}
                      <p className="font-medium">{term} Ay</p>
                      <Badge variant="secondary" className="mt-1">
                        %{WEEKLY_TERM_DISCOUNT_PERCENT[term]} avantaj
                      </Badge>
                      <p className="mt-2 text-sm font-semibold">
                        {formatPrice(pricing.discountedPerLesson)}
                        <span className="font-normal text-muted-foreground">
                          {" "}/ ders
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pricing.lessonCount} ders
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Derslerini seçtiğin hocayla planlayabilir, paket bitince yeniden
              paket alabilirsin.
            </p>
          </div>
        )}
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
