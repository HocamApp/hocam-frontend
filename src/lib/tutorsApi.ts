import api from "./api";
import {
  TutorProfile,
  Subject,
  Review,
  SubjectRating,
  TutorReviewSummary,
  PaginatedResponse,
  TutorTeachingStyle,
  TutorTeachingAttribute,
  TutorSavedSearch,
} from "@/types";
import {
  applyDemoTutorPresentation,
  applyDemoTutorReviewPresentation,
  applyDemoTutorReviewSummaryPresentation,
} from "./demoTutorPresentation";

export interface CreateTutorProfilePayload {
  name: string;
  surname: string;
  university: string;
  department: string;
  yks_rank: number;
  hourly_price: string;
  bio: string;
  subject_ids: string[];
  teaching_attribute_codes: string[];
}

export interface TutorEducationOption {
  university: string;
  departments: string[];
}

// Profile-related reasons: visible to any user who can view the tutor.
// Lesson-related reasons: only available to students who have taken a lesson
// or purchased a package with the tutor (server enforces this).
export type TutorReportReason =
  | "inappropriate_photo"
  | "inappropriate_profile_text"
  | "misleading_profile"
  | "excessive_price"
  | "other"
  | "inappropriate_conduct"
  | "harassment"
  | "lesson_not_delivered";

export async function createTutorReport(
  tutorId: string,
  payload: { reason: TutorReportReason; description?: string }
): Promise<void> {
  await api.post(`/tutors/${tutorId}/report/`, payload);
}

export interface TutorFilters {
  search?: string;
  subject?: string;
  exam_type?: string;
  university?: string;
  min_rating?: string;
  min_price?: string;
  max_price?: string;
  is_verified?: string;
  yks_rank_max?: string;
  ordering?: string;
  availability_day?: string;
  availability_time?: string;
  online?: string;
  teaching_attributes?: string;
  topic?: string;
  has_coaching?: string;
  free_coaching?: string;
}

export async function fetchTeachingAttributes(): Promise<TutorTeachingAttribute[]> {
  const response = await api.get<TutorTeachingAttribute[]>("/tutors/teaching-attributes/");
  return response.data;
}

// Backend may still return a plain array during a deploy/cache lag instead of
// the paginated { count, next, previous, results } shape; normalize to paginated.
function normalizeTutorsResponse(
  data: PaginatedResponse<TutorProfile> | TutorProfile[]
): PaginatedResponse<TutorProfile> {
  if (Array.isArray(data)) {
    return {
      count: data.length,
      next: null,
      previous: null,
      results: data.map(applyDemoTutorPresentation),
    };
  }
  return { ...data, results: data.results.map(applyDemoTutorPresentation) };
}

export async function fetchTutors(
  filters: TutorFilters = {},
  page = 1,
  pageSize = 8
): Promise<PaginatedResponse<TutorProfile>> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.append(key, value);
    }
  });
  params.set("page", String(page));
  params.set("page_size", String(pageSize));
  const response = await api.get<PaginatedResponse<TutorProfile> | TutorProfile[]>(
    `/tutors/?${params.toString()}`
  );
  return normalizeTutorsResponse(response.data);
}

export async function fetchSubjects(): Promise<Subject[]> {
  const response = await api.get<Subject[]>("/subjects/");
  return response.data;
}

export async function fetchTutorEducationOptions(): Promise<TutorEducationOption[]> {
  const response = await api.get<TutorEducationOption[]>(
    "/tutors/education-options/"
  );
  return response.data;
}

export async function fetchTutorById(id: string): Promise<TutorProfile> {
  const response = await api.get<TutorProfile>(`/tutors/${id}/`);
  return applyDemoTutorPresentation(response.data);
}

export async function fetchTutorSavedSearches(): Promise<TutorSavedSearch[]> {
  const response = await api.get<TutorSavedSearch[]>("/matching/saved-searches/");
  return response.data;
}

export async function createTutorSavedSearch(payload: {
  name?: string;
  filters: TutorFilters;
  ordering: string;
}): Promise<TutorSavedSearch> {
  const response = await api.post<TutorSavedSearch>("/matching/saved-searches/", payload);
  return response.data;
}

export async function updateTutorSavedSearch(
  id: string,
  payload: Partial<{ name: string; filters: TutorFilters; ordering: string }>
): Promise<TutorSavedSearch> {
  const response = await api.patch<TutorSavedSearch>(`/matching/saved-searches/${id}/`, payload);
  return response.data;
}

export async function deleteTutorSavedSearch(id: string): Promise<void> {
  await api.delete(`/matching/saved-searches/${id}/`);
}

