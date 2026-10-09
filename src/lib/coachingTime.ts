/**
 * Coaching instants are real ISO timestamps with an offset (unlike lesson
 * bookings, see bookingTime.ts). Every label is drawn in Istanbul time,
 * whatever timezone the browser is in, because the schedule screens say
 * "Saatler Türkiye saatidir" and the tutor's availability is Istanbul time.
 */

const ZONE = "Europe/Istanbul";

const dateTime = new Intl.DateTimeFormat("tr-TR", {
  timeZone: ZONE,
  day: "numeric",
  month: "long",
  weekday: "long",
  hour: "2-digit",
  minute: "2-digit",
});

const dateOnly = new Intl.DateTimeFormat("tr-TR", {
  timeZone: ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
});

const dayHeading = new Intl.DateTimeFormat("tr-TR", {
  timeZone: ZONE,
  day: "numeric",
  month: "long",
  weekday: "long",
});

const timeOnly = new Intl.DateTimeFormat("tr-TR", {
  timeZone: ZONE,
  hour: "2-digit",
  minute: "2-digit",
});

function instant(value: string | number | Date): number {
  return value instanceof Date ? value.getTime() : typeof value === "number" ? value : Date.parse(value);
}

function format(formatter: Intl.DateTimeFormat, value: string | number | Date, fallback: string) {
  const ms = instant(value);
  return Number.isFinite(ms) ? formatter.format(ms) : fallback;
}

/** "12 Ekim Pazartesi 18:00" */
export function coachingDateTimeLabel(value: string | number | Date): string {
  return format(dateTime, value, "Tarih bilgisi alınamadı");
}

/** "12 Ekim 2026" */
export function coachingDateLabel(value: string | number | Date): string {
  return format(dateOnly, value, "Tarih bilgisi alınamadı");
}

/** "12 Ekim Pazartesi" — for grouping slot lists by day. */
export function coachingDayHeading(value: string | number | Date): string {
  return format(dayHeading, value, "Tarih bilgisi alınamadı");
}

/** "18:00" */
export function coachingTimeLabel(value: string | number | Date): string {
  return format(timeOnly, value, "Saat bilgisi alınamadı");
}

/** "2026-10-12" → "12 Ekim Pazartesi", reading the date as an Istanbul day. */
export function coachingLocalDateHeading(localDate: string): string {
  return coachingDayHeading(`${localDate}T12:00:00+03:00`);
}
