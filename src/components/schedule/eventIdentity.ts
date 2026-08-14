import type { ScheduleEvent } from "@/types";

/**
 * Identity of one row on the calendar.
 *
 * A weekly series is one block id repeated across many dates, so the block id
 * alone cannot address a single occurrence: keying pending state on it made
 * every week of the series look busy while one checkbox was saving.
 */
export function eventKey(event: ScheduleEvent): string {
  return `${event.source}-${event.id}-${event.occurrence_date ?? event.local_date}`;
}
