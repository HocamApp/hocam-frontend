"use client";

import type { HocaBulGoal, HocaBulStepId, HocaBulStepTotal } from "@/types/hocaBul";
import type { HocaBulOption } from "@/lib/hocaBulOptions";

/**
 * Development-only stand-in for the real question screens.
 *
 * It exists so the shell — branching, progress, draft resume, URL sync — can be
 * exercised before the choice components land, and is deleted wholesale in the
 * next phase. It deliberately looks like scaffolding rather than a finished
 * question, and it never renders a recommendation, a tutor or a fabricated
 * answer. The goal switcher writes real values taken from the options endpoint,
 * because that is what makes the 8/9-step branch observable.
 */
export function DevStepPlaceholder({
  stepId,
  humanIndex,
  total,
  optionsStatus,
  goalOptions,
  selectedGoal,
  onSelectGoal,
}: {
  stepId: HocaBulStepId;
  humanIndex: number;
  total: HocaBulStepTotal;
  optionsStatus: "loading" | "ready" | "error";
  goalOptions: HocaBulOption[];
  selectedGoal?: HocaBulGoal;
  onSelectGoal: (goal: HocaBulGoal) => void;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/40 p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Geliştirme görünümü
      </p>
      <p className="mt-2 text-sm text-foreground">
        Bu ekran, gerçek soru bileşenleri eklendiğinde tamamen değiştirilecek.
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Adım</dt>
        <dd className="notranslate font-medium text-foreground" translate="no">
          {stepId}
        </dd>
        <dt className="text-muted-foreground">Sıra</dt>
        <dd className="notranslate font-medium tabular-nums text-foreground" translate="no">
          {humanIndex} / {total}
        </dd>
        <dt className="text-muted-foreground">Seçenekler</dt>
        <dd className="font-medium text-foreground">
          {optionsStatus === "loading"
            ? "Yükleniyor"
            : optionsStatus === "error"
              ? "Yüklenemedi"
              : "Hazır"}
        </dd>
      </dl>

      {stepId === "hedef" && goalOptions.length > 0 ? (
        <div className="mt-5">
          <p className="text-sm font-medium text-foreground">
            Hedef seçimi (geçici)
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {goalOptions.map((option) => {
              const isSelected = selectedGoal === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onSelectGoal(option.value as HocaBulGoal)}
                  className={`inline-flex min-h-11 items-center rounded-xl border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