export async function fetchTutorReviews(tutorId: string): Promise<Review[]> {
  const response = await api.get<PaginatedResponse<Review>>(
    `/tutors/${tutorId}/reviews/?page_size=100`
  );
  return response.data.results.map((review, index) =>
    applyDemoTutorReviewPresentation(tutorId, review, index)
  );
}

export async function fetchTutorReviewsPage(
  tutorId: string,
  page: number
): Promise<PaginatedResponse<Review>> {
  const response = await api.get<PaginatedResponse<Review>>(
    `/tutors/${tutorId}/reviews/?page=${page}`
  );
  return {
    ...response.data,
    results: response.data.results.map((review, index) =>
      applyDemoTutorReviewPresentation(tutorId, review, index)
    ),
  };
}

export async function fetchTutorSubjectRatings(
  tutorId: string
): Promise<SubjectRating[]> {
  const response = await api.get<SubjectRating[]>(
    `/tutors/${tutorId}/subject-ratings/`
  );
  return response.data;
}

export async function fetchTutorReviewSummary(
  tutorId: string
): Promise<TutorReviewSummary> {
  const response = await api.get<TutorReviewSummary>(
    `/tutors/${tutorId}/review-summary/`
  );
  return applyDemoTutorReviewSummaryPresentation(tutorId, response.data);
}

export async function fetchMyTutorProfile(): Promise<TutorProfile> {
  const response = await api.get<TutorProfile>("/tutors/me/");
  return response.data;
}

// ---------------------------------------------------------------------------
// Live-lesson (Jitsi) tutorial — backend is the source of truth for completion
// ---------------------------------------------------------------------------

export interface TutorTutorialProgress {
  required_version: number;
  completed_at: string | null;
  completed_version: number;
  is_required: boolean;
  current_step: string | null;
  completed_steps: string[];
  total_steps: number;
}

export async function fetchTutorialProgress(): Promise<TutorTutorialProgress> {
  const response = await api.get<TutorTutorialProgress>("/tutors/me/tutorial/");
  return response.data;
}

export async function updateTutorialProgress(payload: {
  current_step?: string;
  completed_steps: string[];
}): Promise<TutorTutorialProgress> {
  const response = await api.patch<TutorTutorialProgress>(
    "/tutors/me/tutorial/",
    payload
  );
  return response.data;
}

/** Idempotent: safe to retry on network errors. */
export async function completeTutorial(): Promise<TutorTutorialProgress> {
  const response = await api.post<TutorTutorialProgress>(
    "/tutors/me/tutorial/complete/"
  );
  return response.data;
}

export interface TutorPriceInsight {
  recommended_price: number | null;
  market_range: { low: number | null; high: number | null };
  sample_size: number;
  basis:
    | "same_subjects_similar_rank"
    | "same_subjects"
    | "same_exam_nearest_rank"
    | "insufficient_data";
  commission_rate_bps: number;
}

export async function fetchTutorPriceInsight(
  subjectIds: string[]
): Promise<TutorPriceInsight> {
  const params = new URLSearchParams();
  subjectIds.forEach((subjectId) => params.append("subject_ids", subjectId));
  const query = params.toString();
  const response = await api.get<TutorPriceInsight>(
    `/tutors/me/price-insight/${query ? `?${query}` : ""}`
  );
  return response.data;
}

export async function createTutorProfile(
  payload: CreateTutorProfilePayload
): Promise<TutorProfile> {
  const response = await api.post<TutorProfile>("/tutors/profile/", payload);
  return response.data;
}

export interface UpdateTutorProfilePayload {
  bio?: string;
  hourly_price?: string;
  intro_video_url?: string;
  subject_ids?: string[];
  teaching_styles?: TutorTeachingStyle[];
  teaching_attribute_codes?: string[];
  accepting_new_students?: boolean;
  open_student_slots?: number;
  earliest_start_date?: string | null;
  availability_pause_until?: string | null;
  accepts_trial_lessons?: boolean;
}

export async function updateMyTutorProfile(
  payload: UpdateTutorProfilePayload
): Promise<TutorProfile> {
  const response = await api.patch<TutorProfile>("/tutors/me/", payload);
  return response.data;
}

export async function confirmTutorAvailability(): Promise<TutorProfile> {
  const response = await api.post<TutorProfile>("/tutors/me/availability/confirm/", {});
  return response.data;
}

export async function uploadTutorProfilePicture(
  file: File
): Promise<TutorProfile> {
  const formData = new FormData();
  formData.append("profile_picture", file);
  const response = await api.post<TutorProfile>(
    "/tutors/me/profile-picture/",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data;
}
