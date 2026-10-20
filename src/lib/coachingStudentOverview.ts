import {
  coachingDisputeCategoryLabel,
  coachingDisputeStatusLabel,
  type CoachingDispute,
  type CoachingProgramTask,
  type CoachingReportListItem,
  type CoachingSessionItem,
} from "./coachingApi";
import { istanbulDateKey, MONTH_SHORT, weekdayIndex } from "./coachingOverview";
import { COACHING_DAY_SHORT, coachingTimeLabel, coachingTimeLocative } from "./coachingTime";

/** The room opens for the student this long before the start. Mirrors STUDENT_EARLY_JOIN_MINUTES in the backend's session_views.py. */
export const COACHING_STUDENT_EARLY_JOIN_MINUTES = 10;

/** Rows the "Sırada" list shows before the rest is left to the Görüşmeler and Program pages. */
export const STUDENT_AHEAD_LIMIT = 6;

const BASE = "/dashboard/student/coaching";
const MINUTE_MS = 60_000;
const NEXT_SESSIONS_SHOWN = 2;
const UPCOMING = new Set(["scheduled", "reschedule_requested", "in_progress"]);
const HELD = new Set(["completed", "awaiting_report"]);
const MISSED = new Set(["student_no_show", "tutor_no_show", "technical_failure"]);
const CLOSED_DISPUTE = new Set(["resolved", "closed"]);
/** Complaint states in which the support team is waiting for the student. */
const STUDENT_TURN: Record<string, { title: string; action: string }> = {
  needs_more_info: { title: "Destek ekibi ek bilgi istiyor", action: "Yanıtla" },
  awaiting_student_choice: { title: "Çözüm seçeneğini seç", action: "Seçimini yap" },
};

/** "2026-10-20" → "20 Eki". */
export function coachingShortDate(localDate: string): string {
  return `${Number(localDate.slice(8, 10))} ${MONTH_SHORT[Number(localDate.slice(5, 7)) - 1]}`;
}

/** "Elif Kaya" → "EK"; "H" (hoca) when there is no name. */
export function coachingInitials(name: string | null | undefined): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "H";
  return words
    .slice(0, 2)
    .map((word) => Array.from(word)[0].toLocaleUpperCase("tr"))
    .join("");
}

/** "1 gün 3 sa", "6 sa 30 dk", "25 dk"; null once the moment has come. */
export function coachingRemainingLabel(at: number, now: Date): string | null {
  const diff = at - now.getTime();
  if (diff <= 0) return null;
  const minutes = Math.ceil(diff / MINUTE_MS);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const rest = minutes % 60;
  if (days > 0) return hours > 0 ? `${days} gün ${hours} sa` : `${days} gün`;
  if (hours > 0) return rest > 0 ? `${hours} sa ${rest} dk` : `${hours} sa`;
  return `${rest} dk`;
}

/**
 * The student's meetings in time order across the whole plan, cancelled ones
 * left out. `sequence_number` counts inside one service period, so it cannot
 * number a plan; the position in time can.
 */
export function numberStudentSessions(
  sessions: readonly CoachingSessionItem[],
): { session: CoachingSessionItem; number: number }[] {
  return sessions
    .filter((session) => session.status !== "cancelled")
    .sort((a, b) => Date.parse(a.scheduled_start) - Date.parse(b.scheduled_start))
    .map((session, index) => ({ session, number: index + 1 }));
}

export type StudentProgressSegment = "done" | "next" | "missed" | "later";

export interface StudentCoachingProgress {
  segments: StudentProgressSegment[];
  doneCount: number;
  nextNumber: number | null;
  /** "2 görüşme tamamlandı · 3. görüşme sırada" */
  summary: string;
  /** "12 Eki – 26 Eki" */
  range: string | null;
}

/**
 * One segment per meeting of the plan: held, the next one, missed, still to
 * come. `totalSessions` is what was bought; the segment count never drops
 * below the meetings actually listed.
 */
export function buildStudentCoachingProgress({
  sessions,
  totalSessions,
}: {
  sessions: readonly CoachingSessionItem[];
  totalSessions: number;
}): StudentCoachingProgress | null {
  const numbered = numberStudentSessions(sessions);
  if (numbered.length === 0) return null;

  const next = numbered.find(({ session }) => UPCOMING.has(session.status));
  const segments: StudentProgressSegment[] = numbered.map(({ session }) =>
    HELD.has(session.status)
      ? "done"
      : MISSED.has(session.status)
        ? "missed"
        : session === next?.session
          ? "next"
          : "later",
  );
  while (segments.length < totalSessions) segments.push("later");

  const doneCount = segments.filter((segment) => segment === "done").length;
  const nextNumber = next?.number ?? null;
  const summary =
    nextNumber !== null
      ? `${doneCount} görüşme tamamlandı · ${nextNumber}. görüşme sırada`
      : doneCount === segments.length
        ? `${doneCount} görüşmenin hepsi tamamlandı`
        : `${doneCount} görüşme tamamlandı`;

  const first = numbered[0].session.scheduled_local_date;
  const last = numbered[numbered.length - 1].session.scheduled_local_date;
  const range =
    first === last ? coachingShortDate(first) : `${coachingShortDate(first)} – ${coachingShortDate(last)}`;

  return { segments, doneCount, nextNumber, summary, range };
}

