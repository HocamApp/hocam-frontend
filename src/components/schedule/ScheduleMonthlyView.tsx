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
    /* The 760px grid is what a month of chips needs to stay readable, but it
       is twice a phone's width, so the month was permanently side-scrolled.
       Below md the seven days fit the screen and the chips give way to dots —
       the same trade the phone's own calendar makes. */
    <div className="md:overflow-x-auto">
      <div className="md:min-w-[760px]" role="grid" aria-label="Aylık takvim">
        <div className="grid grid-cols-7 gap-px pb-2">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              role="columnheader"
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
                role="gridcell"
                aria-label={longDayLabel(date)}
                className={cn(
                  "min-h-[7.25rem] border-b border-r border-line p-1.5 transition-[background-color,border-color] duration-[--duration-state] hover:bg-paper/60 motion-reduce:transition-none",
                  "max-md:min-h-[3.25rem] max-md:p-1",
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
                    "max-md:mx-auto max-md:mb-0.5 max-md:h-7 max-md:w-7",
                    isToday && "bg-pink text-white hover:bg-pink",
                    isOutside && !isToday && "text-ink-mid"
                  )}
                  aria-label={`${date.getDate()} gününü aç`}
                >
                  {date.getDate()}
                </button>

                {/* Phones: three dots and a count stand in for the chips. The
                    day number opens the day, which is where the detail is. */}
                <div className="flex flex-wrap items-center justify-center gap-0.5 md:hidden">
                  {dayEvents.slice(0, 3).map((event) => (
                    <span
                      key={`dot-${event.source}-${event.id}-${event.occurrence_date ?? ""}`}
                      aria-hidden="true"
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        toneForEvent(event).dot,
                        event.completed && "opacity-40",
                      )}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[9px] font-semibold leading-none text-ink-mid">
                      +{dayEvents.length - 3}
                    </span>
                  )}
                </div>

                <div id={`month-day-${key}`} className="space-y-1 max-md:hidden">
                  {visibleEvents.map((event) => {
                    const tone = toneForEvent(event);
                    // The composed title spends a ~96px cell on its first word.
                    // The time plus the subject is what makes the cell scannable.
                    const struck = event.completed ? "line-through opacity-75" : undefined;
                    return (
                      <button
                        key={`${event.source}-${event.id}-${event.occurrence_date ?? ""}`}
                        type="button"
                        onClick={() => onSelectEvent(event)}
                        title={event.title}
                        // Same filled block as the week and day views, at chip
                        // scale: a month cell reads as a calendar when the
                        // events in it are coloured blocks rather than a list
                        // of dots. Hover lifts it the way the card does.
                        className={cn(
                          "group block w-full min-w-0 origin-left rounded-input px-1.5 py-0.5 text-left text-[11px] font-medium",
                          "transform-gpu transition-[transform,box-shadow] duration-[--duration-state]",
                          "hover:z-20 hover:scale-[1.03] hover:shadow-lg",
                          "motion-reduce:transition-none motion-reduce:hover:scale-100",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          tone.card,
                          struck
                        )}
                      >
                        <span className="flex min-w-0 items-center gap-1">
                          <span className="shrink-0 tabular-nums opacity-90">
                            {event.local_time}
                          </span>
                          <span className="truncate">{shortEventLabel(event)}</span>
                        </span>
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
