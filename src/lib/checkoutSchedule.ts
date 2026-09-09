/**
 * The weekly schedule as it travels between checkout steps.
 *
 * Every step in this flow carries its state in the URL rather than a store or
 * context (see the coaching step's checkoutHref), so the back button, a login
 * round-trip and a shared link all keep the student's choices. The schedule
 * follows the same rule, which means it has to survive being a query
 * parameter: a compact, order-independent encoding rather than JSON.
 *
 * Format: `subject~day:time,day:time` — e.g.
 * `3f2b...~0:11:00,3:12:00`. Times are Istanbul wall clock.
 */

import type { RecurringSelection } from "@/components/lessons/RecurringLessonSlotPicker";

export interface CheckoutSchedule {
  subjectId: string;
  slots: RecurringSelection[];
}

const SLOT_PATTERN = /^([0-6]):([01]\d|2[0-3]):([0-5]\d)$/;

export function encodeCheckoutSchedule(schedule: CheckoutSchedule): string {
  const slots = [...schedule.slots]
    .sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time))
    .map((slot) => `${slot.day_of_week}:${slot.start_time}`)
    .join(",");
  return `${schedule.subjectId}~${slots}`;
}

/** Returns null for anything malformed. A hand-edited URL must degrade to
 * "no schedule chosen yet", never to a half-parsed one that the student
 * cannot see and the API would refuse. */
export function decodeCheckoutSchedule(raw: string | null): CheckoutSchedule | null {
  if (!raw) return null;
  const separator = raw.indexOf("~");
  if (separator <= 0) return null;
  const subjectId = raw.slice(0, separator);
  const rest = raw.slice(separator + 1);
  if (!rest) return null;

  const slots: RecurringSelection[] = [];
  const seen = new Set<string>();
  for (const part of rest.split(",")) {
    const match = SLOT_PATTERN.exec(part);
    if (!match) return null;
    const [, day, hours, minutes] = match;
    const key = `${day}:${hours}:${minutes}`;
    if (seen.has(key)) return null;
    seen.add(key);
    slots.push({ day_of_week: Number(day), start_time: `${hours}:${minutes}` });
  }
  return { subjectId, slots };
}

/** The payload POST /payments/package-purchases/ expects. `slot_index` is
 * assigned here, from the sorted order, so the same choice always produces
 * the same indexes. */
export function toSchedulePayload(schedule: CheckoutSchedule) {
  return {
    subject: schedule.subjectId,
    slots: [...schedule.slots]
      .sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time))
      .map((slot, index) => ({
        slot_index: index,
        day_of_week: slot.day_of_week,
        start_time: slot.start_time,
      })),
  };
}
