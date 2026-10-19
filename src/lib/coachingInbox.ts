import {
  coachingFrequencyLabel,
  type AcceptanceRequest,
  type CoachingRescheduleRequestItem,
  type CoachingTimeRequest,
} from "./coachingApi";
import { coachingDueLabel, istanbulDateKey } from "./coachingOverview";
import { COACHING_DAY_SHORT, coachingDateTimeLabel } from "./coachingTime";
import { formatPlanDuration } from "./lessonPricing";
import { formatTryMinorTight } from "./money";

export interface InboxDue {
  value: string;
  urgent: boolean;
}

interface InboxBase {
  id: string;
  requestId: string;
  title: string;
  /** One quiet line for the list. */
  detail: string;
  due: InboxDue;
  /** When it falls due, as an instant: the sort key. */
  at: number;
}

export interface AcceptanceInboxItem extends InboxBase {
  kind: "acceptance";
  studentName: string;
  /** What is being asked, line by line, each with its price. */
  lines: { label: string; amount: string }[];
}

export interface TimeInboxItem extends InboxBase {
  kind: "time";
  studentName: string | null;
  note: string | null;
}

export interface RescheduleInboxItem extends InboxBase {
  kind: "reschedule";
  studentName: string;
  current: string;
  wanted: string;
  /** Whether approving it uses up one of the student's free changes. */
  usesFreeChange: boolean;
}

export type CoachingInboxItem = AcceptanceInboxItem | TimeInboxItem | RescheduleInboxItem;

export interface AnsweredRow {
  id: string;
  title: string;
  detail: string;
  when: string;
  outcome: "accepted" | "declined" | "other";
  at: number;
}

const ANSWERED_LIMIT = 10;
const DAY_MS = 86_400_000;

function fullName(student: { name: string; surname: string }): string {
  return `${student.name} ${student.surname}`.trim() || "Öğrenci";
}

/** "Dün", "3 gün önce", or the date once it is a week old. */
function answeredWhen(at: number, now: Date): string {
  const days = Math.round(
    (Date.parse(`${istanbulDateKey(now)}T00:00:00Z`) - Date.parse(`${istanbulDateKey(at)}T00:00:00Z`)) / DAY_MS
  );
  if (days <= 0) return "Bugün";
  if (days === 1) return "Dün";
  if (days < 7) return `${days} gün önce`;
  return coachingDateTimeLabel(at).split(" ").slice(0, 2).join(" ");
}

function due(at: number, now: Date): InboxDue {
  const { label, urgent } = coachingDueLabel(at, now);
  return { value: label, urgent };
}

/**
 * The Talepler page as one inbox: everything the tutor has to answer, soonest
 * deadline first, whichever of the three queues it came from, and what has been
 * answered. Only coaching requests count; lesson-only package requests belong
 * to the lessons side. `now` is passed in; nothing here reads the clock.
 *
 * A time request the tutor has already proposed a time for is waiting on the
 * student, so it moves to the answered list instead of asking for an answer.
 */
