"use client";

import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/shared/EmptyState";
import { HorizontalDayPicker } from "@/components/shared/HorizontalDayPicker";
import { cn } from "@/lib/utils";
import type { ScheduleEvent } from "@/types";
import { ScheduleEventCard } from "./ScheduleEventCard";
import { HOUR_ROW_HEIGHT } from "./ScheduleDailyView";
import { eventKey } from "./eventIdentity";
import {
  WEEKDAY_LABELS,
  isSameDay,
  longDayLabel,
  timeToMinutes,
  toDateKey,
  visibleHourWindow,
  weekDays,
} from "./scheduleDates";

interface ScheduleWeeklyViewProps {
  anchor: Date;
  events: ScheduleEvent[];
  pendingKeys: Set<string>;
  onToggleCompleted: (event: ScheduleEvent, completed: boolean) => void;
  onEdit: (event: ScheduleEvent) => void;
  onDelete: (event: ScheduleEvent) => void;
}

/**
 * Seven columns on md+, a day picker plus one day's list on mobile — the same
 * shape `TutorWeeklySchedule` already uses, so the two weekly surfaces in the
 * app behave the same way.
 */
export function ScheduleWeeklyView({
  anchor,
  events,
  pendingKeys,
  onToggleCompleted,
  onEdit,
  onDelete,
}: ScheduleWeeklyViewProps) {
  const days = useMemo(() => weekDays(anchor), [anchor]);
  const today = new Date();

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

  const eventsForDay = (date: Date) => byDay.get(toDateKey(date)) ?? [];

  const todayIndex = days.findIndex((date) => isSameDay(date, today));
  const [selectedDayIndex, setSelectedDayIndex] = useState(
    todayIndex >= 0 ? todayIndex : 0
  );

  // Paging to another week must not leave the mobile picker pointing at a day
  // that is no longer in view.
  useEffect(() => {
    setSelectedDayIndex(todayIndex >= 0 ? todayIndex : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the week, not the index
  }, [toDateKey(days[0])]);

  const selectedDate = days[selectedDayIndex] ?? days[0];
  const selectedEvents = eventsForDay(selectedDate);
  const { start, end } = useMemo(() => visibleHourWindow(events), [events]);
  // One row per hour, so a card sits between two rules rather than across one.
  const hours = Array.from({ length: end - start }, (_, index) => start + index);

  const eventsForCell = (date: Date, hour: number) =>
    eventsForDay(date).filter(
      (event) => Math.floor(timeToMinutes(event.local_time) / 60) === hour
    );

  // Seven cells each saying "Boş" is not an empty state, it is the same word
  // seven times. One message when the whole week is empty; per-day "Boş" only
  // when other days do have something.
  if (events.length === 0) {
    return (
      <EmptyState
        title="Bu hafta boş görünüyor"
        description="Bu hafta için planlanmış ders, koçluk ya da çalışma yok. “+ Çalışma Ekle” ile kendi bloklarını ekleyebilirsin."
      />
    );
  }

  return (
    <>
      {/* Mobile: day picker + selected day */}
      <div className="md:hidden">
        <HorizontalDayPicker
          dates={days}
          selectedIndex={selectedDayIndex}
          onSelect={setSelectedDayIndex}
          getCount={(date) => eventsForDay(date).length}
        />
        <p className="mb-2 mt-3 text-xs font-medium text-ink-mid">
          {longDayLabel(selectedDate)}
        </p>
        {selectedEvents.length === 0 ? (
          <p className="rounded-card border border-line p-4 text-center text-xs text-ink-mid">
            Bu gün boş.
          </p>
        ) : (
          <div className="space-y-2">
            {selectedEvents.map((event) => (
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
        )}
      </div>

      {/* md+: the seven-day grid, one row per hour. Lessons stay read-only
          cards; only personal study blocks expose their controls. */}
      <div className="hidden overflow-x-auto pb-1 md:block">
        <div className="min-w-[980px] overflow-hidden rounded-card border border-line bg-surface">
          <div className="grid grid-cols-[4rem_repeat(7,minmax(0,1fr))] border-b border-line bg-paper/55">
            <div aria-hidden />
            {days.map((date, index) => {
              const isToday = isSameDay(date, today);
              return (
                <div
                  key={toDateKey(date)}
                  role="columnheader"
                  // The column header carries the full date, so a screen
                  // reader can tell Tuesday's cells from Wednesday's.
                  aria-label={longDayLabel(date)}
                  className="flex min-h-14 items-center justify-center gap-2 border-l border-line px-2"
                >
                  <span className="text-xs font-semibold text-ink-mid">
                    {WEEKDAY_LABELS[index]}
                  </span>
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                      isToday && "bg-pink text-white"
                    )}
                  >
                    {date.getDate()}
                  </span>
                </div>
              );
            })}
          </div>

          <div
            role="grid"
            aria-label="Haftalık takvim"
            className="max-h-[66vh] overflow-y-auto"
          >
            {hours.map((hour) => (
              <div
                key={hour}
                role="row"
                className="grid grid-cols-[4rem_repeat(7,minmax(0,1fr))] border-b border-line last:border-b-0"
              >
                <div className="p-1 text-right text-[10px] tabular-nums text-ink-mid">
                  {String(hour).padStart(2, "0")}:00
                </div>
                {days.map((date) => {
                  const cellEvents = eventsForCell(date, hour);
                  const isToday = isSameDay(date, today);
                  return (
                    <div
                      key={`${toDateKey(date)}-${hour}`}
                      role="gridcell"
                      style={{ minHeight: HOUR_ROW_HEIGHT }}
                      className={cn(
                        "space-y-1 border-l border-line p-1",
                        isToday && "bg-brand-50/35 dark:bg-brand-900/10"
                      )}
                    >
                      {cellEvents.map((event) => (
                        <ScheduleEventCard
                          key={`${event.source}-${event.id}-${event.occurrence_date ?? ""}`}
                          event={event}
                          density="compact"
                          pending={pendingKeys.has(eventKey(event))}
                          onToggleCompleted={onToggleCompleted}
                          onEdit={onEdit}
                          onDelete={onDelete}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

    </>
  );
}
