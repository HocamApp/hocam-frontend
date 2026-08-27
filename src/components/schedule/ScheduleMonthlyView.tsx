"use client";

import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import type { ScheduleEvent } from "@/types";
import {
  WEEKDAY_LABELS,
  isSameDay,
  longDayLabel,
  monthGridDays,
  timeToMinutes,
  toDateKey,
} from "./scheduleDates";
import { shortEventLabel } from "./eventLabels";
import { toneForEvent } from "./scheduleTheme";

const MAX_CHIPS_PER_DAY = 3;

interface ScheduleMonthlyViewProps {
  anchor: Date;
  events: ScheduleEvent[];
  onSelectEvent: (event: ScheduleEvent) => void;
  onSelectDay: (day: Date) => void;
}

/**
 * Month overview. Cells are intentionally shallow — a chip per event, and the
 * detail (checkbox, edit, delete) opens in a dialog rather than being crammed
 * into a 100px cell.
 *
 * A day with more than MAX_CHIPS_PER_DAY events expands in place. It used to
 * jump the whole page to the daily view, which meant the one gesture for
 * "show me the rest of this day" threw away the month you were reading.
 */
export function ScheduleMonthlyView({
  anchor,
  events,
  onSelectEvent,
  onSelectDay,
}: ScheduleMonthlyViewProps) {
  const days = useMemo(() => monthGridDays(anchor), [anchor]);
  const today = new Date();
  const currentMonth = anchor.getMonth();

  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  // Paging to another month starts collapsed. The 42-day grid overlaps its
  // neighbours, so without this a day expanded from the previous month's view
  // stays open in this one, and the set grows unbounded while browsing.
  const monthKey = toDateKey(days[0]);
  useEffect(() => {
    setExpandedDays(new Set());
  }, [monthKey]);

  const toggleDay = (key: string) =>
    setExpandedDays((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const byDay = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>();
    events.forEach((event) => {
      const list = map.get(event.local_date) ?? [];
      list.push(event);
      map.set(event.local_date, list);
    });
    map.forEach((list) =>
      list.sort((a, b) => timeToMinutes(a.local_time) - timeToMinutes(b.local_time))
    );
    return map;
  }, [events]);

  if (events.length === 0) {
    return (
      <EmptyState
        title="Bu ay boş görünüyor"
        description="Bu ay için ne ders, ne koçluk, ne de kendi çalışman planlanmış. “+ Çalışma Ekle” ile başlayabilirsin."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[760px]">
        <div className="grid grid-cols-7 gap-px pb-2">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="px-2 text-center text-xs font-semibold text-ink-mid"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 overflow-hidden rounded-card border border-line">
          {days.map((date, index) => {
            const key = toDateKey(date);
            const dayEvents = byDay.get(key) ?? [];
            const isToday = isSameDay(date, today);
            const isOutside = date.getMonth() !== currentMonth;
            const hidden = dayEvents.length - MAX_CHIPS_PER_DAY;
            const expanded = expandedDays.has(key);
            const visibleEvents = expanded ? dayEvents : dayEvents.slice(0, MAX_CHIPS_PER_DAY);

            return (
              <div
                key={key}
                className={cn(
                  "min-h-[6.5rem] border-b border-r border-line p-1.5",
                  index % 7 === 6 && "border-r-0",
                  index >= 35 && "border-b-0",
                  isOutside && "bg-paper"
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelectDay(date)}
                  className={cn(
                    "mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums transition-colors hover:bg-paper",
                    isToday && "bg-pink text-white hover:bg-pink",
                    isOutside && !isToday && "text-ink-mid"
                  )}
                  aria-label={`${date.getDate()} gününü aç`}
                >
                  {date.getDate()}
                </button>

                <div id={`month-day-${key}`} className="space-y-1">
                  {visibleEvents.map((event) => {
                    const tone = toneForEvent(event);
                    // The composed title spends a ~96px cell on its first word.
                    // The time plus the subject is what makes the cell scannable.
                    const struck = event.completed
                      ? "text-ink-mid line-through"
                      : undefined;
                    return (
                      <button
                        key={`${event.source}-${event.id}-${event.occurrence_date ?? ""}`}
                        type="button"
                        onClick={() => onSelectEvent(event)}
                        title={event.title}
                        className="flex w-full min-w-0 items-center gap-1 rounded-input px-1 py-0.5 text-left text-[11px] hover:bg-paper"
                      >
                        <span
                          className={cn("h-1.5 w-1.5 shrink-0 rounded-full", tone.dot)}
                          aria-hidden
                        />
                        <span className={cn("shrink-0 tabular-nums text-ink-mid", struck)}>
                          {event.local_time}
                        </span>
                        <span className={cn("truncate", struck)}>{shortEventLabel(event)}</span>
                      </button>
                    );
                  })}
                  {hidden > 0 && (
                    <button
                      type="button"
                      aria-expanded={expanded}
                      aria-controls={`month-day-${key}`}
                      // "+2 tane daha" alone says nothing in a 42-cell grid, so
                      // the accessible name carries the day it belongs to.
                      aria-label={
                        expanded
                          ? `${longDayLabel(date)}: listeyi daralt`
                          : `${longDayLabel(date)}: ${hidden} etkinlik daha göster`
                      }
                      onClick={() => toggleDay(key)}
                      className="w-full rounded-input px-1 py-0.5 text-left text-[11px] font-medium text-pink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {expanded ? "Daha az göster" : `+${hidden} tane daha`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
