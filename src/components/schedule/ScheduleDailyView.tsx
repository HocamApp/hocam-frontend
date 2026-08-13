"use client";

import { useMemo } from "react";

import { cn } from "@/lib/utils";
import type { ScheduleEvent } from "@/types";
import { ScheduleEventCard } from "./ScheduleEventCard";
import { isSameDay, timeToMinutes, toDateKey } from "./scheduleDates";

const HOUR_HEIGHT = 64;
const MIN_CARD_HEIGHT = 52;

interface ScheduleDailyViewProps {
  day: Date;
  events: ScheduleEvent[];
  pendingIds: Set<string>;
  onToggleCompleted: (event: ScheduleEvent, completed: boolean) => void;
  onEdit: (event: ScheduleEvent) => void;
  onDelete: (event: ScheduleEvent) => void;
}

/**
 * Hour window to draw. An empty day falls back to a normal study evening so it
 * still reads as a schedule; a day with events is cropped to them plus an
 * hour of air. Anchoring to a fixed 08:00–22:00 would leave a lesson at 00:30
 * sitting above twenty empty rows.
 */
function hourWindow(events: ScheduleEvent[]): { start: number; end: number } {
  if (events.length === 0) return { start: 8, end: 22 };

  let start = 24;
  let end = 0;
  events.forEach((event) => {
    const startHour = Math.floor(timeToMinutes(event.local_time) / 60);
    const endHour = Math.ceil(
      (timeToMinutes(event.local_time) + event.duration_minutes) / 60
    );
    start = Math.min(start, startHour);
    end = Math.max(end, endHour);
  });

  return {
    start: Math.max(0, start - 1),
    end: Math.min(24, Math.max(end + 1, start + 2)),
  };
}

export function ScheduleDailyView({
  day,
  events,
  pendingIds,
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

  const { start, end } = useMemo(() => hourWindow(dayEvents), [dayEvents]);
  const hours = Array.from({ length: end - start + 1 }, (_, index) => start + index);

  const now = new Date();
  const showNowLine = isSameDay(day, now);
  const nowOffset =
    ((now.getHours() * 60 + now.getMinutes() - start * 60) / 60) * HOUR_HEIGHT;

  return (
    <div className="relative flex gap-3 overflow-hidden">
      {/* Hour rail */}
      <div className="w-12 shrink-0 pt-1 sm:w-14">
        {hours.map((hour) => (
          <div
            key={hour}
            style={{ height: HOUR_HEIGHT }}
            className="text-right text-[11px] tabular-nums text-muted-foreground"
          >
            {String(hour).padStart(2, "0")}:00
          </div>
        ))}
      </div>

      <div
        className="relative flex-1"
        style={{ height: (end - start + 1) * HOUR_HEIGHT }}
      >
        {hours.map((hour, index) => (
          <div
            key={hour}
            style={{ top: index * HOUR_HEIGHT }}
            className="absolute inset-x-0 border-t border-dashed border-border/70"
          />
        ))}

        {showNowLine && nowOffset >= 0 && nowOffset <= (end - start + 1) * HOUR_HEIGHT && (
          <div
            style={{ top: nowOffset }}
            className="absolute inset-x-0 z-10 flex items-center"
            aria-hidden
          >
            <span className="h-2 w-2 rounded-full bg-brand-500" />
            <span className="h-px flex-1 bg-brand-500" />
            <span className="h-2 w-2 rounded-full bg-brand-500" />
          </div>
        )}

        {dayEvents.length === 0 && (
          <p className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-sm text-muted-foreground">
            Bu gün için planlanmış bir şey yok.
          </p>
        )}

        {dayEvents.map((event) => {
          const offset = ((timeToMinutes(event.local_time) - start * 60) / 60) * HOUR_HEIGHT;
          const height = Math.max(
            (event.duration_minutes / 60) * HOUR_HEIGHT,
            MIN_CARD_HEIGHT
          );
          return (
            <ScheduleEventCard
              key={`${event.source}-${event.id}-${event.occurrence_date ?? ""}`}
              event={event}
              style={{ top: offset, height }}
              className={cn("absolute inset-x-0 z-[5] items-center")}
              pending={pendingIds.has(event.id)}
              onToggleCompleted={onToggleCompleted}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          );
        })}
      </div>
    </div>
  );
}
