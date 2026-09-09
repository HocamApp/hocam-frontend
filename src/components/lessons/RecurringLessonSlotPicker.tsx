"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { fetchTutorRecurringSlots } from "@/lib/lessonsApi";
import { cn } from "@/lib/utils";
import type { Subject, TutorRecurringSlotCandidate } from "@/types";
import { SlotPickerFrame, SlotStripSkeleton, type SlotPickerTutor } from "./SlotPickerFrame";
import { endTimeLabel, weekdayLabel } from "./slotPickerFormat";

export type { SlotPickerTutor };

export interface RecurringSelection {
  day_of_week: number;
  /** "HH:MM", Istanbul */
  start_time: string;
}

interface RecurringLessonSlotPickerProps {
  tutor: SlotPickerTutor;
  durationMinutes: number;
  /** Package term in days: 14, 30, 90 or 180. */
  termDays: number;
  /** How many weekly slots the plan includes, i.e. lessons per week. */
  requiredCount: number;
  subjects?: Subject[];
  selectedSubjectId?: string;
  onSubjectChange?: (subjectId: string) => void;
  value: RecurringSelection[];
  onChange: (value: RecurringSelection[]) => void;
  priceLabel: string;
  enabled?: boolean;
}

const WEEKDAY_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function sameSlot(a: RecurringSelection, b: RecurringSelection): boolean {
  return a.day_of_week === b.day_of_week && a.start_time === b.start_time;
}

/**
 * Pick the weekly rhythm a lesson package runs on.
 *
 * The question here is not "is 11 September at 13:00 free" but "is Thursday
 * at 13:00 free, week after week for three months", so the day axis is the
 * seven weekdays rather than a calendar. Each candidate carries how many of
 * its weeks are actually open, and a candidate with a few taken weeks is
 * still offered: over a 90-day term, hiding a slot because one Tuesday has a
 * coaching session on it would leave almost nothing to choose from. The weeks
 * that clash are booked by hand later, and their credits are not spent.
 *
 * Times are Istanbul wall clock strings throughout, never instants.
 */
