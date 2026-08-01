"use client";

import { Check, GraduationCap, Sparkles, Users } from "lucide-react";
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
}

const PRIVATE_FEATURES = [
  "Seçtiğin hocayla canlı birebir ders",
  "Hoca müsaitliğine göre ders planlama",
  "Hoca ile doğrudan mesajlaşma",
  "Haftada 2–6 ders seçimi",
  "2 hafta–6 ay paket süresi",
  "Toplam ders hakkı",
  "Paket süresine göre ders başına fiyat avantajı",
] as const;

export function CheckoutProductPicker({
  weeklyPlans,
  lessonsPerWeek,
  onLessonsPerWeekChange,
  trialLessonsRemaining = 0,
  paidRemainingCredits = null,
  onBookTrial,
  onUseCredits,
}: CheckoutProductPickerProps) {
  return (
    <TooltipProvider delayDuration={180}>
      <div>
        <p className="mb-4 text-xs font-bold tracking-[0.16em] text-[var(--checkout-evergreen)]">
          DERS PLANI
        </p>

        <div className="space-y-3">
          <FuturePlanBar
            tone="group"
            icon={Users}
            title="Küçük Grup"
            description="Aynı öğretmenle 2–4 öğrencinin birlikte katıldığı, kişi başı daha avantajlı canlı dersler."
          />

          <section
            aria-label="Seçili plan: Birebir Özel Ders"
            className="overflow-hidden rounded-2xl border-2 border-[var(--checkout-nighttime)] bg-[var(--checkout-clearway)]"
          >
            <button
              type="button"
              aria-label="Birebir Özel Ders — seçili"
              aria-pressed="true"
              className="flex w-full items-center gap-3 bg-[var(--checkout-placeboam)] px-4 py-3 text-left text-[var(--checkout-nighttime)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--checkout-nighttime)] sm:px-5"
            >
              <GraduationCap className="size-5 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block font-bold">Birebir Özel Ders</span>
                <span className="mt-0.5 block text-sm leading-5 opacity-80">
                  Seçtiğin hocayla sana özel canlı dersler.
                </span>
              </span>
              <span
                className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-[var(--checkout-nighttime)]"
                aria-hidden="true"
              >
                <span className="size-2 rounded-full bg-[var(--checkout-nighttime)]" />
              </span>
            </button>

            <div className="space-y-4 p-4 sm:p-5">
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
                  className="mt-3 grid grid-cols-5 gap-2"
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
                          "min-h-10 rounded-lg border border-[var(--checkout-soft-line)] bg-[var(--checkout-dulline)] px-1 text-xs font-bold text-[var(--checkout-nighttime)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--checkout-evergreen)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--checkout-evergreen)] focus-visible:ring-offset-2 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-35 sm:text-sm",
                          selected &&
                            "border-[var(--checkout-nighttime)] bg-[var(--checkout-nighttime)] text-[var(--checkout-dulline)]"
                        )}
                      >
                        {count} ders
                      </button>
                    );
                  })}
                </div>
              </section>

              <p className="border-t border-[var(--checkout-soft-line)] pt-4 text-sm leading-5">
                Seçtiğin hocayla hedeflerine ve programına göre birebir canlı dersler planla.
              </p>

              <section
                aria-labelledby="private-features-title"
                className="rounded-xl border border-[var(--checkout-evergreen)] bg-[var(--checkout-placeboam)] p-4"
              >
                <h2
                  id="private-features-title"
                  className="text-xs font-extrabold tracking-[0.06em]"
                >
                  BİREBİR PAKET ÖZELLİKLERİ
                </h2>
                <ul className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                  {PRIVATE_FEATURES.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-xs leading-5 sm:text-sm">
                      <Check className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {(paidRemainingCredits != null && paidRemainingCredits > 0) ||
              (trialLessonsRemaining > 0 && onBookTrial) ? (
                <div className="space-y-2 border-t border-[var(--checkout-soft-line)] pt-4">
                  {paidRemainingCredits != null && paidRemainingCredits > 0 && onUseCredits && (
                    <div className="flex flex-col gap-2 rounded-xl bg-[var(--checkout-dulline)] p-3 sm:flex-row sm:items-center">
                      <p className="min-w-0 flex-1 text-sm font-semibold">
                        {paidRemainingCredits} ders hakkın kullanılabilir
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        onClick={onUseCredits}
                        className="bg-[var(--checkout-evergreen)] text-[var(--checkout-dulline)] hover:bg-[var(--checkout-nighttime)]"
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

          <FuturePlanBar
            tone="pro"
            icon={Sparkles}
            title="Hocam Pro"
            description="Birebir dersleri sınırsız soru desteği, haftalık koçluk ve gelişim takibiyle güçlendiren kapsamlı öğrenci planı."
          />
        </div>

        <div className="mt-4">
          <ComparePlansDialog>
            <Button
              variant="outline"
              className="h-9 rounded-full border-[var(--checkout-evergreen)] bg-transparent px-4 text-xs font-bold text-[var(--checkout-nighttime)] hover:bg-[var(--checkout-clearway)]"
            >
              Planları karşılaştır
            </Button>
          </ComparePlansDialog>
        </div>
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
  icon: typeof Users;
  title: string;
  description: string;
  tone: "group" | "pro";
}) {
  const isPro = tone === "pro";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="block rounded-2xl focus-within:ring-2 focus-within:ring-[var(--checkout-evergreen)] focus-within:ring-offset-2">
          <button
            type="button"
            aria-disabled="true"
            aria-label={`${title} — Yakında`}
            className={cn(
              "flex w-full cursor-not-allowed items-center gap-3 rounded-2xl border-2 border-[var(--checkout-nighttime)] px-4 py-3 text-left sm:px-5",
              isPro
                ? "bg-[var(--checkout-evergreen)] text-[var(--checkout-dulline)]"
                : "bg-[var(--checkout-signal-bay)] text-[var(--checkout-nighttime)]"
            )}
          >
            <Icon className="size-5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block font-bold">{title}</span>
              <span className="mt-0.5 block text-sm leading-5 opacity-75">{description}</span>
            </span>
            <Badge
              className={cn(
                "rounded-md border px-2 py-0.5 text-[0.65rem] font-extrabold uppercase tracking-wide",
                isPro
                  ? "border-[var(--checkout-dulline)] bg-transparent text-[var(--checkout-dulline)]"
                  : "border-[var(--checkout-nighttime)] bg-transparent text-[var(--checkout-nighttime)]"
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
