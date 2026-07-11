import api from "./api";
import type {
  LessonQuestionState,
  LessonQuestionStateUpdate,
  PaginatedResponse,
  QuestionAttemptResult,
  QuestionFilters,
  QuestionMetadata,
  SolvableQuestion,
} from "@/types";

export async function fetchQuestions(
  filters: QuestionFilters = {},
  wrongOnly = false
): Promise<PaginatedResponse<SolvableQuestion>> {
  const response = await api.get<PaginatedResponse<SolvableQuestion>>(
    wrongOnly ? "/questions/wrong/" : "/questions/",
    { params: filters }
  );
  return response.data;
}

export async function fetchQuestion(id: string): Promise<SolvableQuestion> {
  const response = await api.get<SolvableQuestion>(`/questions/${id}/`);
  return response.data;
}

export async function fetchQuestionMetadata(): Promise<QuestionMetadata> {
  const response = await api.get<QuestionMetadata>("/questions/meta/");
  return response.data;
}

export async function submitQuestionAttempt(
  id: string,
  selectedChoice?: string
): Promise<QuestionAttemptResult> {
  const response = await api.post<QuestionAttemptResult>(
    `/questions/${id}/attempts/`,
    { selected_choice: selectedChoice ?? "" }
  );
  return response.data;
}

export async function revealQuestion(id: string): Promise<QuestionAttemptResult> {
  const response = await api.post<QuestionAttemptResult>(`/questions/${id}/reveal/`);
  return response.data;
}

export async function fetchLessonQuestionState(
  bookingId: string
): Promise<LessonQuestionState> {
  const response = await api.get<LessonQuestionState>(
    `/bookings/${bookingId}/question-session/`
  );
  return response.data;
}

export async function updateLessonQuestionState(
  bookingId: string,
  payload: LessonQuestionStateUpdate
): Promise<LessonQuestionState> {
  const response = await api.patch<LessonQuestionState>(
    `/bookings/${bookingId}/question-session/`,
    payload
  );
  return response.data;
}

export async function clearLessonQuestionState(bookingId: string): Promise<void> {
  await api.delete(`/bookings/${bookingId}/question-session/`);
}
