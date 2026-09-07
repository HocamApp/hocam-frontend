/**
 * The single place the app turns a `lessons.Booking` timestamp into something
 * a user reads.
 *
 * ## The storage convention
 *
 * `Booking.start_time` / `Booking.end_time` contain an **Istanbul wall clock
 * mislabeled as UTC**. A lesson the student picked as 18:00 Istanbul is stored,
 * and served, as `2026-09-09T18:00:00Z`. That instant is not the lesson's real
 * instant — the trailing `Z` is a lie inherited from how the value is written:
 *
 *   1. `BookingModal` posts a naive local ISO string with no offset
 *      (`"2026-09-09T18:00:00"`).
 *   2. Django (`USE_TZ=True`, `TIME_ZONE="UTC"`) makes that naive value aware
 *      *as UTC*, so the wall clock survives verbatim and the label is wrong.
 *   3. The availability validator in `apps/lessons/serializers.py` then compares
 *      `start_time.time()` / `.weekday()` straight against Istanbul-local
 *      `AvailabilityRule` rows — which only works because the wall clock is
 *      preserved.
 *
 * So `new Date(booking.start_time)` is **wrong**: it reads the `Z` at face
 * value and renders 21:00 for an 18:00 lesson. Use the helpers here instead.
 *
 * The backend documents and pins the same convention in
 * `apps/schedule/timezones.py` (`booking_local_slot`),
 * `apps/lessons/busy.py` (`booking_instant`) and
 * `apps/schedule/tests_time_convention.py`. If lessons storage is ever migrated
 * to true UTC, this module and those files must change together.
 *
 * ## Why a fixed +03:00 offset is safe
 *
 * Turkey has been on permanent UTC+3 with no DST since September 2016, so a
 * booking wall clock maps to exactly one instant. Parsing with a literal
 * `+03:00` and formatting with `timeZone: "Europe/Istanbul"` also makes every
 * label independent of the machine's own timezone — a developer in UTC and a
 * student in Istanbul render the same string.
 *
 * Do NOT use these helpers for coaching times: `CoachingSession.scheduled_start`
 * is a true UTC instant and additionally denormalizes its own
 * `scheduled_local_date` / `scheduled_local_time`.
 */

import { serverNow } from "./serverClock";

/** Istanbul's fixed offset. Turkey dropped DST in 2016. */
const ISTANBUL_OFFSET = "+03:00";

const WALL_CLOCK = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::(\d{2}))?/;

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  hour: "2-digit",
  minute: "2-digit",
});

const dateTimeFormatter = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "long",
  weekday: "long",
  hour: "2-digit",
  minute: "2-digit",
});

const shortDateFormatter = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "long",
});

/**
 * The real instant (epoch ms) a booking's stored wall clock refers to.
 * `NaN` when the value is not a booking timestamp.
 */
export function bookingInstant(value: string): number {
  const wallTime = value.match(WALL_CLOCK);
  if (!wallTime) return NaN;
  return Date.parse(
    `${wallTime[1]}T${wallTime[2]}:${wallTime[3] ?? "00"}${ISTANBUL_OFFSET}`
  );
}

/** "9 Eylül 2026" — the lesson's Istanbul calendar day. */
export function bookingDateLabel(value: string): string {
  const instant = bookingInstant(value);
  return Number.isFinite(instant)
    ? dateFormatter.format(instant)
    : "Tarih bilgisi alınamadı";
}

/** "9 Eylül" — same day, without the year, for dense cards. */
export function bookingShortDateLabel(value: string): string {
  const instant = bookingInstant(value);
  return Number.isFinite(instant)
    ? shortDateFormatter.format(instant)
    : "Tarih bilgisi alınamadı";
}

/**
 * "18:00", or "18:00 – 18:40" when a duration in minutes is supplied.
 * The lesson's Istanbul wall clock, whatever timezone the browser is in.
 */
export function bookingTimeLabel(value: string, duration?: number): string {
  const instant = bookingInstant(value);
  if (!Number.isFinite(instant)) return "Saat bilgisi alınamadı";
  return (
    timeFormatter.format(instant) +
    (duration ? ` – ${timeFormatter.format(instant + duration * 60_000)}` : "")
  );
}

/**
 * "18:00 – 18:40" from an explicit end timestamp rather than a duration.
 * Falls back to the start alone when `endValue` is missing or unparseable.
 */
export function bookingTimeRangeLabel(value: string, endValue?: string): string {
  const start = bookingInstant(value);
  if (!Number.isFinite(start)) return "Saat bilgisi alınamadı";
  const end = endValue ? bookingInstant(endValue) : NaN;
  return (
    timeFormatter.format(start) +
    (Number.isFinite(end) ? ` – ${timeFormatter.format(end)}` : "")
  );
}

/** "9 Eylül Çarşamba 18:00" — one label for compact dashboard rows. */
export function bookingDateTimeLabel(value: string): string {
  const instant = bookingInstant(value);
  return Number.isFinite(instant)
    ? dateTimeFormatter.format(instant)
    : "Tarih bilgisi alınamadı";
}

