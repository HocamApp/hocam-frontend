import api from "./api";
import type {
  ConfirmLearningActivityPayload,
  LearningDashboardResponse,
  LearningGoalTemplate,
  StudentGoal,
  StudentMilestone,
  StudentMilestoneStatus,
  StudentNote,
} from "@/types";

export interface CreateStudentGoalPayload {
  template?: string | null;
  title?: string;
  description?: string;
  target_date?: string | null;
}

export interface UpdateStudentMilestonePayload {
  status?: StudentMilestoneStatus;
  progress?: number;
}

export interface CreateStudentNotePayload {
  goal?: string | null;
  milestone?: string | null;
  title: string;
  body: string;
  tag?: string;
  is_pinned?: boolean;
}

export async function fetchLearningDashboard(): Promise<LearningDashboardResponse> {
  const response = await api.get<LearningDashboardResponse>("/learning/dashboard/");
  return response.data;
}

export async function fetchLearningGoalTemplates(): Promise<LearningGoalTemplate[]> {
  const response = await api.get<LearningGoalTemplate[]>("/learning/goal-templates/");
  return response.data;
}

export async function createStudentGoal(
  payload: CreateStudentGoalPayload
): Promise<StudentGoal> {
  const response = await api.post<StudentGoal>("/learning/goals/", payload);
  return response.data;
}

export async function updateStudentMilestone(
  milestoneId: string,
  payload: UpdateStudentMilestonePayload
): Promise<StudentMilestone> {
  const response = await api.patch<StudentMilestone>(
    `/learning/milestones/${milestoneId}/`,
    payload
  );
  return response.data;
}

export async function createStudentNote(
  payload: CreateStudentNotePayload
): Promise<StudentNote> {
  const response = await api.post<StudentNote>("/learning/notes/", payload);
  return response.data;
}

export async function updateStudentNote(
  noteId: string,
  payload: Partial<CreateStudentNotePayload> & { is_pinned?: boolean }
): Promise<StudentNote> {
  const response = await api.patch<StudentNote>(
    `/learning/notes/${noteId}/`,
    payload
  );
  return response.data;
}

export async function deleteStudentNote(noteId: string): Promise<void> {
  await api.delete(`/learning/notes/${noteId}/`);
}

export async function confirmLearningActivity(
  activityId: string,
  payload: ConfirmLearningActivityPayload
): Promise<unknown> {
  const response = await api.post(
    `/learning/activities/${activityId}/confirm/`,
    payload
  );
  return response.data;
}
