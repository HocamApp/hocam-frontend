"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { instantDateTimeLabel } from "@/lib/instantTime";
import type { RefundLesson } from "@/types";

const COLLAPSED_COUNT = 5;

/**
 * Lessons of a refund calculation. Their times are real instants, drawn in
 * Istanbul time by `instantTime` (never by the booking helpers, whose input is a
 * wall clock). A long list shows its first few and opens on request, so a
 * 24-week package does not push the confirm button off the screen.
 */
export function RefundLessonList({
  title,
  intro,
  lessons,
  noteFor,
}: {
  title: string;
  intro?: string;
  lessons: readonly RefundLesson[];
  noteFor?: (lesson: RefundLesson) => string;
}) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  if (lessons.length === 0) return null;

  const hidden = Math.max(0, lessons.length - COLLAPSED_COUNT);
  const shown = open ? lessons : lessons.slice(0, COLLAPSED_COUNT);

  return (
    <section aria-label={title}>
      <h3 className="text-base font-bold text-ink">
        {title} <span className="font-medium tabular-nums text-ink-mid">({lessons.length})</span>
      </h3>
      {intro && <p className="mt-1 text-sm text-ink-mid">{intro}</p>}
      <ul id={listId} className="mt-3 divide-y divide-line rounded-input border border-line bg-surface">
        {shown.map((lesson, index) => (
          <li key={`${lesson.starts_at}-${index}`} className="px-4 py-3">
            <p className="text-sm font-medium tabular-nums text-ink">
              {instantDateTimeLabel(lesson.starts_at)}
            </p>
            {noteFor && <p className="mt-0.5 text-sm text-ink-mid">{noteFor(lesson)}</p>}
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2 min-h-11"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Daha az göster" : `${hidden} dersi daha göster`}
        </Button>
      )}
    </section>
  );
}
