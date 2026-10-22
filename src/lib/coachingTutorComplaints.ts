import {
  coachingDisputeCategoryLabel,
  coachingDisputeMeritLabel,
  coachingDisputeStatusLabel,
  type CoachingDispute,
  type CoachingSessionItem,
} from "./coachingApi";
import { coachingDateTimeLabel } from "./coachingTime";

/**
 * The tutor's page of one complaint against them, as plain data: what it is
 * about, where it stands on its way from filed to closed, the dated process, the
 * result once the review has decided, the evidence staff opened to the tutor and
 * the tutor's own answers. The student's own description is never here: the
 * server leaves it empty for the tutor and this page does not ask for it.
 */

export type PathStepState = "done" | "current" | "todo";

export interface ComplaintPathStep {
  key: "received" | "review" | "decision" | "closed";
  label: string;
  state: PathStepState;
}

export interface TutorComplaintModel {
  title: string;
  /** "15 Ekim Perşembe 14:20" */
  whenLabel: string;
  statusLabel: string;
  /** The meeting it is about; `label` is null until the tutor's meetings list has it. */
  session: { label: string | null; href: string } | null;
  path: { steps: ComplaintPathStep[]; note: string | null };
  steps: { when: string; text: string }[];
  result: { meritLabel: string; whenLabel: string } | null;
  evidence: { id: string; name: string }[];
  replies: { when: string; body: string }[];
  reply: { open: boolean; closedNote: string | null };
}

const STEP_LABELS = { received: "Alındı", review: "İnceleniyor", decision: "Karar" } as const;

/** How far along each status is: 0 is filed, 3 is over. Unknown statuses count as only filed. */
const REACHED: Record<string, number> = {
  waiting_review: 0,
  under_review: 1,
  needs_more_info: 1,
  awaiting_student_choice: 2,
  resolved: 3,
  closed: 3,
};

const NOTES: Record<string, string> = {
  needs_more_info: "Öğrenciden ek bilgi bekleniyor.",
  awaiting_student_choice: "Öğrencinin çözümü seçmesi bekleniyor.",
};

function buildPath(status: string): TutorComplaintModel["path"] {
  const known = status in REACHED;
  const reached = known ? REACHED[status] : 0;
  const finalLabel = status === "resolved" ? "Çözüldü" : "Kapandı";
  const labels = [STEP_LABELS.received, STEP_LABELS.review, STEP_LABELS.decision, finalLabel];
  const keys = ["received", "review", "decision", "closed"] as const;
  const steps = keys.map((key, index): ComplaintPathStep => {
    let state: PathStepState = "todo";
    if (index < reached) state = "done";
    else if (index === reached) state = known ? "current" : "done";
    return { key, label: labels[index], state };
  });
  return { steps, note: NOTES[status] ?? null };
}

const CLOSED_NOTES: Record<string, string> = {
  resolved: "Bu bildirim çözüldüğü için yeni yanıt eklenemiyor.",
  closed: "Bu bildirim kapandığı için yeni yanıt eklenemiyor.",
};

export function buildTutorComplaint(
  dispute: CoachingDispute,
  sessions: readonly CoachingSessionItem[]
): TutorComplaintModel {
  const meeting = dispute.session_id ? sessions.find((item) => item.id === dispute.session_id) : undefined;
  const closedNote = CLOSED_NOTES[dispute.status] ?? null;
  return {
    title: coachingDisputeCategoryLabel(dispute.category),
    whenLabel: coachingDateTimeLabel(dispute.submitted_at),
    statusLabel: coachingDisputeStatusLabel(dispute.status),
    session: dispute.session_id
      ? {
          label: meeting ? `${meeting.sequence_number}. görüşme · ${coachingDateTimeLabel(meeting.scheduled_start)}` : null,
          href: `/session/coaching/${dispute.session_id}/summary`,
        }
      : null,
    path: buildPath(dispute.status),
    steps: dispute.timeline.map((step) => ({
      when: coachingDateTimeLabel(step.created_at),
      text: step.participant_message || "Süreç güncellemesi",
    })),
    result: dispute.determination
      ? {
          meritLabel: coachingDisputeMeritLabel(dispute.determination.merit),
          whenLabel: coachingDateTimeLabel(dispute.determination.determined_at),
        }
      : null,
    evidence: dispute.evidence.map((item) => ({ id: item.id, name: item.original_name })),
    replies: dispute.tutor_responses.map((reply) => ({
      when: coachingDateTimeLabel(reply.created_at),
      body: reply.body,
    })),
    reply: { open: closedNote === null, closedNote },
  };
}
