"use client";

import { useMemo } from "react";

import { cn } from "@/lib/utils";
import type { ScheduleEvent } from "@/types";
import { ScheduleEventCard } from "./ScheduleEventCard";
import { eventKey } from "./eventIdentity";
import { HOUR_HEIGHT, MIN_CARD_HEIGHT, layoutDayEvents } from "./dayLayout";
import { isSameDay, timeToMinutes, toDateKey } from "./scheduleDates";

interface ScheduleDailyViewProps {
  day: Date;
  events: ScheduleEvent[];
  pendingKeys: Set<string>;
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

  const positioned = useMemo(() => layoutDayEvents(dayEvents), [dayEvents]);
  const { start, end } = useMemo(() => hourWindow(dayEvents), [dayEvents]);
  // Boundary labels, closing hour included — so there is one more label than
  // there are rows, and the canvas spans (end - start) hours, not one more.
  const hours = Array.from({ length: end - start + 1 }, (_, index) => start + index);
  const canvasHeight = (end - start) * HOUR_HEIGHT;

  const now = new Date();
  const showNowLine = isSameDay(day, now);
  const nowOffset =
    ((now.getHours() * 60 + now.getMinutes() - start * 60) / 60) * HOUR_HEIGHT;

  return (
    <div className="relative flex gap-3 overflow-hidden">
      {/* Hour rail. Labels are positioned like the grid lines and centred on
          them; stacking fixed-height rows against a canvas with no matching
          top padding left every label 4px below the line it names. */}
      <div className="relative w-12 shrink-0 sm:w-14" style={{ height: canvasHeight }}>
        {hours.map((hour, index) => (
          <div
            key={hour}
            style={{ top: index * HOUR_HEIGHT }}
            className="absolute right-0 -translate-y-1/2 text-right text-[11px] tabular-nums text-muted-foreground"
          >
            {String(hour).padStart(2, "0")}:00
          </div>
        ))}
      </div>

      <div className="relative flex-1" style={{ height: canvasHeight }}>
        {hours.map((hour, index) => (
          <div
            key={hour}
            style={{ top: index * HOUR_HEIGHT }}
            className="absolute inset-x-0 border-t border-border/60"
          />
        ))}

        {showNowLine && nowOffset >= 0 && nowOffset <= canvasHeight && (
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

        {positioned.map(({ event, column, columns }) => {
          const offset = ((timeToMinutes(event.local_time) - start * 60) / 60) * HOUR_HEIGHT;
          const slotHeight = Math.max(
            (event.duration_minutes / 60) * HOUR_HEIGHT,
            MIN_CARD_HEIGHT
          );
          // Overlapping events share the width instead of hiding each other.
          const width = 100 / columns;
          // Density follows the height the card actually gets, not the column
          // count: a 40-minute lesson in its own column still only has 56px,
          // which clips a three-line card mid-glyph. A card that does have the
          // room gets "expanded", whose right-hand meta column fills the ~500px
          // that a full-width day row otherwise leaves blank.
          const density = columns > 1 || slotHeight < HOUR_HEIGHT ? "compact" : "expanded";
          return (
            <ScheduleEventCard
              key={`${event.source}-${event.id}-${event.occurrence_date ?? ""}`}
              event={event}
              style={{
                top: offset,
                // minHeight, not height: dayLayout reserves the same minimum on
                // the canvas, so a card is free to be as tall as its content.
                minHeight: slotHeight,
                left: `${column * width}%`,
                width: `calc(${width}% - ${columns > 1 ? "0.25rem" : "0px"})`,
              }}
              className={cn("absolute z-[5] items-center")}
              density={density}
              pending={pendingKeys.has(eventKey(event))}
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
