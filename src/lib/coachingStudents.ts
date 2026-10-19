import {
  coachingFrequencyLabel,
  type CoachingRescheduleRequestItem,
  type CoachingSessionItem,
  type CoachingStudentRow,
  type CoachingTimeRequest,
} from "./coachingApi";
import { coachingDueLabel, coachingWhenLabel } from "./coachingOverview";
import { COACHING_DAY_SHORT, coachingDateTimeLabel, coachingDayHeading } from "./coachingTime";

const BASE = "/dashboard/tutor/coaching";

/** "Zeynep K." -> "ZK": the first letters of the first two words. */
export function studentInitials(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => Array.from(word)[0].toLocaleUpperCase("tr-TR"));
  return letters.length > 0 ? letters.join("") : "?";
}

export interface StudentWaitingItem {
  id: string;
  kind: "report" | "reschedule" | "time";
  /** Null where the API does not name the student (time requests). */
  initials: string | null;
  title: string;
  detail: string | null;
  /** The deadline as a small caption over the value, set apart from the sentence. */
  due: { caption: string; value: string; urgent: boolean };
  action: { label: string; href: string };
  at: number;
}

export interface ActiveStudentRow {
  purchaseId: string;
  name: string;
  initials: string;
  /** "Haftada 2 görüşme · Pzt 19:00, Cum 19:00" */
  summary: string;
  /** The next meeting as a clock time, or null when none is booked. */
  next: string | null;
  programHref: string | null;
}

export interface PendingStudentRow {
  purchaseId: string;
  name: string;
  initials: string;
  status: "awaiting_schedule" | "cancellation_pending";
  note: string;
  /** Only a coaching nobody is already ending can be ended. */
  canEnd: boolean;
}

const UPCOMING = new Set(["scheduled", "reschedule_requested", "in_progress"]);

function slotText(student: CoachingStudentRow): string {
  const slots = [...student.recurring_slots].sort(
    (a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time)
  );
  if (slots.length === 0) return "saat seçilmedi";
  return slots
    .map(
      (slot) =>
        `${COACHING_DAY_SHORT[slot.day_of_week]} ${slot.start_time.slice(0, 5)}${
          slot.source === "tutor_proposal" ? " (özel saat)" : ""
        }`
    )
    .join(", ");
}

/**
 * The Öğrenciler page's three groups: what is waiting on the tutor (a report
 * owed, a request to answer), the students being coached with their next
 * meeting, and the two that need nothing from the tutor right now (one who has
 * not chosen hours yet, one whose coaching is being ended). `now` is passed in;
 * nothing here reads the clock.
 */
export function buildStudentsBoard({
  students,
  sessions,
  timeRequests,
  rescheduleRequests,
  now,
}: {
  students: readonly CoachingStudentRow[];
  sessions: readonly CoachingSessionItem[];
  timeRequests: readonly CoachingTimeRequest[];
  rescheduleRequests: readonly CoachingRescheduleRequestItem[];
  now: Date;
}): { waiting: StudentWaitingItem[]; active: ActiveStudentRow[]; pending: PendingStudentRow[] } {
  const waiting: StudentWaitingItem[] = [];

  for (const session of sessions) {
    if (session.status !== "awaiting_report") continue;
    const name = session.student_name || "Öğrenci";
    const at = session.report_due_at ? Date.parse(session.report_due_at) : Number.MAX_SAFE_INTEGER;
    const due = session.report_due_at
      ? coachingDueLabel(at, now)
      : { label: session.report_overdue ? "Süresi geçti" : "—", urgent: session.report_overdue };
    waiting.push({
      id: `report-${session.id}`,
      kind: "report",
      initials: studentInitials(name),
      title: `${name} raporu yazılmadı`,
      detail: `${coachingDayHeading(session.scheduled_start)} görüşmesi`,
      due: { caption: "Son tarih", value: due.label, urgent: due.urgent },
      action: { label: "Raporu yaz", href: `${BASE}/sessions/${session.id}/report` },
      at,
    });
  }

  for (const request of rescheduleRequests) {
    if (request.status !== "pending") continue;
    const name = request.student_name || "Öğrenci";
    const at = Date.parse(request.original_start);
    const due = coachingDueLabel(at, now);
    waiting.push({
      id: `reschedule-${request.id}`,
      kind: "reschedule",
      initials: studentInitials(name),
      title: `${name} saat değiştirmek istiyor`,
      detail: `${coachingDateTimeLabel(request.original_start)} yerine ${coachingDateTimeLabel(request.proposed_start)}`,
      due: { caption: "Son yanıt", value: due.label, urgent: due.urgent },
      action: { label: "Yanıtla", href: `${BASE}/reschedule-requests` },
      at,
    });
  }

  for (const request of timeRequests) {
    if (request.status !== "pending") continue;
    const at = Date.parse(request.expires_at);
    const due = coachingDueLabel(at, now);
    waiting.push({
      id: `time-${request.id}`,
      kind: "time",
      initials: null,
      title: "Saat isteği geldi",
      detail: "Uygun saat bulamayan öğrenciye saat öner.",
      due: { caption: "Son yanıt", value: due.label, urgent: due.urgent },
      action: { label: "Saat öner", href: `${BASE}/time-requests` },
      at,
    });
  }

  waiting.sort((a, b) => a.at - b.at);

  const nextByPeriod = new Map<string, CoachingSessionItem>();
  for (const session of sessions) {
    if (!session.service_period_id || !UPCOMING.has(session.status)) continue;
    const current = nextByPeriod.get(session.service_period_id);
    if (!current || Date.parse(session.scheduled_start) < Date.parse(current.scheduled_start)) {
      nextByPeriod.set(session.service_period_id, session);
    }
  }

  const active: (ActiveStudentRow & { nextAt: number })[] = [];
  const pending: PendingStudentRow[] = [];

  for (const student of students) {
    const name = student.student_name;
    if (student.service_status === "active") {
      const next = student.service_period_id ? nextByPeriod.get(student.service_period_id) : undefined;
      active.push({
        purchaseId: student.purchase_id,
        name,
        initials: studentInitials(name),
        summary: `${coachingFrequencyLabel(student.frequency)} · ${slotText(student)}`,
        next: next
          ? next.status === "in_progress"
            ? "Şimdi"
            : coachingWhenLabel(Date.parse(next.scheduled_start), now)
          : null,
        programHref: student.service_period_id
          ? `${BASE}/service-periods/${student.service_period_id}/program`
          : null,
        nextAt: next ? Date.parse(next.scheduled_start) : Number.MAX_SAFE_INTEGER,
      });
    } else if (student.service_status === "accepted_awaiting_schedule") {
      pending.push({
        purchaseId: student.purchase_id,
        name,
        initials: studentInitials(name),
        status: "awaiting_schedule",
        note: "Henüz saat seçmedi",
        canEnd: true,
      });
    } else if (student.service_status === "cancellation_pending") {
      pending.push({
        purchaseId: student.purchase_id,
        name,
        initials: studentInitials(name),
        status: "cancellation_pending",
        note: "Sonlandırılıyor",
        canEnd: false,
      });
    }
  }

  active.sort((a, b) => a.nextAt - b.nextAt || a.name.localeCompare(b.name, "tr"));

  return {
    waiting,
    active: active.map(({ nextAt: _nextAt, ...row }) => row),
    pending,
  };
}
