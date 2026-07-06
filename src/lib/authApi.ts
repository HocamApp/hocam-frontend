import api from "./api";
import {
  AuthResponse,
  GoogleAuthResponse,
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
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/token/", {
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

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  password_confirm: string;
}

/**
 * Change password for the already-authenticated user. The backend rotates the
 * auth token (single-token DRF auth) — callers must adopt the returned token
 * via AuthProvider's setAuth so the current session stays logged in while any
 * other session using the old token is signed out.
 */
export async function changePassword(
  data: ChangePasswordPayload
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/change-password/", data);
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
