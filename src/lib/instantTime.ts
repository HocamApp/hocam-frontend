/**
 * Labels for real instants: ISO timestamps that carry their offset, such as
 * "2026-10-12T15:00:00+00:00" (a refund's lesson times, a request's due date).
 *
 * These are not booking start times. `Booking.start_time` is an Istanbul wall
 * clock wearing a UTC label (bookingTime.ts), and handing a real instant to a
 * booking helper reads its digits as Istanbul time, which is three hours wrong
 * the other way. The two kinds of timestamp never go through the same helper.
 *
 * Everything is drawn in Istanbul time whatever zone the browser is in: the
 * lessons are held in Istanbul time, and a student abroad reads the same hour
 * their tutor does.
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

const timeOnly = new Intl.DateTimeFormat("tr-TR", {
  timeZone: ZONE,
  hour: "2-digit",
  minute: "2-digit",
});

function milliseconds(value: string | number | Date): number {
  return value instanceof Date
    ? value.getTime()
    : typeof value === "number"
      ? value
      : Date.parse(value);
}

function draw(formatter: Intl.DateTimeFormat, value: string | number | Date, fallback: string) {
  const ms = milliseconds(value);
  return Number.isFinite(ms) ? formatter.format(ms) : fallback;
}

/** "12 Ekim Pazartesi 18:00" */
export function instantDateTimeLabel(value: string | number | Date): string {
  return draw(dateTime, value, "Tarih bilgisi alınamadı");
}

/** "12 Ekim 2026" */
export function instantDateLabel(value: string | number | Date): string {
  return draw(dateOnly, value, "Tarih bilgisi alınamadı");
}

/** "18:00" */
export function instantTimeLabel(value: string | number | Date): string {
  return draw(timeOnly, value, "Saat bilgisi alınamadı");
}
