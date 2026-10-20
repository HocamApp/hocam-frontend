import type { CoachingReportListItem, CoachingSessionItem } from "./coachingApi";
import { istanbulDateKey } from "./coachingOverview";
import { dateParts, numberStudentSessions } from "./coachingStudentOverview";
import { coachingDateTimeLabel, coachingLocalDateHeading } from "./coachingTime";

export interface StudentReportCard {
  id: string;
  /** "4. görüşme"; the day's name when the number is not known; "Görüşme raporu" when neither is. */
  title: string;
  /** "Per 15 Eki"; null when the title already is the day, or the meeting's day is not known. */
  dayLabel: string | null;
  /** What to work on until the next meeting; the summary when the tutor wrote no focus. */
  focus: string | null;
  /** "Yayınlandı Cum 16 Eki · Sürüm 1" */
  published: string;
  href: string;
}

const BASE = "/dashboard/student/coaching/reports";

function shortWhen(instant: string): string {
  const parts = dateParts(istanbulDateKey(Date.parse(instant)));
  return `${parts.weekday} ${parts.day} ${parts.month}`;
}

function clean(value: string | undefined | null): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed ? trimmed : null;
}

/**
 * The student's Raporlar list: one card per published report, newest meeting
 * first. The server's own order is not relied on, and a server that does not
 * say which meeting a report is for is ordered by when the report came out.
 * The meeting's number comes from the plan's meetings (cancelled ones not
 * counted); once a coaching has ended those are gone, and the title names the
 * day instead.
 */
export function buildStudentReportCards({
  reports,
  sessions,
}: {
  reports: readonly CoachingReportListItem[];
  sessions: readonly CoachingSessionItem[];
}): StudentReportCard[] {
  const numberOf = new Map(numberStudentSessions(sessions).map(({ session, number }) => [session.id, number]));
  const startOf = new Map(sessions.map((session) => [session.id, session.scheduled_start]));

  return reports
    .flatMap((report) => {
      const revision = report.latest_revision;
      if (!revision) return [];
      const start = report.scheduled_start ?? startOf.get(report.session_id) ?? null;
      const number = numberOf.get(report.session_id) ?? null;
      const dayKey = start ? istanbulDateKey(Date.parse(start)) : null;
      const day = dayKey ? dateParts(dayKey) : null;

      const title = number !== null ? `${number}. görüşme` : dayKey ? coachingLocalDateHeading(dayKey) : "Görüşme raporu";
      const content = revision.content;
      const card: StudentReportCard = {
        id: report.id,
        title,
        dayLabel: number !== null && day ? `${day.weekday} ${day.day} ${day.month}` : null,
        focus: clean(content.focus_until_next_meeting) ?? clean(content.short_summary),
        published: `Yayınlandı ${shortWhen(revision.published_at)} · Sürüm ${revision.revision_number}${
          revision.revision_number > 1 ? ", güncellendi" : ""
        }`,
        href: `${BASE}/${report.id}`,
      };
      return [{ card, at: Date.parse(start ?? revision.published_at) }];
    })
    .sort((a, b) => b.at - a.at)
    .map(({ card }) => card);
}

export interface StudentReportHeading {
  /** "3. görüşme raporu" */
  title: string;
  /** "12 Ekim Pazartesi 18:30 görüşmesi"; null when the meeting is not known. */
  meeting: string | null;
  /** "Yayınlandı 13 Ekim Salı 10:00 · Sürüm 2" */
  published: string;
  changeNote: string | null;
}

/** The head of one report: which meeting, when it came out, and what changed. */
export function studentReportHeading({
  sessionId,
  scheduledStart,
  publishedAt,
  revisionNumber,
  changeNote,
  sessions,
}: {
  sessionId: string | undefined;
  scheduledStart: string | undefined;
  publishedAt: string;
  revisionNumber: number;
  changeNote: string | null | undefined;
  sessions: readonly CoachingSessionItem[];
}): StudentReportHeading {
  const numberOf = new Map(numberStudentSessions(sessions).map(({ session, number }) => [session.id, number]));
  const number = sessionId ? (numberOf.get(sessionId) ?? null) : null;
  const dayKey = scheduledStart ? istanbulDateKey(Date.parse(scheduledStart)) : null;
  return {
    title:
      number !== null
        ? `${number}. görüşme raporu`
        : dayKey
          ? `${coachingLocalDateHeading(dayKey)} görüşmesinin raporu`
          : "Görüşme raporu",
    meeting: scheduledStart ? `${coachingDateTimeLabel(scheduledStart)} görüşmesi` : null,
    published: `Yayınlandı ${coachingDateTimeLabel(publishedAt)} · Sürüm ${revisionNumber}`,
    changeNote: clean(changeNote),
  };
}
