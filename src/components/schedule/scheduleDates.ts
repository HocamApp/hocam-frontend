/**
 * Date helpers for the study program screen.
 *
 * The backend sends every event as an Istanbul wall clock split into
 * `local_date` ("2026-08-17") and `local_time` ("18:00"). It never sends an
 * instant, on purpose — its three sources store time three different ways. So
 * nothing here goes through `new Date(isoString)`: that would reinterpret the
 * date in the browser's timezone and slide events across midnight for anyone
 * not sitting in Istanbul. Dates are built from their parts instead, and the
 * resulting `Date` is used only as a calendar position, never as an instant.
 */

const DAY_NAMES_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const MONTH_NAMES = [
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

export const WEEKDAY_LABELS = DAY_NAMES_SHORT;

/** "2026-08-17" → local midnight of that calendar day, no timezone shift. */
export function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Date → "2026-08-17". Mirrors `parseLocalDate`, never uses toISOString(). */
export function toDateKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  next.setHours(0, 0, 0, 0);
  return next;
}

/** Monday of the ISO week containing `date` — matches the backend's weeks. */
export function startOfWeek(date: Date): Date {
  return addDays(date, -((date.getDay() + 6) % 7));
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function weekDays(anchor: Date): Date[] {
  const monday = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

/**
 * The month grid: whole weeks, Monday-first, padded with the neighbouring
 * months' days so every row has seven cells. Always 6 rows (42 days) so the
 * grid doesn't jump height between months — and 42 days stays inside the
 * backend's 62-day range cap.
 */
export function monthGridDays(anchor: Date): Date[] {
  const first = startOfMonth(anchor);
  const gridStart = startOfWeek(first);
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

export type ScheduleView = "daily" | "weekly" | "monthly";

/** The [from, to] the calendar endpoint should be asked for. */
export function rangeForView(view: ScheduleView, anchor: Date): {
  from: string;
  to: string;
} {
  if (view === "daily") {
    const key = toDateKey(anchor);
    return { from: key, to: key };
  }
  if (view === "weekly") {
    const days = weekDays(anchor);
    return { from: toDateKey(days[0]), to: toDateKey(days[6]) };
  }
  const grid = monthGridDays(anchor);
  return { from: toDateKey(grid[0]), to: toDateKey(grid[grid.length - 1]) };
}

/** How far one ‹ / › step moves for each view. */
export function shiftAnchor(view: ScheduleView, anchor: Date, direction: 1 | -1): Date {
  if (view === "daily") return addDays(anchor, direction);
  if (view === "weekly") return addDays(anchor, 7 * direction);
  const next = new Date(anchor.getFullYear(), anchor.getMonth() + direction, 1);
  return next;
}

/** The label between the ‹ › arrows: "10 – 16 Ağustos", "Ağustos 2026", … */
export function rangeLabel(view: ScheduleView, anchor: Date): string {
  if (view === "daily") {
    return `${anchor.getDate()} ${MONTH_NAMES[anchor.getMonth()]} ${anchor.getFullYear()}`;
  }
  if (view === "monthly") {
    return `${MONTH_NAMES[anchor.getMonth()]} ${anchor.getFullYear()}`;
  }

  const days = weekDays(anchor);
  const start = days[0];
  const end = days[6];
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()} – ${end.getDate()} ${MONTH_NAMES[start.getMonth()]}`;
  }
  return `${start.getDate()} ${MONTH_NAMES[start.getMonth()]} – ${end.getDate()} ${
    MONTH_NAMES[end.getMonth()]
  }`;
}

export function longDayLabel(date: Date): string {
  const weekday = WEEKDAY_LABELS[(date.getDay() + 6) % 7];
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} · ${weekday}`;
}

/** "18:00" → minutes since midnight, for sorting and time-rail placement. */
export function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(total: number): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;
}

/** "18:00" + 90 → "19:30", for the "18:00-19:30" range on a block. */
export function endTimeLabel(startTime: string, durationMinutes: number): string {
  return minutesToTime(timeToMinutes(startTime) + durationMinutes);
}

/** 210 → "3s 30dk". Subject cards show total time and no percentage. */
export function formatMinutes(total: number): string {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return `${minutes}dk`;
  if (minutes === 0) return `${hours}s`;
  return `${hours}s ${minutes}dk`;
}

/**
 * The hours a timed grid actually draws.
 *
 * Cropped to the events plus an hour of air. Anchoring to a fixed 08:00–22:00
 * would leave a lesson at 00:30 sitting above twenty empty rows.
 */
export function visibleHourWindow(
  events: { local_time: string; duration_minutes: number }[],
  fallback = { start: 8, end: 22 }
): { start: number; end: number } {
  if (events.length === 0) return fallback;

  let start = 24;
  let end = 0;
  events.forEach((event) => {
    const startMinutes = timeToMinutes(event.local_time);
    start = Math.min(start, Math.floor(startMinutes / 60));
    end = Math.max(end, Math.ceil((startMinutes + event.duration_minutes) / 60));
  });

  return {
    start: Math.max(0, start - 1),
    end: Math.min(24, Math.max(end + 1, start + 2)),
  };
}
