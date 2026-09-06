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

/** A display-only local Date whose calendar digits are today's Istanbul date. */
export function istanbulCalendarToday(now = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {timeZone:"Europe/Istanbul",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now);
  const part = (type: string) => Number(parts.find((value) => value.type === type)!.value);
  return new Date(part("year"), part("month") - 1, part("day"));
}
