export interface User {
  id: string;
  email: string;
  role: "student" | "tutor";
  tutor_profile_id: string | null;
  is_email_verified: boolean;
  is_admin: boolean;
  is_test_account: boolean;
  impersonation: {
    actor_id: string;
    actor_email: string;
    target_id: string;
    target_email: string;
  } | null;
}

export interface AdminTestAccount {
  id: string;
  email: string;
  role: "student" | "tutor";
  is_active: boolean;
  is_test_account: boolean;
  last_seen_at: string | null;
  profile: {
    id: string;
    name: string;
    surname: string;
    is_verified?: boolean;
    is_public?: boolean;
    auto_approve_bookings?: boolean;
    subjects?: { id: string; name: string }[];
  } | null;
}

export interface AdminMonitoredBooking {
  id: string;
  student: AdminTestAccount;
  tutor: AdminTestAccount;
  subject: { id: string; name: string };
  start_time: string;
  duration_minutes: number;
  status: string;
  room_url: string;
  uses_test_credit: boolean;
  package_purchase_id: string | null;
}

export interface AdminMonitoredPackage {
  id: string;
  student: AdminTestAccount;
  tutor: AdminTestAccount;
  plan: { id: string; name: string; lesson_duration_minutes: number };
  status: PackagePurchaseStatus;
  total_credits: number;
  remaining_credits: number;
  total_price: number;
  created_at: string;
  paid_at: string | null;
}

export interface AdminTestCreditGrant {
  id: string;
  student_id: string;
  student_email: string;
  tutor_id: string;
  tutor_email: string;
  total_credits: number;
  remaining_credits: number;
  expires_at: string;
}

