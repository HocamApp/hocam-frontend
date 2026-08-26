"use client";

import { BookOpen, Clock } from "lucide-react";

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
            className="h-24 w-52 shrink-0 animate-pulse rounded-2xl border border-border bg-muted/50"
          />
        ))}
      </div>
    );
  }

  if (!stats || stats.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
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
          className="w-52 shrink-0 snap-start rounded-2xl border border-border bg-card p-4"
        >
          <div className={cn("mb-2 flex h-8 w-8 items-center justify-center rounded-xl", accent.chip)}>
            <BookOpen className="h-4 w-4" aria-hidden />
          </div>
          <p className="flex min-w-0 items-center gap-1.5 font-semibold" title={stat.subject}>
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", accent.dot)} aria-hidden />
            <span className="truncate">{stat.subject}</span>
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            <span className="tabular-nums">
              Toplam çalışma: {formatMinutes(stat.total_minutes)}
            </span>
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Ders {formatMinutes(stat.completed_lesson_minutes)} · Kendi çalışman{" "}
            {formatMinutes(stat.completed_study_minutes)}
          </p>
        </div>
        );
      })}
    </div>
  );
}
