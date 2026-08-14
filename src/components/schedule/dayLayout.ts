import type { ScheduleEvent } from "@/types";
import { timeToMinutes } from "./scheduleDates";

/**
 * Column assignment for the day view.
 *
 * Cards are positioned absolutely by their start time, so two things at the
 * same hour would sit exactly on top of each other and the lower one could
 * never be read or ticked. This splits overlapping events into side-by-side
 * columns — the standard day-calendar treatment.
 *
 * Events that merely touch (one ends exactly when the next starts) do not
 * overlap and keep the full width.
 */

export interface PositionedEvent {
  event: ScheduleEvent;
  /** Zero-based column this event occupies. */
  column: number;
  /** How many columns its overlapping cluster needs. */
  columns: number;
}

function endOf(event: ScheduleEvent): number {
  return timeToMinutes(event.local_time) + event.duration_minutes;
}

export function layoutDayEvents(events: ScheduleEvent[]): PositionedEvent[] {
  const sorted = [...events].sort((a, b) => {
    const byStart = timeToMinutes(a.local_time) - timeToMinutes(b.local_time);
    // Longer events first on a tie, so the wide one takes the left column.
    return byStart !== 0 ? byStart : b.duration_minutes - a.duration_minutes;
  });

  const positioned: PositionedEvent[] = [];
  // One cluster = a run of events connected by overlap. Its width is only
  // known once the run ends, so entries are patched when the cluster closes.
  let cluster: PositionedEvent[] = [];
  let columnEnds: number[] = [];

  const closeCluster = () => {
    const width = columnEnds.length;
    cluster.forEach((entry) => {
      entry.columns = width;
    });
    cluster = [];
    columnEnds = [];
  };

  sorted.forEach((event) => {
    const start = timeToMinutes(event.local_time);
    const clusterEnd = columnEnds.length ? Math.max(...columnEnds) : -Infinity;
    if (start >= clusterEnd) closeCluster();

    // First column that is free at this start time; a new one otherwise.
    let column = columnEnds.findIndex((columnEnd) => columnEnd <= start);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(endOf(event));
    } else {
      columnEnds[column] = endOf(event);
    }

    const entry: PositionedEvent = { event, column, columns: columnEnds.length };
    cluster.push(entry);
    positioned.push(entry);
  });

  closeCluster();
  return positioned;
}
