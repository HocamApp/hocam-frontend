"use client";

import {
  ChalkboardTeacher,
  ChartLineUp,
  UsersThree,
  type Icon,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ComparePlansDialog } from "@/components/checkout/ComparePlansDialog";
import { TrialLessonOffer } from "@/components/checkout/TrialLessonOffer";
import { cn } from "@/lib/utils";
import {
  WEEKLY_LESSON_OPTIONS,
  type WeeklyLessonOption,
} from "@/lib/lessonPricing";
import type { PackagePlan } from "@/types";
import type { CheckoutPalette } from "./checkoutPalette";

interface CheckoutProductPickerProps {
  basePrice: number;
  weeklyPlans: PackagePlan[];
  lessonsPerWeek: WeeklyLessonOption;
  durationDays: number;
  onLessonsPerWeekChange: (count: WeeklyLessonOption) => void;
  onDurationDaysChange: (days: number) => void;
  trialLessonsRemaining?: number;
  paidRemainingCredits?: number | null;
  onBookTrial?: () => void;
  onUseCredits?: () => void;
  palette?: CheckoutPalette;
}

const PRIVATE_FEATURES = [
  "Seçtiğin hocayla canlı birebir ders",
  "Hoca müsaitliğine göre ders planlama",
  "Hoca ile doğrudan mesajlaşma",
  "Haftada 2–6 ders seçimi",
] as const;

// Product visibility decision: keep the future plan mechanics implemented but
// do not disclose them before launch. See docs/product/HOCAM_PRO_AND_GROUP_PRODUCT_VISION.md.
const FUTURE_CHECKOUT_PLANS_VISIBLE = false;

