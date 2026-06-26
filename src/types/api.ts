export interface User {
  id: string;
  email: string;
  role: "student" | "tutor";
  tutor_profile_id: string | null;
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

export type ExamType = "TYT" | "AYT" | "DGS" | "KPSS";

export interface Subject {
  id: string;
  name: string;
  exam_type: ExamType;
}

export interface GoogleAuthSuccess {
  token: string;
  user: { id: string; email: string; role: "student" | "tutor" };
}

export interface GoogleAuthNeedsRole {
  needs_role: true;
  email: string;
}

export type GoogleAuthResponse = GoogleAuthSuccess | GoogleAuthNeedsRole;

export interface TutorProfile {
  id: string;
  user: string;
  name: string;
  surname: string;
  profile_picture: string;
  intro_video_url: string;
  bio: string;
  university: string;
  department: string;
  yks_rank: number;
  hourly_price: number;
  rating: number;
  total_reviews: number;
  is_verified: boolean;
  is_online: boolean;
  subjects: Subject[];
  created_at: string;
}

export interface LessonRequest {
  id: string;
  student: { id: string; email: string };
  tutor: { id: string; name: string; surname: string };
  subject: Subject;
  message: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  conversation_id?: string | null;
}

export interface Booking {
  id: string;
  student: { id: string; email: string };
  tutor: { id: string; name: string; surname: string };
  subject: Subject;
  start_time: string;
  duration_minutes: number;
  price: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  lesson_request: string | null;
  room_url?: string;
  daily_room_name?: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  lesson_request: string;
  student: string;
  tutor: string;
  created_at: string;
  other_participant?: { id: string; email: string; display_name: string };
  unread_count?: number;
  tutor_profile?: TutorProfile | null;
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
  subject?: Subject;
}

export interface SubjectRating {
  subject: Subject;
  average: number;
  count: number;
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

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  uid: string;
  token: string;
  new_password: string;
  password_confirm: string;
}

export interface UserPreferences {
  dark_mode: boolean;
  notify_messages: boolean;
  notify_lesson_requests: boolean;
  notify_booking_reminders: boolean;
  notify_email: boolean;
}

export interface ProfileStats {
  upcoming_lessons_count: number;
  pending_bookings_count: number;
  pending_reviews_count: number;
}

export interface ProfileTutor {
  id: string;
  name: string;
  surname: string;
  profile_picture: string;
  university: string;
  department: string;
  hourly_price: number;
  intro_video_url: string;
  subjects: Subject[];
  availability: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
  }>;
}

export interface ProfileStudent {
  id: string;
  name: string;
  surname: string;
  grade: string;
  school: string;
  target_exam_type: string;
  target_rank: number | null;
  bio: string;
}

export interface ProfileMeResponse {
  user: { id: string; role: "student" | "tutor" };
  profile: ProfileTutor | ProfileStudent | null;
  preferences: UserPreferences;
  stats: ProfileStats;
}

export type ParticipantRole = "tutor" | "student";

export interface UpcomingLesson {
  id: string;
  subject: Subject;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: string;
  participant_name: string;
  participant_role: ParticipantRole;
  price: number;
  room_url: string;
  can_join: boolean;
}

export interface PendingReservation {
  id: string;
  subject: Subject;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: string;
  participant_name: string;
  participant_role: ParticipantRole;
  price: number;
  can_confirm: boolean;
  can_cancel: boolean;
}

export interface PastLesson {
  id: string;
  subject: Subject;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: string;
  participant_name: string;
  participant_role: ParticipantRole;
  price: number;
  has_review: boolean;
  can_review: boolean;
}

// Extends Booking so it can be passed straight to the existing ReviewModal.
export interface PendingReviewItem extends Booking {
  participant_name: string;
  completed_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: string;
  subject: Subject;
  participant_name: string;
  participant_role: ParticipantRole;
  room_url: string;
}
