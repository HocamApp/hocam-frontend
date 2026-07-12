import api from "./api";
import {
  TutorProfile,
  Subject,
  Review,
  SubjectRating,
  TutorReviewSummary,
  PaginatedResponse,
} from "@/types";

export interface CreateTutorProfilePayload {
  name: string;
  surname: string;
  university: string;
  department: string;
  yks_rank: number;
  hourly_price: string;
  bio: string;
  subject_ids: string[];
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
}

// Backend may still return a plain array during a deploy/cache lag instead of
// the paginated { count, next, previous, results } shape; normalize to paginated.
function normalizeTutorsResponse(
  data: PaginatedResponse<TutorProfile> | TutorProfile[]
): PaginatedResponse<TutorProfile> {
  if (Array.isArray(data)) {
    return { count: data.length, next: null, previous: null, results: data };
  }
  return data;
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

export async function fetchTutorById(id: string): Promise<TutorProfile> {
  const response = await api.get<TutorProfile>(`/tutors/${id}/`);
  return response.data;
}

export async function fetchTutorReviews(tutorId: string): Promise<Review[]> {
  const response = await api.get<PaginatedResponse<Review>>(
    `/tutors/${tutorId}/reviews/?page_size=100`
  );
  return response.data.results;
}

export async function fetchTutorReviewsPage(
  tutorId: string,
  page: number
): Promise<PaginatedResponse<Review>> {
  const response = await api.get<PaginatedResponse<Review>>(
    `/tutors/${tutorId}/reviews/?page=${page}`
  );
  return response.data;
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
  return response.data;
}

export async function fetchMyTutorProfile(): Promise<TutorProfile> {
  const response = await api.get<TutorProfile>("/tutors/me/");
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
  university?: string;
  department?: string;
  yks_rank?: number;
  subject_ids?: string[];
}

export async function updateMyTutorProfile(
  payload: UpdateTutorProfilePayload
): Promise<TutorProfile> {
  const response = await api.patch<TutorProfile>("/tutors/me/", payload);
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
