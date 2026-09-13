import api from "./api";
import type { PendingReviewItem } from "@/types";

export async function fetchPendingReviews(): Promise<PendingReviewItem[]> {
  const response = await api.get<PendingReviewItem[]>("/profile/reviews/pending/");
  return response.data;
}
