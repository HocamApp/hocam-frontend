/**
 * Availability: we use GET /api/availability/?tutor={tutorProfileId} to fetch
 * a tutor's availability (backend allows this without auth).
 */
import api from "./api";
import { AvailabilityRule, TutorVerification } from "@/types";

export async function fetchAvailability(): Promise<AvailabilityRule[]> {
  const response = await api.get<AvailabilityRule[]>("/availability/");
  return response.data;
}

export async function fetchTutorAvailability(
  tutorProfileId: string
): Promise<AvailabilityRule[]> {
  const response = await api.get<AvailabilityRule[]>(
    `/availability/?tutor=${tutorProfileId}`
  );
  return response.data;
}

export interface CreateAvailabilityPayload {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export async function createAvailabilityRule(
  payload: CreateAvailabilityPayload
): Promise<AvailabilityRule> {
  const response = await api.post<AvailabilityRule>("/availability/", payload);
  return response.data;
}

export async function deleteAvailabilityRule(id: string): Promise<void> {
  await api.delete(`/availability/${id}/`);
}

export async function fetchVerification(): Promise<TutorVerification> {
  const response = await api.get<TutorVerification>("/tutor-verification/");
  return response.data;
}

export async function submitVerification(
  formData: FormData
): Promise<TutorVerification> {
  const response = await api.post<TutorVerification>(
    "/tutor-verification/",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data;
}
