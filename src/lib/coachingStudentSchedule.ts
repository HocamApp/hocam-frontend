import { COACHING_DAY_LABEL, type CoachingTimeRequest } from "./coachingApi";
import { coachingDateTimeLabel, coachingDayHeading, coachingTimeLabel } from "./coachingTime";

/**
 * The student's first-hours screen (Saat seçme), as plain data: the tutor's
 * open hours grouped by day, what the student has picked, how long is left,
 * and one row per slot for asking the tutor when nothing fits.
 *
 * Days are Python weekdays (0 = Monday), the same as the server's
 * `day_of_week`. Hours keep the server's own string as their `value` (it is
 * sent back unchanged) and carry an "HH:MM" `label` for display.
 */

export interface ScheduleHour {
  day_of_week: number;
  start_time: string;
}

export interface PickedScheduleSlot {
  slot_index: number;
  day_of_week: number;
  start_time: string;
}

export type LockedScheduleSlots = Record<number, ScheduleHour>;

export interface ScheduleDayGroup {
  day: number;
  label: string;
  times: { value: string; label: string }[];
}

function hhmm(time: string): string {
  return time.slice(0, 5);
}

/** Days in week order, hours in clock order, each hour once. */
export function groupSlotsByDay(slots: readonly ScheduleHour[]): ScheduleDayGroup[] {
  const days = new Map<number, Map<string, string>>();
  for (const slot of slots) {
    const times = days.get(slot.day_of_week) ?? new Map<string, string>();
    times.set(hhmm(slot.start_time), slot.start_time);
    days.set(slot.day_of_week, times);
  }
  return Array.from(days.entries())
    .sort(([a], [b]) => a - b)
    .map(([day, times]) => ({
      day,
      label: COACHING_DAY_LABEL[day] ?? "",
      times: Array.from(times.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([label, value]) => ({ value, label })),
    }));
}

/**
 * One tap on an hour. A chosen hour is taken back; otherwise it fills the
 * lowest slot that is neither fixed by the tutor's proposal nor already
 * chosen, and does nothing once every open slot has an hour.
 */
export function toggleScheduleSlot({
  requiredCount,
  locked,
  selected,
  day,
  time,
}: {
  requiredCount: number;
  locked: LockedScheduleSlots;
  selected: readonly PickedScheduleSlot[];
  day: number;
  time: string;
}): PickedScheduleSlot[] {
  const existing = selected.find((slot) => slot.day_of_week === day && slot.start_time === time);
  if (existing) return selected.filter((slot) => slot !== existing);

  const open = Array.from({ length: requiredCount }, (_, index) => index).find(
    (index) => !(index in locked) && !selected.some((slot) => slot.slot_index === index),
  );
  if (open === undefined) return [...selected];
  return [...selected, { slot_index: open, day_of_week: day, start_time: time }];
}

export interface ScheduleSummaryRow {
  slotIndex: number;
  /** "1. saat" */
  label: string;
  /** "Salı 18:30"; null while nothing is chosen for the slot. */
  value: string | null;
  /** Fixed by an hour the tutor proposed and the student accepted. */
  locked: boolean;
}

export interface ScheduleSummary {
  rows: ScheduleSummaryRow[];
  chosen: number;
  complete: boolean;
  /** "1 saat daha seç"; null once every slot has an hour. */
  hint: string | null;
}

function hourText(hour: ScheduleHour): string {
  return `${COACHING_DAY_LABEL[hour.day_of_week] ?? ""} ${hhmm(hour.start_time)}`;
}

export function buildScheduleSummary({
  requiredCount,
  selected,
  locked,
}: {
  requiredCount: number;
  selected: readonly PickedScheduleSlot[];
  locked: LockedScheduleSlots;
}): ScheduleSummary {
  const rows = Array.from({ length: requiredCount }, (_, slotIndex): ScheduleSummaryRow => {
    const fixed = locked[slotIndex];
    const picked = selected.find((slot) => slot.slot_index === slotIndex);
    const hour = fixed ?? picked;
    return {
      slotIndex,
      label: `${slotIndex + 1}. saat`,
      value: hour ? hourText(hour) : null,
      locked: Boolean(fixed),
    };
  });
  const chosen = rows.filter((row) => row.value !== null).length;
  const missing = requiredCount - chosen;
  return {
    rows,
    chosen,
    complete: missing === 0,
    hint: missing === 0 ? null : chosen === 0 ? `${missing} saat seç` : `${missing} saat daha seç`,
  };
}

