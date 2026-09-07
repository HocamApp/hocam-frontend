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
