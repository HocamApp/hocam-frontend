import api from "./api";
import { Review } from "@/types";

export interface CreateReviewPayload {
  booking: string;
  rating: number;
  comment: string;
}

export async function createReview(
  payload: CreateReviewPayload
): Promise<Review> {
  const response = await api.post<Review>("/reviews/", payload);
  return response.data;
}
