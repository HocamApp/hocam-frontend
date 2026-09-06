import type { AvailabilityRule, BusyInterval } from "@/types";

// Busy interval timestamps follow the project's naive wall-clock convention
// (see BookingModal.handleSubmit): the YYYY-MM-DD/HH:mm digits ARE Turkey local time,
// with no real timezone conversion applied by the backend. Parsing via
// `new Date(iso)` would apply a spurious +3h shift on display; read the
// digits directly instead, exactly like the rest of this file already does.
function parseNaiveLocalDateTime(iso: string): { dateStr: string; minutes: number } {
  const match = iso.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/);
  if (!match) return { dateStr: "", minutes: 0 };
  const [, dateStr, hh, mm] = match;
  return { dateStr, minutes: parseInt(hh, 10) * 60 + parseInt(mm, 10) };
}

// Parse "16:00" or "16:00:00" to minutes since midnight
function parseTimeToMinutes(t: string): number {
  const parts = t.trim().split(":");
  const h = parseInt(parts[0] ?? "0", 10);
  const m = parseInt(parts[1] ?? "0", 10);
  return h * 60 + m;
}

function minutesToTimeStr(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Generate 30-min slots for a day from availability rules. Exclude slots where
// start + duration would exceed rule end, or where the candidate interval
// overlaps an existing busy (pending/confirmed) booking on that exact date.
export function getSlotsForDay(
  rules: AvailabilityRule[],
  backendDay: number,
  durationMinutes: number,
  busyIntervals: BusyInterval[],
  dateStr: string
): string[] {
  const dated = rules.filter((rule) => rule.specific_date === dateStr);
  const dayRules = dated.length ? dated : rules.filter((rule) => !rule.specific_date && rule.day_of_week === backendDay);
  if (dayRules.some((rule) => rule.is_unavailable)) return [];
  if (dayRules.length === 0) return [];

  // Busy ranges may span midnight (including full-day time off). Clip to the
  // selected local day; these API digits already represent Istanbul wall time.
  const busyForDay = busyIntervals.map((interval) => ({
    start: parseNaiveLocalDateTime(interval.start_time),
    end: parseNaiveLocalDateTime(interval.end_time),
  })).filter(({ start, end }) => start.dateStr <= dateStr && end.dateStr >= dateStr)
    .map(({ start, end }) => ({
      startMin: start.dateStr < dateStr ? 0 : start.minutes,
      endMin: end.dateStr > dateStr ? 1440 : end.minutes,
    }));

  const slotSet = new Set<number>();
  for (const r of dayRules) {
    if (!r.start_time || !r.end_time || r.is_unavailable) continue;
    const startMin = parseTimeToMinutes(r.start_time);
    const endMin = parseTimeToMinutes(r.end_time);
    for (let m = startMin; m + durationMinutes <= endMin; m += 30) {
      const candidateEnd = m + durationMinutes;
      const overlapsBusy = busyForDay.some(
        (b) => m < b.endMin && candidateEnd > b.startMin
      );
      if (!overlapsBusy) {
        slotSet.add(m);
      }
    }
  }
  return Array.from(slotSet)
    .sort((a, b) => a - b)
    .map(minutesToTimeStr);
}
