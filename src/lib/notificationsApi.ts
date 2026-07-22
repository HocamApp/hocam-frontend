import api from "./api";
import type {
  Notification,
  NotificationSummary,
  TutorStudentMaterial,
  TutorStudentMaterialAccess,
  TutorStudentMaterialDeleteResult,
  TutorStudentNote,
} from "@/types/api";

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

export async function fetchTutorStudentMaterials(studentId: string): Promise<TutorStudentMaterial[]> {
  const { data } = await api.get<TutorStudentMaterial[]>(`/notifications/tutor-student-materials/?student=${studentId}`);
  return data;
}

export async function uploadTutorStudentMaterial(studentId: string, file: File, onProgress?: (percent: number) => void): Promise<TutorStudentMaterial> {
  const formData = new FormData();
  formData.append("student", studentId);
  formData.append("file", file);
  const { data } = await api.post<TutorStudentMaterial>(
    "/notifications/tutor-student-materials/",
    formData,
    {
      headers: { "Content-Type": undefined },
      onUploadProgress: (event) => {
        if (!event.total || !onProgress) return;
        onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
      },
    }
  );
  return data;
}

export async function fetchTutorStudentMaterialAccess(
  id: string,
  disposition: "inline" | "attachment"
): Promise<TutorStudentMaterialAccess> {
  const { data } = await api.get<TutorStudentMaterialAccess>(
    `/notifications/tutor-student-materials/${id}/access-url/?disposition=${disposition}`
  );
  return data;
}

export async function deleteTutorStudentMaterial(id: string): Promise<TutorStudentMaterialDeleteResult> {
  const response = await api.delete(`/notifications/tutor-student-materials/${id}/`);
  return response.status === 202 ? { status: "delete_pending" } : { status: "deleted" };
}
