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
