import api from "./api";
import Cookies from "js-cookie";
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
  notice_code?: string;
  notice_version?: string;
  notice_acknowledged?: true;
}

export async function googleAuth(
  payload: GoogleAuthPayload
): Promise<GoogleAuthResponse> {
  const response = await api.post<GoogleAuthResponse>("/auth/google/", payload);
  return response.data;
}

export async function registerUser(
  data: RegisterRequest
): Promise<AuthResponse | RegisterStartResponse> {
  const response = await api.post<AuthResponse | RegisterStartResponse>(
    "/auth/register/",
    data
  );
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
  // An explicit login starts a fresh session. Clearing these before the
  // request prevents stale normal or impersonation credentials from
  // interfering with the public token endpoint.
  Cookies.remove("admin_impersonation_token");
  Cookies.remove("auth_token");

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

/* ------------------------------------------------------------------ */
/* Account deletion + retention offer                                  */
/* ------------------------------------------------------------------ */

export interface DeletionIssue {
  code: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface RetentionOfferCampaign {
  discount_percent: number;
  plan_codes: string[];
  validity_hours: number;
}

export interface DeletionPrecheck {
  blockers: DeletionIssue[];
  warnings: DeletionIssue[];
  retention_offer: null | {
    eligible: true;
    campaign: RetentionOfferCampaign;
  };
}

export interface AccountDeletionRequestResult {
  id: string;
  status: "scheduled" | "offboarding";
  scheduled_deletion_at?: string;
}

export type AccountDeletionStatus =
  | { active: false }
  | {
      active: true;
      id: string;
      role: "student" | "tutor";
      status: "scheduled" | "blocked" | "offboarding" | "ready_for_erasure";
      scheduled_deletion_at: string;
      can_republish?: boolean;
      started_actions?: { type: string; label: string; reason: string }[];
    };

export interface TutorDeletionPrecheck {
  blockers: DeletionIssue[];
  warnings: DeletionIssue[];
  offboarding_preview: DeletionIssue[];
}

export interface TutorDeletionCancelResult {
  cancelled: boolean;
  can_republish: boolean;
  started_actions: { type: string; label: string; reason: string }[];
}

/**
 * Pre-flight check before starting the account deletion flow: lists blockers
 * (must be resolved first), warnings (can be acknowledged) and, for eligible
 * students, a one-time retention offer campaign.
 */
export async function fetchDeletionPrecheck(): Promise<DeletionPrecheck> {
  const response = await api.get<DeletionPrecheck>("/auth/account/deletion/precheck/");
  return response.data;
}

/** Sends a 6-digit confirmation code to the account email. */
export async function requestDeletionOtp(): Promise<{ detail: string }> {
  const response = await api.post<{ detail: string }>(
    "/auth/account/deletion/otp/request/"
  );
  return response.data;
}

/** Verifies the 6-digit deletion code; the backend responds 400 on a wrong/expired code. */
export async function confirmDeletionOtp(code: string): Promise<{ detail: string }> {
  const response = await api.post<{ detail: string }>(
    "/auth/account/deletion/otp/confirm/",
    { code }
  );
  return response.data;
}

/**
 * Schedules the account for deletion after the OTP step. Each call carries a
 * freshly generated Idempotency-Key, so genuine double-clicks/network replays
 * of the SAME fetch call are safe (browser deduplicates in-flight fetches),
 * and the backend additionally rejects cross-user key collisions.
 */
export async function requestAccountDeletion(
  confirmText: string
): Promise<AccountDeletionRequestResult> {
  const response = await api.post<AccountDeletionRequestResult>(
    "/auth/account/deletion/request/",
    { confirm_text: confirmText },
    { headers: { "Idempotency-Key": crypto.randomUUID() } }
  );
  return response.data;
}

/** Cancels a scheduled/pending account deletion during the grace window. */
export async function cancelAccountDeletion(): Promise<{ detail: string }> {
  const response = await api.post<{ detail: string }>(
    "/auth/account/deletion/cancel/"
  );
  return response.data;
}

/** Current deletion state for the authenticated account (any role). */
export async function fetchDeletionStatus(): Promise<AccountDeletionStatus> {
  const response = await api.get<AccountDeletionStatus>(
    "/auth/account/deletion/status/"
  );
  return response.data;
}

/** Tutor variant of the deletion precheck; includes the offboarding preview. */
export async function fetchTutorDeletionPrecheck(): Promise<TutorDeletionPrecheck> {
  const response = await api.get<TutorDeletionPrecheck>(
    "/tutor/account/deletion/precheck/"
  );
  return response.data;
}

/** Starts the tutor offboarding flow (lessons/earnings resolve before erasure). */
export async function requestTutorAccountDeletion(
  confirmText: string
): Promise<AccountDeletionRequestResult> {
  const response = await api.post<AccountDeletionRequestResult>(
    "/tutor/account/deletion/request/",
    { confirm_text: confirmText },
    { headers: { "Idempotency-Key": crypto.randomUUID() } }
  );
  return response.data;
}

/**
 * Cancels a tutor offboarding. The response tells whether the profile can be
 * republished immediately and which offboarding actions already started (those
 * must resolve before the profile can go live again).
 */
export async function cancelTutorAccountDeletion(): Promise<TutorDeletionCancelResult> {
  const response = await api.post<TutorDeletionCancelResult>(
    "/tutor/account/deletion/cancel/"
  );
  return response.data;
}

/** Puts the tutor profile back on the marketplace after a cancelled offboarding. */
export async function republishTutorProfile(
  payload: { confirm: true }
): Promise<{ detail: string }> {
  const response = await api.post<{ detail: string }>(
    "/tutor/profile/republish/",
    payload
  );
  return response.data;
}

/** Hides the tutor profile from search and stops new bookings (reversible). */
export async function pauseTutorProfile(): Promise<{ detail: string }> {
  const response = await api.post<{ detail: string }>("/tutor/profile/pause/");
  return response.data;
}

/** Reverses pauseTutorProfile(). */
export async function resumeTutorProfile(): Promise<{ detail: string }> {
  const response = await api.post<{ detail: string }>("/tutor/profile/resume/");
  return response.data;
}
