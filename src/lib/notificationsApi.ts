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

export interface TutorStudentNote {
  id: string;
  student: string;
  student_summary: { id: string; name: string; surname: string };
  content: string;
  created_at: string;
  updated_at: string;
}

export async function fetchTutorStudentNotes(studentId: string): Promise<TutorStudentNote[]> {
  const { data } = await api.get<TutorStudentNote[]>(`/notifications/tutor-student-notes/?student=${studentId}`);
  return data;
}

export async function createTutorStudentNote(payload: { student: string; content: string }): Promise<TutorStudentNote> {
  const { data } = await api.post<TutorStudentNote>("/notifications/tutor-student-notes/", payload);
  return data;
}

export async function updateTutorStudentNote(id: string, content: string): Promise<TutorStudentNote> {
  const { data } = await api.patch<TutorStudentNote>(`/notifications/tutor-student-notes/${id}/`, { content });
  return data;
}

export async function deleteTutorStudentNote(id: string): Promise<void> {
  await api.delete(`/notifications/tutor-student-notes/${id}/`);
}