export function buildCoachingInbox({
  acceptanceRequests,
  timeRequests,
  rescheduleRequests,
  now,
}: {
  acceptanceRequests: readonly AcceptanceRequest[];
  timeRequests: readonly CoachingTimeRequest[];
  rescheduleRequests: readonly CoachingRescheduleRequestItem[];
  now: Date;
}): { pending: CoachingInboxItem[]; answered: AnsweredRow[] } {
  const pending: CoachingInboxItem[] = [];
  const answered: AnsweredRow[] = [];

  for (const request of acceptanceRequests) {
    if (!request.includes_coaching || !request.coaching) continue;
    const studentName = fullName(request.student);

    if (request.status === "pending") {
      const at = Date.parse(request.expires_at);
      const pkg = request.package;
      const lessonLabel = [
        "Ders paketi",
        pkg.lessons_per_week !== null ? `haftada ${pkg.lessons_per_week} ders` : null,
        pkg.duration_days !== null ? formatPlanDuration(pkg.duration_days).toLocaleLowerCase("tr") : null,
        `${pkg.total_credits} ders`,
      ]
        .filter(Boolean)
        .join(" · ");
      pending.push({
        id: `acceptance-${request.id}`,
        requestId: request.id,
        kind: "acceptance",
        studentName,
        title: `${studentName} koçluk istiyor`,
        detail: "Ders ve koçluk paketi",
        lines: [
          { label: lessonLabel, amount: formatTryMinorTight(pkg.total_price * 100) },
          {
            label: `Çalışma koçluğu · ${coachingFrequencyLabel(request.coaching.frequency)} · ${request.coaching.total_sessions} görüşme`,
            amount: formatTryMinorTight(request.coaching.total_price_minor),
          },
        ],
        due: due(at, now),
        at,
      });
      continue;
    }

    const at = Date.parse(request.responded_at ?? request.expires_at);
    const decided: Record<string, [string, AnsweredRow["outcome"]]> = {
      accepted: ["Kabul ettin", "accepted"],
      rejected: ["Reddettin", "declined"],
      expired: ["Süresi doldu", "other"],
      withdrawn: ["Öğrenci vazgeçti", "other"],
    };
    const [detail, outcome] = decided[request.status] ?? ["Yanıtlandı", "other"];
    answered.push({
      id: `acceptance-${request.id}`,
      title: `${studentName} · koçluk talebi`,
      detail,
      when: answeredWhen(at, now),
      outcome,
      at,
    });
  }

  for (const request of timeRequests) {
    const studentName = request.student_name || null;
    const proposal = request.proposals.find((item) => item.status === "pending");

    if (request.status === "pending" && !proposal) {
      const at = Date.parse(request.expires_at);
      pending.push({
        id: `time-${request.id}`,
        requestId: request.id,
        kind: "time",
        studentName,
        title: `${studentName ?? "Bir öğrenci"} saat istiyor`,
        detail: "Uygun saat bulamadı",
        note: request.note.trim() || null,
        due: due(at, now),
        at,
      });
      continue;
    }

    const at = Date.parse(request.resolved_at ?? request.requested_at);
    const title = studentName ? `${studentName} · saat isteği` : "Saat isteği";
    if (proposal) {
      answered.push({
        id: `time-${request.id}`,
        title,
        detail: `Önerin: ${COACHING_DAY_SHORT[proposal.day_of_week]} ${proposal.start_time.slice(0, 5)} · öğrenci yanıtı bekleniyor`,
        when: answeredWhen(Date.parse(proposal.proposed_at), now),
        outcome: "other",
        at: Date.parse(proposal.proposed_at),
      });
      continue;
    }
    const copy: Record<string, string> = {
      matched: "Saat belirlendi",
      unresolved: "Saat bulunamadı",
      withdrawn: "Öğrenci vazgeçti",
    };
    answered.push({
      id: `time-${request.id}`,
      title,
      detail: copy[request.status] ?? "Kapandı",
      when: answeredWhen(at, now),
      outcome: "other",
      at,
    });
  }

  for (const request of rescheduleRequests) {
    const studentName = request.student_name || "Öğrenci";

    if (request.status === "pending") {
      const at = Date.parse(request.original_start);
      const current = coachingDateTimeLabel(request.original_start);
      const wanted = coachingDateTimeLabel(request.proposed_start);
      pending.push({
        id: `reschedule-${request.id}`,
        requestId: request.id,
        kind: "reschedule",
        studentName,
        title: `${studentName} saat değiştirmek istiyor`,
        detail: `${current} yerine ${wanted}`,
        current,
        wanted,
        usesFreeChange: request.consumes_student_free_entitlement,
        due: due(at, now),
        at,
      });
      continue;
    }

    const at = Date.parse(request.responded_at ?? request.requested_at);
    const decided: Record<string, [string, AnsweredRow["outcome"]]> = {
      approved: ["Onayladın", "accepted"],
      auto_approved: ["Otomatik onaylandı", "accepted"],
      rejected: ["Reddettin", "declined"],
      expired: ["Süresi doldu", "other"],
    };
    const [detail, outcome] = decided[request.status] ?? ["Yanıtlandı", "other"];
    answered.push({
      id: `reschedule-${request.id}`,
      title: `${studentName} · saat değişikliği`,
      detail,
      when: answeredWhen(at, now),
      outcome,
      at,
    });
  }

  pending.sort((a, b) => a.at - b.at);
  answered.sort((a, b) => b.at - a.at);
  return { pending, answered: answered.slice(0, ANSWERED_LIMIT) };
}
