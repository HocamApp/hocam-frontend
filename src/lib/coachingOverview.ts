import {
  coachingFrequencyLabel,
  type AcceptanceRequest,
  type CoachingRescheduleRequestItem,
  type CoachingSessionItem,
  type CoachingTimeRequest,
} from "./coachingApi";
import {
  COACHING_DAY_SHORT,
  coachingDateTimeLabel,
  coachingDayHeading,
  coachingTimeLabel,
} from "./coachingTime";
import { formatTryMinorTight } from "./money";

const ZONE = "Europe/Istanbul";
const HOUR_MS = 3_600_000;
const URGENT_WITHIN_MS = 3 * HOUR_MS;
const BASE = "/dashboard/tutor/coaching";

const dateKeyFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** "2026-10-19": the calendar day in Istanbul, whatever the browser's own zone is. */
export function istanbulDateKey(value: Date | number): string {
  return dateKeyFormat.format(value);
}

/** 0 for Monday, 6 for Sunday. getUTCDay is 0 for Sunday, hence the shift (workspace rule 10). */
function weekdayIndex(dateKey: string): number {
  return (new Date(`${dateKey}T00:00:00Z`).getUTCDay() + 6) % 7;
}

function addDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

const MONTH_SHORT = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

/**
 * A moment as a clock time on the day it falls: "Bugün 19:00", "Yarın 18:00",
 * "Çar 18:30" within the coming week, and "26 Eki 18:30" beyond it (a bare weekday
 * a week out would read as this week's). Never a countdown.
 */
export function coachingWhenLabel(at: number, now: Date): string {
  const today = istanbulDateKey(now);
  const day = istanbulDateKey(at);
  const time = coachingTimeLabel(at);
  if (day === today) return `Bugün ${time}`;
  if (day === addDays(today, 1)) return `Yarın ${time}`;
  for (let ahead = 2; ahead <= 6; ahead += 1) {
    if (day === addDays(today, ahead)) return `${COACHING_DAY_SHORT[weekdayIndex(day)]} ${time}`;
  }
  return `${Number(day.slice(8))} ${MONTH_SHORT[Number(day.slice(5, 7)) - 1]} ${time}`;
}

export interface CoachingDue {
  label: string;
  urgent: boolean;
}

/**
 * How long is left, in the words a tutor reads at a glance: a countdown when it
 * is close (and urgent, under three hours), otherwise the day and time. `before`
 * is for a deadline that is the meeting itself ("Çar 18:30 öncesi").
 */
export function coachingDueLabel(at: number, now: Date, options?: { before?: boolean }): CoachingDue {
  const diff = at - now.getTime();
  if (diff <= 0) return { label: "Süresi geçti", urgent: true };

  if (diff < URGENT_WITHIN_MS) {
    const minutes = Math.ceil(diff / 60_000);
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (hours === 0) return { label: `${rest} dk kaldı`, urgent: true };
    return { label: rest === 0 ? `${hours} sa kaldı` : `${hours} sa ${rest} dk kaldı`, urgent: true };
  }

  return { label: `${coachingWhenLabel(at, now)}${options?.before ? " öncesi" : ""}`, urgent: false };
}

export type CoachingTodoKind = "acceptance" | "session" | "report" | "time" | "reschedule";
export type CoachingTodoTab = "requests" | "reports" | "today";

export interface CoachingTodo {
  id: string;
  kind: CoachingTodoKind;
  tab: CoachingTodoTab;
  title: string;
  detail: string | null;
  due: CoachingDue | null;
  action: { label: string; href: string };
  /** When it falls due, as an instant: the sort key. */
  at: number;
}

function studentName(name: string | undefined): string {
  return name || "Öğrenci";
}

/**
 * Everything waiting for the tutor, soonest deadline first: coaching requests to
 * answer, time and reschedule requests, reports owed, and today's meetings. One
 * list, because "what do I do next" does not depend on which queue it came from.
 *
 * Only what is actually waiting: pending requests, a report not yet written,
 * a meeting today that has not happened. `now` is passed in; nothing here reads
 * the clock.
 */
