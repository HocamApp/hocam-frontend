import type {
  CoachingAttachmentItem,
  CoachingProgram,
  CoachingProgramTask,
  CoachingReportFeedbackChoice,
  CoachingReportListItem,
  CoachingSessionItem,
  CoachingSessionReportRevision,
} from "./coachingApi";
import { dateParts } from "./coachingStudentOverview";
import { coachingDateTimeLabel } from "./coachingTime";

/** "2. görüşme · 30 dk · 22 Ekim Perşembe 21:00" */
export function prepareHeadline(
  session: Pick<CoachingSessionItem, "sequence_number" | "duration_minutes" | "scheduled_start">,
): string {
  return `${session.sequence_number}. görüşme · ${session.duration_minutes} dk · ${coachingDateTimeLabel(session.scheduled_start)}`;
}

function firstName(name: string | null | undefined): string | null {
  return name?.trim().split(/\s+/)[0] || null;
}

// --- The meeting before ----------------------------------------------------------------------

export type PreviousReport =
  | { kind: "report"; sessionId: string; scheduledStart: string; revision: CoachingSessionReportRevision }
  | { kind: "awaiting"; sessionId: string; scheduledStart: string }
  | { kind: "none"; firstSession: boolean };

/** Only a meeting that took place has a report to read or still owe. */
const REPORTED_STATUSES = new Set(["completed", "awaiting_report"]);

/**
 * The report to read before this meeting: the newest published one among the
 * earlier meetings of the same coaching period. If the meeting just before has
 * none yet, it goes further back; if none has but one is still owed, it says so.
 */
export function findPreviousReport({
  session,
  sessions,
  reports,
}: {
  session: Pick<CoachingSessionItem, "id" | "service_period_id" | "scheduled_start">;
  sessions: readonly CoachingSessionItem[];
  reports: readonly CoachingReportListItem[];
}): PreviousReport {
  const start = Date.parse(session.scheduled_start);
  const earlier = sessions
    .filter(
      (item) =>
        item.id !== session.id &&
        Boolean(session.service_period_id) &&
        item.service_period_id === session.service_period_id &&
        REPORTED_STATUSES.has(item.status) &&
        Date.parse(item.scheduled_start) < start,
    )
    .sort((a, b) => Date.parse(b.scheduled_start) - Date.parse(a.scheduled_start));

  for (const item of earlier) {
    const revision = reports.find((report) => report.session_id === item.id)?.latest_revision;
    if (revision) return { kind: "report", sessionId: item.id, scheduledStart: item.scheduled_start, revision };
  }
  const owed = earlier.find((item) => item.status === "awaiting_report");
  if (owed) return { kind: "awaiting", sessionId: owed.id, scheduledStart: owed.scheduled_start };
  return { kind: "none", firstSession: earlier.length === 0 };
}

// --- The program -----------------------------------------------------------------------------

export interface PrepareProgram {
  total: number;
  done: number;
  /** What is still open, soonest date first, undated last. */
  pending: CoachingProgramTask[];
}

export function programSummary(program: CoachingProgram | null): PrepareProgram | null {
  if (!program) return null;
  const order = (task: CoachingProgramTask) => task.due_date ?? "9999-12-31";
  const pending = program.tasks
    .filter((task) => !task.is_completed)
    .sort((a, b) => order(a).localeCompare(order(b)) || a.sort_order - b.sort_order);
  return { total: program.tasks.length, done: program.tasks.length - pending.length, pending };
}

/** A task's day as a short value: "Bugün", "Gecikti · 20 Eki", "Cum 23 Eki", "Tarihsiz". */
export function taskDue(dueDate: string | null, today: string): { value: string; urgent: boolean } {
  if (!dueDate) return { value: "Tarihsiz", urgent: false };
  if (dueDate === today) return { value: "Bugün", urgent: true };
  const parts = dateParts(dueDate);
  if (dueDate < today) return { value: `Gecikti · ${parts.day} ${parts.month}`, urgent: true };
  return { value: `${parts.weekday} ${parts.day} ${parts.month}`, urgent: false };
}

// --- The shared files ------------------------------------------------------------------------

const sizeFormat = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 });

/** "512 B", "640 KB", "2,4 MB" */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kilobytes = bytes / 1024;
  if (kilobytes < 1024) return `${sizeFormat.format(kilobytes)} KB`;
  return `${sizeFormat.format(kilobytes / 1024)} MB`;
}

