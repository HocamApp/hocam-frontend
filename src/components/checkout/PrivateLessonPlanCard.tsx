"use client";

import { ChalkboardTeacher } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";
import { WEEKLY_LESSON_OPTIONS, type WeeklyLessonOption } from "@/lib/lessonPricing";

const PRIVATE_FEATURES = [
  "Seçtiğin hocayla canlı birebir ders",
  "Hoca müsaitliğine göre ders planlama",
  "Hoca ile doğrudan mesajlaşma",
  "Haftada 2–6 ders seçimi",
];

export interface WeeklyOptionState {
  /** The tutor sells a package at this cadence. */
  offered: boolean;
  /** The tutor has enough free weekly hours to fill this cadence. */
  schedulable: boolean;
}

interface PrivateLessonPlanCardProps {
  value: WeeklyLessonOption;
  onChange: (count: WeeklyLessonOption) => void;
  /** Per-cadence availability. A missing entry is treated as unavailable. */
  optionState: Record<number, WeeklyOptionState>;
  lessonDurationMinutes: number;
}

/**
 * "Birebir Özel Ders" — the product card, and the weekly lesson count.
 *
 * It used to live on the package checkout screen. It moved here because the
 * count decides how many hours the student has to pick, so asking it after the
 * schedule was backwards: changing it later invalidated the hours they had
 * already chosen.
 *
 * Rebuilt on the global Hocam tokens rather than copied. Every colour in the
 * original came from a `--checkout-*` variable, and that stylesheet is loaded
 * only by the (checkout) route group's layout — pasted into a (main) page the
 * card would render with transparent surfaces and invisible borders. Gold
 * header on `--gold-ink` text, per DESIGN.md: gold is a surface, never a text
 * colour.
 */
export function PrivateLessonPlanCard({
  value,
  onChange,
  optionState,
  lessonDurationMinutes,
}: PrivateLessonPlanCardProps) {
  return (
    <section
      aria-label="Seçili plan: Birebir Özel Ders"
      className="overflow-hidden rounded-card border-2 border-ink bg-surface text-ink"
    >
      <div className="flex w-full items-center gap-3 bg-gold px-4 py-2 text-gold-ink">
        <ChalkboardTeacher className="size-5 shrink-0" weight="fill" />
        <div className="min-w-0 flex-1">
          <span className="block font-bold">Birebir Özel Ders</span>
          <span className="block text-xs leading-4 opacity-80 sm:text-sm">
            Seçtiğin hocayla sana özel canlı dersler.
          </span>
        </div>
      </div>

      <div className="space-y-3 p-3 sm:p-3.5">
        <div>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold">Haftalık ders sayısını seç</h2>
              <p className="mt-0.5 text-xs text-ink-mid">
                Her ders {lessonDurationMinutes} dakikadır.
              </p>
            </div>
            <span className="text-xs font-medium text-ink-mid">2–6 ders</span>
          </div>

          <div
            role="group"
            aria-label="Haftada ders sayısı"
            className="mt-2 grid grid-cols-5 gap-1.5"
          >
            {WEEKLY_LESSON_OPTIONS.map((count) => {
              const state = optionState[count];
              const enabled = Boolean(state?.offered && state?.schedulable);
              const selected = count === value;
              return (
                <button
                  key={count}
                  type="button"
                  aria-pressed={selected}
                  disabled={!enabled}
                  onClick={() => onChange(count)}
                  className={cn(
                    "min-h-9 rounded-input border border-line bg-paper px-1 text-xs font-bold text-ink transition-colors duration-[120ms] hover:border-ink disabled:cursor-not-allowed disabled:opacity-35 sm:text-sm",
                    selected && "border-ink bg-ink text-white"
                  )}
                >
                  {count} ders
                </button>
              );
            })}
          </div>

          <UnavailableReason optionState={optionState} />
        </div>

        <div className="rounded-input border border-line bg-surface p-3 text-ink">
          <h3 className="text-xs font-bold tracking-[0.06em]">
            BİREBİR PAKET ÖZELLİKLERİ
          </h3>
          <ul className="mt-2 grid gap-x-5 gap-y-1 sm:grid-cols-2">
            {PRIVATE_FEATURES.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2 text-xs leading-4 sm:text-[0.8125rem]"
              >
                <span className="mt-[0.45rem] h-px w-3 shrink-0 bg-current" aria-hidden />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/**
 * Why some counts are greyed out. Two different reasons, and conflating them
 * would send the student to the wrong fix: a cadence the tutor does not sell
 * is never going to appear, while one they sell but cannot staff might open up
 * if someone else's lesson is cancelled.
 */
function UnavailableReason({
  optionState,
}: {
  optionState: Record<number, WeeklyOptionState>;
}) {
  const notOffered = WEEKLY_LESSON_OPTIONS.filter((count) => !optionState[count]?.offered);
  const notSchedulable = WEEKLY_LESSON_OPTIONS.filter(
    (count) => optionState[count]?.offered && !optionState[count]?.schedulable
  );

  if (notOffered.length === 0 && notSchedulable.length === 0) return null;

  return (
    <p className="mt-2 text-xs text-ink-mid">
      {notSchedulable.length > 0
        ? "Bu hocanın haftada bu kadar boş saati yok. Daha az ders seç ya da hocaya mesaj gönder."
        : "Bu hoca yalnız işaretli ders sayılarında paket sunuyor."}
    </p>
  );
}
