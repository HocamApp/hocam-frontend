import api from "./api";
import type { Notification, NotificationSummary } from "@/types/api";

export async function fetchNotificationSummary(): Promise<NotificationSummary> {
  const { data } = await api.get<NotificationSummary>("/notifications/summary/");
  return data;
}

export async function fetchNotifications(): Promise<Notification[]> {
  const { data } = await api.get<Notification[]>("/notifications/");
  return data;
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.post(`/notifications/${id}/read/`);
}

export async function deleteNotification(id: string): Promise<void> {
  await api.delete(`/notifications/${id}/`);
}

export interface TutorStudentReminder {
  id: string;
  student: string;
  student_summary: { id: string; name: string; surname: string };
  note: string;
  due_at: string;
  notified_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export async function fetchTutorReminders(): Promise<TutorStudentReminder[]> {
  const { data } = await api.get<TutorStudentReminder[]>("/notifications/reminders/");
  return data;
}

export async function createTutorReminder(payload: Pick<TutorStudentReminder, "student" | "note" | "due_at">): Promise<TutorStudentReminder> {
  const { data } = await api.post<TutorStudentReminder>("/notifications/reminders/", payload);
  return data;
}

export async function completeTutorReminder(id: string): Promise<TutorStudentReminder> {
  const { data } = await api.post<TutorStudentReminder>(`/notifications/reminders/${id}/complete/`);
  return data;
}

export async function deleteTutorReminder(id: string): Promise<void> {
  await api.delete(`/notifications/reminders/${id}/`);
}
