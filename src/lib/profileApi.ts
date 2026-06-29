import api from "./api";
import { ProfileMeResponse, UserPreferences } from "@/types";

export interface UpdateProfilePayload {
  preferences?: Partial<UserPreferences>;
  profile?: Record<string, unknown>;
}

export async function fetchProfileMe(): Promise<ProfileMeResponse> {
  const response = await api.get<ProfileMeResponse>("/profile/me/");
  return response.data;
}

export async function updateProfileMe(
  payload: UpdateProfilePayload
): Promise<ProfileMeResponse> {
  const response = await api.patch<ProfileMeResponse>("/profile/me/", payload);
  return response.data;
}

/** Fetch the authenticated user's own account/profile data for download. */
export async function exportMyData(): Promise<Record<string, unknown>> {
  const response = await api.get<Record<string, unknown>>("/profile/export/");
  return response.data;
}