export type StudentCoachingJoin =
  | { kind: "open"; href: string }
  | { kind: "closed"; opensLabel: string }
  | null;

/**
 * Whether the room can be opened, by the backend's rule for a student
 * (`CoachingSessionTokenView`): from ten minutes before the start until the
 * session's own end, and only while it is scheduled or running. A hint for the
 * label: the server decides when the room token is issued.
 */
export function studentCoachingJoin(session: CoachingSessionItem, now: Date): StudentCoachingJoin {
  if (session.status !== "scheduled" && session.status !== "in_progress") return null;
  const start = Date.parse(session.scheduled_start);
  const end = start + session.duration_minutes * MINUTE_MS;
  const t = now.getTime();
  if (t >= end) return null;
  const opens = start - COACHING_STUDENT_EARLY_JOIN_MINUTES * MINUTE_MS;
  if (session.status === "in_progress" || t >= opens) {
    return { kind: "open", href: `/session/coaching/${session.id}` };
  }
  return { kind: "closed", opensLabel: `${coachingTimeLocative(coachingTimeLabel(opens))} açılır` };
}

export interface StudentTimelineDate {
  weekday: string;
  day: number;
  month: string;
}

export type StudentTimelineAction =
  | { kind: "link"; label: string; href: string }
  | { kind: "complete"; taskId: string };

export interface StudentTimelineItem {
  id: string;
  kind: "session" | "task" | "undated" | "dispute" | "report";
  date: StudentTimelineDate | null;
  title: string;
  detail: string | null;
  overdue: boolean;
  /** The marker on the line: pink for a meeting or something to answer, gold for a task, ink for a record. */
  tone: "pink" | "gold" | "ink";
  /** Only the first upcoming meeting carries these. */
  join: StudentCoachingJoin;
  remaining: string | null;
  live: boolean;
  action: StudentTimelineAction | null;
}

function dateParts(dateKey: string): StudentTimelineDate {
  return {
    weekday: COACHING_DAY_SHORT[weekdayIndex(dateKey)],
    day: Number(dateKey.slice(8, 10)),
    month: MONTH_SHORT[Number(dateKey.slice(5, 7)) - 1],
  };
}

function item(partial: Partial<StudentTimelineItem> & Pick<StudentTimelineItem, "id" | "kind" | "title" | "tone">): StudentTimelineItem {
  return {
    date: null,
    detail: null,
    overdue: false,
    join: null,
    remaining: null,
    live: false,
    action: null,
    ...partial,
  };
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}/;

function reportRow(report: CoachingReportListItem, number: number | undefined): { at: number; row: StudentTimelineItem } | null {
  const revision = report.latest_revision;
  if (!revision) return null;
  const published = Date.parse(revision.published_at);
  return {
    at: published,
    row: item({
      id: `report-${report.id}`,
      kind: "report",
      date: dateParts(istanbulDateKey(published)),
      title: number ? `${number}. görüşme raporu yayınlandı` : "Görüşme raporu yayınlandı",
      detail: `Sürüm ${revision.revision_number}`,
      tone: "ink",
      action: { kind: "link", label: "Raporu aç", href: `${BASE}/reports/${report.id}` },
    }),
  };
}

/**
 * The newest published reports, for a student whose coaching has ended: no
 * meeting list is loaded then, so the rows carry no meeting number.
 */
export function buildStudentReportRows({
  reports,
  limit = 3,
}: {
  reports: readonly CoachingReportListItem[];
  limit?: number;
}): StudentTimelineItem[] {
  return reports
    .flatMap((report) => reportRow(report, undefined) ?? [])
    .sort((a, b) => b.at - a.at)
    .slice(0, limit)
    .map(({ row }) => row);
}

/**
 * "Sırada" and "Geçmiş" on the Genel bakış page.
 *
 * Sırada: the next two meetings and the open tasks with a target date, in date
 * order (a meeting before the same day's task, an overdue task first), led by
 * whatever the support team is waiting on from the student. Tasks without a
 * date fold into one last row. Cut at `limit` rows; `hidden` counts the rest.
 *
 * Geçmiş: the latest published report and the complaints still open. A report
 * has no read marker in the API, so nothing here says "new".
 *
 * `now` is passed in; nothing here reads the clock.
 */
