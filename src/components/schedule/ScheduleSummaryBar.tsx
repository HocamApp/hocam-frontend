"use client";

import { cn } from "@/lib/utils";
import type { WeeklyCompletion } from "@/types";

interface ScheduleSummaryBarProps {
  completion?: WeeklyCompletion;
  /** The week these numbers describe, e.g. "10 – 16 Ağustos". */
  weekLabel?: string;
  isLoading?: boolean;
}

/**
 * The weekly bar.
 *
 * Wording matters here: everything planned for the week is in the denominator,
 * including work that simply hasn't happened yet, so Monday morning reads 0%
 * by design. That makes this a "how much of your plan is done" number, never a
 * success rate — the copy must not imply the student failed at anything.
 */
export function ScheduleSummaryBar({
  completion,
  weekLabel,
  isLoading,
}: ScheduleSummaryBarProps) {
  if (isLoading || !completion) {
    return (
      <div className="h-14 animate-skeleton-pulse rounded-card border border-line bg-[#EDE6E6]" />
    );
  }

  const { completed, total, percentage } = completion;

  if (total === 0) {
    return (
      <div className="rounded-card border border-line bg-surface px-4 py-3 text-sm text-ink-mid">
        {/* The calendar below already offers the "+ Çalışma Ekle" prompt when
            it is empty; this line only states the week's numbers. */}
        {weekLabel ? `${weekLabel} haftasında` : "Bu hafta"} planlanmış çalışma yok.
      </div>
    );
  }

  return (
    <div className="rounded-card border border-line bg-surface px-4 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-sm font-medium">
          Bu haftaki planının{" "}
          <span className="font-semibold text-pink">
            %{percentage}
          </span>
          &apos;i tamamlandı
        </p>
        <p className="text-xs tabular-nums text-ink-mid">
          {/* Named explicitly: in the monthly view the calendar shows a whole
              month while these numbers only ever describe one week, and an
              unlabelled "bu hafta" reads as whatever the grid is showing. */}
          {weekLabel && <span className="mr-2">{weekLabel} haftası</span>}
          {completed} / {total} çalışma
        </p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-paper">
        <div
          className={cn("h-full rounded-full bg-pink transition-[width]")}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Bu haftaki planının tamamlanma oranı"
        />
      </div>
    </div>
  );
}