export function CheckoutProductPicker({
  weeklyPlans,
  lessonsPerWeek,
  onLessonsPerWeekChange,
  trialLessonsRemaining = 0,
  paidRemainingCredits = null,
  onBookTrial,
  onUseCredits,
  palette = "01",
}: CheckoutProductPickerProps) {
  return (
    <TooltipProvider delayDuration={180}>
      <div>
        <p className="mb-2 text-xs font-bold tracking-[0.16em] text-[var(--checkout-left-ink)]">
          DERS PLANI
        </p>

        <div className="space-y-2">
          {FUTURE_CHECKOUT_PLANS_VISIBLE ? (
            <FuturePlanBar
              tone="group"
              icon={UsersThree}
              title="Küçük Grup"
              description="2–4 öğrenciyle, kişi başı daha avantajlı canlı dersler."
            />
          ) : null}

          <section
            aria-label="Seçili plan: Birebir Özel Ders"
            className="overflow-hidden rounded-card border-2 border-[var(--checkout-control)] bg-[var(--checkout-private-body)] text-[var(--checkout-private-body-ink)]"
          >
            <button
              type="button"
              aria-label="Birebir Özel Ders — seçili"
              aria-pressed="true"
              className="flex w-full items-center gap-3 bg-[var(--checkout-private)] px-4 py-2 text-left text-[var(--checkout-private-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--checkout-control)]"
            >
              <ChalkboardTeacher className="size-5 shrink-0" weight="fill" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block font-bold">Birebir Özel Ders</span>
                <span className="block text-xs leading-4 opacity-80 sm:text-sm">
                  Seçtiğin hocayla sana özel canlı dersler.
                </span>
              </span>
              <span
                className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-[var(--checkout-control)]"
                aria-hidden="true"
              >
                <span className="size-2 rounded-full bg-[var(--checkout-control)]" />
              </span>
            </button>

            <div className="space-y-3 p-3 sm:p-3.5">
              <section aria-labelledby="weekly-lessons-title">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h2 id="weekly-lessons-title" className="text-sm font-bold">
                      Haftalık ders sayısını seç
                    </h2>
                    <p className="mt-0.5 text-xs opacity-65">Her ders 40 dakikadır.</p>
                  </div>
                  <span className="text-xs font-semibold opacity-60">2–6 ders</span>
                </div>
                <div
                  className="mt-2 grid grid-cols-5 gap-1.5"
                  role="group"
                  aria-label="Haftada ders sayısı"
                >
                  {WEEKLY_LESSON_OPTIONS.map((count) => {
                    const enabled = weeklyPlans.some(
                      (plan) => plan.lessons_per_week === count
                    );
                    const selected = lessonsPerWeek === count;
                    return (
                      <button
                        key={count}
                        type="button"
                        aria-pressed={selected}
                        disabled={!enabled}
                        onClick={() => onLessonsPerWeekChange(count)}
                        className={cn(
                          "min-h-9 rounded-input border border-[var(--checkout-soft-line)] bg-[var(--checkout-muted-surface)] px-1 text-xs font-bold text-[var(--checkout-nighttime)] transition-colors duration-[--duration-state] hover:border-[var(--checkout-control)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--checkout-control)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-35 sm:text-sm",
                          selected &&
                            "border-[var(--checkout-control)] bg-[var(--checkout-control)] text-[var(--checkout-on-control)]"
                        )}
                      >
                        {count} ders
                      </button>
                    );
                  })}
                </div>
              </section>

              <section
                aria-labelledby="private-features-title"
                className="rounded-[8px] border border-[var(--checkout-soft-line)] bg-[var(--checkout-feature-surface)] p-3 text-[var(--checkout-feature-ink)]"
              >
                <h2
                  id="private-features-title"
                  className="text-xs font-extrabold tracking-[0.06em]"
                >
                  BİREBİR PAKET ÖZELLİKLERİ
                </h2>
                <ul className="mt-2 grid gap-x-5 gap-y-1 sm:grid-cols-2">
                  {PRIVATE_FEATURES.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-xs leading-4 sm:text-[0.8125rem]">
                      <span className="mt-[0.45rem] h-px w-3 shrink-0 bg-current" aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {(paidRemainingCredits != null && paidRemainingCredits > 0) ||
              (trialLessonsRemaining > 0 && onBookTrial) ? (
                <div className="space-y-1.5 border-t border-[var(--checkout-soft-line)] pt-2.5">
                  {paidRemainingCredits != null && paidRemainingCredits > 0 && onUseCredits && (
                    <div className="flex min-h-14 flex-col gap-2 rounded-input bg-[var(--checkout-muted-surface)] px-3 py-2 sm:flex-row sm:items-center">
                      <p className="min-w-0 flex-1 text-sm font-semibold">
                        {paidRemainingCredits} ders hakkın kullanılabilir
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        onClick={onUseCredits}
                        className="h-8 bg-[var(--checkout-control)] px-3 text-xs text-[var(--checkout-on-control)] hover:bg-[var(--checkout-control-strong)]"
                      >
                        Mevcut ders hakkını kullan
                      </Button>
                    </div>
                  )}
                  {trialLessonsRemaining > 0 && onBookTrial && (
                    <TrialLessonOffer
                      remaining={trialLessonsRemaining}
                      onSelect={onBookTrial}
                    />
                  )}
                </div>
              ) : null}
            </div>
          </section>

          {FUTURE_CHECKOUT_PLANS_VISIBLE ? (
            <FuturePlanBar
              tone="pro"
              icon={ChartLineUp}
              title="Hocam Pro"
              description="Soru desteği, haftalık koçluk ve gelişim takibiyle güçlendirilmiş birebir plan."
            />
          ) : null}
        </div>

        {FUTURE_CHECKOUT_PLANS_VISIBLE ? (
          <div className="mt-2">
            <ComparePlansDialog palette={palette}>
              <Button
                variant="outline"
                className="h-8 rounded-pill border-[var(--checkout-control)] bg-transparent px-4 text-xs font-bold text-[var(--checkout-left-ink)] hover:bg-[var(--checkout-control)] hover:text-[var(--checkout-on-control)]"
              >
                Planları karşılaştır
              </Button>
            </ComparePlansDialog>
          </div>
        ) : null}
      </div>
    </TooltipProvider>
  );
}

function FuturePlanBar({
  icon: Icon,
  title,
  description,
  tone,
}: {
  icon: Icon;
  title: string;
  description: string;
  tone: "group" | "pro";
}) {
  const isPro = tone === "pro";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="block rounded-card focus-within:ring-2 focus-within:ring-[var(--checkout-control)] focus-within:ring-offset-2">
          <button
            type="button"
            aria-disabled="true"
            aria-label={`${title} — Yakında`}
            className={cn(
              "checkout-plan-bar flex min-h-14 w-full cursor-not-allowed items-center gap-3 rounded-card border px-4 py-2 text-left",
              isPro
                ? "checkout-plan-bar-pro bg-[var(--checkout-pro)] text-[var(--checkout-pro-ink)]"
                : "checkout-plan-bar-group bg-[var(--checkout-group)] text-[var(--checkout-group-ink)]"
            )}
          >
            <Icon className="size-5 shrink-0" weight="regular" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block font-bold">{title}</span>
              <span className="block text-xs leading-4 opacity-75 sm:text-sm">{description}</span>
            </span>
            <Badge
              className={cn(
                "rounded-pill border px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide",
                isPro
                  ? "border-current bg-transparent text-current"
                  : "border-current bg-transparent text-current"
              )}
            >
              Yakında
            </Badge>
          </button>
        </span>
      </TooltipTrigger>
      <TooltipContent>Bu plan üzerinde çalışıyoruz.</TooltipContent>
    </Tooltip>
  );
}
