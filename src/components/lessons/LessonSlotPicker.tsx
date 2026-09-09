"use client";

import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarBlank, Clock, GlobeSimple, VideoCamera } from "@phosphor-icons/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { fetchTutorSlots } from "@/lib/lessonsApi";
import { cn } from "@/lib/utils";
import type { Subject, TutorSlotDay } from "@/types";
import {
  addDays,
  dayOfMonth,
  endTimeLabel,
  istanbulToday,
  longDateLabel,
  monthLabel,
  shortWeekdayLabel,
} from "./slotPickerFormat";

export interface SlotSelection {
  /** YYYY-MM-DD, Istanbul */
  date: string;
  /** HH:MM, Istanbul */
  time: string;
}

export interface SlotPickerTutor {
  id: string;
  name: string;
  surname: string;
  university?: string | null;
  profile_picture?: string | null;
}

interface LessonSlotPickerProps {
  tutor: SlotPickerTutor;
  durationMinutes: number;
  /** How far ahead to offer. The API caps a single request at 60 days. */
  rangeDays?: number;
  subjects?: Subject[];
  selectedSubjectId?: string;
  onSubjectChange?: (subjectId: string) => void;
  value: SlotSelection | null;
  onChange: (value: SlotSelection | null) => void;
  /** What this lesson costs the student: a price, a package credit, a trial. */
  priceLabel: string;
  /** One line under the meta list. The trial's "no payment needed" note. */
  note?: string;
  /** Shown above the tutor, e.g. "Ücretsiz Deneme Dersi". */
  eyebrow?: string;
  enabled?: boolean;
}

const DEFAULT_RANGE_DAYS = 14;

function initials(name: string, surname: string): string {
  return ((name?.trim()[0] ?? "") + (surname?.trim()[0] ?? "")).toUpperCase() || "?";
}

/**
 * Pick one lesson: a day, then a time.
 *
 * Two things distinguish this from the three-step wizard it replaces. The
 * slot list comes from the server (`GET /tutors/<id>/slots/`), so it accounts
 * for the tutor's private time off and coaching sessions rather than only
 * their lessons — the browser could never see those, and offered slots the
 * API then refused. And every day in the window is shown with how many starts
 * it has left, so a student can see where the tutor is open without clicking
 * through empty days.
 *
 * All times are Istanbul wall clock and are handled as strings throughout.
 * They are not instants; see `slotPickerFormat.ts`.
 */
