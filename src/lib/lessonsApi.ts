import axios from "axios";
import api from "./api";
import {
  LessonRequest,
  Booking,
  LessonArtifact,
  LessonSessionState,
  TutorRecurringSlotsResponse,
  TutorSlotsResponse,
} from "@/types";
import { syncServerClock } from "./serverClock";

export interface LearningContextPayload {
  learning_goal_id?: string;
  learning_milestone_id?: string;
  learning_topic_id?: string | null;
}

export interface CreateBookingPayload extends LearningContextPayload {
  tutor: string;
  subject: string;
  start_time: string;
  duration_minutes: number;
  lesson_request?: string;
  is_trial?: boolean;
  package_purchase_id?: string;
}

export async function createBooking(
  payload: CreateBookingPayload
): Promise<Booking> {
  const response = await api.post<Booking>("/bookings/", payload);
  return response.data;
}

export interface CreateLessonRequestPayload extends LearningContextPayload {
  tutor: string;
  subject: string;
  message: string;
}

export async function createLessonRequest(
  payload: CreateLessonRequestPayload
): Promise<LessonRequest> {
  const response = await api.post<LessonRequest>("/lesson-requests/", payload);
  return response.data;
}

export async function withdrawLessonRequest(
  lessonRequestId: string
): Promise<LessonRequest> {
  const response = await api.patch<LessonRequest>(
    `/lesson-requests/${lessonRequestId}/status/`,
    { status: "declined" }
  );
  return response.data;
}

export async function fetchBookings(): Promise<Booking[]> {
  const response = await api.get<Booking[]>("/bookings/");
  return response.data;
}

/**
 * Bookable start times per calendar day, computed on the server.
 *
 * Replaces deriving the list in the browser from availability rules minus
 * bookings. That computation could only see lessons, so a slot occupied by
 * the tutor's private time off or by a coaching session looked free and was
 * then refused by POST /bookings/. The endpoint asks the cross-domain busy
 * registry, so what it offers is what will be accepted.
 *
 * Times are Istanbul wall clock, matching what the booking form posts back.
 */
export async function fetchTutorSlots(
  tutorId: string,
  params: { start: string; end: string; durationMinutes: number }
): Promise<TutorSlotsResponse> {
  const response = await api.get<TutorSlotsResponse>(`/tutors/${tutorId}/slots/`, {
    params: {
      start: params.start,
      end: params.end,
      duration: params.durationMinutes,
    },
  });
  return response.data;
}

/**
 * Weekly (weekday, time) candidates for a package term, each carrying how
 * many of its occurrences across the term are free. A package is bought as
 * "N lessons a week for D days", so the checkout question is whether a
 * weekday and time works week after week, not whether one date is open.
 */
export async function fetchTutorRecurringSlots(
  tutorId: string,
  params: { start?: string; termDays: number; durationMinutes: number }
): Promise<TutorRecurringSlotsResponse> {
  const response = await api.get<TutorRecurringSlotsResponse>(
    `/tutors/${tutorId}/recurring-slots/`,
    {
      params: {
        ...(params.start ? { start: params.start } : {}),
        duration_days: params.termDays,
        duration: params.durationMinutes,
      },
    }
  );
  return response.data;
}

export async function updateBookingStatus(
  bookingId: string,
  status: "confirmed" | "completed" | "cancelled"
): Promise<Booking> {
  if (status === "cancelled") {
    const response = await api.post<Booking>(`/bookings/${bookingId}/cancel/`);
    return response.data;
  }

  const response = await api.patch<Booking>(
    `/bookings/${bookingId}/status/`,
    { status }
  );
  return response.data;
}

export function getBookingErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback;
  const detail = error.response?.data?.detail;
  if (typeof detail !== "string" || !detail.trim()) return fallback;
  if (detail.includes("Past bookings cannot be confirmed")) {
    return "Ders saati geçmiş bir rezervasyon onaylanamaz.";
  }
  if (detail.includes("cannot be cancelled after the lesson starts")) {
    return "Ders başladıktan sonra rezervasyon iptal edilemez.";
  }
  if (detail.includes("Only pending or confirmed bookings can be cancelled")) {
    return "Bu rezervasyon artık iptal edilemez.";
  }
  return detail;
}

