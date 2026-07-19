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
