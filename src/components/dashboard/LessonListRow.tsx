import type { ReactNode } from "react";

import { ParticipantAvatar } from "@/components/messaging/ParticipantAvatar";
import { bookingDateParts } from "@/lib/bookingTime";
import type { Booking } from "@/types";

export function lessonTutorName(booking: Booking): string {
  return booking.tutor.name
    ? `${booking.tutor.name} ${booking.tutor.surname}`.trim()
    : "Hoca bilgisi bekleniyor";
}

/**
 * Weekday, the day number set large, and the month: the anchor of a lesson row.
 *
 * Time and year do not live here. "Ekim · 18:30" is wider than the column and
 * a column that grows per row breaks the rhythm down the list, so they ride
 * on the tutor line as `meta`.
 */
function LessonDateColumn({
  startTime,
  relativeLabel,
  muted,
}: {
  startTime: string;
  /** "Bugün" / "Yarın" replaces the weekday when the lesson is that close. */
  relativeLabel?: string;
  muted?: boolean;
}) {
  const parts = bookingDateParts(startTime);
  if (!parts) return <div aria-hidden="true" />;
  return (
    <div className="leading-tight">
      <p className="text-label text-ink-mid">{relativeLabel ?? parts.weekday}</p>
      {/* A template string, not cn(): tailwind-merge reads the custom size
          `text-h2-m` as a colour and would drop it in favour of the colour. */}
      <p
        className={`text-h2-m font-bold tabular-nums ${muted ? "text-ink-mid" : "text-ink"}`}
      >
        {parts.day}
      </p>
      <p className="text-label text-ink-mid">{parts.month}</p>
    </div>
  );
}

/**
 * One lesson in a dashboard list. Upcoming, past and cancelled lessons share
 * this row so three cards stacked on one page read as one system; they differ
 * only in what they pass in.
 */
export function LessonListRow({
  booking,
  chip,
  explanation,
  meta,
  relativeLabel,
  muted,
  aside,
}: {
  booking: Booking;
  chip?: ReactNode;
  explanation?: string;
  /** Appended to the tutor's name: the time of a coming lesson, the year of an old one. */
  meta?: string;
  relativeLabel?: string;
  /** Records: the day number steps back to --ink-mid. */
  muted?: boolean;
  /** Right-hand slot (cancel, open materials). Drops under the text on a phone. */
  aside?: ReactNode;
}) {
  const name = lessonTutorName(booking);
  return (
    <div className="grid grid-cols-[3rem_minmax(0,1fr)] gap-x-4 gap-y-2 py-5 sm:grid-cols-[4rem_minmax(0,1fr)_auto]">
      <LessonDateColumn
        startTime={booking.start_time}
        relativeLabel={relativeLabel}
        muted={muted}
      />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="truncate text-body font-medium text-ink">
            {booking.subject.name}
          </p>
          {chip}
        </div>
        <div className="mt-1.5 flex min-w-0 items-center gap-2">
          <ParticipantAvatar
            name={name}
            avatarUrl={booking.tutor.profile_picture}
            className="h-8 w-8 border border-line"
            fallbackClassName="text-[0.8125rem]"
          />
          {/* Wraps rather than truncates: on a 320px phone the lesson time is the
              part that would be cut off. */}
          <p className="min-w-0 text-small text-ink-mid">
            {name}
            {meta ? ` · ${meta}` : ""}
          </p>
        </div>
        {explanation && (
          <p className="mt-2 text-small text-ink-mid">{explanation}</p>
        )}
      </div>
      {/* The ghost button carries 22px of its own padding; on a phone, where
          this sits under the text, pull it back so the label lines up with it. */}
      {aside && (
        <div className="col-start-2 -ml-[22px] sm:col-start-auto sm:ml-0 sm:self-start sm:text-right">
          {aside}
        </div>
      )}
    </div>
  );
}