export function RecurringLessonSlotPicker({
  tutor,
  durationMinutes,
  termDays,
  requiredCount,
  subjects,
  selectedSubjectId,
  onSubjectChange,
  value,
  onChange,
  priceLabel,
  enabled = true,
}: RecurringLessonSlotPickerProps) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["tutor-recurring-slots", tutor.id, termDays, durationMinutes],
    queryFn: () => fetchTutorRecurringSlots(tutor.id, { termDays, durationMinutes }),
    enabled: enabled && Boolean(tutor.id),
  });

  // Only hours that are open EVERY week of the lookahead. The per-slot
  // "12 of 13 weeks free" line is gone, and without it a slot open three weeks
  // out of thirteen would look identical to one open all thirteen. Offering
  // only the fully-free ones is what makes the silence honest. Weeks that fill
  // up later are skipped at activation and keep their lesson credit.
  const candidates = useMemo(
    () =>
      (data?.candidates ?? []).filter(
        (candidate) => candidate.free_occurrences === candidate.total_occurrences
      ),
    [data]
  );

  const byWeekday = useMemo(() => {
    const grouped = new Map<number, TutorRecurringSlotCandidate[]>();
    for (const candidate of candidates) {
      const list = grouped.get(candidate.day_of_week) ?? [];
      list.push(candidate);
      grouped.set(candidate.day_of_week, list);
    }
    return grouped;
  }, [candidates]);

  // Drop anything the server no longer offers. The term or the lesson count
  // can change on the step after this one, and a schedule that quietly kept a
  // slot the tutor has since filled would be refused at checkout with nothing
  // on screen explaining why.
  useEffect(() => {
    if (candidates.length === 0) return;
    const offered = new Set(
      candidates.map((candidate) => `${candidate.day_of_week}|${candidate.start_time}`)
    );
    const kept = value.filter((slot) => offered.has(`${slot.day_of_week}|${slot.start_time}`));
    if (kept.length !== value.length) onChange(kept);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidates]);

  // Which weekday the time grid is showing. Its own state, not derived from
  // the selection: deriving it meant a weekday card had to select something in
  // order to change the view, so merely looking at Thursday silently booked
  // Thursday's first hour and the student had to undo it.
  const [activeWeekday, setActiveWeekday] = useState<number | null>(null);

  const firstOfferedWeekday =
    byWeekday.size > 0 ? Math.min(...Array.from(byWeekday.keys())) : null;

  // Fall back when the day being shown has nothing to show: on first load, and
  // whenever a refetch empties the weekday the student was looking at.
  useEffect(() => {
    if (activeWeekday !== null && byWeekday.has(activeWeekday)) return;
    setActiveWeekday(value[0]?.day_of_week ?? firstOfferedWeekday);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [byWeekday, firstOfferedWeekday]);

  const toggle = (candidate: TutorRecurringSlotCandidate) => {
    const slot = {
      day_of_week: candidate.day_of_week,
      start_time: candidate.start_time,
    };
    const existing = value.find((entry) => sameSlot(entry, slot));
    if (existing) {
      onChange(value.filter((entry) => !sameSlot(entry, slot)));
      return;
    }
    if (value.length >= requiredCount) return;
    onChange([...value, slot]);
  };

  const remaining = requiredCount - value.length;

  return (
    <SlotPickerFrame
      tutor={tutor}
      durationMinutes={durationMinutes}
      subjects={subjects}
      selectedSubjectId={selectedSubjectId}
      onSubjectChange={onSubjectChange}
      priceLabel={priceLabel}
      note="Seçtiğin saatler paket boyunca her hafta tekrar eder."
    >
      <>
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-label uppercase tracking-[0.08em] text-ink-mid">Gün seç</p>
          <p className="text-[0.8125rem] tabular-nums text-ink-mid">
            {value.length} / {requiredCount} saat seçildi
          </p>
        </div>

        {isError ? (
          <div role="alert" className="mt-3 space-y-3 rounded-card border border-line p-4">
            <p className="text-[0.875rem] text-error">
              Müsait saatler alınamadı. Program seçebilmek için tekrar dene.
            </p>
            <Button type="button" variant="outline" onClick={() => void refetch()}>
              Tekrar dene
            </Button>
          </div>
        ) : isLoading ? (
          <SlotStripSkeleton />
        ) : candidates.length === 0 ? (
          <p className="mt-3 text-[0.875rem] text-ink-mid">
            Bu hoca bu paket süresi boyunca haftalık tekrar eden bir saat sunmuyor.
            Daha kısa bir paket süresi dene ya da hocaya mesaj gönder.
          </p>
        ) : (
          <>
            {/* Seven fixed columns rather than a scrolling strip: there are
                exactly seven weekdays, and a strip that needs a trackpad
                swipe hides some of them from anyone using a mouse. */}
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
              {WEEKDAY_SHORT.map((label, weekday) => {
                const open = byWeekday.get(weekday)?.length ?? 0;
                const chosen = value.filter((slot) => slot.day_of_week === weekday).length;
                const active = weekday === activeWeekday;
                return (
                  <button
                    key={weekday}
                    type="button"
                    disabled={open === 0}
                    aria-pressed={active}
                    onClick={() => setActiveWeekday(weekday)}
                    className={cn(
                      "min-w-0 rounded-input border px-2 py-2 text-center transition-colors duration-[120ms]",
                      open === 0 && "cursor-not-allowed border-line text-ink-mid opacity-60",
                      // A border, not a solid ink block: this says which day is
                      // on screen, not which hour was picked.
                      open > 0 && "bg-success-soft text-ink",
                      open > 0 && !active && "border-line hover:border-ink",
                      open > 0 && active && "border-ink"
                    )}
                  >
                    <span className="block text-[0.75rem]">{label}</span>
                    <span
                      className="block text-[0.6875rem] tabular-nums text-ink-mid"
                    >
                      {open === 0 ? "Müsait değil" : `${open} saat`}
                    </span>
                    {chosen > 0 && (
                      <span
                        className="mt-0.5 block text-[0.6875rem] tabular-nums text-pink"
                      >
                        {chosen} seçili
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {activeWeekday !== null && (
              <div className="mt-5 min-w-0">
                <p className="text-label uppercase tracking-[0.08em] text-ink-mid">
                  Her {weekdayLabel(activeWeekday)} saatleri
                </p>
                <div className="mt-3 grid min-w-0 grid-cols-[repeat(auto-fit,minmax(7rem,1fr))] gap-2">
                  {(byWeekday.get(activeWeekday) ?? []).map((candidate) => {
                    const slot = {
                      day_of_week: candidate.day_of_week,
                      start_time: candidate.start_time,
                    };
                    const active = value.some((entry) => sameSlot(entry, slot));
                    const disabled = !active && remaining <= 0;
                    return (
                      <button
                        key={`${candidate.day_of_week}-${candidate.start_time}`}
                        type="button"
                        aria-pressed={active}
                        disabled={disabled}
                        onClick={() => toggle(candidate)}
                        className={cn(
                          "w-full min-w-0 rounded-input border px-3 py-2 text-left transition-colors duration-[120ms]",
                          active
                            ? "border-pink bg-pink text-white"
                            : disabled
                              ? "cursor-not-allowed border-line text-ink-mid opacity-60"
                              : "border-line text-ink hover:border-ink"
                        )}
                      >
                        <span className="block text-[0.875rem] tabular-nums">
                          {candidate.start_time} –{" "}
                          {endTimeLabel(candidate.start_time, durationMinutes)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {value.length > 0 && (
              <div className="mt-5 min-w-0">
                <p className="text-label uppercase tracking-[0.08em] text-ink-mid">
                  Haftalık programın
                </p>
                <ul className="mt-2 space-y-1.5">
                  {[...value]
                    .sort(
                      (a, b) =>
                        a.day_of_week - b.day_of_week ||
                        a.start_time.localeCompare(b.start_time)
                    )
                    .map((slot) => (
                      <li
                        key={`${slot.day_of_week}-${slot.start_time}`}
                        className="flex items-center justify-between gap-3 rounded-input border border-line px-3 py-2 text-[0.875rem]"
                      >
                        <span className="min-w-0 truncate text-ink">
                          Her {weekdayLabel(slot.day_of_week)}{" "}
                          <span className="tabular-nums">
                            {slot.start_time} –{" "}
                            {endTimeLabel(slot.start_time, durationMinutes)}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onChange(value.filter((entry) => !sameSlot(entry, slot)))
                          }
                          className="shrink-0 text-[0.8125rem] text-ink-mid transition-colors duration-[120ms] hover:text-ink"
                        >
                          Kaldır
                        </button>
                      </li>
                    ))}
                </ul>
                {remaining > 0 && (
                  <p className="mt-2 text-[0.8125rem] text-ink-mid">
                    {remaining} saat daha seç.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </>
    </SlotPickerFrame>
  );
}
