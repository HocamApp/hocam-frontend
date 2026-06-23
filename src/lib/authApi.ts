import api from "./api";
import { AuthResponse, LoginRequest, RegisterRequest, User } from "@/types";

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

export async function requestPasswordReset(email: string): Promise<void> {
  await api.post("/auth/password-reset/", { email });
}

export async function confirmPasswordReset(data: {
  uid: string;
  token: string;
  new_password: string;
  password_confirm: string;
}): Promise<void> {
  await api.post("/auth/password-reset-confirm/", data);
}
