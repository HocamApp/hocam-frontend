/**
 * Formatting for the slot picker, kept out of the component so it can be
 * tested without rendering.
 *
 * Everything here works on plain "YYYY-MM-DD" / "HH:MM" strings, which is what
 * the slots API emits. That is deliberate: those digits are Istanbul wall
 * clock, not instants, so putting them through `new Date()` and back would
 * apply the viewer's own offset and move the lesson. See
 * `Hocam_backend/docs/time-architecture.md` and `src/lib/bookingTime.ts`.
 */

const WEEKDAY_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const WEEKDAY_LONG = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
];
const MONTHS = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

/** Read the digits of an ISO date without constructing a Date in the viewer's
 * timezone. Returns 1-based month, to match how the strings read. */
export function parseIsoDate(iso: string): { year: number; month: number; day: number } {
  const [year, month, day] = iso.split("-").map(Number);
  return { year, month, day };
}

/** 0 = Monday, matching the backend's AvailabilityRule convention.
 * Computed from the calendar digits with Zeller's congruence rather than
 * `new Date(iso).getDay()`, which resolves the string as UTC midnight and so
 * reports the previous day for any viewer west of Greenwich. */
export function weekdayOfIsoDate(iso: string): number {
  const { year, month, day } = parseIsoDate(iso);
  const shiftedMonth = month < 3 ? month + 12 : month;
  const shiftedYear = month < 3 ? year - 1 : year;
  const k = shiftedYear % 100;
  const j = Math.floor(shiftedYear / 100);
  const h =
    (day +
      Math.floor((13 * (shiftedMonth + 1)) / 5) +
      k +
      Math.floor(k / 4) +
      Math.floor(j / 4) +
      5 * j) %
    7;
  // Zeller: 0 = Saturday. Shift so 0 = Monday.
  return (h + 5) % 7;
}

export function shortWeekdayLabel(iso: string): string {
  return WEEKDAY_SHORT[weekdayOfIsoDate(iso)];
}

export function weekdayLabel(dayOfWeek: number): string {
  return WEEKDAY_LONG[dayOfWeek] ?? "";
}

export function dayOfMonth(iso: string): number {
  return parseIsoDate(iso).day;
}

/** "Eylül 2026" — the heading above the day strip. */
export function monthLabel(iso: string): string {
  const { year, month } = parseIsoDate(iso);
  return `${MONTHS[month - 1]} ${year}`;
}

/** "11 Eylül 2026" */
export function longDateLabel(iso: string): string {
  const { year, month, day } = parseIsoDate(iso);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

/** The end of a lesson that starts at `start` and runs `durationMinutes`.
 * Pure arithmetic on the clock face; a lesson never crosses midnight, which
 * the backend enforces, so there is no day to roll over. */
export function endTimeLabel(start: string, durationMinutes: number): string {
  const [hours, minutes] = start.split(":").map(Number);
  const total = hours * 60 + minutes + durationMinutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** Today in Istanbul, as the same "YYYY-MM-DD" shape the API speaks. */
export function istanbulToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** `offset` days after `iso`, staying in string space. */
export function addDays(iso: string, offset: number): string {
  const { year, month, day } = parseIsoDate(iso);
  const shifted = new Date(Date.UTC(year, month - 1, day + offset));
  return shifted.toISOString().slice(0, 10);
}
