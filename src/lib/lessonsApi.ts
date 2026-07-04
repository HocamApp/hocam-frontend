import api from "./api";
import { LessonRequest, Booking } from "@/types";

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

export async function fetchLessonRequests(): Promise<LessonRequest[]> {
  const response = await api.get<LessonRequest[]>("/lesson-requests/");
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

export async function updateLessonRequestStatus(
  lessonRequestId: string,
  status: "accepted" | "declined"
): Promise<LessonRequest> {
  const response = await api.patch<LessonRequest>(
    `/lesson-requests/${lessonRequestId}/status/`,
    { status }
  );
  return response.data;
}

export async function fetchBookings(): Promise<Booking[]> {
  const response = await api.get<Booking[]>("/bookings/");
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
