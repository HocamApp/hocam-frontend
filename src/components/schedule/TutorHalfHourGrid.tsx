"use client";

import type { ScheduleEvent } from "@/types";
import { cn } from "@/lib/utils";
import { ScheduleEventCard } from "./ScheduleEventCard";
import { eventKey } from "./eventIdentity";
import { longDayLabel, timeToMinutes, toDateKey, visibleHourWindow, WEEKDAY_LABELS } from "./scheduleDates";

type Props = {
  days: Date[];
  events: ScheduleEvent[];
  pendingKeys: Set<string>;
  onSelectEvent?: (event: ScheduleEvent) => void;
  isEventSelectable?: (event: ScheduleEvent) => boolean;
};

const timeLabel = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

export function TutorHalfHourGrid({ days, events, pendingKeys, onSelectEvent, isEventSelectable }: Props) {
  const { start, end } = visibleHourWindow(events);
  const slots = Array.from({ length: (end - start) * 2 }, (_, index) => start * 60 + index * 30);
  const weekly = days.length === 7;
  const columns = weekly ? "grid-cols-[4rem_repeat(7,minmax(0,1fr))]" : "grid-cols-[4rem_minmax(0,1fr)]";

  return <div role="grid" aria-label={weekly ? "Haftalık takvim" : "Günlük takvim"} className="max-h-[66vh] overflow-y-auto rounded-card border border-line bg-surface">
    {weekly && <div role="row" className={cn("sticky top-0 z-20 grid border-b border-line bg-paper", columns)}>
      <div aria-hidden="true" />
      {days.map((day, index) => <div key={toDateKey(day)} role="columnheader" aria-label={longDayLabel(day)} className="border-l border-line px-1 py-2 text-center text-xs font-semibold">
        {WEEKDAY_LABELS[index]} {day.getDate()}
      </div>)}
    </div>}
    {slots.map((slotStart) => <div key={slotStart} role="row" className={cn("grid border-b border-line last:border-b-0", columns)}>
      <div className="p-1 text-right text-[10px] tabular-nums text-ink-mid">{timeLabel(slotStart)}</div>
      {days.map((day) => {
        const date = toDateKey(day);
        const dayEvents = events.filter(event => event.local_date === date);
        const availability = dayEvents.filter(event => event.source === "availability" && timeToMinutes(event.local_time) < slotStart + 30 && timeToMinutes(event.local_time) + event.duration_minutes > slotStart);
        const starting = dayEvents.filter(event => event.source !== "availability" && Math.floor(timeToMinutes(event.local_time) / 30) * 30 === slotStart);
        return <div key={`${date}-${slotStart}`} role="gridcell" className="relative min-h-[64px] min-w-0 border-l border-line p-1">
          {availability.map(event => {
            const first = Math.max(slotStart, timeToMinutes(event.local_time));
            const last = Math.min(slotStart + 30, timeToMinutes(event.local_time) + event.duration_minutes);
            const top = (first - slotStart) / 30 * 100;
            const height = (last - first) / 30 * 100;
            return <div
              key={event.id}
              role="img"
              aria-label={`Müsait: ${timeLabel(first)}–${timeLabel(last)}`}
              className="absolute inset-x-1 overflow-hidden rounded-md bg-emerald-100 px-2 text-emerald-950"
              style={{ top: `calc(${top}% + 2px)`, height: `max(2px, calc(${height}% - 4px))` }}
            >
              {first === timeToMinutes(event.local_time) && <span className="block truncate text-xs font-semibold">Müsait</span>}
            </div>;
          })}
          {starting.map(event => <div key={`${event.source}-${event.id}`} className="relative z-10">
            <ScheduleEventCard
              event={event}
              density={weekly ? "compact" : "full"}
              pending={pendingKeys.has(eventKey(event))}
              onSelect={onSelectEvent && (isEventSelectable?.(event) ?? true) ? () => onSelectEvent(event) : undefined}
            />
          </div>)}
        </div>;
      })}
    </div>)}
  </div>;
}