export interface AdminAction {
  id: string;
  action: string;
  actor_email: string;
  target_email: string | null;
  booking_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AdminMonitorResponse {
  accounts: AdminTestAccount[];
  bookings: AdminMonitoredBooking[];
  package_purchases: AdminMonitoredPackage[];
  package_plans: Array<{
    id: string;
    name: string;
    lesson_count: number;
    lesson_duration_minutes: number;
  }>;
  manual_package_activation_enabled: boolean;
  test_credit_grants: AdminTestCreditGrant[];
  actions: AdminAction[];
  server_time: string;
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

export type ExamType = "TYT" | "AYT" | "YDT" | "DGS" | "KPSS";

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
  is_public: boolean;
  teaching_styles: TutorTeachingStyle[];
  is_online: boolean;
  last_seen_at?: string | null;
  trial_lesson_eligible?: boolean | null;
  trial_lessons_remaining?: number | null;
  subjects: Subject[];
  created_at: string;
  /** Only present on GET/PATCH /api/tutors/me/ — never the public list/detail response. */
  no_show_count?: number;
  /** Present only on GET/PATCH /api/tutors/me/. */
  intro_video_status?: "none" | "pending" | "approved" | "rejected";
  intro_video_rejection_reason?: string;
  /** A verified tutor's credential/video edits awaiting review. Private to that tutor. */
  pending_profile_change?: {
    university: string | null;
    department: string | null;
    yks_rank: number | null;
    intro_video_url: string | null;
    status: "pending";
    rejection_reason: string;
    submitted_at: string;
  } | null;
}

export type MatchGoal = "YKS" | "DGS" | "KPSS" | "UNDECIDED";
export type MatchChallenge =
  | "foundations"
  | "question_solving"
  | "speed_accuracy"
  | "consistency"
  | "where_to_start"
  | "advanced_questions";
export type TutorTeachingStyle =
  | "foundations_patient"
  | "question_speed"
  | "planning_accountability"
  | "motivating_communication"
  | "high_target";
export type MatchAvailabilityWindow =
  | "weekday_day"
  | "weekday_evening"
  | "weekend_day"
  | "weekend_evening"
  | "flexible";
export type MatchBudgetSegment = "economical" | "balanced" | "premium" | "flexible";

export interface MatchingAnswers {
  goal: MatchGoal;
  stage: string;
  subject_keys: string[];
  challenges: MatchChallenge[];
  teaching_styles: TutorTeachingStyle[];
  availability_windows: MatchAvailabilityWindow[];
  budget_segment: MatchBudgetSegment;
  schema_version: 1;
}

export interface MatchOption {
  value: string;
  label: string;
}

export interface MatchSubjectOption {
  key: string;
  label: string;
  subject_ids: string[];
  exam_types: string[];
  tutor_count: number;
}

export interface MatchBudgetRange {
  id: MatchBudgetSegment;
  label: string;
  min: number | null;
  max: number | null;
}

export interface MatchingOptions {
  goals: Array<{ value: MatchGoal; label: string }>;
  stages: Record<MatchGoal, MatchOption[]>;
  subjects: MatchSubjectOption[];
  budget_ranges: MatchBudgetRange[];
}

export interface TutorMatchResult {
  tutor: Pick<
    TutorProfile,
    | "id"
    | "name"
    | "surname"
    | "profile_picture"
    | "university"
    | "department"
    | "hourly_price"
    | "rating"
    | "total_reviews"
    | "completed_lessons_count"
    | "is_verified"
    | "subjects"
  >;
  score: number;
  match_level: "strong" | "budget_relaxed" | "schedule_relaxed";
  reason_codes: Array<
    "subject_match" | "availability_match" | "teaching_style_match" | "budget_match"
  >;
  caveat_codes: Array<"budget_relaxed" | "schedule_relaxed">;
  matched_subjects: string[];
  matched_styles: TutorTeachingStyle[];
  nearest_available_at: string | null;
}

export interface MatchingPreview {
  matches: TutorMatchResult[];
  candidate_count: number;
}

export interface SavedMatchingPreference extends MatchingAnswers {
  updated_at: string;
}

export interface LessonRequest {
  id: string;
  student: { id: string; email: string; display_name?: string; avatar_url?: string | null };
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
  student: { id: string; email: string; display_name?: string; avatar_url?: string | null };
  tutor: { id: string; name: string; surname: string; profile_picture?: string };
  subject: Subject;
  start_time: string;
  duration_minutes: number;
  price: number;
  status:
    | "pending"
    | "confirmed"
    | "in_progress"
    | "awaiting_confirmation"
    | "completed"
    | "disputed"
    | "cancelled"
    | "expired";
  completed_at?: string | null;
  completion_source?: "" | "student" | "tutor" | "auto" | "admin";
  awaiting_confirmation_at?: string | null;
  dispute_category?: "" | "tutor_no_show" | "technical_issue" | "interrupted" | "conduct" | "other";
  dispute_description?: string;
  disputed_at?: string | null;
  student_end_requested_at?: string | null;
  tutor_end_requested_at?: string | null;
  is_trial?: boolean;
  lesson_request: string | null;
  room_url?: string;
  package_purchase?: string | null;
  package_credit_units_used?: number;
  created_at: string;
  learning_context?: LearningContext | null;
  conversation_id?: string | null;
}

export type LessonArtifactKind = "whiteboard" | "solved_question" | "material";

export interface LessonArtifact {
  id: string;
  booking: string;
  kind: LessonArtifactKind;
  title: string;
  description: string;
  file_url: string;
  external_url: string;
  created_by: string | null;
  created_at: string;
}

export interface SolvableQuestion {
  id: string;
  exam_type: "TYT" | "AYT" | "YDT";
  exam_year: number;
  subject: Subject | null;
  topic: {
    id: string;
    title: string;
    exam_type: string;
    subject_name: string;
  } | null;
  source_book: string;
  original_question_number: string;
  prompt: string;
  choices: Array<{ key: string; text?: string; image_url?: string }>;
  question_image_url: string;
  difficulty: "easy" | "medium" | "hard";
  attribution: string;
  source_url: string;
}

export interface QuestionAttemptResult {
  attempt_id: string;
  selected_choice: string;
  is_correct: boolean | null;
  correct_choice: string;
  answer: string;
  solution_url: string;
  needs_review: boolean;
}

export interface QuestionMetadata {
  enabled: boolean;
  mebi_enabled: boolean;
  exam_types: Array<"TYT" | "AYT" | "YDT">;
  years: number[];
  difficulties: Array<{ value: "easy" | "medium" | "hard"; label: string }>;
  subjects: Subject[];
  topics: Array<{
    id: string;
    title: string;
    exam_type: string;
    subject_name: string;
  }>;
}

export interface LessonQuestionState {
  active_question: SolvableQuestion | null;
  solution_revealed: boolean;
  correct_choice: string;
  solution_url: string;
  version: number;
  updated_at: string | null;
}

export interface QuestionFilters {
  exam_type?: string;
  year?: string;
  subject?: string;
  topic?: string;
  difficulty?: string;
  page?: number;
  page_size?: number;
}

export interface LessonQuestionStateUpdate {
  question_id?: string | null;
  solution_revealed?: boolean;
}

export interface BookingQuestion {
  id: string;
  booking: string;
  question: SolvableQuestion;
  order: number;
  created_at: string;
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
  is_blocked: boolean;
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
  /** Computed average of the four criteria (e.g. 4.75); display with formatRating. */
  rating: number;
  clarity_rating: number;
  preparation_rating: number;
  progress_rating: number;
  confidence_rating: number;
  comment: string;
  created_at: string;
  subject?: Subject;
}

export type CriteriaRatingKey =
  | "clarity"
  | "preparation"
  | "progress"
  | "confidence";

export interface CriteriaRatingSummary {
  label: string;
  average: number;
  count: number;
}

export interface SubjectRatingSummary {
  subject: Subject;
  average: number;
  count: number;
  /** Share of this tutor's reviews that belong to this subject (0-100, 1 decimal). */
  percentage_of_reviews: number;
}

// GET /api/tutors/{id}/review-summary/
export interface TutorReviewSummary {
  overall_rating: number;
  review_count: number;
  criteria_ratings: Record<CriteriaRatingKey, CriteriaRatingSummary>;
  subject_ratings: SubjectRatingSummary[];
}

// GET /api/payments/package-plans/ — ledger-first package foundation (no
// real payment provider yet; see apps.payments on the backend).
export interface PackagePlan {
  id: string;
  name: string;
  /** Stable machine key, e.g. "weekly_3_90d". Null for ad-hoc plans. */
  code: string | null;
  /** Total lesson credits, derived server-side from lessons_per_week ×
   * the plan's fixed week count (14g=2, 30g=4, 90g=12, 180g=24). */
  lesson_count: number;
  lesson_duration_minutes: number;
  /** Set on matrix plans; null only on retired legacy bundles that can
   * still surface through old purchase history. */
  lessons_per_week: number | null;
  /** Matrix plans only (apps.payments.models.PackagePlan.duration_days on
   * the backend) — null for retired legacy bundles. Used to compute a
   * purchase's term end date: paid_at + duration_days. */
  duration_days: number | null;
  discount_percent: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type PackagePurchaseStatus = "pending" | "paid" | "cancelled" | "refunded";

export interface PackagePurchase {
  id: string;
  student: { id: string; name: string; surname: string };
  tutor: {
    id: string;
    name: string;
    surname: string;
    profile_picture?: string;
    bio?: string;
    subjects?: Subject[];
  };
  plan: {
    id: string;
    name: string;
    code: string | null;
    lesson_count: number;
    lesson_duration_minutes: number;
    lessons_per_week: number | null;
    duration_days: number | null;
    discount_percent: number;
  };
  status: PackagePurchaseStatus;
  total_credits: number;
  remaining_credits: number;
  unit_price: number;
  subtotal_price: number;
  discount_amount: number;
  promo_discount_amount: number;
  total_price: number;
  created_at: string;
  paid_at: string | null;
  promotion_code: string | null;
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

export interface TutorEarningsPeriod {
  total: number;
  lesson_count: number;
}

export interface TutorEarningsSummary {
  last_7_days: TutorEarningsPeriod;
  last_30_days: TutorEarningsPeriod;
  lifetime: TutorEarningsPeriod;
}

export interface CreatePackagePurchasePayload {
  tutor: string;
  plan: string;
  promotion_code?: string;
}

export interface ReferralInfo {
  referral_code: string;
  referral_url: string;
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
  specific_date?: string | null;
  is_unavailable?: boolean;
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
  email_verification_enabled: boolean;
  last_seen_at: string | null;
  has_usable_password: boolean;
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
  specific_date?: string | null;
  is_unavailable?: boolean;
  start_time: string | null;
  end_time: string | null;
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

export interface LearningProfileSubject {
  id: string;
  name: string;
  exam_type: string;
  completed_lessons: number;
}

export interface MostStudiedTutor {
  id: string;
  name: string;
  surname: string;
  profile_picture: string;
  completed_lessons: number;
  last_lesson_at: string;
  primary_subject: LearningProfileSubject | null;
  is_bookable: boolean;
}

export interface StudentLearningProfileSummary {
  completed_lessons: number;
  active_packages: number;
  most_studied_tutor: MostStudiedTutor | null;
  top_subjects: LearningProfileSubject[];
}

export interface QuestionPerformanceSubject {
  id: string;
  name: string;
  exam_type: string;
  attempt_count: number;
  accuracy_percent: number;
}

export interface StudentQuestionPerformance {
  total_attempts: number;
  correct_attempts: number;
  incorrect_attempts: number;
  accuracy_percent: number | null;
  top_subject: QuestionPerformanceSubject | null;
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

export interface TutorStudentNote {
  id: string;
  student: string;
  student_summary: { id: string; name: string; surname: string };
  content: string;
  created_at: string;
  updated_at: string;
}

export interface TutorStudentMaterial {
  id: string;
  student: string;
  original_name: string;
  mime_type: string;
  file_extension: string;
  size_bytes: number;
  created_at: string;
}

export interface TutorStudentMaterialAccess {
  url: string;
  expires_at: string;
}

export interface TutorStudentMaterialDeleteResult {
  status: "deleted" | "delete_pending";
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
