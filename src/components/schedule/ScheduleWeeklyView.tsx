"use client";

import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/shared/EmptyState";
import { HorizontalDayPicker } from "@/components/shared/HorizontalDayPicker";
import { cn } from "@/lib/utils";
import type { ScheduleEvent } from "@/types";
import { ScheduleEventCard } from "./ScheduleEventCard";
import { eventKey } from "./eventIdentity";
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

      {/* md+: the seven-column grid */}
      <div className="hidden overflow-x-auto pb-1 md:block">
        <div className="grid min-w-[820px] grid-cols-7 gap-1.5 lg:min-w-[980px] lg:gap-2">
          {days.map((date, index) => {
            const dayEvents = eventsForDay(date);
            const isToday = isSameDay(date, today);
            return (
              // A labelled landmark per day: without it a screen reader reads
              // the week as one long list of cards with no way to tell where
              // Tuesday ends and Wednesday begins.
              <section
                key={toDateKey(date)}
                aria-label={longDayLabel(date)}
                className={cn(
                  "min-h-[15rem] rounded-card border bg-surface p-1.5 lg:p-2",
                  isToday && "border-brand-300 bg-brand-50/40 dark:bg-brand-900/20"
                )}
              >
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="text-xs font-semibold text-ink-mid">
                    {WEEKDAY_LABELS[index]}
                  </span>
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                      isToday && "bg-pink text-white"
                    )}
                  >
                    {date.getDate()}
                  </span>
                </div>
                {dayEvents.length === 0 ? (
                  <p className="pt-6 text-center text-[11px] text-ink-mid">
                    Boş
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {dayEvents.map((event) => (
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
                )}
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