export interface SessionToken {
  token: string;
  room: string;
  domain: string;
  server_time?: string;
}

export async function fetchSessionToken(
  bookingId: string
): Promise<SessionToken> {
  const sentAt = Date.now();
  const response = await api.get<SessionToken>(
    `/bookings/${bookingId}/session-token/`
  );
  // Every response carrying the server's clock corrects ours, so countdowns
  // elsewhere in the app stop drifting too. This does not make the browser
  // authoritative about anything — this very endpoint is the thing that
  // decides whether the lesson may be joined.
  if (response.data.server_time) {
    syncServerClock(response.data.server_time, sentAt, Date.now());
  }
  return response.data;
}

/**
 * Compact live-session state plus the local wall-clock times bracketing the
 * request, so the caller can estimate the server clock offset from the midpoint
 * (see computeServerOffsetMs in lessonSessionState).
 */
export interface LessonSessionStateResult {
  state: LessonSessionState;
  localRequestStartMs: number;
  localRequestEndMs: number;
}

export async function fetchLessonSessionState(
  bookingId: string
): Promise<LessonSessionStateResult> {
  const localRequestStartMs = Date.now();
  const response = await api.get<LessonSessionState>(
    `/bookings/${bookingId}/session-state/`
  );
  const localRequestEndMs = Date.now();
  if (response.data.server_time) {
    syncServerClock(
      response.data.server_time,
      localRequestStartMs,
      localRequestEndMs
    );
  }
  return {
    state: response.data,
    localRequestStartMs,
    localRequestEndMs,
  };
}

export type EarlyEndDecision = "accept" | "continue";

/** Student answers a pending tutor early-end request. */
export async function respondToEarlyEnd(
  bookingId: string,
  decision: EarlyEndDecision,
  version: number
): Promise<Booking> {
  const response = await api.post<Booking>(
    `/bookings/${bookingId}/respond-early-end/`,
    { decision, version }
  );
  return response.data;
}

/** Tutor withdraws a pending early-end request. */
export async function cancelEarlyEndRequest(
  bookingId: string,
  version: number
): Promise<Booking> {
  const response = await api.post<Booking>(
    `/bookings/${bookingId}/cancel-early-end/`,
    { version }
  );
  return response.data;
}

export async function fetchBookingArtifacts(
  bookingId: string
): Promise<LessonArtifact[]> {
  const response = await api.get<LessonArtifact[]>(
    `/bookings/${bookingId}/artifacts/`
  );
  return response.data;
}

/** Student approves an awaiting_confirmation lesson → completed (irreversible). */
export async function confirmBooking(bookingId: string): Promise<Booking> {
  const response = await api.post<Booking>(`/bookings/${bookingId}/confirm/`);
  return response.data;
}

export type DisputeCategory =
  | "tutor_no_show"
  | "technical_issue"
  | "interrupted"
  | "conduct"
  | "other";

export interface DisputeBookingPayload {
  category: DisputeCategory;
  description: string;
}

/**
 * Student reports a problem with a lesson, halting the 24h auto-confirm.
 * Works from two states: awaiting_confirmation (normal flow), and completed
 * with completion_source=tutor within the 24h post-completion window (a
 * tutor-reported student absence the student wants to contest).
 */
export async function disputeBooking(
  bookingId: string,
  payload: DisputeBookingPayload
): Promise<Booking> {
  const response = await api.post<Booking>(
    `/bookings/${bookingId}/dispute/`,
    payload
  );
  return response.data;
}

/** Authenticated fallback attendance signal, sent every 60s while in-session. */
export async function sendBookingHeartbeat(bookingId: string): Promise<void> {
  await api.post(`/bookings/${bookingId}/heartbeat/`);
}

/**
 * "Dersi bitir": the tutor opens a request to end an in-progress lesson early.
 * The booking stays in_progress and the student is prompted to accept
 * (→ awaiting_confirmation) or continue (→ declined). Tutor-only.
 */
export async function requestEarlyEnd(bookingId: string): Promise<Booking> {
  const response = await api.post<Booking>(
    `/bookings/${bookingId}/request-early-end/`
  );
  return response.data;
}
