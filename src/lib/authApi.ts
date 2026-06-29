import api from "./api";
import { AuthResponse, GoogleAuthResponse, LoginRequest, PasswordResetConfirmRequest, PasswordResetRequest, RegisterRequest, User } from "@/types";

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
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/register/", data);
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
