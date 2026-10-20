import type { CoachingSessionItem } from "./coachingApi";
import { istanbulDateKey } from "./coachingOverview";
import { coachingSessionStatusLabel } from "./coachingPresentation";
import {
  coachingRemainingLabel,
  coachingShortDate,
  dateParts,
  numberStudentSessions,
  studentCoachingJoin,
  type StudentCoachingJoin,
  type StudentTimelineDate,
} from "./coachingStudentOverview";
import { coachingLocalDateHeading, coachingTimeLabel } from "./coachingTime";

/** Rows under "Yaklaşanlar"; the rest is named by date in one line. */
export const STUDENT_UPCOMING_LIMIT = 5;

const MINUTE_MS = 60_000;
const UPCOMING = new Set(["scheduled", "reschedule_requested", "in_progress"]);
const HELD = new Set(["completed", "awaiting_report"]);

export interface StudentSessionRow {
  id: string;
  /** Null for a cancelled meeting: it is not part of the plan's count. */
  number: number | null;
  date: StudentTimelineDate;
  time: string;
  /** "21 Ekim Çarşamba" */
  dayHeading: string;
  durationMinutes: number;
  title: string;
  detail: string | null;
  waitingForTutor: boolean;
  /** The time the student asked for, while the tutor has not answered. Null when the server does not say. */
  pending: { value: string } | null;
  canReschedule: boolean;
  /** Only the first upcoming meeting carries these three. */
  join: StudentCoachingJoin;
  remaining: string | null;
  live: boolean;
  /** Records only. */
  overdueReport: { dueAt: string } | null;
  supportOpen: boolean;
  supportLater: string | null;
  rate: { href: string } | null;
  incident: { href: string } | null;
  /** What the reschedule dialog needs. */
  session: CoachingSessionItem;
}

export interface StudentSessionsModel {
  next: StudentSessionRow | null;
  upcoming: StudentSessionRow[];
  /** "9 Kas" for each upcoming meeting beyond the limit. */
  moreDates: string[];
  past: StudentSessionRow[];
}

/** "Cmt 24 Eki 11:00": a moment, in Istanbul time, with its weekday. */
function shortWhen(instant: string): string {
  const ms = Date.parse(instant);
  const parts = dateParts(istanbulDateKey(ms));
  return `${parts.weekday} ${parts.day} ${parts.month} ${coachingTimeLabel(ms)}`;
}

function endsAt(session: CoachingSessionItem): number {
  return Date.parse(session.scheduled_start) + session.duration_minutes * MINUTE_MS;
}

/**
 * The student's Görüşmeler page: the next meeting on its own, the ones after
 * it, and what already happened, newest first. A planned meeting whose time
 * has passed without the server moving it on yet is left out of all three: the
 * sweep will turn it into a meeting awaiting its report within minutes, and
 * until then it is neither coming nor a record.
 *
 * Katıl follows the backend's rule for a student (ten minutes before until the
 * session's own end), through `studentCoachingJoin`. `now` is passed in;
 * nothing here reads the clock.
 */
export function buildStudentSessions({
  sessions,
  now,
}: {
  sessions: readonly CoachingSessionItem[];
  now: Date;
}): StudentSessionsModel {
  const t = now.getTime();
  const numberOf = new Map(numberStudentSessions(sessions).map(({ session, number }) => [session.id, number]));
  const ordered = [...sessions].sort((a, b) => Date.parse(a.scheduled_start) - Date.parse(b.scheduled_start));

  const row = (session: CoachingSessionItem, role: "next" | "upcoming" | "past"): StudentSessionRow => {
    const start = Date.parse(session.scheduled_start);
    const number = numberOf.get(session.id) ?? null;
    const time = session.scheduled_local_time.slice(0, 5);
    const live = session.status === "in_progress";
    const waitingForTutor = session.status === "reschedule_requested";
    const proposed = session.pending_reschedule?.proposed_start;
    const record = role === "past";
    const held = HELD.has(session.status);

    let detail: string | null = null;
    if (record) {
      const label = coachingSessionStatusLabel(session.status);
      detail = held && session.rating_submitted === true ? `${label} · Değerlendirmen alındı` : label;
    } else if (waitingForTutor) {
      detail = "Saat değişikliği bekleniyor";
    } else if (role === "upcoming") {
      detail = `${session.duration_minutes} dk`;
    }

    const summary = `/session/coaching/${session.id}/summary`;
    return {
      id: session.id,
      number,
      date: dateParts(session.scheduled_local_date),
      time,
      dayHeading: coachingLocalDateHeading(session.scheduled_local_date),
      durationMinutes: session.duration_minutes,
      title: number === null ? `İptal edilen görüşme · ${time}` : `${number}. görüşme · ${time}`,
      detail,
      waitingForTutor,
      pending: waitingForTutor && proposed ? { value: shortWhen(proposed) } : null,
      canReschedule: session.status === "scheduled" && start > t,
      join: role === "next" ? studentCoachingJoin(session, now) : null,
      remaining: role === "next" && !live ? coachingRemainingLabel(start, now) : null,
      live,
      overdueReport: record && session.report_overdue && session.report_due_at ? { dueAt: session.report_due_at } : null,
      supportOpen: record && session.complaint_eligible,
      supportLater:
        record && !session.complaint_eligible && session.status === "awaiting_report" && session.complaint_eligible_at
          ? session.complaint_eligible_at
          : null,
      rate: record && held && session.rating_submitted === false ? { href: summary } : null,
      incident: record && session.status === "awaiting_report" ? { href: summary } : null,
      session,
    };
  };

  const coming = ordered.filter(
    (session) => UPCOMING.has(session.status) && (session.status === "in_progress" || endsAt(session) > t),
  );
  const [first, ...rest] = coming;
  const past = ordered.filter((session) => !UPCOMING.has(session.status)).reverse();

  return {
    next: first ? row(first, "next") : null,
    upcoming: rest.slice(0, STUDENT_UPCOMING_LIMIT).map((session) => row(session, "upcoming")),
    moreDates: rest.slice(STUDENT_UPCOMING_LIMIT).map((session) => coachingShortDate(session.scheduled_local_date)),
    past: past.map((session) => row(session, "past")),
  };
}