export function buildCoachingTodos({
  sessions,
  acceptanceRequests,
  rescheduleRequests,
  timeRequests,
  now,
}: {
  sessions: readonly CoachingSessionItem[];
  acceptanceRequests: readonly AcceptanceRequest[];
  rescheduleRequests: readonly CoachingRescheduleRequestItem[];
  timeRequests: readonly CoachingTimeRequest[];
  now: Date;
}): CoachingTodo[] {
  const today = istanbulDateKey(now);
  const todos: CoachingTodo[] = [];

  for (const request of acceptanceRequests) {
    if (!request.includes_coaching || request.status !== "pending" || !request.coaching) continue;
    const at = Date.parse(request.expires_at);
    todos.push({
      id: `acceptance-${request.id}`,
      kind: "acceptance",
      tab: "requests",
      title: `${request.student.name} ${request.student.surname} koçluk istiyor`.trim(),
      detail: [
        coachingFrequencyLabel(request.coaching.frequency),
        `${request.coaching.total_sessions} görüşmelik paket`,
        formatTryMinorTight(request.coaching.total_price_minor),
      ].join(" · "),
      due: coachingDueLabel(at, now),
      action: { label: "Yanıtla", href: `${BASE}/requests` },
      at,
    });
  }

  for (const request of rescheduleRequests) {
    if (request.status !== "pending") continue;
    const at = Date.parse(request.original_start);
    todos.push({
      id: `reschedule-${request.id}`,
      kind: "reschedule",
      tab: "requests",
      title: `${studentName(request.student_name)} saat değiştirmek istiyor`,
      detail: `${coachingDateTimeLabel(request.original_start)} yerine ${coachingDateTimeLabel(request.proposed_start)}`,
      due: coachingDueLabel(at, now, { before: true }),
      action: { label: "Yanıtla", href: `${BASE}/reschedule-requests` },
      at,
    });
  }

  for (const request of timeRequests) {
    if (request.status !== "pending") continue;
    const at = Date.parse(request.expires_at);
    todos.push({
      id: `time-${request.id}`,
      kind: "time",
      tab: "requests",
      title: "Saat isteği geldi",
      detail: "Uygun saat bulamayan öğrenciye saat öner.",
      due: coachingDueLabel(at, now),
      action: { label: "Saat öner", href: `${BASE}/time-requests` },
      at,
    });
  }

  for (const session of sessions) {
    if (session.status === "awaiting_report") {
      const at = session.report_due_at ? Date.parse(session.report_due_at) : Number.MAX_SAFE_INTEGER;
      todos.push({
        id: `report-${session.id}`,
        kind: "report",
        tab: "reports",
        title: `${studentName(session.student_name)} raporu yazılmadı`,
        detail: `${coachingDayHeading(session.scheduled_start)} görüşmesi`,
        due: session.report_due_at
          ? coachingDueLabel(at, now)
          : session.report_overdue
            ? { label: "Süresi geçti", urgent: true }
            : null,
        action: { label: "Raporu yaz", href: `${BASE}/sessions/${session.id}/report` },
        at,
      });
      continue;
    }

    const live = session.status === "in_progress";
    if (session.scheduled_local_date !== today || (session.status !== "scheduled" && !live)) continue;
    todos.push({
      id: `session-${session.id}`,
      kind: "session",
      tab: "today",
      title: `Bugün ${session.scheduled_local_time.slice(0, 5)} · ${studentName(session.student_name)}`,
      detail: `${live ? "Devam ediyor · " : ""}${session.duration_minutes} dk görüşme`,
      due: null,
      action: live
        ? { label: "Katıl", href: `/session/coaching/${session.id}` }
        : { label: "Hazırlan", href: `${BASE}/sessions/${session.id}/prepare` },
      at: Date.parse(session.scheduled_start),
    });
  }

  return todos.sort((a, b) => a.at - b.at);
}

export interface CoachingWeekSession {
  id: string;
  time: string;
  studentName: string;
}

export interface CoachingWeekDay {
  dateKey: string;
  /** "Pzt 19" */
  label: string;
  isToday: boolean;
  sessions: CoachingWeekSession[];
}

// A meeting that is still ahead, running, or finished and awaiting its report.
const WEEK_STATUSES = new Set(["scheduled", "reschedule_requested", "in_progress", "awaiting_report"]);

/**
 * Monday to Sunday around today, each day with its meetings in time order.
 * Days come from the server's own `scheduled_local_date`, so no meeting can slip
 * across midnight because of the browser's timezone.
 */
export function buildCoachingWeek({
  sessions,
  now,
}: {
  sessions: readonly CoachingSessionItem[];
  now: Date;
}): { days: CoachingWeekDay[]; total: number } {
  const today = istanbulDateKey(now);
  const monday = addDays(today, -weekdayIndex(today));

  const days = Array.from({ length: 7 }, (_, index): CoachingWeekDay => {
    const dateKey = addDays(monday, index);
    return {
      dateKey,
      label: `${COACHING_DAY_SHORT[index]} ${Number(dateKey.slice(8))}`,
      isToday: dateKey === today,
      sessions: sessions
        .filter((session) => session.scheduled_local_date === dateKey && WEEK_STATUSES.has(session.status))
        .map((session) => ({
          id: session.id,
          time: session.scheduled_local_time.slice(0, 5),
          studentName: studentName(session.student_name),
        }))
        .sort((a, b) => a.time.localeCompare(b.time)),
    };
  });

  return { days, total: days.reduce((sum, day) => sum + day.sessions.length, 0) };
}