/* ------------------------------------------------------------------------ *
 * Business logic: comparing a booking against the clock
 *
 * The helpers above answer "what should this say". The ones below answer
 * "has it happened yet", and they are the ones the three-hour bug lived in:
 * `new Date(booking.start_time).getTime() <= Date.now()` compares an Istanbul
 * wall clock against a real instant and is wrong by Istanbul's offset every
 * single time.
 *
 * Every comparison of a booking against "now" in this app must go through
 * these. They take `now` explicitly so a test can pass a fixed instant, and
 * default to the server-corrected clock rather than the browser's own.
 *
 * None of this grants permission. The backend decides whether a lesson can be
 * joined; these functions decide what the interface says while it waits.
 * ------------------------------------------------------------------------ */


/** Joining opens this many minutes before a lesson. Mirrors the backend's
 *  `EARLY_JOIN_GRACE_MINUTES`; the backend's copy is the authoritative one. */
export const EARLY_JOIN_GRACE_MINUTES = 15;

/** The real instant a booking ends, from its start and duration in minutes. */
export function bookingEndInstant(value: string, durationMinutes: number): number {
  return bookingInstant(value) + durationMinutes * 60_000;
}

/** Milliseconds until the lesson starts. Negative once it has begun. */
export function msUntilBooking(value: string, now: number = serverNow()): number {
  return bookingInstant(value) - now;
}

/** Whether the lesson's start instant has passed. */
export function bookingHasStarted(value: string, now: number = serverNow()): boolean {
  const instant = bookingInstant(value);
  return Number.isFinite(instant) && now >= instant;
}

/** Whether the lesson's scheduled end has passed. */
export function bookingHasEnded(
  value: string,
  durationMinutes: number,
  now: number = serverNow()
): boolean {
  const end = bookingEndInstant(value, durationMinutes);
  return Number.isFinite(end) && now >= end;
}

/**
 * Whether the join window is open, *for display only*.
 *
 * The button this gates is a hint. A student whose clock is wrong sees the
 * wrong hint and then gets the right answer from the server the moment they
 * press it — which is the correct division of labour, and why this function
 * is safe to be approximate and unsafe to be trusted.
 */
export function bookingJoinWindowOpen(
  value: string,
  durationMinutes: number,
  now: number = serverNow()
): boolean {
  const start = bookingInstant(value);
  if (!Number.isFinite(start)) return false;
  const opensAt = start - EARLY_JOIN_GRACE_MINUTES * 60_000;
  return now >= opensAt && now < start + durationMinutes * 60_000;
}

/** Sort comparator for booking lists — ascending by real instant. */
export function byBookingInstant(
  a: { start_time: string },
  b: { start_time: string }
): number {
  return bookingInstant(a.start_time) - bookingInstant(b.start_time);
}

/* ------------------------------------------------------------------------ *
 * Calendar grouping
 *
 * "Which day is this lesson on" is a question about Istanbul's calendar, not
 * the viewer's. Grouping on a browser-local `Date` puts a 00:30 Istanbul
 * lesson on the previous day for anyone west of Turkey, and `toDateString()`
 * comparisons quietly do exactly that.
 * ------------------------------------------------------------------------ */

const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Istanbul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** "2026-09-09" — an instant's Istanbul calendar day. */
export function istanbulDayKey(instant: number | Date): string {
  const ms = instant instanceof Date ? instant.getTime() : instant;
  return Number.isFinite(ms) ? dayKeyFormatter.format(ms) : "";
}

/** "2026-09-09" — a booking's Istanbul calendar day, for grouping and filters. */
export function bookingDayKey(value: string): string {
  return istanbulDayKey(bookingInstant(value));
}

/* ------------------------------------------------------------------------ *
 * Writing a booking
 *
 * There must be exactly one way to produce a `start_time`, or the table ends
 * up holding two conventions at once — which is what happened: the booking
 * modal posted a naive local string (stored space, correct) while the admin
 * console posted `new Date(x).toISOString()`, a true instant with a `Z`. DRF
 * accepts both, so admin-created lessons landed three hours away from
 * student-created ones with nothing to mark them apart.
 * ------------------------------------------------------------------------ */

const wallClockParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Istanbul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/**
 * The `start_time` string to POST for a lesson at this instant.
 *
 * Produces the naive Istanbul wall clock with no offset — `"2026-09-09T18:00:00"`
 * — which the backend stores verbatim under the convention documented at the
 * top of this file. Never send an `toISOString()` value: the trailing `Z` is
 * taken at face value and moves the lesson.
 *
 * Reads the clock face via `Intl`, so an admin working from outside Turkey
 * still books the Istanbul hour they saw on screen.
 */
export function toBookingStartTime(instant: number | Date): string {
  const parts = wallClockParts.formatToParts(instant);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:00`;
}
