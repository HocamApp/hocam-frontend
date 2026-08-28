import Cookies from "js-cookie";
import api from "./api";
import type { AdminCoachingQaScenario, AdminMonitorResponse, AdminMonitoredBooking, AdminMonitoredPackage, AdminTutorVerification, AdminTutorVerificationList, User } from "@/types";

function storeImpersonationToken(token: string, expiresAt: string) {
  Cookies.set("admin_impersonation_token", token, {
    expires: new Date(expiresAt),
    secure: window.location.protocol === "https:",
    sameSite: "strict",
  });
}

export async function fetchAdminMonitor(): Promise<AdminMonitorResponse> {
  const { data } = await api.get<AdminMonitorResponse>("/admin-control/monitor/");
  return data;
}

export async function fetchAdminTutorVerifications(
  status?: "pending" | "approved" | "rejected"
): Promise<AdminTutorVerificationList> {
  const { data } = await api.get<AdminTutorVerificationList>("/admin-control/tutor-verifications/", {
    params: status ? { status } : undefined,
  });
  return data;
}

export async function decideAdminTutorVerification(
  id: string,
  payload: {
    status: "approved" | "rejected";
    rejection_reason_code?: string;
    rejection_reason?: string;
  }
): Promise<AdminTutorVerification> {
  const { data } = await api.post<AdminTutorVerification>(
    `/admin-control/tutor-verifications/${id}/decision/`,
    payload
  );
  return data;
}

export async function fetchAdminTutorVerificationPreview(
  id: string,
  documentType: "student_id" | "yks_result"
): Promise<Blob> {
  const { data } = await api.get<Blob>(
    `/admin-control/tutor-verifications/${id}/preview/${documentType}/`,
    { responseType: "blob" }
  );
  return data;
}

export async function startAdminImpersonation(targetUserId: string): Promise<User> {
  const { data } = await api.post<{ impersonation_token: string; expires_at: string; user: User }>(
    "/admin-control/impersonations/",
    { target_user_id: targetUserId }
  );
  storeImpersonationToken(data.impersonation_token, data.expires_at);
  return data.user;
}

export async function startAdminTutorOnboarding(): Promise<User> {
  const { data } = await api.post<{ impersonation_token: string; expires_at: string; user: User }>(
    "/admin-control/tutor-onboarding-sessions/"
  );
  storeImpersonationToken(data.impersonation_token, data.expires_at);
  return data.user;
}

export async function startAdminCoachingQa(): Promise<{
  user: User;
  scenario: AdminCoachingQaScenario;
}> {
  const { data } = await api.post<{
    impersonation_token: string;
    expires_at: string;
    user: User;
    scenario: AdminCoachingQaScenario;
  }>("/admin-control/coaching-qa-scenarios/");
  storeImpersonationToken(data.impersonation_token, data.expires_at);
  return { user: data.user, scenario: data.scenario };
}

export async function activateAdminCoachingQaNoCharge(
  scenarioId: string
): Promise<AdminCoachingQaScenario> {
  const { data } = await api.post<AdminCoachingQaScenario>(
    `/admin-control/coaching-qa-scenarios/${scenarioId}/activate-no-charge/`
  );
  return data;
}

export async function bypassAdminTutorOnboardingVerification(): Promise<void> {
  await api.post("/admin-control/tutor-onboarding-sessions/verification-bypass/");
}

export async function endAdminImpersonation(): Promise<User> {
  // Drop the short-lived target credential before asking the server to end
  // actor-owned sessions. This keeps a stale impersonation from cascading
  // into removal of the administrator's primary auth token.
  Cookies.remove("admin_impersonation_token");
  const { data } = await api.delete<{ user: User }>("/admin-control/impersonations/");
  return data.user;
}

export async function approveAdminTestBooking(id: string): Promise<AdminMonitoredBooking> {
  const { data } = await api.post<AdminMonitoredBooking>(`/admin-control/bookings/${id}/approve/`);
  return data;
}

export async function createAdminPackage(payload: {
  student_id: string;
  tutor_id: string;
  plan_id: string;
}): Promise<AdminMonitoredPackage> {
  const { data } = await api.post<AdminMonitoredPackage>("/admin-control/package-purchases/", payload);
  return data;
}

export async function activateAdminPackage(id: string): Promise<AdminMonitoredPackage> {
  const { data } = await api.post<AdminMonitoredPackage>(`/admin-control/package-purchases/${id}/activate/`);
  return data;
}

export async function cancelAdminPackage(id: string): Promise<AdminMonitoredPackage> {
  const { data } = await api.delete<AdminMonitoredPackage>(`/admin-control/package-purchases/${id}/`);
  return data;
}

export async function markAllAccountsAsTest(): Promise<{ marked_count: number }> {
  const { data } = await api.post<{ marked_count: number }>("/admin-control/test-accounts/mark-all/");
  return data;
}

export async function createAdminBooking(payload: {
  student_id: string;
  tutor_id: string;
  subject_id: string;
  start_time: string;
}): Promise<AdminMonitoredBooking> {
  const { data } = await api.post<AdminMonitoredBooking>("/admin-control/bookings/", payload);
  return data;
}

export async function grantAdminTestCredits(payload: {
  student_id: string;
  tutor_id: string;
  credits: number;
  expires_in_days: number;
}): Promise<void> {
  await api.post("/admin-control/test-credit-grants/", payload);
}

export async function updateAdminTutorTestSettings(
  tutorId: string,
  autoApproveBookings: boolean
): Promise<void> {
  await api.patch(`/admin-control/tutors/${tutorId}/test-settings/`, {
    auto_approve_bookings: autoApproveBookings,
  });
}
