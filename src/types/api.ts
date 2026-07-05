export interface User {
  id: string;
  email: string;
  role: "student" | "tutor";
  tutor_profile_id: string | null;
  is_email_verified: boolean;
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

export interface RegisterStartResponse {
  requires_verification: true;
  email: string;
  expires_in_seconds: number;
}

export interface RegisterConfirmRequest {
  email: string;
  code: string;
}

export type ExamType = "TYT" | "AYT" | "DGS" | "KPSS";

export interface Subject {
  id: string;
  name: string;
  exam_type: ExamType;
}

export type LearningLevel = "beginner" | "intermediate" | "advanced";

export type StudentGoalStatus = "active" | "completed" | "paused" | "archived";

export type StudentMilestoneStatus =
  | "not_started"
  | "planned"
  | "in_progress"
  | "pending_confirmation"
  | "completed";

export type LearningActivityStatus =
  | "planned"
  | "pending_confirmation"
  | "confirmed"
  | "cancelled";

export type LearningConfirmationSource = "system" | "tutor" | "student";

export type TutorProgressResult = "low" | "good" | "completed";

export interface ConfirmLearningActivityPayload {
  progress_result: TutorProgressResult;
  tutor_note?: string;
  student_level_after_lesson?: LearningLevel | "";
}

export interface LearningTopic {
  id: string;
  exam_type: string;
  subject_name: string;
  title: string;
  slug: string;
  level: LearningLevel;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LearningMilestoneTemplate {
  id: string;
  goal_template: string;
  topic: string | null;
  title: string;
  slug: string;
  description: string;
  order: number;
  required_confirmed_lessons: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LearningGoalTemplate {
  id: string;
  title: string;
  slug: string;
  exam_type: string;
  subject_name: string;
  level: LearningLevel;
  description: string;
  estimated_milestones: number;
  is_featured: boolean;
  is_active: boolean;
  milestone_templates: LearningMilestoneTemplate[];
  created_at: string;
  updated_at: string;
}

export interface StudentMilestone {
  id: string;
  student: string;
  goal: string;
  template: string | null;
  topic: string | null;
  title: string;
  description: string;
  status: StudentMilestoneStatus;
  progress: number;
  order: number;
  required_confirmed_lessons: number;
  created_at: string;
  updated_at: string;
}

export interface StudentGoal {
  id: string;
  student: string;
  template: string | null;
  title: string;
  description: string;
  status: StudentGoalStatus;
  target_date: string | null;
  milestones: StudentMilestone[];
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface StudentNote {
  id: string;
  student: string;
  goal: string | null;
  milestone: string | null;
  title: string;
  body: string;
  tag: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface LearningProgressEvent {
  id: string;
  student: string;
  goal: string | null;
  milestone: string | null;
  topic: string | null;
  activity: string | null;
  progress_delta: number;
  confirmation_source: LearningConfirmationSource;
  tutor_note: string;
  student_level_after_lesson: LearningLevel | "";
  created_at: string;
}

export interface LearningDashboardStats {
  active_goals_count: number;
  open_milestones_count: number;
  completed_milestones_count: number;
  notes_count: number;
  pending_confirmations_count: number;
  average_progress: number;
  completed_goals_count: number;
  total_progress_events_count: number;
}

export interface NextLearningMilestone {
  id: string;
  goal_id: string;
  goal_title: string;
  topic_id: string | null;
  topic_title: string | null;
  title: string;
  description: string;
  status: StudentMilestoneStatus;
  progress: number;
  required_confirmed_lessons: number;
  cta: {
    label: string;
    query: {
      learning_goal_id: string;
      learning_milestone_id: string;
      learning_topic_id: string | null;
    };
  };
}

export interface PendingLearningConfirmation {
  id: string;
  status: LearningActivityStatus;
  goal: { id: string; title: string } | null;
  milestone: { id: string; title: string; progress: number } | null;
  topic: { id: string; title: string } | null;
  booking: {
    id: string;
    status: string;
    start_time: string;
    tutor: { id: string; name: string; surname: string };
    subject: { id: string; name: string; exam_type: string };
  } | null;
}

export interface LearningDashboardResponse {
  templates: LearningGoalTemplate[];
  goals: StudentGoal[];
  notes: StudentNote[];
  stats: LearningDashboardStats;
  recent_progress: LearningProgressEvent[];
  next_milestones: NextLearningMilestone[];
  pending_confirmations: PendingLearningConfirmation[];
}

export interface LearningContext {
  activity_id: string;
  goal: { id: string; title: string } | null;
  milestone: {
    id: string;
    title: string;
    status: StudentMilestoneStatus;
    progress: number;
  } | null;
  topic: {
    id: string;
    title: string;
    exam_type: string;
    subject_name: string;
  } | null;
  status: LearningActivityStatus;
}

export interface GoogleAuthSuccess {
  token: string;
  user: User;
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
  completed_lessons_count?: number | null;
  is_verified: boolean;
  is_online: boolean;
  last_seen_at?: string | null;
  trial_lesson_eligible?: boolean | null;
  trial_lessons_remaining?: number | null;
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
  learning_context?: LearningContext | null;
}

export interface MessageRequest {
  id: string;
  student: { id: string; email: string };
  tutor: { id: string; name: string; surname: string };
  message: string;
  status: "pending" | "accepted" | "rejected" | "blocked";
  conversation_id?: string | null;
  created_at: string;
  updated_at?: string;
  responded_at?: string | null;
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
  is_trial?: boolean;
  lesson_request: string | null;
  room_url?: string;
  daily_room_name?: string;
  package_purchase?: string | null;
  package_credit_units_used?: number;
  created_at: string;
  learning_context?: LearningContext | null;
}

export interface Conversation {
  id: string;
  lesson_request: string;
  student: string;
  tutor: string;
  created_at: string;
  other_participant?: {
    id: string;
    email: string;
    display_name: string;
    avatar_url?: string | null;
  };
  unread_count?: number;
  tutor_profile?: TutorProfile | null;
}

export interface MessageReplyPreview {
  id: string;
  sender_id: string;
  preview: string;
  is_image: boolean;
}

export interface Message {
  id: string;
  conversation: string;
  sender: string;
  message_text: string;
  image_url?: string;
  created_at: string;
  read_at?: string | null;
  reply_to?: MessageReplyPreview | null;
  is_deleted?: boolean;
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

// GET /api/payments/package-plans/ — ledger-first package foundation (no
// real payment provider yet; see apps.payments on the backend).
export interface PackagePlan {
  id: string;
  name: string;
  lesson_count: number;
  lesson_duration_minutes: number;
  discount_percent: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type PackagePurchaseStatus = "pending" | "paid" | "cancelled" | "refunded";

export interface PackagePurchase {
  id: string;
  student: { id: string; name: string; surname: string };
  tutor: { id: string; name: string; surname: string };
  plan: {
    id: string;
    name: string;
    lesson_count: number;
    lesson_duration_minutes: number;
    discount_percent: number;
  };
  status: PackagePurchaseStatus;
  total_credits: number;
  remaining_credits: number;
  unit_price: number;
  subtotal_price: number;
  discount_amount: number;
  total_price: number;
  created_at: string;
  paid_at: string | null;
}

export interface PaymentLedgerEntry {
  id: string;
  entry_type: string;
  amount: number;
  credit_delta: number;
  description: string;
  created_at: string;
  package_purchase: string | null;
  booking: string | null;
}

export interface CreatePackagePurchasePayload {
  tutor: string;
  plan: string;
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

// GET /api/bookings/busy/ — deliberately minimal: only enough to hide already
// booked slots in the booking UI, never any other booking detail.
export interface BusyInterval {
  start_time: string;
  end_time: string;
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
  rejection_reason?: string;
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

export interface SecuritySettings {
  email: string;
  is_email_verified: boolean;
  last_seen_at: string | null;
}

export interface UserPreferences {
  dark_mode: boolean;
  notify_messages: boolean;
  notify_lesson_requests: boolean;
  notify_booking_reminders: boolean;
  notify_email: boolean;
  language: string;
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
  auto_approve_bookings: boolean;
  is_public: boolean;
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
  avatar_url?: string | null;
  avatar_kind?: "uploaded" | "anonymous" | "" | null;
  avatar_key?: string | null;
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

export interface FavoriteTutor {
  id: string;
  tutor: TutorProfile;
  created_at: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  related_object_type: string;
  related_object_id: string | null;
  created_at: string;
}

export interface NotificationSummary {
  has_unread: boolean;
  unread_count: number;
}

export type SupportTicketCategory =
  | "account"
  | "booking"
  | "payment"
  | "messaging"
  | "technical"
  | "other";

export type SupportTicketStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "closed";

export interface SupportTicket {
  id: string;
  user: string;
  subject: string;
  message: string;
  category: SupportTicketCategory;
  status: SupportTicketStatus;
  admin_note: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSupportTicketPayload {
  category: SupportTicketCategory;
  subject: string;
  message: string;
}
