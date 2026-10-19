"use client";

import { useState } from "react";
import { Plus, Trash } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import {
  SectionBandCount,
  SectionBandHeading,
  sectionBandClass,
} from "@/components/shared/SectionBand";
import type {
  CoachingAvailabilityPayload,
  CoachingAvailabilityWindow,
} from "@/lib/coachingApi";
import { COACHING_TIME_OPTIONS } from "@/lib/coachingVisuals";

const DAYS = [
  { value: 0, label: "Pazartesi" },
  { value: 1, label: "Salı" },
  { value: 2, label: "Çarşamba" },
  { value: 3, label: "Perşembe" },
  { value: 4, label: "Cuma" },
  { value: 5, label: "Cumartesi" },
  { value: 6, label: "Pazar" },
];

const MEETING_MINUTES = 30;

function minutesOf(time: string): number {
  const [hours, minutes] = time.split(":");
  return Number(hours) * 60 + Number(minutes);
}

/**
 * Whole 30-minute meetings a window opens: 18:00–20:00 is four, and 16:20–20:00
 * is seven because the last ten minutes fit none. The backend counts the same
 * way (`apps/coaching/capacity.py`), so this is a preview, not a second rule.
 */
function meetingsIn(start: string, end: string): number {
  const length = minutesOf(end) - minutesOf(start);
  return length > 0 ? Math.floor(length / MEETING_MINUTES) : 0;
}

/** "18:00:00" from the API, "18:00" on screen. */
function clock(time: string): string {
  return time.slice(0, 5);
}

const SELECT_CLASS =
  "h-10 w-full rounded-input border border-line bg-surface px-3 text-body tabular-nums text-ink";

/**
 * Coaching availability — deliberately separate from lesson availability.
 *
 * An empty list means the tutor has no coaching slots at all; normal lesson
 * hours are never used as a fallback. The empty state says so explicitly,
 * because "I already set my lesson hours" is the obvious wrong assumption.
 *
 * Adding hours is three numbered steps, with a live line saying how many
 * meetings the chosen hours open. The week is a strip of seven day tiles, each
 * saying what it gives, because a list of bare times does not tell a tutor how
 * many students they can see. These are the tutor's own numbers, so the bands
 * are ink.
 */
