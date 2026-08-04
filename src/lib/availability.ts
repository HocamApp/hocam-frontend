import type { AvailabilityRule } from "@/types";

export function availabilityRulesOverlap(
  rules: AvailabilityRule[],
  candidate: { dayOfWeek: number; specificDate?: string; startTime: string; endTime: string },
  excludeId?: string
) {
  return rules.some((rule) => {
    if (rule.id === excludeId || rule.is_unavailable || !rule.start_time || !rule.end_time) return false;
    const sameScope = candidate.specificDate
      ? rule.specific_date === candidate.specificDate
      : !rule.specific_date && rule.day_of_week === candidate.dayOfWeek;
    return sameScope && rule.start_time.slice(0, 5) < candidate.endTime && rule.end_time.slice(0, 5) > candidate.startTime;
  });
}

// ---------------------------------------------------------------------------
// Day status — the single source of truth behind the calendar colours, the
// legend, and the day-detail panel. Data comes only from Hocam (availability
// rules + bookings/busy intervals); a connected Google Calendar is never
// read back.
// ---------------------------------------------------------------------------

export type AvailabilityDayStatus =
  | "past" // Geçmiş gün — view only
  | "closed" // Kapalı — the tutor marked the day unavailable
  | "none" // No availability defined
  | "available" // Müsait
  | "partial" // Kısmen dolu — some of the open time is booked
  | "full"; // Dolu — every open minute is booked

export interface DayAvailabilityStatus {
  status: AvailabilityDayStatus;
  /** The day holds at least one active booking (the "Rezervasyon var" dot). */
  hasBookings: boolean;
}

/** A busy time span on a given day, normalised from a booking or a
 * privacy-minimal busy interval. */
export interface DayBusyInterval {
  start: Date;
  end: Date;
}

function minutesOfDay(time: string | null | undefined): number | null {
  if (!time) return null;
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

/** Minutes of [ruleStart, ruleEnd) covered by the given busy intervals. */
export function bookedMinutesWithinRule(
  rule: Pick<AvailabilityRule, "start_time" | "end_time">,
  date: Date,
  intervals: DayBusyInterval[]
): number {
  const startMinutes = minutesOfDay(rule.start_time);
  const endMinutes = minutesOfDay(rule.end_time);
  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
    return 0;
  }
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const ruleStart = dayStart.getTime() + startMinutes * 60_000;
  const ruleEnd = dayStart.getTime() + endMinutes * 60_000;

  // Merge the clipped overlaps so overlapping bookings never count twice.
  const spans = intervals
    .map((interval) => ({
      start: Math.max(interval.start.getTime(), ruleStart),
      end: Math.min(interval.end.getTime(), ruleEnd),
    }))
    .filter((span) => span.end > span.start)
    .sort((a, b) => a.start - b.start);

  let covered = 0;
  let currentStart: number | null = null;
  let currentEnd: number | null = null;
  for (const span of spans) {
    if (currentStart === null || currentEnd === null) {
      currentStart = span.start;
      currentEnd = span.end;
    } else if (span.start <= currentEnd) {
      currentEnd = Math.max(currentEnd, span.end);
    } else {
      covered += currentEnd - currentStart;
      currentStart = span.start;
      currentEnd = span.end;
    }
  }
  if (currentStart !== null && currentEnd !== null) {
    covered += currentEnd - currentStart;
  }
  return Math.round(covered / 60_000);
}

export function getDayAvailabilityStatus(input: {
  date: Date;
  /** Start-of-day reference for "past". */
  today: Date;
  /** Availability rules effective for this date (date-specific wins, the
   *  caller resolves that). */
  rules: AvailabilityRule[];
  /** Active bookings/busy spans falling on this date. */
  intervals: DayBusyInterval[];
}): DayAvailabilityStatus {
  const { date, today, rules, intervals } = input;
  const hasBookings = intervals.length > 0;

  if (date < today) {
    return { status: "past", hasBookings };
  }
  if (rules.some((rule) => rule.is_unavailable)) {
    return { status: "closed", hasBookings };
  }
  const openRules = rules.filter((rule) => !rule.is_unavailable);
  if (openRules.length === 0) {
    return { status: "none", hasBookings };
  }

  let totalMinutes = 0;
  let coveredMinutes = 0;
  for (const rule of openRules) {
    const start = minutesOfDay(rule.start_time);
    const end = minutesOfDay(rule.end_time);
    if (start === null || end === null || end <= start) continue;
    totalMinutes += end - start;
    coveredMinutes += bookedMinutesWithinRule(rule, date, intervals);
  }

  if (totalMinutes > 0 && coveredMinutes >= totalMinutes) {
    return { status: "full", hasBookings };
  }
  if (coveredMinutes > 0) {
    return { status: "partial", hasBookings };
  }
  return { status: "available", hasBookings };
}

/** Does this rule overlap an active booking on the given date? Used to make
 * booked slots visibly non-editable in the day editor. */
export function ruleHasBookingOnDate(
  rule: Pick<AvailabilityRule, "start_time" | "end_time">,
  date: Date,
  intervals: DayBusyInterval[]
): boolean {
  return bookedMinutesWithinRule(rule, date, intervals) > 0;
}
