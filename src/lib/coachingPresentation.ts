import type {
  AcceptanceRequest,
  CoachingCapacityDetail,
  CoachingPlan,
  CoachingSessionItem,
  CoachingStudentRow,
} from "./coachingApi";

export const COACHING_EXAM_GROUPS = ["YKS", "DGS", "KPSS"] as const;
export type CoachingExamGroup = (typeof COACHING_EXAM_GROUPS)[number];

export function isCoachingExamGroup(value: string): value is CoachingExamGroup {
  return COACHING_EXAM_GROUPS.includes(value as CoachingExamGroup);
}

export function partitionAcceptanceRequests(requests: AcceptanceRequest[]) {
  return {
    coaching: requests.filter((request) => request.includes_coaching),
    lessonOnly: requests.filter((request) => !request.includes_coaching),
  };
}

const UPCOMING_SESSION_STATUSES = new Set(["scheduled", "reschedule_requested", "in_progress"]);

export function deriveCoachingMetrics(input: {
  students: CoachingStudentRow[];
  sessions: CoachingSessionItem[];
  requests: AcceptanceRequest[];
}) {
  return {
    activeStudents: input.students.filter((row) => row.service_status === "active").length,
    upcomingSessions: input.sessions.filter((row) => UPCOMING_SESSION_STATUSES.has(row.status)).length,
    pendingReports: input.sessions.filter((row) => row.status === "awaiting_report").length,
    pendingRequests: input.requests.filter(
      (row) => row.includes_coaching && row.status === "pending"
    ).length,
  };
}

export type CoachingPublicationState = "missing" | "draft" | "published";
export type CoachingIntakeState = "not_applicable" | "open" | "closed";
export type CoachingCapacityState = "unknown" | "missing_availability" | "available" | "full";
export type CoachingPlatformCheckoutState = "enabled" | "platform_paused";
export type CoachingReadinessState =
  | "onboarding"
  | "plan"
  | "availability"
  | "capacity"
  | "publish"
  | "complete";

export interface CoachingNextAction {
  label: string;
  href: string;
}

export interface CoachingDerivedStatus {
  publication: CoachingPublicationState;
  intake: CoachingIntakeState;
  capacity: CoachingCapacityState;
  platformCheckout: CoachingPlatformCheckoutState;
  readiness: CoachingReadinessState;
  platformMessage: string | null;
  nextAction: CoachingNextAction | null;
}

export function deriveCoachingStatus(input: {
  onboardingComplete: boolean;
  plan: CoachingPlan | null;
  capacity: CoachingCapacityDetail | null;
  checkoutEnabled: boolean;
}): CoachingDerivedStatus {
  const publication: CoachingPublicationState = !input.plan
    ? "missing"
    : input.plan.is_published
      ? "published"
      : "draft";
  const intake: CoachingIntakeState = input.plan?.is_published
    ? input.plan.is_accepting_new_students
      ? "open"
      : "closed"
    : "not_applicable";
  const capacity: CoachingCapacityState = !input.capacity
    ? "unknown"
    : input.capacity.weekly_slot_count < 1
      ? "missing_availability"
      : input.capacity.can_accept_new_student
        ? "available"
        : "full";
  const platformCheckout: CoachingPlatformCheckoutState = input.checkoutEnabled
    ? "enabled"
    : "platform_paused";

  let readiness: CoachingReadinessState = "complete";
  let nextAction: CoachingNextAction | null = null;
  if (!input.onboardingComplete) {
    readiness = "onboarding";
    nextAction = { label: "Tanıtıma devam et", href: "/dashboard/tutor/coaching/onboarding" };
  } else if (!input.plan) {
    readiness = "plan";
    nextAction = { label: "Teklifini oluştur", href: "/dashboard/tutor/coaching/plan?step=frequency" };
  } else if (!input.capacity || input.capacity.weekly_slot_count < 1) {
    readiness = "availability";
    nextAction = { label: "Koçluk saatlerini ekle", href: "/dashboard/tutor/coaching/plan?step=availability" };
  } else if (input.capacity.theoretical_capacity < input.plan.max_active_students) {
    readiness = "capacity";
    nextAction = { label: "Kapasiteyi düzenle", href: "/dashboard/tutor/coaching/plan?step=capacity" };
  } else if (!input.plan.is_published) {
    readiness = "publish";
    nextAction = { label: "Teklifini gözden geçir", href: "/dashboard/tutor/coaching/plan?step=publish" };
  }

  return {
    publication,
    intake,
    capacity,
    platformCheckout,
    readiness,
    platformMessage:
      publication === "published" && platformCheckout === "platform_paused"
        ? "Teklifin yayında. Yeni koçluk satışları platform genelinde şu anda kapalı."
        : null,
    nextAction,
  };
}
