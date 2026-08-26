/**
 * Availability: we use GET /api/availability/?tutor={tutorProfileId} to fetch
 * a tutor's availability (backend allows this without auth).
 */
import api from "./api";
import { AvailabilityRule, TutorLaunchProgram, TutorVerification, UniversityEmailVerification } from "@/types";

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
  specific_date?: string;
  is_unavailable?: boolean;
  start_time?: string | null;
  end_time?: string | null;
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

export async function fetchUniversityEmailVerification(): Promise<UniversityEmailVerification> {
  const response = await api.get<UniversityEmailVerification>("/tutor-verification/university-email/");
  return response.data;
}

export async function requestUniversityEmailCode(email: string): Promise<UniversityEmailVerification> {
  const response = await api.post<UniversityEmailVerification>("/tutor-verification/university-email/request/", { email });
  return response.data;
}

export async function confirmUniversityEmailCode(code: string): Promise<UniversityEmailVerification> {
  const response = await api.post<UniversityEmailVerification>("/tutor-verification/university-email/confirm/", { code });
  return response.data;
}

export async function fetchTutorLaunchProgram(): Promise<TutorLaunchProgram> {
  const response = await api.get<TutorLaunchProgram>("/tutor/launch-program/");
  return response.data;
}

export async function updateTutorLaunchProgram(
  payload: Partial<Pick<TutorLaunchProgram, "enabled" | "paused" | "lesson_limit" | "compensation_mode">> & { accept_terms?: boolean }
): Promise<TutorLaunchProgram> {
  const response = await api.patch<TutorLaunchProgram>("/tutor/launch-program/", payload);
  return response.data;
}
