/**
 * Coaching instants are real ISO timestamps with an offset (unlike lesson
 * bookings, see bookingTime.ts). Every label is drawn in Istanbul time,
 * whatever timezone the browser is in, because the schedule screens say
 * "Saatler Türkiye saatidir" and the tutor's availability is Istanbul time.
 */

const ZONE = "Europe/Istanbul";

/** Short day names, Monday first: index is Python's weekday() (workspace rule 10), i.e. day_of_week. */
export const COACHING_DAY_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] as const;

const dateTime =new Intl.DateTimeFormat("tr-TR", {
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

/** Hours whose spoken form ends in a voiceless consonant: üç, dört, beş, on üç, on dört, on beş, yirmi üç. */
const VOICELESS_HOURS = new Set([3, 4, 5, 13, 14, 15, 23]);

/**
 * "18:20" → "18:20'de", "18:45" → "18:45'te". The suffix follows how the time
 * is spoken, and the last word spoken is the minute, or the hour when the
 * minutes are zero: yirmi, otuz and elli take -de; kırk and anything ending
 * in üç, dört or beş take -te. Anything that is not a clock time comes back
 * unchanged.
 */
export function coachingTimeLocative(time: string): string {
  const match = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!match) return time;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const lastDigit = minute % 10;
  const voiceless =
    minute === 0
      ? VOICELESS_HOURS.has(hour)
      : lastDigit === 0
        ? minute === 40
        : lastDigit >= 3 && lastDigit <= 5;
  return `${match[0]}'${voiceless ? "te" : "de"}`;
}

/** "2026-10-12" → "12 Ekim Pazartesi", reading the date as an Istanbul day. */
export function coachingLocalDateHeading(localDate: string): string {
  return coachingDayHeading(`${localDate}T12:00:00+03:00`);
}
