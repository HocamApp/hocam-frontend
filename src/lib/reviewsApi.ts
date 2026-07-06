import api from "./api";
import { Review } from "@/types";

// The overall rating is computed server-side from the four criteria.
export interface CreateReviewPayload {
  booking: string;
  clarity_rating: number;
  preparation_rating: number;
  progress_rating: number;
  confidence_rating: number;
  comment?: string;
}

export async function createReview(
  payload: CreateReviewPayload
): Promise<Review> {
  const response = await api.post<Review>("/reviews/", payload);
  return response.data;
}
