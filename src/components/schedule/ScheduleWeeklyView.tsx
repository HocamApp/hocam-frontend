"use client";

import { useEffect, useMemo, useState } from "react";

import { HorizontalDayPicker } from "@/components/shared/HorizontalDayPicker";
import { cn } from "@/lib/utils";
import type { ScheduleEvent } from "@/types";
import { ScheduleEventCard } from "./ScheduleEventCard";
import {
  WEEKDAY_LABELS,
  isSameDay,
  longDayLabel,
  timeToMinutes,
  toDateKey,
  weekDays,
} from "./scheduleDates";

interface ScheduleWeeklyViewProps {
  anchor: Date;
  events: ScheduleEvent[];
  pendingIds: Set<string>;
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
  pendingIds,
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
        <p className="mb-2 mt-3 text-xs font-medium text-muted-foreground">
          {longDayLabel(selectedDate)}
        </p>
        {selectedEvents.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">
            Bu gün boş.
          </p>
        ) : (
          <div className="space-y-2">
            {selectedEvents.map((event) => (
              <ScheduleEventCard
                key={`${event.source}-${event.id}-${event.occurrence_date ?? ""}`}
                event={event}
                pending={pendingIds.has(event.id)}
                onToggleCompleted={onToggleCompleted}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* md+: the seven-column grid */}
      <div className="hidden overflow-x-auto pb-1 md:block">
        <div className="grid grid-cols-7 gap-2 lg:min-w-[880px]">
          {days.map((date, index) => {
            const dayEvents = eventsForDay(date);
            const isToday = isSameDay(date, today);
            return (
              <div
                key={toDateKey(date)}
                className={cn(
                  "min-h-[15rem] rounded-2xl border bg-card p-2",
                  isToday && "border-brand-300 bg-brand-50/40 dark:bg-brand-900/20"
                )}
              >
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {WEEKDAY_LABELS[index]}
                  </span>
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                      isToday && "bg-brand-500 text-white"
                    )}
                  >
                    {date.getDate()}
                  </span>
                </div>
                {dayEvents.length === 0 ? (
                  <p className="pt-6 text-center text-[11px] text-muted-foreground">
                    Boş
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {dayEvents.map((event) => (
                      <ScheduleEventCard
                        key={`${event.source}-${event.id}-${event.occurrence_date ?? ""}`}
                        event={event}
                        density="compact"
                        pending={pendingIds.has(event.id)}
                        onToggleCompleted={onToggleCompleted}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
