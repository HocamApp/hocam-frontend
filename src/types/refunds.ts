/**
 * Refund requests of a lesson package (apps.payments on the backend).
 *
 * Kept out of `api.ts` on purpose: that file is edited by several people at
 * once. `types/index.ts` re-exports everything here, so `import type { ... }
 * from "@/types"` works as it does for the rest.
 *
 * The flow, as the API sees it:
 *
 *   POST /payments/refund-preview/          what a refund would be; changes nothing
 *   POST /payments/refund-requests/         the student confirms those numbers
 *   GET  /payments/refund-requests/         their requests
 *   GET  /payments/refund-requests/{id}/    one request
 *
 * Timestamps in a calculation (`starts_at`) are real instants with an offset,
 * unlike `Booking.start_time`; draw them with `src/lib/instantTime.ts`.
 */

/** Reasons a student can pick. `slot_conflict` is only valid for a package
 * that had hours it could not schedule when it was paid. */
export type RefundReason =
  | "voluntary"
  | "tutor_issue"
  | "technical"
  | "other"
  | "slot_conflict";

/** Reasons a request can carry, including the ones the platform opens itself
 * (a tutor who left) and the legacy one. */
export type RefundRequestReason =
  | RefundReason
  | "plan_expired_leftover"
  | "tutor_left"
  | "verification_revoked"
  | "service_failure";

export type RefundStatus = "requested" | "approved" | "rejected" | "processed";

export type RefundInitiator = "student" | "platform";

/** Why a lesson is in one of the lists of a calculation. */
export type RefundLessonWhy =
  | "lesson_taken"
  | "cancelled_late"
  | "confirmed_and_due"
  | "starts_within_the_window"
  | "still_to_come";

export interface RefundLesson {
  /** ISO instant with an offset (not a booking wall clock). */
  starts_at: string;
  why: RefundLessonWhy | string;
}

/** The working behind an amount, in the student's terms. No booking ids. */
export interface RefundCalculation {
  /** True when nothing was used, so nothing is deducted. */
  full_refund: boolean;
  total_paid: number;
  unit_price: number;
  used_credits: number;
  /** Credits never put on the calendar. */
  unscheduled_credits: number;
  deduction_amount: number;
  refund_amount: number;
  /** Lessons that count as used. */
  used_lessons: RefundLesson[];
  /** Lessons that would be cancelled if the request is approved. */
  cancelled_lessons: RefundLesson[];
  /** A lesson starting within this many hours of the request counts as used. */
  near_window_hours: number;
}

/** Why this student cannot ask for a refund of this package now. */
export type RefundBlockedReason =
  | "already_refunded"
  | "not_paid"
  | "refund_in_progress"
  | "reason_not_applicable"
  | "nothing_to_refund";

export interface RefundPreview {
  purchase_id: string;
  reason: RefundReason;
  eligible: boolean;
  /** Empty when eligible. */
  blocked_reason: RefundBlockedReason | "";
  /** The number of days the student is told to expect an answer within. */
  answer_within_days: number;
  calculation: RefundCalculation | null;
  /** Signed proof of the numbers shown; only present when eligible. */
  token?: string;
  token_valid_for_minutes?: number;
}

export interface RefundPayTRState {
  status: string;
  amount_minor: number | null;
  currency: string | null;
  confirmed_at: string | null;
}

export interface RefundRequest {
  id: string;
  purchase: string;
  student: string;
  reason: RefundRequestReason;
  initiated_by: RefundInitiator;
  status: RefundStatus;
  paytr_refund: RefundPayTRState | null;
  used_credits: number;
  remaining_credits: number;
  deduction_unit_price: number;
  deduction_amount: number;
  refund_amount: number;
  /** What the student wrote when asking. */
  student_note: string;
  /** What the student is told when refused; empty for any other status. */
  rejection_reason: string;
  /** Null for requests made before the working was stored. */
  calculation: RefundCalculation | null;
  /** The date the student is owed an answer by. */
  due_at: string | null;
  decided_at: string | null;
  provider_refunded_at: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  purchase_summary: {
    id: string;
    status: string;
    total_credits: number;
    remaining_credits: number;
    tutor: { id: string; name: string; surname: string };
  };
}

export interface RefundPreviewPayload {
  purchase: string;
  reason: RefundReason;
}

export interface RefundRequestPayload extends RefundPreviewPayload {
  preview_token: string;
  note?: string;
}
