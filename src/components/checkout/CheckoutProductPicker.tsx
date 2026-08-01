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
}: CheckoutProductPickerProps) {
  return (
    <TooltipProvider delayDuration={180}>
      <div className="space-y-7">
        <section aria-labelledby="plan-type-title" className="space-y-3">
          <div>
            <p id="plan-type-title" className="text-sm font-semibold text-foreground">
              Ders planı
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Sana uygun öğrenme biçimini seç.
            </p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              aria-pressed="true"
              className="group flex w-full items-center gap-4 rounded-2xl border border-primary/35 bg-primary px-4 py-4 text-left text-primary-foreground shadow-[0_16px_40px_-28px_hsl(var(--primary))] transition duration-200 active:translate-y-px sm:px-5"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/12">
                <GraduationCap className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold">Birebir Özel Ders</span>
                <span className="mt-0.5 block text-sm text-primary-foreground/75">
                  Seçtiğin hocayla sana özel canlı dersler.
                </span>
              </span>
              <span className="flex size-5 items-center justify-center rounded-full border-2 border-primary-foreground" aria-hidden="true">
                <span className="size-2 rounded-full bg-primary-foreground" />
              </span>
            </button>

            <FuturePlanBar
              icon={Users}
              title="Küçük Grup"
              description="Aynı öğretmenle 2–4 öğrencinin birlikte katıldığı, kişi başı daha avantajlı canlı dersler."
            />
            <FuturePlanBar
              icon={Sparkles}
              title="Hocam Pro"
              description="Birebir dersleri sınırsız soru desteği, haftalık koçluk ve gelişim takibiyle güçlendiren kapsamlı öğrenci planı."
            />
          </div>
        </section>

        <section className="rounded-[1.4rem] bg-muted/45 p-5 sm:p-6" aria-labelledby="private-features-title">
          <div className="max-w-2xl">
            <p id="private-features-title" className="text-base font-semibold">
              Birebir ders paketine dahil
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Ders haklarını yalnız seçtiğin hocayla, onun müsaitliğine göre planlarsın.
            </p>
          </div>
          <ul className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {PRIVATE_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm leading-5">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Check className="size-3.5" aria-hidden="true" />
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="weekly-lessons-title">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p id="weekly-lessons-title" className="text-base font-semibold">
                Haftada kaç ders?
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Her ders 40 dakikadır.</p>
            </div>
            <span className="text-xs font-medium text-muted-foreground">2–6 ders</span>
          </div>
          <div className="mt-4 grid grid-cols-5 gap-2" role="group" aria-label="Haftada ders sayısı">
            {WEEKLY_LESSON_OPTIONS.map((count) => {
              const enabled = weeklyPlans.some((plan) => plan.lessons_per_week === count);
              const selected = lessonsPerWeek === count;
              return (
                <button
                  key={count}
                  type="button"
                  aria-pressed={selected}
                  disabled={!enabled}
                  onClick={() => onLessonsPerWeekChange(count)}
                  className={cn(
                    "min-h-12 rounded-xl border bg-background px-2 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-35",
                    selected && "border-primary bg-primary text-primary-foreground shadow-sm hover:border-primary"
                  )}
                >
                  {count} ders
                </button>
              );
            })}
          </div>
        </section>

        <div className="hidden lg:block">
          <ComparePlansDialog>
            <Button variant="outline" className="rounded-full px-5">
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
}: {
  icon: typeof Users;
  title: string;
  description: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="block rounded-2xl focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          <button
            type="button"
            aria-disabled="true"
            aria-label={`${title} — Yakında`}
            className="flex w-full cursor-not-allowed items-center gap-4 rounded-2xl border border-border/80 bg-background/70 px-4 py-4 text-left text-foreground sm:px-5"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-semibold">{title}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{description}</span>
            </span>
            <Badge variant="secondary" className="rounded-md px-2.5 py-1">Yakında</Badge>
          </button>
        </span>
      </TooltipTrigger>
      <TooltipContent>Bu plan üzerinde çalışıyoruz.</TooltipContent>
    </Tooltip>
  );
}
