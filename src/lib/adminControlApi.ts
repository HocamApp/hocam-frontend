import Cookies from "js-cookie";
import api from "./api";
import type { AdminMonitorResponse, AdminMonitoredBooking, AdminMonitoredPackage, User } from "@/types";

export async function fetchAdminMonitor(): Promise<AdminMonitorResponse> {
  const { data } = await api.get<AdminMonitorResponse>("/admin-control/monitor/");
  return data;
}

export async function startAdminImpersonation(targetUserId: string): Promise<User> {
  const { data } = await api.post<{ impersonation_token: string; expires_at: string; user: User }>(
    "/admin-control/impersonations/",
    { target_user_id: targetUserId }
  );
  Cookies.set("admin_impersonation_token", data.impersonation_token, {
    expires: new Date(data.expires_at),
    secure: window.location.protocol === "https:",
    sameSite: "strict",
  });
  return data.user;
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