export function LessonSlotPicker({
  tutor,
  durationMinutes,
  rangeDays = DEFAULT_RANGE_DAYS,
  subjects,
  selectedSubjectId,
  onSubjectChange,
  value,
  onChange,
  priceLabel,
  note,
  eyebrow,
  enabled = true,
}: LessonSlotPickerProps) {
  const start = useMemo(() => istanbulToday(), []);
  const end = useMemo(() => addDays(start, rangeDays - 1), [start, rangeDays]);

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["tutor-slots", tutor.id, start, end, durationMinutes],
    queryFn: () => fetchTutorSlots(tutor.id, { start, end, durationMinutes }),
    enabled: enabled && Boolean(tutor.id),
  });

  const days: TutorSlotDay[] = data?.days ?? [];
  const selectedDay = days.find((day) => day.date === value?.date) ?? null;
  const firstOpenDay = days.find((day) => day.slots.length > 0) ?? null;

  // Reconcile the selection against the list that is actually in hand. Slots
  // are taken by other students while this is open, and a refetch can drop the
  // one already chosen; leaving it selected would let the student submit a
  // time the API will refuse.
  useEffect(() => {
    if (!value || days.length === 0) return;
    const day = days.find((entry) => entry.date === value.date);
    if (!day || !day.slots.includes(value.time)) {
      onChange(day ? { date: value.date, time: "" } as SlotSelection : null);
    }
    // `onChange` is a prop the caller may redefine each render; depending on it
    // would re-run this on every render rather than when the data changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, value?.date, value?.time]);

  const activeDate = value?.date ?? firstOpenDay?.date ?? days[0]?.date ?? null;
  const activeDay = days.find((day) => day.date === activeDate) ?? null;

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
      <aside className="min-w-0 space-y-5">
        {eyebrow && (
          <p className="text-label uppercase tracking-[0.08em] text-pink">{eyebrow}</p>
        )}

        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-11 w-11">
            <AvatarImage
              src={tutor.profile_picture || undefined}
              alt={`${tutor.name} ${tutor.surname}`}
            />
            <AvatarFallback className="bg-ink text-white">
              {initials(tutor.name, tutor.surname)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">
              {tutor.name} {tutor.surname}
            </p>
            {tutor.university && (
              <p className="truncate text-[0.8125rem] text-ink-mid">{tutor.university}</p>
            )}
          </div>
        </div>

        {subjects && subjects.length > 0 && (
          <div className="min-w-0">
            <p className="text-label text-ink-mid">Ders konusu</p>
            {/* Stacked full-width rather than wrapped pills: a subject name
                here can run to a dozen words ("AYT İleri Düzey Kalkülüs ve
                Diferansiyel Denklemler..."), and as a pill that either
                overflows the column or wraps into an unreadable block. */}
            <div className="mt-2 flex flex-col gap-2">
              {subjects.map((subject) => {
                const active = String(subject.id) === selectedSubjectId;
                return (
                  <button
                    key={String(subject.id)}
                    type="button"
                    aria-pressed={active}
                    title={`${subject.name} ${subject.exam_type}`}
                    onClick={() => onSubjectChange?.(String(subject.id))}
                    className={cn(
                      "flex w-full min-w-0 items-center gap-2 overflow-hidden rounded-input border px-3 py-2 text-left text-[0.8125rem] transition-colors duration-[120ms]",
                      active
                        ? "border-ink bg-ink text-white"
                        : "border-line text-ink hover:border-ink"
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">{subject.name}</span>
                    <span
                      className={cn(
                        "shrink-0 text-[0.6875rem]",
                        active ? "text-white/70" : "text-ink-mid"
                      )}
                    >
                      {subject.exam_type}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <dl className="space-y-2.5 text-[0.875rem] text-ink">
          <MetaRow icon={<Clock size={16} weight="regular" />} label={`${durationMinutes} dakika`} />
          <MetaRow icon={<VideoCamera size={16} weight="regular" />} label="Görüntülü ders" />
          <MetaRow icon={<GlobeSimple size={16} weight="regular" />} label="İstanbul saati" />
          <MetaRow
            icon={<CalendarBlank size={16} weight="regular" />}
            label={priceLabel}
          />
        </dl>

        {note && <p className="text-[0.8125rem] leading-relaxed text-ink-mid">{note}</p>}
      </aside>

      <div className="min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-label uppercase tracking-[0.08em] text-ink-mid">Gün seç</p>
          {activeDate && (
            <p className="text-[0.8125rem] tabular-nums text-ink-mid">{monthLabel(activeDate)}</p>
          )}
        </div>

        {isError ? (
          <div role="alert" className="mt-3 space-y-3 rounded-card border border-line p-4">
            <p className="text-[0.875rem] text-error">
              Müsait saatler alınamadı. Saat seçebilmek için tekrar dene.
            </p>
            <Button type="button" variant="outline" onClick={() => void refetch()}>
              Tekrar dene
            </Button>
          </div>
        ) : isLoading ? (
          <DayStripSkeleton />
        ) : days.length === 0 ? (
          <p className="mt-3 text-[0.875rem] text-ink-mid">
            Bu hoca önümüzdeki {rangeDays} gün için müsaitlik eklememiş.
          </p>
        ) : (
          <div className="mt-3 -mr-4 flex max-w-full gap-2 overflow-x-auto overscroll-x-contain pb-2 pr-4">
            {days.map((day) => {
              const open = day.slots.length;
              const active = day.date === activeDate;
              return (
                <button
                  key={day.date}
                  type="button"
                  disabled={open === 0}
                  aria-pressed={active}
                  onClick={() => onChange({ date: day.date, time: "" })}
                  className={cn(
                    "w-[4.5rem] shrink-0 rounded-input border px-2 py-2 text-center transition-colors duration-[120ms]",
                    open === 0 && "cursor-not-allowed border-line text-ink-mid opacity-60",
                    open > 0 && !active && "border-line bg-success-soft text-ink hover:border-ink",
                    active && "border-ink bg-ink text-white"
                  )}
                >
                  <span className="block text-[0.75rem]">{shortWeekdayLabel(day.date)}</span>
                  <span className="block text-[1rem] font-medium tabular-nums">
                    {dayOfMonth(day.date)}
                  </span>
                  <span
                    className={cn(
                      "block text-[0.6875rem] tabular-nums",
                      active ? "text-white/70" : "text-ink-mid"
                    )}
                  >
                    {open === 0 ? "Dolu" : `${open} boş`}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {activeDay && (
          <div className="mt-5 min-w-0">
            <p className="text-label uppercase tracking-[0.08em] text-ink-mid">
              {longDateLabel(activeDay.date)} saatleri
            </p>
            {activeDay.slots.length === 0 ? (
              <p className="mt-3 text-[0.875rem] text-ink-mid">
                Bu tarihte müsait saat yok. Yukarıdan başka bir gün seç.
              </p>
            ) : (
              <div className="mt-3 grid min-w-0 grid-cols-[repeat(auto-fit,minmax(5.5rem,1fr))] gap-2">
                {activeDay.slots.map((slot) => {
                  const active = value?.date === activeDay.date && value.time === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      aria-pressed={active}
                      disabled={isFetching}
                      onClick={() => onChange({ date: activeDay.date, time: slot })}
                      className={cn(
                        "w-full min-w-0 rounded-pill border px-3 py-2 text-[0.875rem] tabular-nums transition-colors duration-[120ms]",
                        active
                          ? "border-pink bg-pink text-white"
                          : "border-line text-ink hover:border-ink"
                      )}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {value?.time && (
          <p className="mt-5 text-[0.875rem] tabular-nums text-ink">
            {longDateLabel(value.date)} · {value.time} – {endTimeLabel(value.time, durationMinutes)}
          </p>
        )}
      </div>
    </div>
  );
}

function MetaRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 text-ink-mid" aria-hidden>
        {icon}
      </span>
      <span className="min-w-0 break-words">{label}</span>
    </div>
  );
}

function DayStripSkeleton() {
  return (
    <div className="mt-3 flex gap-2" aria-hidden>
      {Array.from({ length: 7 }, (_, index) => (
        <div
          key={index}
          className="h-[4.25rem] w-[4.5rem] shrink-0 animate-pulse rounded-input bg-skeleton"
        />
      ))}
    </div>
  );
}