export function CoachingAvailabilityEditor({
  windows,
  onCreate,
  onDelete,
  isMutating,
  error,
}: {
  windows: CoachingAvailabilityWindow[];
  onCreate: (payload: CoachingAvailabilityPayload) => void;
  onDelete: (id: string) => void;
  isMutating: boolean;
  error: string | null;
}) {
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("20:00");

  const handleAdd = (event: React.FormEvent) => {
    event.preventDefault();
    onCreate({
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
    });
  };

  const byDay = DAYS.map((day) => ({
    ...day,
    windows: windows.filter((window) => window.day_of_week === day.value),
  }));
  const weeklyMeetings = windows.reduce(
    (sum, window) => sum + meetingsIn(clock(window.start_time), clock(window.end_time)),
    0,
  );

  const chosenMeetings = meetingsIn(startTime, endTime);
  const chosenHint =
    minutesOf(endTime) <= minutesOf(startTime)
      ? "Bitiş saati başlangıçtan sonra olmalı."
      : chosenMeetings === 0
        ? "Bu aralık 30 dakikadan kısa, görüşme yeri açmaz."
        : `${startTime}–${endTime} aralığı haftada ${chosenMeetings} görüşmelik yer açar.`;

  return (
    <div className="space-y-6">
      {error ? <ErrorMessage message={error} /> : null}

      <section
        aria-labelledby="coaching-add-heading"
        className="overflow-hidden rounded-card border border-line bg-surface"
      >
        <div className={sectionBandClass("ink")}>
          <SectionBandHeading id="coaching-add-heading" title="Koçluk saatlerini ekle" />
        </div>
        <form onSubmit={handleAdd} className="px-6 pb-6 pt-5">
          <p className="text-small leading-6 text-ink-mid">
            Koçluk görüşmelerin sadece buraya eklediğin saatlerde yapılır. Normal ders saatlerin buraya geçmez.
          </p>

          <div className="mt-5 flex flex-wrap items-end gap-x-8 gap-y-5">
            <Step number={1} title="Günü seç">
              <label htmlFor="coaching-day" className="block text-label text-ink-mid">Gün</label>
              <select
                id="coaching-day"
                value={dayOfWeek}
                onChange={(event) => setDayOfWeek(Number(event.target.value))}
                className={`${SELECT_CLASS} mt-1 min-w-[10rem]`}
              >
                {DAYS.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </Step>

            <Step number={2} title="Saatleri seç">
              <div className="flex gap-3">
                <div>
                  <label htmlFor="coaching-start" className="block text-label text-ink-mid">Başlangıç</label>
                  <select
                    id="coaching-start"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                    className={`${SELECT_CLASS} mt-1 min-w-[6rem]`}
                  >
                    {COACHING_TIME_OPTIONS.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="coaching-end" className="block text-label text-ink-mid">Bitiş</label>
                  <select
                    id="coaching-end"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                    className={`${SELECT_CLASS} mt-1 min-w-[6rem]`}
                  >
                    {COACHING_TIME_OPTIONS.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>
            </Step>

            {/* The button says what it does, so this step has no heading of its
                own; it lines up with the fields beside it. */}
            <Step number={3}>
              <Button type="submit" disabled={isMutating} className="gap-2">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Saat aralığı ekle
              </Button>
            </Step>
          </div>

          <div className="mt-5 border-t border-line pt-4 text-label leading-5 text-ink-mid">
            <p aria-live="polite" className="font-medium text-ink">{chosenHint}</p>
            <p className="mt-1">
              Her görüşme 30 dakikadır. Aralıklar üst üste binemez, art arda olabilir (19:00–20:00 ve 20:00–21:00).
            </p>
          </div>
        </form>
      </section>

      <section
        aria-labelledby="coaching-week-heading"
        className="overflow-hidden rounded-card border border-line bg-surface"
      >
        <div className={sectionBandClass("ink", "flex-wrap gap-y-3")}>
          <SectionBandHeading id="coaching-week-heading" title="Haftalık koçluk planın" />
          <SectionBandCount tone="ink">Haftada {weeklyMeetings} görüşme</SectionBandCount>
        </div>
        <div className="px-6 pb-6 pt-5">
          <p className="text-small text-ink-mid">
            Haftanın her günü burada görünür. Boş günlerde koçluk görüşmesi yapılmaz.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
            {byDay.map((day) => (
              <article
                key={day.value}
                // An empty day sits on the page tone, a day with hours on white; the
                // coaching surfaces carry no dashed borders (DESIGN.md vocabulary test).
                className={`rounded-input border border-line p-3 ${day.windows.length === 0 ? "bg-paper" : "bg-surface"}`}
              >
                <h3 className="text-body font-medium text-ink">{day.label}</h3>
                {day.windows.length === 0 ? (
                  <p className="mt-2 text-small text-ink-mid">Boş</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {day.windows.map((window) => (
                      <li key={window.id} className="rounded-input border border-line bg-paper p-2">
                        <p className="text-small font-bold tabular-nums text-ink">
                          {clock(window.start_time)}–{clock(window.end_time)}
                        </p>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span className="text-label tabular-nums text-ink-mid">
                            {meetingsIn(clock(window.start_time), clock(window.end_time))} görüşme
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(window.id)}
                            disabled={isMutating}
                            className="h-8 w-8 shrink-0"
                          >
                            <Trash className="h-4 w-4" aria-hidden="true" />
                            <span className="sr-only">
                              {day.label} {clock(window.start_time)} aralığını sil
                            </span>
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {windows.length === 0 ? (
        <div className="rounded-card border border-line bg-paper px-5 py-4 text-small leading-6 text-ink-mid">
          <strong className="font-medium text-ink">Henüz koçluk müsaitliğin yok.</strong>{" "}
          Koçluk saatlerin normal ders saatlerinden ayrıdır. Müsaitlik eklemeden planını yayınlayamazsın.
        </div>
      ) : null}
    </div>
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: number;
  /** Omit when the control says what it does. */
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex gap-3 ${title ? "items-start" : "items-center"}`}>
      <span
        data-step
        className={`flex h-[1.625rem] w-[1.625rem] shrink-0 items-center justify-center rounded-pill bg-ink text-label font-bold tabular-nums text-paper ${
          title ? "mt-0.5" : ""
        }`}
      >
        {number}
      </span>
      <div>
        {title ? <p className="mb-2 text-body font-bold text-ink">{title}</p> : null}
        {children}
      </div>
    </div>
  );
}