export interface ScheduleDeadline {
  /** "24 Ekim Cumartesi 18:00" */
  value: string;
  /** "4 gün 2 saat kaldı", "Süre doldu" */
  remaining: string;
  expired: boolean;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * The server's own deadline as a caption's value, and how long is left. Only
 * the two largest units, since the label refreshes every half minute and a
 * seconds counter inside a sentence says nothing the student can act on.
 */
export function scheduleDeadline({
  deadlineAt,
  now,
}: {
  deadlineAt: string | null;
  now: Date;
}): ScheduleDeadline | null {
  if (!deadlineAt) return null;
  const left = Date.parse(deadlineAt) - now.getTime();
  const value = `${coachingDayHeading(deadlineAt)} ${coachingTimeLabel(deadlineAt)}`;
  if (left <= 0) return { value, remaining: "Süre doldu", expired: true };

  const days = Math.floor(left / DAY);
  const hours = Math.floor((left % DAY) / HOUR);
  const minutes = Math.floor((left % HOUR) / MINUTE);
  const remaining =
    days > 0
      ? hours > 0
        ? `${days} gün ${hours} saat kaldı`
        : `${days} gün kaldı`
      : hours > 0
        ? minutes > 0
          ? `${hours} saat ${minutes} dakika kaldı`
          : `${hours} saat kaldı`
        : minutes > 0
          ? `${minutes} dakika kaldı`
          : "1 dakikadan az kaldı";
  return { value, remaining, expired: false };
}

export type ScheduleRequestRow =
  | { kind: "ask"; slotIndex: number; label: string }
  | { kind: "waiting"; slotIndex: number; label: string; requestId: string; answerBy: string }
  | {
      kind: "proposal";
      slotIndex: number;
      label: string;
      requestId: string;
      answerBy: string;
      proposals: { id: string; when: string }[];
    }
  | { kind: "matched"; slotIndex: number; label: string };

/**
 * One row per slot for the "Uygun saat bulamadın mı?" card. A slot that is
 * fixed has none; a slot that is chosen has none either, unless a request for
 * it is still open (hiding a proposal that waits for an answer would lose it).
 * Requests come newest first, so the first one for a slot is its current one.
 */
export function buildTimeRequestRows({
  requiredCount,
  lockedIndexes,
  selectedIndexes,
  requests,
}: {
  requiredCount: number;
  lockedIndexes: readonly number[];
  selectedIndexes: readonly number[];
  requests: readonly CoachingTimeRequest[];
}): ScheduleRequestRow[] {
  const rows: ScheduleRequestRow[] = [];
  for (let slotIndex = 0; slotIndex < requiredCount; slotIndex += 1) {
    if (lockedIndexes.includes(slotIndex)) continue;
    const label = `${slotIndex + 1}. saat`;
    const request = requests.find((candidate) => candidate.slot_index === slotIndex);
    const open = request?.status === "pending" || request?.status === "matched";

    if (selectedIndexes.includes(slotIndex) && !open) continue;
    if (!request || !open) {
      rows.push({ kind: "ask", slotIndex, label });
      continue;
    }
    if (request.status === "matched") {
      rows.push({ kind: "matched", slotIndex, label });
      continue;
    }
    const answerBy = coachingDateTimeLabel(request.expires_at);
    const proposals = request.proposals
      .filter((proposal) => proposal.status === "pending")
      .map((proposal) => ({ id: proposal.id, when: hourText(proposal) }));
    rows.push(
      proposals.length
        ? { kind: "proposal", slotIndex, label, requestId: request.id, answerBy, proposals }
        : { kind: "waiting", slotIndex, label, requestId: request.id, answerBy },
    );
  }
  return rows;
}
