"use client";

import { useEffect, useRef } from "react";

import type { ScheduleEvent } from "@/types";
import { cn } from "@/lib/utils";
import { ScheduleEventCard } from "./ScheduleEventCard";
import { eventKey } from "./eventIdentity";
import { isSameDay, longDayLabel, timeToMinutes, toDateKey, visibleHourWindow, WEEKDAY_LABELS } from "./scheduleDates";

type Props = {
  days: Date[];
  events: ScheduleEvent[];
  pendingKeys: Set<string>;
  onSelectEvent?: (event: ScheduleEvent) => void;
  isEventSelectable?: (event: ScheduleEvent) => boolean;
};

const SLOT_MINUTES = 30;
// Half of the 80px hour row the schedule views use (imported from the daily
// view it would be a circular import).
const SLOT_HEIGHT = 40;
// Availability keeps the mint it was given; the card itself (hover lift,
// kind label, lock) is the shared one every other event uses.
const AVAILABILITY_CLASS = "h-full overflow-hidden bg-emerald-100 text-emerald-950";

const timeLabel = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/**
 * The hour grid, cut into half hours so availability can start and end on :30.
 *
 * One CSS grid holds the row labels, the cell backgrounds and the events, so an
 * availability block is a single card that spans the rows it covers (09:30–11:00
 * is one block, not three slices) and stays correct when a row grows to fit a
 * lesson card.
 */
export function TutorHalfHourGrid({ days, events, pendingKeys, onSelectEvent, isEventSelectable }: Props) {
  const { start, end } = visibleHourWindow(events);
  const base = start * 60;
  const slots = Array.from({ length: ((end - start) * 60) / SLOT_MINUTES }, (_, index) => base + index * SLOT_MINUTES);
  const weekly = days.length === 7;
  const today = new Date();
  const scrollRef = useRef<HTMLDivElement>(null);
  const dayKey = toDateKey(days[0]);

  // A day view opens on its first event, not on an empty morning.
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || weekly) return;
    const first = events.filter((event) => event.local_date === dayKey).map((event) => timeToMinutes(event.local_time));
    if (first.length === 0) return;
    container.scrollTop = Math.max(0, Math.floor((Math.min(...first) - base) / SLOT_MINUTES) * SLOT_HEIGHT);
    // Re-anchor when the day changes, not whenever the event list refetches.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKey, weekly]);

  const columns = weekly
    ? "grid-cols-[4rem_repeat(7,minmax(0,1fr))]"
    : "grid-cols-[3.5rem_minmax(0,1fr)] sm:grid-cols-[5rem_minmax(0,1fr)]";
  const slotIndex = (minutes: number) => Math.min(slots.length - 1, Math.max(0, Math.floor((minutes - base) / SLOT_MINUTES)));
  const select = (event: ScheduleEvent) => (onSelectEvent && (isEventSelectable?.(event) ?? true) ? () => onSelectEvent(event) : undefined);

  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      {weekly && (
        <div className={cn("grid border-b border-line bg-paper/55", columns)}>
          <div aria-hidden />
          {days.map((day, index) => (
            <div
              key={toDateKey(day)}
              role="columnheader"
              aria-label={longDayLabel(day)}
              className="flex min-h-14 items-center justify-center gap-2 border-l border-line px-2"
            >
              <span className="text-xs font-semibold text-ink-mid">{WEEKDAY_LABELS[index]}</span>
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                  isSameDay(day, today) && "bg-pink text-white"
                )}
              >
                {day.getDate()}
              </span>
            </div>
          ))}
        </div>
      )}

      <div
        ref={scrollRef}
        role="grid"
        aria-label={weekly ? "Haftalık takvim" : "Günlük takvim"}
        className={cn("max-h-[66vh] overflow-x-hidden overflow-y-auto grid", columns)}
        style={{ gridAutoRows: `minmax(${SLOT_HEIGHT}px, auto)` }}
      >
        {slots.map((slotStart, row) => (
          <div
            key={`label-${slotStart}`}
            style={{ gridColumn: 1, gridRow: row + 1 }}
            className={cn("border-b border-line p-1 text-right text-[10px] tabular-nums text-ink-mid", !weekly && "border-r p-2 text-[11px] sm:p-3 sm:text-xs")}
          >
            {timeLabel(slotStart)}
          </div>
        ))}

        {days.map((day, column) => {
          const date = toDateKey(day);
          const isToday = isSameDay(day, today);
          const dayEvents = events.filter((event) => event.local_date === date);
          return (
            <div key={date} role="presentation" className="contents">
              {slots.map((slotStart, row) => (
                <div
                  key={`${date}-${slotStart}`}
                  role="gridcell"
                  style={{ gridColumn: column + 2, gridRow: row + 1 }}
                  className={cn("border-b border-l border-line", !weekly && "border-l-0", isToday && "bg-brand-50/35 dark:bg-brand-900/10")}
                />
              ))}

              {dayEvents
                .filter((event) => event.source === "availability")
                .map((event) => {
                  const first = slotIndex(timeToMinutes(event.local_time));
                  const last = slotIndex(timeToMinutes(event.local_time) + event.duration_minutes - 1);
                  return (
                    <div
                      key={`availability-${event.id}`}
                      style={{ gridColumn: column + 2, gridRow: `${first + 1} / span ${last - first + 1}` }}
                      className="z-[1] min-h-0 p-1"
                    >
                      <ScheduleEventCard
                        event={event}
                        density={weekly ? "compact" : "full"}
                        pending={pendingKeys.has(eventKey(event))}
                        onSelect={select(event)}
                        className={AVAILABILITY_CLASS}
                      />
                    </div>
                  );
                })}

              {dayEvents
                .filter((event) => event.source !== "availability")
                .map((event) => (
                  <div
                    key={`${event.source}-${event.id}-${event.occurrence_date ?? ""}`}
                    style={{ gridColumn: column + 2, gridRow: slotIndex(timeToMinutes(event.local_time)) + 1 }}
                    className="z-10 min-w-0 self-start p-1"
                  >
                    <ScheduleEventCard
                      event={event}
                      density={weekly ? "compact" : "full"}
                      pending={pendingKeys.has(eventKey(event))}
                      onSelect={select(event)}
                    />
                  </div>
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
