"use client";

import { cn } from "@/lib/utils";
import type { WeeklyCompletion } from "@/types";

interface ScheduleSummaryBarProps {
  completion?: WeeklyCompletion;
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
export function ScheduleSummaryBar({ completion, isLoading }: ScheduleSummaryBarProps) {
  if (isLoading || !completion) {
    return (
      <div className="h-14 animate-pulse rounded-2xl border border-border bg-muted/50" />
    );
  }

  const { completed, total, percentage } = completion;

  if (total === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
        Bu hafta için planlanmış bir çalışma yok. “+ Çalışma Ekle” ile başlayabilirsin.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-sm font-medium">
          Bu haftaki planının{" "}
          <span className="font-semibold text-brand-600 dark:text-brand-300">
            %{percentage}
          </span>
          &apos;i tamamlandı
        </p>
        <p className="text-xs tabular-nums text-muted-foreground">
          {completed} / {total} çalışma
        </p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full bg-brand-500 transition-[width]")}
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
