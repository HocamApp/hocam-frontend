"use client";

import { Button } from "@/components/ui/button";
import type { ScheduleDeadline, ScheduleSummary } from "@/lib/coachingStudentSchedule";

/**
 * What the student has chosen so far, the server's deadline for choosing, and
 * the one button that finishes it. Dark, like the coach card on the overview:
 * it is the page's summary, not another list. The button is shut until every
 * slot has an hour and after the deadline, and says why.
 */
export function StudentScheduleSummary({
  planLine,
  deadline,
  summary,
  requiredCount,
  isSubmitting,
  onSubmit,
}: {
  /** "Haftada 2 görüşme · 30 dakika · 8 görüşme" */
  planLine: string;
  deadline: ScheduleDeadline | null;
  summary: ScheduleSummary;
  requiredCount: number;
  isSubmitting: boolean;
  onSubmit: () => void;
}) {
  const expired = deadline?.expired ?? false;
  const canSubmit = summary.complete && !expired && !isSubmitting;

  return (
    <section aria-label="Seçtiklerin" className="rounded-card bg-ink p-5 text-paper">
      {deadline ? (
        <div>
          <p className="text-small">Son gün</p>
          <p className="text-body font-medium tabular-nums text-gold">{deadline.value}</p>
          <p className="text-small tabular-nums">{deadline.remaining}</p>
        </div>
      ) : null}

      <div className={deadline ? "mt-4 border-t border-paper pt-4" : ""}>
        <p className="text-small">{`Seçtiklerin (${summary.chosen} / ${requiredCount})`}</p>
        <ul className="mt-2 space-y-1">
          {summary.rows.map((row) => (
            <li key={row.slotIndex} className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span className="text-small">{row.label}</span>
              <span className="text-body font-medium tabular-nums">{row.value ?? "seçilmedi"}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-4 text-small">{planLine}</p>

      <Button type="button" size="lg" className="mt-4 w-full" disabled={!canSubmit} onClick={onSubmit}>
        {isSubmitting ? "Onaylanıyor…" : "Saatleri onayla"}
      </Button>
      {expired ? (
        <p className="mt-2 text-small">Süre dolduğu için saatleri onaylayamazsın.</p>
      ) : summary.hint ? (
        <p className="mt-2 text-small">{summary.hint}</p>
      ) : null}
    </section>
  );
}
