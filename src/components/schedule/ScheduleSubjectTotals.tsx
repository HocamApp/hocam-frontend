"use client";

import { BookOpen, Clock } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";
import type { ScheduleSubjectStat } from "@/types";
import { formatMinutes } from "./scheduleDates";
import { subjectAccent } from "./scheduleTheme";

interface ScheduleSubjectTotalsProps {
  stats?: ScheduleSubjectStat[];
  isLoading?: boolean;
}

/**
 * "Derslere göre çalışma" cards.
 *
 * Total time only — no percentage and no progress bar. A percentage needs a
 * target to be a share of, and targets belong to the coach/AI phase; showing
 * one now would be a number the product cannot justify. These totals are also
 * all-time rather than weekly, so paging the calendar back never shrinks them.
 */
export function ScheduleSubjectTotals({ stats, isLoading }: ScheduleSubjectTotalsProps) {
  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-hidden">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="h-24 w-52 shrink-0 animate-skeleton-pulse rounded-card border border-line bg-[#EDE6E6]"
          />
        ))}
      </div>
    );
  }

  if (!stats || stats.length === 0) {
    return (
      <p className="rounded-card border border-line bg-surface p-4 text-sm text-ink-mid">
        {/* Deliberately not another "add something" prompt — this section is
            about completed work, and the calendar above already asks. */}
        Tamamladığın çalışmalar burada ders ders toplanır.
      </p>
    );
  }

  return (
    <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
      {stats.map((stat) => {
        // ScheduleSubjectStat carries the subject *name*, which is what
        // subjectAccent keys on — so these cards and the calendar agree on a
        // subject's colour by construction rather than by being kept in sync.
        const accent = subjectAccent(stat.subject);
        return (
        <div
          key={stat.subject}
          className="w-52 shrink-0 snap-start rounded-card border border-line bg-surface p-4"
        >
          <div className={cn(
              // 14px inside the 20px card, per the nesting subtraction rule.
              "mb-2 flex size-10 items-center justify-center rounded-[14px]",
              accent.chip,
            )}>
            <BookOpen className="size-5" aria-hidden />
          </div>
          <p className="flex min-w-0 items-center gap-1.5 font-semibold" title={stat.subject}>
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", accent.dot)} aria-hidden />
            <span className="truncate">{stat.subject}</span>
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-mid">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            <span className="tabular-nums">
              Toplam çalışma: {formatMinutes(stat.total_minutes)}
            </span>
          </p>
          <p className="mt-1 text-[11px] text-ink-mid">
            Ders {formatMinutes(stat.completed_lesson_minutes)} · Kendi çalışman{" "}
            {formatMinutes(stat.completed_study_minutes)}
          </p>
        </div>
        );
      })}
    </div>
  );
}
