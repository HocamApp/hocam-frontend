import api from "./api";
import { TutorProfile, Subject, Review } from "@/types";

export interface CreateTutorProfilePayload {
  name: string;
  surname: string;
  university: string;
  department: string;
  yks_rank: number;
  yks_exam_type: "SAY" | "SOZ" | "EA" | "DIL";
  hourly_price: string;
  bio: string;
  subject_ids: number[];
  grade: number;
}

export interface TutorFilters {
  subject?: string;
  exam_type?: string;
  university?: string;
  min_rating?: string;
  max_price?: string;
  is_verified?: string;
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
