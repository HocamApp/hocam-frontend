import api from "./api";
import type {
  ConfirmLearningActivityPayload,
  LearningDashboardResponse,
  LearningGoalTemplate,
  LearningTopic,
  LessonTopicCheckIn,
  LessonTopicCheckInPayload,
  StudentGoal,
  StudentMilestone,
  StudentMilestoneStatus,
  StudentNote,
  TutorLearningPlanInput,
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

export async function fetchLearningTopics(): Promise<LearningTopic[]> {
  const response = await api.get<LearningTopic[]>("/learning/topics/");
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

export async function upsertLessonTopicCheckIn(
  bookingId: string,
  payload: LessonTopicCheckInPayload
): Promise<LessonTopicCheckIn> {
  const response = await api.put<LessonTopicCheckIn>(
    `/learning/bookings/${bookingId}/lesson-check-in/`,
    payload
  );
  return response.data;
}

export async function fetchTutorLessonTopicCheckIns(
  studentId: string
): Promise<LessonTopicCheckIn[]> {
  const response = await api.get<LessonTopicCheckIn[]>(
    "/learning/lesson-check-ins/",
    { params: { student: studentId } }
  );
  return response.data;
}

export async function fetchTutorLearningPlans(studentId: string): Promise<StudentGoal[]> {
  const response = await api.get<StudentGoal[]>("/learning/tutor-plans/", {
    params: { student: studentId },
  });
  return response.data;
}

export async function createTutorLearningPlan(
  payload: TutorLearningPlanInput
): Promise<StudentGoal> {
  const response = await api.post<StudentGoal>("/learning/tutor-plans/", payload);
  return response.data;
}

export async function proposeTutorLearningPlan(goalId: string): Promise<StudentGoal> {
  const response = await api.post<StudentGoal>(`/learning/tutor-plans/${goalId}/propose/`);
  return response.data;
}

export async function respondToLearningPlan(
  goalId: string,
  payload: { action: "accept" | "request_correction" | "pause" | "archive"; reason?: string }
): Promise<StudentGoal> {
  const response = await api.post<StudentGoal>(`/learning/goals/${goalId}/respond/`, payload);
  return response.data;
}
