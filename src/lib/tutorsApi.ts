import api from "./api";
import { TutorProfile, Subject, Review } from "@/types";

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
}

export async function fetchTutors(
  filters: TutorFilters = {}
): Promise<TutorProfile[]> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.append(key, value);
    }
  });
  const response = await api.get<TutorProfile[]>(`/tutors/?${params.toString()}`);
  return response.data;
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
  const response = await api.get<Review[]>(`/tutors/${tutorId}/reviews/`);
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
