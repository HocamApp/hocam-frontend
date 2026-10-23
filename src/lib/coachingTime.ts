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

/** The last word spoken of an hour: "on sekiz" → sekiz, "yirmi" → yirmi, "yirmi bir" → bir. */
const HOUR_LAST_WORD = [
  "sıfır", "bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz",
  "on", "bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz",
  "yirmi", "bir", "iki", "üç",
] as const;
const DIGIT_WORD = ["", "bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz"] as const;
const TENS_WORD = ["", "on", "yirmi", "otuz", "kırk", "elli"] as const;

/**
 * The locative suffix after each number word: -de/-da after a vowel or a voiced
 * consonant, -te/-ta after a voiceless one (üç, dört, beş, kırk), -e/-a by the
 * vowel of the word (front: i, e, ü, ö; back: ı, a, o, u).
 */
const LOCATIVE_SUFFIX: Record<string, "de" | "da" | "te" | "ta"> = {
  sıfır: "da",
  bir: "de",
  iki: "de",
  üç: "te",
  dört: "te",
  beş: "te",
  altı: "da",
  yedi: "de",
  sekiz: "de",
  dokuz: "da",
  on: "da",
  yirmi: "de",
  otuz: "da",
  kırk: "ta",
  elli: "de",
};

/**
 * "18:20" → "18:20'de", "18:45" → "18:45'te", "19:00" → "19:00'da", "18:40" →
 * "18:40'ta". The suffix follows how the time is spoken: the last word is the
 * minute's (the unit when there is one, else the tens), or the hour's when the
 * minutes are zero, and its final consonant and vowel pick -de, -da, -te or
 * -ta. Anything that is not a clock time comes back unchanged.
 */
export function coachingTimeLocative(time: string): string {
  const match = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!match) return time;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return time;
  const lastWord =
    minute === 0
      ? HOUR_LAST_WORD[hour]
      : minute % 10 !== 0
        ? DIGIT_WORD[minute % 10]
        : TENS_WORD[minute / 10];
  return `${match[0]}'${LOCATIVE_SUFFIX[lastWord]}`;
}

/** "2026-10-12" → "12 Ekim Pazartesi", reading the date as an Istanbul day. */
export function coachingLocalDateHeading(localDate: string): string {
  return coachingDayHeading(`${localDate}T12:00:00+03:00`);
}

const MINUTE_MS = 60_000;

/**
 * When a meeting ends, in milliseconds: the booked end, or the server's `ends_at`
 * when a late tutor's entry pushed it later. Never earlier than booked, and what
 * cannot be read counts as not sent.
 */
export function coachingSessionEnd(session: {
  scheduled_start: string;
  duration_minutes: number;
  ends_at?: string | null;
}): number {
  const planned = Date.parse(session.scheduled_start) + session.duration_minutes * MINUTE_MS;
  const sent = session.ends_at ? Date.parse(session.ends_at) : Number.NaN;
  return Number.isFinite(sent) && sent > planned ? sent : planned;
}
