import api from "./api";
import { AuthResponse, LoginRequest, PasswordResetConfirmRequest, PasswordResetRequest, RegisterRequest, User } from "@/types";

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
