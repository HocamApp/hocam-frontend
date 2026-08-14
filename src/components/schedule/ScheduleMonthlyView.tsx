"use client";

import { useMemo } from "react";

import { cn } from "@/lib/utils";
import type { ScheduleEvent } from "@/types";
import {
  WEEKDAY_LABELS,
  isSameDay,
  monthGridDays,
  timeToMinutes,
  toDateKey,
} from "./scheduleDates";
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

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="grid grid-cols-7 gap-px pb-2">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="px-2 text-center text-xs font-semibold text-muted-foreground"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 overflow-hidden rounded-2xl border border-border">
          {days.map((date, index) => {
            const key = toDateKey(date);
            const dayEvents = byDay.get(key) ?? [];
            const isToday = isSameDay(date, today);
            const isOutside = date.getMonth() !== currentMonth;
            const hidden = dayEvents.length - MAX_CHIPS_PER_DAY;

            return (
              <div
                key={key}
                className={cn(
                  "min-h-[6.5rem] border-b border-r border-border p-1.5",
                  index % 7 === 6 && "border-r-0",
                  index >= 35 && "border-b-0",
                  isOutside && "bg-muted/40"
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelectDay(date)}
                  className={cn(
                    "mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums transition-colors hover:bg-muted",
                    isToday && "bg-brand-500 text-white hover:bg-brand-600",
                    isOutside && !isToday && "text-muted-foreground"
                  )}
                  aria-label={`${date.getDate()} gününü aç`}
                >
                  {date.getDate()}
                </button>

                <div className="space-y-1">
                  {dayEvents.slice(0, MAX_CHIPS_PER_DAY).map((event) => {
                    const tone = toneForEvent(event);
                    return (
                      <button
                        key={`${event.source}-${event.id}-${event.occurrence_date ?? ""}`}
                        type="button"
                        onClick={() => onSelectEvent(event)}
                        title={event.title}
                        className="flex w-full min-w-0 items-center gap-1 rounded-md px-1 py-0.5 text-left text-[11px] hover:bg-muted"
                      >
                        <span
                          className={cn("h-1.5 w-1.5 shrink-0 rounded-full", tone.dot)}
                          aria-hidden
                        />
                        <span
                          className={cn(
                            "truncate",
                            event.completed && "text-muted-foreground line-through"
                          )}
                        >
                          {event.title}
                        </span>
                      </button>
                    );
                  })}
                  {hidden > 0 && (
                    <button
                      type="button"
                      onClick={() => onSelectDay(date)}
                      className="px-1 text-[11px] font-medium text-brand-600 hover:underline"
                    >
                      +{hidden} tane daha
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
