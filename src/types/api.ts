export interface User {
  id: string;
  email: string;
  role: "student" | "tutor";
  tutor_profile_id: string | null;
  is_email_verified: boolean;
  is_admin: boolean;
  is_test_account: boolean;
  /** Backend-truth tutorial gate; always true for students. */
  jitsi_tutorial_completed: boolean;
  /** Pre-existing verified tutor auto-completed by migration (nudge target). */
  jitsi_tutorial_grandfathered: boolean;
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

export interface AdminTutorVerification {
  id: string;
  tutor_id: string;
  tutor_name: string;
  account_email: string;
  university_email: string;
  university: string;
  department: string;
  declared_yks_rank: number;
  status: "pending" | "approved" | "rejected";
  security_status: "not_scanned" | "safe" | "qa_bypass" | "legacy_reviewed";
  security_report: Record<string, unknown>;
  submitted_at: string;
  reviewed_at: string | null;
  rejection_reason_code: string;
  rejection_reason: string;
  documents_deleted_at: string | null;
  preview_available: { student_id: boolean; yks_result: boolean };
}

export interface AdminTutorVerificationList {
  results: AdminTutorVerification[];
  rejection_reasons: Array<{ value: string; label: string }>;
}

export interface AdminCoachingQaScenario {
  id: string;
  status: "active" | "completed" | "cancelled";
  tutor: AdminTestAccount;
  student: AdminTestAccount;
  phase: string;
  next_role: "tutor" | "student";
  next_path: string;
  payment_mode: "none";
  can_activate_no_charge: boolean;
  checklist: {
    onboarding_completed: boolean;
    plan_published: boolean;
    purchase_created: boolean;
    tutor_accepted: boolean;
    schedule_created: boolean;
    program_created: boolean;
    report_published: boolean;
    dispute_created: boolean;
  };
  purchase: {
    id: string;
    service_status: string;
    financial_status: string;
  } | null;
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
  coaching_qa_scenarios: AdminCoachingQaScenario[];
  server_time: string;
}

export interface AuthResponse {
  token?: string;
  user: User;
  auth_mode?: "disabled" | "dual" | "enforced";
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
  notice_code: string;
  notice_version: string;
  notice_acknowledged: true;
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

export type StudentGoalStatus = "draft" | "proposed" | "active" | "completed" | "paused" | "archived";

export type StudentMilestoneStatus =
  | "not_started"
  | "planned"
  | "in_progress"
  | "needs_review"
  | "ready_for_confirmation"
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

export type LessonCoverageStage = "introduced" | "practised" | "assessed";
export type LessonUnderstanding =
  | "understood"
  | "partly_understood"
  | "needs_review"
  | "not_assessed";
export type LessonSupportLevel =
  | "independent"
  | "prompted"
  | "fully_guided"
  | "not_applicable";
export type LessonNextAction = "revisit" | "practise" | "advance" | "reassess" | "none";

export interface LessonTopicCheckInPayload {
  topic: string;
  goal?: string | null;
  milestone?: string | null;
  next_topic?: string | null;
  curriculum_version: string;
  subtopic?: string;
  coverage_stage: LessonCoverageStage;
  understanding: LessonUnderstanding;
  support_level: LessonSupportLevel;
  next_action: LessonNextAction;
}

export interface LessonTopicCheckIn extends LessonTopicCheckInPayload {
  id: string;
  booking: string;
  student: string;
  tutor: string;
  subject: string;
  topic_title: string;
  next_topic_title: string | null;
  evidence_source: "tutor_observed";
  revision_count: number;
  rendered_note: string;
  created_at: string;
  updated_at: string;
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
  outcome: string;
  subtopic: string;
  description: string;
  is_required: boolean;
  expected_lessons_min: number | null;
  expected_lessons_max: number | null;
  completion_rule: string;
  next_action: string;
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
  responsible_tutor: string | null;
  title: string;
  outcome: string;
  description: string;
  exam_type: string;
  subject_name: string;
  curriculum_version: string;
  estimated_lessons_min: number | null;
  estimated_lessons_max: number | null;
  proposal_message: string;
  status: StudentGoalStatus;
  target_date: string | null;
  milestones: StudentMilestone[];
  progress: number;
  revision: number;
  proposed_at: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TutorPlanMilestoneInput {
  topic: string;
  title: string;
  outcome: string;
  subtopic?: string;
  description?: string;
  is_required: boolean;
  expected_lessons_min?: number | null;
  expected_lessons_max?: number | null;
  completion_rule: "tutor_observation";
  next_action?: string;
  order: number;
}

export interface TutorLearningPlanInput {
  student: string;
  title: string;
  outcome: string;
  description?: string;
  exam_type: string;
  subject_name: string;
  curriculum_version: string;
  estimated_lessons_min?: number | null;
  estimated_lessons_max?: number | null;
  proposal_message?: string;
  target_date?: string | null;
  milestones: TutorPlanMilestoneInput[];
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
  token?: string;
  user: User;
  auth_mode?: "disabled" | "dual" | "enforced";
}

export interface GoogleAuthNeedsRole {
  needs_role: true;
  email: string;
}

export type GoogleAuthResponse = GoogleAuthSuccess | GoogleAuthNeedsRole;

/**
 * Public coaching plan facts shown on a tutor's profile.
 *
 * Tutor-global and public — it says what is on offer, never whether the
 * current student may buy it. That verdict comes only from
 * `fetchCoachingEligibility()`.
 */
export interface TutorCoachingSummary {
  frequency: "biweekly" | "weekly" | "twice_weekly";
  session_duration_minutes: number;
  price_per_session_minor: number;
  price_per_session_display: string;
  is_free: boolean;
  target_exam_types: string[];
  description: string;
  /** The tutor's own switch, not live capacity. */
  is_accepting_new_students: boolean;
}

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
  has_taken_lesson?: boolean | null;
  is_verified: boolean;
  is_public: boolean;
  teaching_styles: TutorTeachingStyle[];
  teaching_attributes?: TutorTeachingAttribute[];
  accepting_new_students?: boolean;
  open_student_slots?: number;
  earliest_start_date?: string | null;
  availability_confirmed_at?: string | null;
  availability_pause_until?: string | null;
  accepts_trial_lessons?: boolean;
  is_bookable?: boolean;
  availability_is_stale?: boolean;
  is_new_tutor?: boolean;
  launch_program_available?: boolean;
  /** Tutor-global: has a PUBLISHED coaching plan. */
  offers_coaching?: boolean;
  /** Tutor-global: published coaching plan priced at 0. */
  offers_free_coaching?: boolean;
  /** The tutor's manual "accepting new students" toggle — NOT live
   *  capacity. Real eligibility comes only from /coaching/eligibility/. */
  coaching_intake_open?: boolean;
  /** Public plan summary. Detail endpoint only — the cached list never
   *  carries it, so this is undefined on tutors that came from a list. */
  coaching?: TutorCoachingSummary | null;
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

export interface TutorLaunchProgram {
  enabled: boolean;
  paused: boolean;
  lesson_limit: number;
  completed_lessons: number;
  remaining_lessons: number;
  compensation_mode: "voluntary_zero" | "platform_funded";
  terms_version: number;
  terms_accepted_at: string | null;
  can_offer: boolean;
  updated_at: string;
}

export interface TutorTeachingAttribute {
  code: string;
  name: string;
  description: string;
  evidence_status: "self_declared";
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
  /** Tutor-global: has a PUBLISHED coaching plan. */
  offers_coaching?: boolean;
  /** Tutor-global: published coaching plan priced at 0. */
  offers_free_coaching?: boolean;
  /** The tutor's manual "accepting new students" toggle — NOT live
   *  capacity. Real eligibility comes only from /coaching/eligibility/. */
  coaching_intake_open?: boolean;
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
  discovery_impression_id?: string | null;
  unavailable_match?: TutorMatchResult | null;
}

export type RecommendationControlReason =
  | "price" | "schedule" | "teaching_style" | "exam_experience"
  | "not_relevant" | "do_not_show";

export interface TutorRecommendationControl {
  id: string;
  tutor: string;
  tutor_summary: { id: string; name: string; surname: string };
  reason: RecommendationControlReason;
  hidden: boolean;
  created_at: string;
  updated_at: string;
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
  early_end_request_status?: EarlyEndRequestStatus;
  early_end_request_version?: number;
  early_end_request_resolved_at?: string | null;
  early_end_retry_available_at?: string | null;
  is_trial?: boolean;
  lesson_request: string | null;
  room_url?: string;
  package_purchase?: string | null;
  package_credit_units_used?: number;
  created_at: string;
  learning_context?: LearningContext | null;
  topic_check_in_status?: {
    enabled: boolean;
    required: boolean;
    submitted: boolean;
  };
  conversation_id?: string | null;
}

export type EarlyEndRequestStatus =
  | "idle"
  | "pending"
  | "declined"
  | "cancelled"
  | "accepted";

/** Tutor-initiated early-end request, flattened, as returned by session-state. */
export interface EarlyEndRequestState {
  status: EarlyEndRequestStatus;
  version: number;
  requested_at: string | null;
  resolved_at: string | null;
  retry_available_at: string | null;
}

/** Compact, server-synced live-session state (GET /bookings/{id}/session-state/). */
export interface LessonSessionState {
  booking_id: string;
  status: Booking["status"];
  start_time: string;
  scheduled_end: string;
  server_time: string;
  early_end_request: EarlyEndRequestState;
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
  /** Whether the student may see the correct choice (not the detailed solution). */
  answer_revealed_to_student: boolean;
  /** @deprecated Backend alias that mirrors `answer_revealed_to_student`. */
  solution_revealed: boolean;
  /** Correct choice — only populated for the student once revealed. */
  correct_choice: string;
  /** Last answer the student consciously submitted for the active question. */
  student_answer: string;
  student_answer_at: string | null;
  version: number;
  updated_at: string | null;
  // Teacher-only fields — present exclusively in the tutor's payload, absent
  // from the student's response entirely (see backend role-based serializer).
  teacher_correct_choice?: string;
  teacher_answer?: string;
  teacher_explanation?: string;
  teacher_solution_url?: string;
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
  answer_revealed_to_student?: boolean;
  /** @deprecated Alias of `answer_revealed_to_student`. */
  solution_revealed?: boolean;
}

export interface LessonQuestionAnswerInput {
  selected_choice: string;
  question_id: string;
  version: number;
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
  latest_message?: {
    preview: string;
    created_at: string;
    sender_id: string;
    kind: "text" | "image" | "file" | "voice" | "deleted";
  } | null;
  tutor_profile?: TutorProfile | null;
  is_blocked: boolean;
  coaching_purchase_id?: string | null;
  response_sla?: CoachingResponseSla | null;
}

export interface CoachingResponseSla {
  id: string;
  status: "calendar_pending" | "pending" | "breached" | "satisfied";
  first_unanswered_at: string;
  due_at: string | null;
  breached_at: string | null;
  satisfied_at: string | null;
}

export interface MessageAttachment {
  id: string;
  /** "voice" is read-only history: voice messaging can no longer be created. */
  kind: "image" | "file" | "voice";
  original_name: string;
  mime_type: string;
  size_bytes: number;
  voice_duration_ms?: number | null;
  storage_state: "pending" | "active" | "delete_pending";
  download_url: string;
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
  attachment?: MessageAttachment | null;
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

/** One catalog plan from the requesting tutor's own point of view — GET/PATCH
 * /api/payments/tutor/package-offers/. Storage is sparse server-side (a row
 * only exists once a tutor customizes a plan), but every active plan is
 * always represented here, at its default state if uncustomized. */
export interface TutorPackageOffer {
  plan_id: string;
  plan_name: string;
  plan_code: string | null;
  lesson_count: number;
  lesson_duration_minutes: number;
  lessons_per_week: number;
  duration_days: number;
  catalog_discount_percent: number;
  is_offered: boolean;
  /** null = no override, falling back to catalog_discount_percent. */
  discount_percent: number | null;
  effective_discount_percent: number;
  max_discount_percent: number;
}

export interface UpdateTutorPackageOfferPayload {
  plan_id: string;
  is_offered: boolean;
  discount_percent: number | null;
}

export interface CreatePackagePurchasePayload {
  tutor: string;
  plan: string;
  promotion_code?: string;
}

export interface PromoPreviewRequest {
  tutor: string;
  plan: string;
  promotion_code: string;
}

export interface PromoPreviewResponse {
  promotion_code: string;
  total_credits: number;
  unit_price: number;
  subtotal_price: number;
  discount_amount: number;
  promo_discount_amount: number;
  total_price: number;
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
  relaxations?: TutorSearchRelaxation[];
}

export interface TutorSearchRelaxation {
  filter: string;
  count: number;
}

export interface TutorSavedSearch {
  id: string;
  name: string;
  filters: Record<string, string | string[]>;
  ordering: string;
  created_at: string;
  updated_at: string;
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
  university_email: string;
  status: "pending" | "approved" | "rejected";
  security_status: "not_scanned" | "safe" | "qa_bypass" | "legacy_reviewed";
  submitted_at: string;
  reviewed_at: string | null;
  documents_deleted_at: string | null;
  rejection_reason?: string;
}

export interface UniversityEmailVerification {
  status: "not_started" | "code_sent" | "verified" | "review_required" | "under_review";
  email: string | null;
  verified_at?: string | null;
  audience?: "student" | "institutional";
  detail?: string;
  reason?: string;
  submitted_at?: string;
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
  notify_coaching_updates: boolean;
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

// --- Çalışma Programım (apps/schedule) -------------------------------------
// Every calendar event carries an Istanbul wall clock as `local_date` +
// `local_time` strings. Never parse them with `new Date(iso)` — the backend
// deliberately does not send an instant, because its three sources store time
// three different ways (see apps/schedule/timezones.py).

export type ScheduleEventSource = "booking" | "coaching" | "study_block";

export type StudyBlockType =
  | "konu_anlatim"
  | "soru_cozumu"
  | "deneme"
  | "custom";

export type StudyBlockRecurrence = "none" | "weekly";

export interface ScheduleEvent {
  source: ScheduleEventSource;
  id: string;
  /** YYYY-MM-DD, Istanbul local. */
  local_date: string;
  /** HH:MM, Istanbul local. */
  local_time: string;
  duration_minutes: number;
  status: string;
  subject: Subject | null;
  title: string;
  block_type: StudyBlockType | null;
  completed: boolean | null;
  /** False for lessons and coaching: the student may not edit those. */
  editable: boolean;
  room_url: string;
  /** Only set for study blocks — the date of this occurrence in the series. */
  occurrence_date: string | null;
  /** Study blocks only: decides which delete choices apply. */
  recurrence: StudyBlockRecurrence | null;
  /** Study blocks only: the student's own note, before display composition. */
  block_title: string | null;
}

export interface ScheduleCalendarResponse {
  from: string;
  to: string;
  events: ScheduleEvent[];
}

export interface WeeklyCompletion {
  completed: number;
  total: number;
  percentage: number;
}

export interface ScheduleSubjectStat {
  subject: string;
  completed_lesson_minutes: number;
  completed_study_minutes: number;
  total_minutes: number;
}

export interface ScheduleProgressResponse {
  week_start: string;
  week_end: string;
  weekly_completion: WeeklyCompletion;
  /** All-time totals — the week parameter does not scope these. */
  subject_stats: ScheduleSubjectStat[];
}

export interface StudyBlock {
  id: string;
  subject: string | null;
  block_type: StudyBlockType;
  title: string;
  start_date: string;
  start_time: string;
  duration_minutes: number;
  recurrence: StudyBlockRecurrence;
  recurrence_end_date: string | null;
}

export interface StudyBlockPayload {
  subject?: string | null;
  block_type: StudyBlockType;
  title?: string;
  start_date: string;
  start_time: string;
  duration_minutes: number;
  recurrence: StudyBlockRecurrence;
}