export function buildStudentCoachingTimeline({
  sessions,
  tasks,
  disputes,
  reports,
  now,
  limit = STUDENT_AHEAD_LIMIT,
}: {
  sessions: readonly CoachingSessionItem[];
  tasks: readonly CoachingProgramTask[];
  disputes: readonly CoachingDispute[];
  reports: readonly CoachingReportListItem[];
  now: Date;
  limit?: number;
}): { ahead: StudentTimelineItem[]; hidden: number; past: StudentTimelineItem[] } {
  const today = istanbulDateKey(now);
  const t = now.getTime();
  const numbered = numberStudentSessions(sessions);
  const numberOf = new Map(numbered.map(({ session, number }) => [session.id, number]));

  // --- Sırada
  const comingSessions = numbered
    .filter(({ session }) => {
      if (!UPCOMING.has(session.status)) return false;
      if (session.status === "in_progress") return true;
      return Date.parse(session.scheduled_start) + session.duration_minutes * MINUTE_MS > t;
    })
    .slice(0, NEXT_SESSIONS_SHOWN);

  const dated: { at: number; row: StudentTimelineItem }[] = comingSessions.map(({ session, number }, index) => {
    const start = Date.parse(session.scheduled_start);
    const first = index === 0;
    const live = session.status === "in_progress";
    return {
      at: start,
      row: item({
        id: `session-${session.id}`,
        kind: "session",
        date: dateParts(session.scheduled_local_date),
        title: `${number}. görüşme · ${session.scheduled_local_time.slice(0, 5)}`,
        detail: session.status === "reschedule_requested" ? "Saat değişikliği bekleniyor" : null,
        tone: "pink",
        join: first ? studentCoachingJoin(session, now) : null,
        remaining: first && !live ? coachingRemainingLabel(start, now) : null,
        live,
      }),
    };
  });

  const open = tasks.filter((task) => !task.is_completed);
  for (const task of open) {
    const key = task.due_date && DATE_KEY.test(task.due_date) ? task.due_date.slice(0, 10) : null;
    if (!key) continue;
    dated.push({
      // End of that Istanbul day, so a meeting the same day comes first.
      at: Date.parse(`${key}T23:59:00+03:00`),
      row: item({
        id: `task-${task.id}`,
        kind: "task",
        date: dateParts(key),
        title: task.title,
        detail: task.subject || null,
        overdue: key < today,
        tone: "gold",
        action: { kind: "complete", taskId: task.id },
      }),
    });
  }
  dated.sort((a, b) => a.at - b.at);

  const turnItems = disputes
    .filter((dispute) => dispute.status in STUDENT_TURN)
    .sort((a, b) => Date.parse(a.submitted_at) - Date.parse(b.submitted_at))
    .map((dispute) =>
      item({
        id: `dispute-${dispute.id}`,
        kind: "dispute",
        date: dateParts(istanbulDateKey(Date.parse(dispute.submitted_at))),
        title: STUDENT_TURN[dispute.status].title,
        detail: coachingDisputeCategoryLabel(dispute.category),
        tone: "pink",
        action: { kind: "link", label: STUDENT_TURN[dispute.status].action, href: `${BASE}/complaints/${dispute.id}` },
      }),
    );

  const undatedCount = open.filter((task) => !(task.due_date && DATE_KEY.test(task.due_date))).length;
  const undatedRow =
    undatedCount > 0
      ? item({
          id: "tasks-undated",
          kind: "undated",
          title: `Tarihi olmayan ${undatedCount} görev`,
          tone: "gold",
          action: { kind: "link", label: "Programı aç", href: `${BASE}/program` },
        })
      : null;

  const ordered = [...turnItems, ...dated.map(({ row }) => row)];
  const room = Math.max(0, limit - (undatedRow ? 1 : 0));
  const visible = ordered.slice(0, room);
  const ahead = undatedRow ? [...visible, undatedRow] : visible;

  // --- Geçmiş
  const records: { at: number; row: StudentTimelineItem }[] = [];

  const latestReport = reports
    .filter((report) => report.latest_revision)
    .sort(
      (a, b) => Date.parse(b.latest_revision!.published_at) - Date.parse(a.latest_revision!.published_at),
    )[0];
  const latestRow = latestReport ? reportRow(latestReport, numberOf.get(latestReport.session_id)) : null;
  if (latestRow) records.push(latestRow);

  const openDisputes = disputes
    .filter((dispute) => !(dispute.status in STUDENT_TURN) && !CLOSED_DISPUTE.has(dispute.status))
    .sort((a, b) => Date.parse(b.submitted_at) - Date.parse(a.submitted_at))
    .slice(0, 2);
  for (const dispute of openDisputes) {
    const submitted = Date.parse(dispute.submitted_at);
    records.push({
      at: submitted,
      row: item({
        id: `dispute-${dispute.id}`,
        kind: "dispute",
        date: dateParts(istanbulDateKey(submitted)),
        title: "Sorun bildirimin",
        detail: `${coachingDisputeCategoryLabel(dispute.category)} · ${coachingDisputeStatusLabel(dispute.status)}`,
        tone: "ink",
        action: { kind: "link", label: "Durumu gör", href: `${BASE}/complaints/${dispute.id}` },
      }),
    });
  }
  records.sort((a, b) => b.at - a.at);

  return {
    ahead,
    hidden: ordered.length - visible.length,
    past: records.map(({ row }) => row),
  };
}
