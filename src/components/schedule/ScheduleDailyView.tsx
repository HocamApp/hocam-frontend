"use client";

import { useEffect, useMemo, useRef } from "react";

import { cn } from "@/lib/utils";
import type { ScheduleEvent } from "@/types";
import { ScheduleEventCard } from "./ScheduleEventCard";
import { eventKey } from "./eventIdentity";
import {
  isSameDay,
  timeToMinutes,
  toDateKey,
  visibleHourWindow,
} from "./scheduleDates";

/** One hour row. Tall enough to hold a card without the card being stretched. */
export const HOUR_ROW_HEIGHT = 80;

interface ScheduleDailyViewProps {
  day: Date;
  events: ScheduleEvent[];
  pendingKeys: Set<string>;
  onToggleCompleted: (event: ScheduleEvent, completed: boolean) => void;
  onEdit: (event: ScheduleEvent) => void;
  onDelete: (event: ScheduleEvent) => void;
}

/**
 * The day, one row per hour.
 *
 * Blocks used to be positioned absolutely by their start minute and sized by
 * their duration, which is what a wall calendar does — and it meant an 01:58
 * lesson was drawn straddling the 02:00 rule, with a 40-minute block ending
 * two thirds of the way down a row. An event now sits inside the row for the
 * hour it starts in, between two rules and never across one, which is the
 * shape of the reference calendar this is drawn from.
 *
 * Overlapping events stack down their shared row rather than splitting into
 * side-by-side columns. The row grows; nothing is hidden behind anything.
 */
export function ScheduleDailyView({
  day,
  events,
  pendingKeys,
  onToggleCompleted,
  onEdit,
  onDelete,
}: ScheduleDailyViewProps) {
  const dayKey = toDateKey(day);
  const dayEvents = useMemo(
    () =>
      events
        .filter((event) => event.local_date === dayKey)
        .sort((a, b) => timeToMinutes(a.local_time) - timeToMinutes(b.local_time)),
    [events, dayKey]
  );

  const { start, end } = useMemo(() => visibleHourWindow(dayEvents), [dayEvents]);
  // One row per hour in the window, so the last label names a row rather than
  // a boundary with nothing under it.
  const hours = Array.from({ length: end - start }, (_, index) => start + index);

  const eventsByHour = useMemo(() => {
    const map = new Map<number, ScheduleEvent[]>();
    dayEvents.forEach((event) => {
      const hour = Math.floor(timeToMinutes(event.local_time) / 60);
      map.set(hour, [...(map.get(hour) ?? []), event]);
    });
    return map;
  }, [dayEvents]);

  const now = new Date();
  const isToday = isSameDay(day, now);
  const currentHour = now.getHours();

  // A day holding a 09:00 and a 23:00 block is sixteen rows. Letting the page
  // carry that scrolled the header, the view switch and the progress bar off
  // screen to reach the evening. The grid scrolls inside its own box instead.
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    // Open on what matters: the current hour on today, the first block
    // otherwise. Landing on an empty 08:00 when everything starts at 19:00 is
    // the same problem in a smaller form.
    const anchorHour =
      isToday && currentHour >= start
        ? currentHour
        : dayEvents.length > 0
          ? Math.floor(timeToMinutes(dayEvents[0].local_time) / 60)
          : start;
    container.scrollTop = Math.max(0, (anchorHour - start) * HOUR_ROW_HEIGHT);
    // Re-anchor when the day changes, not on every tick of the clock.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKey]);

  if (dayEvents.length === 0) {
    return (
      <div className="rounded-card bg-surface py-16 text-center text-sm text-ink-mid">
        Bu gün için planlanmış bir şey yok.
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      role="grid"
      aria-label="Günlük takvim"
      // max-height only: a three-hour day keeps its natural height and does
      // not become a tall box with empty space under it.
      className="max-h-[70vh] overflow-y-auto overflow-x-hidden rounded-card border border-line bg-surface"
    >
      {hours.map((hour) => {
        const hourEvents = eventsByHour.get(hour) ?? [];
        return (
          <div
            key={hour}
            role="row"
            className="flex border-b border-line last:border-b-0"
          >
            <div className="w-14 shrink-0 border-r border-line p-2 text-[11px] tabular-nums text-ink-mid sm:w-20 sm:p-3 sm:text-xs">
              {String(hour).padStart(2, "0")}:00
            </div>
            <div
              role="gridcell"
              style={{ minHeight: HOUR_ROW_HEIGHT }}
              className={cn(
                "flex-1 space-y-2 p-2",
                isToday && hour === currentHour && "bg-brand-50/40 dark:bg-brand-900/15"
              )}
            >
              {hourEvents.map((event) => (
                <ScheduleEventCard
                  key={`${event.source}-${event.id}-${event.occurrence_date ?? ""}`}
                  event={event}
                  pending={pendingKeys.has(eventKey(event))}
                  onToggleCompleted={onToggleCompleted}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
