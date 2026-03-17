export interface User {
  id: string;
  email: string;
  role: "student" | "tutor";
  tutor_profile_id?: string; // present only when role is "tutor"
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  username: string; // email is sent as username per DRF token endpoint
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  password_confirm: string;
  role: "student" | "tutor";
}

export interface Subject {
  id: string;
  name: string;
  exam_type: "TYT" | "AYT";
}

export interface TutorProfile {
  id: string;
  user: string;
  name: string;
  surname: string;
  profile_picture: string | null;
  bio: string;
  university: string;
  department: string;
  yks_rank: number;
  hourly_price: number;
  rating: number;
  total_reviews: number;
  is_verified: boolean;
  subjects: Subject[];
  created_at: string;
}

export interface LessonRequest {
  id: string;
  student: string;
  tutor: string;
  subject: Subject;
  message: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
}

export interface Booking {
  id: string;
  student: string;
  tutor: string;
  subject: Subject;
  start_time: string;
  duration_minutes: number;
  price: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  lesson_request: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  lesson_request: string;
  student: string;
  tutor: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation: string;
  sender: string;
  message_text: string;
  created_at: string;
}

export interface Review {
  id: string;
  booking: string;
  student: string;
  tutor: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AvailabilityRule {
  id: string;
  tutor: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface TutorVerification {
  id: string;
  tutor: string;
  student_id_document: string;
  yks_result_document: string;
  university_email: string;
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
  reviewed_at: string | null;
}

export interface ApiError {
  [field: string]: string[];
}
