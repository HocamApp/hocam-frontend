import {
  coachingDisputeCategoryLabel,
  coachingDisputeMeritLabel,
  coachingDisputeRemedyLabel,
  coachingDisputeStatusLabel,
  coachingRefundStateCopy,
  type CoachingDispute,
} from "./coachingApi";
import { coachingDateTimeLabel, coachingDayHeading } from "./coachingTime";
import { formatTryMinor } from "./money";

/**
 * The student's Sorun bildir pages as plain data: the complaints as cards with
 * what waits for the student first, the last day to file each topic, a refund
 * line only when the server recorded a refund, and the detail of one complaint
 * with its process dated and the tutor's replies. No browser clock decides
 * anything here: every date is the server's.
 */

const COMPLAINTS_HREF = "/dashboard/student/coaching/complaints";

/** The student's wording: the server's label for the choice speaks to the tutor ("Öğrenci seçimi bekleniyor"). */
export function studentDisputeStatusLabel(status: string): string {
  if (status === "awaiting_student_choice") return "Senin seçimin bekleniyor";
  return coachingDisputeStatusLabel(status);
}

const NEEDS_STUDENT = new Set(["needs_more_info", "awaiting_student_choice"]);

export type ComplaintTone = "attention" | "waiting" | "working" | "done";

function toneOf(status: string): ComplaintTone {
  if (NEEDS_STUDENT.has(status)) return "attention";
  if (status === "waiting_review") return "waiting";
  if (status === "under_review") return "working";
  return "done";
}

export interface ComplaintCard {
  id: string;
  title: string;
  /** "15 Ekim Perşembe 14:20" */
  whenLabel: string;
  statusLabel: string;
  tone: ComplaintTone;
  /** The complaint cannot move until the student answers or chooses. */
  needsStudent: boolean;
  href: string;
}

/** What waits for the student first, then the newest. The server's order is not relied on. */
export function buildComplaintCards(disputes: readonly CoachingDispute[]): ComplaintCard[] {
  return [...disputes]
    .sort((a, b) => {
      const aWaits = NEEDS_STUDENT.has(a.status) ? 0 : 1;
      const bWaits = NEEDS_STUDENT.has(b.status) ? 0 : 1;
      return aWaits - bWaits || Date.parse(b.submitted_at) - Date.parse(a.submitted_at);
    })
    .map((dispute) => ({
      id: dispute.id,
      title: coachingDisputeCategoryLabel(dispute.category),
      whenLabel: coachingDateTimeLabel(dispute.submitted_at),
      statusLabel: studentDisputeStatusLabel(dispute.status),
      tone: toneOf(dispute.status),
      needsStudent: NEEDS_STUDENT.has(dispute.status),
      href: `${COMPLAINTS_HREF}/${dispute.id}`,
    }));
}

/** "3 bildirim · 1 tanesi senden bir adım bekliyor"; nothing when there are no complaints. */
export function complaintsSummary(cards: readonly ComplaintCard[]): string {
  if (cards.length === 0) return "";
  const waiting = cards.filter((card) => card.needsStudent).length;
  const count = `${cards.length} bildirim`;
  return waiting > 0 ? `${count} · ${waiting} tanesi senden bir adım bekliyor` : count;
}

const MS = 1;

/**
 * "Son bildirim günü: 27 Ekim Salı" for each topic the server gave a deadline
 * for. A deadline is the moment the window closes, so the last day to file is
 * the one that moment ends: 28 October 00:00 is the 27th. A topic with no
 * deadline gets no line.
 */
export function categoryDeadlineLines(eligibility: {
  category_filing_deadlines?: Record<string, string | null> | null;
}): Record<string, string> {
  const lines: Record<string, string> = {};
  for (const [category, deadline] of Object.entries(eligibility.category_filing_deadlines ?? {})) {
    if (!deadline) continue;
    const closes = Date.parse(deadline);
    if (!Number.isFinite(closes)) continue;
    lines[category] = `Son bildirim günü: ${coachingDayHeading(closes - MS)}`;
  }
  return lines;
}

export interface RefundLine {
  status: string;
  /** The amount the server recorded, "2.400 ₺"; null when none is owed any more. */
  amount: string | null;
}

/** Only when the server recorded a refund: silence about money is the default. */
export function refundLine(refund: { state: string; liability_minor: number }): RefundLine | null {
  if ((refund.state === "none" || refund.state === "nothing_to_settle") && refund.liability_minor <= 0) return null;
  return {
    status: coachingRefundStateCopy(refund.state),
    amount: refund.liability_minor > 0 ? formatTryMinor(refund.liability_minor) : null,
  };
}

export interface DisputeDetailModel {
  title: string;
  /** "15 Ekim Perşembe 14:20" */
  whenLabel: string;
  statusLabel: string;
  tone: ComplaintTone;
  description: string;
  needsMoreInfo: boolean;
  responses: { when: string; body: string }[];
  steps: { when: string; text: string }[];
  /** The remedies the server allows, until one has been applied. */
  choice: {
    determinationId: string;
    meritLabel: string;
    options: { value: string; label: string }[];
  } | null;
  /** What was chosen, and the refund that followed, once a remedy is applied. */
  chosen: { label: string; refund: RefundLine | null } | null;
}

export function buildDisputeDetail(dispute: CoachingDispute): DisputeDetailModel {
  const remedies = dispute.determination?.allowed_remedies ?? [];
  const chosenRemedy = dispute.application?.remedy_type ?? dispute.selected_remedy;
  return {
    title: coachingDisputeCategoryLabel(dispute.category),
    whenLabel: coachingDateTimeLabel(dispute.submitted_at),
    statusLabel: studentDisputeStatusLabel(dispute.status),
    tone: toneOf(dispute.status),
    description: dispute.description,
    needsMoreInfo: dispute.status === "needs_more_info",
    responses: dispute.tutor_responses.map((reply) => ({
      when: coachingDateTimeLabel(reply.created_at),
      body: reply.body,
    })),
    steps: dispute.timeline.map((step) => ({
      when: coachingDateTimeLabel(step.created_at),
      text: step.participant_message || "Süreç güncellemesi",
    })),
    choice:
      dispute.determination && remedies.length > 0 && !dispute.application
        ? {
            determinationId: dispute.determination.id,
            meritLabel: coachingDisputeMeritLabel(dispute.determination.merit),
            options: remedies.map((value) => ({ value, label: coachingDisputeRemedyLabel(value) })),
          }
        : null,
    chosen: chosenRemedy
      ? { label: coachingDisputeRemedyLabel(chosenRemedy), refund: refundLine(dispute.refund) }
      : null,
  };
}
