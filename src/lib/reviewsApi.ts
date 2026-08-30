import api from "./api";
import { Review } from "@/types";

export interface CreateReviewPayload {
  booking: string;
  rating: number;
  comment?: string;
}

export async function createReview(
  payload: CreateReviewPayload
): Promise<Review> {
  const response = await api.post<Review>("/reviews/", {
    booking: payload.booking,
    // The deployed API still stores four legacy criterion columns. Sending the
    // single overall score to each keeps review creation compatible while the
    // product exposes only one rating.
    clarity_rating: payload.rating,
    preparation_rating: payload.rating,
    progress_rating: payload.rating,
    confidence_rating: payload.rating,
    comment: payload.comment,
  });
  return response.data;
}
