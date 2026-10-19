import type { CoachingSessionItem } from "./coachingApi";
import { coachingDueLabel, coachingWhenLabel, istanbulDateKey } from "./coachingOverview";
import { coachingDayHeading, coachingLocalDateHeading, coachingTimeLabel } from "./coachingTime";

/** The room opens for the tutor this long before the start. Mirrors TUTOR_EARLY_JOIN_MINUTES in the backend's session_views.py. */
export const COACHING_TUTOR_EARLY_JOIN_MINUTES = 15;

const BASE = "/dashboard/tutor/coaching";
const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const UPCOMING = new Set(["scheduled", "reschedule_requested", "in_progress"]);

export type CoachingJoin =
  | { kind: "live"; href: string }
  | { kind: "open"; href: string }
  | { kind: "closed"; opensLabel: string }
  | null;

export interface TutorSessionRow {
  id: string;
  time: string;
  studentName: string;
  /** "30 dk · 5. görüşme" */
  detail: string;
  note: string | null;
  prepareHref: string;
  join: CoachingJoin;
}

export interface TutorNextSession extends TutorSessionRow {
  /** "Bugün 19:00" */
  when: string;
  /** "6 sa 30 dk sonra" within a day, "Devam ediyor" while running, else null. */
  countdown: string | null;
}

export interface TutorSessionDay {
  dateKey: string;
  heading: string;
  rows: TutorSessionRow[];
}

export interface TutorReportRow {
  id: string;
  studentName: string;
  detail: string;
  due: { value: string; urgent: boolean } | null;
  href: string;
}

function joinFor(session: CoachingSessionItem, now: Date, today: string): CoachingJoin {
  const href = `/session/coaching/${session.id}`;
  if (session.status === "in_progress") return { kind: "live", href };
  const start = Date.parse(session.scheduled_start);
  const opens = start - COACHING_TUTOR_EARLY_JOIN_MINUTES * MINUTE_MS;
  const end = start + session.duration_minutes * MINUTE_MS;
  const t = now.getTime();
  if (t >= end) return null;
  if (t >= opens) return { kind: "open", href };
  // Only today's meetings say when the room opens; further out it is noise.
  if (session.scheduled_local_date !== today) return null;
  return { kind: "closed", opensLabel: `${coachingTimeLabel(opens)}'te açılır` };
}

function countdown(session: CoachingSessionItem, now: Date): string | null {
  if (session.status === "in_progress") return "Devam ediyor";
  const diff = Date.parse(session.scheduled_start) - now.getTime();
  if (diff <= 0) return "Başladı";
  if (diff >= DAY_MS) return null;
  const minutes = Math.ceil(diff / MINUTE_MS);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} dk sonra`;
  return rest === 0 ? `${hours} sa sonra` : `${hours} sa ${rest} dk sonra`;
}

/**
 * The Görüşmeler page: the next meeting on its own, the rest of what is ahead
 * grouped by day, and the reports still owed. Katıl is offered only while the
 * room can actually be opened (15 minutes before, for the tutor) or the meeting
 * is running; before that the row says when it opens instead of offering a
 * button that answers "not open yet". `now` is passed in; nothing here reads the
 * clock.
 */
export function buildTutorSessions({
  sessions,
  now,
}: {
  sessions: readonly CoachingSessionItem[];
  now: Date;
}): { next: TutorNextSession | null; days: TutorSessionDay[]; reports: TutorReportRow[]; total: number } {
  const today = istanbulDateKey(now);
  const tomorrow = istanbulDateKey(now.getTime() + DAY_MS);

  const row = (session: CoachingSessionItem): TutorSessionRow => ({
    id: session.id,
    time: session.scheduled_local_time.slice(0, 5),
    studentName: session.student_name || "Öğrenci",
    detail: `${session.duration_minutes} dk · ${session.sequence_number}. görüşme`,
    note: session.status === "reschedule_requested" ? "Saat değişikliği istendi" : null,
    prepareHref: `${BASE}/sessions/${session.id}/prepare`,
    join: joinFor(session, now, today),
  });

  const ahead = sessions
    .filter((session) => UPCOMING.has(session.status))
    .sort((a, b) => Date.parse(a.scheduled_start) - Date.parse(b.scheduled_start));

  // A running meeting is the one to show, even if an earlier-booked one is still listed.
  const first = ahead.find((session) => session.status === "in_progress") ?? ahead[0];
  const nextSession = first
    ? {
        ...row(first),
        when: coachingWhenLabel(Date.parse(first.scheduled_start), now),
        countdown: countdown(first, now),
      }
    : null;

  const days: TutorSessionDay[] = [];
  for (const session of ahead) {
    if (session === first) continue;
    const key = session.scheduled_local_date;
    let day = days.find((entry) => entry.dateKey === key);
    if (!day) {
      const base = coachingLocalDateHeading(key);
      day = {
        dateKey: key,
        heading: key === today ? `Bugün · ${base}` : key === tomorrow ? `Yarın · ${base}` : base,
        rows: [],
      };
      days.push(day);
    }
    day.rows.push(row(session));
  }

  const reports: TutorReportRow[] = sessions
    .filter((session) => session.status === "awaiting_report")
    .map((session) => ({
      id: session.id,
      studentName: session.student_name || "Öğrenci",
      detail: `${coachingDayHeading(session.scheduled_start)} görüşmesi`,
      due: session.report_due_at
        ? (({ label, urgent }) => ({ value: label, urgent }))(coachingDueLabel(Date.parse(session.report_due_at), now))
        : session.report_overdue
          ? { value: "Süresi geçti", urgent: true }
          : null,
      href: `${BASE}/sessions/${session.id}/report`,
    }));

  return { next: nextSession, days, reports, total: ahead.length };
}
