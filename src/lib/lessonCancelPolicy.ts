/**
 * What a tutor may do about a lesson they cannot give, as a pure decision.
 *
 * Mirrors the backend rule (apps/lessons/policy.py `tutor_cancel_lock_window`,
 * enforced in `cancel_booking`): inside 12 hours of the start a tutor cannot
 * cancel a confirmed lesson at all. The student paid for that hour, so the
 * only way out is an emergency request that a staff member decides. The
 * server is the authority; this only decides which button to show, so a tutor
 * is not offered a cancel that will be refused.
 */

export const TUTOR_CANCEL_LOCK_MS = 12 * 60 * 60 * 1000;

export const EMERGENCY_REASON_MIN_LENGTH = 10;
export const EMERGENCY_REASON_MAX_LENGTH = 2000;

export type TutorCancelMode =
  /** Nothing to offer: started, finished, or not a lesson that can be called off. */
  | "none"
  /** A pending request: declining it is always open and never a strike. */
  | "decline"
  /** A confirmed lesson with enough notice: cancel after a confirmation. */
  | "confirm"
  /** A confirmed lesson inside the lock window: only the emergency request. */
  | "emergency";

export function tutorCancelMode({
  status,
  msUntilStart,
}: {
  status: string;
  msUntilStart: number;
}): TutorCancelMode {
  if (!Number.isFinite(msUntilStart) || msUntilStart <= 0) return "none";
  if (status === "pending") return "decline";
  if (status === "confirmed") {
    // Strictly inside the window, exactly like the server.
    return msUntilStart < TUTOR_CANCEL_LOCK_MS ? "emergency" : "confirm";
  }
  return "none";
}

/** An inline message for a reason that is too thin or too long, else null. */
export function emergencyReasonProblem(reason: string): string | null {
  const trimmed = reason.trim();
  if (trimmed.length < EMERGENCY_REASON_MIN_LENGTH) {
    return `Nedenini en az ${EMERGENCY_REASON_MIN_LENGTH} karakterle açıkla.`;
  }
  if (trimmed.length > EMERGENCY_REASON_MAX_LENGTH) {
    return `Neden en fazla ${EMERGENCY_REASON_MAX_LENGTH} karakter olabilir.`;
  }
  return null;
}
