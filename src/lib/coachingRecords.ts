import type { CoachingReportListItem, CoachingSessionItem } from "./coachingApi";
import { coachingDueLabel, istanbulDateKey } from "./coachingOverview";
import { coachingDateTimeLabel, coachingDayHeading } from "./coachingTime";

const BASE = "/dashboard/tutor/coaching";

export type RecordKind = "owed" | "draft" | "published";

export interface RecordItem {
  id: string;
  kind: RecordKind;
  /** Null where neither the report list nor the meeting list says whose it is. */
  studentName: string | null;
  /** The meeting's day in Istanbul, "2026-10-18", or null when it cannot be told. */
  dateKey: string | null;
  /** "18 Ekim Pazar" */
  dateLabel: string | null;
  detail: string;
  /** Set while the report is still due (owed, or a draft whose meeting still waits for it). */
  due: { value: string; urgent: boolean } | null;
  action: { label: string; href: string };
  /** The deadline as an instant, for ordering; Infinity when there is none. */
  at: number;
}

const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

function shortDate(value: string): string {
  return coachingDateTimeLabel(value).split(" ").slice(0, 2).join(" ");
}

/**
 * Every report the tutor owes or has: meetings waiting for a report, drafts, and
 * published ones, each with whose it is and which meeting it covers. The report
 * list may not carry the name and date (older servers), so the meeting list
 * fills them in where it can; what still cannot be dated is returned apart
 * rather than dropped. `now` is passed in; nothing here reads the clock.
 */
export function buildCoachingRecords({
  sessions,
  reports,
  now,
}: {
  sessions: readonly CoachingSessionItem[];
  reports: readonly CoachingReportListItem[];
  now: Date;
}): {
  items: RecordItem[];
  owed: RecordItem[];
  byDay: Record<string, RecordItem[]>;
  undated: RecordItem[];
} {
  const sessionById = new Map(sessions.map((session) => [session.id, session]));
  const reported = new Set(reports.map((report) => report.session_id));
  const items: RecordItem[] = [];

  for (const session of sessions) {
    if (session.status !== "awaiting_report" || reported.has(session.id)) continue;
    const at = session.report_due_at ? Date.parse(session.report_due_at) : Number.POSITIVE_INFINITY;
    const due = session.report_due_at
      ? (({ label, urgent }) => ({ value: label, urgent }))(coachingDueLabel(at, now))
      : session.report_overdue
        ? { value: "Süresi geçti", urgent: true }
        : null;
    const dateLabel = coachingDayHeading(session.scheduled_start);
    items.push({
      id: `session-${session.id}`,
      kind: "owed",
      studentName: session.student_name || "Öğrenci",
      dateKey: session.scheduled_local_date,
      dateLabel,
      detail: `${dateLabel} görüşmesi`,
      due,
      action: { label: "Raporu yaz", href: `${BASE}/sessions/${session.id}/report` },
      at,
    });
  }

  for (const report of reports) {
    const session = sessionById.get(report.session_id);
    const start = report.scheduled_start ?? session?.scheduled_start ?? null;
    const published = report.latest_revision !== null;
    const waiting = session?.status === "awaiting_report" && !published;
    const at = waiting && session?.report_due_at ? Date.parse(session.report_due_at) : Number.POSITIVE_INFINITY;
    items.push({
      id: `report-${report.id}`,
      kind: published ? "published" : "draft",
      studentName: report.student_name ?? session?.student_name ?? null,
      dateKey: session?.scheduled_local_date ?? (start ? istanbulDateKey(Date.parse(start)) : null),
      dateLabel: start ? coachingDayHeading(start) : null,
      detail: published
        ? `Yayında · ${shortDate(report.latest_revision!.published_at)} · revizyon ${report.latest_revision!.revision_number}`
        : `Taslak ${report.draft_version ?? 1} · henüz yayınlanmadı`,
      due:
        waiting && session?.report_due_at
          ? (({ label, urgent }) => ({ value: label, urgent }))(coachingDueLabel(at, now))
          : null,
      action: {
        label: published ? "Görüntüle" : "Devam et",
        href: `${BASE}/sessions/${report.session_id}/report`,
      },
      at,
    });
  }

  const owed = items.filter((item) => item.kind === "owed").sort((a, b) => a.at - b.at);
  const byDay: Record<string, RecordItem[]> = {};
  const undated: RecordItem[] = [];
  for (const item of items) {
    if (item.dateKey === null) undated.push(item);
    else (byDay[item.dateKey] ??= []).push(item);
  }
  return { items, owed, byDay, undated };
}

export interface RecordsDayCell {
  dateKey: string;
  day: number;
  isToday: boolean;
  counts: Record<RecordKind, number>;
}

/** One month as a Monday-first grid: null cells pad the first and last week. */
export function buildRecordsMonth({
  year,
  month,
  items,
  today,
}: {
  year: number;
  month: number;
  items: readonly RecordItem[];
  today: string;
}): {
  title: string;
  cells: (RecordsDayCell | null)[];
  prev: { year: number; month: number };
  next: { year: number; month: number };
} {
  const first = new Date(Date.UTC(year, month - 1, 1));
  // getUTCDay is 0 for Sunday; the grid starts on Monday (workspace rule 10).
  const lead = (first.getUTCDay() + 6) % 7;
  const length = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (RecordsDayCell | null)[] = Array.from({ length: lead }, () => null);

  for (let day = 1; day <= length; day += 1) {
    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const counts: Record<RecordKind, number> = { owed: 0, draft: 0, published: 0 };
    for (const item of items) if (item.dateKey === dateKey) counts[item.kind] += 1;
    cells.push({ dateKey, day, isToday: dateKey === today, counts });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  return {
    title: `${MONTHS[month - 1]} ${year}`,
    cells,
    prev: month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 },
    next: month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 },
  };
}
