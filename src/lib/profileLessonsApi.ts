import api from "./api";
import {
  PastLesson,
  PendingReservation,
  PendingReviewItem,
  UpcomingLesson,
} from "@/types";

export async function fetchUpcomingLessons(): Promise<UpcomingLesson[]> {
  const response = await api.get<UpcomingLesson[]>("/profile/lessons/upcoming/");
  return response.data;
}

export async function fetchPendingReservations(): Promise<PendingReservation[]> {
  const response = await api.get<PendingReservation[]>(
    "/profile/reservations/pending/"
  );
  return response.data;
}

export async function fetchPastLessons(): Promise<PastLesson[]> {
  const response = await api.get<PastLesson[]>("/profile/lessons/history/");
  return response.data;
}

export async function fetchPendingReviews(): Promise<PendingReviewItem[]> {
  const response = await api.get<PendingReviewItem[]>("/profile/reviews/pending/");
  return response.data;
}