const monthDayFormat = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", timeZone: "Europe/Istanbul" });

/** "14 Ekim" */
export function monthDayLabel(value: string): string {
  return monthDayFormat.format(Date.parse(value));
}

export interface PrepareFileRow {
  id: string;
  name: string;
  /** "Sen yükledin" or "Ayşe yükledi": the files are shared, so who put each one there matters. */
  who: string;
  when: string;
  size: string;
}

export function prepareFileRows({
  items,
  viewerRole,
  otherName,
}: {
  items: readonly CoachingAttachmentItem[];
  /** Without a viewer, nobody is "Sen": each file names the side that added it. */
  viewerRole?: "tutor" | "student" | null;
  otherName?: string | null;
}): PrepareFileRow[] {
  const other = firstName(otherName) ?? (viewerRole === "tutor" ? "Öğrenci" : "Hoca");
  return items.map((item) => ({
    id: item.id,
    name: item.original_name,
    who: !viewerRole
      ? item.uploaded_by_role === "student"
        ? "Öğrenci yükledi"
        : "Hoca yükledi"
      : item.uploaded_by_role === viewerRole
        ? "Sen yükledin"
        : `${other} yükledi`,
    when: monthDayLabel(item.created_at),
    size: formatFileSize(item.size_bytes),
  }));
}

// --- What needs a look before the meeting ------------------------------------------------------

export interface PrepareAttentionItem {
  id: "feedback" | "program" | "files";
  title: string;
  detail: string | null;
  action: { label: string; href: string } | { label: string; kind: "files" } | null;
}

/**
 * What changed since the last meeting, as a short list: the student's answer to
 * the last report, program tasks still open, files the student added. Nothing
 * here is stored; it is worked out from what the server already holds, so it is
 * never out of date.
 */
export function prepareAttention({
  studentName,
  feedback,
  program,
  attachments,
  previousStart,
  today,
  messagesHref,
  programHref,
}: {
  studentName: string | null | undefined;
  feedback: CoachingReportFeedbackChoice | null | undefined;
  /** Null: the period has no program. Undefined: not known (not read yet, or the read failed). */
  program: CoachingProgram | null | undefined;
  attachments: readonly CoachingAttachmentItem[];
  /** The meeting before this one; files older than it were already seen. */
  previousStart: string | null;
  today: string;
  messagesHref: string | null;
  programHref: string;
}): PrepareAttentionItem[] {
  const name = firstName(studentName) ?? "Öğrenci";
  const items: PrepareAttentionItem[] = [];

  if (feedback === "want_to_change_goal" || feedback === "want_to_leave_note") {
    items.push({
      id: "feedback",
      title: feedback === "want_to_change_goal" ? `${name} hedefi değiştirmek istiyor` : `${name} sana not bırakmak istiyor`,
      detail: feedback === "want_to_change_goal" ? "Geçen rapordaki odağa geri bildirimi" : "Geçen rapordan sonra",
      action: messagesHref ? { label: "Mesajlara git", href: messagesHref } : null,
    });
  }

  if (program === null) {
    items.push({
      id: "program",
      title: "Bu dönem için program yok",
      detail: null,
      action: { label: "Programı hazırla", href: programHref },
    });
  } else if (program) {
    const summary = programSummary(program);
    if (summary && summary.pending.length > 0) {
      const late = summary.pending.find((task) => task.due_date && task.due_date < today);
      const dueToday = summary.pending.find((task) => task.due_date === today);
      items.push({
        id: "program",
        title: `${summary.pending.length} program görevi bekliyor`,
        detail: late ? `Süresi geçen: ${late.title}` : dueToday ? `Biri bugün bitmeli: ${dueToday.title}` : null,
        action: { label: "Programı yönet", href: programHref },
      });
    }
  }

  const since = previousStart ? Date.parse(previousStart) : null;
  const fresh = attachments.filter(
    (item) => item.uploaded_by_role === "student" && (since === null || Date.parse(item.created_at) > since),
  );
  if (fresh.length > 0) {
    const shown = fresh.slice(0, 2).map((item) => item.original_name).join(", ");
    items.push({
      id: "files",
      title: fresh.length === 1 ? `${name} yeni dosya yükledi` : `${name} ${fresh.length} yeni dosya yükledi`,
      detail: fresh.length > 2 ? `${shown} ve ${fresh.length - 2} dosya daha` : shown,
      action: { label: "Dosyalara bak", kind: "files" },
    });
  }

  return items;
}
