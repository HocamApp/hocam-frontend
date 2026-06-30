import api from "./api";
import {
  AuthResponse,
  GoogleAuthResponse,
  LoginRequest,
  PasswordResetConfirmRequest,
  PasswordResetRequest,
  RegisterConfirmRequest,
  RegisterRequest,
  RegisterStartResponse,
  SecuritySettings,
  User,
} from "@/types";

export interface GoogleAuthPayload {
  credential: string;
  role?: "student" | "tutor";
}

export async function googleAuth(
  payload: GoogleAuthPayload
): Promise<GoogleAuthResponse> {
  const response = await api.post<GoogleAuthResponse>("/auth/google/", payload);
  return response.data;
}

export async function registerUser(
  data: RegisterRequest
): Promise<RegisterStartResponse> {
  const response = await api.post<RegisterStartResponse>("/auth/register/", data);
  return response.data;
}

export async function confirmRegistration(
  data: RegisterConfirmRequest
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/register/confirm/", data);
  return response.data;
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ token: string }> {
  const response = await api.post<{ token: string }>("/auth/token/", {
    username: email,
    password,
  });
  return response.data;
}

export async function fetchCurrentUser(): Promise<User> {
  const response = await api.get<User>("/auth/me/");
  return response.data;
}

export async function fetchMe(): Promise<User> {
  const response = await api.get<User>("/auth/me/");
  return response.data;
}

export async function requestPasswordReset(data: PasswordResetRequest): Promise<void> {
  await api.post("/auth/password-reset/", data);
}

export async function confirmPasswordReset(data: PasswordResetConfirmRequest): Promise<void> {
  await api.post("/auth/password-reset-confirm/", data);
}

export async function fetchSecuritySettings(): Promise<SecuritySettings> {
  const response = await api.get<SecuritySettings>("/auth/security/");
  return response.data;
}

export async function requestEmailVerificationCode(): Promise<{
  detail: string;
  expires_in_seconds?: number;
}> {
  const response = await api.post("/auth/email-verification/request/");
  return response.data;
}

export async function confirmEmailVerificationCode(
  code: string
): Promise<SecuritySettings> {
  const response = await api.post<SecuritySettings>(
    "/auth/email-verification/confirm/",
    { code }
  );
  return response.data;
}

export async function sendPresenceHeartbeat(): Promise<void> {
  await api.post("/auth/presence/");
}

/**
 * Invalidate the user's auth token on the backend (single-token DRF auth), which
 * signs out every device using it. Caller must clear the local cookie afterwards.
 */
export async function logoutAllSessions(): Promise<void> {
  await api.post("/auth/logout-all/");
}

/**
 * Permanently delete the authenticated user's own account. The backend deletes
 * the auth token and the user row (related data via CASCADE). The caller must
 * clear local auth state afterwards — the old token is no longer valid.
 */
export async function deleteMyAccount(): Promise<void> {
  await api.delete("/auth/account/");
}
