"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { StudentProgramModel, StudentProgramRow } from "@/lib/coachingStudentProgram";

type Chip = "pending" | "completed";

const CHIP_BASE =
  "inline-flex min-h-11 items-center rounded-pill border px-4 text-small font-medium transition-colors duration-[var(--duration-state)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2";

/**
 * The goal on an ink card: what the tutor wrote as the objective, how many
 * tasks are done, and where today falls on the program's own span. The number
 * speaks for the tasks and the line for the time; they are never one bar.
 */
function GoalCard({ model }: { model: StudentProgramModel }) {
  const { goal } = model;
  const timeline = goal.timeline;
  return (
    <section aria-label="Program hedefi" className="rounded-card bg-ink p-5 text-paper sm:p-6">
      <p className="text-small">{goal.objective ? "Hedefin" : "Programın"}</p>
      <p className="mt-1 text-[1.25rem] font-medium leading-[1.35] tracking-[-0.01em]">
        {goal.objective || goal.title}
      </p>

      <div className="mt-5 flex flex-wrap items-end gap-x-6 gap-y-4">
        <div>
          <p className="leading-none">
            <span className="text-[2.75rem] font-bold tracking-[-0.03em] tabular-nums">{goal.doneCount}</span>
            <span className="text-[1.25rem] tabular-nums">{` / ${goal.total}`}</span>
          </p>
          <p className="mt-1 text-label">görev tamamlandı</p>
        </div>

        {timeline ? (
          <div className="min-w-[14rem] flex-1 px-4 pt-6">
            <div className="relative h-2 rounded-pill bg-ink-mid">
              {timeline.elapsedPercent !== null ? (
                <>
                  <span
                    className="absolute inset-y-0 left-0 rounded-pill bg-gold"
                    style={{ width: `${timeline.elapsedPercent}%` }}
                  />
                  <span
                    className="absolute -top-6 -translate-x-1/2 whitespace-nowrap rounded-pill bg-gold px-2.5 text-label text-gold-ink"
                    style={{ left: `${timeline.elapsedPercent}%` }}
                  >
                    Bugün
                  </span>
                </>
              ) : null}
            </div>
            <div className="mt-2 flex justify-between gap-3 text-label tabular-nums">
              <span>{timeline.startLabel ?? " "}</span>
              <span className="text-center">{goal.title}</span>
              <span>{timeline.endLabel ?? " "}</span>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function TaskRow({
  row,
  mode,
  busy,
  onToggle,
}: {
  row: StudentProgramRow;
  mode: Chip;
  busy: boolean;
  onToggle: (taskId: string) => void;
}) {
  const meta = [row.subject, row.priority ? `Öncelik: ${row.priority}` : null].filter(Boolean).join(" · ");
  return (
    <li className="grid grid-cols-1 gap-x-4 gap-y-2 border-t border-line py-4 first:border-t-0 min-[480px]:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0">
        <h3 className={`text-body font-medium ${mode === "completed" ? "text-ink-mid" : "text-ink"}`}>{row.title}</h3>
        {meta ? <p className="text-small text-ink-mid">{meta}</p> : null}
        {row.description ? (
          <p className="mt-1 whitespace-pre-wrap text-small leading-[1.5] text-ink">{row.description}</p>
        ) : null}
        {mode === "completed" && row.completedLabel ? (
          <p className="mt-1 text-small text-ink-mid tabular-nums">{row.completedLabel}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 min-[480px]:justify-end">
        {mode === "pending" ? (
          <>
            <div className="min-[480px]:text-right">
              {row.dateLabel ? (
                <>
                  <p className="text-label text-ink-mid">Hedef</p>
                  <p className="text-small font-medium text-ink tabular-nums">{row.dateLabel}</p>
                </>
              ) : (
                <p className="text-small text-ink-mid">Tarihi yok</p>
              )}
              {row.overdue ? <p className="text-small font-medium text-error">Gecikti</p> : null}
            </div>
            <Button
              type="button"
              size="sm"
              variant="gold"
              className="min-h-11"
              aria-label={`${row.title} görevini tamamla`}
              disabled={busy}
              onClick={() => onToggle(row.id)}
            >
              Tamamla
            </Button>
          </>
        ) : (
          <button
            type="button"
            aria-label={`${row.title} görevini yeniden aç`}
            disabled={busy}
            onClick={() => onToggle(row.id)}
            className="inline-flex min-h-11 items-center text-small font-medium text-ink underline underline-offset-4 hover:text-pink-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:text-ink-mid"
          >
            Geri aç
          </button>
        )}
      </div>
    </li>
  );
}

/**
 * The student's program: the goal on ink, two chips (Bekleyen, Tamamlanan) and
 * one list. It opens on what is left, or on what is done when nothing is left,
 * and stays where the student put it: finishing the last task does not throw
 * them onto another list. Solid gold Tamamla on a row; Geri aç is a quiet link
 * because it undoes something.
 *
 * Plain class strings: tailwind-merge would drop a named size next to a colour.
 */
export function StudentProgramBoard({
  model,
  busyTaskId,
  onToggle,
}: {
  model: StudentProgramModel;
  busyTaskId: string | null;
  onToggle: (taskId: string) => void;
}) {
  const [chip, setChip] = useState<Chip>(() => (model.pending.length > 0 ? "pending" : "completed"));
  const rows = chip === "pending" ? model.pending : model.completed;

  return (
    <div className="space-y-5">
      <GoalCard model={model} />

      <h2 className="sr-only">Görevler</h2>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["pending", `Bekleyen ${model.pending.length}`],
            ["completed", `Tamamlanan ${model.completed.length}`],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={chip === value}
            onClick={() => setChip(value)}
            className={`${CHIP_BASE} ${
              chip === value ? "border-ink bg-ink text-paper" : "border-line bg-surface text-ink hover:border-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-card border border-line bg-surface px-4 sm:px-6">
        {rows.length > 0 ? (
          <ul aria-label={chip === "pending" ? "Bekleyen görevler" : "Tamamlanan görevler"}>
            {rows.map((row) => (
              <TaskRow key={row.id} row={row} mode={chip} busy={busyTaskId === row.id} onToggle={onToggle} />
            ))}
          </ul>
        ) : (
          <div className="py-8 text-center">
            <p className="text-body font-medium text-ink">
              {chip === "pending" ? "Bütün görevlerin tamam." : "Henüz tamamladığın görev yok."}
            </p>
            <p className="mt-1 text-small text-ink-mid">
              {chip === "pending"
                ? "Hocan yeni görev eklediğinde burada görünür."
                : "Görevi tamamladığında burada listelenir."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
