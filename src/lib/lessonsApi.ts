import api from "./api";
import {
  LessonRequest,
  Booking,
  BookingQuestion,
  BusyInterval,
  LessonArtifact,
} from "@/types";

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
 * Busy intervals (pending/confirmed bookings only) for a tutor within a date
 * range — used to hide already-booked slots in BookingModal. Deliberately
 * privacy-minimal: only start_time/end_time, per the backend contract.
 */
export async function fetchTutorBusyIntervals(
  tutorId: string,
  start: string,
  end: string
): Promise<BusyInterval[]> {
  const response = await api.get<BusyInterval[]>(
    `/bookings/busy/?tutor=${tutorId}&start=${start}&end=${end}`
  );
  return response.data;
}

export async function updateBookingStatus(
  bookingId: string,
  status: "confirmed" | "completed" | "cancelled"
): Promise<Booking> {
  const response = await api.patch<Booking>(
    `/bookings/${bookingId}/status/`,
    { status }
  );
  return response.data;
}

export interface SessionToken {
  token: string;
  room: string;
  domain: string;
}

export async function fetchSessionToken(
  bookingId: string
): Promise<SessionToken> {
  const response = await api.get<SessionToken>(
    `/bookings/${bookingId}/session-token/`
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

export async function fetchBookingQuestions(
  bookingId: string
): Promise<BookingQuestion[]> {
  const response = await api.get<BookingQuestion[]>(
    `/bookings/${bookingId}/questions/`
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
