import api from "./api";
import {
  ProfileMeResponse,
  ProfileStudent,
  StudentLearningProfileSummary,
  StudentQuestionPerformance,
  UserPreferences,
} from "@/types";

export interface UpdateProfilePayload {
  preferences?: Partial<UserPreferences>;
  profile?: Record<string, unknown>;
}

export async function fetchProfileMe(): Promise<ProfileMeResponse> {
  const response = await api.get<ProfileMeResponse>("/profile/me/");
  return response.data;
}

export async function fetchStudentLearningProfile(): Promise<StudentLearningProfileSummary> {
  const response = await api.get<StudentLearningProfileSummary>(
    "/profile/learning-summary/"
  );
  return response.data;
}

export async function fetchStudentQuestionPerformance(): Promise<StudentQuestionPerformance> {
  const response = await api.get<StudentQuestionPerformance>(
    "/profile/question-performance/"
  );
  return response.data;
}

export async function updateProfileMe(
  payload: UpdateProfilePayload
): Promise<ProfileMeResponse> {
  const response = await api.patch<ProfileMeResponse>("/profile/me/", payload);
  return response.data;
}

export async function uploadStudentProfileAvatar(
  file: File
): Promise<ProfileStudent> {
  const formData = new FormData();
  formData.append("avatar", file);

  const response = await api.post<ProfileStudent>("/profile/me/avatar/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function selectStudentAnonymousAvatar(
  avatarKey: string
): Promise<ProfileStudent> {
  const response = await api.patch<ProfileStudent>("/profile/me/avatar-choice/", {
    avatar_key: avatarKey,
  });
  return response.data;
}

/** Fetch the authenticated user's own account/profile data for download. */
export async function exportMyData(): Promise<Record<string, unknown>> {
  const response = await api.get<Record<string, unknown>>("/profile/export/");
  return response.data;
}
